import React, { useState } from 'react';
import type { TargetCurrency, MonthlyBudget, ExchangeRateRecord, AnalyticsBreakdown, ValuatedTransaction, CumulativeBudgetInfo } from '../types';
import { formatCurrency } from '../utils/currency';
import { STATIC_FALLBACK_RATES } from '../repositories/LocalStorageExchangeRateRepository';
import { ChevronLeft, ChevronRight, ChevronDown, Save, Check, Trash2, Calendar, Lock, Sliders, ShieldCheck, Layers, TrendingUp, TrendingDown, Settings } from 'lucide-react';
import { MonthPickerPopover } from './MonthPickerPopover';
import { useCategories, getCategoryColor, getCategoryIconElement } from '../utils/categories';

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
  budgetStartMonth?: string;
  onBudgetStartMonthChange?: (ym: string) => void;
  isAllView?: boolean;
  cumulativeBudgetInfo?: CumulativeBudgetInfo;
  onOpenCategoryManager?: () => void;
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
  budgetStartMonth = '2026-01',
  onBudgetStartMonthChange,
  isAllView = false,
  cumulativeBudgetInfo,
  onOpenCategoryManager,
}) => {
  const { categories } = useCategories();
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
  const [isLongTermCollapsed, setIsLongTermCollapsed] = useState(false);

  // Separate fixed transactions into Fixed Monthly and Fixed Long-term
  const fixedMonthlyList = fixedTransactions.filter(
    (tx) => tx.expenseNature !== 'RECURRING_YEARLY'
  );
  const fixedLongTermList = fixedTransactions.filter(
    (tx) => tx.expenseNature === 'RECURRING_YEARLY'
  );

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

  // When 'ALL' option is selected in top month navigator
  if (isAllView) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* 1. Header & Aggregation Starting Month Configuration Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.35rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={22} color="var(--primary-blue)" /> Cumulative Budget Overview — All Time
              </h2>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Configure aggregation starting month and review accumulated budgets against overall spending.
              </div>
            </div>

            {/* Aggregation Starting Month Picker with Floating Popover */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-secondary)',
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid var(--border-light)',
              }}
            >
              <label
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                Aggregation Starting Month:
              </label>
              <MonthPickerPopover
                value={budgetStartMonth}
                onChange={(ym) => onBudgetStartMonthChange?.(ym)}
                align="right"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  title="Click to select aggregation starting month"
                >
                  <Calendar size={14} color="var(--primary-blue)" />
                  <span>{budgetStartMonth}</span>
                </div>
              </MonthPickerPopover>
            </div>
          </div>

          {/* Cumulative KPI Statistics */}
          {cumulativeBudgetInfo && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* Cumulative Total Budget */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 12,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Cumulative Budget ({cumulativeBudgetInfo.startYearMonth} ~ {cumulativeBudgetInfo.currentYearMonth})
                </span>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: 'var(--primary-blue)' }}
                >
                  {formatCurrency(cumulativeBudgetInfo.totalCumulativeBudget, targetCurrency)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Sum of monthly budgets across {cumulativeBudgetInfo.monthsCount} months
                </div>
              </div>

              {/* Cumulative Actual Spent */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 12,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Total Actual Spent (All Time)
                </span>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: 'var(--expense-rose)' }}
                >
                  {formatCurrency(cumulativeBudgetInfo.totalActualSpent, targetCurrency)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {cumulativeBudgetInfo.percentageUsed}% of cumulative budget
                </div>
              </div>

              {/* Over / Under Budget Status */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 12,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Budget Status
                </span>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    marginTop: 4,
                    color: cumulativeBudgetInfo.isOverBudget ? 'var(--expense-rose)' : 'var(--income-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {cumulativeBudgetInfo.isOverBudget ? (
                    <>
                      <TrendingUp size={24} />
                      <span>-{formatCurrency(Math.abs(cumulativeBudgetInfo.remainingOrOverAmount), targetCurrency)}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={24} />
                      <span>+{formatCurrency(cumulativeBudgetInfo.remainingOrOverAmount, targetCurrency)}</span>
                    </>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: cumulativeBudgetInfo.isOverBudget ? 'var(--expense-rose)' : 'var(--income-emerald)',
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {cumulativeBudgetInfo.isOverBudget
                    ? 'Exceeded cumulative budget limit'
                    : 'Surplus within cumulative budget limits'}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: 8,
              backgroundColor: 'var(--bg-tertiary)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            💡 <strong>Note:</strong> To configure an individual month's budget (base budget, extra adjustment, and recurring fixed expenses), please select a specific month (e.g. <code>2026-09</code>) in the top control bar.
          </div>
        </div>
      </div>
    );
  }

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

            <MonthPickerPopover
              value={selectedYearMonth}
              onChange={(ym) => setSelectedYearMonth(ym)}
              align="center"
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  minWidth: 100,
                  textAlign: 'center',
                  padding: '6px 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-light)',
                  transition: 'background-color 0.15s ease',
                }}
                title="Click to select month"
              >
                {selectedYearMonth}
              </span>
            </MonthPickerPopover>

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

      {/* 4. Category Management Strip */}
      <div
        className="card"
        onClick={onOpenCategoryManager}
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 14,
          cursor: onOpenCategoryManager ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid var(--primary-blue-tint)',
            }}
          >
            <Settings size={18} />
          </div>

          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Category Settings & Order
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Configure your spending categories, adjust order, or customize colors.
            </div>
          </div>

          {/* Quick preview pills of categories in current order */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginLeft: 6 }}>
            {categories.slice(0, 7).map((cat) => (
              <span
                key={cat.id}
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: cat.color,
                  }}
                />
                {cat.name}
              </span>
            ))}
            {categories.length > 7 && (
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                +{categories.length - 7} more
              </span>
            )}
          </div>
        </div>

        {onOpenCategoryManager && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCategoryManager();
            }}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '0.8125rem',
              borderRadius: '9999px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <Settings size={15} />
            <span>Manage Categories</span>
          </button>
        )}
      </div>

      {/* 5. Active Fixed Expenses Management Section */}
      <div className="card" style={{ padding: '1.75rem' }}>
        {/* Section Header */}
        <div
          style={{
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '1.25rem',
          }}
        >
          {/* Top Title & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--primary-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--primary-blue-tint)',
              }}
            >
              <Lock size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Active Fixed Expenses <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>({selectedYearMonth})</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Fixed commitments automatically populate every month. Deleting an item removes it from this month and all future months.
              </div>
            </div>
          </div>

          {/* Total Fixed (Left-aligned, typography and scale identical to Total Expenditure) */}
          <div>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
              }}
            >
              Total Fixed
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: 4, flexWrap: 'wrap' }}>
              <span
                className="tabular-nums"
                style={{
                  fontSize: '2.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: 'var(--primary-blue)',
                  lineHeight: 1.1,
                }}
              >
                {formatCurrency(autoFixedBudget, targetCurrency)}
              </span>
              <span style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                {fixedTransactions.length} active recurring commitments
              </span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {fixedTransactions.length === 0 ? (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 12,
              border: '1px dashed var(--border-light)',
            }}
          >
            <Calendar size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.35, display: 'block' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              No active fixed expenses for {monthLabel}
            </div>
            <div style={{ fontSize: '0.8125rem', marginTop: 4, color: 'var(--text-muted)' }}>
              To add a fixed expense, click the pencil button (+) and toggle "Recurring Fixed Expense".
            </div>
          </div>
        ) : (
          /* Fixed Expenses Items List with Separate Sections */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Section 1: Fixed Monthly */}
            {fixedMonthlyList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Fixed Monthly ({fixedMonthlyList.length})
                </div>
                {fixedMonthlyList.map((tx) => {
                  const catColor = getCategoryColor(tx.category, categories);
                  return (
                    <div
                      key={tx.id}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px 12px 20px',
                        borderRadius: 12,
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-light)',
                        gap: '1rem',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      className="transaction-row"
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          backgroundColor: catColor,
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-secondary)',
                            border: `1.5px solid ${catColor}`,
                            color: catColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getCategoryIconElement(tx.category, 15)}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '0.9375rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {tx.description}
                            </span>
                            <span className="tag-pill-outline" style={{ fontSize: '0.6875rem' }}>
                              {tx.category}
                            </span>
                            <span
                              className="tag-pill-outline"
                              style={{
                                fontSize: '0.6875rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderColor: 'var(--primary-blue-tint)',
                                color: 'var(--primary-blue)',
                                fontWeight: 700,
                              }}
                            >
                              Fixed Monthly
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                            {tx.isAutoGenerated ? 'Recurring commitment' : 'Base recurring entry'} •{' '}
                            {new Date(tx.transactionTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right', minWidth: 90 }}>
                          <div
                            className="tabular-nums"
                            style={{
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {formatCurrency(tx.convertedAmount, targetCurrency)}
                          </div>
                          <div
                            className="tabular-nums"
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                            }}
                          >
                            {formatCurrency(tx.originalAmount, tx.originalCurrency)}
                          </div>
                        </div>

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
                          className="action-icon-btn btn-danger"
                          title={`Stop recurring expense from ${selectedYearMonth} onward`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Horizontal Divider between Monthly and Long-term */}
            {fixedMonthlyList.length > 0 && fixedLongTermList.length > 0 && (
              <div
                style={{
                  borderTop: '1px dashed var(--border-light)',
                  margin: '0.5rem 0',
                }}
              />
            )}

            {/* Section 2: Fixed Long-term (Bottom, Collapsible via Toggle Button) */}
            {fixedLongTermList.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Fixed Long-term ({fixedLongTermList.length})
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLongTermCollapsed((prev) => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--primary-blue)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                  >
                    <span>{isLongTermCollapsed ? 'Show' : 'Hide'}</span>
                    <ChevronDown
                      size={14}
                      style={{
                        transform: isLongTermCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>
                </div>

                {!isLongTermCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {fixedLongTermList.map((tx) => {
                      const catColor = getCategoryColor(tx.category, categories);
                      return (
                        <div
                          key={tx.id}
                          style={{
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px 12px 20px',
                            borderRadius: 12,
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-light)',
                            gap: '1rem',
                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                          }}
                          className="transaction-row"
                        >
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: 4,
                              backgroundColor: catColor,
                            }}
                          />

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-secondary)',
                                border: `1.5px solid ${catColor}`,
                                color: catColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {getCategoryIconElement(tx.category, 15)}
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: '0.9375rem',
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {tx.description}
                                </span>
                                <span className="tag-pill-outline" style={{ fontSize: '0.6875rem' }}>
                                  {tx.category}
                                </span>
                                <span
                                  className="tag-pill-outline"
                                  style={{
                                    fontSize: '0.6875rem',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderColor: 'var(--primary-blue-tint)',
                                    color: 'var(--primary-blue)',
                                    fontWeight: 700,
                                  }}
                                >
                                  Fixed Long-term
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
                                Manual commitment •{' '}
                                {new Date(tx.transactionTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                            <div style={{ textAlign: 'right', minWidth: 90 }}>
                              <div
                                className="tabular-nums"
                                style={{
                                  fontSize: '1rem',
                                  fontWeight: 800,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {formatCurrency(tx.convertedAmount, targetCurrency)}
                              </div>
                              <div
                                className="tabular-nums"
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {formatCurrency(tx.originalAmount, tx.originalCurrency)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete expense "${tx.description}"?`
                                  )
                                ) {
                                  onStopFixedExpense?.(tx);
                                }
                              }}
                              className="action-icon-btn btn-danger"
                              title="Delete expense"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
