import React, { useState } from 'react';
import type { TargetCurrency, Transaction, ValuatedTransaction } from './types';
import { useTransactions } from './hooks/useTransactions';
import { useExchangeRates } from './hooks/useExchangeRates';
import { useValuationEngine } from './hooks/useValuationEngine';
import { useBudgets } from './hooks/useBudgets';

import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { FloatingAddButton } from './components/FloatingAddButton';
import { MetricCards } from './components/MetricCards';
import { CalendarMatrixView } from './components/CalendarMatrixView';
import { FilteredListView } from './components/FilteredListView';
import { BreakdownAnalyticsView } from './components/BreakdownAnalyticsView';
import { BudgetPlanningView } from './components/BudgetPlanningView';
import { ExpenseModal } from './components/ExpenseModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { STATIC_FALLBACK_RATES } from './repositories/LocalStorageExchangeRateRepository';
import { toLocalDateString } from './utils/currency';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'transactions' | 'analytics' | 'budget'>('dashboard');
  const [targetCurrency, setTargetCurrency] = useState<TargetCurrency>('KRW');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Global Month Filter: YYYY-MM (e.g. "2026-09") or "ALL"
  const now = new Date();
  const defaultYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(defaultYM);

  // Hook 1: Data storage layer
  const { transactions, addTransactionsBatch, editTransaction, removeTransaction } = useTransactions();

  // Hook 2: Exchange rates sync and prefetching
  const { ratesMap } = useExchangeRates(transactions);

  // Filter transactions by selected month (including persistent fixed expenses carryover)
  const scopedTransactions = React.useMemo(() => {
    if (selectedYearMonth === 'ALL') {
      return transactions;
    }

    // 1. Transactions originally recorded in this month
    const originalThisMonth = transactions.filter((tx) => {
      const txLocalDate = toLocalDateString(tx.transactionTime);
      // If it originated this month, check if it wasn't stopped from this month
      if (tx.stoppedAfterMonth && selectedYearMonth >= tx.stoppedAfterMonth) {
        return false;
      }
      return txLocalDate.startsWith(selectedYearMonth);
    });

    // 2. Fixed recurring expenses originating from prior months that should carry over
    // (A fixed expense created in month M carries over to all months >= M until stoppedAfterMonth)
    const fixedCarriedOver: Transaction[] = [];

    // Find all monthly recurring fixed expenses created in earlier months
    for (const tx of transactions) {
      if (tx.expenseNature === 'RECURRING_MONTHLY' || (tx.isFixed && tx.expenseNature !== 'RECURRING_YEARLY' && tx.expenseNature !== 'ONE_OFF')) {
        // If it was stopped in or before selectedYearMonth, don't carry over
        if (tx.stoppedAfterMonth && selectedYearMonth >= tx.stoppedAfterMonth) {
          continue;
        }

        const txLocalDate = toLocalDateString(tx.transactionTime);
        const originYearMonth = txLocalDate.slice(0, 7);

        // If origin is strictly before selectedYearMonth
        if (originYearMonth < selectedYearMonth) {
          // Robust Lineage Check:
          // Check if there is already an explicit transaction in this month that represents this fixed commitment:
          // 1) Same transaction ID
          // 2) Has parentFixedId linking to this transaction's ID or its root lineage
          // 3) Or this transaction has a parentFixedId and the existing has matching parentFixedId
          // 4) Or matching description
          const alreadyExists = originalThisMonth.some(
            (existing) =>
              existing.id === tx.id ||
              existing.parentFixedId === tx.id ||
              (tx.parentFixedId && existing.parentFixedId === tx.parentFixedId) ||
              (tx.parentFixedId && existing.id === tx.parentFixedId) ||
              existing.description.toLowerCase().trim() === tx.description.toLowerCase().trim()
          );

          if (!alreadyExists) {
            // Also ensure we don't project multiple times if transactions array has updated descendant lineage
            const alreadyCarried = fixedCarriedOver.some(
              (c) =>
                c.parentFixedId === tx.id ||
                (tx.parentFixedId && c.parentFixedId === tx.parentFixedId) ||
                c.description.toLowerCase().trim() === tx.description.toLowerCase().trim()
            );

            if (!alreadyCarried) {
              // Project the fixed transaction into the selected month on the same day of month
              const originDay = txLocalDate.slice(8, 10);
              const projectedDate = `${selectedYearMonth}-${originDay}`;
              fixedCarriedOver.push({
                ...tx,
                id: `fixed-${tx.id}-${selectedYearMonth}`,
                parentFixedId: tx.parentFixedId || tx.id,
                transactionTime: `${projectedDate}T12:00:00.000Z`,
                isFixed: true,
                isAutoGenerated: true,
              });
            }
          }
        }
      }
    }

    return [...originalThisMonth, ...fixedCarriedOver].sort(
      (a, b) => new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime()
    );
  }, [transactions, selectedYearMonth]);

  // Hook 3: Real-time dynamic valuation engine on scoped transactions
  const { valuatedList, calendarMap, breakdown } = useValuationEngine(scopedTransactions, ratesMap, targetCurrency);

  // Hook 4: Budget planning storage
  const { budgetsMap, updateBudget, budgetStartMonth, setBudgetStartMonth } = useBudgets();

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

  // Handler to update a single transaction
  // If editing a projected recurring transaction from a previous month:
  // - Instead of modifying the origin transaction from past months, save it as an INDEPENDENT transaction in the current month!
  // - Link parentFixedId so that recurring projection knows this slot is already occupied and prevents duplicates even if title or date changes.
  const handleUpdateSingle = async (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    const isProjected = id.startsWith('fixed-') || editingTx?.isAutoGenerated;
    const originId = editingTx?.parentFixedId || (id.startsWith('fixed-') ? id.replace(/^fixed-/, '').replace(/-[0-9]{4}-[0-9]{2}$/, '') : null);

    if (isProjected && originId) {
      // Find original transaction to inherit any missing properties if needed
      const originTx = transactions.find((t) => t.id === originId);
      
      // Create as an independent transaction in the database
      const newIndependentTx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        description: updates.description ?? originTx?.description ?? 'Fixed Expense',
        originalAmount: updates.originalAmount ?? originTx?.originalAmount ?? 0,
        originalCurrency: updates.originalCurrency ?? originTx?.originalCurrency ?? 'CHF',
        category: updates.category ?? originTx?.category ?? 'Other',
        expenseNature: updates.expenseNature ?? originTx?.expenseNature ?? 'RECURRING_MONTHLY',
        isFixed: updates.isFixed ?? true,
        isCash: updates.isCash ?? originTx?.isCash ?? false,
        transactionTime: updates.transactionTime ?? editingTx?.transactionTime ?? new Date().toISOString(),
        parentFixedId: originId, // Keeps the lineage link to origin for robust duplicate suppression
      };

      await addTransactionsBatch([newIndependentTx]);
      return;
    }

    // Normal direct transaction update
    await editTransaction(id, updates);
  };

  // Handler to delete or stop recurring transaction from list views
  const handleRemoveOrStopTransaction = async (id: string) => {
    // Check if this is a projected recurring transaction (virtual ID: fixed-{originId}-{month})
    if (id.startsWith('fixed-')) {
      const originId = id.replace(/^fixed-/, '').replace(/-[0-9]{4}-[0-9]{2}$/, '');
      const activeMonth = selectedYearMonth === 'ALL' ? defaultYM : selectedYearMonth;
      const originTx = transactions.find((t) => t.id === originId);
      if (originTx) {
        const originLocalDate = toLocalDateString(originTx.transactionTime);
        const originYearMonth = originLocalDate.slice(0, 7);
        if (originYearMonth === activeMonth) {
          await removeTransaction(originTx.id);
        } else {
          await editTransaction(originTx.id, { stoppedAfterMonth: activeMonth });
        }
        return;
      }
    }

    // If it's a real transaction in the DB
    const realTx = transactions.find((t) => t.id === id);
    if (realTx && realTx.isFixed) {
      const activeMonth = selectedYearMonth === 'ALL' ? defaultYM : selectedYearMonth;
      const originLocalDate = toLocalDateString(realTx.transactionTime);
      const originYearMonth = originLocalDate.slice(0, 7);

      // If originated in an earlier month, stop it from recurring instead of deleting past records
      if (originYearMonth < activeMonth) {
        await editTransaction(realTx.id, { stoppedAfterMonth: activeMonth });
        return;
      }
    }

    await removeTransaction(id);
  };

  // Handler to stop or delete a recurring fixed expense starting from selectedYearMonth onward (for Budget view)
  const handleStopFixedExpense = async (tx: ValuatedTransaction) => {
    const originId = tx.parentFixedId || tx.id;
    const originTx = transactions.find((t) => t.id === originId);

    const activeMonth = selectedYearMonth === 'ALL' ? defaultYM : selectedYearMonth;

    if (!originTx) {
      // If directly in transactions list
      await removeTransaction(tx.id);
      return;
    }

    const originLocalDate = toLocalDateString(originTx.transactionTime);
    const originYearMonth = originLocalDate.slice(0, 7);

    // If the user deletes it in the very month it originated, completely delete the transaction
    if (originYearMonth === activeMonth) {
      await removeTransaction(originTx.id);
    } else {
      // Otherwise, set stoppedAfterMonth so it stops recurring from activeMonth onward
      await editTransaction(originTx.id, {
        stoppedAfterMonth: activeMonth,
      });
    }
  };

  // Compute selected month's budget in targetCurrency
  const activeYM = selectedYearMonth === 'ALL' ? defaultYM : selectedYearMonth;
  const currentBudgetRecord = budgetsMap[activeYM];
  const rateRecord = ratesMap[`${activeYM}-01`] || ratesMap[Object.keys(ratesMap)[0]] || STATIC_FALLBACK_RATES;
  const rates = rateRecord.rates;

  let currentMonthlyBudgetInTarget: number | undefined = undefined;

  if (currentBudgetRecord) {
    const totalAmount = (currentBudgetRecord.baseBudget ?? currentBudgetRecord.totalBudget ?? 3000000) + (currentBudgetRecord.extraBudget ?? 0);
    const budgetInKrw =
      currentBudgetRecord.currency === 'KRW'
        ? totalAmount
        : totalAmount * (rates[currentBudgetRecord.currency] || STATIC_FALLBACK_RATES.rates[currentBudgetRecord.currency]);
    
    currentMonthlyBudgetInTarget =
      targetCurrency === 'KRW'
        ? Math.round(budgetInKrw)
        : Number((budgetInKrw / (rates[targetCurrency] || STATIC_FALLBACK_RATES.rates[targetCurrency] || 1)).toFixed(2));
  } else {
    // Default fallback monthly budget in target currency
    currentMonthlyBudgetInTarget =
      targetCurrency === 'CHF' ? 2000 : targetCurrency === 'USD' ? 2200 : targetCurrency === 'EUR' ? 2100 : 3000000;
  }

  // Cumulative budget calculation from budgetStartMonth up to current month (defaultYM)
  const cumulativeBudgetInfo = React.useMemo(() => {
    // Determine start and end year-months
    const [sY, sM] = (budgetStartMonth || `${now.getFullYear()}-01`).split('-').map(Number);
    const [eY, eM] = defaultYM.split('-').map(Number);

    let start = new Date(sY, sM - 1, 1);
    const end = new Date(eY, eM - 1, 1);

    // If start is ahead of end, clamp start to end
    if (start > end) {
      start = new Date(end);
    }

    const months: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      const ym = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
      months.push(ym);
      curr.setMonth(curr.getMonth() + 1);
    }

    let totalCumulativeBudget = 0;

    for (const m of months) {
      const mBudget = budgetsMap[m];
      const mRatesRecord = ratesMap[`${m}-01`] || ratesMap[Object.keys(ratesMap)[0]] || STATIC_FALLBACK_RATES;
      const mRates = mRatesRecord.rates;

      if (mBudget) {
        const totalAmount = (mBudget.baseBudget ?? mBudget.totalBudget ?? 3000000) + (mBudget.extraBudget ?? 0);
        const budgetInKrw =
          mBudget.currency === 'KRW'
            ? totalAmount
            : totalAmount * (mRates[mBudget.currency] || STATIC_FALLBACK_RATES.rates[mBudget.currency] || 1);
        const inTarget =
          targetCurrency === 'KRW'
            ? Math.round(budgetInKrw)
            : Number((budgetInKrw / (mRates[targetCurrency] || STATIC_FALLBACK_RATES.rates[targetCurrency] || 1)).toFixed(2));
        totalCumulativeBudget += inTarget;
      } else {
        const fallbackDefault =
          targetCurrency === 'CHF' ? 2000 : targetCurrency === 'USD' ? 2200 : targetCurrency === 'EUR' ? 2100 : 3000000;
        totalCumulativeBudget += fallbackDefault;
      }
    }

    const totalActualSpent = breakdown.grandTotal;
    const remainingOrOverAmount = totalCumulativeBudget - totalActualSpent;
    const isOverBudget = totalActualSpent > totalCumulativeBudget;
    const percentageUsed = totalCumulativeBudget > 0 ? Math.round((totalActualSpent / totalCumulativeBudget) * 100) : 0;

    return {
      startYearMonth: months[0] || budgetStartMonth,
      currentYearMonth: defaultYM,
      monthsCount: months.length,
      totalCumulativeBudget: Math.round(totalCumulativeBudget * 100) / 100,
      totalActualSpent: Math.round(totalActualSpent * 100) / 100,
      remainingOrOverAmount: Math.round(remainingOrOverAmount * 100) / 100,
      isOverBudget,
      percentageUsed,
    };
  }, [budgetStartMonth, defaultYM, budgetsMap, ratesMap, targetCurrency, breakdown.grandTotal, now]);

  // Auto-calculated Fixed Budget and Flexible Budget
  const currentFixedBudgetInTarget = breakdown.fixedTotal;
  const currentFlexibleBudgetInTarget = Math.max(0, currentMonthlyBudgetInTarget - currentFixedBudgetInTarget);

  // Active fixed expenses list for this month
  const activeFixedExpenses = React.useMemo(() => {
    return valuatedList.filter((tx) => tx.isFixed || tx.expenseNature === 'RECURRING_MONTHLY');
  }, [valuatedList]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky App Header: Clean & Minimal */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main style={{ flex: 1, paddingTop: '1.25rem', paddingBottom: '3rem' }}>
        <div className="container">
          {/* Top Control Bar: Month Navigator (Prev/Next/This Month/All) & Currency Selector */}
          <ControlBar
            selectedYearMonth={selectedYearMonth}
            setSelectedYearMonth={setSelectedYearMonth}
            targetCurrency={targetCurrency}
            setTargetCurrency={setTargetCurrency}
          />

          {/* Always Display Key Metric KPI Overview with Fixed/Flexible budget analysis */}
          <MetricCards
            breakdown={breakdown}
            targetCurrency={targetCurrency}
            totalTransactionsCount={scopedTransactions.length}
            monthlyBudget={currentMonthlyBudgetInTarget}
            fixedBudget={currentFixedBudgetInTarget}
            flexibleBudget={currentFlexibleBudgetInTarget}
            onGoToBudget={() => setActiveTab('budget')}
            isAllView={selectedYearMonth === 'ALL'}
            cumulativeBudgetInfo={cumulativeBudgetInfo}
          />

          {/* Tab Views */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Top View: Breakdown Analytics */}
              <BreakdownAnalyticsView
                breakdown={breakdown}
                targetCurrency={targetCurrency}
                monthlyBudget={currentMonthlyBudgetInTarget}
                isAllView={selectedYearMonth === 'ALL'}
                cumulativeBudgetInfo={cumulativeBudgetInfo}
                onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
              />

              {/* Bottom View: Recent Transactions List */}
              <FilteredListView
                transactions={valuatedList}
                targetCurrency={targetCurrency}
                onEdit={handleOpenEditModal}
                onDelete={handleRemoveOrStopTransaction}
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <CalendarMatrixView
              calendarMap={calendarMap}
              targetCurrency={targetCurrency}
              onSelectTransaction={handleOpenEditModal}
              selectedYearMonth={selectedYearMonth}
              onMonthChange={setSelectedYearMonth}
            />
          )}

          {activeTab === 'transactions' && (
            <FilteredListView
              transactions={valuatedList}
              targetCurrency={targetCurrency}
              onEdit={handleOpenEditModal}
              onDelete={handleRemoveOrStopTransaction}
            />
          )}

          {activeTab === 'analytics' && (
            <BreakdownAnalyticsView
              breakdown={breakdown}
              targetCurrency={targetCurrency}
              monthlyBudget={currentMonthlyBudgetInTarget}
              isAllView={selectedYearMonth === 'ALL'}
              cumulativeBudgetInfo={cumulativeBudgetInfo}
              onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetPlanningView
              budgetsMap={budgetsMap}
              onSaveBudget={updateBudget}
              ratesMap={ratesMap}
              targetCurrency={targetCurrency}
              breakdown={breakdown}
              selectedYearMonth={selectedYearMonth}
              onMonthChange={setSelectedYearMonth}
              fixedTransactions={activeFixedExpenses}
              onStopFixedExpense={handleStopFixedExpense}
              budgetStartMonth={budgetStartMonth}
              onBudgetStartMonthChange={setBudgetStartMonth}
              isAllView={selectedYearMonth === 'ALL'}
              cumulativeBudgetInfo={cumulativeBudgetInfo}
              onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            />
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

      {/* Floating Pencil Add Expense Button (Bottom-Right) */}
      <FloatingAddButton onClick={handleOpenAddModal} />

      {/* Expense Add / Edit Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitBatch={handleBatchSubmit}
        editingTransaction={editingTx}
        onUpdateSingle={handleUpdateSingle}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        existingTransactions={transactions}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};

export default App;
