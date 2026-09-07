import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Check, ChevronUp, ChevronDown } from 'lucide-react';
import {
  useCategories,
  DEFAULT_CATEGORIES,
  type CategoryDefinition,
} from '../utils/categories';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#64748B', // Slate
  '#E11D48', // Rose
  '#84CC16', // Lime
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, updateCategories, resetToDefault } = useCategories();
  const [localCategories, setLocalCategories] = useState<CategoryDefinition[]>(categories);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalCategories(categories);
      setSavedFeedback(false);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleUpdateItem = (index: number, field: keyof CategoryDefinition, val: string) => {
    setLocalCategories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setLocalCategories((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === localCategories.length - 1) return;
    setLocalCategories((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (localCategories.length <= 1) {
      alert('At least one category must remain.');
      return;
    }
    setLocalCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCategory = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert('Please enter a category name.');
      return;
    }
    if (localCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() || c.id.toLowerCase() === trimmed.toLowerCase())) {
      alert('Category already exists!');
      return;
    }

    const item: CategoryDefinition = {
      id: trimmed,
      name: trimmed,
      color: newColor,
      bgColor: `${newColor}15`,
    };

    setLocalCategories((prev) => [...prev, item]);
    setNewName('');
  };

  const handleSave = () => {
    updateCategories(localCategories);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 400);
  };

  const handleReset = () => {
    if (window.confirm('Reset categories to default (10 standard categories in original order)?')) {
      resetToDefault();
      setLocalCategories(DEFAULT_CATEGORIES);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 560,
          padding: '1.75rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
              Edit Categories
            </h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Reorder, rename, or customize your spending categories.
            </div>
          </div>

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

        {/* Existing Categories List with Up / Down reordering buttons */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            paddingRight: 4,
            marginBottom: '1.25rem',
          }}
        >
          {localCategories.map((cat, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 10,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
              }}
            >
              {/* Up / Down Reordering Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  type="button"
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  style={{
                    padding: 2,
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    color: idx === 0 ? 'var(--border-light)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Move Up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === localCategories.length - 1}
                  style={{
                    padding: 2,
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: idx === localCategories.length - 1 ? 'not-allowed' : 'pointer',
                    color: idx === localCategories.length - 1 ? 'var(--border-light)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Move Down"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Order index badge */}
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  width: 20,
                  textAlign: 'center',
                }}
              >
                #{idx + 1}
              </span>

              {/* Color picker circle */}
              <input
                type="color"
                value={cat.color}
                onChange={(e) => handleUpdateItem(idx, 'color', e.target.value)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  backgroundColor: 'transparent',
                  flexShrink: 0,
                }}
                title="Change Color"
              />

              {/* Category Name (English) */}
              <input
                type="text"
                value={cat.name}
                onChange={(e) => {
                  handleUpdateItem(idx, 'name', e.target.value);
                  handleUpdateItem(idx, 'id', e.target.value);
                }}
                placeholder="Category Name"
                style={{
                  flex: 1,
                  fontSize: '0.8125rem',
                  padding: '6px 10px',
                  borderRadius: 6,
                }}
                title="Category Name"
              />

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                className="btn-danger-subtle"
                style={{ padding: 6, borderRadius: 6 }}
                title="Remove Category"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Category Form */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            backgroundColor: 'var(--bg-subtle)',
            border: '1px dashed var(--border-light)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
            ADD NEW CATEGORY
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                backgroundColor: 'transparent',
                flexShrink: 0,
              }}
            />
            <input
              type="text"
              placeholder="Category Name (e.g. Education)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
              style={{ flex: 1, fontSize: '0.8125rem', padding: '6px 10px' }}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1rem',
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RotateCcw size={13} /> Reset to Defaults
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              style={{ fontSize: '0.8125rem' }}
            >
              {savedFeedback ? (
                <>
                  <Check size={14} /> Saved
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
