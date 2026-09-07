import React from 'react';
import type { TargetCurrency, AnalyticsBreakdown } from '../types';
import { formatCurrency } from '../utils/currency';
import { Calendar, ChevronRight } from 'lucide-react';

interface MetricCardsProps {
  breakdown: AnalyticsBreakdown;
  targetCurrency: TargetCurrency;
  totalTransactionsCount: number;
  monthlyBudget?: number;
  fixedBudget?: number;
  flexibleBudget?: number;
  onGoToBudget?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  breakdown,
  targetCurrency,
  totalTransactionsCount,
  monthlyBudget: customBudget,
  fixedBudget: customFixedBudget,
  flexibleBudget: customFlexibleBudget,
  onGoToBudget,
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

  // Spent amounts
  const fixedSpent = breakdown.fixedTotal;
  const flexibleSpent = breakdown.flexibleTotal;
  const totalSpent = breakdown.grandTotal;

  // Percentages relative to total budget
  const fixedPct = totalBudget > 0 ? (fixedSpent / totalBudget) * 100 : 0;
  const flexiblePct = totalBudget > 0 ? (flexibleSpent / totalBudget) * 100 : 0;
  const totalUsagePct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

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
      {/* 1. Header Row: Total Expenditure & Monthly Budget Button */}
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
            Total Expenditure
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
              of <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalBudget, targetCurrency)}</strong>{' '}
              monthly budget ({totalUsagePct}%)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {totalTransactionsCount} recorded items this month
          </div>
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
        {/* Fixed Commitments (Red) */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'var(--bg-secondary)',
            borderLeft: '4px solid var(--expense-rose)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Fixed Expenses
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                marginTop: 2,
                color: 'var(--expense-rose)',
              }}
            >
              {formatCurrency(fixedSpent, targetCurrency)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {totalSpent > 0 ? Math.round((fixedSpent / totalSpent) * 100) : 0}% of total spent
            </div>
          </div>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              backgroundColor: 'var(--expense-bg)',
              color: 'var(--expense-rose)',
              fontSize: '0.6875rem',
              fontWeight: 700,
            }}
          >
            Fixed Commitments
          </span>
        </div>

        {/* Flexible Spending (Green) */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: 'var(--bg-secondary)',
            borderLeft: '4px solid var(--income-emerald)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Flexible Spending
            </div>
            <div
              className="tabular-nums"
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                marginTop: 2,
                color: 'var(--income-emerald)',
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
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              backgroundColor: 'var(--income-bg)',
              color: 'var(--income-emerald)',
              fontSize: '0.6875rem',
              fontWeight: 700,
            }}
          >
            Flexible Budget
          </span>
        </div>
      </div>
    </div>
  );
};
