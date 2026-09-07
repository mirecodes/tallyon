import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerPopoverProps {
  /** Selected year-month in "YYYY-MM" format */
  value: string;
  /** Callback when user selects a year-month */
  onChange: (yearMonth: string) => void;
  /** Trigger button label / display element */
  children?: React.ReactNode;
  /** Custom style for trigger button or wrapper */
  align?: 'left' | 'right' | 'center';
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec'
];

export const MonthPickerPopover: React.FC<MonthPickerPopoverProps> = ({
  value,
  onChange,
  children,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial year and month
  const parseYM = (ym: string) => {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    const [y, m] = ym.split('-');
    return { year: parseInt(y, 10), month: parseInt(m, 10) };
  };

  const { year: activeYear, month: activeMonth } = parseYM(value);
  const [viewYear, setViewYear] = useState<number>(activeYear);

  // Sync view year when value changes externally or when popover opens
  useEffect(() => {
    if (isOpen) {
      setViewYear(activeYear);
    }
  }, [isOpen, activeYear]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectMonth = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, '0');
    const selectedYM = `${viewYear}-${formattedMonth}`;
    onChange(selectedYM);
    setIsOpen(false);
  };

  const alignStyles: React.CSSProperties =
    align === 'right'
      ? { right: 0 }
      : align === 'center'
      ? { left: '50%', transform: 'translateX(-50%)' }
      : { left: 0 };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger element */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
      >
        {children}
      </div>

      {/* Floating Month Picker Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            ...alignStyles,
            zIndex: 99999,
            width: 220,
            backgroundColor: '#FFFFFF',
            opacity: 1,
            border: '1px solid var(--border-light)',
            borderRadius: 12,
            boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.18), 0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            padding: '12px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header: < Year > */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewYear((y) => y - 1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-secondary)',
              }}
              title="Previous Year"
            >
              <ChevronLeft size={16} />
            </button>

            <span
              style={{
                fontWeight: 700,
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
              }}
            >
              {viewYear}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewYear((y) => y + 1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-secondary)',
              }}
              title="Next Year"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month Grid: 4 columns x 3 rows (Jan ~ Dec) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
            }}
          >
            {MONTH_NAMES.map((name, index) => {
              const isSelected = viewYear === activeYear && index + 1 === activeMonth;
              const now = new Date();
              const isThisMonth = viewYear === now.getFullYear() && index === now.getMonth();

              return (
                <button
                  key={name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectMonth(index);
                  }}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 800 : isThisMonth ? 700 : 500,
                    backgroundColor: isSelected
                      ? 'var(--primary-blue)'
                      : isThisMonth
                      ? 'var(--bg-tertiary)'
                      : 'transparent',
                    color: isSelected
                      ? '#FFFFFF'
                      : isThisMonth
                      ? 'var(--primary-blue)'
                      : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isThisMonth
                        ? 'var(--bg-tertiary)'
                        : 'transparent';
                    }
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
