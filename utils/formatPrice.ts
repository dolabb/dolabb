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
  // Currency symbols mapping
  const currencySymbols: Record<string, string> = {
    SAR: '\uFDFC', // ﷼ Saudi Riyal
    AED: '\u062F.\u0625', // د.إ UAE Dirham
    USD: '$',
    EUR: '\u20AC', // €
    GBP: '\u00A3', // £
    KWD: '\u062F.\u0643', // د.ك Kuwaiti Dinar
    QAR: '\u0631.\u0642', // ر.ق Qatari Riyal
    OMR: '\u0631.\u0639', // ر.ع Omani Rial
    BHD: '\u062F.\u0628', // د.ب Bahraini Dinar
  };

  // Use provided currency - no default, use currency code as-is if not in mapping
  const currencyCode = currency || '';
  const currencySymbol = currencyCode ? (currencySymbols[currencyCode] || currencyCode) : '';

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
