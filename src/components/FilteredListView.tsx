import React, { useState, useMemo } from 'react';
import type { ValuatedTransaction, TargetCurrency, ExpenseNature } from '../types';
import { formatCurrency, formatDateTime } from '../utils/currency';
import {
  Search,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlignJustify,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { getCategoryIconElement, getCategoryColor, useCategories } from '../utils/categories';

interface FilteredListViewProps {
  transactions: ValuatedTransaction[];
  targetCurrency: TargetCurrency;
  onEdit: (tx: ValuatedTransaction) => void;
  onDelete: (id: string) => Promise<void>;
}

export type SortField = 'date' | 'title' | 'amount';
export type SortDirection = 'asc' | 'desc';

export const FilteredListView: React.FC<FilteredListViewProps> = ({
  transactions,
  targetCurrency,
  onEdit,
  onDelete,
}) => {
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedNatures, setSelectedNatures] = useState<ExpenseNature[]>([]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Collect unique categories, ordered by user's custom category list
  const allCategories = useMemo(() => {
    const presentSet = new Set<string>();
    for (const tx of transactions) {
      presentSet.add(tx.category);
    }
    // Order based on custom categories order
    const ordered: string[] = [];
    for (const c of categories) {
      if (presentSet.has(c.name)) {
        ordered.push(c.name);
        presentSet.delete(c.name);
      }
    }
    // Any remaining categories in transactions not found in current categories list
    for (const remaining of presentSet) {
      ordered.push(remaining);
    }
    return ordered;
  }, [transactions, categories]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setCurrentPage(1);
  };

  const toggleNature = (nature: ExpenseNature) => {
    setSelectedNatures((prev) =>
      prev.includes(nature) ? prev.filter((n) => n !== nature) : [...prev, nature]
    );
    setCurrentPage(1);
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default directions: date -> desc (newest), title -> asc (A-Z), amount -> desc (highest)
      setSortDirection(field === 'title' ? 'asc' : 'desc');
    }
    setCurrentPage(1);
  };

  // Filter & Sort transactions
  const filteredAndSorted = useMemo(() => {
    const filtered = transactions.filter((tx) => {
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

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = new Date(a.transactionTime).getTime() - new Date(b.transactionTime).getTime();
      } else if (sortField === 'title') {
        cmp = a.description.localeCompare(b.description, undefined, { sensitivity: 'base' });
      } else if (sortField === 'amount') {
        cmp = a.convertedAmount - b.convertedAmount;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [transactions, searchQuery, selectedCategories, selectedNatures, sortField, sortDirection]);

  // Pagination calculations
  const totalItems = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredAndSorted.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSorted, safePage, pageSize]);

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
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <h3 style={{ fontSize: '1.125rem', margin: 0 }}>
            Transactions ({filteredAndSorted.length})
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Sorting Controls (Pill Shaped) */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'var(--bg-secondary)',
                padding: '4px 6px',
                borderRadius: '9999px',
                border: '1px solid var(--border-light)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  paddingLeft: 6,
                  paddingRight: 4,
                  letterSpacing: '0.02em',
                }}
              >
                <AlignJustify size={13} strokeWidth={2.5} />
                <span>SORT</span>
              </span>

              {/* 1. Date Sort */}
              <button
                type="button"
                onClick={() => handleSortClick('date')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: sortField === 'date' ? 700 : 500,
                  backgroundColor: sortField === 'date' ? 'var(--bg-tertiary)' : 'transparent',
                  color: sortField === 'date' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s ease',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title={`Sort by Date (${sortField === 'date' && sortDirection === 'asc' ? 'Oldest first' : 'Newest first'})`}
              >
                <span>Date</span>
                {sortField === 'date' && (
                  sortDirection === 'asc' ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />
                )}
              </button>

              {/* 2. Title (Alphabetical) Sort */}
              <button
                type="button"
                onClick={() => handleSortClick('title')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: sortField === 'title' ? 700 : 500,
                  backgroundColor: sortField === 'title' ? 'var(--bg-tertiary)' : 'transparent',
                  color: sortField === 'title' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s ease',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title={`Sort by Title (${sortField === 'title' && sortDirection === 'asc' ? 'A to Z' : 'Z to A'})`}
              >
                <span>Title</span>
                {sortField === 'title' && (
                  sortDirection === 'asc' ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />
                )}
              </button>

              {/* 3. Amount Sort */}
              <button
                type="button"
                onClick={() => handleSortClick('amount')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: sortField === 'amount' ? 700 : 500,
                  backgroundColor: sortField === 'amount' ? 'var(--bg-tertiary)' : 'transparent',
                  color: sortField === 'amount' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s ease',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title={`Sort by Amount (${sortField === 'amount' && sortDirection === 'asc' ? 'Lowest first' : 'Highest first'})`}
              >
                <span>Amount</span>
                {sortField === 'amount' && (
                  sortDirection === 'asc' ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />
                )}
              </button>
            </div>

            {(searchQuery || selectedCategories.length > 0 || selectedNatures.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategories([]);
                  setSelectedNatures([]);
                }}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--primary-blue)',
                  fontWeight: 600,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Pagination & Page Size Navigation Bar */}
        {totalItems > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 0.875rem',
              marginBottom: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 10,
              border: '1px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            {/* Left: Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                Show:
              </span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '9999px',
                  padding: 2,
                  border: '1px solid var(--border-light)',
                }}
              >
                {[5, 10, 15, 20].map((size) => {
                  const isActive = pageSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? 'var(--primary-blue)' : 'transparent',
                        color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  marginLeft: 4,
                }}
              >
                ({totalItems} items)
              </span>
            </div>

            {/* Right: Page Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginRight: 4,
                }}
              >
                Page <strong style={{ color: 'var(--text-primary)' }}>{safePage}</strong> of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
              </span>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '9999px',
                  padding: 2,
                  border: '1px solid var(--border-light)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage <= 1}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                    color: safePage <= 1 ? 'var(--border-light)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="First Page"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                    color: safePage <= 1 ? 'var(--border-light)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                </button>

                <div
                  style={{
                    padding: '0 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--primary-blue)',
                    minWidth: 28,
                    textAlign: 'center',
                  }}
                >
                  {safePage}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                    color: safePage >= totalPages ? 'var(--border-light)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Next Page"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage >= totalPages}
                  style={{
                    padding: '4px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                    color: safePage >= totalPages ? 'var(--border-light)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Last Page"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredAndSorted.length === 0 ? (
          <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transactions match the selected criteria.
          </div>
        ) : (
          <div className="timeline-tree">
            {paginatedTransactions.map((tx) => {
              const catColor = getCategoryColor(tx.category, categories);
              return (
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
                {/* Timeline Circle Icon with category theme color */}
                <div
                  className="timeline-icon-circle"
                  style={{
                    borderColor: catColor,
                    color: catColor,
                    backgroundColor: 'var(--bg-primary)',
                  }}
                >
                  {getCategoryIconElement(tx.category, 14)}
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
                    {tx.isFixed ? (
                      <span
                        className="tag-pill-outline"
                        style={{
                          fontSize: '0.6875rem',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderColor: 'var(--primary-blue-tint)',
                          color: 'var(--primary-blue)',
                          fontWeight: 700,
                        }}
                      >
                        Fixed Monthly
                      </span>
                    ) : (
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
                    )}
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
                      {formatCurrency(tx.originalAmount, tx.originalCurrency)}
                    </div>
                  </div>

                  {/* Actions: both with clean white background */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => onEdit(tx)}
                      className="action-icon-btn"
                      title="Edit Transaction"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWithConfirm(tx.id, tx.description)}
                      className="action-icon-btn btn-danger"
                      title="Delete Transaction"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};
