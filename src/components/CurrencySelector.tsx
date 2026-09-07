import React from 'react';
import type { TargetCurrency } from '../types';
import { Coins } from 'lucide-react';

interface CurrencySelectorProps {
  targetCurrency: TargetCurrency;
  setTargetCurrency: (curr: TargetCurrency) => void;
}

const SUPPORTED_CURRENCIES: Array<{ code: TargetCurrency; symbol: string; label: string }> = [
  { code: 'KRW', symbol: '₩', label: 'KRW' },
  { code: 'CHF', symbol: 'Fr.', label: 'CHF' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'USD', symbol: '$', label: 'USD' },
];

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  targetCurrency,
  setTargetCurrency,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
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
