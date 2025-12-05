/**
 * Formats a price with Saudi Riyal currency symbol based on locale
 * For Arabic (RTL): number comes first, then currency symbol (e.g., "1499.0 ﷼")
 * For English (LTR): currency code comes first, then number (e.g., "SAR 1499.0")
 * 
 * Uses the official Saudi Riyal symbol (Unicode U+FDFC: ﷼) for Arabic
 * Uses "SAR" text for English
 * 
 * @param price - The price value to format
 * @param locale - The locale ('ar' or 'en')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(price: number | string | undefined | null, locale: string = 'en', decimals: number = 2): string {
  // Saudi Riyal currency symbol (Unicode U+FDFC) for Arabic
  const riyalSymbol = '\uFDFC'; // ﷼
  // Currency code for English
  const currencyCode = 'SAR';
  
  if (price === undefined || price === null || price === '') {
    const defaultPrice = `0.${'0'.repeat(decimals)}`;
    return locale === 'ar' ? `${defaultPrice} ${riyalSymbol}` : `${currencyCode} ${defaultPrice}`;
  }

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    const defaultPrice = `0.${'0'.repeat(decimals)}`;
    return locale === 'ar' ? `${defaultPrice} ${riyalSymbol}` : `${currencyCode} ${defaultPrice}`;
  }

  const formattedPrice = numPrice.toFixed(decimals);

  // For Arabic (RTL): number first, then currency symbol (﷼)
  // For English (LTR): currency code (SAR) first, then number
  return locale === 'ar' ? `${formattedPrice} ${riyalSymbol}` : `${currencyCode} ${formattedPrice}`;
}
