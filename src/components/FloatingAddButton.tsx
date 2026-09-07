import React from 'react';
import { Pencil } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add Expense"
      title="Add New Expense (Pencil)"
      className="floating-add-btn"
    >
      <Pencil size={22} strokeWidth={2.4} />
      <span className="floating-add-tooltip">Add Expense</span>
    </button>
  );
};
