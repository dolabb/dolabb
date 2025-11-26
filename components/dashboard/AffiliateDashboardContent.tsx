'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { HiUser, HiCreditCard, HiCurrencyDollar, HiChartBar, HiDocumentText, HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi2';
import { 
  useGetAffiliateTransactionsQuery, 
  useGetPayoutRequestsQuery,
  useRequestCashoutMutation 
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
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionsPage, setTransactionsPage] = useState(1);
  const transactionsLimit = 20;

  // API hooks
  const { data: transactionsData, isLoading: isLoadingTransactions, refetch: refetchTransactions } = useGetAffiliateTransactionsQuery(
    { 
      affiliateId: affiliate?.id || '', 
      page: transactionsPage, 
      limit: transactionsLimit 
    },
    { 
      skip: !affiliate?.id || activeTab !== 'earnings' 
    }
  );

  const { data: payoutData, isLoading: isLoadingPayouts } = useGetPayoutRequestsQuery(
    { page: 1, limit: 20 },
    { skip: !affiliate?.id || activeTab !== 'cashout' }
  );

  const [requestCashout, { isLoading: isRequestingCashout }] = useRequestCashoutMutation();

  // Calculate earnings from affiliate data
  const earnings = {
    totalEarnings: affiliate?.totalEarnings || 0,
    totalCommissions: affiliate?.totalCommissions || 0,
    codeUsageCount: affiliate?.codeUsageCount || 0,
    pendingEarnings: affiliate?.pendingEarnings || 0,
    paidEarnings: affiliate?.paidEarnings || 0,
    availableBalance: affiliate?.availableBalance || 0,
  };

  const cashoutRequests = payoutData?.payoutRequests || [];
  const transactions = transactionsData?.transactions || [];
  const transactionsPagination = transactionsData?.pagination;

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
    if (amount > earnings.availableBalance) {
      toast.error(
        locale === 'en'
          ? `Insufficient balance. Available balance is ${earnings.availableBalance.toFixed(2)}`
          : `الرصيد غير كاف. الرصيد المتاح هو ${earnings.availableBalance.toFixed(2)}`
      );
      return;
    }

    try {
      const result = await requestCashout({
        amount,
        paymentMethod,
      }).unwrap();

      if (result.success) {
        toast.success(
          locale === 'en'
            ? 'Cashout request submitted! Waiting for admin approval.'
            : 'تم إرسال طلب السحب! في انتظار موافقة المسؤول.'
        );
        setCashoutAmount('');
        // Refetch payout requests
        window.location.reload();
      }
    } catch (error: any) {
      handleApiErrorWithToast(error);
    }
  };

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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-deep-charcoal/70">
                    {locale === 'en' ? 'Total Earnings' : 'إجمالي الأرباح'}
                  </h3>
                  <HiCurrencyDollar className="w-5 h-5 text-saudi-green" />
                </div>
                <p className="text-2xl font-bold text-deep-charcoal">
                  {earnings.totalEarnings.toFixed(2)} SAR
                </p>
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
                <p className="text-2xl font-bold text-deep-charcoal">
                  {earnings.pendingEarnings.toFixed(2)} SAR
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-deep-charcoal/70">
                    {locale === 'en' ? 'Available Balance' : 'الرصيد المتاح'}
                  </h3>
                  <HiCreditCard className="w-5 h-5 text-saudi-green" />
                </div>
                <p className="text-2xl font-bold text-deep-charcoal">
                  {earnings.availableBalance.toFixed(2)} SAR
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings Breakdown Chart */}
              <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                <h3 className="text-lg font-semibold text-deep-charcoal mb-4">
                  {locale === 'en' ? 'Earnings Breakdown' : 'تفصيل الأرباح'}
                </h3>
                <Bar
                  data={{
                    labels: [
                      locale === 'en' ? 'Total Earnings' : 'إجمالي الأرباح',
                      locale === 'en' ? 'Pending Earnings' : 'الأرباح المعلقة',
                      locale === 'en' ? 'Paid Earnings' : 'الأرباح المدفوعة',
                      locale === 'en' ? 'Available Balance' : 'الرصيد المتاح',
                    ],
                    datasets: [
                      {
                        label: locale === 'en' ? 'Amount (SAR)' : 'المبلغ (ريال)',
                        data: [
                          earnings.totalEarnings,
                          earnings.pendingEarnings,
                          earnings.paidEarnings,
                          earnings.availableBalance,
                        ],
                        backgroundColor: [
                          'rgba(0, 103, 71, 0.8)', // saudi-green
                          'rgba(234, 179, 8, 0.8)', // yellow-500
                          'rgba(16, 185, 129, 0.8)', // green-500
                          'rgba(37, 99, 235, 0.8)', // blue-600
                        ],
                        borderColor: [
                          '#006747', // saudi-green
                          '#eab308', // yellow-500
                          '#10b981', // green-500
                          '#2563eb', // blue-600
                        ],
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
                        display: false,
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
                            return `${context.parsed.y.toFixed(2)} SAR`;
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 50000,
                        ticks: {
                          callback: function (value) {
                            return value.toFixed(0) + ' SAR';
                          },
                          color: '#666',
                          font: {
                            size: 11,
                          },
                          stepSize: 10000,
                        },
                        grid: {
                          color: 'rgba(232, 212, 176, 0.2)',
                        },
                      },
                      x: {
                        ticks: {
                          color: '#666',
                          font: {
                            size: 11,
                          },
                        },
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* Performance Metrics Chart - Gauge Style */}
              <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                <div className="text-center mb-2">
                  <p className="text-xs text-deep-charcoal/60 mb-1">
                    {locale === 'en' ? 'CODE USAGE PROGRESS' : 'تقدم استخدام الرمز'}
                  </p>
                  <h3 className="text-lg font-bold text-deep-charcoal">
                    {locale === 'en' ? 'Code Usage' : 'استخدام الرمز'}
                  </h3>
                </div>
                <div className="flex items-center justify-center py-4">
                  <div style={{ width: '220px', height: '220px', position: 'relative' }}>
                    <Doughnut
                      data={{
                        labels: [
                          locale === 'en' ? 'Used' : 'مستخدم',
                          locale === 'en' ? 'Remaining' : 'متبقي',
                        ],
                        datasets: [
                          {
                            data: [
                              earnings.codeUsageCount,
                              Math.max(0, 100 - earnings.codeUsageCount), // Target of 100
                            ],
                            backgroundColor: [
                              '#006747', // saudi-green
                              '#E8D4B0', // rich-sand
                            ],
                            borderWidth: 0,
                            cutout: '75%',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        rotation: -90,
                        circumference: 180,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            enabled: false,
                          },
                        },
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <div className="text-3xl font-bold text-deep-charcoal mb-1">
                        {earnings.codeUsageCount.toLocaleString('en-US')}
                      </div>
                      <div className="text-xs text-deep-charcoal/60 font-medium">
                        {locale === 'en' ? 'Uses' : 'استخدام'}
                      </div>
                      <div className="mt-2 text-xs text-deep-charcoal/50">
                        {locale === 'en' ? 'Target: 100' : 'الهدف: 100'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-rich-sand/30">
                  <div className="text-center flex-1">
                    <div className="text-xs text-deep-charcoal/60 mb-1">
                      {locale === 'en' ? 'Starting Point' : 'نقطة البداية'}
                    </div>
                    <div className="text-sm font-semibold text-deep-charcoal">0</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-xs text-deep-charcoal/60 mb-1">
                      {locale === 'en' ? 'Target' : 'الهدف'}
                    </div>
                    <div className="text-sm font-semibold text-deep-charcoal">100</div>
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
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
            <h3 className="text-lg font-semibold text-deep-charcoal mb-4">
              {locale === 'en' ? 'Earnings History' : 'سجل الأرباح'}
            </h3>
            {isLoadingTransactions ? (
              <div className="text-center py-8">
                <p className="text-deep-charcoal/70">{locale === 'en' ? 'Loading...' : 'جاري التحميل...'}</p>
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
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-rich-sand/20 hover:bg-rich-sand/5 transition-colors">
                          <td className="py-3 px-4 text-sm text-deep-charcoal">
                            {new Date(transaction.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4 text-sm text-deep-charcoal font-mono">
                            {transaction.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-sm text-deep-charcoal">
                            {transaction.referredUserName}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-saudi-green">
                            {transaction.commission.toFixed(2)} SAR
                          </td>
                          <td className="py-3 px-4 text-sm text-deep-charcoal/70">
                            {transaction.commissionRate}%
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {getStatusBadge(transaction.status)}
                          </td>
                        </tr>
                      ))}
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
                    max={earnings.availableBalance}
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    placeholder={locale === 'en' ? 'Enter amount' : 'أدخل المبلغ'}
                    className="flex-1 px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green"
                  >
                    <option value="Bank Transfer">{locale === 'en' ? 'Bank Transfer' : 'تحويل بنكي'}</option>
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
              <p className="mt-2 text-sm text-deep-charcoal/70">
                {locale === 'en'
                  ? `Available balance: ${earnings.availableBalance.toFixed(2)} SAR`
                  : `الرصيد المتاح: ${earnings.availableBalance.toFixed(2)} ريال`}
              </p>
            </div>

            {/* Cashout Requests History */}
            <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
              <h3 className="text-lg font-semibold text-deep-charcoal mb-4">
                {locale === 'en' ? 'Cashout Requests' : 'طلبات السحب'}
              </h3>
              {isLoadingPayouts ? (
                <div className="text-center py-8">
                  <p className="text-deep-charcoal/70">{locale === 'en' ? 'Loading...' : 'جاري التحميل...'}</p>
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
                          {locale === 'en' ? 'Payment Method' : 'طريقة الدفع'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                          {locale === 'en' ? 'Status' : 'الحالة'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashoutRequests.map((request) => (
                        <tr key={request.id} className="border-b border-rich-sand/20">
                          <td className="py-3 px-4 text-sm text-deep-charcoal">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-deep-charcoal">
                            {request.amount.toFixed(2)} SAR
                          </td>
                          <td className="py-3 px-4 text-sm text-deep-charcoal">
                            {request.paymentMethod}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {getStatusBadge(request.status)}
                          </td>
                        </tr>
                      ))}
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

