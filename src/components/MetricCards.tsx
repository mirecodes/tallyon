import React from 'react';
import type { TargetCurrency, AnalyticsBreakdown } from '../types';
import { formatCurrency } from '../utils/currency';
import { TrendingDown, Calendar, CreditCard } from 'lucide-react';

interface MetricCardsProps {
  breakdown: AnalyticsBreakdown;
  targetCurrency: TargetCurrency;
  totalTransactionsCount: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  breakdown,
  targetCurrency,
  totalTransactionsCount,
}) => {
  // Estimated monthly budget for illustration (can be customized or default to 2000 CHF or 3,000,000 KRW)
  const monthlyBudget = targetCurrency === 'CHF' ? 2000 : 3000000;
  const budgetUsagePercent = Math.min(
    100,
    Math.round((breakdown.grandTotal / monthlyBudget) * 100)
  );

  const isWarning = budgetUsagePercent >= 85;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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

      {/* 2. Nature Breakdown Snapshot */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Recurring vs One-off
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
          {breakdown.byNature.map((item) => (
            <div key={item.nature} style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>
                {item.nature === 'ONE_OFF' ? 'One-off' : item.nature === 'RECURRING_MONTHLY' ? 'Monthly' : 'Yearly'}
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatCurrency(item.totalAmount, targetCurrency)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Monthly Budget & Usage */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Estimated Budget
          </span>
          <span
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
            }}
          >
            <Calendar size={14} /> {budgetUsagePercent}% Used
          </span>
        </div>
        <div
          className="tabular-nums"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          {formatCurrency(Math.max(0, monthlyBudget - breakdown.grandTotal), targetCurrency)}{' '}
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>remaining</span>
        </div>

        {/* Visual Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 8,
            backgroundColor: 'var(--border-light)',
            borderRadius: 9999,
            overflow: 'hidden',
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
      </div>
    </div>
  );
};
