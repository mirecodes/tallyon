import React from 'react';
import type { AnalyticsBreakdown, TargetCurrency } from '../types';
import { formatCurrency } from '../utils/currency';

interface BreakdownAnalyticsViewProps {
  breakdown: AnalyticsBreakdown;
  targetCurrency: TargetCurrency;
}

// Royal Blue Palette gradation for category slices
const PALETTE_COLORS = [
  '#2563EB', // Royal Blue
  '#3B82F6', // Blue-500
  '#60A5FA', // Blue-400
  '#0284C7', // Sky-600
  '#0D9488', // Teal-600
  '#4F46E5', // Indigo-600
  '#7C3AED', // Purple-600
  '#64748B', // Slate-500
];

export const BreakdownAnalyticsView: React.FC<BreakdownAnalyticsViewProps> = ({
  breakdown,
  targetCurrency,
}) => {
  // Aggregate Top 5 Categories and bundle others into 'Other'
  const topCategories = breakdown.byCategory.slice(0, 5);
  const remainingCategories = breakdown.byCategory.slice(5);

  let otherTotal = 0;
  for (const cat of remainingCategories) {
    otherTotal += cat.totalAmount;
  }
  const formattedOtherTotal = targetCurrency === 'KRW' ? Math.round(otherTotal) : Number(otherTotal.toFixed(2));
  const otherPercentage =
    breakdown.grandTotal > 0 ? Number(((formattedOtherTotal / breakdown.grandTotal) * 100).toFixed(2)) : 0;

  const displayCategories = [...topCategories];
  if (remainingCategories.length > 0) {
    displayCategories.push({
      category: 'Other Categories',
      totalAmount: formattedOtherTotal,
      percentage: otherPercentage,
    });
  }

  // Calculate SVG Donut parameters
  const size = 200;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 2-Column Grid: Category Donut & Nature Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* 1. Category Distribution Donut Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Category Distribution</h3>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Breakdown of expenses by major category
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: '1.5rem',
            }}
          >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {displayCategories.map((item, idx) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                cumulativePercent += item.percentage;
                const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];

                return (
                  <circle
                    key={item.category}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={24}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                );
              })}
            </svg>

            {/* Inner Center Label */}
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL</span>
              <span
                className="tabular-nums"
                style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}
              >
                {formatCurrency(breakdown.grandTotal, targetCurrency)}
              </span>
            </div>
          </div>

          {/* Category Legend List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {displayCategories.map((item, idx) => {
              const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];
              return (
                <div
                  key={item.category}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(item.totalAmount, targetCurrency)}
                    </span>
                    <span
                      className="tabular-nums"
                      style={{ color: 'var(--text-muted)', fontSize: '0.75rem', minWidth: 40, textAlign: 'right' }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Expense Nature & Commitment Split */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Commitment & Nature</h3>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Comparison between variable and recurring commitments
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {breakdown.byNature.map((item) => {
              const label =
                item.nature === 'ONE_OFF'
                  ? 'One-off Expenses'
                  : item.nature === 'RECURRING_MONTHLY'
                  ? 'Monthly Commitments'
                  : 'Yearly Commitments';

              const barColor =
                item.nature === 'ONE_OFF'
                  ? 'var(--primary-blue-light)'
                  : item.nature === 'RECURRING_MONTHLY'
                  ? 'var(--primary-blue)'
                  : '#7C3AED';

              return (
                <div key={item.nature}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                      fontSize: '0.875rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.totalAmount, targetCurrency)}
                      </span>
                      <span className="tabular-nums" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: 10,
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 9999,
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        borderRadius: 9999,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Insight Box */}
          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              borderRadius: 12,
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--primary-blue-tint)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary-blue)', marginBottom: 4 }}>
              Financial Insight
            </div>
            <p style={{ fontSize: '0.8125rem', margin: 0, color: 'var(--text-secondary)' }}>
              Recurring commitments account for{' '}
              <strong>
                {Number(
                  (
                    (breakdown.byNature.find((n) => n.nature === 'RECURRING_MONTHLY')?.percentage || 0) +
                    (breakdown.byNature.find((n) => n.nature === 'RECURRING_YEARLY')?.percentage || 0)
                  ).toFixed(1)
                )}
                %
              </strong>{' '}
              of your total expenditure in {targetCurrency}. Keeping recurring expenses low helps preserve monthly savings capacity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
