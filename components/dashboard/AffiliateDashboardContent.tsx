'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { HiUser, HiCreditCard, HiCurrencyDollar, HiChartBar, HiDocumentText, HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi2';
import { 
  useGetAffiliateTransactionsQuery, 
  useGetPayoutRequestsQuery,
  useRequestCashoutMutation,
  useGetAffiliateProfileQuery,
  useGetEarningsBreakdownQuery
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
  const [transactionsPage, setTransactionsPage] = useState(1);
  const transactionsLimit = 20;
  const [transactionsCurrencyFilter, setTransactionsCurrencyFilter] = useState<string>('');
  const [earningsPeriod, setEarningsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [earningsLimit, setEarningsLimit] = useState(12);
  const [earningsCurrencyFilter, setEarningsCurrencyFilter] = useState<string>('');

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

  const handleCashoutRequest = async () => {
    if (!cashoutAmount || parseFloat(cashoutAmount) <= 0) {
      toast.error(locale === 'en' ? 'Please enter a valid amount' : 'يرجى إدخال مبلغ صحيح');
      return;
    }

    const amount = parseFloat(cashoutAmount);
    const availableBalanceForCurrency = getAvailableBalanceForCurrency(cashoutCurrency);
    
    if (amount > availableBalanceForCurrency) {
      toast.error(
        locale === 'en'
          ? `Insufficient balance. Available balance is ${availableBalanceForCurrency.toFixed(2)} ${cashoutCurrency}`
          : `الرصيد غير كاف. الرصيد المتاح هو ${availableBalanceForCurrency.toFixed(2)} ${cashoutCurrency}`
      );
      return;
    }

    try {
      const result = await requestCashout({
        amount,
        paymentMethod,
        currency: cashoutCurrency,
      }).unwrap();

      if (result.success && result.cashoutRequest) {
        toast.success(
          locale === 'en'
            ? `Cashout request of ${amount.toFixed(2)} ${cashoutCurrency} submitted successfully! Waiting for admin approval.`
            : `تم إرسال طلب السحب بقيمة ${amount.toFixed(2)} ${cashoutCurrency} بنجاح! في انتظار موافقة المسؤول.`
        );
        setCashoutAmount('');
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

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-rich-sand/30">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Overview' : 'نظرة عامة'}
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'earnings'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Earnings' : 'الأرباح'}
          </button>
          <button
            onClick={() => setActiveTab('cashout')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'cashout'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Cashout' : 'السحب'}
          </button>
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
                        {Object.entries(earningsByCurrency).map(([currency, data]) => (
                          <div key={currency} className="flex items-center gap-1">
                            <span className={locale === 'ar' ? 'ml-1' : 'mr-1'}>├─</span>
                            <span>{currency}:</span>
                            <span className="font-semibold">{data.total.toFixed(2)} {currency}</span>
                          </div>
                        ))}
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
                    {Object.entries(earningsByCurrency).map(([currency, data]) => (
                      <div key={currency} className="flex items-center gap-1">
                        <span className={locale === 'ar' ? 'ml-1' : 'mr-1'}>├─</span>
                        <span>{currency}:</span>
                        <span className="font-semibold">{data.pending.toFixed(2)} {currency}</span>
                      </div>
                    ))}
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
                    {Object.entries(earningsByCurrency).map(([currency, data]) => (
                      <div key={currency} className="flex items-center gap-1">
                        <span className={locale === 'ar' ? 'ml-1' : 'mr-1'}>├─</span>
                        <span>{currency}:</span>
                        <span className="font-semibold">{data.paid.toFixed(2)} {currency}</span>
                      </div>
                    ))}
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
                    <option value="Crypto">{locale === 'en' ? 'Crypto' : 'عملة رقمية'}</option>
                  </select>
                </div>
                <button
                  onClick={handleCashoutRequest}
                  disabled={isRequestingCashout || !cashoutAmount}
                  className="w-full px-6 py-2 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequestingCashout
                    ? (locale === 'en' ? 'Submitting...' : 'جاري الإرسال...')
                    : (locale === 'en' ? 'Request Cashout' : 'طلب السحب')}
                </button>
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
    </div>
  );
}

