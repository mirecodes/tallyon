import React, { useState } from 'react';
import type { TargetCurrency, MonthlyBudget, ExchangeRateRecord, AnalyticsBreakdown } from '../types';
import { formatCurrency } from '../utils/currency';
import { STATIC_FALLBACK_RATES } from '../repositories/LocalStorageExchangeRateRepository';
import { ChevronLeft, ChevronRight, Save, Check, AlertTriangle } from 'lucide-react';

interface BudgetPlanningViewProps {
  budgetsMap: Record<string, MonthlyBudget>;
  onSaveBudget: (budget: MonthlyBudget) => Promise<void>;
  ratesMap: Record<string, ExchangeRateRecord>;
  targetCurrency: TargetCurrency;
  breakdown: AnalyticsBreakdown;
}

const CATEGORIES = [
  'Groceries',
  'Food & Dining',
  'Transport',
  'Housing & Utilities',
  'Subscriptions',
  'Education & Books',
  'Shopping',
  'Health & Personal',
  'Leisure & Travel',
  'Other',
];

export const BudgetPlanningView: React.FC<BudgetPlanningViewProps> = ({
  budgetsMap,
  onSaveBudget,
  ratesMap,
  targetCurrency,
  breakdown,
}) => {
  // Current month state YYYY-MM
  const now = new Date();
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );

  const [savedNotice, setSavedNotice] = useState(false);

  // Parse Year and Month
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

  // Get or initialize budget for this month
  const rawBudget: MonthlyBudget = budgetsMap[selectedYearMonth] || {
    yearMonth: selectedYearMonth,
    totalBudget: 3000000,
    currency: 'KRW',
    categoryBudgets: {},
    updatedAt: new Date().toISOString(),
  };

  // Convert budget to target currency for display and editing
  // 1. First convert raw budget to KRW
  const latestRateRecord =
    ratesMap[`${selectedYearMonth}-01`] || ratesMap[Object.keys(ratesMap)[0]] || STATIC_FALLBACK_RATES;
  const rates = latestRateRecord.rates;

  const budgetInKrw =
    rawBudget.currency === 'KRW'
      ? rawBudget.totalBudget
      : rawBudget.totalBudget * (rates[rawBudget.currency] || STATIC_FALLBACK_RATES.rates[rawBudget.currency]);

  // 2. Convert from KRW to target currency
  const convertedTotalBudget =
    targetCurrency === 'KRW'
      ? Math.round(budgetInKrw)
      : Number((budgetInKrw / (rates[targetCurrency] || STATIC_FALLBACK_RATES.rates[targetCurrency] || 1)).toFixed(2));

  // Form input local states
  const [inputTotal, setInputTotal] = useState<string>(convertedTotalBudget.toString());
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    const catBudgets = rawBudget.categoryBudgets || {};
    for (const cat of CATEGORIES) {
      const valInOrig = catBudgets[cat] || 0;
      if (valInOrig > 0) {
        const valInKrw =
          rawBudget.currency === 'KRW'
            ? valInOrig
            : valInOrig * (rates[rawBudget.currency] || STATIC_FALLBACK_RATES.rates[rawBudget.currency]);
        const valInTarget =
          targetCurrency === 'KRW'
            ? Math.round(valInKrw)
            : Number((valInKrw / (rates[targetCurrency] || STATIC_FALLBACK_RATES.rates[targetCurrency] || 1)).toFixed(2));
        init[cat] = valInTarget.toString();
      } else {
        init[cat] = '';
      }
    }
    return init;
  });

  // Sync state whenever month or targetCurrency changes
  React.useEffect(() => {
    setInputTotal(convertedTotalBudget.toString());
    const init: Record<string, string> = {};
    const catBudgets = rawBudget.categoryBudgets || {};
    for (const cat of CATEGORIES) {
      const valInOrig = catBudgets[cat] || 0;
      if (valInOrig > 0) {
        const valInKrw =
          rawBudget.currency === 'KRW'
            ? valInOrig
            : valInOrig * (rates[rawBudget.currency] || STATIC_FALLBACK_RATES.rates[rawBudget.currency]);
        const valInTarget =
          targetCurrency === 'KRW'
            ? Math.round(valInKrw)
            : Number((valInKrw / (rates[targetCurrency] || STATIC_FALLBACK_RATES.rates[targetCurrency] || 1)).toFixed(2));
        init[cat] = valInTarget.toString();
      } else {
        init[cat] = '';
      }
    }
    setCategoryInputs(init);
  }, [selectedYearMonth, targetCurrency]);

  const handleCategoryChange = (cat: string, value: string) => {
    setCategoryInputs((prev) => ({ ...prev, [cat]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = parseFloat(inputTotal) || 0;

    const parsedCategories: Record<string, number> = {};
    for (const [cat, valStr] of Object.entries(categoryInputs)) {
      const num = parseFloat(valStr);
      if (!isNaN(num) && num > 0) {
        parsedCategories[cat] = num;
      }
    }

    const updatedBudget: MonthlyBudget = {
      yearMonth: selectedYearMonth,
      totalBudget: parsedTotal,
      currency: targetCurrency,
      categoryBudgets: parsedCategories,
      updatedAt: new Date().toISOString(),
    };

    await onSaveBudget(updatedBudget);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Spending vs Budget stats for this month
  const actualSpent = breakdown.grandTotal;
  const currentBudgetNum = parseFloat(inputTotal) || convertedTotalBudget;
  const remainingBudget = currentBudgetNum - actualSpent;
  const usagePercentage = currentBudgetNum > 0 ? Math.round((actualSpent / currentBudgetNum) * 100) : 0;
  const isOverBudget = usagePercentage > 100;

  // Month Title
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
              Set and monitor your monthly expenditure ceilings in <strong>{targetCurrency}</strong>.
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

      {/* 2. Budget Health Status Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Planned Budget */}
        <div className="card">
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Total Planned Budget
          </span>
          <div
            className="tabular-nums"
            style={{ fontSize: '1.625rem', fontWeight: 800, marginTop: 4, color: 'var(--primary-blue)' }}
          >
            {formatCurrency(currentBudgetNum, targetCurrency)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Currency standard: {targetCurrency}
          </div>
        </div>

        {/* Actual Spent */}
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
            {usagePercentage}% of allocated budget used
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
          <div style={{ fontSize: '0.75rem', color: isOverBudget ? 'var(--expense-rose)' : 'var(--income-emerald)', marginTop: 4 }}>
            {isOverBudget ? 'Budget exceeded!' : 'Within target limit'}
          </div>
        </div>
      </div>

      {/* 3. Budget Edit Form */}
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
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Configure Budget Limits</h3>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Update overall monthly limit and individual category allocations.
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

          {/* Overall Monthly Budget Input */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 12,
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--primary-blue-tint)',
              marginBottom: '2rem',
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--primary-blue)',
                marginBottom: 6,
              }}
            >
              Overall Monthly Limit ({targetCurrency}) *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: 400 }}>
              <input
                type="number"
                step="0.01"
                value={inputTotal}
                onChange={(e) => setInputTotal(e.target.value)}
                placeholder="e.g. 3000000"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  width: '100%',
                  padding: '8px 14px',
                }}
              />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {targetCurrency}
              </span>
            </div>
          </div>

          {/* Category-Level Budget Allocation Grid */}
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>
            Category Allocations (Optional Targets)
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '1rem',
            }}
          >
            {CATEGORIES.map((cat) => {
              const actualCatSpent = breakdown.byCategory.find((c) => c.category === cat)?.totalAmount || 0;
              const catBudgetLimit = parseFloat(categoryInputs[cat] || '0') || 0;
              const isCatExceeded = catBudgetLimit > 0 && actualCatSpent > catBudgetLimit;

              return (
                <div
                  key={cat}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{cat}</span>
                    {isCatExceeded && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: '0.6875rem',
                          color: 'var(--expense-rose)',
                          fontWeight: 700,
                        }}
                      >
                        <AlertTriangle size={12} /> Over limit
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="No limit"
                      value={categoryInputs[cat] || ''}
                      onChange={(e) => handleCategoryChange(cat, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '0.8125rem',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {targetCurrency}
                    </span>
                  </div>

                  {actualCatSpent > 0 && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Current spent: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(actualCatSpent, targetCurrency)}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '2rem',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '1.25rem',
            }}
          >
            <button
              type="submit"
              className="btn-primary"
              style={{
                backgroundColor: savedNotice ? 'var(--income-emerald)' : 'var(--primary-blue)',
              }}
            >
              {savedNotice ? <Check size={16} /> : <Save size={16} />}
              <span>{savedNotice ? 'Saved Changes!' : 'Save Budget Configuration'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
