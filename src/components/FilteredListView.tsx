import React, { useState, useMemo } from 'react';
import type { ValuatedTransaction, TargetCurrency, ExpenseNature } from '../types';
import { formatCurrency, formatDateTime } from '../utils/currency';
import {
  Search,
  Edit2,
  Trash2,
  Coffee,
  ShoppingCart,
  Car,
  Home,
  Tv,
  GraduationCap,
  Tag,
} from 'lucide-react';

interface FilteredListViewProps {
  transactions: ValuatedTransaction[];
  targetCurrency: TargetCurrency;
  onEdit: (tx: ValuatedTransaction) => void;
  onDelete: (id: string) => Promise<void>;
}

// Icon mapper for categories
function getCategoryIcon(category: string) {
  const lower = category.toLowerCase();
  if (lower.includes('food') || lower.includes('coffee') || lower.includes('dining')) {
    return <Coffee size={15} />;
  }
  if (lower.includes('grocery') || lower.includes('shopping')) {
    return <ShoppingCart size={15} />;
  }
  if (lower.includes('transport') || lower.includes('transit') || lower.includes('train')) {
    return <Car size={15} />;
  }
  if (lower.includes('housing') || lower.includes('rent') || lower.includes('utility')) {
    return <Home size={15} />;
  }
  if (lower.includes('sub') || lower.includes('tv') || lower.includes('stream')) {
    return <Tv size={15} />;
  }
  if (lower.includes('edu') || lower.includes('book')) {
    return <GraduationCap size={15} />;
  }
  return <Tag size={15} />;
}

export const FilteredListView: React.FC<FilteredListViewProps> = ({
  transactions,
  targetCurrency,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedNatures, setSelectedNatures] = useState<ExpenseNature[]>([]);

  // Collect unique categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      set.add(tx.category);
    }
    return Array.from(set);
  }, [transactions]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleNature = (nature: ExpenseNature) => {
    setSelectedNatures((prev) =>
      prev.includes(nature) ? prev.filter((n) => n !== nature) : [...prev, nature]
    );
  };

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesCat = tx.category.toLowerCase().includes(q);
        if (!matchesDesc && !matchesCat) return false;
      }

      // 2. Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(tx.category)) {
        return false;
      }

      // 3. Nature filter
      if (selectedNatures.length > 0 && !selectedNatures.includes(tx.expenseNature)) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, selectedCategories, selectedNatures]);

  const handleDeleteWithConfirm = async (id: string, description: string) => {
    if (window.confirm(`Delete expense "${description}"?`)) {
      await onDelete(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search & Filter Bar Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search transactions by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 38,
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Nature Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: 64 }}>
              NATURE:
            </span>
            {(['ONE_OFF', 'RECURRING_MONTHLY', 'RECURRING_YEARLY'] as ExpenseNature[]).map((nature) => {
              const active = selectedNatures.includes(nature);
              const label =
                nature === 'ONE_OFF' ? 'One-off' : nature === 'RECURRING_MONTHLY' ? 'Monthly' : 'Yearly';
              return (
                <button
                  key={nature}
                  type="button"
                  onClick={() => toggleNature(nature)}
                  className="tag-pill-outline"
                  style={{
                    backgroundColor: active ? 'var(--primary-blue)' : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--text-secondary)',
                    borderColor: active ? 'var(--primary-blue)' : 'var(--border-light)',
                    fontSize: '0.75rem',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Category Chips */}
          {allCategories.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: 64 }}>
                CATEGORY:
              </span>
              {allCategories.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
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
            </div>
          )}
        </div>
      </div>

      {/* Transaction List Cards (Timeline Styling from reference DESIGN.md) */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '1.125rem', margin: 0 }}>
            Transactions ({filtered.length})
          </h3>
          {(searchQuery || selectedCategories.length > 0 || selectedNatures.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategories([]);
                setSelectedNatures([]);
              }}
              style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600 }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transactions match the selected criteria.
          </div>
        ) : (
          <div className="timeline-tree">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                style={{
                  position: 'relative',
                  marginBottom: '1.25rem',
                  padding: '12px 16px',
                  borderRadius: 12,
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                className="transaction-row"
              >
                {/* Timeline Circle Icon */}
                <div className="timeline-icon-circle">
                  {getCategoryIcon(tx.category)}
                </div>

                {/* Left Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {tx.description}
                    </span>
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

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 4,
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>{formatDateTime(tx.transactionTime)}</span>
                    <span>•</span>
                    <span>Rate applied: {tx.appliedRateDate}</span>
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {formatCurrency(tx.convertedAmount, targetCurrency)}
                    </div>
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                      }}
                    >
                      orig. {formatCurrency(tx.originalAmount, tx.originalCurrency)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => onEdit(tx)}
                      className="btn-secondary"
                      style={{ padding: '6px', borderRadius: 8 }}
                      title="Edit Transaction"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWithConfirm(tx.id, tx.description)}
                      className="btn-danger-subtle"
                      style={{ padding: '6px', borderRadius: 8 }}
                      title="Delete Transaction"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
