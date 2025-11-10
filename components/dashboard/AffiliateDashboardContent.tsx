'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { HiUser, HiCreditCard, HiCurrencyDollar, HiChartBar, HiDocumentText, HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi2';

interface AffiliateDashboardContentProps {
  affiliate: any;
}

export default function AffiliateDashboardContent({ affiliate: initialAffiliate }: AffiliateDashboardContentProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [affiliate, setAffiliate] = useState(initialAffiliate);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    totalCommissions: 0,
    codeUsageCount: 0,
    pendingPayout: 0,
    transactions: [] as any[],
  });
  const [cashoutRequests, setCashoutRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'cashout'>('overview');
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [isRequestingCashout, setIsRequestingCashout] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
    fetchCashoutRequests();
  }, [affiliate?.id]);

  const fetchEarnings = async () => {
    if (!affiliate?.id) return;
    
    try {
      const response = await fetch(`/api/affiliate/earnings?affiliateId=${affiliate.id}`);
      if (response.ok) {
        const data = await response.json();
        setEarnings(data.earnings);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashoutRequests = async () => {
    if (!affiliate?.id) return;
    
    try {
      const response = await fetch(`/api/affiliate/cashout?affiliateId=${affiliate.id}`);
      if (response.ok) {
        const data = await response.json();
        setCashoutRequests(data.cashoutRequests || []);
      }
    } catch (error) {
      console.error('Error fetching cashout requests:', error);
    }
  };

  const handleCashoutRequest = async () => {
    if (!cashoutAmount || parseFloat(cashoutAmount) <= 0) {
      alert(locale === 'en' ? 'Please enter a valid amount' : 'يرجى إدخال مبلغ صحيح');
      return;
    }

    if (parseFloat(cashoutAmount) > earnings.totalEarnings - earnings.pendingPayout) {
      alert(locale === 'en' ? 'Insufficient balance' : 'الرصيد غير كاف');
      return;
    }

    setIsRequestingCashout(true);
    try {
      const response = await fetch('/api/affiliate/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          amount: parseFloat(cashoutAmount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCashoutRequests(prev => [data.cashoutRequest, ...prev]);
        setCashoutAmount('');
        alert(locale === 'en' ? 'Cashout request submitted successfully' : 'تم إرسال طلب السحب بنجاح');
      } else {
        const error = await response.json();
        alert(error.error || (locale === 'en' ? 'Failed to submit cashout request' : 'فشل إرسال طلب السحب'));
      }
    } catch (error) {
      alert(locale === 'en' ? 'An error occurred' : 'حدث خطأ');
    } finally {
      setIsRequestingCashout(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-deep-charcoal">Loading...</div>
      </div>
    );
  }

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
                    {locale === 'en' ? 'Pending Payout' : 'المدفوعات المعلقة'}
                  </h3>
                  <HiClock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-deep-charcoal">
                  {earnings.pendingPayout.toFixed(2)} SAR
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
                  {(earnings.totalEarnings - earnings.pendingPayout).toFixed(2)} SAR
                </p>
              </div>
            </div>

            {/* Profile & Code Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Info */}
              <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
                <h3 className="text-lg font-semibold text-deep-charcoal mb-4 flex items-center gap-2">
                  <HiUser className="w-5 h-5 text-saudi-green" />
                  {locale === 'en' ? 'Profile Information' : 'معلومات الملف الشخصي'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-deep-charcoal/70">{locale === 'en' ? 'Full Name' : 'الاسم الكامل'}</p>
                    <p className="text-deep-charcoal font-medium">{affiliate.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-deep-charcoal/70">{locale === 'en' ? 'Email' : 'البريد الإلكتروني'}</p>
                    <p className="text-deep-charcoal font-medium">{affiliate.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-deep-charcoal/70">{locale === 'en' ? 'Phone' : 'الهاتف'}</p>
                    <p className="text-deep-charcoal font-medium">{affiliate.phone}</p>
                  </div>
                </div>
              </div>

              {/* Affiliate Code */}
              <div className="bg-gradient-to-br from-saudi-green to-emerald-600 rounded-lg p-6 text-white shadow-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <HiDocumentText className="w-5 h-5" />
                  {locale === 'en' ? 'Your Affiliate Code' : 'رمز الشريك الخاص بك'}
                </h3>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <p className="text-sm text-white/90 mb-1">{locale === 'en' ? 'Share this code with sellers' : 'شارك هذا الرمز مع البائعين'}</p>
                  <p className="text-3xl font-bold font-mono">{affiliate.affiliateCode}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(affiliate.affiliateCode);
                    alert(locale === 'en' ? 'Code copied to clipboard!' : 'تم نسخ الرمز!');
                  }}
                  className="w-full bg-white text-saudi-green py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors"
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
            {earnings.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rich-sand/30">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Date' : 'التاريخ'}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Sale ID' : 'معرف البيع'}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-deep-charcoal">
                        {locale === 'en' ? 'Commission' : 'العمولة'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.transactions.map((transaction, index) => (
                      <tr key={index} className="border-b border-rich-sand/20">
                        <td className="py-3 px-4 text-sm text-deep-charcoal">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-deep-charcoal">
                          {transaction.saleId}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-saudi-green">
                          {transaction.commission.toFixed(2)} SAR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <div className="flex gap-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={earnings.totalEarnings - earnings.pendingPayout}
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  placeholder={locale === 'en' ? 'Enter amount' : 'أدخل المبلغ'}
                  className="flex-1 px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green"
                />
                <button
                  onClick={handleCashoutRequest}
                  disabled={isRequestingCashout || !cashoutAmount}
                  className="px-6 py-2 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequestingCashout
                    ? (locale === 'en' ? 'Submitting...' : 'جاري الإرسال...')
                    : (locale === 'en' ? 'Request Cashout' : 'طلب السحب')}
                </button>
              </div>
              <p className="mt-2 text-sm text-deep-charcoal/70">
                {locale === 'en'
                  ? `Available balance: ${(earnings.totalEarnings - earnings.pendingPayout).toFixed(2)} SAR`
                  : `الرصيد المتاح: ${(earnings.totalEarnings - earnings.pendingPayout).toFixed(2)} ريال`}
              </p>
            </div>

            {/* Cashout Requests History */}
            <div className="bg-white rounded-lg p-6 border border-rich-sand/30 shadow-sm">
              <h3 className="text-lg font-semibold text-deep-charcoal mb-4">
                {locale === 'en' ? 'Cashout Requests' : 'طلبات السحب'}
              </h3>
              {cashoutRequests.length > 0 ? (
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

