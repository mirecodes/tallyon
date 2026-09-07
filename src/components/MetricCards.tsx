import React from 'react';
import type { TargetCurrency, AnalyticsBreakdown, CumulativeBudgetInfo } from '../types';
import { formatCurrency } from '../utils/currency';
import { Calendar, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';

interface MetricCardsProps {
  breakdown: AnalyticsBreakdown;
  targetCurrency: TargetCurrency;
  totalTransactionsCount: number;
  monthlyBudget?: number;
  fixedBudget?: number;
  flexibleBudget?: number;
  onGoToBudget?: () => void;
  isAllView?: boolean;
  cumulativeBudgetInfo?: CumulativeBudgetInfo;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  breakdown,
  targetCurrency,
  totalTransactionsCount,
  monthlyBudget: customBudget,
  fixedBudget: customFixedBudget,
  flexibleBudget: customFlexibleBudget,
  onGoToBudget,
  isAllView = false,
  cumulativeBudgetInfo,
}) => {
  // Configured monthly budget or standard default
  const totalBudget =
    customBudget && customBudget > 0
      ? customBudget
      : targetCurrency === 'CHF'
      ? 2000
      : targetCurrency === 'USD'
      ? 2200
      : targetCurrency === 'EUR'
      ? 2100
      : 3000000;

  // Auto-calculated fixed and flexible budgets
  const fixedBudget =
    customFixedBudget !== undefined && customFixedBudget > 0
      ? customFixedBudget
      : breakdown.fixedTotal;

  const flexibleBudget =
    customFlexibleBudget !== undefined
      ? customFlexibleBudget
      : Math.max(0, totalBudget - fixedBudget);

  // In ALL view, totalBudget is the cumulative budget from start month to current month
  const activeBudget = isAllView && cumulativeBudgetInfo
    ? cumulativeBudgetInfo.totalCumulativeBudget
    : totalBudget;

  // Spent amounts
  const fixedSpent = breakdown.fixedTotal;
  const flexibleSpent = breakdown.flexibleTotal;
  const totalSpent = breakdown.grandTotal;

  // Percentages relative to active budget
  const fixedPct = activeBudget > 0 ? (fixedSpent / activeBudget) * 100 : 0;
  const flexiblePct = activeBudget > 0 ? (flexibleSpent / activeBudget) * 100 : 0;
  const totalUsagePct = activeBudget > 0 ? Math.round((totalSpent / activeBudget) * 100) : 0;

  // Flexible budget internal usage percentage
  const flexibleQuotaUsagePct =
    flexibleBudget > 0 ? Math.round((flexibleSpent / flexibleBudget) * 100) : 0;

  return (
    <div
      className="card"
      style={{
        padding: '1.5rem 1.75rem',
        marginBottom: '2rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* 1. Header Row: Total Expenditure & Monthly / Cumulative Budget */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {isAllView ? 'Total Expenditure (All Time)' : 'Total Expenditure'}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: 4, flexWrap: 'wrap' }}>
            <span
              className="tabular-nums"
              style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}
            >
              {formatCurrency(totalSpent, targetCurrency)}
            </span>
            <span style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              of <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(activeBudget, targetCurrency)}</strong>{' '}
              {isAllView && cumulativeBudgetInfo
                ? `cumulative budget (${cumulativeBudgetInfo.startYearMonth} ~ ${cumulativeBudgetInfo.currentYearMonth}, ${totalUsagePct}%)`
                : `monthly budget (${totalUsagePct}%)`}
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {totalTransactionsCount} {isAllView ? 'total recorded items across period' : 'recorded items this month'}
          </div>

          {/* Cumulative Budget Over / Under indicator tag ONLY in ALL mode */}
          {isAllView && cumulativeBudgetInfo && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  backgroundColor: cumulativeBudgetInfo.isOverBudget
                    ? 'var(--expense-bg)'
                    : 'var(--income-bg)',
                  color: cumulativeBudgetInfo.isOverBudget
                    ? 'var(--expense-rose)'
                    : 'var(--income-emerald)',
                }}
              >
                {cumulativeBudgetInfo.isOverBudget ? (
                  <>
                    <TrendingUp size={14} />
                    <span>Over Budget by {formatCurrency(Math.abs(cumulativeBudgetInfo.remainingOrOverAmount), targetCurrency)}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} />
                    <span>Under Budget (Surplus) by {formatCurrency(cumulativeBudgetInfo.remainingOrOverAmount, targetCurrency)}</span>
                  </>
                )}
              </span>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Aggregated {cumulativeBudgetInfo.monthsCount} months from {cumulativeBudgetInfo.startYearMonth} to {cumulativeBudgetInfo.currentYearMonth}
              </span>
            </div>
          )}
        </div>

        {/* Quick Budget Jump Button */}
        {onGoToBudget && (
          <button
            type="button"
            onClick={onGoToBudget}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
            }}
            title="Configure Monthly Budget"
          >
            <Calendar size={14} color="var(--primary-blue)" />
            <span>Manage Budget</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* 2. Visual Budget Progress Bar (Fixed in Red, Flexible in Green) */}
      <div style={{ marginBottom: '1.5rem' }}>
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
          {/* Fixed Expense Bar (Red) */}
          <div
            style={{
              width: `${Math.min(100, fixedPct)}%`,
              height: '100%',
              backgroundColor: 'var(--expense-rose)',
              transition: 'width 0.4s ease',
            }}
            title={`Fixed Expenses: ${formatCurrency(fixedSpent, targetCurrency)}`}
          />
          {/* Flexible Spent Bar (Green) */}
          <div
            style={{
              width: `${Math.min(Math.max(0, 100 - fixedPct), flexiblePct)}%`,
              height: '100%',
              backgroundColor: 'var(--income-emerald)',
              transition: 'width 0.4s ease',
            }}
            title={`Flexible Spending: ${formatCurrency(flexibleSpent, targetCurrency)}`}
          />
        </div>
      </div>

      {/* 3. Sub-Breakdown: Fixed Commitments (Red) vs Flexible Spending (Green) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-light)',
        }}
      >
        {/* Fixed Commitments */}
        <div
          style={{
            padding: '14px 18px 14px 14px',
            borderRadius: 14,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            position: 'relative',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Color Indicator Vertical Tape / Stripe */}
            <div
              style={{
                width: 4,
                height: 38,
                borderRadius: 9999,
                backgroundColor: 'var(--expense-rose)',
                flexShrink: 0,
              }}
            />

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Fixed Expenses
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginTop: 1,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(fixedSpent, targetCurrency)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {totalSpent > 0 ? Math.round((fixedSpent / totalSpent) * 100) : 0}% of total spent
              </div>
            </div>
          </div>

          <span
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              backgroundColor: 'var(--expense-bg)',
              color: 'var(--expense-rose)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(225, 29, 72, 0.12)',
            }}
          >
            Fixed Commitments
          </span>
        </div>

        {/* Flexible Spending */}
        <div
          style={{
            padding: '14px 18px 14px 14px',
            borderRadius: 14,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            position: 'relative',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Color Indicator Vertical Tape / Stripe */}
            <div
              style={{
                width: 4,
                height: 38,
                borderRadius: 9999,
                backgroundColor: 'var(--income-emerald)',
                flexShrink: 0,
              }}
            />

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Flexible Spending
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginTop: 1,
                  color: 'var(--income-emerald)',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(flexibleSpent, targetCurrency)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {flexibleBudget > 0
                  ? `${formatCurrency(Math.max(0, flexibleBudget - flexibleSpent), targetCurrency)} left (${flexibleQuotaUsagePct}% used)`
                  : `${totalSpent > 0 ? Math.round((flexibleSpent / totalSpent) * 100) : 0}% of total spent`}
              </div>
            </div>
          </div>

          <span
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              backgroundColor: 'var(--income-bg)',
              color: 'var(--income-emerald)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            Flexible Budget
          </span>
        </div>
      </div>
    </div>
  );
};
