import React from 'react';
import { Wallet, Calendar as CalendarIcon, List, PieChart, Target, Cloud, CloudOff } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

interface HeaderProps {
  activeTab: 'dashboard' | 'calendar' | 'transactions' | 'analytics' | 'budget';
  setActiveTab: (tab: 'dashboard' | 'calendar' | 'transactions' | 'analytics' | 'budget') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
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
        }}
      >
        {/* Brand Logo & Name (Minimal & Clean) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 5px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Wallet size={18} strokeWidth={2.5} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Tally<span style={{ color: 'var(--primary-blue)' }}>on</span>
          </div>

          {/* Cloud Sync Status Indicator */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: isSupabaseConfigured ? 'var(--income-bg)' : 'var(--bg-secondary)',
              color: isSupabaseConfigured ? 'var(--income-emerald)' : 'var(--text-muted)',
              border: '1px solid var(--border-light)',
            }}
            title={isSupabaseConfigured ? 'Connected to Supabase Cloud' : 'Running in Local Storage Mode (Add VITE_SUPABASE_URL to connect)'}
          >
            {isSupabaseConfigured ? <Cloud size={11} /> : <CloudOff size={11} />}
            <span>{isSupabaseConfigured ? 'Cloud Sync' : 'Local'}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Navigation Pill Tabs */}
          <nav className="pill-tab-bar">
            <button
              type="button"
              className={`pill-tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <PieChart size={14} /> Dashboard
            </button>
            <button
              type="button"
              className={`pill-tab-item ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CalendarIcon size={14} /> Calendar
            </button>
            <button
              type="button"
              className={`pill-tab-item ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <List size={14} /> Transactions
            </button>
            <button
              type="button"
              className={`pill-tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <PieChart size={14} /> Analytics
            </button>
            <button
              type="button"
              className={`pill-tab-item ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => setActiveTab('budget')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Target size={14} /> Budget
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

