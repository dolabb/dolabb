'use client';

import { useAppSelector } from '@/lib/store/hooks';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { HiPlus } from 'react-icons/hi2';
import ListedItems from './ListedItems';
import ListItemForm from './ListItemForm';
import ReviewsTab from './ReviewsTab';

export default function MyStoreContent() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const user = useAppSelector(state => state.auth.user);
  const isSeller = user?.role === 'seller';
  const isBuyer = user?.role === 'buyer';

  // For both buyers and sellers: 'manage', and for sellers: 'reviews'
  const [activeTab, setActiveTab] = useState<'manage' | 'reviews'>(
    'manage'
  );
  const [showListForm, setShowListForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Scroll to form when it's shown (for buyers)
  useEffect(() => {
    if (showListForm && formRef.current && isBuyer) {
      // Small delay to ensure the form is rendered
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [showListForm, isBuyer]);

  // For buyers: Show only "Create listing to sell your item" section
  if (isBuyer) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
            <h1 className='text-3xl font-bold text-deep-charcoal'>
              {locale === 'en' ? 'My Store' : 'متجري'}
            </h1>
          </div>

          {/* Buyer Content - Create listing section */}
          <div className='bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30'>
            <div className='text-center py-12'>
              <h2 className='text-2xl font-semibold text-deep-charcoal mb-4'>
                {locale === 'en'
                  ? 'Create listing to sell your item'
                  : 'إنشاء قائمة لبيع منتجك'}
              </h2>
              <p className='text-deep-charcoal/70 mb-8 max-w-md mx-auto'>
                {locale === 'en'
                  ? 'Start selling your items by listing your first product. Click the button below to get started!'
                  : 'ابدأ بيع منتجاتك من خلال إضافة منتجك الأول. انقر على الزر أدناه للبدء!'}
              </p>
              <button
                onClick={() => {
                  setShowListForm(true);
                }}
                className='flex items-center gap-2 px-8 py-4 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg cursor-pointer mx-auto'
              >
                <HiPlus className='w-5 h-5' />
                {locale === 'en' ? 'List an item' : 'إضافة منتج'}
              </button>
            </div>
          </div>

          {/* Show form when clicked */}
          {showListForm && (
            <div ref={formRef} className='mt-8'>
              <ListItemForm onCancel={() => setShowListForm(false)} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // For sellers: Show Manage and Payments tabs
  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
          <h1 className='text-3xl font-bold text-deep-charcoal'>
            {locale === 'en' ? 'My Store' : 'متجري'}
          </h1>
          <button
            onClick={() => {
              setShowListForm(true);
            }}
            className='flex items-center gap-2 px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg cursor-pointer'
          >
            <HiPlus className='w-5 h-5' />
            {locale === 'en' ? 'List an item' : 'إضافة منتج'}
          </button>
        </div>

        {/* Tabs */}
        <div className='flex gap-4 mb-6 border-b border-rich-sand/30'>
          <button
            onClick={() => {
              setActiveTab('manage');
              setShowListForm(false);
            }}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'manage'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Manage' : 'إدارة'}
          </button>
          <button
            onClick={() => {
              setActiveTab('reviews');
              setShowListForm(false);
            }}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Reviews' : 'المراجعات'}
          </button>
        </div>

        {/* Content */}
        {showListForm ? (
          <ListItemForm onCancel={() => setShowListForm(false)} />
        ) : (
          <>
            {activeTab === 'manage' && <ListedItems />}
            {activeTab === 'reviews' && <ReviewsTab />}
          </>
        )}
      </div>
    </div>
  );
}
