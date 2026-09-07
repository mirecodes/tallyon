import React from 'react';
import type { TargetCurrency } from '../types';
import { Plus } from 'lucide-react';

interface ActionBarProps {
  targetCurrency: TargetCurrency;
  setTargetCurrency: (curr: TargetCurrency) => void;
  onOpenNewModal: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  targetCurrency,
  setTargetCurrency,
  onOpenNewModal,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        padding: '0.75rem 1.25rem',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 14,
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Left: Currency Toggle Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Display Currency:
        </span>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 9999,
            padding: 2,
            border: '1px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            onClick={() => setTargetCurrency('CHF')}
            style={{
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: targetCurrency === 'CHF' ? 'var(--primary-blue)' : 'transparent',
              color: targetCurrency === 'CHF' ? '#FFFFFF' : 'var(--text-secondary)',
              boxShadow: targetCurrency === 'CHF' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            CHF (Fr.)
          </button>
          <button
            type="button"
            onClick={() => setTargetCurrency('KRW')}
            style={{
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: targetCurrency === 'KRW' ? 'var(--primary-blue)' : 'transparent',
              color: targetCurrency === 'KRW' ? '#FFFFFF' : 'var(--text-secondary)',
              boxShadow: targetCurrency === 'KRW' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            KRW (₩)
          </button>
        </div>
      </div>

      {/* Right: Add Expense Action Button */}
      <button type="button" className="btn-primary" onClick={onOpenNewModal}>
        <Plus size={16} strokeWidth={2.5} />
        <span>Add Expense</span>
      </button>
    </div>
  );
};
