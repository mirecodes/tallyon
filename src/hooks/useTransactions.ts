import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Transaction, ITransactionRepository } from '../types';
import { LocalStorageTransactionRepository } from '../repositories/LocalStorageTransactionRepository';

export function useTransactions(repo?: ITransactionRepository) {
  const repository = useMemo(() => repo || new LocalStorageTransactionRepository(), [repo]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await repository.getAll();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addTransaction = useCallback(
    async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      await repository.create(data);
      await reload();
    },
    [repository, reload]
  );

  const addTransactionsBatch = useCallback(
    async (dataArray: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => {
      await repository.createBatch(dataArray);
      await reload();
    },
    [repository, reload]
  );

  const editTransaction = useCallback(
    async (id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => {
      await repository.update(id, updates);
      await reload();
    },
    [repository, reload]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await repository.delete(id);
      await reload();
    },
    [repository, reload]
  );

  return {
    transactions,
    isLoading,
    error,
    reload,
    addTransaction,
    addTransactionsBatch,
    editTransaction,
    removeTransaction,
  };
}
