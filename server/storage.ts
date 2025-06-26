import {
  users,
  childAccounts,
  pixTransactions,
  kycDocuments,
  affiliates,
  affiliateSales,
  affiliateSettings,
  affiliateRequests,
  systemAlerts,
  pixKeys,
  qrCodeRequests,
  formQrCode,
  type User,
  type UpsertUser,
  type ChildAccount,
  type InsertChildAccount,
  type PixTransaction,
  type InsertPixTransaction,
  type KycDocument,
  type InsertKycDocument,
  type Affiliate,
  type InsertAffiliate,
  type AffiliateSale,
  type InsertAffiliateSale,
  type AffiliateSettings,
  type InsertAffiliateSettings,
  type AffiliateRequest,
  type InsertAffiliateRequest,
  type SystemAlert,
  type InsertSystemAlert,
  type QrCodeRequest,
  type InsertQrCodeRequest,
  type PixKey,
  type InsertPixKey,
  type FormQrCode,
  type InsertFormQrCode,
} from "@shared/schema";
import { db, withDbRetry } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: number): Promise<User | undefined>;
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: number, data: Partial<User>): Promise<User>;
  toggleUserStatus(id: number, isActive: boolean): Promise<User>;
  
  // Child account operations
  getChildAccounts(parentUserId: number): Promise<ChildAccount[]>;
  createChildAccount(data: InsertChildAccount): Promise<ChildAccount>;
  getChildAccount(id: number): Promise<ChildAccount | undefined>;
  updateChildAccountBalance(id: number, balance: string): Promise<void>;
  updateChildAccountKycStatus(id: number, status: string): Promise<void>;
  
  // PIX transaction operations
  getPixTransactions(userId: number, limit?: number): Promise<PixTransaction[]>;
  createPixTransaction(data: InsertPixTransaction): Promise<PixTransaction>;
  getPixTransactionsByChild(childAccountId: number, limit?: number): Promise<PixTransaction[]>;
  
  // Account operations
  updateUserBalance(userId: number, balance: string): Promise<void>;
  generatePixKey(userId: number): Promise<string>;
  generateAccountNumber(userId: number): Promise<string>;
  
  // KYC operations
  submitKycDocuments(userId: number, documents: {
    documentFront: string;
    documentBack: string;
    selfie: string;
  }): Promise<void>;
  createKycDocument(data: InsertKycDocument): Promise<KycDocument>;
  getKycDocuments(masterUserId: number): Promise<KycDocument[]>;
  getKycDocumentsByChild(childAccountId: number): Promise<KycDocument[]>;
  updateKycDocumentStatus(id: number, status: string, reviewNotes?: string): Promise<void>;
  
  // Additional validation methods
  getUserByCpf(cpf: string): Promise<User | undefined>;
  getChildAccountByCpf(cpf: string): Promise<ChildAccount | undefined>;
  getChildAccountByRg(rgNumber: string): Promise<ChildAccount | undefined>;
  
  // Affiliate operations
  getAffiliate(userId: number): Promise<Affiliate | undefined>;
  createAffiliate(data: InsertAffiliate): Promise<Affiliate>;
  getAffiliateByCode(code: string): Promise<Affiliate | undefined>;
  getAffiliateSettings(affiliateId: number): Promise<AffiliateSettings | undefined>;
  updateAffiliateSettings(affiliateId: number, data: Partial<AffiliateSettings>): Promise<AffiliateSettings>;
  getAffiliateSales(affiliateId: number, limit?: number): Promise<AffiliateSale[]>;
  createAffiliateSale(data: InsertAffiliateSale): Promise<AffiliateSale>;
  updateAffiliateStats(affiliateId: number, commission: string): Promise<void>;
  
  // Affiliate request operations
  createAffiliateRequest(data: InsertAffiliateRequest): Promise<AffiliateRequest>;
  getAffiliateRequest(userId: number): Promise<AffiliateRequest | undefined>;
  
  // System alerts operations
  getActiveAlerts(): Promise<SystemAlert[]>;
  getAllAlerts(): Promise<SystemAlert[]>;
  createAlert(data: InsertSystemAlert): Promise<SystemAlert>;
  updateAlert(id: number, data: Partial<SystemAlert>): Promise<SystemAlert>;
  deleteAlert(id: number): Promise<void>;
  
  // QR Code requests operations
  createQrCodeRequest(data: InsertQrCodeRequest): Promise<QrCodeRequest>;
  getQrCodeRequests(): Promise<QrCodeRequest[]>;
  getQrCodeRequest(id: number): Promise<QrCodeRequest | undefined>;
  updateQrCodeRequestStatus(id: number, status: string, adminNotes?: string): Promise<QrCodeRequest>;
  
  // PIX key operations for child accounts
  generatePixKeyForChild(childAccountId: number, keyType: string): Promise<string>;
  updateChildAccountPixKey(childAccountId: number, pixKey: string | null, pixKeyType: string | null): Promise<void>;
  
  // PIX Keys table operations
  createPixKey(data: InsertPixKey): Promise<PixKey>;
  getPixKeysByChild(childAccountId: number): Promise<PixKey[]>;
  getActivePixKey(childAccountId: number, keyType: string): Promise<PixKey | undefined>;
  deactivatePixKey(childAccountId: number, keyType: string): Promise<void>;
  activatePixKey(childAccountId: number, keyType: string, pixKey: string): Promise<PixKey>;
  
  // Form QR Code operations
  createFormQrCode(data: InsertFormQrCode): Promise<FormQrCode>;
  getFormQrCodes(): Promise<FormQrCode[]>;
  getFormQrCodesByUser(masterUserId: number): Promise<FormQrCode[]>;
  updateFormQrCodeStatus(id: number, status: string, adminNotes?: string): Promise<FormQrCode>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByReplitId(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if email conflict exists, if so update instead of insert
    const existingUser = await this.getUserByEmail(userData.email!);
    
    if (existingUser) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email!))
        .returning();
      return user;
    } else {
      // Insert new user
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return user;
    }
  }

  async updateUserProfile(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async toggleUserStatus(id: number, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Child account operations
  async getChildAccounts(parentUserId: number): Promise<ChildAccount[]> {
    return await db
      .select()
      .from(childAccounts)
      .where(eq(childAccounts.parentUserId, parentUserId))
      .orderBy(desc(childAccounts.createdAt));
  }

  async createChildAccount(data: InsertChildAccount): Promise<ChildAccount> {
    // Generate PIX key for child account
    const pixKey = this.generateRandomPixKey();
    
    const [childAccount] = await db
      .insert(childAccounts)
      .values({
        ...data,
        pixKey,
      })
      .returning();
    return childAccount;
  }

  async getChildAccount(id: number): Promise<ChildAccount | undefined> {
    const [childAccount] = await db
      .select()
      .from(childAccounts)
      .where(eq(childAccounts.id, id));
    return childAccount;
  }

  async updateChildAccountBalance(id: number, balance: string): Promise<void> {
    await db
      .update(childAccounts)
      .set({ balance, updatedAt: new Date() })
      .where(eq(childAccounts.id, id));
  }

  async updateChildAccountKycStatus(id: number, status: string): Promise<void> {
    await db
      .update(childAccounts)
      .set({ status: status, updatedAt: new Date() })
      .where(eq(childAccounts.id, id));
  }

  // PIX transaction operations
  async getPixTransactions(userId: number, limit = 10): Promise<PixTransaction[]> {
    return await db
      .select()
      .from(pixTransactions)
      .where(eq(pixTransactions.userId, userId))
      .orderBy(desc(pixTransactions.createdAt))
      .limit(limit);
  }

  async createPixTransaction(data: InsertPixTransaction): Promise<PixTransaction> {
    const transactionId = this.generateTransactionId();
    
    const [transaction] = await db
      .insert(pixTransactions)
      .values({
        ...data,
        transactionId,
      })
      .returning();
    return transaction;
  }

  async getPixTransactionsByChild(childAccountId: number, limit = 10): Promise<PixTransaction[]> {
    return await db
      .select()
      .from(pixTransactions)
      .where(eq(pixTransactions.childAccountId, childAccountId))
      .orderBy(desc(pixTransactions.createdAt))
      .limit(limit);
  }

  // Account operations
  async updateUserBalance(userId: number, balance: string): Promise<void> {
    await db
      .update(users)
      .set({ balance, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async generatePixKey(userId: number): Promise<string> {
    const pixKey = this.generateRandomPixKey();
    await db
      .update(users)
      .set({ pixKey, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return pixKey;
  }

  async generateAccountNumber(userId: number): Promise<string> {
    const accountNumber = this.generateRandomAccountNumber();
    await db
      .update(users)
      .set({ accountNumber, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return accountNumber;
  }

  // Helper methods
  private generateRandomPixKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result.match(/.{1,8}/g)?.join('-') || result;
  }

  private generateRandomAccountNumber(): string {
    const number = Math.floor(Math.random() * 999999) + 100000;
    const digit = Math.floor(Math.random() * 9) + 1;
    return `${number}-${digit}`;
  }

  private generateTransactionId(): string {
    return 'PIX' + Date.now() + Math.floor(Math.random() * 1000);
  }

  // KYC operations
  async submitKycDocuments(userId: number, documents: {
    documentFront: string;
    documentBack: string;
    selfie: string;
  }): Promise<void> {
    // Create document record in dedicated table
    await this.createKycDocument({
      masterUserId: userId,
      childAccountId: null,
      accountType: 'master',
      documentFrontPath: documents.documentFront,
      documentBackPath: documents.documentBack,
      selfiePath: documents.selfie,
      status: 'submitted',
    });

    // Update user KYC status
    await db.update(users)
      .set({
        kycStatus: 'submitted',
        kycSubmittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async createKycDocument(data: InsertKycDocument): Promise<KycDocument> {
    const [document] = await db
      .insert(kycDocuments)
      .values(data)
      .returning();
    return document;
  }

  async getKycDocuments(masterUserId: number): Promise<KycDocument[]> {
    return await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.masterUserId, masterUserId))
      .orderBy(desc(kycDocuments.submittedAt));
  }

  async getKycDocumentsByChild(childAccountId: number): Promise<KycDocument[]> {
    return await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.childAccountId, childAccountId))
      .orderBy(desc(kycDocuments.submittedAt));
  }

  async updateKycDocumentStatus(id: number, status: string, reviewNotes?: string): Promise<void> {
    await db.update(kycDocuments)
      .set({
        status,
        reviewNotes,
        reviewedAt: new Date(),
      })
      .where(eq(kycDocuments.id, id));
  }

  // Additional validation methods
  async getUserByCpf(cpf: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cpf, cpf));
    return user;
  }

  async getChildAccountByCpf(cpf: string): Promise<ChildAccount | undefined> {
    const [child] = await db.select().from(childAccounts).where(eq(childAccounts.cpf, cpf));
    return child;
  }

  async getChildAccountByRg(rgNumber: string): Promise<ChildAccount | undefined> {
    const [child] = await db.select().from(childAccounts).where(eq(childAccounts.rgNumber, rgNumber));
    return child;
  }

  // Affiliate operations
  async getAffiliate(userId: number): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, userId));
    return affiliate;
  }

  async createAffiliate(data: InsertAffiliate): Promise<Affiliate> {
    const affiliateCode = this.generateAffiliateCode();
    const [affiliate] = await db.insert(affiliates).values({
      ...data,
      affiliateCode,
    }).returning();
    
    // Create default settings
    await db.insert(affiliateSettings).values({
      affiliateId: affiliate.id,
      defaultPrice: "120.00",
      customMessage: null,
      landingPageEnabled: true,
    });

    return affiliate;
  }

  async getAffiliateByCode(code: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.affiliateCode, code));
    return affiliate;
  }

  async getAffiliateSettings(affiliateId: number): Promise<AffiliateSettings | undefined> {
    const [settings] = await db.select().from(affiliateSettings).where(eq(affiliateSettings.affiliateId, affiliateId));
    return settings;
  }

  async updateAffiliateSettings(affiliateId: number, data: Partial<AffiliateSettings>): Promise<AffiliateSettings> {
    const [settings] = await db
      .update(affiliateSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(affiliateSettings.affiliateId, affiliateId))
      .returning();
    return settings;
  }

  async getAffiliateSales(affiliateId: number, limit = 50): Promise<AffiliateSale[]> {
    return await db
      .select()
      .from(affiliateSales)
      .where(eq(affiliateSales.affiliateId, affiliateId))
      .orderBy(desc(affiliateSales.createdAt))
      .limit(limit);
  }

  async createAffiliateSale(data: InsertAffiliateSale): Promise<AffiliateSale> {
    const [sale] = await db.insert(affiliateSales).values(data).returning();
    return sale;
  }

  async updateAffiliateStats(affiliateId: number, commission: string): Promise<void> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.id, affiliateId));
    if (affiliate) {
      await db
        .update(affiliates)
        .set({
          totalSales: (affiliate.totalSales || 0) + 1,
          totalCommission: (parseFloat(affiliate.totalCommission || "0") + parseFloat(commission)).toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(affiliates.id, affiliateId));
    }
  }

  private generateAffiliateCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  // Affiliate request operations
  async createAffiliateRequest(data: InsertAffiliateRequest): Promise<AffiliateRequest> {
    const [request] = await db
      .insert(affiliateRequests)
      .values({
        userId: data.userId,
        motivation: data.motivation,
        experience: data.experience,
        expectedVolume: data.expectedVolume,
        whatsapp: data.whatsapp,
        status: data.status || "pending",
      })
      .returning();
    return request;
  }

  async getAffiliateRequest(userId: number): Promise<AffiliateRequest | undefined> {
    const [request] = await db
      .select()
      .from(affiliateRequests)
      .where(eq(affiliateRequests.userId, userId))
      .limit(1);
    return request;
  }

  // System alerts operations
  async getActiveAlerts(): Promise<SystemAlert[]> {
    return await db
      .select()
      .from(systemAlerts)
      .where(eq(systemAlerts.isActive, true))
      .orderBy(desc(systemAlerts.createdAt));
  }

  async getAllAlerts(): Promise<SystemAlert[]> {
    return await db
      .select()
      .from(systemAlerts)
      .orderBy(desc(systemAlerts.createdAt));
  }

  async createAlert(data: InsertSystemAlert): Promise<SystemAlert> {
    const [alert] = await db
      .insert(systemAlerts)
      .values(data)
      .returning();
    return alert;
  }

  async updateAlert(id: number, data: Partial<SystemAlert>): Promise<SystemAlert> {
    const [alert] = await db
      .update(systemAlerts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(systemAlerts.id, id))
      .returning();
    return alert;
  }

  async deleteAlert(id: number): Promise<void> {
    await db
      .delete(systemAlerts)
      .where(eq(systemAlerts.id, id));
  }

  async generatePixKeyForChild(childAccountId: number, keyType: string): Promise<string> {
    // Use the new PIX table approach
    const pixKey = await this.activatePixKey(childAccountId, keyType, "");
    return pixKey.pixKey;
  }

  async updateChildAccountPixKey(childAccountId: number, pixKey: string | null, pixKeyType: string | null): Promise<void> {
    // Legacy method - now uses PIX keys table
    if (pixKey && pixKeyType) {
      await this.activatePixKey(childAccountId, pixKeyType, pixKey);
    } else if (pixKeyType) {
      await this.deactivatePixKey(childAccountId, pixKeyType);
    }
  }

  // PIX Keys table operations
  async createPixKey(data: InsertPixKey): Promise<PixKey> {
    const [pixKey] = await db
      .insert(pixKeys)
      .values(data)
      .returning();
    return pixKey;
  }

  async getPixKeysByChild(childAccountId: number): Promise<PixKey[]> {
    const keys = await db
      .select()
      .from(pixKeys)
      .where(eq(pixKeys.childAccountId, childAccountId))
      .orderBy(desc(pixKeys.createdAt));
    
    console.log(`Found ${keys.length} PIX keys for child ${childAccountId}:`, keys);
    return keys;
  }

  async getActivePixKey(childAccountId: number, keyType: string): Promise<PixKey | undefined> {
    const [pixKey] = await db
      .select()
      .from(pixKeys)
      .where(and(
        eq(pixKeys.childAccountId, childAccountId),
        eq(pixKeys.pixKeyType, keyType),
        eq(pixKeys.isActive, true)
      ));
    return pixKey;
  }

  async deactivatePixKey(childAccountId: number, keyType: string): Promise<void> {
    await db
      .update(pixKeys)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
        closedAt: new Date() // Mark when it was closed
      })
      .where(and(
        eq(pixKeys.childAccountId, childAccountId),
        eq(pixKeys.pixKeyType, keyType),
        eq(pixKeys.isActive, true)
      ));
  }

  async activatePixKey(childAccountId: number, keyType: string, pixKeyValue: string): Promise<PixKey> {
    // First deactivate any existing PIX key of this type
    await this.deactivatePixKey(childAccountId, keyType);
    
    // Get child account data to generate PIX key if needed
    const [childAccount] = await db
      .select()
      .from(childAccounts)
      .where(eq(childAccounts.id, childAccountId));
    
    if (!childAccount) {
      throw new Error("Child account not found");
    }
    
    let finalPixKey = pixKeyValue;
    if (!finalPixKey) {
      if (keyType === "CPF") {
        finalPixKey = childAccount.cpf;
      } else if (keyType === "Email") {
        finalPixKey = childAccount.email;
      } else if (keyType === "Aleatória") {
        finalPixKey = this.generateRandomPixKey();
      } else {
        throw new Error("Invalid PIX key type");
      }
    }
    
    // Create new active PIX key (reset closedAt for new activation)
    return await this.createPixKey({
      childAccountId,
      pixKey: finalPixKey,
      pixKeyType: keyType,
      isActive: true,
      closedAt: null, // Reset closedAt for new active key
    });
  }

  // Auto-expire PIX keys that have been active for more than 72 hours
  async autoExpirePixKeys(): Promise<void> {
    const expiredCutoff = new Date(Date.now() - 72 * 60 * 60 * 1000); // 72 hours ago
    
    await db
      .update(pixKeys)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
        closedAt: new Date()
      })
      .where(
        and(
          eq(pixKeys.isActive, true),
          lt(pixKeys.createdAt, expiredCutoff),
          isNull(pixKeys.closedAt) // Only auto-close if not manually closed
        )
      );
  }

  // Calculate remaining time for PIX expiration
  calculatePixTimeRemaining(createdAt: Date): { 
    expired: boolean, 
    remainingMs: number, 
    remainingText: string 
  } {
    const now = Date.now();
    const expirationTime = new Date(createdAt).getTime() + (72 * 60 * 60 * 1000); // 72 hours
    const remainingMs = Math.max(0, expirationTime - now);
    
    if (remainingMs === 0) {
      return { expired: true, remainingMs: 0, remainingText: "Expirado" };
    }

    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    
    let remainingText = "";
    if (hours > 0) {
      remainingText = `${hours}h ${minutes}min restantes`;
    } else {
      remainingText = `${minutes}min restantes`;
    }

    return { expired: false, remainingMs, remainingText };
  }

  // Form QR Code operations
  async createFormQrCode(data: InsertFormQrCode): Promise<FormQrCode> {
    return await withDbRetry(async () => {
      const [formQr] = await db
        .insert(formQrCode)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return formQr;
    });
  }

  async getFormQrCodes(): Promise<FormQrCode[]> {
    return await withDbRetry(async () => {
      return await db
        .select()
        .from(formQrCode)
        .orderBy(desc(formQrCode.createdAt));
    });
  }

  async getFormQrCodesByUser(masterUserId: number): Promise<FormQrCode[]> {
    return await withDbRetry(async () => {
      return await db
        .select()
        .from(formQrCode)
        .where(eq(formQrCode.masterUserId, masterUserId))
        .orderBy(desc(formQrCode.createdAt));
    });
  }

  async updateFormQrCodeStatus(id: number, status: string, adminNotes?: string): Promise<FormQrCode> {
    return await withDbRetry(async () => {
      const [updated] = await db
        .update(formQrCode)
        .set({
          status,
          adminNotes,
          updatedAt: new Date(),
        })
        .where(eq(formQrCode.id, id))
        .returning();
      return updated;
    });
  }
}

export const storage = new DatabaseStorage();
