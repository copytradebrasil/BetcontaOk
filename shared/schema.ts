import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  decimal,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  replitId: varchar("replit_id").unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  cpf: varchar("cpf").unique(),
  phone: varchar("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  // Address fields
  cep: varchar("cep"),
  street: varchar("street"),
  number: varchar("number"),
  neighborhood: varchar("neighborhood"),
  city: varchar("city"),
  state: varchar("state"),
  complement: varchar("complement"),
  // Account data
  agency: varchar("agency").default("0001"),
  accountNumber: varchar("account_number"),
  pixKey: varchar("pix_key"),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0.00"),
  // KYC
  kycStatus: varchar("kyc_status").default("pending"), // pending, submitted, verified, rejected
  kycDocumentFront: varchar("kyc_document_front"),
  kycDocumentBack: varchar("kyc_document_back"),
  kycSelfie: varchar("kyc_selfie"),
  kycSubmittedAt: timestamp("kyc_submitted_at"),
  kycVerifiedAt: timestamp("kyc_verified_at"),
  // Account status
  isActive: boolean("is_active").default(true),
  // Affiliate status
  affiliateStatus: varchar("affiliate_status").default("none"), // none, pending, approved, rejected
  affiliateRequestedAt: timestamp("affiliate_requested_at"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Child accounts table
export const childAccounts = pgTable("child_accounts", {
  id: serial("id").primaryKey(),
  parentUserId: integer("parent_user_id").references(() => users.id).notNull(),
  
  // Step 1: Personal Information
  name: varchar("name").notNull(),
  cpf: varchar("cpf").notNull().unique(),
  cpfMask: varchar("cpf_mask").notNull(), // Masked CPF for display
  whatsapp: varchar("whatsapp").notNull(),
  email: varchar("email").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  
  // Step 2: Document and Address Information
  rgNumber: varchar("rg_number").notNull().unique(),
  rgExpeditionDate: timestamp("rg_expedition_date").notNull(),
  rgExpeditionOrgan: varchar("rg_expedition_organ").notNull(),
  rgExpeditionUf: varchar("rg_expedition_uf").notNull(),
  motherName: varchar("mother_name").notNull(),
  
  // Address fields
  cep: varchar("cep").notNull(),
  street: varchar("street").notNull(),
  number: varchar("number").notNull(),
  neighborhood: varchar("neighborhood").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  
  // Account data
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0.00"),
  pixKey: varchar("pix_key"),
  status: varchar("status").default("pending"), // pending, active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PIX transactions table
export const pixTransactions = pgTable("pix_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  childAccountId: integer("child_account_id").references(() => childAccounts.id),
  type: varchar("type").notNull(), // "received", "sent"
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description"),
  counterpartyName: varchar("counterparty_name"),
  counterpartyKey: varchar("counterparty_key"),
  status: varchar("status").default("completed"), // pending, completed, failed
  transactionId: varchar("transaction_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// KYC Documents table - stores all document submissions
export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  masterUserId: integer("master_user_id").notNull().references(() => users.id), // Always the master account owner
  childAccountId: integer("child_account_id").references(() => childAccounts.id), // NULL for master account documents
  accountType: varchar("account_type").notNull(), // 'master' or 'child'
  
  // Document files
  documentFrontPath: varchar("document_front_path").notNull(),
  documentBackPath: varchar("document_back_path").notNull(),
  selfiePath: varchar("selfie_path").notNull(),
  
  // Document info
  documentType: varchar("document_type"), // 'rg', 'cnh', 'passport'
  documentNumber: varchar("document_number"),
  holderName: varchar("holder_name"), // Name on the document
  
  // Status tracking
  status: varchar("status").default("submitted"), // 'submitted', 'under_review', 'approved', 'rejected'
  reviewNotes: text("review_notes"), // Admin notes during review
  
  // Timestamps
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  approvedAt: timestamp("approved_at"),
  
  // Admin who reviewed
  reviewedBy: varchar("reviewed_by"),
});

// Affiliate system tables
export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  affiliateCode: varchar("affiliate_code").unique().notNull(),
  commissionRate: varchar("commission_rate").default("40.00"), // Fixed commission per sale
  totalSales: integer("total_sales").default(0),
  totalCommission: varchar("total_commission").default("0.00"),
  isActive: boolean("is_active").default(true),
  approvalStatus: varchar("approval_status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const affiliateSales = pgTable("affiliate_sales", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  childAccountId: integer("child_account_id").references(() => childAccounts.id).notNull(),
  salePrice: varchar("sale_price").notNull(), // Price charged by affiliate (90-130)
  baseCost: varchar("base_cost").default("90.00"), // Fixed cost
  commission: varchar("commission").notNull(), // Affiliate's profit
  paymentStatus: varchar("payment_status").default("pending"), // 'pending', 'paid'
  createdAt: timestamp("created_at").defaultNow(),
});

export const affiliateSettings = pgTable("affiliate_settings", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  defaultPrice: varchar("default_price").default("120.00"), // Default price for affiliate link
  customMessage: text("custom_message"),
  landingPageEnabled: boolean("landing_page_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Affiliate requests table
export const affiliateRequests = pgTable("affiliate_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  motivation: text("motivation").notNull(),
  experience: text("experience").notNull(),
  expectedVolume: varchar("expected_volume", { length: 50 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System alerts table
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull().default("info"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const qrCodeRequests = pgTable("qr_code_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  requestReason: text("request_reason").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PIX Keys table for managing PIX status
export const pixKeys = pgTable("pix_keys", {
  id: serial("id").primaryKey(),
  childAccountId: integer("child_account_id").notNull().references(() => childAccounts.id),
  pixKey: varchar("pix_key", { length: 255 }).notNull(),
  pixKeyType: varchar("pix_key_type", { length: 50 }).notNull(), // CPF, Email, Aleatória
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  closedAt: timestamp("closed_at"), // When PIX was deactivated (manually or auto-expired)
});

// Form QR Code table for saving QR code form submissions
export const formQrCode = pgTable("form_qr_code", {
  id: serial("id").primaryKey(),
  masterUserId: integer("master_user_id").notNull().references(() => users.id),
  isBettingHouse: varchar("is_betting_house", { length: 10 }).notNull(), // 'sim' or 'nao'
  isChinese: varchar("is_chinese", { length: 10 }).notNull(), // 'sim' or 'nao'
  houseName: varchar("house_name", { length: 255 }).notNull(),
  qrCode: text("qr_code").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // 'pending', 'approved', 'rejected'
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contasExtrato = pgTable("contas_extrato", {
  id: serial("id").primaryKey(),
  masterUserId: integer("master_user_id").notNull().references(() => users.id),
  childAccountId: integer("child_account_id").notNull().references(() => childAccounts.id),
  codTransacao: varchar("cod_transacao", { length: 255 }).notNull(),
  cod2e2: varchar("cod_2e2", { length: 255 }).notNull(),
  dataHora: timestamp("data_hora").notNull(),
  descricao: text("descricao"),
  destinatario: varchar("destinatario", { length: 255 }),
  destinatarioCpf: varchar("destinatario_cpf", { length: 14 }),
  origem: varchar("origem", { length: 255 }),
  origemCpf: varchar("origem_cpf", { length: 14 }),
  valor: varchar("valor", { length: 50 }).notNull(),
  saldoAnterior: varchar("saldo_anterior", { length: 50 }).notNull(),
  saldoPosterior: varchar("saldo_posterior", { length: 50 }).notNull(),
  tipo: varchar("tipo", { length: 10 }).notNull(), // debit ou credit
  categoria: varchar("categoria", { length: 10 }).notNull(), // PIX ou TEV
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const depositoQrcode = pgTable("deposito_qrcode", {
  id: serial("id").primaryKey(),
  masterUserId: integer("master_user_id").notNull().references(() => users.id),
  childAccountId: integer("child_account_id").notNull().references(() => childAccounts.id),
  qrcode: text("qrcode").notNull(),
  dataHora: timestamp("data_hora").notNull(),
  hashInterno: varchar("hash_interno", { length: 255 }),
  status: integer("status").default(0), // 0 ou 1
  valor: varchar("valor", { length: 50 }).notNull(),
  chave: varchar("chave", { length: 255 }),
  transfFilha: timestamp("transf_filha"),
  retornoTransf: text("retorno_transf"),
  processada: timestamp("processada"),
  retornoQr: text("retorno_qr"),
  codTransacao: varchar("cod_transacao", { length: 255 }),
  acDocument: varchar("ac_document", { length: 20 }),
  acName: varchar("ac_name", { length: 255 }),
  acType: varchar("ac_type", { length: 2 }), // PJ ou PF
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertChildAccount = typeof childAccounts.$inferInsert;
export type ChildAccount = typeof childAccounts.$inferSelect;

export type InsertPixTransaction = typeof pixTransactions.$inferInsert;
export type PixTransaction = typeof pixTransactions.$inferSelect;

export type InsertKycDocument = typeof kycDocuments.$inferInsert;
export type KycDocument = typeof kycDocuments.$inferSelect;

export type InsertAffiliate = typeof affiliates.$inferInsert;
export type Affiliate = typeof affiliates.$inferSelect;

export type InsertAffiliateSale = typeof affiliateSales.$inferInsert;
export type AffiliateSale = typeof affiliateSales.$inferSelect;

export type InsertAffiliateSettings = typeof affiliateSettings.$inferInsert;
export type AffiliateSettings = typeof affiliateSettings.$inferSelect;

export type InsertAffiliateRequest = typeof affiliateRequests.$inferInsert;
export type AffiliateRequest = typeof affiliateRequests.$inferSelect;

export type InsertSystemAlert = typeof systemAlerts.$inferInsert;
export type SystemAlert = typeof systemAlerts.$inferSelect;

export type InsertQrCodeRequest = typeof qrCodeRequests.$inferInsert;
export type QrCodeRequest = typeof qrCodeRequests.$inferSelect;

export type InsertPixKey = typeof pixKeys.$inferInsert;
export type PixKey = typeof pixKeys.$inferSelect;

export type InsertFormQrCode = typeof formQrCode.$inferInsert;
export type FormQrCode = typeof formQrCode.$inferSelect;

export type InsertContasExtrato = typeof contasExtrato.$inferInsert;
export type ContasExtrato = typeof contasExtrato.$inferSelect;

export type InsertDepositoQrcode = typeof depositoQrcode.$inferInsert;
export type DepositoQrcode = typeof depositoQrcode.$inferSelect;

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  cpf: true,
  phone: true,
  dateOfBirth: true,
  cep: true,
  street: true,
  number: true,
  neighborhood: true,
  city: true,
  state: true,
  complement: true,
}).extend({
  dateOfBirth: z.string().min(1, "Data de nascimento é obrigatória"),
});

export const insertChildAccountSchema = createInsertSchema(childAccounts).pick({
  name: true,
  cpfMask: true,
});

export const insertPixTransactionSchema = createInsertSchema(pixTransactions).pick({
  type: true,
  amount: true,
  description: true,
  counterpartyName: true,
  counterpartyKey: true,
  childAccountId: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  dateOfBirth: true,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});
