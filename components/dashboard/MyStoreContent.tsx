'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { HiPlus, HiEye } from 'react-icons/hi2';
import ListedItems from './ListedItems';
import PaymentsTab from './PaymentsTab';
import ListItemForm from './ListItemForm';

export default function MyStoreContent() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'manage' | 'payments'>('manage');
  const [showListForm, setShowListForm] = useState(false);

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
          <h1 className='text-3xl font-bold text-deep-charcoal'>
            {locale === 'en' ? 'My Store' : 'متجري'}
          </h1>
          <button
            onClick={() => setShowListForm(!showListForm)}
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
              setActiveTab('payments');
              setShowListForm(false);
            }}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'payments'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Payments' : 'المدفوعات'}
          </button>
        </div>

        {/* Content */}
        {showListForm ? (
          <ListItemForm onCancel={() => setShowListForm(false)} />
        ) : (
          <>
            {activeTab === 'manage' && <ListedItems />}
            {activeTab === 'payments' && <PaymentsTab />}
          </>
        )}
      </div>
    </div>
  );
}

