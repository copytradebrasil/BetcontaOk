import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import { nanoid } from "nanoid";
import { 
  insertChildAccountSchema, 
  insertPixTransactionSchema,
  updateUserProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/user/change-password', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/user/generate-pix-key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pixKey = await storage.generatePixKey(userId);
      res.json({ pixKey });
    } catch (error) {
      console.error("Error generating PIX key:", error);
      res.status(500).json({ message: "Erro ao gerar chave PIX" });
    }
  });

  app.post('/api/user/generate-account-number', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountNumber = await storage.generateAccountNumber(userId);
      res.json({ accountNumber });
    } catch (error) {
      console.error("Error generating account number:", error);
      res.status(500).json({ message: "Erro ao gerar número da conta" });
    }
  });

  // Child accounts routes
  app.get('/api/child-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const childAccounts = await storage.getChildAccounts(userId);
      res.json(childAccounts);
    } catch (error) {
      console.error("Error fetching child accounts:", error);
      res.status(500).json({ message: "Erro ao buscar contas filhas" });
    }
  });

  app.post('/api/child-accounts', isAuthenticated, upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as any;
      
      // Extract form data
      const childAccountData = {
        parentUserId: userId,
        name: req.body.name,
        cpf: req.body.cpf,
        cpfMask: req.body.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4'),
        whatsapp: req.body.whatsapp,
        email: req.body.email,
        dateOfBirth: new Date(req.body.dateOfBirth),
        rgNumber: req.body.rgNumber,
        rgExpeditionDate: new Date(req.body.rgExpeditionDate),
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

  app.get('/api/child-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const childAccountId = parseInt(req.params.id);
      const childAccount = await storage.getChildAccount(childAccountId);
      
      if (!childAccount) {
        return res.status(404).json({ message: "Conta filha não encontrada" });
      }
      
      // Verify ownership
      if (childAccount.parentUserId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      res.json(childAccount);
    } catch (error) {
      console.error("Error fetching child account:", error);
      res.status(500).json({ message: "Erro ao buscar conta filha" });
    }
  });

  // PIX transactions routes
  app.get('/api/pix-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getPixTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching PIX transactions:", error);
      res.status(500).json({ message: "Erro ao buscar transações PIX" });
    }
  });

  app.post('/api/pix-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/child-accounts/:id/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const childAccountId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Verify ownership
      const childAccount = await storage.getChildAccount(childAccountId);
      if (!childAccount || childAccount.parentUserId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const transactions = await storage.getPixTransactionsByChild(childAccountId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching child account transactions:", error);
      res.status(500).json({ message: "Erro ao buscar transações da conta filha" });
    }
  });

  app.post('/api/kyc/submit', isAuthenticated, upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.documentFront || !files.documentBack || !files.selfie) {
        return res.status(400).json({ message: "Todos os documentos são obrigatórios" });
      }

      // Generate unique filenames (in production, you'd save to cloud storage)
      const documentFrontName = `kyc_${userId}_front_${nanoid(10)}.jpg`;
      const documentBackName = `kyc_${userId}_back_${nanoid(10)}.jpg`;
      const selfieName = `kyc_${userId}_selfie_${nanoid(10)}.jpg`;

      // Save document references to database
      await storage.submitKycDocuments(userId, {
        documentFront: documentFrontName,
        documentBack: documentBackName,
        selfie: selfieName,
      });

      res.json({ 
        message: "Documentos enviados com sucesso",
        status: "submitted"
      });
    } catch (error) {
      console.error("Error submitting KYC documents:", error);
      res.status(500).json({ message: "Erro ao enviar documentos" });
    }
  });

  // KYC document management routes
  app.get('/api/kyc/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getKycDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching KYC documents:", error);
      res.status(500).json({ message: "Erro ao buscar documentos KYC" });
    }
  });

  app.get('/api/kyc/documents/child/:childAccountId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const childAccountId = parseInt(req.params.childAccountId);
      
      // Verify the child account belongs to the user
      const childAccount = await storage.getChildAccount(childAccountId);
      if (!childAccount || childAccount.parentUserId !== userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const documents = await storage.getKycDocumentsByChild(childAccountId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching child KYC documents:", error);
      res.status(500).json({ message: "Erro ao buscar documentos da conta filha" });
    }
  });

  // Forgot password route
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      // TODO: Implement actual password recovery email
      console.log("Password recovery requested for:", validatedData.email);
      res.json({ message: "Link de recuperação enviado para seu e-mail" });
    } catch (error) {
      console.error("Error processing forgot password:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "E-mail inválido", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  // Check CPF endpoint
  app.post("/api/check-cpf", isAuthenticated, async (req, res) => {
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
  app.post("/api/check-rg", isAuthenticated, async (req, res) => {
    try {
      const { rgNumber } = req.body;
      const existing = await storage.getChildAccountByRg(rgNumber);
      res.json({ exists: !!existing });
    } catch (error) {
      console.error("Error checking RG:", error);
      res.status(500).json({ message: "Failed to check RG" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
