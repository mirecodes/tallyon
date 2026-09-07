import React from 'react';
import { Wallet, Calendar as CalendarIcon, List, PieChart, Target, Cloud, CloudOff, LogOut, User as UserIcon } from 'lucide-react';
import { isSupabaseConfigured, useSupabaseUser, signInWithGoogle, signOutUser } from '../services/supabase';

interface HeaderProps {
  activeTab: 'dashboard' | 'calendar' | 'transactions' | 'analytics' | 'budget';
  setActiveTab: (tab: 'dashboard' | 'calendar' | 'transactions' | 'analytics' | 'budget') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { user, isLoading } = useSupabaseUser();
  const isAnonymous = user?.is_anonymous ?? true;
  const userEmail = user?.email;
  const userAvatar = user?.user_metadata?.avatar_url;
  const userName = user?.user_metadata?.full_name || userEmail?.split('@')[0];

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
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Brand Logo & Name */}
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
            title={isSupabaseConfigured ? 'Connected to Supabase Cloud' : 'Running in Local Storage Mode'}
          >
            {isSupabaseConfigured ? <Cloud size={11} /> : <CloudOff size={11} />}
            <span>{isSupabaseConfigured ? 'Cloud Sync' : 'Local'}</span>
          </span>
        </div>

        {/* Center: Navigation Pill Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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

          {/* Right: Google Sign In / Account Status */}
          {isSupabaseConfigured && !isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user && !isAnonymous ? (
                // Authenticated Google User Account
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px 4px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName || 'User'}
                      style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-blue)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                      }}
                    >
                      <UserIcon size={12} />
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={userEmail || userName}
                  >
                    {userName}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Sign out of your Tallyon account?')) {
                        signOutUser();
                      }
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 3,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 4,
                      transition: 'color 0.15s ease',
                    }}
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              ) : (
                // Anonymous or Guest: Offer Google Sign In
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                    gap: 6,
                    fontWeight: 700,
                  }}
                  title="Sign in with Google to isolate and sync your personal data across devices"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google Sign In</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

