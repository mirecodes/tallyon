import React from 'react';
import type { TargetCurrency } from '../types';
import { Coins, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MonthPickerPopover } from './MonthPickerPopover';

interface ControlBarProps {
  selectedYearMonth: string; // "YYYY-MM" or "ALL"
  setSelectedYearMonth: (ym: string) => void;
  targetCurrency: TargetCurrency;
  setTargetCurrency: (curr: TargetCurrency) => void;
}

const SUPPORTED_CURRENCIES: Array<{ code: TargetCurrency; symbol: string; label: string }> = [
  { code: 'KRW', symbol: '₩', label: 'KRW' },
  { code: 'CHF', symbol: 'Fr.', label: 'CHF' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'USD', symbol: '$', label: 'USD' },
];

export const ControlBar: React.FC<ControlBarProps> = ({
  selectedYearMonth,
  setSelectedYearMonth,
  targetCurrency,
  setTargetCurrency,
}) => {
  const isAll = selectedYearMonth === 'ALL';

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const parseYM = (ym: string) => {
    const [y, m] = ym.split('-');
    return { year: parseInt(y, 10), month: parseInt(m, 10) };
  };

  const prevMonth = () => {
    const { year, month } = parseYM(isAll ? currentYM : selectedYearMonth);
    const d = new Date(year, month - 2, 1);
    setSelectedYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const { year, month } = parseYM(isAll ? currentYM : selectedYearMonth);
    const d = new Date(year, month, 1);
    setSelectedYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Format label for display
  let monthLabel = 'All Time';
  if (!isAll) {
    const { year, month } = parseYM(selectedYearMonth);
    const d = new Date(year, month - 1, 1);
    monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* Left: Global Month Navigator */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          backgroundColor: '#FFFFFF',
          padding: '3px 6px',
          borderRadius: '9999px',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--primary-blue)',
            paddingLeft: '6px',
            paddingRight: '2px',
          }}
        >
          <Calendar size={14} />
        </span>

        <button
          type="button"
          onClick={prevMonth}
          disabled={isAll}
          style={{
            padding: '3px 6px',
            borderRadius: '9999px',
            color: isAll ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: isAll ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Previous Month"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Clickable Month Label with Floating MonthPickerPopover */}
        {isAll ? (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              minWidth: 72,
              textAlign: 'center',
              padding: '2px 6px',
            }}
          >
            {monthLabel}
          </span>
        ) : (
          <MonthPickerPopover
            value={selectedYearMonth}
            onChange={(ym) => setSelectedYearMonth(ym)}
            align="center"
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                minWidth: 72,
                textAlign: 'center',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              title="Click to select month"
            >
              {monthLabel}
            </span>
          </MonthPickerPopover>
        )}

        <button
          type="button"
          onClick={nextMonth}
          disabled={isAll}
          style={{
            padding: '3px 6px',
            borderRadius: '9999px',
            color: isAll ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: isAll ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Next Month"
        >
          <ChevronRight size={14} />
        </button>

        {/* Quick buttons: Current Month & All */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
          <button
            type="button"
            onClick={() => setSelectedYearMonth(currentYM)}
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: selectedYearMonth === currentYM ? 700 : 500,
              backgroundColor: selectedYearMonth === currentYM ? 'var(--bg-tertiary)' : 'transparent',
              color: selectedYearMonth === currentYM ? 'var(--primary-blue)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setSelectedYearMonth(isAll ? currentYM : 'ALL')}
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: isAll ? 700 : 500,
              backgroundColor: isAll ? 'var(--primary-blue)' : 'transparent',
              color: isAll ? '#FFFFFF' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isAll ? 'var(--shadow-sm)' : 'none',
            }}
          >
            All
          </button>
        </div>
      </div>

      {/* Right: Currency Selector Pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          backgroundColor: '#FFFFFF',
          padding: '3px 6px',
          borderRadius: '9999px',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-muted)',
            paddingLeft: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            gap: 4,
          }}
        >
          <Coins size={13} color="var(--primary-blue)" />
          <span>Currency:</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {SUPPORTED_CURRENCIES.map((c) => {
            const isActive = targetCurrency === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setTargetCurrency(c.code)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 800 : 600,
                  backgroundColor: isActive ? 'var(--primary-blue)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 1px 3px rgba(37, 99, 235, 0.3)' : 'none',
                  transition: 'all 0.15s ease',
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: 1.2,
                }}
                title={`Switch display currency to ${c.code}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
