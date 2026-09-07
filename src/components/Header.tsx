import React from 'react';
import type { TargetCurrency } from '../types';
import { Plus, Wallet, Calendar as CalendarIcon, List, PieChart } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'calendar' | 'transactions' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'calendar' | 'transactions' | 'analytics') => void;
  targetCurrency: TargetCurrency;
  setTargetCurrency: (curr: TargetCurrency) => void;
  onOpenNewModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  targetCurrency,
  setTargetCurrency,
  onOpenNewModal,
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.75rem 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Wallet size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Tally<span style={{ color: 'var(--primary-blue)' }}>on</span>
            </div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              MULTI-CURRENCY TRACKER
            </div>
          </div>
        </div>

        {/* View Navigation Pill Tabs */}
        <nav className="pill-tab-bar">
          <button
            type="button"
            className={`pill-tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <PieChart size={15} /> Dashboard
          </button>
          <button
            type="button"
            className={`pill-tab-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <CalendarIcon size={15} /> Calendar
          </button>
          <button
            type="button"
            className={`pill-tab-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <List size={15} /> Transactions
          </button>
          <button
            type="button"
            className={`pill-tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <PieChart size={15} /> Analytics
          </button>
        </nav>

        {/* Right Actions: Currency Toggle & Add Expense CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Target Currency Selector Pill */}
          <div
            style={{
              display: 'flex',
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
                padding: '4px 10px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: targetCurrency === 'CHF' ? 'var(--primary-blue)' : 'transparent',
                color: targetCurrency === 'CHF' ? '#FFFFFF' : 'var(--text-secondary)',
                boxShadow: targetCurrency === 'CHF' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              CHF
            </button>
            <button
              type="button"
              onClick={() => setTargetCurrency('KRW')}
              style={{
                padding: '4px 10px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: targetCurrency === 'KRW' ? 'var(--primary-blue)' : 'transparent',
                color: targetCurrency === 'KRW' ? '#FFFFFF' : 'var(--text-secondary)',
                boxShadow: targetCurrency === 'KRW' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              KRW
            </button>
          </div>

          {/* Quick Add Button */}
          <button type="button" className="btn-primary" onClick={onOpenNewModal}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
