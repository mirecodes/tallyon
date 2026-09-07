import type { Transaction, ITransactionRepository } from '../types';
import { generateUUIDv7 } from '../utils/uuid';
import { toLocalDateString } from '../utils/currency';

const STORAGE_KEY = '@app/transactions';

// Initial realistic demo transactions to give instant value upon first load
const SEED_TRANSACTIONS: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    description: 'Coop Supermarket Groceries',
    transactionTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    originalAmount: 46.50,
    originalCurrency: 'CHF',
    category: 'Living',
    expenseNature: 'ONE_OFF',
  },
  {
    description: 'ZVV Monthly Transit Pass (Zürich)',
    transactionTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    originalAmount: 85.00,
    originalCurrency: 'CHF',
    category: 'Transport',
    expenseNature: 'RECURRING_MONTHLY',
    isFixed: true,
  },
  {
    description: 'Student Studio Rent (ETH Housing)',
    transactionTime: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    originalAmount: 820.00,
    originalCurrency: 'CHF',
    category: 'Housing',
    expenseNature: 'RECURRING_MONTHLY',
    isFixed: true,
  },
  {
    description: 'ChatGPT Plus Subscription',
    transactionTime: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    originalAmount: 20.00,
    originalCurrency: 'USD',
    category: 'Subscriptions',
    expenseNature: 'RECURRING_MONTHLY',
    isFixed: true,
  },
  {
    description: 'Official Document Processing & Translation',
    transactionTime: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    originalAmount: 78000,
    originalCurrency: 'KRW',
    category: 'Administration',
    expenseNature: 'ONE_OFF',
  },
  {
    description: 'Annual Health Checkup & Dental Clinic',
    transactionTime: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    originalAmount: 125.00,
    originalCurrency: 'USD',
    category: 'Health',
    expenseNature: 'RECURRING_YEARLY',
  },
  {
    description: 'Coffee & Croissant at Polyterrasse',
    transactionTime: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    originalAmount: 7.20,
    originalCurrency: 'CHF',
    category: 'Food',
    expenseNature: 'ONE_OFF',
  },
];

export class LocalStorageTransactionRepository implements ITransactionRepository {
  private readStorage(): Transaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Initialize with seed data
        const initialList: Transaction[] = SEED_TRANSACTIONS.map((item) => {
          const now = new Date().toISOString();
          return {
            ...item,
            id: generateUUIDv7(),
            createdAt: now,
            updatedAt: now,
          };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialList));
        return initialList;
      }
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read transactions from LocalStorage:', err);
      return [];
    }
  }

  private writeStorage(data: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to write transactions to LocalStorage:', err);
    }
  }

  async getAll(): Promise<Transaction[]> {
    const list = this.readStorage();
    // Return sorted newest first
    return list.sort((a, b) => new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime());
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const list = await this.getAll();
    return list.filter((t) => {
      const date = toLocalDateString(t.transactionTime);
      return date >= startDate && date <= endDate;
    });
  }

  async create(item: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const list = this.readStorage();
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...item,
      id: generateUUIDv7(),
      createdAt: now,
      updatedAt: now,
    };
    list.push(newTx);
    this.writeStorage(list);
    return newTx;
  }

  async createBatch(items: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Transaction[]> {
    const list = this.readStorage();
    const now = new Date().toISOString();
    const createdList: Transaction[] = items.map((item) => ({
      ...item,
      id: generateUUIDv7(),
      createdAt: now,
      updatedAt: now,
    }));
    list.push(...createdList);
    this.writeStorage(list);
    return createdList;
  }

  async update(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Transaction> {
    const list = this.readStorage();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transaction with ID ${id} not found.`);
    }
    const updated: Transaction = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    this.writeStorage(list);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const list = this.readStorage();
    const filtered = list.filter((t) => t.id !== id);
    this.writeStorage(filtered);
  }
}
