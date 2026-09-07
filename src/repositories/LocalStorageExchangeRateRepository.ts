import type { ExchangeRateRecord, IExchangeRateRepository } from '../types';

const STORAGE_KEY = '@app/exchange_rates';

// Fallback constant rates (KRW value per 1 unit of foreign currency)
export const STATIC_FALLBACK_RATES: ExchangeRateRecord = {
  date: '2026-09-01',
  baseCurrency: 'KRW',
  rates: {
    CHF: 1560.50,
    USD: 1385.00,
    EUR: 1502.00,
    KRW: 1.0,
  },
  updatedAt: new Date().toISOString(),
};

export class LocalStorageExchangeRateRepository implements IExchangeRateRepository {
  private readStorage(): Record<string, ExchangeRateRecord> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Pre-fill with recent baseline rates
        const initialMap: Record<string, ExchangeRateRecord> = {
          [STATIC_FALLBACK_RATES.date]: STATIC_FALLBACK_RATES,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMap));
        return initialMap;
      }
      return JSON.parse(raw);
    } catch (err) {
      console.error('Failed to read exchange rates from LocalStorage:', err);
      return {};
    }
  }

  private writeStorage(map: Record<string, ExchangeRateRecord>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (err) {
      console.error('Failed to write exchange rates to LocalStorage:', err);
    }
  }

  async getRates(date: string): Promise<ExchangeRateRecord | null> {
    const map = this.readStorage();
    return map[date] || null;
  }

  async getRatesBatch(dates: string[]): Promise<Record<string, ExchangeRateRecord>> {
    const map = this.readStorage();
    const result: Record<string, ExchangeRateRecord> = {};
    for (const d of dates) {
      if (map[d]) {
        result[d] = map[d];
      }
    }
    return result;
  }

  async saveRates(record: ExchangeRateRecord): Promise<void> {
    const map = this.readStorage();
    map[record.date] = record;
    this.writeStorage(map);
  }

  /**
   * Last Observation Carried Forward (LOCF):
   * Searches for the most recent rate record on or before targetDate.
   * If none exists before targetDate, returns the closest future rate or the static fallback.
   */
  async getLatestAvailableRate(targetDate: string): Promise<ExchangeRateRecord | null> {
    const map = this.readStorage();
    const dates = Object.keys(map).sort(); // ascending dates

    if (dates.length === 0) {
      return STATIC_FALLBACK_RATES;
    }

    // Direct hit
    if (map[targetDate]) {
      return map[targetDate];
    }

    // Find the latest date <= targetDate
    const priorDates = dates.filter((d) => d <= targetDate);
    if (priorDates.length > 0) {
      const latestPrior = priorDates[priorDates.length - 1];
      return map[latestPrior];
    }

    // If targetDate is earlier than all known dates, take the earliest known
    return map[dates[0]] || STATIC_FALLBACK_RATES;
  }
}
