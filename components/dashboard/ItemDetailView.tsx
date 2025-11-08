'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { HiPencil, HiArrowLeft } from 'react-icons/hi2';

interface ItemDetailViewProps {
  itemId: string;
}

// Mock item data
const getItemData = (id: string) => {
  const items: Record<string, any> = {
    '1': {
      id: '1',
      title: 'Vintage Denim Jacket',
      description: 'Beautiful vintage denim jacket in excellent condition. Perfect for any casual occasion.',
      price: 45.99,
      currency: 'USD',
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
      ],
      category: 'Women',
      subCategory: 'Coats & Jackets',
      gender: 'Women',
      size: 'M',
      condition: 'Like new',
      brandName: 'Levi\'s',
      quantity: 1,
      hasVariants: false,
      sku: 'VINT-DEN-001',
      tags: 'vintage, denim, jacket, casual',
      shippingCost: 5.00,
      processingTime: 3,
      status: 'active',
      views: 123,
      createdAt: '2024-01-10',
    },
  };
  return items[id] || items['1'];
};

export default function ItemDetailView({ itemId }: ItemDetailViewProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const item = getItemData(itemId);

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <Link
          href={`/${locale}/my-store`}
          className='inline-flex items-center gap-2 text-saudi-green hover:text-saudi-green/80 mb-6 font-medium'
        >
          <HiArrowLeft className='w-5 h-5' />
          {locale === 'en' ? 'Back to My Store' : 'العودة إلى متجري'}
        </Link>

        <div className='bg-white rounded-lg border border-rich-sand/30 overflow-hidden'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8'>
            {/* Images */}
            <div>
              <div className='relative aspect-square bg-rich-sand/20 rounded-lg overflow-hidden mb-4'>
                <Image
                  src={item.images[0]}
                  alt={item.title}
                  fill
                  className='object-cover'
                  unoptimized
                />
              </div>
              <div className='grid grid-cols-3 gap-2'>
                {item.images.slice(0, 3).map((img: string, index: number) => (
                  <div
                    key={index}
                    className='relative aspect-square bg-rich-sand/20 rounded-lg overflow-hidden'
                  >
                    <Image
                      src={img}
                      alt={`${item.title} ${index + 1}`}
                      fill
                      className='object-cover'
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className='space-y-6'>
              <div>
                <div className='flex items-start justify-between mb-2'>
                  <h1 className='text-3xl font-bold text-deep-charcoal'>
                    {item.title}
                  </h1>
                  <Link
                    href={`/${locale}/my-store/item/${item.id}/edit`}
                    className='flex items-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors'
                  >
                    <HiPencil className='w-4 h-4' />
                    {locale === 'en' ? 'Edit' : 'تعديل'}
                  </Link>
                </div>
                <p className='text-2xl font-bold text-saudi-green mb-4'>
                  {item.currency} {item.price.toFixed(2)}
                </p>
                <div className='flex items-center gap-4 text-sm text-deep-charcoal/70'>
                  <span>
                    {item.views} {locale === 'en' ? 'views' : 'مشاهدة'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.status === 'active'
                      ? locale === 'en'
                        ? 'Active'
                        : 'نشط'
                      : locale === 'en'
                        ? 'Sold'
                        : 'مباع'}
                  </span>
                </div>
              </div>

              <div className='border-t border-rich-sand/30 pt-6 space-y-4'>
                <div>
                  <h3 className='font-semibold text-deep-charcoal mb-2'>
                    {locale === 'en' ? 'Description' : 'الوصف'}
                  </h3>
                  <p className='text-deep-charcoal/80'>{item.description}</p>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <span className='text-sm text-deep-charcoal/60'>
                      {locale === 'en' ? 'Category' : 'الفئة'}
                    </span>
                    <p className='font-medium text-deep-charcoal'>{item.category}</p>
                  </div>
                  <div>
                    <span className='text-sm text-deep-charcoal/60'>
                      {locale === 'en' ? 'Subcategory' : 'الفئة الفرعية'}
                    </span>
                    <p className='font-medium text-deep-charcoal'>{item.subCategory}</p>
                  </div>
                  <div>
                    <span className='text-sm text-deep-charcoal/60'>
                      {locale === 'en' ? 'Size' : 'المقاس'}
                    </span>
                    <p className='font-medium text-deep-charcoal'>{item.size}</p>
                  </div>
                  <div>
                    <span className='text-sm text-deep-charcoal/60'>
                      {locale === 'en' ? 'Condition' : 'الحالة'}
                    </span>
                    <p className='font-medium text-deep-charcoal'>{item.condition}</p>
                  </div>
                  <div>
                    <span className='text-sm text-deep-charcoal/60'>
                      {locale === 'en' ? 'Brand' : 'العلامة التجارية'}
                    </span>
                    <p className='font-medium text-deep-charcoal'>{item.brandName}</p>
                  </div>
                  <div>
                    <span className='text-sm text-deep-charcoal/60'>
                      {locale === 'en' ? 'Quantity' : 'الكمية'}
                    </span>
                    <p className='font-medium text-deep-charcoal'>{item.quantity}</p>
                  </div>
                </div>

                {item.sku && (
                  <div>
                    <span className='text-sm text-deep-charcoal/60'>
                      {locale === 'en' ? 'SKU' : 'رمز المنتج'}
                    </span>
                    <p className='font-medium text-deep-charcoal'>{item.sku}</p>
                  </div>
                )}

                <div>
                  <span className='text-sm text-deep-charcoal/60'>
                    {locale === 'en' ? 'Tags' : 'العلامات'}
                  </span>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {item.tags.split(',').map((tag: string, index: number) => (
                      <span
                        key={index}
                        className='px-3 py-1 bg-saudi-green/10 text-saudi-green rounded-full text-sm'
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='border-t border-rich-sand/30 pt-4'>
                  <h3 className='font-semibold text-deep-charcoal mb-3'>
                    {locale === 'en' ? 'Shipping Information' : 'معلومات الشحن'}
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Shipping Cost' : 'تكلفة الشحن'}
                      </span>
                      <p className='font-medium text-deep-charcoal'>
                        {item.currency} {item.shippingCost.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Processing Time' : 'وقت المعالجة'}
                      </span>
                      <p className='font-medium text-deep-charcoal'>
                        {item.processingTime}{' '}
                        {locale === 'en' ? 'days' : 'أيام'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

