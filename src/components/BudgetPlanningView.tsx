import React, { useState } from 'react';
import type { TargetCurrency, MonthlyBudget, ExchangeRateRecord, AnalyticsBreakdown, ValuatedTransaction } from '../types';
import { formatCurrency } from '../utils/currency';
import { STATIC_FALLBACK_RATES } from '../repositories/LocalStorageExchangeRateRepository';
import { ChevronLeft, ChevronRight, Save, Check, Trash2, Calendar, Lock, Sliders, ShieldCheck } from 'lucide-react';

interface BudgetPlanningViewProps {
  budgetsMap: Record<string, MonthlyBudget>;
  onSaveBudget: (budget: MonthlyBudget) => Promise<void>;
  ratesMap: Record<string, ExchangeRateRecord>;
  targetCurrency: TargetCurrency;
  breakdown: AnalyticsBreakdown;
  selectedYearMonth?: string;
  onMonthChange?: (ym: string) => void;
  fixedTransactions?: ValuatedTransaction[];
  onStopFixedExpense?: (tx: ValuatedTransaction) => Promise<void>;
}

export const BudgetPlanningView: React.FC<BudgetPlanningViewProps> = ({
  budgetsMap,
  onSaveBudget,
  ratesMap,
  targetCurrency,
  breakdown,
  selectedYearMonth: externalYearMonth,
  onMonthChange,
  fixedTransactions = [],
  onStopFixedExpense,
}) => {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [internalYearMonth, setInternalYearMonth] = useState<string>(currentYM);

  const selectedYearMonth =
    externalYearMonth && externalYearMonth !== 'ALL' ? externalYearMonth : internalYearMonth;

  const setSelectedYearMonth = (ym: string) => {
    setInternalYearMonth(ym);
    onMonthChange?.(ym);
  };

  const [savedNotice, setSavedNotice] = useState(false);

  // Month navigation
  const [yearStr, monthStr] = selectedYearMonth.split('-');
  const currentYear = parseInt(yearStr, 10);
  const currentMonth = parseInt(monthStr, 10);

  const prevMonth = () => {
    const d = new Date(currentYear, currentMonth - 2, 1);
    setSelectedYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const d = new Date(currentYear, currentMonth, 1);
    setSelectedYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Raw budget record
  const rawBudget: MonthlyBudget = budgetsMap[selectedYearMonth] || {
    yearMonth: selectedYearMonth,
    baseBudget: 3000000,
    extraBudget: 0,
    totalBudget: 3000000,
    currency: 'KRW',
    updatedAt: new Date().toISOString(),
  };

  const latestRateRecord =
    ratesMap[`${selectedYearMonth}-01`] || ratesMap[Object.keys(ratesMap)[0]] || STATIC_FALLBACK_RATES;
  const rates = latestRateRecord.rates;

  // Convert raw base and extra budget to targetCurrency
  const convertToTarget = (amount: number, fromCurrency: string) => {
    const inKrw =
      fromCurrency === 'KRW'
        ? amount
        : amount * (rates[fromCurrency as keyof typeof rates] || STATIC_FALLBACK_RATES.rates[fromCurrency as keyof typeof rates] || 1);
    return targetCurrency === 'KRW'
      ? Math.round(inKrw)
      : Number((inKrw / (rates[targetCurrency] || STATIC_FALLBACK_RATES.rates[targetCurrency] || 1)).toFixed(2));
  };

  const convertedBaseBudget = convertToTarget(rawBudget.baseBudget ?? rawBudget.totalBudget ?? 3000000, rawBudget.currency);
  const convertedExtraBudget = convertToTarget(rawBudget.extraBudget ?? 0, rawBudget.currency);

  // Local input state in targetCurrency
  const [inputBase, setInputBase] = useState<string>(convertedBaseBudget.toString());
  const [inputExtra, setInputExtra] = useState<string>(convertedExtraBudget.toString());

  React.useEffect(() => {
    setInputBase(convertedBaseBudget.toString());
    setInputExtra(convertedExtraBudget.toString());
  }, [selectedYearMonth, targetCurrency, convertedBaseBudget, convertedExtraBudget]);

  // Derived Total Monthly Budget
  const numBase = parseFloat(inputBase) || 0;
  const numExtra = parseFloat(inputExtra) || 0;
  const computedTotalBudget = numBase + numExtra;

  // Auto-calculated Fixed Budget from active fixed expenses in this month
  const autoFixedBudget = breakdown.fixedTotal;
  const autoFlexibleBudget = Math.max(0, computedTotalBudget - autoFixedBudget);

  const fixedRatio = computedTotalBudget > 0 ? Math.round((autoFixedBudget / computedTotalBudget) * 100) : 0;
  const flexibleRatio = computedTotalBudget > 0 ? Math.max(0, 100 - fixedRatio) : 0;

  // Actual spending stats
  const actualSpent = breakdown.grandTotal;
  const remainingBudget = computedTotalBudget - actualSpent;
  const usagePercentage = computedTotalBudget > 0 ? Math.round((actualSpent / computedTotalBudget) * 100) : 0;
  const isOverBudget = usagePercentage > 100;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedBudget: MonthlyBudget = {
      yearMonth: selectedYearMonth,
      baseBudget: numBase,
      extraBudget: numExtra,
      totalBudget: computedTotalBudget,
      fixedBudget: autoFixedBudget,
      flexibleBudget: autoFlexibleBudget,
      currency: targetCurrency,
      updatedAt: new Date().toISOString(),
    };

    await onSaveBudget(updatedBudget);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const monthDate = new Date(currentYear, currentMonth - 1, 1);
  const monthLabel = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Header & Month Navigator */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
              Monthly Budget Planning — <span style={{ color: 'var(--primary-blue)' }}>{monthLabel}</span>
            </h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Manage base budget, extra adjustments, and recurring fixed expenses in <strong>{targetCurrency}</strong>.
            </div>
          </div>

          {/* Month Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={prevMonth}
              className="btn-secondary"
              style={{ padding: '6px 12px' }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                minWidth: 100,
                textAlign: 'center',
              }}
            >
              {selectedYearMonth}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="btn-secondary"
              style={{ padding: '6px 12px' }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Total Monthly Budget */}
        <div className="card">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Total Monthly Budget
          </span>
          <div
            className="tabular-nums"
            style={{ fontSize: '1.625rem', fontWeight: 800, marginTop: 4, color: 'var(--primary-blue)' }}
          >
            {formatCurrency(computedTotalBudget, targetCurrency)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Base ({formatCurrency(numBase, targetCurrency)}) {numExtra >= 0 ? '+' : '-'} Extra ({formatCurrency(Math.abs(numExtra), targetCurrency)})
          </div>
        </div>

        {/* Current Spending */}
        <div className="card">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Current Total Spent
          </span>
          <div
            className="tabular-nums"
            style={{ fontSize: '1.625rem', fontWeight: 800, marginTop: 4, color: 'var(--expense-rose)' }}
          >
            {formatCurrency(actualSpent, targetCurrency)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {usagePercentage}% of total monthly budget
          </div>
        </div>

        {/* Remaining / Overbudget */}
        <div className="card">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Remaining Capacity
          </span>
          <div
            className="tabular-nums"
            style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              marginTop: 4,
              color: isOverBudget ? 'var(--expense-rose)' : 'var(--income-emerald)',
            }}
          >
            {isOverBudget ? '-' : ''}
            {formatCurrency(Math.abs(remainingBudget), targetCurrency)}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: isOverBudget ? 'var(--expense-rose)' : 'var(--income-emerald)',
              marginTop: 4,
            }}
          >
            {isOverBudget ? 'Budget exceeded' : 'Within planned limits'}
          </div>
        </div>
      </div>

      {/* 3. Budget Inputs & Automatic Allocation Breakdown */}
      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: '1.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.125rem', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={18} color="var(--primary-blue)" /> Monthly Budget Configuration
              </h3>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Enter your base budget and positive or negative extra adjustments. Fixed and flexible shares calculate automatically.
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                backgroundColor: savedNotice ? 'var(--income-emerald)' : 'var(--primary-blue)',
              }}
            >
              {savedNotice ? <Check size={16} /> : <Save size={16} />}
              <span>{savedNotice ? 'Saved!' : 'Save Budget'}</span>
            </button>
          </div>

          {/* Base Budget & Extra Budget Inputs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            {/* Base Monthly Budget */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 12,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                Monthly Base Budget ({targetCurrency}) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  step="0.01"
                  value={inputBase}
                  onChange={(e) => setInputBase(e.target.value)}
                  placeholder="e.g. 3000000"
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    width: '100%',
                    padding: '8px 12px',
                  }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {targetCurrency}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Your regular recurring monthly budget baseline.
              </div>
            </div>

            {/* Extra Budget (+/-) */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 12,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}
              >
                Extra Budget Adjustment (+ / -)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  step="0.01"
                  value={inputExtra}
                  onChange={(e) => setInputExtra(e.target.value)}
                  placeholder="e.g. 200000 or -150000"
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    width: '100%',
                    padding: '8px 12px',
                  }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {targetCurrency}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Bonus, special allowance (+), or savings deduction (-).
              </div>
            </div>
          </div>

          {/* Automatic Fixed vs Flexible Calculation Display */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 12,
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--primary-blue-tint)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Automated Allocation Split (Total: {formatCurrency(computedTotalBudget, targetCurrency)})
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--primary-blue)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ShieldCheck size={14} /> Auto-calculated
              </span>
            </div>

            {/* Split Bar */}
            <div
              style={{
                width: '100%',
                height: 10,
                backgroundColor: 'var(--border-light)',
                borderRadius: 9999,
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${fixedRatio}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary-blue)',
                  transition: 'width 0.3s ease',
                }}
                title={`Fixed: ${fixedRatio}%`}
              />
              <div
                style={{
                  width: `${flexibleRatio}%`,
                  height: '100%',
                  backgroundColor: 'var(--income-emerald)',
                  transition: 'width 0.3s ease',
                }}
                title={`Flexible: ${flexibleRatio}%`}
              />
            </div>

            {/* Fixed vs Flexible Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
              }}
            >
              {/* Fixed Share */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                    Fixed Budget
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {fixedRatio}% of total
                  </span>
                </div>
                <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>
                  {formatCurrency(autoFixedBudget, targetCurrency)}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Sum of active recurring fixed expenses below
                </div>
              </div>

              {/* Flexible Share */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--income-emerald)' }}>
                    Flexible Budget
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {flexibleRatio}% of total
                  </span>
                </div>
                <div className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>
                  {formatCurrency(autoFlexibleBudget, targetCurrency)}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Total budget minus fixed commitments
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* 4. Active Fixed Expenses Management Section */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.125rem', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={18} color="var(--primary-blue)" /> Active Fixed Expenses ({selectedYearMonth})
            </h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Fixed expenses automatically populate every month. Deleting an item here removes it from this month and all future months.
            </div>
          </div>

          <div
            className="tabular-nums"
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--primary-blue)',
            }}
          >
            Total Fixed: {formatCurrency(autoFixedBudget, targetCurrency)}
          </div>
        </div>

        {fixedTransactions.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 12,
              border: '1px dashed var(--border-light)',
            }}
          >
            <Calendar size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              No active fixed expenses for {monthLabel}
            </div>
            <div style={{ fontSize: '0.8125rem', marginTop: 4 }}>
              To add a fixed expense, click the pencil button and toggle "Recurring Fixed Expense".
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {fixedTransactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 200 }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--primary-blue)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {tx.category}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {tx.isAutoGenerated ? 'Recurring (projected)' : 'Original entry'} •{' '}
                      {new Date(tx.transactionTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="tabular-nums"
                      style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}
                    >
                      {formatCurrency(tx.convertedAmount, targetCurrency)}
                    </div>
                    {tx.originalCurrency !== targetCurrency && (
                      <div className="tabular-nums" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {formatCurrency(tx.originalAmount, tx.originalCurrency)}
                      </div>
                    )}
                  </div>

                  {/* Delete / Terminate button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Stop recurring expense "${tx.description}" starting from ${selectedYearMonth} onward?`
                        )
                      ) {
                        onStopFixedExpense?.(tx);
                      }
                    }}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--expense-rose)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    title={`Delete from ${selectedYearMonth} and subsequent months`}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
