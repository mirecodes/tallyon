import { useState, useEffect, useMemo } from 'react';
import type { Transaction, ExchangeRateRecord, IExchangeRateRepository } from '../types';
import { SupabaseExchangeRateRepository } from '../repositories/SupabaseExchangeRateRepository';
import { fetchExchangeRateForDate } from '../services/exchangeRateService';
import { toLocalDateString } from '../utils/currency';

export function useExchangeRates(transactions: Transaction[], repo?: IExchangeRateRepository) {
  const repository = useMemo(() => repo || new SupabaseExchangeRateRepository(), [repo]);
  const [ratesMap, setRatesMap] = useState<Record<string, ExchangeRateRecord>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Extract unique local dates
  const uniqueDates = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      set.add(toLocalDateString(tx.transactionTime));
    }
    // Also add today's date
    set.add(toLocalDateString(new Date()));
    return Array.from(set);
  }, [transactions]);

  useEffect(() => {
    let isCancelled = false;

    async function loadRates() {
      setIsLoading(true);
      const newMap: Record<string, ExchangeRateRecord> = {};

      try {
        await Promise.all(
          uniqueDates.map(async (date) => {
            const record = await fetchExchangeRateForDate(date, repository);
            newMap[date] = record;
          })
        );

        if (!isCancelled) {
          setRatesMap((prev) => ({ ...prev, ...newMap }));
        }
      } catch (err) {
        console.error('Failed to prefetch exchange rates:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    if (uniqueDates.length > 0) {
      loadRates();
    } else {
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [uniqueDates, repository]);

  return { ratesMap, isLoading };
}
