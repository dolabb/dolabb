import { ReactNode } from 'react';

/**
 * Shop Layout
 * Used for shop/category pages
 * Inherits the main layout but can have shop-specific modifications
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

