import React from 'react';
import type { AnalyticsBreakdown, TargetCurrency } from '../types';
import { formatCurrency } from '../utils/currency';

interface BreakdownAnalyticsViewProps {
  breakdown: AnalyticsBreakdown;
  targetCurrency: TargetCurrency;
  monthlyBudget?: number;
}

// Rich, distinct color palette for all categories
const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#10B981', // Emerald
  Food: '#F59E0B', // Amber
  'Food & Dining': '#F59E0B',
  Transport: '#3B82F6', // Blue
  Housing: '#6366F1', // Indigo
  'Housing & Utilities': '#6366F1',
  Subscriptions: '#EC4899', // Pink
  Education: '#8B5CF6', // Purple
  'Education & Books': '#8B5CF6',
  Shopping: '#F97316', // Orange
  Health: '#14B8A6', // Teal
  'Health & Personal': '#14B8A6',
  Travel: '#06B6D4', // Cyan
  'Leisure & Travel': '#06B6D4',
  Other: '#64748B', // Slate
};

const EXTENDED_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#E11D48', // Rose
  '#84CC16', // Lime
  '#64748B', // Slate
];

const getCategoryColor = (category: string, index: number): string => {
  return CATEGORY_COLORS[category] || EXTENDED_PALETTE[index % EXTENDED_PALETTE.length];
};

const NATURE_CONFIG = {
  RECURRING_YEARLY: {
    label: 'Yearly Commitments',
    color: '#1E3A8A', // Deep Dark Navy Blue (Blue-900)
    bg: '#EFF6FF',
  },
  RECURRING_MONTHLY: {
    label: 'Monthly Commitments',
    color: '#3B82F6', // Medium Vibrant Royal Blue (Blue-500)
    bg: '#F0F7FF',
  },
  ONE_OFF: {
    label: 'One-off Expenses',
    color: '#93C5FD', // Light Soft Blue (Blue-300)
    bg: '#F8FAFC',
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

  // Show all active categories with spending in the chart and legend
  const displayCategories = breakdown.byCategory.filter((item) => item.totalAmount > 0);

  // Increased SVG Donut parameters for larger, clearer chart
  const size = 230;
  const radius = 86;
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
      {/* 1. Category Distribution Section with Enlarged Left/Right Chart & 2-Column Legend */}
      <div>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Category & Nature Breakdown</h3>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Categorical distribution across all items and nature commitments against monthly budget
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
              gap: '2.5rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Left: Enlarged Donut Chart */}
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
                  const color = getCategoryColor(item.category, idx);

                  return (
                    <circle
                      key={item.category}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="transparent"
                      stroke={color}
                      strokeWidth={26}
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
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL</span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginTop: 2,
                  }}
                >
                  {formatCurrency(breakdown.grandTotal, targetCurrency)}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {displayCategories.length} categories
                </span>
              </div>
            </div>

            {/* Right: Borderless Clean Category Legend Grid (1 col for <=5, 2 cols for >5) */}
            <div
              style={{
                flex: 1,
                minWidth: 280,
                display: 'grid',
                gridTemplateColumns: displayCategories.length > 5 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                columnGap: '1.5rem',
                rowGap: '0.625rem',
              }}
            >
              {displayCategories.map((item, idx) => {
                const color = getCategoryColor(item.category, idx);
                return (
                  <div
                    key={item.category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      fontSize: '0.8125rem',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={item.category}
                      >
                        {item.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.totalAmount, targetCurrency)}
                      </span>
                      <span
                        className="tabular-nums"
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem',
                          minWidth: 38,
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

        {/* Multi-Colored Stacked Progress Bar Against Monthly Budget: Yearly -> Monthly -> One-off (gradient from deep to light blue) */}
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
          {/* Yearly Commitments (Dark Blue) */}
          <div
            style={{
              width: `${Math.min(100, yearlyBudgetPct)}%`,
              height: '100%',
              backgroundColor: NATURE_CONFIG.RECURRING_YEARLY.color,
              transition: 'width 0.4s ease',
            }}
            title={`Yearly Commitments: ${formatCurrency(yearlyAmount, targetCurrency)} (${yearlyBudgetPct.toFixed(1)}% of budget)`}
          />
          {/* Monthly Commitments (Medium Blue) */}
          <div
            style={{
              width: `${Math.min(Math.max(0, 100 - yearlyBudgetPct), monthlyBudgetPct)}%`,
              height: '100%',
              backgroundColor: NATURE_CONFIG.RECURRING_MONTHLY.color,
              transition: 'width 0.4s ease',
            }}
            title={`Monthly Commitments: ${formatCurrency(monthlyAmount, targetCurrency)} (${monthlyBudgetPct.toFixed(1)}% of budget)`}
          />
          {/* One-off Expenses (Light Blue) */}
          <div
            style={{
              width: `${Math.min(Math.max(0, 100 - yearlyBudgetPct - monthlyBudgetPct), oneOffBudgetPct)}%`,
              height: '100%',
              backgroundColor: NATURE_CONFIG.ONE_OFF.color,
              transition: 'width 0.4s ease',
            }}
            title={`One-off Expenses: ${formatCurrency(oneOffAmount, targetCurrency)} (${oneOffBudgetPct.toFixed(1)}% of budget)`}
          />
        </div>

        {/* Nature Breakdown Items Legend & Share: Yearly -> Monthly -> One-off */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {/* 1. Yearly Commitments (Darkest Blue) */}
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

          {/* 2. Monthly Commitments (Medium Blue) */}
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

          {/* 3. One-off Expenses (Lightest Blue) */}
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
