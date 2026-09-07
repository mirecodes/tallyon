import React, { useState } from 'react';
import type { TargetCurrency, DailyAggregate, ValuatedTransaction } from '../types';
import { formatCurrency, toLocalDateString } from '../utils/currency';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';

interface CalendarMatrixViewProps {
  calendarMap: Record<string, DailyAggregate>;
  targetCurrency: TargetCurrency;
  onSelectTransaction?: (tx: ValuatedTransaction) => void;
  selectedYearMonth?: string;
  onMonthChange?: (ym: string) => void;
}

export const CalendarMatrixView: React.FC<CalendarMatrixViewProps> = ({
  calendarMap,
  targetCurrency,
  onSelectTransaction,
  selectedYearMonth,
  onMonthChange,
}) => {
  const [internalDate, setInternalDate] = useState(() => new Date());
  const [selectedDayData, setSelectedDayData] = useState<DailyAggregate | null>(null);

  // Derive current viewing date from selectedYearMonth if provided
  const currentDate = React.useMemo(() => {
    if (selectedYearMonth && selectedYearMonth !== 'ALL') {
      const [y, m] = selectedYearMonth.split('-');
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    }
    return internalDate;
  }, [selectedYearMonth, internalDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setInternalDate(d);
    onMonthChange?.(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setInternalDate(d);
    onMonthChange?.(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToday = () => {
    const d = new Date();
    setInternalDate(d);
    onMonthChange?.(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Month title format
  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });

  // Compute days in month and calendar grid
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid weeks
  const weeks: Array<Array<{ dayNumber: number | null; dateStr: string | null }>> = [];
  let currentWeek: Array<{ dayNumber: number | null; dateStr: string | null }> = [];

  // Pad beginning of first week
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ dayNumber: null, dateStr: null });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    currentWeek.push({ dayNumber: day, dateStr: dStr });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Pad end of last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ dayNumber: null, dateStr: null });
    }
    weeks.push(currentWeek);
  }

  const todayStr = toLocalDateString(new Date());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Calendar Card Container */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {/* Top Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
              {monthName} <span style={{ color: 'var(--primary-blue)' }}>{year}</span>
            </h2>
            <button
              type="button"
              onClick={goToday}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Today
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={prevMonth}
              className="btn-secondary"
              style={{ padding: '6px 10px' }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="btn-secondary"
              style={{ padding: '6px 10px' }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Matrix Grid with Separated Weekly Summary */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 700 }}>
            {/* Weekdays Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr) 120px',
                gap: 6,
                marginBottom: 8,
                textAlign: 'center',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              <div style={{ color: '#E11D48', padding: '4px 0' }}>SUN</div>
              <div style={{ color: 'var(--text-muted)', padding: '4px 0' }}>MON</div>
              <div style={{ color: 'var(--text-muted)', padding: '4px 0' }}>TUE</div>
              <div style={{ color: 'var(--text-muted)', padding: '4px 0' }}>WED</div>
              <div style={{ color: 'var(--text-muted)', padding: '4px 0' }}>THU</div>
              <div style={{ color: 'var(--text-muted)', padding: '4px 0' }}>FRI</div>
              <div style={{ color: '#2563EB', padding: '4px 0' }}>SAT</div>
              <div
                style={{
                  color: 'var(--text-secondary)',
                  padding: '4px 0',
                  borderLeft: '1px dashed var(--border-light)',
                  paddingLeft: 4,
                }}
              >
                WEEK TOTAL
              </div>
            </div>

            {/* Weeks */}
            {weeks.map((week, wIdx) => {
              // Calculate weekly total
              let weekTotal = 0;
              for (const cell of week) {
                if (cell.dateStr && calendarMap[cell.dateStr]) {
                  weekTotal += calendarMap[cell.dateStr].totalAmount;
                }
              }
              const formattedWeekTotal = targetCurrency === 'KRW' ? Math.round(weekTotal) : Number(weekTotal.toFixed(2));

              return (
                <div
                  key={wIdx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr) 120px',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  {/* 7 Days of the Week */}
                  {week.map((cell, cIdx) => {
                    const isSunday = cIdx === 0;
                    const isSaturday = cIdx === 6;

                    // Weekend subtle background tints
                    const defaultDayBg = isSunday
                      ? 'rgba(254, 226, 226, 0.4)' // soft red tint for Sunday
                      : isSaturday
                      ? 'rgba(219, 234, 254, 0.4)' // soft blue tint for Saturday
                      : 'var(--bg-primary)';

                    if (!cell.dayNumber || !cell.dateStr) {
                      return (
                        <div
                          key={cIdx}
                          style={{
                            height: 76,
                            borderRadius: 10,
                            backgroundColor: isSunday
                              ? 'rgba(254, 226, 226, 0.15)'
                              : isSaturday
                              ? 'rgba(219, 234, 254, 0.15)'
                              : 'var(--bg-secondary)',
                            opacity: 0.4,
                            border: '1px dashed var(--border-light)',
                          }}
                        />
                      );
                    }

                    const dayData = calendarMap[cell.dateStr];
                    const isToday = cell.dateStr === todayStr;
                    const hasExpenses = dayData && dayData.totalAmount > 0;
                    const isSelected = selectedDayData?.date === cell.dateStr;

                    return (
                      <div
                        key={cIdx}
                        onClick={() => setSelectedDayData(dayData || { date: cell.dateStr!, totalAmount: 0, itemCount: 0, transactions: [] })}
                        style={{
                          height: 76,
                          borderRadius: 10,
                          border: isSelected
                            ? '2px solid var(--primary-blue)'
                            : isToday
                            ? '1.5px solid var(--primary-blue-light)'
                            : isSunday
                            ? '1px solid rgba(254, 202, 202, 0.8)'
                            : isSaturday
                            ? '1px solid rgba(191, 219, 254, 0.8)'
                            : '1px solid var(--border-light)',
                          backgroundColor: isSelected
                            ? 'var(--bg-tertiary)'
                            : defaultDayBg,
                          padding: '5px 6px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                        }}
                      >
                        {/* Day Number Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: isToday ? 800 : 700,
                              color: isToday
                                ? 'var(--primary-blue)'
                                : isSunday
                                ? '#E11D48'
                                : isSaturday
                                ? '#2563EB'
                                : 'var(--text-primary)',
                            }}
                          >
                            {cell.dayNumber}
                          </span>
                          {hasExpenses && (
                            <span
                              style={{
                                fontSize: '0.625rem',
                                color: 'var(--text-muted)',
                                fontWeight: 700,
                                backgroundColor: 'var(--bg-secondary)',
                                padding: '1px 4px',
                                borderRadius: 4,
                                border: '1px solid var(--border-light)',
                              }}
                            >
                              {dayData.itemCount}
                            </span>
                          )}
                        </div>

                        {/* Expense Amount Pill (compact, tight font to prevent overflow/distortion) */}
                        {hasExpenses ? (
                          <div
                            className="tabular-nums"
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              color: 'var(--expense-rose)',
                              backgroundColor: 'rgba(255, 228, 230, 0.85)',
                              borderRadius: 4,
                              padding: '1px 3px',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              letterSpacing: '-0.02em',
                            }}
                            title={`${formatCurrency(dayData.totalAmount, targetCurrency)} (${dayData.itemCount} items)`}
                          >
                            -{formatCurrency(dayData.totalAmount, targetCurrency)}
                          </div>
                        ) : (
                          <div style={{ height: 14 }} />
                        )}
                      </div>
                    );
                  })}

                  {/* Distinct Separated Weekly Total Panel */}
                  <div
                    style={{
                      height: 76,
                      borderRadius: 10,
                      backgroundColor: weekTotal > 0 ? 'var(--bg-secondary)' : 'transparent',
                      borderLeft: '1px dashed var(--border-light)',
                      borderRight: '1px solid var(--border-light)',
                      borderTop: '1px solid var(--border-light)',
                      borderBottom: '1px solid var(--border-light)',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      textAlign: 'right',
                      marginLeft: 2,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Week {wIdx + 1}
                    </div>
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: weekTotal > 0 ? 'var(--primary-blue)' : 'var(--text-muted)',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                      title={formatCurrency(formattedWeekTotal, targetCurrency)}
                    >
                      {formatCurrency(formattedWeekTotal, targetCurrency)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Inspector Side/Bottom Sheet */}
      {selectedDayData && (
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalIcon size={18} color="var(--primary-blue)" />
                <h3 style={{ fontSize: '1rem', margin: 0 }}>
                  Date: <span style={{ color: 'var(--text-primary)' }}>{selectedDayData.date}</span>
                </h3>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {selectedDayData.itemCount} transaction(s) recorded
              </div>
            </div>

            <div className="tabular-nums" style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--expense-rose)' }}>
              Total: -{formatCurrency(selectedDayData.totalAmount, targetCurrency)}
            </div>
          </div>

          {selectedDayData.transactions.length === 0 ? (
            <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No transactions recorded on this date.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedDayData.transactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction?.(tx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: onSelectTransaction ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tx.description}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                        <span className="tag-pill-outline" style={{ fontSize: '0.6875rem' }}>
                          {tx.category}
                        </span>
                        <span
                          className={`tag-pill-outline ${
                            tx.expenseNature === 'ONE_OFF'
                              ? 'nature-one-off'
                              : tx.expenseNature === 'RECURRING_MONTHLY'
                              ? 'nature-monthly'
                              : 'nature-yearly'
                          }`}
                          style={{ fontSize: '0.6875rem' }}
                        >
                          {tx.expenseNature === 'ONE_OFF'
                            ? 'One-off'
                            : tx.expenseNature === 'RECURRING_MONTHLY'
                            ? 'Monthly'
                            : 'Yearly'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="tabular-nums"
                      style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}
                    >
                      {formatCurrency(tx.convertedAmount, targetCurrency)}
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatCurrency(tx.originalAmount, tx.originalCurrency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
