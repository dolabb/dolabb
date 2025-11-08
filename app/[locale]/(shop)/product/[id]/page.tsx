'use client';

import { useParams } from 'next/navigation';
import ProductDetails from '@/components/shop/ProductDetails';

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;

  return <ProductDetails productId={productId} />;
}

