/**
 * Check if current user can purchase/make offers on a product
 * @param currentUserId - Current authenticated user's ID
 * @param productSellerId - Product seller's ID
 * @returns true if user can purchase, false if user is the seller
 */
export function canUserPurchaseProduct(
  currentUserId: string | null | undefined,
  productSellerId: string | null | undefined
): boolean {
  if (!currentUserId || !productSellerId) return true; // Allow if not authenticated or no seller info
  return currentUserId !== productSellerId;
}

