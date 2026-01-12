'use client';

import { useGetPaymentsQuery } from '@/lib/api/ordersApi';
import {
  useGetSellerBankDetailsQuery,
  useGetSellerEarningsQuery,
  useRequestSellerPayoutMutation,
} from '@/lib/api/sellerApi';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { HiBanknotes, HiClock } from 'react-icons/hi2';

export default function PayoutTab() {
  const locale = useLocale();
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');

  const [requestPayout, { isLoading: isRequesting }] =
    useRequestSellerPayoutMutation();
  const {
    data: earningsData,
    isLoading: isLoadingEarnings,
    refetch: refetchEarnings,
  } = useGetSellerEarningsQuery();
  const { data: bankDetailsData } = useGetSellerBankDetailsQuery();
  const { data: paymentsData } = useGetPaymentsQuery({});

  // Helper function to get bank details from either camelCase or snake_case format
  const getBankDetails = () => {
    if (!bankDetailsData) return null;
    
    // Try camelCase format first (transformed)
    if (bankDetailsData.bankDetails?.bankName) {
      return bankDetailsData.bankDetails;
    }
    
    // Fall back to snake_case format (raw API response)
    const rawBankDetails = (bankDetailsData as any)?.bank_details;
    if (rawBankDetails?.bank_name) {
      return {
        bankName: rawBankDetails.bank_name || '',
        accountNumber: rawBankDetails.account_number || '',
        accountHolderName: rawBankDetails.account_holder_name,
        iban: rawBankDetails.iban,
        swiftCode: rawBankDetails.swift_code,
      };
    }
    
    return null;
  };

  const earnings = earningsData?.earnings;
  const bankDetails = getBankDetails();
  const hasBankDetails = !!(
    bankDetails?.bankName && bankDetails?.accountNumber
  );

  const calculatedEarnings = paymentsData?.payments?.reduce(
    (acc, payment) => {
      if (payment.shipmentProof) {
        acc.totalEarnings += payment.sellerPayout || 0;
      } else if (['paid', 'shipped', 'delivered'].includes(payment.status)) {
        acc.pendingShipmentProof += payment.sellerPayout || 0;
      }
      return acc;
    },
    {
      totalEarnings: 0,
      totalPayouts: 0,
      pendingPayouts: 0,
      availableBalance: 0,
      pendingShipmentProof: 0,
    }
  ) || {
    totalEarnings: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    availableBalance: 0,
    pendingShipmentProof: 0,
  };

  const displayEarnings = earnings || calculatedEarnings;
  const MIN_CASHOUT_AMOUNT = 100;

  const handleRequestPayout = async () => {
    // Check for bank details first
    if (!hasBankDetails) {
      toast.error(
        locale === 'en'
          ? 'Please add your bank details in the Bank Details tab before requesting a payout'
          : 'يرجى إضافة تفاصيل البنك في تبويب تفاصيل البنك قبل طلب الدفع'
      );
      return;
    }

    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error(
        locale === 'en' ? 'Please enter a valid amount' : 'يرجى إدخال مبلغ صحيح'
      );
      return;
    }
    const amount = parseFloat(payoutAmount);
    const availableBalance = displayEarnings?.availableBalance ?? 0;

    if (amount < MIN_CASHOUT_AMOUNT) {
      toast.error(
        locale === 'en'
          ? `Minimum cashout amount is ${MIN_CASHOUT_AMOUNT} SAR`
          : `الحد الأدنى للسحب هو ${MIN_CASHOUT_AMOUNT} ر.س`
      );
      return;
    }
    if (amount > availableBalance) {
      toast.error(
        locale === 'en'
          ? 'Amount exceeds available balance'
          : 'المبلغ يتجاوز الرصيد المتاح'
      );
      return;
    }

    try {
      const result = await requestPayout({ amount, paymentMethod }).unwrap();
      if (result?.success === false) {
        if (result.missing_bank_details) {
          toast.error(
            locale === 'en'
              ? 'Please add your bank details in the Bank Details tab before requesting a payout'
              : 'يرجى إضافة تفاصيل البنك في تبويب تفاصيل البنك قبل طلب الدفع'
          );
          return;
        }
        toast.error(
          result.error ||
            (locale === 'en' ? 'Failed to request payout' : 'فشل طلب الدفع')
        );
        return;
      }
      toast.success(
        locale === 'en'
          ? 'Payout request submitted successfully!'
          : 'تم إرسال طلب الدفع بنجاح!'
      );
      setPayoutAmount('');
      refetchEarnings();
    } catch (error: any) {
      if (error?.data?.missing_bank_details) {
        toast.error(
          locale === 'en'
            ? 'Please add your bank details in the Bank Details tab before requesting a payout'
            : 'يرجى إضافة تفاصيل البنك في تبويب تفاصيل البنك قبل طلب الدفع'
        );
        return;
      }
      toast.error(
        error?.data?.error ||
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
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className='bg-white rounded-lg border border-rich-sand/30 p-4'
            >
              <div className='h-4 bg-rich-sand/30 rounded w-24 mb-2 skeleton-shimmer' />
              <div className='h-8 bg-rich-sand/30 rounded w-32 mb-1 skeleton-shimmer' />
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
              {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
              {displayEarnings.totalEarnings.toFixed(2)}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-4'>
            <p className='text-sm text-deep-charcoal/60 mb-1'>
              {locale === 'en' ? 'Total Payouts' : 'إجمالي المدفوعات'}
            </p>
            <p className='text-2xl font-bold text-deep-charcoal'>
              {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
              {displayEarnings.totalPayouts.toFixed(2)}
            </p>
          </div>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-4'>
            <p className='text-sm text-deep-charcoal/60 mb-1'>
              {locale === 'en' ? 'Pending Payouts' : 'المدفوعات المعلقة'}
            </p>
            <p className='text-2xl font-bold text-yellow-600'>
              {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
              {displayEarnings.pendingPayouts.toFixed(2)}
            </p>
          </div>
          <div className='bg-green-50 rounded-lg border border-green-200 p-4'>
            <p className='text-sm text-green-700 mb-1'>
              {locale === 'en' ? 'Available Balance' : 'الرصيد المتاح'}
            </p>
            <p className='text-2xl font-bold text-green-600'>
              {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
              {(displayEarnings.availableBalance ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Pending Shipment Warning */}
      {displayEarnings && (displayEarnings.pendingShipmentProof || 0) > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <HiClock className='w-5 h-5 text-yellow-600 shrink-0 mt-0.5' />
            <p className='text-sm text-yellow-700'>
              {locale === 'en'
                ? `You have ${displayEarnings.pendingShipmentProof.toFixed(
                    2
                  )} SAR locked until you upload shipment proof.`
                : `لديك ${displayEarnings.pendingShipmentProof.toFixed(
                    2
                  )} ر.س محجوزة حتى ترفع إثبات الشحن.`}
            </p>
          </div>
        </div>
      )}

      {/* Warning if bank details not added */}
      {!hasBankDetails && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <p className='text-sm text-yellow-700'>
            {locale === 'en'
              ? '⚠️ Please add your bank details in the Bank Details tab to request payouts'
              : '⚠️ يرجى إضافة تفاصيل البنك في تبويب تفاصيل البنك لطلب الدفع'}
          </p>
        </div>
      )}

      {/* Request Payout Section */}
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
              onChange={e => setPayoutAmount(e.target.value)}
              placeholder={locale === 'en' ? 'Enter amount' : 'أدخل المبلغ'}
              min='0'
              step='0.01'
              disabled={!hasBankDetails}
              className={`w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green ${!hasBankDetails ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {displayEarnings && (
              <p className='text-xs text-deep-charcoal/60 mt-1'>
                {locale === 'en' ? 'Available' : 'متاح'}:{' '}
                {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                {(displayEarnings.availableBalance ?? 0).toFixed(2)}
              </p>
            )}
            {payoutAmount &&
              parseFloat(payoutAmount) > 0 &&
              parseFloat(payoutAmount) < MIN_CASHOUT_AMOUNT && (
                <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <p className='text-xs text-yellow-700'>
                    ⚠️{' '}
                    {locale === 'en'
                      ? `Minimum cashout amount is ${MIN_CASHOUT_AMOUNT} SAR`
                      : `الحد الأدنى للسحب هو ${MIN_CASHOUT_AMOUNT} ر.س`}
                  </p>
                </div>
              )}
          </div>
          <div>
            <label className='block text-sm font-medium text-deep-charcoal mb-2'>
              {locale === 'en' ? 'Payment Method' : 'طريقة الدفع'}
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              disabled={!hasBankDetails}
              className={`w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green ${!hasBankDetails ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value='Bank Transfer'>
                {locale === 'en' ? 'Bank Transfer' : 'تحويل بنكي'}
              </option>
            </select>
          </div>
          <button
            onClick={handleRequestPayout}
            disabled={
              isRequesting ||
              !hasBankDetails ||
              !payoutAmount ||
              parseFloat(payoutAmount) <= 0 ||
              parseFloat(payoutAmount) < MIN_CASHOUT_AMOUNT
            }
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
