import { useMemo } from 'react';
import type { Transaction, ExchangeRateRecord, TargetCurrency } from '../types';
import { evaluateTransactions } from '../services/valuationEngine';
import type { ValuationResult } from '../services/valuationEngine';

export function useValuationEngine(
  transactions: Transaction[],
  ratesMap: Record<string, ExchangeRateRecord>,
  targetCurrency: TargetCurrency
): ValuationResult {
  return useMemo(() => {
    return evaluateTransactions(transactions, ratesMap, targetCurrency);
  }, [transactions, ratesMap, targetCurrency]);
}
