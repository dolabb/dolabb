'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { HiUser, HiCreditCard, HiCurrencyDollar, HiChartBar, HiDocumentText, HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi2';
import TermsModal from '@/components/shared/TermsModal';
import { 
  useGetAffiliateTransactionsQuery, 
  useGetPayoutRequestsQuery,
  useRequestCashoutMutation,
  useGetAffiliateProfileQuery,
  useGetEarningsBreakdownQuery,
  useGetBankDetailsQuery,
  useUpdateBankDetailsMutation
} from '@/lib/api/affiliatesApi';
import { toast } from '@/utils/toast';
import { handleApiErrorWithToast } from '@/utils/errorHandler';
import Pagination from '@/components/shared/Pagination';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AffiliateDashboardContentProps {
  affiliate: any;
}

export default function AffiliateDashboardContent({ affiliate: initialAffiliate }: AffiliateDashboardContentProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [affiliate, setAffiliate] = useState(initialAffiliate);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'cashout'>('overview');
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutCurrency, setCashoutCurrency] = useState('SAR');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [showBankDetailsForm, setShowBankDetailsForm] = useState(false);
  const [bankVerificationStep, setBankVerificationStep] = useState<'verify' | 'reference' | null>(null);
  const [bankReference, setBankReference] = useState('');
  const [bankDetailsForm, setBankDetailsForm] = useState({
    bankName: '',
    accountNumber: '',
    iban: '',
    accountHolderName: '',
  });
  const [transactionsPage, setTransactionsPage] = useState(1);
  const transactionsLimit = 20;
  const [transactionsCurrencyFilter, setTransactionsCurrencyFilter] = useState<string>('');
  const [earningsPeriod, setEarningsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [earningsLimit, setEarningsLimit] = useState(12);
  const [earningsCurrencyFilter, setEarningsCurrencyFilter] = useState<string>('');
  const [showCashoutTermsModal, setShowCashoutTermsModal] = useState(false);
  const [cashoutTermsAccepted, setCashoutTermsAccepted] = useState(false);

  // API hooks - Get affiliate profile with earnings data
  const { data: profileData, isLoading: isLoadingProfile, refetch: refetchProfile } = useGetAffiliateProfileQuery();

  // API hooks - Get earnings breakdown for charts
  const { data: earningsBreakdownData, isLoading: isLoadingBreakdown, refetch: refetchBreakdown } = useGetEarningsBreakdownQuery({
    period: earningsPeriod,
    limit: earningsLimit,
    currency: earningsCurrencyFilter || undefined,
  });

  // API hooks - Get transactions
  const { data: transactionsData, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useGetAffiliateTransactionsQuery(
    { 
      page: transactionsPage, 
      limit: transactionsLimit,
      currency: transactionsCurrencyFilter || undefined,
    },
    { 
      skip: activeTab !== 'earnings' 
    }
  );

  const { data: payoutData, isLoading: isLoadingPayouts, refetch: refetchCashoutRequests } = useGetPayoutRequestsQuery(
    { page: 1, limit: 20 },
    { skip: activeTab !== 'cashout' }
  );

  const [requestCashout, { isLoading: isRequestingCashout }] = useRequestCashoutMutation();
  const { data: bankDetailsData, refetch: refetchBankDetails } = useGetBankDetailsQuery();
  const [updateBankDetails, { isLoading: isUpdatingBankDetails }] = useUpdateBankDetailsMutation();

  // Update affiliate data when profile API returns data
  useEffect(() => {
    if (profileData?.affiliate) {
      setAffiliate(profileData.affiliate);
    }
  }, [profileData]);

  // Calculate earnings from API profile data (prioritize API data over initial affiliate)
  const apiAffiliate = profileData?.affiliate || affiliate;
  const earningsByCurrency = apiAffiliate?.earningsByCurrency || {};
  const availableCurrencies = Object.keys(earningsByCurrency);
  
  // Get available balance for selected currency
  const getAvailableBalanceForCurrency = (currency: string) => {
    return earningsByCurrency[currency]?.pending || 0;
  };

  const earnings = {
    totalEarnings: apiAffiliate?.totalEarnings || 0,
    totalCommissions: apiAffiliate?.totalCommissions || 0,
    codeUsageCount: apiAffiliate?.codeUsageCount || 0,
    pendingEarnings: apiAffiliate?.pendingEarnings || 0,
    paidEarnings: apiAffiliate?.paidEarnings || 0,
    availableBalance: apiAffiliate?.availableBalance || apiAffiliate?.pendingEarnings || 0,
    commissionRate: apiAffiliate?.commission_rate || 0,
    status: apiAffiliate?.status || 'pending',
    earningsByCurrency,
  };

  // Set default currency if available
  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.includes(cashoutCurrency)) {
      setCashoutCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, cashoutCurrency]);

  // Normalize cashout requests from API response (support both old and new field names)
  const cashoutRequests = payoutData?.cashoutRequests || payoutData?.payoutRequests || [];
  
  // Helper function to normalize cashout request data
  const normalizeCashoutRequest = (request: any) => {
    return {
      id: request.id || '',
      affiliateId: request.affiliateId || '',
      affiliateName: request.affiliateName || '',
      amount: request.amount || 0,
      currency: request.currency || 'SAR',
      status: request.status || 'pending',
      paymentMethod: request.paymentMethod || 'Bank Transfer',
      requestedAt: request.requestedDate || request.requestedAt || new Date().toISOString(),
      processedAt: request.reviewedAt || request.processedAt || undefined,
      accountDetails: request.accountDetails || undefined,
      rejectionReason: request.rejectionReason || undefined,
      reviewedBy: request.reviewedBy || undefined,
      notes: request.notes || request.rejectionReason || undefined,
    };
  };
  const transactions = transactionsData?.transactions || [];
  const transactionsPagination = transactionsData?.pagination;
  
  // Extract stats from first transaction if available (stats are in each transaction)
  const firstTransaction = transactions.length > 0 ? transactions[0] : null;
  const transactionsStats = firstTransaction?.stats || {};
  
  // Overall stats from transactions API or transaction stats
  const overallStats = {
    totalReferrals: transactionsStats?.totalReferrals || transactionsData?.totalReferrals || 0,
    totalEarnings: transactionsStats?.totalEarnings || transactionsData?.totalEarnings || earnings.totalEarnings,
    totalSales: transactionsStats?.['Total Sales'] || transactionsData?.totalSales || 0,
    commissionRate: transactionsStats?.['Commission Rate'] || transactionsData?.commissionRate || earnings.commissionRate,
  };
  
  // Helper function to normalize transaction data
  const normalizeTransaction = (transaction: any) => {
    return {
      id: transaction._id || transaction.id || '',
      orderId: transaction['Transaction ID'] || transaction.orderId || transaction.id || '',
      orderNumber: transaction['Transaction ID'] || transaction.orderNumber || transaction.orderId || '',
      referredUserName: transaction['Referred User Name'] || transaction.referredUserName || 'N/A',
      commission: transaction['Referred User Commission'] || transaction.commission || 0,
      commissionRate: transaction['Commission Rate'] || transaction.commissionRate || 0,
      status: transaction.status || 'pending',
      currency: transaction.currency || 'SAR',
      created_at: transaction.date || transaction.created_at || new Date().toISOString(),
    };
  };

  // Reset to page 1 when switching to earnings tab
  useEffect(() => {
    if (activeTab === 'earnings') {
      setTransactionsPage(1);
    }
  }, [activeTab]);

  // Check if affiliate has bank details (from separate bank-details endpoint)
  const bankDetails = bankDetailsData?.bank_details;
  const hasBankDetails = bankDetails?.bank_name && 
                         bankDetails?.account_number && 
                         bankDetails?.account_holder_name;

  // Minimum cashout amount (100 in selected currency)
  const MIN_CASHOUT_AMOUNT = 100;

  // Actual cashout submission function
  const submitCashoutRequest = async () => {
    if (!cashoutAmount || parseFloat(cashoutAmount) <= 0) {
      toast.error(locale === 'en' ? 'Please enter a valid amount' : 'يرجى إدخال مبلغ صحيح');
      return;
    }

    const amount = parseFloat(cashoutAmount);

    try {
      const result = await requestCashout({
        amount,
        paymentMethod,
        currency: cashoutCurrency,
        bankReference: bankReference || undefined,
      }).unwrap();

      if (result.success && result.cashoutRequest) {
        toast.success(
          locale === 'en'
            ? `Cashout request of ${amount.toFixed(2)} ${cashoutCurrency} submitted successfully! Waiting for admin approval.`
            : `تم إرسال طلب السحب بقيمة ${amount.toFixed(2)} ${cashoutCurrency} بنجاح! في انتظار موافقة المسؤول.`
        );
        setCashoutAmount('');
        setBankReference('');
        setBankVerificationStep(null);
        setShowBankDetailsForm(false);
        setCashoutTermsAccepted(false);
        // Refetch profile to update available balance and cashout requests
        refetchProfile();
        refetchCashoutRequests();
      } else {
        const errorMessage = result.error || 
          (locale === 'en' ? 'Failed to submit cashout request' : 'فشل إرسال طلب السحب');
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Cashout request error:', error);
      
      // Extract error details from API response
      const errorResponse = error?.data || {};
      const errorMessage = errorResponse.error || errorResponse.message || error.message;
      
      // Handle specific error messages
      if (errorMessage?.toLowerCase().includes('insufficient')) {
        toast.error(
          locale === 'en'
            ? 'Insufficient pending earnings. Please check your available balance.'
            : 'الأرباح المعلقة غير كافية. يرجى التحقق من رصيدك المتاح.'
        );
      } else if (error?.status === 404 || errorMessage?.toLowerCase().includes('not found')) {
        toast.error(
          locale === 'en'
            ? 'Affiliate account not found. Please contact support.'
            : 'لم يتم العثور على حساب الشريك. يرجى الاتصال بالدعم.'
        );
      } else {
        toast.error(
          errorMessage ||
            (locale === 'en'
              ? 'Failed to submit cashout request. Please try again.'
              : 'فشل إرسال طلب السحب. يرجى المحاولة مرة أخرى.')
        );
      }
    }
  };

  const handleCashoutRequest = async () => {
    if (!cashoutAmount || parseFloat(cashoutAmount) <= 0) {
      toast.error(locale === 'en' ? 'Please enter a valid amount' : 'يرجى إدخال مبلغ صحيح');
      return;
    }

    const amount = parseFloat(cashoutAmount);
    const availableBalanceForCurrency = getAvailableBalanceForCurrency(cashoutCurrency);
    
    // Check minimum cashout amount
    if (amount < MIN_CASHOUT_AMOUNT) {
      toast.error(
        locale === 'en'
          ? `Minimum cashout amount is ${MIN_CASHOUT_AMOUNT} ${cashoutCurrency}`
          : `الحد الأدنى لمبلغ السحب هو ${MIN_CASHOUT_AMOUNT} ${cashoutCurrency}`
      );
      return;
    }
    
    if (amount > availableBalanceForCurrency) {
      toast.error(
        locale === 'en'
          ? `Insufficient balance. Available balance is ${availableBalanceForCurrency.toFixed(2)} ${cashoutCurrency}`
          : `الرصيد غير كاف. الرصيد المتاح هو ${availableBalanceForCurrency.toFixed(2)} ${cashoutCurrency}`
      );
      return;
    }

    // Check if bank details exist - if not, show bank details form
    if (!hasBankDetails) {
      setShowBankDetailsForm(true);
      return;
    }

    // If bank details exist, proceed with verification flow
    if (!bankVerificationStep) {
      setBankVerificationStep('verify');
      return;
    }

    // If in reference step, check terms acceptance before proceeding with cashout
    if (bankVerificationStep === 'reference' && !cashoutTermsAccepted) {
      setShowCashoutTermsModal(true);
      return;
    }

    // All checks passed, proceed with cashout submission
    await submitCashoutRequest();
  };

  // Status badge for payout requests (pending, approved, rejected)
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: HiClock, text: locale === 'en' ? 'Pending' : 'قيد الانتظار' },
      approved: { color: 'bg-green-100 text-green-800', icon: HiCheckCircle, text: locale === 'en' ? 'Approved' : 'موافق عليه' },
      rejected: { color: 'bg-red-100 text-red-800', icon: HiXCircle, text: locale === 'en' ? 'Rejected' : 'مرفوض' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  // Status badge for transactions (pending, paid, cancelled)
  // Backend behavior:
  // - 'pending': Earnings added on payment completion, waiting for review + shipment proof
  // - 'paid': Review and shipment proof provided, earnings confirmed
  const getTransactionStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: HiClock, 
        text: locale === 'en' ? 'Pending Review' : 'قيد المراجعة',
        tooltip: locale === 'en' 
          ? 'Earnings added, waiting for review and shipment proof' 
          : 'تمت إضافة الأرباح، في انتظار المراجعة وإثبات الشحن'
      },
      paid: { 
        color: 'bg-green-100 text-green-800', 
        icon: HiCheckCircle, 
        text: locale === 'en' ? 'Paid' : 'مدفوع',
        tooltip: locale === 'en' 
          ? 'Review and shipment proof provided, earnings confirmed' 
          : 'تم تقديم المراجعة وإثبات الشحن، تم تأكيد الأرباح'
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800', 
        icon: HiXCircle, 
        text: locale === 'en' ? 'Cancelled' : 'ملغي',
        tooltip: locale === 'en' 
          ? 'Transaction cancelled' 
          : 'تم إلغاء المعاملة'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span 
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
        title={config.tooltip}
      >
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };


  return (
    <div className="bg-off-white min-h-screen py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-deep-charcoal mb-2">
            {locale === 'en' ? 'Affiliate Dashboard' : 'لوحة تحكم الشريك'}
          </h1>
          <p className="text-deep-charcoal/70">
            {locale === 'en' ? 'Manage your affiliate account and track earnings' : 'إدارة حساب الشريك وتتبع الأرباح'}
          </p>
        </div>

        {/* Tabs - Horizontally scrollable on mobile */}
        <div className="flex mb-6 border-b border-rich-sand/30 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 sm:gap-4 min-w-max">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 sm:px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-saudi-green text-saudi-green'
                  : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
              }`}
            >
              {locale === 'en' ? 'Overview' : 'نظرة عامة'}
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`px-4 sm:px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'earnings'
                  ? 'border-saudi-green text-saudi-green'
                  : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
              }`}
            >
              {locale === 'en' ? 'Earnings' : 'الأرباح'}
            </button>
            <button
              onClick={() => setActiveTab('cashout')}
              className={`px-4 sm:px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'cashout'
                  ? 'border-saudi-green text-saudi-green'
                  : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
              }`}
            >
              {locale === 'en' ? 'Cashout' : 'السحب'}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {isLoadingProfile ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green mx-auto mb-4"></div>
                <p className="text-deep-charcoal/70">{locale === 'en' ? 'Loading earnings data...' : 'جاري تحميل بيانات الأرباح...'}</p>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-deep-charcoal/70">
                        {locale === 'en' ? 'Total Earnings' : 'إجمالي الأرباح'}
                      </h3>
                      <HiCurrencyDollar className="w-5 h-5 text-saudi-green" />
                    </div>
                    <p className="text-2xl font-bold text-deep-charcoal mb-2">
                      {earnings.totalEarnings.toFixed(2)} {locale === 'ar' ? 'ر.س' : 'SAR'}
                    </p>
                    {Object.keys(earningsByCurrency).length > 0 && (
                      <div className="mt-2 space-y-1 text-xs text-deep-charcoal/70">
                        {Object.entries(earningsByCurrency).map(([currency, data]) => {
                          const currencyData = data as { total: number; pending: number; paid: number };
                          return (
                            <div key={currency} className="flex items-center gap-1">
                              <span className={locale === 'ar' ? 'ml-1' : 'mr-1'}>├─</span>
                              <span>{currency}:</span>
                              <span className="font-semibold">{currencyData.total.toFixed(2)} {currency}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

              <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-deep-charcoal/70">
                    {locale === 'en' ? 'Code Usage' : 'استخدام الرمز'}
                  </h3>
                  <HiChartBar className="w-5 h-5 text-saudi-green" />
                </div>
                <p className="text-2xl font-bold text-deep-charcoal">
                  {earnings.codeUsageCount}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-deep-charcoal/70">
                    {locale === 'en' ? 'Pending Earnings' : 'الأرباح المعلقة'}
                  </h3>
                  <HiClock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-deep-charcoal mb-2">
                  {earnings.pendingEarnings.toFixed(2)} {locale === 'ar' ? 'ر.س' : 'SAR'}
                </p>
                {Object.keys(earningsByCurrency).length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-deep-charcoal/70">
                    {Object.entries(earningsByCurrency).map(([currency, data]) => {
                      const currencyData = data as { total: number; pending: number; paid: number };
                      return (
                        <div key={currency} className="flex items-center gap-1">
                          <span className={locale === 'ar' ? 'ml-1' : 'mr-1'}>├─</span>
                          <span>{currency}:</span>
                          <span className="font-semibold">{currencyData.pending.toFixed(2)} {currency}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-deep-charcoal/70">
                    {locale === 'en' ? 'Paid Earnings' : 'الأرباح المدفوعة'}
                  </h3>
                  <HiCreditCard className="w-5 h-5 text-saudi-green" />
                </div>
                <p className="text-2xl font-bold text-deep-charcoal mb-2">
                  {earnings.paidEarnings.toFixed(2)} {locale === 'ar' ? 'ر.س' : 'SAR'}
                </p>
                {Object.keys(earningsByCurrency).length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-deep-charcoal/70">
                    {Object.entries(earningsByCurrency).map(([currency, data]) => {
                      const currencyData = data as { total: number; pending: number; paid: number };
                      return (
                        <div key={currency} className="flex items-center gap-1">
                          <span className={locale === 'ar' ? 'ml-1' : 'mr-1'}>├─</span>
                          <span>{currency}:</span>
                          <span className="font-semibold">{currencyData.paid.toFixed(2)} {currency}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings Breakdown Chart */}
              <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-deep-charcoal">
                    {locale === 'en' ? 'Earnings Breakdown' : 'تفصيل الأرباح'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={earningsCurrencyFilter}
                      onChange={(e) => setEarningsCurrencyFilter(e.target.value)}
                      className="text-xs px-2 py-1 border border-rich-sand rounded-md text-deep-charcoal focus:outline-none focus:ring-2 focus:ring-saudi-green"
                    >
                      <option value="">{locale === 'en' ? 'All Currencies' : 'جميع العملات'}</option>
                      {availableCurrencies.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                    <select
                      value={earningsPeriod}
                      onChange={(e) => setEarningsPeriod(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                      className="text-xs px-2 py-1 border border-rich-sand rounded-md text-deep-charcoal focus:outline-none focus:ring-2 focus:ring-saudi-green"
                    >
                      <option value="daily">{locale === 'en' ? 'Daily' : 'يومي'}</option>
                      <option value="weekly">{locale === 'en' ? 'Weekly' : 'أسبوعي'}</option>
                      <option value="monthly">{locale === 'en' ? 'Monthly' : 'شهري'}</option>
                      <option value="yearly">{locale === 'en' ? 'Yearly' : 'سنوي'}</option>
                    </select>
                  </div>
                </div>
                {isLoadingBreakdown ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saudi-green"></div>
                  </div>
                ) : earningsBreakdownData?.breakdown && earningsBreakdownData.breakdown.length > 0 ? (
                  <Bar
                    data={{
                      labels: earningsBreakdownData.breakdown.map(item => item.label),
                      datasets: [
                        {
                          label: locale === 'en' ? 'Total Earnings' : 'إجمالي الأرباح',
                          data: earningsBreakdownData.breakdown.map(item => item.totalEarnings),
                          backgroundColor: 'rgba(0, 103, 71, 0.8)', // saudi-green
                          borderColor: '#006747',
                          borderWidth: 2,
                          borderRadius: 8,
                        },
                        {
                          label: locale === 'en' ? 'Pending Earnings' : 'الأرباح المعلقة',
                          data: earningsBreakdownData.breakdown.map(item => item.pendingEarnings),
                          backgroundColor: 'rgba(234, 179, 8, 0.8)', // yellow-500
                          borderColor: '#eab308',
                          borderWidth: 2,
                          borderRadius: 8,
                        },
                        {
                          label: locale === 'en' ? 'Paid Earnings' : 'الأرباح المدفوعة',
                          data: earningsBreakdownData.breakdown.map(item => item.paidEarnings),
                          backgroundColor: 'rgba(16, 185, 129, 0.8)', // green-500
                          borderColor: '#10b981',
                          borderWidth: 2,
                          borderRadius: 8,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      aspectRatio: 1.5,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                              size: 11,
                            },
                          },
                        },
                        tooltip: {
                          backgroundColor: 'rgba(51, 51, 51, 0.9)',
                          padding: 12,
                          titleFont: {
                            size: 14,
                            weight: 'bold',
                          },
                          bodyFont: {
                            size: 13,
                          },
                          callbacks: {
                            label: function (context) {
                              const value = context.parsed.y ?? 0;
                              return `${context.dataset.label}: ${value.toFixed(2)} ${locale === 'ar' ? 'ر.س' : 'SAR'}`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function (value) {
                              const numValue = typeof value === 'string' ? parseFloat(value) : value;
                              return (numValue ?? 0).toFixed(0) + (locale === 'ar' ? ' ر.س' : ' SAR');
                            },
                            color: '#666',
                            font: {
                              size: 11,
                            },
                          },
                          grid: {
                            color: 'rgba(232, 212, 176, 0.2)',
                          },
                        },
                        x: {
                          ticks: {
                            color: '#666',
                            font: {
                              size: 10,
                            },
                            maxRotation: 45,
                            minRotation: 45,
                          },
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-deep-charcoal/60">
                    <p>{locale === 'en' ? 'No earnings data available' : 'لا توجد بيانات أرباح متاحة'}</p>
                  </div>
                )}
              </div>

              {/* Code Usage Progress - Modern Design */}
              <div className="bg-white rounded-lg p-4 border border-rich-sand/30 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-deep-charcoal mb-0.5">
                    {locale === 'en' ? 'Code Usage Progress' : 'تقدم استخدام الرمز'}
                  </h3>
                  <p className="text-xs text-deep-charcoal/60">
                    {locale === 'en' ? 'Track your affiliate code performance' : 'تتبع أداء رمز الشريك الخاص بك'}
                  </p>
                </div>

                {/* Main Progress Display */}
                <div className="mb-4">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <div className="text-3xl font-bold text-saudi-green mb-0.5">
                        {earnings.codeUsageCount.toLocaleString('en-US')}
                      </div>
                      <div className="text-xs text-deep-charcoal/70">
                        {locale === 'en' ? 'Total Uses' : 'إجمالي الاستخدامات'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-deep-charcoal/50 mb-0.5">
                        100
                      </div>
                      <div className="text-xs text-deep-charcoal/60">
                        {locale === 'en' ? 'Target' : 'الهدف'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-7 bg-rich-sand/30 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-saudi-green via-emerald-500 to-saudi-green rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{
                        width: `${Math.min(100, (earnings.codeUsageCount / 100) * 100)}%`,
                        backgroundSize: '200% 100%',
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-deep-charcoal z-10 drop-shadow-sm">
                        {Math.min(100, Math.round((earnings.codeUsageCount / 100) * 100))}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-rich-sand/30">
                  <div className="text-center">
                    <div className="text-base font-bold text-deep-charcoal mb-0.5">
                      {earnings.codeUsageCount}
                    </div>
                    <div className="text-xs text-deep-charcoal/60">
                      {locale === 'en' ? 'Current' : 'الحالي'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-saudi-green mb-0.5">
                      {Math.max(0, 100 - earnings.codeUsageCount)}
                    </div>
                    <div className="text-xs text-deep-charcoal/60">
                      {locale === 'en' ? 'Remaining' : 'متبقي'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-deep-charcoal mb-0.5">
                      {earnings.codeUsageCount > 0 ? Math.round((earnings.codeUsageCount / 100) * 100) : 0}%
                    </div>
                    <div className="text-xs text-deep-charcoal/60">
                      {locale === 'en' ? 'Complete' : 'مكتمل'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Affiliate Code Section */}
            <div className="w-full">
              <div className="bg-gradient-to-br from-saudi-green to-emerald-600 rounded-lg p-6 text-white shadow-lg w-full">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <HiDocumentText className="w-5 h-5" />
                  {locale === 'en' ? 'Your Affiliate Code' : 'رمز الشريك الخاص بك'}
                </h3>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <p className="text-sm text-white/90 mb-1">{locale === 'en' ? 'Share this code with sellers' : 'شارك هذا الرمز مع البائعين'}</p>
                  <p className="text-3xl font-bold font-mono">{affiliate.affiliate_code || affiliate.affiliateCode}</p>
                </div>
                <button
                  onClick={() => {
                    const code = affiliate.affiliate_code || affiliate.affiliateCode;
                    navigator.clipboard.writeText(code);
                    toast.success(locale === 'en' ? 'Code copied to clipboard!' : 'تم نسخ الرمز!');
                  }}
                  className="w-full bg-white text-saudi-green py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors cursor-pointer"
                >
                  {locale === 'en' ? 'Copy Code' : 'نسخ الرمز'}
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-deep-charcoal">
                {locale === 'en' ? 'Earnings History' : 'سجل الأرباح'}
              </h3>
              <select
                value={transactionsCurrencyFilter}
                onChange={(e) => {
                  setTransactionsCurrencyFilter(e.target.value);
                  setTransactionsPage(1);
                }}
                className="text-sm px-3 py-1.5 border border-rich-sand rounded-md text-deep-charcoal focus:outline-none focus:ring-2 focus:ring-saudi-green"
              >
                <option value="">{locale === 'en' ? 'All Currencies' : 'جميع العملات'}</option>
                {availableCurrencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
            
            {/* Overall Stats from Transactions API */}
            {transactionsData && (overallStats.totalReferrals > 0 || overallStats.totalSales > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-rich-sand/10 rounded-lg">
                <div className="text-center">
                  <div className="text-xs text-deep-charcoal/60 mb-1">
                    {locale === 'en' ? 'Total Referrals' : 'إجمالي الإحالات'}
                  </div>
                  <div className="text-lg font-semibold text-deep-charcoal">
                    {overallStats.totalReferrals.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-deep-charcoal/60 mb-1">
                    {locale === 'en' ? 'Total Earnings' : 'إجمالي الأرباح'}
                  </div>
                  <div className="text-lg font-semibold text-saudi-green">
                    {overallStats.totalEarnings.toFixed(2)} {locale === 'ar' ? 'ر.س' : 'SAR'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-deep-charcoal/60 mb-1">
                    {locale === 'en' ? 'Total Sales' : 'إجمالي المبيعات'}
                  </div>
                  <div className="text-lg font-semibold text-deep-charcoal">
                    {overallStats.totalSales.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-deep-charcoal/60 mb-1">
                    {locale === 'en' ? 'Commission Rate' : 'معدل العمولة'}
                  </div>
                  <div className="text-lg font-semibold text-deep-charcoal">
                    {overallStats.commissionRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
            
            {isLoadingTransactions ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rich-sand/30">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Date' : 'التاريخ'}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Order Number' : 'رقم الطلب'}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Referred User' : 'المستخدم المشار إليه'}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Commission' : 'العمولة'}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Currency' : 'العملة'}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Commission Rate' : 'معدل العمولة'}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Status' : 'الحالة'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="border-b border-rich-sand/20">
                        <td className="py-3 px-4">
                          <div className="h-4 bg-rich-sand/30 rounded w-24 animate-pulse"></div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 bg-rich-sand/30 rounded w-32 animate-pulse"></div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 bg-rich-sand/30 rounded w-28 animate-pulse"></div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 bg-rich-sand/30 rounded w-20 animate-pulse"></div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 bg-rich-sand/30 rounded w-12 animate-pulse"></div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 bg-rich-sand/30 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-6 bg-rich-sand/30 rounded-full w-20 animate-pulse"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : transactions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-rich-sand/30">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Date' : 'التاريخ'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Order Number' : 'رقم الطلب'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Referred User' : 'المستخدم المشار إليه'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Commission' : 'العمولة'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Commission Rate' : 'معدل العمولة'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Status' : 'الحالة'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => {
                        const normalized = normalizeTransaction(transaction);
                        return (
                          <tr key={normalized.id} className="border-b border-rich-sand/20 hover:bg-rich-sand/5 transition-colors">
                            <td className="py-3 px-4 text-sm text-deep-charcoal">
                              {new Date(normalized.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-3 px-4 text-sm text-deep-charcoal font-mono">
                              {normalized.orderNumber}
                            </td>
                            <td className="py-3 px-4 text-sm text-deep-charcoal">
                              {normalized.referredUserName}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-saudi-green">
                              {normalized.commission.toFixed(2)} {normalized.currency}
                            </td>
                            <td className="py-3 px-4 text-sm text-deep-charcoal/70">
                              {normalized.currency}
                            </td>
                            <td className="py-3 px-4 text-sm text-deep-charcoal/70">
                              {normalized.commissionRate.toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {getTransactionStatusBadge(normalized.status)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {transactionsPagination && transactionsPagination.totalPages > 1 && (
                  <Pagination
                    currentPage={transactionsPagination.currentPage}
                    totalPages={transactionsPagination.totalPages}
                    onPageChange={(page) => {
                      setTransactionsPage(page);
                      // Scroll to top of table when page changes
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                )}
                {/* Transaction Summary */}
                {transactionsPagination && (
                  <div className="mt-4 pt-4 border-t border-rich-sand/30">
                    <p className="text-sm text-deep-charcoal/70 text-center">
                      {locale === 'en' 
                        ? `Showing ${transactions.length} of ${transactionsPagination.totalItems} transactions`
                        : `عرض ${transactions.length} من ${transactionsPagination.totalItems} معاملة`}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-deep-charcoal/70 text-center py-8">
                {locale === 'en' ? 'No earnings yet' : 'لا توجد أرباح بعد'}
              </p>
            )}
          </div>
        )}

        {activeTab === 'cashout' && (
          <div className="space-y-6">
            {/* Request Cashout */}
            <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
              <h3 className="text-lg font-semibold text-deep-charcoal mb-4">
                {locale === 'en' ? 'Request Cashout' : 'طلب سحب'}
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={getAvailableBalanceForCurrency(cashoutCurrency)}
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    placeholder={locale === 'en' ? 'Enter amount' : 'أدخل المبلغ'}
                    className="flex-1 px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green"
                  />
                  <select
                    value={cashoutCurrency}
                    onChange={(e) => {
                      setCashoutCurrency(e.target.value);
                      setCashoutAmount('');
                    }}
                    className="px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green"
                  >
                    {availableCurrencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green"
                  >
                    <option value="Bank Transfer">{locale === 'en' ? 'Bank Transfer' : 'تحويل بنكي'}</option>
                  </select>
                </div>
                {!hasBankDetails && showBankDetailsForm && (
                  <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-deep-charcoal">
                      {locale === 'en' ? 'Bank Details Required' : 'تفاصيل البنك مطلوبة'}
                    </h4>
                    <p className="text-sm text-deep-charcoal/70">
                      {locale === 'en' 
                        ? 'Please provide your bank details for cashout' 
                        : 'يرجى تقديم تفاصيل البنك الخاصة بك للسحب'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-deep-charcoal mb-1">
                          {locale === 'en' ? 'Bank Name' : 'اسم البنك'}
                        </label>
                        <input
                          type="text"
                          value={bankDetailsForm.bankName}
                          onChange={(e) => setBankDetailsForm({...bankDetailsForm, bankName: e.target.value})}
                          className="w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deep-charcoal mb-1">
                          {locale === 'en' ? 'Account Number' : 'رقم الحساب'}
                        </label>
                        <input
                          type="text"
                          value={bankDetailsForm.accountNumber}
                          onChange={(e) => setBankDetailsForm({...bankDetailsForm, accountNumber: e.target.value})}
                          className="w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deep-charcoal mb-1">
                          {locale === 'en' ? 'IBAN (Optional)' : 'رقم الآيبان (اختياري)'}
                        </label>
                        <input
                          type="text"
                          value={bankDetailsForm.iban}
                          onChange={(e) => setBankDetailsForm({...bankDetailsForm, iban: e.target.value})}
                          className="w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-deep-charcoal mb-1">
                          {locale === 'en' ? 'Account Holder Name' : 'اسم صاحب الحساب'}
                        </label>
                        <input
                          type="text"
                          value={bankDetailsForm.accountHolderName}
                          onChange={(e) => setBankDetailsForm({...bankDetailsForm, accountHolderName: e.target.value})}
                          className="w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          // Save bank details first
                          if (!bankDetailsForm.bankName || !bankDetailsForm.accountNumber || !bankDetailsForm.accountHolderName) {
                            toast.error(
                              locale === 'en' ? 'Please fill all required fields' : 'يرجى ملء جميع الحقول المطلوبة'
                            );
                            return;
                          }
                          
                          try {
                            await updateBankDetails({
                              bank_name: bankDetailsForm.bankName,
                              account_number: bankDetailsForm.accountNumber,
                              iban: bankDetailsForm.iban || undefined,
                              account_holder_name: bankDetailsForm.accountHolderName,
                            }).unwrap();
                            
                            toast.success(
                              locale === 'en' ? 'Bank details saved' : 'تم حفظ تفاصيل البنك'
                            );
                            await refetchBankDetails();
                            setShowBankDetailsForm(false);
                            setBankVerificationStep('verify');
                          } catch (error) {
                            handleApiErrorWithToast(error);
                          }
                        }}
                        disabled={isUpdatingBankDetails}
                        className="flex-1 px-4 py-2 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingBankDetails 
                          ? (locale === 'en' ? 'Saving...' : 'جاري الحفظ...')
                          : (locale === 'en' ? 'Save Bank Details' : 'حفظ تفاصيل البنك')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBankDetailsForm(false);
                          setBankDetailsForm({
                            bankName: '',
                            accountNumber: '',
                            iban: '',
                            accountHolderName: '',
                          });
                        }}
                        className="px-4 py-2 border border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 transition-colors"
                      >
                        {locale === 'en' ? 'Cancel' : 'إلغاء'}
                      </button>
                    </div>
                  </div>
                )}
                {hasBankDetails && bankVerificationStep === 'verify' && (
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-deep-charcoal">
                      {locale === 'en' ? 'Verify Bank Details' : 'التحقق من تفاصيل البنك'}
                    </h4>
                    <div className="space-y-2 text-sm text-deep-charcoal/70">
                      <p><strong>{locale === 'en' ? 'Bank Name:' : 'اسم البنك:'}</strong> {bankDetails?.bank_name}</p>
                      <p><strong>{locale === 'en' ? 'Account Number:' : 'رقم الحساب:'}</strong> {bankDetails?.account_number}</p>
                      {bankDetails?.iban && (
                        <p><strong>{locale === 'en' ? 'IBAN:' : 'رقم الآيبان:'}</strong> {bankDetails.iban}</p>
                      )}
                      <p><strong>{locale === 'en' ? 'Account Holder:' : 'صاحب الحساب:'}</strong> {bankDetails?.account_holder_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBankVerificationStep('reference')}
                        className="flex-1 px-4 py-2 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors"
                      >
                        {locale === 'en' ? 'Confirm & Continue' : 'تأكيد والمتابعة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBankVerificationStep(null)}
                        className="px-4 py-2 border border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 transition-colors"
                      >
                        {locale === 'en' ? 'Cancel' : 'إلغاء'}
                      </button>
                    </div>
                  </div>
                )}
                {hasBankDetails && bankVerificationStep === 'reference' && (
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-deep-charcoal">
                      {locale === 'en' ? 'Add Bank Reference' : 'إضافة مرجع البنك'}
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-deep-charcoal mb-1">
                        {locale === 'en' ? 'Bank Reference (Optional)' : 'مرجع البنك (اختياري)'}
                      </label>
                      <input
                        type="text"
                        value={bankReference}
                        onChange={(e) => setBankReference(e.target.value)}
                        placeholder={locale === 'en' ? 'Enter bank reference if any' : 'أدخل مرجع البنك إن وجد'}
                        className="w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBankVerificationStep('verify')}
                        className="px-4 py-2 border border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 transition-colors"
                      >
                        {locale === 'en' ? 'Back' : 'رجوع'}
                      </button>
                    </div>
                  </div>
                )}
                {(!showBankDetailsForm && (!hasBankDetails || bankVerificationStep === 'reference')) && (
                  <button
                    onClick={handleCashoutRequest}
                    disabled={isRequestingCashout || !cashoutAmount}
                    className="w-full px-6 py-2 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequestingCashout
                      ? (locale === 'en' ? 'Submitting...' : 'جاري الإرسال...')
                      : (locale === 'en' ? 'Request Cashout' : 'طلب السحب')}
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium text-deep-charcoal">
                  {locale === 'en' ? 'Available Balance:' : 'الرصيد المتاح:'}
                </p>
                {availableCurrencies.length > 0 ? (
                  <div className="space-y-1 text-sm text-deep-charcoal/70">
                    {availableCurrencies.map(currency => (
                      <p key={currency}>
                        {currency}: {getAvailableBalanceForCurrency(currency).toFixed(2)} {currency}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-deep-charcoal/70">
                    {earnings.availableBalance.toFixed(2)} {locale === 'ar' ? 'ر.س' : 'SAR'}
                  </p>
                )}
                <p className="text-xs text-deep-charcoal/60 mt-2">
                  {locale === 'en' 
                    ? `Minimum cashout amount: ${MIN_CASHOUT_AMOUNT} ${cashoutCurrency}`
                    : `الحد الأدنى لمبلغ السحب: ${MIN_CASHOUT_AMOUNT} ${cashoutCurrency}`}
                </p>
              </div>
            </div>

            {/* Cashout Requests History */}
            <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
              <h3 className="text-lg font-semibold text-deep-charcoal mb-4">
                {locale === 'en' ? 'Cashout Requests' : 'طلبات السحب'}
              </h3>
              {isLoadingPayouts ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-rich-sand/30">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Date' : 'التاريخ'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Amount' : 'المبلغ'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Currency' : 'العملة'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Payment Method' : 'طريقة الدفع'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Status' : 'الحالة'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b border-rich-sand/20">
                          <td className="py-3 px-4">
                            <div className="h-4 bg-rich-sand/30 rounded w-24 animate-pulse"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 bg-rich-sand/30 rounded w-20 animate-pulse"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 bg-rich-sand/30 rounded w-12 animate-pulse"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-4 bg-rich-sand/30 rounded w-28 animate-pulse"></div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="h-6 bg-rich-sand/30 rounded-full w-20 animate-pulse"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : cashoutRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-rich-sand/30">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Date' : 'التاريخ'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Amount' : 'المبلغ'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Currency' : 'العملة'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Payment Method' : 'طريقة الدفع'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Status' : 'الحالة'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashoutRequests.map((request) => {
                        const normalized = normalizeCashoutRequest(request);
                        return (
                          <tr key={normalized.id} className="border-b border-rich-sand/20 hover:bg-rich-sand/5 transition-colors">
                            <td className="py-3 px-4 text-sm text-deep-charcoal">
                              {new Date(normalized.requestedAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-saudi-green">
                              {normalized.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-deep-charcoal">
                              {normalized.currency || 'SAR'}
                            </td>
                            <td className="py-3 px-4 text-sm text-deep-charcoal">
                              {normalized.paymentMethod}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {getStatusBadge(normalized.status)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-deep-charcoal/70 text-center py-8">
                  {locale === 'en' ? 'No cashout requests yet' : 'لا توجد طلبات سحب بعد'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cashout Terms Modal */}
      <TermsModal
        isOpen={showCashoutTermsModal}
        onAccept={() => {
          setCashoutTermsAccepted(true);
          setShowCashoutTermsModal(false);
          // Proceed with cashout after terms acceptance
          submitCashoutRequest();
        }}
        onClose={() => setShowCashoutTermsModal(false)}
        title={locale === 'en' ? 'Affiliate Program Terms' : 'شروط برنامج الشراكة'}
        description={
          locale === 'en'
            ? 'You must accept the Affiliate Program Terms to proceed with cashout'
            : 'يجب عليك قبول شروط برنامج الشراكة للمتابعة مع السحب'
        }
        isAffiliateTerms={true}
        customKeyPoints={
          <ul className='space-y-1.5 text-xs list-disc list-inside text-white/90'>
            <li>
              {locale === 'en'
                ? 'Affiliates earn 25% of the fee received by Dو labb! from each completed sale'
                : 'يكسب الشركاء 25% من الرسوم التي يحصل عليها Dو labb! من كل عملية بيع مكتملة'}
            </li>
            <li>
              {locale === 'en'
                ? 'Commission is earned only after the item is successfully sold and seller completes all required inputs'
                : 'يتم كسب العمولة فقط بعد بيع العنصر بنجاح وإكمال البائع لجميع المدخلات المطلوبة'}
            </li>
            <li>
              {locale === 'en'
                ? 'Dو labb! may set minimum payout thresholds and payment schedules'
                : 'قد تحدد Dو labb! الحد الأدنى للدفع وجداول الدفع'}
            </li>
            <li>
              {locale === 'en'
                ? 'Dو labb! reserves the right to withhold or reverse commissions for refunded, canceled, fraudulent, or disputed transactions'
                : 'تحتفظ Dو labb! بالحق في حجب أو عكس العمولات للمعاملات المستردة أو الملغاة أو الاحتيالية أو المتنازع عليها'}
            </li>
            <li>
              {locale === 'en'
                ? 'Affiliates must promote Dو labb! honestly and comply with all applicable laws'
                : 'يجب على الشركاء الترويج لـ Dو labb! بصدق والامتثال لجميع القوانين المعمول بها'}
            </li>
          </ul>
        }
        customFullTerms={
          <div className='space-y-6'>
            <p className='text-sm text-white/80 mb-6'>
              <strong>{locale === 'en' ? 'Effective Date:' : 'تاريخ السريان:'}</strong> {new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section>
              <h3 className='text-lg font-bold text-white mb-3'>
                {locale === 'en' ? '1. Affiliate Role' : '1. دور الشريك'}
              </h3>
              <p className='text-sm text-white/90 mb-2'>
                {locale === 'en'
                  ? 'Affiliates may promote Dو labb! and encourage individuals to list and sell items on the Dو labb! platform using their unique affiliate link or referral method provided by Dو labb!.'
                  : 'يجوز للشركاء الترويج لـ Dو labb! وتشجيع الأفراد على إدراج وبيع العناصر على منصة Dو labb! باستخدام رابط الشريك الفريد أو طريقة الإحالة المقدمة من Dو labb!.'}
              </p>
            </section>

            <section>
              <h3 className='text-lg font-bold text-white mb-3'>
                {locale === 'en' ? '2. Commission' : '2. العمولة'}
              </h3>
              <ul className='space-y-2 text-sm ml-4 text-white/90'>
                <li>
                  • {locale === 'en'
                    ? 'Affiliates earn 25% of the fee received by Dو labb! from each completed sale generated through their referral.'
                    : 'يكسب الشركاء 25% من الرسوم التي يحصل عليها Dو labb! من كل عملية بيع مكتملة يتم إنشاؤها من خلال إحالتهم.'}
                </li>
                <li>
                  • {locale === 'en'
                    ? 'Example: If an item sells for SAR 1000 and Dو labb!\'s fee is SAR 50, the Affiliate will earn SAR 12.50'
                    : 'مثال: إذا تم بيع عنصر مقابل 1000 ريال سعودي وكانت رسوم Dو labb! 50 ريال سعودي، فسيحصل الشريك على 12.50 ريال سعودي'}
                </li>
                <li>
                  • {locale === 'en'
                    ? 'Commission is earned only after:'
                    : 'يتم كسب العمولة فقط بعد:'}
                  <ul className='ml-4 mt-1 space-y-1'>
                    <li>
                      {locale === 'en'
                        ? 'o The item is successfully sold, and'
                        : 'o بيع العنصر بنجاح، و'}
                    </li>
                    <li>
                      {locale === 'en'
                        ? 'o The seller has completed all required inputs (including delivery and confirmation).'
                        : 'o إكمال البائع لجميع المدخلات المطلوبة (بما في ذلك التسليم والتأكيد).'}
                    </li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h3 className='text-lg font-bold text-white mb-3'>
                {locale === 'en' ? '3. Payments' : '3. المدفوعات'}
              </h3>
              <ul className='space-y-2 text-sm ml-4 text-white/90'>
                <li>
                  • {locale === 'en'
                    ? 'Commissions are calculated and credited according to Dو labb!\'s internal records.'
                    : 'يتم حساب العمولات وإضافتها وفقًا للسجلات الداخلية لـ Dو labb!.'}
                </li>
                <li>
                  • {locale === 'en'
                    ? 'Dو labb! may set minimum payout thresholds, payment schedules, and supported payment methods.'
                    : 'قد تحدد Dو labb! الحد الأدنى للدفع وجداول الدفع وطرق الدفع المدعومة.'}
                </li>
                <li>
                  • {locale === 'en'
                    ? 'Dو labb! reserves the right to withhold or reverse commissions for refunded, canceled, fraudulent, or disputed transactions.'
                    : 'تحتفظ Dو labb! بالحق في حجب أو عكس العمولات للمعاملات المستردة أو الملغاة أو الاحتيالية أو المتنازع عليها.'}
                </li>
              </ul>
            </section>

            <section>
              <h3 className='text-lg font-bold text-white mb-3'>
                {locale === 'en' ? '4. Acceptable Promotion' : '4. الترويج المقبول'}
              </h3>
              <p className='text-sm text-white/90 mb-2'>
                {locale === 'en'
                  ? 'Affiliates agree to:'
                  : 'يوافق الشركاء على:'}
              </p>
              <ul className='space-y-2 text-sm ml-4 text-white/90'>
                <li>
                  • {locale === 'en'
                    ? 'Promote Dو labb! honestly and accurately'
                    : 'الترويج لـ Dو labb! بصدق ودقة'}
                </li>
                <li>
                  • {locale === 'en'
                    ? 'Not make false, misleading, or exaggerated claims'
                    : 'عدم تقديم ادعاءات كاذبة أو مضللة أو مبالغ فيها'}
                </li>
                <li>
                  • {locale === 'en'
                    ? 'Not engage in spam, fake accounts, self-referrals, or deceptive practices'
                    : 'عدم الانخراط في البريد العشوائي أو الحسابات المزيفة أو الإحالات الذاتية أو الممارسات الخادعة'}
                </li>
                <li>
                  • {locale === 'en'
                    ? 'Comply with all applicable laws, regulations, and platform policies (including social media platform rules)'
                    : 'الامتثال لجميع القوانين واللوائح وسياسات المنصة المعمول بها (بما في ذلك قواعد منصات التواصل الاجتماعي)'}
                </li>
              </ul>
            </section>

            <section>
              <h3 className='text-lg font-bold text-white mb-3'>
                {locale === 'en' ? '5. Intellectual Property' : '5. الملكية الفكرية'}
              </h3>
              <p className='text-sm text-white/90'>
                {locale === 'en'
                  ? 'Affiliates may use Dو labb!\'s name and promotional materials only as provided or approved by Dو labb! and solely for promotional purposes.'
                  : 'يجوز للشركاء استخدام اسم Dو labb! والمواد الترويجية فقط كما هو موفر أو معتمد من قبل Dو labb! وحصريًا لأغراض الترويج.'}
              </p>
            </section>

            <section>
              <h3 className='text-lg font-bold text-white mb-3'>
                {locale === 'en' ? '6. Termination' : '6. الإنهاء'}
              </h3>
              <p className='text-sm text-white/90'>
                {locale === 'en'
                  ? 'Dو labb! may suspend or terminate an Affiliate account at any time if these terms are violated or for business, legal, or security reasons. Upon termination, unpaid commissions may be forfeited if earned through prohibited activity.'
                  : 'يجوز لـ Dو labb! تعليق أو إنهاء حساب الشريك في أي وقت إذا تم انتهاك هذه الشروط أو لأسباب تجارية أو قانونية أو أمنية. عند الإنهاء، قد يتم مصادرة العمولات غير المدفوعة إذا تم كسبها من خلال نشاط محظور.'}
              </p>
            </section>

            <section>
              <h3 className='text-lg font-bold text-white mb-3'>
                {locale === 'en' ? '7. Independent Relationship' : '7. العلاقة المستقلة'}
              </h3>
              <p className='text-sm text-white/90'>
                {locale === 'en'
                  ? 'Affiliates act as independent parties. This agreement does not create an employment, partnership, or agency relationship.'
                  : 'يعمل الشركاء كأطراف مستقلة. لا ينشئ هذا الاتفاق علاقة عمل أو شراكة أو وكالة.'}
              </p>
            </section>

            <section>
              <h3 className='text-lg font-bold text-white mb-3'>
                {locale === 'en' ? '8. Changes to Terms' : '8. تغييرات الشروط'}
              </h3>
              <p className='text-sm text-white/90'>
                {locale === 'en'
                  ? 'Dو labb! may update these terms from time to time. Continued participation in the Affiliate Program constitutes acceptance of the updated terms.'
                  : 'قد تقوم Dو labb! بتحديث هذه الشروط من وقت لآخر. استمرار المشاركة في برنامج الشراكة يشكل قبولًا للشروط المحدثة.'}
              </p>
            </section>

            <section>
              <h3 className='text-lg font-bold text-white mb-3'>
                {locale === 'en' ? '9. Governing Law' : '9. القانون الحاكم'}
              </h3>
              <p className='text-sm text-white/90'>
                {locale === 'en'
                  ? 'These terms are governed by Saudi law.'
                  : 'هذه الشروط محكومة بالقانون السعودي.'}
              </p>
            </section>
          </div>
        }
      />
    </div>
  );
}

