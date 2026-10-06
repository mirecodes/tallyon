import React, { useState } from 'react';
import type { TargetCurrency, DailyAggregate, ValuatedTransaction } from '../types';
import { formatCurrency, toLocalDateString } from '../utils/currency';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Banknote } from 'lucide-react';
import { cycleLabel } from '../utils/fixedExpenses';
import { useCategories } from '../utils/categories';

interface CalendarMatrixViewProps {
  calendarMap: Record<string, DailyAggregate>;
  targetCurrency: TargetCurrency;
  onSelectTransaction?: (tx: ValuatedTransaction) => void;
  selectedYearMonth?: string;
  onMonthChange?: (ym: string) => void;
  flexibleBudget?: number;            // Month's flexible budget in targetCurrency
}

const VIEW_MODES = [
  { key: 'both', label: 'Daily total + flexible' },
  { key: 'total', label: 'Daily total only' },
  { key: 'flex', label: 'Flexible only' },
] as const;
type ViewMode = (typeof VIEW_MODES)[number]['key'];

const flexibleOf = (d?: DailyAggregate) =>
  d ? d.transactions.reduce((s, t) => (t.isFixed ? s : s + t.convertedAmount), 0) : 0;

export const CalendarMatrixView: React.FC<CalendarMatrixViewProps> = ({
  calendarMap,
  targetCurrency,
  onSelectTransaction,
  selectedYearMonth,
  onMonthChange,
  flexibleBudget = 0,
}) => {
  const [internalDate, setInternalDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const modeIdx = VIEW_MODES.findIndex((m) => m.key === viewMode);
  const { categories } = useCategories();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  // Categories present this month (plus any still selected), in the user's category order
  const categoryChips = React.useMemo(() => {
    const present = new Set(selectedCategories);
    for (const d of Object.values(calendarMap)) for (const t of d.transactions) present.add(t.category);
    const ordered = categories.map((c) => c.name).filter((n) => present.has(n));
    return [...ordered, ...[...present].filter((n) => !ordered.includes(n))];
  }, [calendarMap, categories, selectedCategories]);

  // Daily aggregates narrowed to the selected categories (all when none selected)
  const filteredMap = React.useMemo(() => {
    if (selectedCategories.length === 0) return calendarMap;
    const out: Record<string, DailyAggregate> = {};
    for (const [date, d] of Object.entries(calendarMap)) {
      const transactions = d.transactions.filter((t) => selectedCategories.includes(t.category));
      out[date] = {
        date,
        transactions,
        itemCount: transactions.length,
        totalAmount: transactions.reduce((s, t) => s + t.convertedAmount, 0),
      };
    }
    return out;
  }, [calendarMap, selectedCategories]);

  const filteredMonthTotal = Object.values(filteredMap).reduce(
    (s, d) => s + (viewMode === 'flex' ? flexibleOf(d) : d.totalAmount),
    0
  );

  const selectedDayData: DailyAggregate | null = selectedDate
    ? filteredMap[selectedDate] ?? { date: selectedDate, totalAmount: 0, itemCount: 0, transactions: [] }
    : null;

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

  // A day overspends when its flexible spending exceeds twice the even daily share of the flexible budget
  const overspendThreshold = (2 * flexibleBudget) / new Date(year, month + 1, 0).getDate();

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
      {/* Calendar + category filter, stacked as one joined unit */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="card" style={{ padding: '1.5rem', borderRadius: '16px 16px 6px 6px' }}>
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
            <div className="dot-slider" role="radiogroup" aria-label="Calendar amounts" style={{ marginRight: '0.5rem' }}>
              <span className="dot-slider-thumb" style={{ transform: `translateX(${modeIdx * 22}px)` }} />
              {VIEW_MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={viewMode === m.key}
                  aria-label={m.label}
                  title={m.label}
                  className="dot-slider-dot"
                  onClick={() => setViewMode(m.key)}
                />
              ))}
            </div>
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
                {viewMode === 'flex' ? 'WEEK FLEXIBLE' : 'WEEK TOTAL'}
              </div>
            </div>

            {/* Weeks */}
            {weeks.map((week, wIdx) => {
              // Calculate weekly total
              let weekTotal = 0;
              for (const cell of week) {
                const d = cell.dateStr ? filteredMap[cell.dateStr] : undefined;
                if (d) weekTotal += viewMode === 'flex' ? flexibleOf(d) : d.totalAmount;
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

                    const dayData = filteredMap[cell.dateStr];
                    const isToday = cell.dateStr === todayStr;
                    const hasExpenses = dayData && dayData.totalAmount > 0;
                    const isSelected = selectedDayData?.date === cell.dateStr;
                    const flex = flexibleOf(dayData);
                    const isOverspent = overspendThreshold > 0 && flex > overspendThreshold;
                    const flexTitle = `Flexible spending: ${formatCurrency(flex, targetCurrency)}${
                      isOverspent ? ` (over daily limit ${formatCurrency(overspendThreshold, targetCurrency)})` : ''
                    }`;
                    const pillAmount = viewMode === 'flex' ? flex : dayData?.totalAmount ?? 0;

                    return (
                      <div
                        key={cIdx}
                        onClick={() => setSelectedDate(cell.dateStr)}
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

                        {/* Flexible spending line + glass total pill (compact, tight font to prevent overflow) */}
                        {pillAmount > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                            {viewMode === 'both' && flex > 0 && (
                              <div
                                className="tabular-nums"
                                style={{
                                  fontSize: '0.625rem',
                                  fontWeight: isOverspent ? 800 : 600,
                                  color: isOverspent ? 'var(--expense-rose)' : 'var(--text-muted)',
                                  textAlign: 'right',
                                  padding: '0 5px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  letterSpacing: '-0.02em',
                                }}
                                title={flexTitle}
                              >
                                {formatCurrency(flex, targetCurrency)}
                              </div>
                            )}
                            <div
                              className="tabular-nums glass-pill"
                              style={viewMode === 'flex' && isOverspent ? { color: 'var(--expense-rose)', fontWeight: 800 } : undefined}
                              title={
                                viewMode === 'flex'
                                  ? flexTitle
                                  : `${formatCurrency(dayData.totalAmount, targetCurrency)} (${dayData.itemCount} items)`
                              }
                            >
                              -{formatCurrency(pillAmount, targetCurrency)}
                            </div>
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

      {/* Category Filter Card */}
      <div className="card" style={{ padding: '1rem 1.5rem', borderRadius: '6px 6px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: 4 }}>
            CATEGORY
          </span>
          {['All', ...categoryChips].map((cat) => {
            const active = cat === 'All' ? selectedCategories.length === 0 : selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => (cat === 'All' ? setSelectedCategories([]) : toggleCategory(cat))}
                className="tag-pill-outline"
                style={{
                  backgroundColor: active ? 'var(--primary-blue)' : 'transparent',
                  color: active ? '#FFFFFF' : 'var(--text-secondary)',
                  borderColor: active ? 'var(--primary-blue)' : 'var(--border-light)',
                  fontSize: '0.75rem',
                }}
              >
                {cat}
              </button>
            );
          })}
          {selectedCategories.length > 0 && (
            <span
              className="tabular-nums"
              style={{ marginLeft: 'auto', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--primary-blue)' }}
              title={viewMode === 'flex' ? 'Flexible spending in selected categories' : 'Spending in selected categories'}
            >
              {formatCurrency(filteredMonthTotal, targetCurrency)}
            </span>
          )}
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
                        {tx.isCash && (
                          <span
                            className="tag-pill-outline tag-pill-cash"
                            style={{ fontSize: '0.6875rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          >
                            <Banknote size={11} strokeWidth={2.5} />
                            Cash
                          </span>
                        )}
                        <span
                          className={`tag-pill-outline ${
                            tx.expenseNature === 'ONE_OFF'
                              ? 'nature-one-off'
                              : tx.expenseNature === 'RECURRING_MONTHLY'
                              ? 'nature-monthly'
                              : 'nature-yearly'
                          }`}
                          style={{
                            fontSize: '0.6875rem',
                            ...(tx.isFixed
                              ? {
                                  backgroundColor: 'var(--bg-tertiary)',
                                  borderColor: 'var(--primary-blue-tint)',
                                  color: 'var(--primary-blue)',
                                  fontWeight: 700,
                                }
                              : {}),
                          }}
                        >
                          {cycleLabel(tx)}
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
