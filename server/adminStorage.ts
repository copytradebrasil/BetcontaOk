import { db } from "./db";
import { users, childAccounts, pixTransactions, kycDocuments } from "@shared/schema";
import { eq, count, sum, sql } from "drizzle-orm";

export interface AdminDashboardStats {
  masterAccounts: number;
  childAccounts: number;
  kycPending: number;
  kycApproved: number;
  kycRejected: number;
  pixInCount: number;
  pixInTotal: string;
  pixOutCount: number;
  pixOutTotal: string;
  paidChildAccounts: string;
  pendingChildAccounts: string;
}

export class AdminStorage {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      // Get all data and count in JavaScript
      const allUsers = await db.select().from(users);
      const allChildAccounts = await db.select().from(childAccounts);
      const allPixTransactions = await db.select().from(pixTransactions);
      const allKycDocuments = await db.select().from(kycDocuments);

      // Count master accounts
      const masterAccounts = allUsers.length;

      // Count child accounts
      const childAccountsCount = allChildAccounts.length;

      // Count KYC statuses from child_accounts table (this is the real status)
      const kycPending = allChildAccounts.filter(account => account.status === 'pending').length;
      const kycApproved = allChildAccounts.filter(account => account.status === 'approved').length;
      const kycRejected = allChildAccounts.filter(account => account.status === 'rejected').length;

      // Count PIX transactions
      const pixInTransactions = allPixTransactions.filter(tx => tx.type === 'deposit');
      const pixOutTransactions = allPixTransactions.filter(tx => tx.type === 'withdrawal');

      const pixInCount = pixInTransactions.length;
      const pixOutCount = pixOutTransactions.length;

      // Calculate totals
      const pixInTotal = pixInTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0).toFixed(2);
      const pixOutTotal = pixOutTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0).toFixed(2);

      // Calculate paid and pending child accounts (R$ 90 each)
      // Using KYC documents status for calculations
      const paidChildAccounts = (kycApproved * 90).toFixed(2);
      const pendingChildAccounts = (kycPending * 90).toFixed(2);

      return {
        masterAccounts,
        childAccounts: childAccountsCount,
        kycPending,
        kycApproved,
        kycRejected,
        pixInCount,
        pixInTotal,
        pixOutCount,
        pixOutTotal,
        paidChildAccounts,
        pendingChildAccounts,
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      // Return default values if query fails
      return {
        masterAccounts: 0,
        childAccounts: 0,
        kycPending: 0,
        kycApproved: 0,
        kycRejected: 0,
        pixInCount: 0,
        pixInTotal: '0.00',
        pixOutCount: 0,
        pixOutTotal: '0.00',
        paidChildAccounts: '0.00',
        pendingChildAccounts: '0.00',
      };
    }
  }

  async getMasterAccounts() {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Error fetching master accounts:", error);
      return [];
    }
  }

  async getChildAccounts() {
    try {
      return await db.select().from(childAccounts);
    } catch (error) {
      console.error("Error fetching child accounts:", error);
      return [];
    }
  }

  async getPixTransactions() {
    try {
      return await db.select().from(pixTransactions);
    } catch (error) {
      console.error("Error fetching PIX transactions:", error);
      return [];
    }
  }

  async getKycDocuments() {
    try {
      return await db.select().from(kycDocuments);
    } catch (error) {
      console.error("Error fetching KYC documents:", error);
      return [];
    }
  }
}

export const adminStorage = new AdminStorage();