'use client';

import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { HiBuildingLibrary, HiPencil, HiCheckCircle } from 'react-icons/hi2';
import {
  useGetSellerBankDetailsQuery,
  useUpdateSellerBankDetailsMutation,
} from '@/lib/api/sellerApi';
import { toast } from '@/utils/toast';

export default function BankDetailsTab() {
  const locale = useLocale();
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    iban: '',
  });

  const [updateBankDetails, { isLoading: isUpdatingBank }] = useUpdateSellerBankDetailsMutation();
  const { data: bankDetailsData, isLoading: isLoadingBankDetails, refetch: refetchBankDetails } = useGetSellerBankDetailsQuery();

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

  const bankDetails = getBankDetails();
  const hasBankDetails = !!(bankDetails?.bankName && bankDetails?.accountNumber);

  useEffect(() => {
    if (bankDetails) {
      setBankForm({
        bankName: bankDetails.bankName || '',
        accountNumber: bankDetails.accountNumber || '',
        accountHolderName: bankDetails.accountHolderName || '',
        iban: bankDetails.iban || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankDetailsData]);

  const handleSaveBankDetails = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber) {
      toast.error(locale === 'en' ? 'Bank name and account number are required' : 'اسم البنك ورقم الحساب مطلوبان');
      return;
    }
    try {
      await updateBankDetails(bankForm).unwrap();
      toast.success(locale === 'en' ? 'Bank details saved successfully!' : 'تم حفظ تفاصيل البنك بنجاح!');
      setShowBankForm(false);
      refetchBankDetails();
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || (locale === 'en' ? 'Failed to save bank details' : 'فشل حفظ تفاصيل البنك'));
    }
  };

  return (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-semibold text-deep-charcoal flex items-center gap-2'>
            <HiBuildingLibrary className='w-6 h-6 text-saudi-green' />
            {locale === 'en' ? 'Bank Details' : 'تفاصيل البنك'}
          </h3>
          {hasBankDetails && !showBankForm && (
            <button 
              onClick={() => setShowBankForm(true)} 
              className='flex items-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors'
            >
              <HiPencil className='w-4 h-4' />
              {locale === 'en' ? 'Update' : 'تحديث'}
            </button>
          )}
        </div>

        {isLoadingBankDetails ? (
          <div className='space-y-4'>
            <div className='h-4 bg-rich-sand/30 rounded w-48 skeleton-shimmer' />
            <div className='h-4 bg-rich-sand/30 rounded w-64 skeleton-shimmer' />
            <div className='h-4 bg-rich-sand/30 rounded w-56 skeleton-shimmer' />
          </div>
        ) : showBankForm || !hasBankDetails ? (
          <div className='space-y-6'>
            {!hasBankDetails && (
              <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                <p className='text-sm text-yellow-700'>
                  {locale === 'en' 
                    ? '⚠️ Please add your bank details to be able to request payouts' 
                    : '⚠️ يرجى إضافة تفاصيل البنك لتتمكن من طلب الدفع'}
                </p>
              </div>
            )}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
                  {locale === 'en' ? 'Bank Name' : 'اسم البنك'} <span className='text-red-500'>*</span>
                </label>
                <input 
                  type='text' 
                  value={bankForm.bankName} 
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className='w-full px-4 py-3 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                  placeholder={locale === 'en' ? 'Enter bank name' : 'أدخل اسم البنك'} 
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
                  {locale === 'en' ? 'Account Number' : 'رقم الحساب'} <span className='text-red-500'>*</span>
                </label>
                <input 
                  type='text' 
                  value={bankForm.accountNumber} 
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className='w-full px-4 py-3 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                  placeholder={locale === 'en' ? 'Enter account number' : 'أدخل رقم الحساب'} 
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
                  {locale === 'en' ? 'Account Holder Name' : 'اسم صاحب الحساب'}
                </label>
                <input 
                  type='text' 
                  value={bankForm.accountHolderName} 
                  onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                  className='w-full px-4 py-3 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                  placeholder={locale === 'en' ? 'Enter account holder name' : 'أدخل اسم صاحب الحساب'} 
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
                  {locale === 'en' ? 'IBAN' : 'رقم الآيبان'}
                </label>
                <input 
                  type='text' 
                  value={bankForm.iban} 
                  onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                  className='w-full px-4 py-3 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                  placeholder={locale === 'en' ? 'Enter IBAN' : 'أدخل رقم الآيبان'} 
                />
              </div>
            </div>
            <div className='flex gap-3 pt-2'>
              <button 
                onClick={handleSaveBankDetails} 
                disabled={isUpdatingBank}
                className='px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors disabled:opacity-50'
              >
                {isUpdatingBank 
                  ? (locale === 'en' ? 'Saving...' : 'جاري الحفظ...') 
                  : (locale === 'en' ? 'Save Bank Details' : 'حفظ تفاصيل البنك')}
              </button>
              {hasBankDetails && (
                <button 
                  onClick={() => setShowBankForm(false)} 
                  className='px-6 py-3 border border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/10'
                >
                  {locale === 'en' ? 'Cancel' : 'إلغاء'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            {/* Success indicator */}
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3'>
              <HiCheckCircle className='w-5 h-5 text-green-600 shrink-0' />
              <p className='text-sm text-green-700'>
                {locale === 'en' 
                  ? 'Your bank details are saved. You can request payouts.' 
                  : 'تم حفظ تفاصيل البنك الخاصة بك. يمكنك طلب الدفع.'}
              </p>
            </div>
            
            {/* Bank details display */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                  {locale === 'en' ? 'Bank Name' : 'اسم البنك'}
                </p>
                <p className='text-lg font-medium text-deep-charcoal'>{bankDetails.bankName}</p>
              </div>
              <div>
                <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                  {locale === 'en' ? 'Account Number' : 'رقم الحساب'}
                </p>
                <p className='text-lg font-medium text-deep-charcoal'>
                  ****{bankDetails.accountNumber.slice(-4)}
                </p>
              </div>
              {bankDetails.accountHolderName && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Account Holder Name' : 'اسم صاحب الحساب'}
                  </p>
                  <p className='text-lg font-medium text-deep-charcoal'>{bankDetails.accountHolderName}</p>
                </div>
              )}
              {bankDetails.iban && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'IBAN' : 'رقم الآيبان'}
                  </p>
                  <p className='text-lg font-medium text-deep-charcoal'>
                    ****{bankDetails.iban.slice(-4)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
