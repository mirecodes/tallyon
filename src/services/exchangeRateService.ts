import type { ExchangeRateRecord, CurrencyCode, IExchangeRateRepository } from '../types';
import { STATIC_FALLBACK_RATES } from '../repositories/LocalStorageExchangeRateRepository';

// Memory cache to prevent duplicate in-flight requests
const memoryCache: Record<string, ExchangeRateRecord> = {};
const pendingRequests: Record<string, Promise<ExchangeRateRecord>> = {};

/**
 * Fetch rates from open API with fallback to repository or static rates.
 * Base in the API is typically EUR or USD. We convert to: 1 Foreign Currency = X KRW.
 */
export async function fetchExchangeRateForDate(
  date: string,
  repository: IExchangeRateRepository
): Promise<ExchangeRateRecord> {
  // 1. Check memory cache
  if (memoryCache[date]) {
    return memoryCache[date];
  }

  // 2. Check repository
  const stored = await repository.getRates(date);
  if (stored) {
    memoryCache[date] = stored;
    return stored;
  }

  // 3. Deduplicate in-flight network requests
  if (date in pendingRequests) {
    return pendingRequests[date];
  }

  const fetchPromise = (async () => {
    try {
      // Frankfurter API: base EUR
      // https://api.frankfurter.dev/v1/{date}?from=EUR&to=KRW,CHF,USD
      // If date is in the future or weekend, Frankfurter might return latest available or 404
      const response = await fetch(`https://api.frankfurter.dev/v1/${date}?from=EUR&to=KRW,CHF,USD`);
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      const data = await response.json();
      const eurToKrw = data.rates.KRW;
      const eurToChf = data.rates.CHF;
      const eurToUsd = data.rates.USD;

      // 1 Foreign Unit in KRW:
      // 1 EUR = eurToKrw KRW
      // 1 CHF = (eurToKrw / eurToChf) KRW
      // 1 USD = (eurToKrw / eurToUsd) KRW
      const rates: Record<CurrencyCode, number> = {
        KRW: 1.0,
        EUR: Math.round(eurToKrw * 100) / 100,
        CHF: Math.round((eurToKrw / eurToChf) * 100) / 100,
        USD: Math.round((eurToKrw / eurToUsd) * 100) / 100,
      };

      const record: ExchangeRateRecord = {
        date,
        baseCurrency: 'KRW',
        rates,
        updatedAt: new Date().toISOString(),
      };

      await repository.saveRates(record);
      memoryCache[date] = record;
      return record;
    } catch (err) {
      console.warn(`[ExchangeRateService] Network fetch failed for date ${date}, using LOCF fallback:`, err);
      // Fallback via LOCF from repository
      const fallback = await repository.getLatestAvailableRate(date);
      const effectiveFallback = fallback || STATIC_FALLBACK_RATES;
      memoryCache[date] = {
        ...effectiveFallback,
        date, // mirror requested date
      };
      return memoryCache[date];
    } finally {
      delete pendingRequests[date];
    }
  })();

  pendingRequests[date] = fetchPromise;
  return fetchPromise;
}
