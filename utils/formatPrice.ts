// Currency symbols mapping - Supported: SAR, USD, EUR, GBP, KWD, AED, OMR, QAR
export const currencySymbols: Record<string, string> = {
  SAR: '﷼', // Saudi Riyal
  USD: '$', // US Dollar
  EUR: '€', // Euro
  GBP: '£', // British Pound
  KWD: 'د.ك', // Kuwaiti Dinar
  AED: 'د.إ', // UAE Dirham
  OMR: 'ر.ع', // Omani Rial
  QAR: 'ر.ق', // Qatari Riyal
  BHD: 'د.ب', // Bahraini Dinar (legacy support)
};

/**
 * Gets the currency symbol for a given currency code
 * @param currency - The currency code (e.g., 'SAR', 'USD', 'EUR', etc.)
 * @returns The currency symbol or the code itself if not found
 */
export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || currency;
}

/**
 * Formats a price with currency symbol based on locale and currency
 * For Arabic (RTL): number comes first, then currency symbol
 * For English (LTR): currency code comes first, then number
 * 
 * @param price - The price value to format
 * @param locale - The locale ('ar' or 'en')
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - The currency code (e.g., 'SAR', 'AED', 'OMR', 'USD', etc.). Must be provided from product data
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(
  price: number | string | undefined | null,
  locale: string = 'en',
  decimals: number = 2,
  currency?: string
): string {

  // Use provided currency - no default, use currency code as-is if not in mapping
  const currencyCode = currency || '';
  const currencySymbol = currencyCode ? getCurrencySymbol(currencyCode) : '';

  if (price === undefined || price === null || price === '') {
    const defaultPrice = `0.${'0'.repeat(decimals)}`;
    if (!currencyCode) return defaultPrice;
    return locale === 'ar'
      ? `${defaultPrice} ${currencySymbol}`
      : `${currencyCode} ${defaultPrice}`;
  }

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    const defaultPrice = `0.${'0'.repeat(decimals)}`;
    if (!currencyCode) return defaultPrice;
    return locale === 'ar'
      ? `${defaultPrice} ${currencySymbol}`
      : `${currencyCode} ${defaultPrice}`;
  }

  const formattedPrice = numPrice.toFixed(decimals);

  // If no currency provided, return just the price
  if (!currencyCode) {
    return formattedPrice;
  }

  // For Arabic (RTL): number first, then currency symbol
  // For English (LTR): currency code first, then number
  return locale === 'ar'
    ? `${formattedPrice} ${currencySymbol}`
    : `${currencyCode} ${formattedPrice}`;
}
