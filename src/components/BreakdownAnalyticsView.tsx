import React from 'react';
import type { AnalyticsBreakdown, TargetCurrency, CumulativeBudgetInfo } from '../types';
import { formatCurrency } from '../utils/currency';
import { useCategories, getCategoryColor } from '../utils/categories';

interface BreakdownAnalyticsViewProps {
  breakdown: AnalyticsBreakdown;
  targetCurrency: TargetCurrency;
  monthlyBudget?: number;
  isAllView?: boolean;
  cumulativeBudgetInfo?: CumulativeBudgetInfo;
  onOpenCategoryManager?: () => void;
}

const NATURE_CONFIG = {
  RECURRING_YEARLY: {
    label: 'Long-term Commitments',
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
  isAllView = false,
  cumulativeBudgetInfo,
  onOpenCategoryManager,
}) => {
  const { categories } = useCategories();
  const defaultMonthlyBudget =
    customBudget && customBudget > 0
      ? customBudget
      : targetCurrency === 'CHF'
      ? 2000
      : targetCurrency === 'USD'
      ? 2200
      : targetCurrency === 'EUR'
      ? 2100
      : 3000000;

  const totalBudget = isAllView && cumulativeBudgetInfo
    ? cumulativeBudgetInfo.totalCumulativeBudget
    : defaultMonthlyBudget;

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Category & Nature Breakdown</h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Categorical distribution across all items and nature commitments against monthly budget
            </div>
          </div>

          {onOpenCategoryManager && (
            <button
              type="button"
              onClick={onOpenCategoryManager}
              className="btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                borderRadius: '9999px',
                fontWeight: 600,
              }}
            >
              ⚙ Edit Categories
            </button>
          )}
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
                {displayCategories.map((item) => {
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                  cumulativePercent += item.percentage;
                  const color = getCategoryColor(item.category, categories);

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
              {displayCategories.map((item) => {
                const color = getCategoryColor(item.category, categories);
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

      {/* 2. Cycle Breakdown Stacked Graph (Against Total Budget) */}
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
              {isAllView && cumulativeBudgetInfo
                ? `Expense Cycle vs Cumulative Budget (${cumulativeBudgetInfo.startYearMonth} ~ ${cumulativeBudgetInfo.currentYearMonth})`
                : 'Expense Cycle vs Monthly Budget'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
              ({formatCurrency(totalNatureSpent, targetCurrency)} of {formatCurrency(totalBudget, targetCurrency)} budget used • {totalNatureBudgetPct}%)
            </span>
          </div>

          {/* Over / Under badge in ALL mode */}
          {isAllView && cumulativeBudgetInfo && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                backgroundColor: cumulativeBudgetInfo.isOverBudget ? 'var(--expense-bg)' : 'var(--income-bg)',
                color: cumulativeBudgetInfo.isOverBudget ? 'var(--expense-rose)' : 'var(--income-emerald)',
              }}
            >
              {cumulativeBudgetInfo.isOverBudget
                ? `Over by ${formatCurrency(Math.abs(cumulativeBudgetInfo.remainingOrOverAmount), targetCurrency)}`
                : `Under by ${formatCurrency(cumulativeBudgetInfo.remainingOrOverAmount, targetCurrency)}`}
            </span>
          )}
        </div>

        {/* Multi-Colored Stacked Progress Bar Against Budget: Long-term -> Monthly -> One-off (gradient from deep to light blue) */}
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
          {/* Long-term Commitments (Dark Blue) */}
          <div
            style={{
              width: `${Math.min(100, yearlyBudgetPct)}%`,
              height: '100%',
              backgroundColor: NATURE_CONFIG.RECURRING_YEARLY.color,
              transition: 'width 0.4s ease',
            }}
            title={`Long-term Commitments: ${formatCurrency(yearlyAmount, targetCurrency)} (${yearlyBudgetPct.toFixed(1)}% of budget)`}
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

        {/* Cycle Breakdown Items Cards: Long-term -> Monthly -> One-off (Height & padding matching Fixed/Flexible cards) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* 1. Long-term Commitments */}
          <div
            style={{
              padding: '14px 18px 14px 14px',
              borderRadius: 14,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              minHeight: 88,
              boxSizing: 'border-box',
            }}
          >
            {/* Color Indicator Vertical Tape / Stripe */}
            <div
              style={{
                width: 4,
                height: 38,
                borderRadius: 9999,
                backgroundColor: NATURE_CONFIG.RECURRING_YEARLY.color,
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
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
                  {yearlyBudgetPct.toFixed(1)}%
                </span>
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginTop: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(yearlyAmount, targetCurrency)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {totalNatureSpent > 0 ? Math.round((yearlyAmount / totalNatureSpent) * 100) : 0}% of cycle spent
              </div>
            </div>
          </div>

          {/* 2. Monthly Commitments */}
          <div
            style={{
              padding: '14px 18px 14px 14px',
              borderRadius: 14,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              minHeight: 88,
              boxSizing: 'border-box',
            }}
          >
            {/* Color Indicator Vertical Tape / Stripe */}
            <div
              style={{
                width: 4,
                height: 38,
                borderRadius: 9999,
                backgroundColor: NATURE_CONFIG.RECURRING_MONTHLY.color,
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
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
                  {monthlyBudgetPct.toFixed(1)}%
                </span>
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginTop: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(monthlyAmount, targetCurrency)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {totalNatureSpent > 0 ? Math.round((monthlyAmount / totalNatureSpent) * 100) : 0}% of cycle spent
              </div>
            </div>
          </div>

          {/* 3. One-off Expenses */}
          <div
            style={{
              padding: '14px 18px 14px 14px',
              borderRadius: 14,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              minHeight: 88,
              boxSizing: 'border-box',
            }}
          >
            {/* Color Indicator Vertical Tape / Stripe */}
            <div
              style={{
                width: 4,
                height: 38,
                borderRadius: 9999,
                backgroundColor: NATURE_CONFIG.ONE_OFF.color,
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {NATURE_CONFIG.ONE_OFF.label}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#2563EB',
                  }}
                >
                  {oneOffBudgetPct.toFixed(1)}%
                </span>
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginTop: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(oneOffAmount, targetCurrency)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {totalNatureSpent > 0 ? Math.round((oneOffAmount / totalNatureSpent) * 100) : 0}% of cycle spent
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
