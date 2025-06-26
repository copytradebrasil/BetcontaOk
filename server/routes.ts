import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { withDbRetry } from "./db";
import { adminStorage } from "./adminStorage";
import { authenticateAdmin, adminLogin, adminLogout, adminAuthStatus } from "./adminAuth";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import session from "express-session";
import { nanoid } from "nanoid";
import { 
  insertChildAccountSchema, 
  insertPixTransactionSchema,
  updateUserProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  registerSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads with specific settings
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB per file
      fieldSize: 2 * 1024 * 1024, // 2MB per field
      fields: 20, // Max 20 fields
      files: 10, // Max 10 files
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG and WebP images are allowed'));
      }
    }
  });

  // Session middleware - simple local auth
  app.use(session({
    secret: 'betconta-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Simple auth middleware
  const isLoggedIn = (req: any, res: any, next: any) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Validate required fields
      if (!validatedData.email) {
        return res.status(400).json({ message: "E-mail é obrigatório" });
      }

      // Check if user already exists
      if (validatedData.cpf) {
        const existingUser = await storage.getUserByCpf(validatedData.cpf);
        if (existingUser) {
          return res.status(400).json({ message: "CPF já cadastrado" });
        }
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "E-mail já cadastrado" });
      }

      // Check if CPF already exists
      if (validatedData.cpf) {
        const existingCpf = await storage.getUserByCpf(validatedData.cpf);
        if (existingCpf) {
          return res.status(400).json({ message: "CPF já cadastrado" });
        }
      }

      // Create replitId from email
      const replitId = validatedData.email.replace('@', '_').replace(/\./g, '_');
      
      // Create new user in database
      const newUser = await storage.upsertUser({
        replitId: replitId,
        email: validatedData.email,
        firstName: validatedData.firstName || "",
        lastName: validatedData.lastName || "",
        cpf: validatedData.cpf || null,
        phone: validatedData.phone || null,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        cep: validatedData.cep || null,
        street: validatedData.street || null,
        number: validatedData.number || null,
        neighborhood: validatedData.neighborhood || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        complement: validatedData.complement || null,
        balance: "0.00",
        kycStatus: "pending",
        isActive: true,
        affiliateStatus: "none",
      });

      // Generate account details using numeric user ID
      const accountNumber = await storage.generateAccountNumber(newUser.id);
      const pixKey = await storage.generatePixKey(newUser.id);
      
      // Update user with generated details
      const updatedUser = await storage.updateUserProfile(newUser.id, {
        accountNumber,
        pixKey,
      });

      // Automatically log in the user after registration
      (req as any).session.userId = updatedUser.replitId;

      res.json({ 
        message: "Conta criada com sucesso!",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  // Temporary in-memory caches to avoid database rate limits during development
  const userCache = new Map<string, any>();
  const childAccountsCache = new Map<string, any[]>();
  const transactionsCache = new Map<string, any[]>();

  // Login endpoint with fallback to cache
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const sessionKey = email.replace('@', '_').replace('.', '_');
      
      // Try cache first
      let user = userCache.get(sessionKey);
      
      if (!user) {
        try {
          // Always try to get or create user in database
          user = await withDbRetry(async () => {
            // First try to find existing user by email
            let existingUser = await storage.getUserByEmail(email);
            
            if (existingUser) {
              // Check if user account is active
              if (existingUser.isActive === false) {
                throw new Error("ACCOUNT_BLOCKED");
              }
              return existingUser;
            }
            
            // If not found, create new user in database
            return await storage.upsertUser({
              email: email,
              firstName: email.split('@')[0],
              lastName: "",
              profileImageUrl: null
            });
          }, 2);
          
          // Cache the user with session key
          if (user) {
            userCache.set(sessionKey, user);
            console.log("User persisted in database with ID:", user.id);
          }
        } catch (dbError: any) {
          if (dbError.message === "ACCOUNT_BLOCKED") {
            return res.status(403).json({ 
              message: "Sua conta está bloqueada ou em manutenção. Entre em contato com o suporte.",
              blocked: true
            });
          }
          console.error('Database completely unavailable for login:', dbError);
          return res.status(500).json({ message: "Sistema temporariamente indisponível. Tente novamente em alguns minutos." });
        }
      }

      // Set session with actual user ID for database operations
      (req as any).session.userId = user.id;
      (req as any).session.sessionKey = sessionKey; // Keep for cache compatibility
      res.json(user);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro no login" });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro no logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Get current user with cache fallback
  app.get('/api/auth/user', isLoggedIn, async (req: any, res) => {
    try {
      const sessionUserId = req.session.userId;
      const sessionKey = req.session.sessionKey || sessionUserId;
      
      // Get user from cache (session-based) - use sessionKey for cache lookup
      let user = userCache.get(sessionKey);
      
      if (!user) {
        console.log('Database unavailable for user fetch, using cached fallback');
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Check if user account is still active
      if (user.isActive === false) {
        return res.status(403).json({ 
          message: "Sua conta está bloqueada ou em manutenção. Entre em contato com o suporte.",
          blocked: true
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  // User profile routes
  app.put('/api/user/profile', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const validatedData = updateUserProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserProfile(userId, validatedData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  app.post('/api/user/change-password', isLoggedIn, async (req: any, res) => {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      // TODO: Implement password change logic with proper validation
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Error changing password:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  app.post('/api/user/forgot-password', async (req, res) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      // TODO: Implement password reset logic
      res.json({ message: "E-mail de recuperação enviado" });
    } catch (error) {
      console.error("Error in forgot password:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "E-mail inválido", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  // Child accounts routes
  app.get('/api/child-accounts', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId; // Now this is the numeric user ID
      const sessionKey = req.session.sessionKey || userId;
      
      // Get actual user from cache for validation
      let user = userCache.get(sessionKey);
      if (!user) {
        return res.json([]);
      }
      
      // Always fetch fresh data to ensure we see new accounts
      let childAccounts;
      try {
        const dbPromise = withDbRetry(async () => {
          const accounts = await storage.getChildAccounts(userId);
          
          // Enrich with PIX status for each account based on pix_keys table
          const enrichedAccounts = await Promise.all(
            accounts.map(async (account) => {
              console.log(`Checking PIX for account ${account.id}:`);
              const pixKeys = await storage.getPixKeysByChild(account.id);
              const activePixKey = pixKeys.find(pk => pk.isActive === true);
              
              console.log(`Account ${account.id} has active PIX:`, !!activePixKey, activePixKey);
              
              return {
                ...account,
                hasActivePix: !!activePixKey,
                activePixKey: activePixKey?.pixKey || null,
                activePixKeyType: activePixKey?.pixKeyType || null,
              };
            })
          );
          
          return enrichedAccounts;
        }, 1);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 2000)
        );
        
        childAccounts = await Promise.race([dbPromise, timeoutPromise]) as any[];
        
        if (childAccounts) {
          childAccountsCache.set(sessionKey, childAccounts);
          console.log(`Fetched ${childAccounts.length} child accounts for user ${userId}`);
        }
      } catch (dbError) {
        console.log('Database unavailable for child accounts, checking cache');
        childAccounts = childAccountsCache.get(sessionKey) || [];
      }
      
      res.json(childAccounts || []);
    } catch (error) {
      console.error("Error fetching child accounts:", error);
      res.status(500).json({ message: "Erro ao buscar contas filhas" });
    }
  });

  // Test endpoint for FormData debugging
  app.post('/api/test-formdata', isLoggedIn, upload.any(), (req: any, res) => {
    console.log("=== TEST FORMDATA ENDPOINT ===");
    console.log("Headers:", req.headers);
    console.log("Body keys:", Object.keys(req.body || {}));
    console.log("Body:", req.body);
    console.log("Files:", req.files);
    res.json({ 
      bodyKeys: Object.keys(req.body || {}),
      body: req.body,
      filesCount: req.files ? req.files.length : 0
    });
  });

  // New endpoint to create child account with JSON data only
  app.post('/api/child-accounts-data', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId; // Now this is the numeric user ID
      const sessionKey = req.session.sessionKey || userId;
      
      // Get actual user from cache for validation
      let user = userCache.get(sessionKey);
      if (!user) {
        return res.status(400).json({ message: 'Usuário não encontrado na sessão' });
      }
      
      console.log("=== CREATING CHILD ACCOUNT WITH JSON DATA ===");
      console.log("Request body:", req.body);
      
      // Validate required fields
      const requiredFields = ['name', 'cpf', 'whatsapp', 'email', 'dateOfBirth', 'rgNumber', 'rgExpeditionDate', 'rgExpeditionOrgan', 'rgExpeditionUf', 'motherName', 'cep', 'street', 'number', 'neighborhood', 'city', 'state'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        return res.status(400).json({ 
          message: `Campos obrigatórios faltando: ${missingFields.join(', ')}` 
        });
      }
      
      // Extract form data with safe date parsing
      const parseDateSafely = (dateString: string) => {
        if (!dateString) throw new Error("Data obrigatória não fornecida");
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) throw new Error("Data inválida");
          return date;
        } catch (error) {
          console.error("Date parsing error:", error);
          throw new Error("Formato de data inválido");
        }
      };

      // Generate masked CPF for display (XXX.XXX.XXX-XX)
      const maskCpf = (cpf: string) => {
        const cleaned = cpf.replace(/\D/g, '');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, 'XXX.XXX.XXX-$4');
      };

      const childAccountData = {
        parentUserId: userId,
        name: req.body.name,
        cpf: req.body.cpf,
        cpfMask: maskCpf(req.body.cpf),
        whatsapp: req.body.whatsapp,
        email: req.body.email,
        dateOfBirth: parseDateSafely(req.body.dateOfBirth)!,
        rgNumber: req.body.rgNumber,
        rgExpeditionDate: parseDateSafely(req.body.rgExpeditionDate)!,
        rgExpeditionOrgan: req.body.rgExpeditionOrgan,
        rgExpeditionUf: req.body.rgExpeditionUf,
        motherName: req.body.motherName,
        cep: req.body.cep,
        street: req.body.street,
        number: req.body.number,
        neighborhood: req.body.neighborhood,
        city: req.body.city,
        state: req.body.state,
        status: "active",
        balance: "0.00",
        pixKey: null,
      };

      console.log("Creating child account with data:", childAccountData);
      
      // Create child account
      const childAccount = await storage.createChildAccount(childAccountData);
      
      // Clear cache for this user's child accounts
      childAccountsCache.delete(sessionKey);
      
      res.json({ 
        message: "Conta filha criada com sucesso",
        childAccount 
      });
    } catch (error) {
      console.error("Error creating child account:", error);
      res.status(500).json({ message: "Erro ao criar conta filha" });
    }
  });

  // New endpoint for uploading KYC documents
  app.post('/api/upload-kyc-documents', isLoggedIn, upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.session.userId; // Now this is the numeric user ID
      const sessionKey = req.session.sessionKey || userId;
      
      // Get actual user from cache for validation
      let user = userCache.get(sessionKey);
      if (!user) {
        return res.status(400).json({ message: 'Usuário não encontrado na sessão' });
      }
      
      // userId is already the numeric ID from session
      const files = req.files as any;
      const childAccountId = req.body.childAccountId;
      
      console.log("=== UPLOADING KYC DOCUMENTS ===");
      console.log("Child Account ID:", childAccountId);
      console.log("Files received:", Object.keys(files || {}));
      
      if (!childAccountId) {
        return res.status(400).json({ message: "ID da conta filha é obrigatório" });
      }
      
      if (files?.documentFront?.[0] && files?.documentBack?.[0] && files?.selfie?.[0]) {
        const documentFront = files.documentFront[0];
        const documentBack = files.documentBack[0];
        const selfie = files.selfie[0];
        
        // Convert files to base64 strings
        const documentFrontBase64 = documentFront.buffer.toString('base64');
        const documentBackBase64 = documentBack.buffer.toString('base64');
        const selfieBase64 = selfie.buffer.toString('base64');

        const kycData = {
          masterUserId: userId,
          childAccountId: parseInt(childAccountId),
          accountType: 'child',
          documentFrontPath: documentFrontBase64,
          documentBackPath: documentBackBase64,
          selfiePath: selfieBase64,
          documentType: 'rg',
          status: 'submitted',
          submittedAt: new Date(),
        };

        await storage.createKycDocument(kycData);
        
        res.json({ message: "Documentos enviados com sucesso" });
      } else {
        res.status(400).json({ message: "Todos os documentos são obrigatórios" });
      }
    } catch (error) {
      console.error("Error uploading KYC documents:", error);
      res.status(500).json({ message: "Erro ao enviar documentos" });
    }
  });

  // Simplified multer middleware for child accounts
  const uploadWithErrorHandling = (req: any, res: any, next: any) => {
    const uploader = upload.fields([
      { name: 'documentFront', maxCount: 1 },
      { name: 'documentBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 }
    ]);
    
    uploader(req, res, (err: any) => {
      if (err) {
        console.error("Multer processing error:", err.message);
        return res.status(400).json({ message: `Erro no upload: ${err.message}` });
      }
      
      console.log("=== MULTER SUCCESS ===");
      console.log("Content-Type:", req.headers['content-type']);
      console.log("Body keys:", Object.keys(req.body || {}));
      console.log("Body content:", req.body);
      console.log("Files:", req.files);
      
      next();
    });
  };

  app.post('/api/child-accounts', isLoggedIn, uploadWithErrorHandling, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const files = req.files as any;
      
      // Check if we have any data at all
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("No form data received - req.body is empty");
        return res.status(400).json({ 
          message: "Nenhum dado foi recebido. Problema na transmissão dos dados." 
        });
      }

      // Validate required fields
      const requiredFields = ['name', 'cpf', 'whatsapp', 'email', 'dateOfBirth', 'rgNumber', 'rgExpeditionDate', 'rgExpeditionOrgan', 'rgExpeditionUf', 'motherName', 'cep', 'street', 'number', 'neighborhood', 'city', 'state'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        console.error("Missing fields:", missingFields);
        console.error("Available fields:", Object.keys(req.body));
        return res.status(400).json({ 
          message: `Campos obrigatórios faltando: ${missingFields.join(', ')}` 
        });
      }
      
      // Extract form data with safe date parsing
      const parseDateSafely = (dateString: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      };

      const dateOfBirth = parseDateSafely(req.body.dateOfBirth);
      const rgExpeditionDate = parseDateSafely(req.body.rgExpeditionDate);

      if (!dateOfBirth || !rgExpeditionDate) {
        return res.status(400).json({ 
          message: "Datas inválidas fornecidas" 
        });
      }

      const childAccountData = {
        parentUserId: userId,
        name: req.body.name,
        cpf: req.body.cpf,
        cpfMask: req.body.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4'),
        whatsapp: req.body.whatsapp,
        email: req.body.email,
        dateOfBirth: dateOfBirth as Date,
        rgNumber: req.body.rgNumber,
        rgExpeditionDate: rgExpeditionDate as Date,
        rgExpeditionOrgan: req.body.rgExpeditionOrgan,
        rgExpeditionUf: req.body.rgExpeditionUf,
        motherName: req.body.motherName,
        cep: req.body.cep,
        street: req.body.street,
        number: req.body.number,
        neighborhood: req.body.neighborhood,
        city: req.body.city,
        state: req.body.state,
      };

      console.log("Processed childAccountData:", JSON.stringify(childAccountData, null, 2));
      
      // Create child account
      const childAccount = await storage.createChildAccount(childAccountData);
      
      // Save KYC documents with master user ID
      if (files?.documentFront?.[0] && files?.documentBack?.[0] && files?.selfie?.[0]) {
        const documentFront = files.documentFront[0];
        const documentBack = files.documentBack[0];
        const selfie = files.selfie[0];
        
        // Convert files to base64 strings (simple storage approach)
        const documentFrontBase64 = documentFront.buffer.toString('base64');
        const documentBackBase64 = documentBack.buffer.toString('base64');
        const selfieBase64 = selfie.buffer.toString('base64');
        
        await storage.createKycDocument({
          masterUserId: userId, // Always the master account owner
          childAccountId: childAccount.id,
          accountType: 'child',
          documentFrontPath: documentFrontBase64,
          documentBackPath: documentBackBase64,
          selfiePath: selfieBase64,
          documentType: 'rg',
          documentNumber: req.body.rgNumber,
          holderName: req.body.name,
        });
      }
      
      res.status(201).json(childAccount);
    } catch (error) {
      console.error("Error creating child account:", error);
      res.status(500).json({ message: "Erro ao criar conta filha" });
    }
  });

  app.get('/api/child-accounts/:id', isLoggedIn, async (req: any, res) => {
    try {
      const childAccountId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      const childAccount = await storage.getChildAccount(childAccountId);
      
      if (!childAccount || childAccount.parentUserId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(childAccount);
    } catch (error) {
      console.error("Error fetching child account:", error);
      res.status(500).json({ message: "Erro ao buscar conta filha" });
    }
  });

  // PIX transactions routes
  app.get('/api/pix-transactions', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId; // Now this is the numeric user ID
      const sessionKey = req.session.sessionKey || userId;
      
      // Get actual user from cache for validation
      let user = userCache.get(sessionKey);
      if (!user) {
        return res.json([]);
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const cacheKey = `${userId}_${limit}`;
      
      // Try cache first
      let transactions = transactionsCache.get(cacheKey);
      
      if (!transactions) {
        try {
          // Try database with timeout
          const dbPromise = withDbRetry(async () => {
            return await storage.getPixTransactions(userId, limit);
          }, 1);
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 2000)
          );
          
          transactions = await Promise.race([dbPromise, timeoutPromise]) as any[];
          
          if (transactions) {
            transactionsCache.set(cacheKey, transactions);
          }
        } catch (dbError) {
          console.log('Database unavailable for PIX transactions, using empty fallback');
          transactions = [];
          transactionsCache.set(cacheKey, transactions);
        }
      }
      
      res.json(transactions || []);
    } catch (error) {
      console.error("Error fetching PIX transactions:", error);
      res.status(500).json({ message: "Erro ao buscar transações PIX" });
    }
  });

  app.post('/api/pix-transactions', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const validatedData = insertPixTransactionSchema.parse(req.body);
      
      const transaction = await storage.createPixTransaction({
        ...validatedData,
        userId,
      });
      
      // Update balances based on transaction type
      if (validatedData.type === 'sent') {
        const user = await storage.getUser(userId);
        if (user) {
          const currentBalance = parseFloat(user.balance || '0');
          const transactionAmount = parseFloat(validatedData.amount);
          const newBalance = (currentBalance - transactionAmount).toFixed(2);
          await storage.updateUserBalance(userId, newBalance);
        }
      } else if (validatedData.type === 'received') {
        const user = await storage.getUser(userId);
        if (user) {
          const currentBalance = parseFloat(user.balance || '0');
          const transactionAmount = parseFloat(validatedData.amount);
          const newBalance = (currentBalance + transactionAmount).toFixed(2);
          await storage.updateUserBalance(userId, newBalance);
        }
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating PIX transaction:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar transação PIX" });
    }
  });

  app.get('/api/child-accounts/:id/transactions', isLoggedIn, async (req: any, res) => {
    try {
      const childAccountId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Verify ownership
      const childAccount = await storage.getChildAccount(childAccountId);
      if (!childAccount || childAccount.parentUserId !== req.session.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const transactions = await storage.getPixTransactionsByChild(childAccountId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching child account transactions:", error);
      res.status(500).json({ message: "Erro ao buscar transações da conta filha" });
    }
  });

  // Get KYC documents for user
  app.get('/api/kyc-documents', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId; // Now this is the numeric user ID
      const sessionKey = req.session.sessionKey || userId;
      
      // Get actual user from cache for validation
      let user = userCache.get(sessionKey);
      if (!user) {
        return res.json([]);
      }
      
      // userId is already the numeric ID from session
      const documents = await storage.getKycDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching KYC documents:", error);
      res.status(500).json({ message: "Erro ao buscar documentos KYC" });
    }
  });

  app.post('/api/kyc/submit', isLoggedIn, upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const files = req.files as any;
      
      if (!files?.documentFront?.[0] || !files?.documentBack?.[0] || !files?.selfie?.[0]) {
        return res.status(400).json({ message: "Todos os documentos são obrigatórios" });
      }
      
      const documentFront = files.documentFront[0];
      const documentBack = files.documentBack[0];
      const selfie = files.selfie[0];
      
      // Convert files to base64 strings (simple storage approach)
      const documentFrontBase64 = documentFront.buffer.toString('base64');
      const documentBackBase64 = documentBack.buffer.toString('base64');
      const selfieBase64 = selfie.buffer.toString('base64');
      
      // Use the submitKycDocuments method which updates user status
      await storage.submitKycDocuments(userId, {
        documentFront: documentFrontBase64,
        documentBack: documentBackBase64,
        selfie: selfieBase64,
      });
      
      res.json({ message: "Documentos enviados com sucesso" });
    } catch (error) {
      console.error("Error submitting KYC documents:", error);
      res.status(500).json({ message: "Erro ao enviar documentos" });
    }
  });

  // Generate PIX key for child account
  app.post('/api/child-accounts/:id/pix-key', isLoggedIn, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { keyType } = req.body;
      const userId = req.session.userId;

      console.log('PIX generation request:', { id, keyType, userId });

      // Verify the child account belongs to the authenticated user
      const childAccount = await storage.getChildAccount(parseInt(id));
      if (!childAccount || childAccount.parentUserId !== userId) {
        console.error('Child account not found or access denied:', { childAccount, userId });
        return res.status(404).json({ message: "Child account not found" });
      }

      const pixKey = await storage.generatePixKeyForChild(parseInt(id), keyType);
      console.log('PIX key generated successfully:', pixKey);
      res.json({ pixKey });
    } catch (error) {
      console.error("Error generating PIX key for child account:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete PIX key for child account
  app.delete('/api/child-accounts/:id/pix-key', isLoggedIn, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      console.log('PIX deletion request:', { id, userId });

      // Verify the child account belongs to the authenticated user
      const childAccount = await storage.getChildAccount(parseInt(id));
      if (!childAccount || childAccount.parentUserId !== userId) {
        console.error('Child account not found or access denied:', { childAccount, userId });
        return res.status(404).json({ message: "Child account not found" });
      }

      // Deactivate all PIX keys for this account
      const allPixKeys = await storage.getPixKeysByChild(parseInt(id));
      for (const pixKey of allPixKeys) {
        if (pixKey.isActive) {
          await storage.deactivatePixKey(parseInt(id), pixKey.pixKeyType);
        }
      }
      console.log('PIX key deleted successfully');
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting PIX key for child account:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check CPF endpoint
  app.post("/api/check-cpf", isLoggedIn, async (req, res) => {
    try {
      const { cpf } = req.body;
      const existingUser = await storage.getUserByCpf(cpf);
      const existingChild = await storage.getChildAccountByCpf(cpf);
      res.json({ exists: !!(existingUser || existingChild) });
    } catch (error) {
      console.error("Error checking CPF:", error);
      res.status(500).json({ message: "Failed to check CPF" });
    }
  });

  // Check RG endpoint
  app.post("/api/check-rg", isLoggedIn, async (req, res) => {
    try {
      const { rgNumber } = req.body;
      const existing = await storage.getChildAccountByRg(rgNumber);
      res.json({ exists: !!existing });
    } catch (error) {
      console.error("Error checking RG:", error);
      res.status(500).json({ message: "Failed to check RG" });
    }
  });

  // Affiliate routes
  app.get('/api/affiliate/dashboard', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId; // Now this is the numeric user ID
      const sessionKey = req.session.sessionKey || userId;
      
      // Get user from cache for validation
      let user = userCache.get(sessionKey);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
      
      // userId is already the numeric ID from session
      
      // Get affiliate data
      const affiliate = await storage.getAffiliate(userId);
      let settings = null;
      let sales: any[] = [];
      
      if (affiliate) {
        settings = await storage.getAffiliateSettings(affiliate.id);
        sales = await storage.getAffiliateSales(affiliate.id);
      }
      
      res.json({
        affiliate,
        settings,
        sales,
      });
    } catch (error) {
      console.error("Error fetching affiliate dashboard:", error);
      res.status(500).json({ message: "Failed to fetch affiliate data" });
    }
  });

  app.post('/api/affiliate/create', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Check if user already has an affiliate account
      const existing = await storage.getAffiliate(userId);
      if (existing) {
        return res.status(400).json({ message: "User already has an affiliate account" });
      }
      
      const affiliate = await storage.createAffiliate({
        userId,
        affiliateCode: '', // Will be generated in storage
        commissionRate: "40.00",
        totalSales: 0,
        totalCommission: "0.00",
        isActive: true,
      });
      
      res.json(affiliate);
    } catch (error) {
      console.error("Error creating affiliate:", error);
      res.status(500).json({ message: "Failed to create affiliate account" });
    }
  });

  app.post('/api/affiliate/settings', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { defaultPrice, customMessage } = req.body;
      
      // Validate price range
      const price = parseFloat(defaultPrice);
      if (price < 90 || price > 130) {
        return res.status(400).json({ message: "Price must be between R$ 90.00 and R$ 130.00" });
      }
      
      const affiliate = await storage.getAffiliate(userId);
      if (!affiliate) {
        return res.status(404).json({ message: "Affiliate account not found" });
      }
      
      const settings = await storage.updateAffiliateSettings(affiliate.id, {
        defaultPrice,
        customMessage,
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating affiliate settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Affiliate request endpoint
  app.post('/api/affiliate/request', isLoggedIn, async (req: any, res) => {
    try {
      const userId = req.session.userId; // Now this is the numeric user ID
      const sessionKey = req.session.sessionKey || userId;
      
      // Get actual user from cache for validation
      let user = userCache.get(sessionKey);
      if (!user) {
        return res.status(400).json({ message: 'Usuário não encontrado na sessão' });
      }
      
      // userId is already the numeric ID from session
      const { motivation, experience, expectedVolume, whatsapp } = req.body;
      
      // Validate required fields
      if (!motivation || !experience || !expectedVolume || !whatsapp) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }
      
      // Store affiliate request details
      await storage.createAffiliateRequest({
        userId: userId,
        motivation,
        experience,
        expectedVolume,
        whatsapp,
        status: 'pending',
      });
      
      // Update user affiliate status to pending
      const updatedUser = await storage.updateUserProfile(userId, {
        affiliateStatus: 'pending',
        affiliateRequestedAt: new Date(),
      });
      
      // Update cache
      userCache.set(sessionKey, updatedUser);
      
      res.json({ message: 'Solicitação de afiliação enviada com sucesso' });
    } catch (error) {
      console.error("Error submitting affiliate request:", error);
      res.status(500).json({ message: "Erro ao enviar solicitação de afiliação" });
    }
  });

  // Get affiliate request details for admin
  app.get('/api/admin/affiliate-request/:userId', authenticateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const affiliateRequest = await storage.getAffiliateRequest(userId);
      
      if (!affiliateRequest) {
        return res.status(404).json({ message: 'Solicitação de afiliação não encontrada' });
      }
      
      res.json(affiliateRequest);
    } catch (error) {
      console.error('Error fetching affiliate request:', error);
      res.status(500).json({ message: 'Erro ao buscar solicitação de afiliação' });
    }
  });

  // Admin routes
  app.post('/api/admin/auth/login', adminLogin);
  app.post('/api/admin/auth/logout', adminLogout);
  app.get('/api/admin/auth/status', adminAuthStatus);

  // System alerts endpoints
  app.get('/api/alerts', async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get('/api/admin/alerts', authenticateAdmin, async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      console.log("Fetched alerts:", alerts);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching admin alerts:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post('/api/admin/alerts', authenticateAdmin, async (req, res) => {
    try {
      const { title, message, type } = req.body;
      console.log("Creating alert with data:", { title, message, type });
      const alert = await storage.createAlert({ title, message, type });
      console.log("Alert created:", alert);
      res.json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch('/api/admin/alerts/:id', authenticateAdmin, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const updateData = req.body;
      const alert = await storage.updateAlert(alertId, updateData);
      res.json(alert);
    } catch (error) {
      console.error("Error updating alert:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete('/api/admin/alerts/:id', authenticateAdmin, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      await storage.deleteAlert(alertId);
      res.json({ message: "Alerta excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Protected admin routes
  app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
    try {
      const stats = await adminStorage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas do dashboard" });
    }
  });

  app.get('/api/admin/master-accounts', authenticateAdmin, async (req, res) => {
    try {
      const users = await adminStorage.getMasterAccounts();
      res.json(users);
    } catch (error) {
      console.error("Error fetching master accounts:", error);
      res.status(500).json({ message: "Erro ao buscar contas master" });
    }
  });

  app.patch('/api/admin/users/:id/toggle-status', authenticateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      console.log('Admin toggle status request:', { userId, isActive, type: typeof isActive });
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive deve ser um booleano' });
      }
      
      const user = await storage.toggleUserStatus(userId, isActive);
      console.log('User status updated:', { userId: user.id, newStatus: user.isActive });
      
      // Update cache if user exists there
      const cacheKey = `${user.email}_${user.replitId || user.email}`;
      if (userCache.has(cacheKey)) {
        const cachedUser = userCache.get(cacheKey);
        cachedUser.isActive = user.isActive;
        userCache.set(cacheKey, cachedUser);
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({ message: 'Erro ao alterar status do usuário' });
    }
  });

  app.get('/api/admin/child-accounts-by-user', authenticateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório e deve ser um número válido' });
      }
      
      console.log(`Fetching child accounts for user ID: ${userId}`);
      const childAccounts = await storage.getChildAccounts(userId);
      console.log(`Found ${childAccounts.length} child accounts for user ${userId}`);
      
      res.json(childAccounts);
    } catch (error) {
      console.error('Error fetching child accounts by user:', error);
      res.status(500).json({ message: 'Erro ao buscar contas filhas' });
    }
  });

  app.get('/api/admin/child-accounts', authenticateAdmin, async (req, res) => {
    try {
      const childAccounts = await adminStorage.getChildAccounts();
      res.json(childAccounts);
    } catch (error) {
      console.error("Error fetching child accounts:", error);
      res.status(500).json({ message: "Erro ao buscar contas filhas" });
    }
  });

  app.patch('/api/admin/child-accounts/:id/kyc-status', authenticateAdmin, async (req, res) => {
    try {
      const childAccountId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Status inválido. Use 'approved', 'rejected' ou 'pending'" });
      }
      
      await storage.updateChildAccountKycStatus(childAccountId, status);
      res.json({ message: "Status KYC atualizado com sucesso" });
    } catch (error) {
      console.error("Error updating child account KYC status:", error);
      res.status(500).json({ message: "Erro ao atualizar status KYC" });
    }
  });

  app.get('/api/admin/financial', authenticateAdmin, async (req, res) => {
    try {
      const transactions = await adminStorage.getPixTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      res.status(500).json({ message: "Erro ao buscar dados financeiros" });
    }
  });

  // Get user details for admin
  app.get('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Erro ao buscar usuário' });
    }
  });

  // Affiliate status routes
  app.get('/api/admin/affiliate-status', authenticateAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório' });
      }
      
      const affiliate = await storage.getAffiliate(userId);
      
      if (!affiliate) {
        return res.status(404).json({ message: 'Afiliado não encontrado' });
      }
      
      res.json(affiliate);
    } catch (error) {
      console.error('Error fetching affiliate status:', error);
      res.status(500).json({ message: 'Erro ao buscar status do afiliado' });
    }
  });

  app.patch('/api/admin/affiliate-status', authenticateAdmin, async (req, res) => {
    try {
      const { userId, approvalStatus } = req.body;
      
      if (!userId || !approvalStatus) {
        return res.status(400).json({ message: 'userId e approvalStatus são obrigatórios' });
      }
      
      if (!['pending', 'approved', 'rejected'].includes(approvalStatus)) {
        return res.status(400).json({ message: 'Status inválido' });
      }
      
      // Update user affiliate status
      const updatedUser = await storage.updateUserProfile(userId, {
        affiliateStatus: approvalStatus,
      });
      
      // If approved, create or activate affiliate account
      if (approvalStatus === 'approved') {
        let affiliate = await storage.getAffiliate(userId);
        if (!affiliate) {
          affiliate = await storage.createAffiliate({
            userId: userId,
            affiliateCode: `AF${userId}${Date.now().toString().slice(-4)}`,
            commissionRate: "40.00",
            isActive: true,
            approvalStatus: 'approved',
          });
        } else {
          // Update existing affiliate
          await db
            .update(affiliates)
            .set({ 
              approvalStatus: 'approved',
              isActive: true,
              updatedAt: new Date()
            })
            .where(eq(affiliates.userId, userId));
        }
      }
      
      // Update user cache if exists
      for (const [key, cachedUser] of userCache.entries()) {
        if (cachedUser.id === userId) {
          cachedUser.affiliateStatus = approvalStatus;
          userCache.set(key, cachedUser);
          break;
        }
      }
      
      res.json({ message: 'Status de afiliado atualizado com sucesso' });
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      res.status(500).json({ message: 'Erro ao atualizar status do afiliado' });
    }
  });

  // QR code requests routes
  app.post('/api/qr-code-requests', isLoggedIn, async (req: any, res) => {
    try {
      const { isBettingHouse, isChinese, houseName, qrCode } = req.body;
      const userId = req.session.userId;
      
      console.log("Creating QR code request with data:", { 
        masterUserId: userId,
        isBettingHouse,
        isChinese,
        houseName,
        qrCode: qrCode?.substring(0, 50) + "..." 
      });
      
      // Create in the new formQrCode table
      const formQrCodeEntry = await storage.createFormQrCode({
        masterUserId: userId,
        isBettingHouse,
        isChinese,
        houseName,
        qrCode,
      });
      
      console.log("Form QR code entry created:", formQrCodeEntry);
      
      // Also create in the old qrCodeRequests table for compatibility
      try {
        const request = await storage.createQrCodeRequest({
          masterUserId: userId,
          isBettingHouse,
          isChinese,
          houseName,
          qrCode,
        });
        console.log("Old QR code request created:", request);
      } catch (oldTableError) {
        console.log("Old table insert failed (expected):", oldTableError.message);
      }
      
      res.json(formQrCodeEntry);
    } catch (error) {
      console.error("Error creating QR code request:", error);
      res.status(500).json({ message: "Failed to create QR code request" });
    }
  });

  // Admin routes for form QR codes
  app.get('/api/admin/qr-code-requests', authenticateAdmin, async (req, res) => {
    try {
      const requests = await storage.getFormQrCodes();
      
      // Enrich with user data
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const user = await storage.getUser(request.masterUserId);
          return {
            ...request,
            userEmail: user?.email,
            userFirstName: user?.firstName,
            userLastName: user?.lastName,
          };
        })
      );
      
      res.json(enrichedRequests);
    } catch (error) {
      console.error("Error fetching QR code requests:", error);
      res.status(500).json({ message: "Failed to fetch QR code requests" });
    }
  });

  app.patch('/api/admin/qr-code-requests/:id', authenticateAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      
      const updatedRequest = await storage.updateFormQrCodeStatus(requestId, status, adminNotes);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating QR code request:", error);
      res.status(500).json({ message: "Failed to update QR code request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}