import React, { useState } from 'react';
import type { TargetCurrency, Transaction, ValuatedTransaction } from './types';
import { useTransactions } from './hooks/useTransactions';
import { useExchangeRates } from './hooks/useExchangeRates';
import { useValuationEngine } from './hooks/useValuationEngine';

import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { CalendarMatrixView } from './components/CalendarMatrixView';
import { FilteredListView } from './components/FilteredListView';
import { BreakdownAnalyticsView } from './components/BreakdownAnalyticsView';
import { ExpenseModal } from './components/ExpenseModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'transactions' | 'analytics'>('dashboard');
  const [targetCurrency, setTargetCurrency] = useState<TargetCurrency>('CHF');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Hook 1: Data storage layer
  const { transactions, addTransactionsBatch, editTransaction, removeTransaction } = useTransactions();

  // Hook 2: Exchange rates sync and prefetching
  const { ratesMap } = useExchangeRates(transactions);

  // Hook 3: Real-time dynamic valuation engine
  const { valuatedList, calendarMap, breakdown } = useValuationEngine(transactions, ratesMap, targetCurrency);

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx: ValuatedTransaction) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  const handleBatchSubmit = async (items: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await addTransactionsBatch(items);
  };

  const handleUpdateSingle = async (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    await editTransaction(id, updates);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        targetCurrency={targetCurrency}
        setTargetCurrency={setTargetCurrency}
        onOpenNewModal={handleOpenAddModal}
      />

      {/* Main Container */}
      <main style={{ flex: 1, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="container">
          {/* Always Display Key Metric KPI Overview */}
          <MetricCards
            breakdown={breakdown}
            targetCurrency={targetCurrency}
            totalTransactionsCount={transactions.length}
          />

          {/* Tab Views */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Top View: Breakdown Analytics */}
              <BreakdownAnalyticsView breakdown={breakdown} targetCurrency={targetCurrency} />

              {/* Bottom View: Recent Transactions List */}
              <FilteredListView
                transactions={valuatedList}
                targetCurrency={targetCurrency}
                onEdit={handleOpenEditModal}
                onDelete={removeTransaction}
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <CalendarMatrixView
              calendarMap={calendarMap}
              targetCurrency={targetCurrency}
              onSelectTransaction={handleOpenEditModal}
            />
          )}

          {activeTab === 'transactions' && (
            <FilteredListView
              transactions={valuatedList}
              targetCurrency={targetCurrency}
              onEdit={handleOpenEditModal}
              onDelete={removeTransaction}
            />
          )}

          {activeTab === 'analytics' && (
            <BreakdownAnalyticsView breakdown={breakdown} targetCurrency={targetCurrency} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-primary)',
          padding: '1.25rem 0',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
        }}
      >
        <div className="container">
          Tallyon Multi-Currency Expense Tracker • Built with React 19, TypeScript & Repository Architecture
        </div>
      </footer>

      {/* Expense Add / Edit Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitBatch={handleBatchSubmit}
        editingTransaction={editingTx}
        onUpdateSingle={handleUpdateSingle}
      />
    </div>
  );
};

export default App;
