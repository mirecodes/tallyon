import React, { useState, useEffect } from 'react';
import type { CurrencyCode, ExpenseNature, Transaction } from '../types';
import { X, Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import { toLocalDateString } from '../utils/currency';
import { useCategories } from '../utils/categories';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitBatch: (items: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  editingTransaction?: Transaction | null;
  onUpdateSingle?: (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  onOpenCategoryManager?: () => void;
  existingTransactions?: Transaction[];
}

interface FormRow {
  description: string;
  originalAmount: string;
  originalCurrency: CurrencyCode;
  category: string;
  expenseNature: ExpenseNature;
  isFixed: boolean;
  transactionDate: string;
  transactionTime: string;
}

const CURRENCIES: CurrencyCode[] = ['CHF', 'USD', 'EUR', 'KRW'];

/**
 * Normalizes user time inputs like "23", "2330", "23:00", "9", "930", "11pm", "14:15" into valid "HH:mm" (24-hour format).
 * This ensures full compatibility with native HTML5 `<input type="time">` and am/pm displays.
 */
function normalizeTimeString(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  // Match e.g. "11pm", "11:30 pm", "9am"
  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3] === 'pm';
    if (isPm && hours < 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;
    if (hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
  }

  // Match "23:30" or "9:5"
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10);
    const mins = parseInt(colonMatch[2], 10);
    if (hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
  }

  // Match 3 or 4 digits like "2330" -> 23:30, "930" -> 09:30
  if (/^\d{3,4}$/.test(trimmed)) {
    const hours = parseInt(trimmed.slice(0, trimmed.length - 2), 10);
    const mins = parseInt(trimmed.slice(-2), 10);
    if (hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
  }

  // Match pure 1 or 2 digit hour like "23" -> 23:00, "9" -> 09:00
  if (/^\d{1,2}$/.test(trimmed)) {
    const hours = parseInt(trimmed, 10);
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, '0')}:00`;
    }
  }

  return null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmitBatch,
  editingTransaction,
  onUpdateSingle,
  onOpenCategoryManager,
  existingTransactions = [],
}) => {
  const { categories } = useCategories();
  const categoryOptions = categories.map((c) => c.name);
  const defaultCategory = categoryOptions[0] || 'Living';

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Autocomplete suggestion state for Title
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Extract unique past descriptions & categories from existing transactions
  const pastTitleMap = React.useMemo(() => {
    const map = new Map<string, { description: string; category: string; originalCurrency: CurrencyCode }>();
    for (const tx of existingTransactions) {
      const desc = tx.description?.trim();
      if (desc && !map.has(desc.toLowerCase())) {
        map.set(desc.toLowerCase(), {
          description: desc,
          category: tx.category,
          originalCurrency: tx.originalCurrency,
        });
      }
    }
    return map;
  }, [existingTransactions]);

  // Today's default values
  const now = new Date();
  const defaultDate = toLocalDateString(now);
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const createInitialRow = (): FormRow => ({
    description: '',
    originalAmount: '',
    originalCurrency: 'CHF',
    category: defaultCategory,
    expenseNature: 'ONE_OFF',
    isFixed: false,
    transactionDate: defaultDate,
    transactionTime: defaultTime,
  });

  const [rows, setRows] = useState<FormRow[]>([createInitialRow()]);

  // Filter matching suggestions for Single mode (rows[0].description)
  const currentQuery = rows[0]?.description?.trim().toLowerCase() || '';
  const filteredSuggestions = React.useMemo(() => {
    if (!currentQuery || currentQuery.length < 1) return [];
    const results: Array<{ description: string; category: string; originalCurrency: CurrencyCode }> = [];
    for (const [lowerKey, item] of pastTitleMap.entries()) {
      if (lowerKey.includes(currentQuery) && lowerKey !== currentQuery) {
        results.push(item);
        if (results.length >= 6) break;
      }
    }
    return results;
  }, [currentQuery, pastTitleMap]);

  // Reset suggestion highlight when filter changes
  useEffect(() => {
    setActiveSuggestionIdx(0);
  }, [filteredSuggestions]);

  // Initialize rows ONLY when modal transitions from closed to open, or when editingTransaction changes
  useEffect(() => {
    if (!isOpen) return;

    const nowObj = new Date();
    const curDate = toLocalDateString(nowObj);
    const curTime = `${String(nowObj.getHours()).padStart(2, '0')}:${String(nowObj.getMinutes()).padStart(2, '0')}`;

    if (editingTransaction) {
      setIsBatchMode(false);
      const d = new Date(editingTransaction.transactionTime);
      setRows([
        {
          description: editingTransaction.description,
          originalAmount: editingTransaction.originalAmount.toString(),
          originalCurrency: editingTransaction.originalCurrency,
          category: editingTransaction.category,
          expenseNature: editingTransaction.expenseNature,
          isFixed: !!editingTransaction.isFixed,
          transactionDate: toLocalDateString(d),
          transactionTime: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
        },
      ]);
    } else {
      setRows([
        {
          description: '',
          originalAmount: '',
          originalCurrency: 'CHF',
          category: defaultCategory,
          expenseNature: 'ONE_OFF',
          isFixed: false,
          transactionDate: curDate,
          transactionTime: curTime,
        },
      ]);
    }
    setErrorMsg(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingTransaction]);

  if (!isOpen) return null;

  const handleRowChange = (index: number, field: keyof FormRow, value: string | boolean) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createInitialRow()]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateRow = (index: number) => {
    setRows((prev) => {
      const target = prev[index];
      const copy = [...prev];
      copy.splice(index + 1, 0, { ...target });
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    const batchItems: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>> = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.description.trim()) {
        setErrorMsg(`Row ${i + 1}: Title cannot be empty.`);
        return;
      }
      const amt = parseFloat(r.originalAmount);
      if (isNaN(amt) || amt <= 0) {
        setErrorMsg(`Row ${i + 1}: Amount must be a positive number.`);
        return;
      }

      // Compose ISO string
      const dateTimeStr = `${r.transactionDate}T${r.transactionTime}:00`;
      const dateObj = new Date(dateTimeStr);
      const isoTime = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();

      batchItems.push({
        description: r.description.trim().slice(0, 100),
        originalAmount: amt,
        originalCurrency: r.originalCurrency,
        category: r.category || 'Other',
        expenseNature: r.isFixed ? 'RECURRING_MONTHLY' : r.expenseNature,
        isFixed: r.isFixed,
        transactionTime: isoTime,
      });
    }

    try {
      if (editingTransaction && onUpdateSingle) {
        await onUpdateSingle(editingTransaction.id, batchItems[0]);
      } else {
        await onSubmitBatch(batchItems);
      }
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMsg('Failed to save transaction. Please check inputs.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${isBatchMode ? 'wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '1.75rem' }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 2 }}>
              {editingTransaction ? 'Edit Expense' : isBatchMode ? 'Batch Expense Entry' : 'Record New Expense'}
            </h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {isBatchMode
                ? 'Input multiple expenses in spreadsheet grid mode.'
                : 'Enter your transaction details with multi-currency conversion.'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!editingTransaction && (
              <div className="pill-tab-bar" style={{ padding: 2 }}>
                <button
                  type="button"
                  className={`pill-tab-item ${!isBatchMode ? 'active' : ''}`}
                  onClick={() => setIsBatchMode(false)}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  Single
                </button>
                <button
                  type="button"
                  className={`pill-tab-item ${isBatchMode ? 'active' : ''}`}
                  onClick={() => setIsBatchMode(true)}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  Batch
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                color: 'var(--text-muted)',
                padding: 4,
                borderRadius: 6,
                display: 'flex',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'var(--expense-bg)',
              color: 'var(--expense-rose)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isBatchMode ? (
            /* Single Entry Mode Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Title with Autocomplete dropdown and Tab completion */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    Title *
                  </label>
                  {filteredSuggestions.length > 0 && showSuggestions && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Press <kbd style={{ padding: '1px 5px', borderRadius: 4, backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-light)' }}>Tab</kbd> or <kbd style={{ padding: '1px 5px', borderRadius: 4, backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-light)' }}>↓</kbd> to complete
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Coop Supermarket, Train Ticket"
                  value={rows[0].description}
                  onChange={(e) => {
                    handleRowChange(0, 'description', e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    // Delay hiding so clicks on suggestion items register
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (showSuggestions && filteredSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveSuggestionIdx((prev) => (prev + 1) % filteredSuggestions.length);
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveSuggestionIdx((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
                      } else if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
                        // Accept highlighted suggestion
                        e.preventDefault();
                        const picked = filteredSuggestions[activeSuggestionIdx] || filteredSuggestions[0];
                        if (picked) {
                          setRows((prev) => {
                            const copy = [...prev];
                            copy[0] = {
                              ...copy[0],
                              description: picked.description,
                              category: picked.category || copy[0].category,
                              originalCurrency: picked.originalCurrency || copy[0].originalCurrency,
                            };
                            return copy;
                          });
                          setShowSuggestions(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }
                  }}
                  style={{ width: '100%' }}
                  autoFocus
                />

                {/* Dropdown suggestions popup */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 60,
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 8,
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                      marginTop: 4,
                      overflow: 'hidden',
                    }}
                  >
                    {filteredSuggestions.map((item, idx) => (
                      <div
                        key={item.description}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent input blur before click
                          setRows((prev) => {
                            const copy = [...prev];
                            copy[0] = {
                              ...copy[0],
                              description: item.description,
                              category: item.category || copy[0].category,
                              originalCurrency: item.originalCurrency || copy[0].originalCurrency,
                            };
                            return copy;
                          });
                          setShowSuggestions(false);
                        }}
                        onMouseEnter={() => setActiveSuggestionIdx(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          backgroundColor: idx === activeSuggestionIdx ? 'var(--bg-secondary)' : 'transparent',
                          fontSize: '0.8125rem',
                          borderBottom: idx < filteredSuggestions.length - 1 ? '1px solid var(--border-light)' : 'none',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.description}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {item.category}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            {item.originalCurrency}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount & Currency */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={rows[0].originalAmount}
                    onChange={(e) => handleRowChange(0, 'originalAmount', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                    Currency *
                  </label>
                  <select
                    value={rows[0].originalCurrency}
                    onChange={(e) => handleRowChange(0, 'originalCurrency', e.target.value as CurrencyCode)}
                    style={{ width: '100%' }}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category & Cycle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      Category *
                    </label>
                    {onOpenCategoryManager && (
                      <button
                        type="button"
                        onClick={onOpenCategoryManager}
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--primary-blue)',
                          fontWeight: 600,
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        + Edit Categories
                      </button>
                    )}
                  </div>
                  <select
                    value={rows[0].category}
                    onChange={(e) => handleRowChange(0, 'category', e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                    Cycle *
                  </label>
                  <select
                    value={rows[0].expenseNature}
                    onChange={(e) => handleRowChange(0, 'expenseNature', e.target.value as ExpenseNature)}
                    style={{ width: '100%' }}
                    disabled={rows[0].isFixed}
                  >
                    <option value="ONE_OFF">One-off</option>
                    <option value="RECURRING_MONTHLY">Monthly</option>
                    <option value="RECURRING_YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              {/* Fixed Monthly Expense Option */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: rows[0].isFixed ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  border: rows[0].isFixed ? '1px solid var(--primary-blue-tint)' : '1px solid var(--border-light)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => handleRowChange(0, 'isFixed', !rows[0].isFixed)}
              >
                <input
                  type="checkbox"
                  id="fixed-expense-chk"
                  checked={rows[0].isFixed}
                  onChange={() => {}} // Controlled via container onClick
                  style={{ marginTop: 3, cursor: 'pointer', pointerEvents: 'none' }}
                />
                <div style={{ cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 700, color: rows[0].isFixed ? 'var(--primary-blue)' : 'var(--text-primary)' }}>
                    Fixed Recurring Expense
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    When enabled, this monthly commitment automatically carries over to all subsequent months as a planned fixed expense.
                  </div>
                </div>
              </div>

              {/* Date & Time (with smart 24h / 12h automatic normalization) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={rows[0].transactionDate}
                    onChange={(e) => handleRowChange(0, 'transactionDate', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      Time
                    </label>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }} title="Type e.g. '23', '23:30', '11pm' or use standard time picker">
                      Supports 24h & 12h (e.g. 23 → 11 PM)
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="HH:mm (e.g. 23:00, 11pm)"
                    value={rows[0].transactionTime}
                    onChange={(e) => handleRowChange(0, 'transactionTime', e.target.value)}
                    onBlur={(e) => {
                      const normalized = normalizeTimeString(e.target.value);
                      if (normalized) {
                        handleRowChange(0, 'transactionTime', normalized);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const normalized = normalizeTimeString(rows[0].transactionTime);
                        if (normalized) {
                          handleRowChange(0, 'transactionTime', normalized);
                        }
                      }
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Spreadsheet-style Multi-row Grid Mode */
            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '22%' }}>Title</th>
                    <th style={{ padding: '8px 10px', width: '13%' }}>Amount</th>
                    <th style={{ padding: '8px 10px', width: '11%' }}>Currency</th>
                    <th style={{ padding: '8px 10px', width: '16%' }}>Category</th>
                    <th style={{ padding: '8px 10px', width: '14%' }}>Cycle</th>
                    <th style={{ padding: '8px 10px', width: '8%', textAlign: 'center' }}>Fixed?</th>
                    <th style={{ padding: '8px 10px', width: '11%' }}>Date</th>
                    <th style={{ padding: '8px 10px', width: '5%', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '6px 4px' }}>
                        <input
                          type="text"
                          value={row.description}
                          placeholder="Title"
                          onChange={(e) => handleRowChange(idx, 'description', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px' }}
                        />
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={row.originalAmount}
                          placeholder="0.00"
                          onChange={(e) => handleRowChange(idx, 'originalAmount', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px' }}
                        />
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <select
                          value={row.originalCurrency}
                          onChange={(e) => handleRowChange(idx, 'originalCurrency', e.target.value as CurrencyCode)}
                          style={{ width: '100%', padding: '6px 4px' }}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <select
                          value={row.category}
                          onChange={(e) => handleRowChange(idx, 'category', e.target.value)}
                          style={{ width: '100%', padding: '6px 4px' }}
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <select
                          value={row.expenseNature}
                          onChange={(e) => handleRowChange(idx, 'expenseNature', e.target.value as ExpenseNature)}
                          style={{ width: '100%', padding: '6px 4px' }}
                          disabled={row.isFixed}
                        >
                          <option value="ONE_OFF">One-off</option>
                          <option value="RECURRING_MONTHLY">Monthly</option>
                          <option value="RECURRING_YEARLY">Yearly</option>
                        </select>
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={row.isFixed}
                          onChange={(e) => handleRowChange(idx, 'isFixed', e.target.checked)}
                          title="Fixed Recurring Expense"
                        />
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        <input
                          type="date"
                          value={row.transactionDate}
                          onChange={(e) => handleRowChange(idx, 'transactionDate', e.target.value)}
                          style={{ width: '100%', padding: '6px 4px' }}
                        />
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(idx)}
                          title="Duplicate Row"
                          style={{ padding: 4, color: 'var(--text-secondary)' }}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={rows.length <= 1}
                          title="Delete Row"
                          style={{
                            padding: 4,
                            color: rows.length > 1 ? 'var(--expense-rose)' : 'var(--text-muted)',
                            cursor: rows.length > 1 ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Add Another Row
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '1.25rem',
            }}
          >
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingTransaction ? 'Update Entry' : isBatchMode ? `Save ${rows.length} Entries` : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
