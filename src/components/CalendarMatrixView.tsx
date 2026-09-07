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

        {/* Matrix Grid with Weekly Total Column */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 680 }}>
            {/* Weekdays Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr) 110px',
                gap: 4,
                marginBottom: 6,
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
              }}
            >
              <div>SUN</div>
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
              <div style={{ color: 'var(--primary-blue)' }}>WEEKLY TOTAL</div>
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
                    gridTemplateColumns: 'repeat(7, 1fr) 110px',
                    gap: 4,
                    marginBottom: 4,
                  }}
                >
                  {week.map((cell, cIdx) => {
                    if (!cell.dayNumber || !cell.dateStr) {
                      return (
                        <div
                          key={cIdx}
                          style={{
                            height: 80,
                            borderRadius: 8,
                            backgroundColor: 'var(--bg-secondary)',
                            opacity: 0.5,
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
                          height: 80,
                          borderRadius: 8,
                          border: isSelected
                            ? '2px solid var(--primary-blue)'
                            : isToday
                            ? '1px solid var(--primary-blue-light)'
                            : '1px solid var(--border-light)',
                          backgroundColor: isSelected
                            ? 'var(--bg-tertiary)'
                            : hasExpenses
                            ? '#FFFFFF'
                            : 'var(--bg-secondary)',
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: isToday ? 800 : 600,
                              color: isToday ? 'var(--primary-blue)' : 'var(--text-primary)',
                            }}
                          >
                            {cell.dayNumber}
                          </span>
                          {hasExpenses && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                color: 'var(--text-muted)',
                                fontWeight: 600,
                              }}
                            >
                              {dayData.itemCount}
                            </span>
                          )}
                        </div>

                        {hasExpenses ? (
                          <div
                            className="tabular-nums"
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--expense-rose)',
                              backgroundColor: 'var(--expense-bg)',
                              borderRadius: 4,
                              padding: '2px 4px',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            -{formatCurrency(dayData.totalAmount, targetCurrency)}
                          </div>
                        ) : (
                          <div style={{ height: 16 }} />
                        )}
                      </div>
                    );
                  })}

                  {/* Weekly Total Column Cell */}
                  <div
                    style={{
                      height: 80,
                      borderRadius: 8,
                      backgroundColor: weekTotal > 0 ? 'var(--bg-tertiary)' : 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                      Week {wIdx + 1}
                    </div>
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        color: weekTotal > 0 ? 'var(--primary-blue)' : 'var(--text-muted)',
                      }}
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
                      orig. {formatCurrency(tx.originalAmount, tx.originalCurrency)}
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
