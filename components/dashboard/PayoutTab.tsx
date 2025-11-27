'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';
import { HiBanknotes, HiClock } from 'react-icons/hi2';
import {
  useGetSellerEarningsQuery,
  useRequestSellerPayoutMutation,
} from '@/lib/api/sellerApi';
import { useGetPaymentsQuery } from '@/lib/api/ordersApi';
import { toast } from '@/utils/toast';

export default function PayoutTab() {
  const locale = useLocale();
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [requestPayout, { isLoading: isRequesting }] = useRequestSellerPayoutMutation();

  const { data: earningsData, isLoading: isLoadingEarnings, error: earningsError } = useGetSellerEarningsQuery(undefined, {
    skip: false,
  });

  const earnings = earningsData?.earnings;

  // Calculate earnings from payments if API not available
  const { data: paymentsData } = useGetPaymentsQuery({});
  const calculatedEarnings = paymentsData?.payments?.reduce(
    (acc, payment) => {
      // Only count earnings from orders with shipment proof
      if (payment.shipmentProof) {
        acc.totalEarnings += payment.sellerPayout || 0;
      } else if (payment.status === 'paid' || payment.status === 'shipped' || payment.status === 'delivered') {
        // Count pending shipment proof
        acc.pendingShipmentProof += payment.sellerPayout || 0;
      }
      return acc;
    },
    { totalEarnings: 0, totalPayouts: 0, pendingPayouts: 0, availableBalance: 0, pendingShipmentProof: 0 }
  ) || { totalEarnings: 0, totalPayouts: 0, pendingPayouts: 0, availableBalance: 0, pendingShipmentProof: 0 };

  // Use API earnings if available, otherwise use calculated
  const displayEarnings = earnings || calculatedEarnings;

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error(
        locale === 'en' ? 'Please enter a valid amount' : 'يرجى إدخال مبلغ صحيح'
      );
      return;
    }

    const amount = parseFloat(payoutAmount);
    const availableBalance = displayEarnings?.availableBalance || displayEarnings?.totalEarnings || 0;

    if (amount > availableBalance) {
      toast.error(
        locale === 'en'
          ? 'Amount exceeds available balance'
          : 'المبلغ يتجاوز الرصيد المتاح'
      );
      return;
    }

    try {
      await requestPayout({
        amount,
        paymentMethod,
      }).unwrap();
      toast.success(
        locale === 'en'
          ? 'Payout request submitted successfully!'
          : 'تم إرسال طلب الدفع بنجاح!'
      );
      setPayoutAmount('');
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
        (locale === 'en' ? 'Failed to request payout' : 'فشل طلب الدفع')
      );
    }
  };


  return (
    <div className='space-y-6'>
      {/* Earnings Summary */}
      {isLoadingEarnings ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className='bg-white rounded-lg border border-rich-sand/30 p-4'
            >
              <div className='h-4 bg-rich-sand/30 rounded w-24 mb-2 skeleton-shimmer' />
              <div className='h-8 bg-rich-sand/30 rounded w-32 mb-1 skeleton-shimmer' />
              <div className='h-3 bg-rich-sand/30 rounded w-40 skeleton-shimmer' />
            </div>
          ))}
        </div>
      ) : displayEarnings ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-4'>
            <p className='text-sm text-deep-charcoal/60 mb-1'>
              {locale === 'en' ? 'Total Earnings' : 'إجمالي الأرباح'}
            </p>
            <p className='text-2xl font-bold text-deep-charcoal'>
              {locale === 'ar' ? 'ر.س' : 'SAR'} {displayEarnings.totalEarnings.toFixed(2)}
            </p>
            <p className='text-xs text-deep-charcoal/50 mt-1'>
              {locale === 'en' ? 'From orders with shipment proof' : 'من الطلبات مع إثبات الشحن'}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-4'>
            <p className='text-sm text-deep-charcoal/60 mb-1'>
              {locale === 'en' ? 'Total Payouts' : 'إجمالي المدفوعات'}
            </p>
            <p className='text-2xl font-bold text-deep-charcoal'>
              {locale === 'ar' ? 'ر.س' : 'SAR'} {displayEarnings.totalPayouts.toFixed(2)}
            </p>
            <p className='text-xs text-deep-charcoal/50 mt-1'>
              {locale === 'en' ? 'Approved payout requests' : 'طلبات الدفع الموافق عليها'}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-4'>
            <p className='text-sm text-deep-charcoal/60 mb-1'>
              {locale === 'en' ? 'Pending Payouts' : 'المدفوعات المعلقة'}
            </p>
            <p className='text-2xl font-bold text-yellow-600'>
              {locale === 'ar' ? 'ر.س' : 'SAR'} {displayEarnings.pendingPayouts.toFixed(2)}
            </p>
            <p className='text-xs text-deep-charcoal/50 mt-1'>
              {locale === 'en' ? 'Payout requests + orders without proof' : 'طلبات الدفع + الطلبات بدون إثبات'}
            </p>
          </div>
          <div className='bg-green-50 rounded-lg border border-green-200 p-4'>
            <p className='text-sm text-green-700 mb-1'>
              {locale === 'en' ? 'Available Balance' : 'الرصيد المتاح'}
            </p>
            <p className='text-2xl font-bold text-green-600'>
              {locale === 'ar' ? 'ر.س' : 'SAR'} {(displayEarnings.availableBalance || displayEarnings.totalEarnings).toFixed(2)}
            </p>
            <p className='text-xs text-green-600/70 mt-1'>
              {locale === 'en' ? 'Ready for withdrawal' : 'جاهز للسحب'}
            </p>
          </div>
        </div>
      ) : null}

      {/* Warning Banner */}
      {displayEarnings && (displayEarnings.pendingShipmentProof || 0) > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <HiClock className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <h4 className='font-semibold text-yellow-800 mb-1'>
                {locale === 'en' ? '⚠️ Action Required' : '⚠️ إجراء مطلوب'}
              </h4>
              <p className='text-sm text-yellow-700 mb-2'>
                {locale === 'en'
                  ? `You have ${(displayEarnings.pendingShipmentProof || 0).toFixed(2)} SAR locked until you upload shipment proof for completed orders. Upload proof to make these earnings available for payout.`
                  : `لديك ${(displayEarnings.pendingShipmentProof || 0).toFixed(2)} ر.س محجوزة حتى تقوم برفع إثبات الشحن للطلبات المكتملة. قم برفع الإثبات لجعل هذه الأرباح متاحة للدفع.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Request Payout */}
      <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
        <h3 className='text-lg font-semibold text-deep-charcoal mb-4 flex items-center gap-2'>
          <HiBanknotes className='w-5 h-5 text-saudi-green' />
          {locale === 'en' ? 'Request Payout' : 'طلب الدفع'}
        </h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-deep-charcoal mb-2'>
              {locale === 'en' ? 'Amount' : 'المبلغ'}
            </label>
            <input
              type='number'
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder={locale === 'en' ? 'Enter amount' : 'أدخل المبلغ'}
              className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
              min='0'
              step='0.01'
            />
            {displayEarnings && (
              <p className='text-xs text-deep-charcoal/60 mt-1'>
                {locale === 'en' ? 'Available' : 'متاح'}: {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                {(displayEarnings.availableBalance || displayEarnings.totalEarnings).toFixed(2)}
              </p>
            )}
          </div>
          <div>
            <label className='block text-sm font-medium text-deep-charcoal mb-2'>
              {locale === 'en' ? 'Payment Method' : 'طريقة الدفع'}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
            >
              <option value='Bank Transfer'>
                {locale === 'en' ? 'Bank Transfer' : 'تحويل بنكي'}
              </option>
              <option value='PayPal'>{locale === 'en' ? 'PayPal' : 'PayPal'}</option>
              <option value='Stripe'>{locale === 'en' ? 'Stripe' : 'Stripe'}</option>
            </select>
          </div>
          <button
            onClick={handleRequestPayout}
            disabled={isRequesting || !payoutAmount || parseFloat(payoutAmount) <= 0}
            className='w-full px-6 py-3 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isRequesting
              ? locale === 'en'
                ? 'Submitting...'
                : 'جاري الإرسال...'
              : locale === 'en'
              ? 'Request Payout'
              : 'طلب الدفع'}
          </button>
        </div>
      </div>

    </div>
  );
}

