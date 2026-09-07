import React, { useState } from 'react';
import { Wallet, Calendar as CalendarIcon, List, PieChart, Target, Cloud, CloudOff, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isAnonymous = user?.is_anonymous ?? true;
  const userEmail = user?.email;
  const userAvatar = user?.user_metadata?.avatar_url;
  const userName = user?.user_metadata?.full_name || userEmail?.split('@')[0];

  const navItems: Array<{
    key: 'dashboard' | 'calendar' | 'transactions' | 'analytics' | 'budget';
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: 'dashboard', label: 'Dashboard', icon: <PieChart size={14} /> },
    { key: 'calendar', label: 'Calendar', icon: <CalendarIcon size={14} /> },
    { key: 'transactions', label: 'Transactions', icon: <List size={14} /> },
    { key: 'analytics', label: 'Analytics', icon: <PieChart size={14} /> },
    { key: 'budget', label: 'Budget', icon: <Target size={14} /> },
  ];

  const currentNav = navItems.find((item) => item.key === activeTab) || navItems[0];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.625rem 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          gap: '0.75rem',
        }}
      >
        {/* Left: Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
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
        </div>

        {/* Center Desktop: Navigation Pill Tabs (hidden on mobile via CSS) */}
        <nav
          className="pill-tab-bar desktop-nav-bar"
          style={{
            flexShrink: 0,
            padding: '3px',
            gap: '2px',
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`pill-tab-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', fontSize: '0.8rem' }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* Center Mobile: Current Tab Accordion Toggle Button */}
        <div className="mobile-nav-toggle-wrapper">
          <button
            type="button"
            className="mobile-nav-toggle-btn"
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {currentNav.icon}
              <span>{currentNav.label}</span>
            </span>
            <ChevronDown
              size={15}
              style={{
                transform: isMobileNavOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
        </div>

        {/* Right: Cloud Sync Status + Auth Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Cloud Sync Status Icon immediately to the left of Auth */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: isSupabaseConfigured ? 'var(--income-bg)' : 'var(--bg-secondary)',
              color: isSupabaseConfigured ? 'var(--income-emerald)' : 'var(--text-muted)',
              border: '1px solid var(--border-light)',
              cursor: 'help',
              transition: 'all 0.2s ease',
            }}
            title={isSupabaseConfigured ? 'Cloud Sync Active (Supabase PostgreSQL)' : 'Local Storage Mode'}
          >
            {isSupabaseConfigured ? <Cloud size={14} strokeWidth={2.2} /> : <CloudOff size={14} strokeWidth={2.2} />}
          </span>
          {isSupabaseConfigured && !isLoading && (
            <>
              {user && !isAnonymous ? (
                // Authenticated Google User Account
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px 3px 4px',
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
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      maxWidth: 100,
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
                      padding: 2,
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
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                    gap: 6,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                  title="Sign in with Google to isolate and sync your personal data"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24">
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
                  <span>Sign In</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Accordion Dropdown Menu */}
      {isMobileNavOpen && (
        <div className="mobile-nav-dropdown">
          <div className="container" style={{ padding: '0.5rem 1rem' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                backgroundColor: 'var(--bg-secondary)',
                padding: '6px',
                borderRadius: 14,
                border: '1px solid var(--border-light)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              }}
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      setIsMobileNavOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 10,
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                      color: isActive ? 'var(--primary-blue)' : 'var(--text-primary)',
                      boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.15s ease',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {isActive && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-blue)',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

