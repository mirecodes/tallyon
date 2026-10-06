import type {
  Transaction,
  ExchangeRateRecord,
  TargetCurrency,
  ValuatedTransaction,
  DailyAggregate,
  AnalyticsBreakdown,
  ExpenseNature,
} from '../types';
import { toLocalDateString } from '../utils/currency';
import { isPending } from '../utils/fixedExpenses';
import { STATIC_FALLBACK_RATES } from '../repositories/LocalStorageExchangeRateRepository';

export interface ValuationResult {
  valuatedList: ValuatedTransaction[];
  calendarMap: Record<string, DailyAggregate>;
  breakdown: AnalyticsBreakdown;
}

/**
 * Triangulation Valuation Algorithm:
 * 1. Convert any originalCurrency to KRW standard intermediary:
 *    - If KRW: Amount_KRW = originalAmount
 *    - If Foreign: Amount_KRW = originalAmount * rates[originalCurrency]
 * 2. Convert KRW to TargetCurrency:
 *    - If Target is KRW: FinalAmount = Math.round(Amount_KRW)
 *    - If Target is CHF: FinalAmount = Number((Amount_KRW / rates['CHF']).toFixed(2))
 */
export function evaluateTransactions(
  transactions: Transaction[],
  ratesMap: Record<string, ExchangeRateRecord>,
  targetCurrency: TargetCurrency
): ValuationResult {
  const valuatedList: ValuatedTransaction[] = [];
  const calendarMap: Record<string, DailyAggregate> = {};

  let grandTotal = 0;
  const categoryMap: Record<string, number> = {};
  const natureMap: Record<ExpenseNature, number> = {
    ONE_OFF: 0,
    RECURRING_MONTHLY: 0,
    RECURRING_YEARLY: 0,
  };

  for (const tx of transactions) {
    const localDate = toLocalDateString(tx.transactionTime);
    const rateRecord = ratesMap[localDate] || ratesMap[Object.keys(ratesMap)[0]] || STATIC_FALLBACK_RATES;
    const rates = rateRecord.rates;

    // 1. KRW Standard Intermediary
    let amountKrw = 0;
    if (tx.originalCurrency === 'KRW') {
      amountKrw = tx.originalAmount;
    } else {
      const foreignToKrw = rates[tx.originalCurrency] || STATIC_FALLBACK_RATES.rates[tx.originalCurrency];
      amountKrw = tx.originalAmount * foreignToKrw;
    }

    // 2. Target Conversion
    let convertedAmount = 0;
    if (targetCurrency === 'KRW') {
      convertedAmount = Math.round(amountKrw);
    } else {
      const targetToKrw = rates[targetCurrency] || STATIC_FALLBACK_RATES.rates[targetCurrency] || 1;
      convertedAmount = Number((amountKrw / targetToKrw).toFixed(2));
    }

    const valuated: ValuatedTransaction = {
      ...tx,
      convertedAmount,
      targetCurrency,
      appliedRateDate: rateRecord.date,
    };
    valuatedList.push(valuated);

    // Aggregate by Day
    if (!calendarMap[localDate]) {
      calendarMap[localDate] = {
        date: localDate,
        totalAmount: 0,
        itemCount: 0,
        transactions: [],
      };
    }
    calendarMap[localDate].totalAmount =
      targetCurrency === 'KRW'
        ? calendarMap[localDate].totalAmount + convertedAmount
        : Number((calendarMap[localDate].totalAmount + convertedAmount).toFixed(2));
    calendarMap[localDate].itemCount += 1;
    calendarMap[localDate].transactions.push(valuated);

    // Breakdown Aggregates
    grandTotal =
      targetCurrency === 'KRW'
        ? grandTotal + convertedAmount
        : Number((grandTotal + convertedAmount).toFixed(2));

    categoryMap[tx.category] = (categoryMap[tx.category] || 0) + convertedAmount;
    natureMap[tx.expenseNature] = (natureMap[tx.expenseNature] || 0) + convertedAmount;
  }

  // Calculate Fixed vs Flexible totals
  let fixedTotal = 0;
  let fixedPendingTotal = 0;
  let flexibleTotal = 0;
  const now = Date.now();
  for (const v of valuatedList) {
    if (v.isFixed) {
      fixedTotal += v.convertedAmount;
      if (isPending(v, now)) fixedPendingTotal += v.convertedAmount;
    } else {
      flexibleTotal += v.convertedAmount;
    }
  }
  const roundedFixedTotal = targetCurrency === 'KRW' ? Math.round(fixedTotal) : Number(fixedTotal.toFixed(2));
  const roundedFixedPendingTotal = targetCurrency === 'KRW' ? Math.round(fixedPendingTotal) : Number(fixedPendingTotal.toFixed(2));
  const roundedFlexibleTotal = targetCurrency === 'KRW' ? Math.round(flexibleTotal) : Number(flexibleTotal.toFixed(2));

  // Format Category Breakdown
  const byCategory = Object.entries(categoryMap)
    .map(([category, amount]) => {
      const roundedAmount = targetCurrency === 'KRW' ? Math.round(amount) : Number(amount.toFixed(2));
      const percentage = grandTotal > 0 ? Number(((roundedAmount / grandTotal) * 100).toFixed(2)) : 0;
      return { category, totalAmount: roundedAmount, percentage };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Format Nature Breakdown
  const byNature = (['ONE_OFF', 'RECURRING_MONTHLY', 'RECURRING_YEARLY'] as ExpenseNature[]).map((nature) => {
    const amount = natureMap[nature] || 0;
    const roundedAmount = targetCurrency === 'KRW' ? Math.round(amount) : Number(amount.toFixed(2));
    const percentage = grandTotal > 0 ? Number(((roundedAmount / grandTotal) * 100).toFixed(2)) : 0;
    return { nature, totalAmount: roundedAmount, percentage };
  });

  return {
    valuatedList,
    calendarMap,
    breakdown: {
      targetCurrency,
      grandTotal,
      fixedTotal: roundedFixedTotal,
      fixedPendingTotal: roundedFixedPendingTotal,
      flexibleTotal: roundedFlexibleTotal,
      byCategory,
      byNature,
    },
  };
}
