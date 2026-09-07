import React from 'react';
import type { TargetCurrency, AnalyticsBreakdown } from '../types';
import { formatCurrency } from '../utils/currency';
import { TrendingDown, Calendar, CreditCard } from 'lucide-react';

interface MetricCardsProps {
  breakdown: AnalyticsBreakdown;
  targetCurrency: TargetCurrency;
  totalTransactionsCount: number;
  monthlyBudget?: number;
  fixedBudget?: number;
  freeBudget?: number;
  onGoToBudget?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  breakdown,
  targetCurrency,
  totalTransactionsCount,
  monthlyBudget: customBudget,
  fixedBudget: customFixedBudget,
  freeBudget: customFreeBudget,
  onGoToBudget,
}) => {
  // Use user-configured monthly budget if provided, otherwise default estimation
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

  const fixedBudget =
    customFixedBudget !== undefined && customFixedBudget > 0
      ? customFixedBudget
      : totalBudget * 0.45;

  const freeBudget =
    customFreeBudget !== undefined && customFreeBudget > 0
      ? customFreeBudget
      : totalBudget - fixedBudget;

  const budgetUsagePercent = Math.min(
    100,
    Math.round((breakdown.grandTotal / totalBudget) * 100)
  );

  const fixedUsagePercent = Math.min(
    100,
    fixedBudget > 0 ? Math.round((breakdown.fixedTotal / fixedBudget) * 100) : 0
  );

  const freeUsagePercent = Math.min(
    100,
    freeBudget > 0 ? Math.round((breakdown.freeTotal / freeBudget) * 100) : 0
  );

  const fixedRatioPercent = totalBudget > 0 ? Math.round((fixedBudget / totalBudget) * 100) : 0;
  const freeRatioPercent = totalBudget > 0 ? Math.round((freeBudget / totalBudget) * 100) : 0;

  const isWarning = budgetUsagePercent >= 85;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}
    >
      {/* 1. Total Expenditure */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Total Expenditure
          </span>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              backgroundColor: 'var(--expense-bg)',
              color: 'var(--expense-rose)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <TrendingDown size={14} /> Total
          </span>
        </div>
        <div
          className="tabular-nums"
          style={{
            fontSize: '1.875rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            marginBottom: '0.5rem',
          }}
        >
          {formatCurrency(breakdown.grandTotal, targetCurrency)}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Aggregated across {totalTransactionsCount} recorded items
        </div>
      </div>

      {/* 2. Fixed vs Free Spending Snapshot */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Fixed vs Free Spending
          </span>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--primary-blue)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CreditCard size={14} /> Commitments
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          {/* Fixed Spent */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>
              Fixed Expenses
            </div>
            <div className="tabular-nums" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
              {formatCurrency(breakdown.fixedTotal, targetCurrency)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {breakdown.grandTotal > 0 ? Math.round((breakdown.fixedTotal / breakdown.grandTotal) * 100) : 0}% of total
            </div>
          </div>

          {/* Free Spent */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>
              Free / Flexible
            </div>
            <div className="tabular-nums" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatCurrency(breakdown.freeTotal, targetCurrency)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {breakdown.grandTotal > 0 ? Math.round((breakdown.freeTotal / breakdown.grandTotal) * 100) : 0}% of total
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monthly Budget Planning & Fixed/Free Quotas */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Monthly Budget
          </span>
          <button
            type="button"
            onClick={onGoToBudget}
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              backgroundColor: isWarning ? 'var(--warning-bg)' : 'var(--income-bg)',
              color: isWarning ? 'var(--warning-amber)' : 'var(--income-emerald)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: onGoToBudget ? 'pointer' : 'default',
              border: 'none',
            }}
            title="Click to view and edit budget"
          >
            <Calendar size={14} /> {budgetUsagePercent}% Used
          </button>
        </div>

        {/* Total Budget Remaining */}
        <div
          className="tabular-nums"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          {formatCurrency(Math.max(0, totalBudget - breakdown.grandTotal), targetCurrency)}{' '}
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            left of {formatCurrency(totalBudget, targetCurrency)}
          </span>
        </div>

        {/* Progress Bar for Overall Budget */}
        <div
          style={{
            width: '100%',
            height: 6,
            backgroundColor: 'var(--border-light)',
            borderRadius: 9999,
            overflow: 'hidden',
            marginBottom: '0.75rem',
          }}
        >
          <div
            style={{
              width: `${budgetUsagePercent}%`,
              height: '100%',
              backgroundColor: isWarning ? 'var(--warning-amber)' : 'var(--primary-blue)',
              borderRadius: 9999,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Sub-breakdown: Fixed Budget vs Free Budget Proportion and Usage */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span>Fixed Quota ({fixedRatioPercent}%): </span>
            <strong style={{ color: 'var(--primary-blue)' }}>
              {formatCurrency(breakdown.fixedTotal, targetCurrency)} / {formatCurrency(fixedBudget, targetCurrency)}
            </strong>{' '}
            <span>({fixedUsagePercent}%)</span>
          </div>
          <div>
            <span>Free ({freeRatioPercent}%): </span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(breakdown.freeTotal, targetCurrency)} / {formatCurrency(freeBudget, targetCurrency)}
            </strong>{' '}
            <span>({freeUsagePercent}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
