'use client';

import { useParams } from 'next/navigation';
import CategoryProductListing from '@/components/shop/CategoryProductListing';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string[];
  
  return <CategoryProductListing slug={slug} />;
}

