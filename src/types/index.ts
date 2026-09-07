// 1. Core Union Types
export type CurrencyCode = 'CHF' | 'USD' | 'EUR' | 'KRW';
export type TargetCurrency = CurrencyCode;
export type ExpenseNature = 'ONE_OFF' | 'RECURRING_MONTHLY' | 'RECURRING_YEARLY';

// 2. Domain Entity: Transaction
export interface Transaction {
  id: string;                         // UUIDv7
  description: string;                // Expense item title (non-empty, max 100)
  transactionTime: string;            // ISO-8601 UTC string (e.g. "2026-09-07T18:30:00.000Z")
  originalAmount: number;             // Original amount (positive float)
  originalCurrency: CurrencyCode;     // Currency code
  category: string;                   // Category (Food, Transport, Housing, etc.)
  expenseNature: ExpenseNature;       // Expense nature / frequency
  createdAt: string;                  // ISO-8601 creation time
  updatedAt: string;                  // ISO-8601 updated time
}

// 3. Domain Entity: Daily Exchange Rate Record
export interface ExchangeRateRecord {
  date: string;                       // YYYY-MM-DD
  baseCurrency: 'KRW';                // Fixed base currency
  rates: Record<CurrencyCode, number>; // Value of 1 foreign unit in KRW (e.g. { CHF: 1550.2, USD: 1380.0, EUR: 1495.0, KRW: 1.0 })
  updatedAt: string;
}

// 4. Dynamically Valuated Transaction (View Model)
export interface ValuatedTransaction extends Transaction {
  convertedAmount: number;            // Converted amount in targetCurrency
  targetCurrency: TargetCurrency;     // Current target currency
  appliedRateDate: string;            // Rate record date applied (for LOCF tracking)
}

// 5. Aggregate View Data Structures
export interface DailyAggregate {
  date: string;                       // YYYY-MM-DD
  totalAmount: number;                // Total amount for date in targetCurrency
  itemCount: number;                  // Number of transactions
  transactions: ValuatedTransaction[];// Detailed transactions for that date
}

export interface AnalyticsBreakdown {
  targetCurrency: TargetCurrency;
  grandTotal: number;
  byCategory: Array<{
    category: string;
    totalAmount: number;
    percentage: number;               // 0.00 ~ 100.00
  }>;
  byNature: Array<{
    nature: ExpenseNature;
    totalAmount: number;
    percentage: number;               // 0.00 ~ 100.00
  }>;
}

// 6. Monthly Budget Domain Entity
export interface MonthlyBudget {
  yearMonth: string;                  // YYYY-MM (e.g. "2026-09")
  totalBudget: number;                // Total budget amount in base targetCurrency
  currency: CurrencyCode;             // Currency the budget was set in
  categoryBudgets?: Record<string, number>; // Optional breakdown per category
  updatedAt: string;
}

// 7. Repository Contracts
export interface ITransactionRepository {
  create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction>;
  createBatch(transactions: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Transaction[]>;
  update(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Transaction>;
  delete(id: string): Promise<void>;
  getByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  getAll(): Promise<Transaction[]>;
}

export interface IExchangeRateRepository {
  getRates(date: string): Promise<ExchangeRateRecord | null>;
  getRatesBatch(dates: string[]): Promise<Record<string, ExchangeRateRecord>>;
  saveRates(record: ExchangeRateRecord): Promise<void>;
  getLatestAvailableRate(targetDate: string): Promise<ExchangeRateRecord | null>;
}

export interface IBudgetRepository {
  getBudget(yearMonth: string): Promise<MonthlyBudget | null>;
  getAllBudgets(): Promise<Record<string, MonthlyBudget>>;
  saveBudget(budget: MonthlyBudget): Promise<void>;
}
