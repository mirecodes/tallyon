import React from 'react';
import type { AnalyticsBreakdown, TargetCurrency } from '../types';
import { formatCurrency } from '../utils/currency';

interface BreakdownAnalyticsViewProps {
  breakdown: AnalyticsBreakdown;
  targetCurrency: TargetCurrency;
  monthlyBudget?: number;
}

// Royal Blue Palette for category slices
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

const NATURE_CONFIG = {
  ONE_OFF: {
    label: 'One-off Expenses',
    color: '#3B82F6', // Vibrant Blue
    bg: '#EFF6FF',
  },
  RECURRING_MONTHLY: {
    label: 'Monthly Commitments',
    color: '#EF4444', // Red (matching fixed commitment tone)
    bg: '#FEF2F2',
  },
  RECURRING_YEARLY: {
    label: 'Yearly Commitments',
    color: '#8B5CF6', // Purple
    bg: '#F5F3FF',
  },
} as const;

export const BreakdownAnalyticsView: React.FC<BreakdownAnalyticsViewProps> = ({
  breakdown,
  targetCurrency,
  monthlyBudget: customBudget,
}) => {
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

  // Aggregate Top 5 Categories and bundle others into 'Other Categories'
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
  const size = 180;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  // Nature breakdown amounts and ratios against total budget
  const natureAmounts: Record<string, number> = {
    ONE_OFF: 0,
    RECURRING_MONTHLY: 0,
    RECURRING_YEARLY: 0,
  };

  for (const n of breakdown.byNature) {
    natureAmounts[n.nature] = n.totalAmount;
  }

  const oneOffAmount = natureAmounts['ONE_OFF'] || 0;
  const monthlyAmount = natureAmounts['RECURRING_MONTHLY'] || 0;
  const yearlyAmount = natureAmounts['RECURRING_YEARLY'] || 0;

  const oneOffBudgetPct = totalBudget > 0 ? (oneOffAmount / totalBudget) * 100 : 0;
  const monthlyBudgetPct = totalBudget > 0 ? (monthlyAmount / totalBudget) * 100 : 0;
  const yearlyBudgetPct = totalBudget > 0 ? (yearlyAmount / totalBudget) * 100 : 0;

  const totalNatureSpent = oneOffAmount + monthlyAmount + yearlyAmount;
  const totalNatureBudgetPct = totalBudget > 0 ? Math.round((totalNatureSpent / totalBudget) * 100) : 0;

  return (
    <div
      className="card"
      style={{
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
      }}
    >
      {/* 1. Category Distribution Section with Left/Right Chart & Legend Layout */}
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Category & Nature Breakdown</h3>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Categorical allocation and spending nature proportions against total monthly budget
          </div>
        </div>

        {breakdown.grandTotal === 0 ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 10,
            }}
          >
            No expenditure recorded for this period
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Left: Donut Chart */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
                margin: '0 auto',
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
                      strokeWidth={22}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      transform={`rotate(-90 ${size / 2} ${size / 2})`}
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  );
                })}
              </svg>

              {/* Center Total Inside Donut */}
              <div
                style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL</span>
                <span
                  className="tabular-nums"
                  style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}
                >
                  {formatCurrency(breakdown.grandTotal, targetCurrency)}
                </span>
              </div>
            </div>

            {/* Right: Category Legend Grid */}
            <div
              style={{
                flex: 1,
                minWidth: 260,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {displayCategories.map((item, idx) => {
                const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];
                return (
                  <div
                    key={item.category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-secondary)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          backgroundColor: color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.totalAmount, targetCurrency)}
                      </span>
                      <span
                        className="tabular-nums"
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem',
                          minWidth: 42,
                          textAlign: 'right',
                        }}
                      >
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Nature Breakdown Stacked Graph (Against Total Budget) */}
      <div
        style={{
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-light)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Expense Nature vs Monthly Budget
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
              ({formatCurrency(totalNatureSpent, targetCurrency)} of {formatCurrency(totalBudget, targetCurrency)} budget used • {totalNatureBudgetPct}%)
            </span>
          </div>
        </div>

        {/* Multi-Colored Stacked Progress Bar Against Monthly Budget */}
        <div
          style={{
            width: '100%',
            height: 12,
            backgroundColor: 'var(--border-light)',
            borderRadius: 9999,
            overflow: 'hidden',
            display: 'flex',
            marginBottom: '1rem',
          }}
        >
          {/* Monthly Commitments (Red) */}
          <div
            style={{
              width: `${Math.min(100, monthlyBudgetPct)}%`,
              height: '100%',
              backgroundColor: NATURE_CONFIG.RECURRING_MONTHLY.color,
              transition: 'width 0.4s ease',
            }}
            title={`Monthly Commitments: ${formatCurrency(monthlyAmount, targetCurrency)} (${monthlyBudgetPct.toFixed(1)}% of budget)`}
          />
          {/* Yearly Commitments (Purple) */}
          <div
            style={{
              width: `${Math.min(Math.max(0, 100 - monthlyBudgetPct), yearlyBudgetPct)}%`,
              height: '100%',
              backgroundColor: NATURE_CONFIG.RECURRING_YEARLY.color,
              transition: 'width 0.4s ease',
            }}
            title={`Yearly Commitments: ${formatCurrency(yearlyAmount, targetCurrency)} (${yearlyBudgetPct.toFixed(1)}% of budget)`}
          />
          {/* One-off Expenses (Blue) */}
          <div
            style={{
              width: `${Math.min(Math.max(0, 100 - monthlyBudgetPct - yearlyBudgetPct), oneOffBudgetPct)}%`,
              height: '100%',
              backgroundColor: NATURE_CONFIG.ONE_OFF.color,
              transition: 'width 0.4s ease',
            }}
            title={`One-off Expenses: ${formatCurrency(oneOffAmount, targetCurrency)} (${oneOffBudgetPct.toFixed(1)}% of budget)`}
          />
        </div>

        {/* Nature Breakdown Items Legend & Share */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {/* Monthly Commitments */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: `4px solid ${NATURE_CONFIG.RECURRING_MONTHLY.color}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {NATURE_CONFIG.RECURRING_MONTHLY.label}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: NATURE_CONFIG.RECURRING_MONTHLY.color,
                }}
              >
                {monthlyBudgetPct.toFixed(1)}% of budget
              </span>
            </div>
            <div
              className="tabular-nums"
              style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}
            >
              {formatCurrency(monthlyAmount, targetCurrency)}
            </div>
          </div>

          {/* Yearly Commitments */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: `4px solid ${NATURE_CONFIG.RECURRING_YEARLY.color}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {NATURE_CONFIG.RECURRING_YEARLY.label}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: NATURE_CONFIG.RECURRING_YEARLY.color,
                }}
              >
                {yearlyBudgetPct.toFixed(1)}% of budget
              </span>
            </div>
            <div
              className="tabular-nums"
              style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}
            >
              {formatCurrency(yearlyAmount, targetCurrency)}
            </div>
          </div>

          {/* One-off Expenses */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: `4px solid ${NATURE_CONFIG.ONE_OFF.color}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {NATURE_CONFIG.ONE_OFF.label}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: NATURE_CONFIG.ONE_OFF.color,
                }}
              >
                {oneOffBudgetPct.toFixed(1)}% of budget
              </span>
            </div>
            <div
              className="tabular-nums"
              style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}
            >
              {formatCurrency(oneOffAmount, targetCurrency)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
