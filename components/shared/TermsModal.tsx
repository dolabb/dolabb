'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HiDocumentText, HiXMark } from 'react-icons/hi2';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export default function TermsModal({
  isOpen,
  onAccept,
  onClose,
  title,
  description,
}: TermsModalProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [showFullTerms, setShowFullTerms] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAccept = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    onAccept();
    setShowFullTerms(false);
  };

  const handleViewTerms = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowFullTerms(true);
  };

  const handleBack = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setShowFullTerms(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop, not on children
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className='bg-slate-900/20 backdrop-blur pt-40 p-4 fixed inset-0 z-50 grid place-items-center overflow-y-scroll cursor-pointer'
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <motion.div
            initial={{ scale: 0, rotate: '12.5deg' }}
            animate={{ scale: 1, rotate: '0deg' }}
            exit={{ scale: 0, rotate: '0deg' }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
            onClick={e => e.stopPropagation()}
            className={`bg-gradient-to-br from-saudi-green to-emerald-600 text-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[85vh] ${
              showFullTerms ? 'max-w-3xl' : 'max-w-lg'
            } cursor-default relative overflow-hidden`}
          >
            <HiDocumentText className='text-white/10 rotate-12 text-[200px] absolute z-0 -top-16 -left-16' />
            <div className='relative z-10'>
              {!showFullTerms ? (
                // Initial Modal View
                <>
                  <div className='p-6'>
                    <div className='bg-white w-16 h-16 mb-4 rounded-full text-3xl text-saudi-green grid place-items-center mx-auto'>
                      <HiDocumentText />
                    </div>
                    <h3 className='text-2xl font-bold text-center mb-2'>
                      {title ||
                        (locale === 'en' ? 'Terms of Service' : 'شروط الخدمة')}
                    </h3>
                    <p className='text-center mb-4 text-white/90 text-sm'>
                      {description ||
                        (locale === 'en'
                          ? 'Please read and accept our Terms of Service to continue'
                          : 'يرجى قراءة وقبول شروط الخدمة للمتابعة')}
                    </p>

                    <div className='bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm'>
                      <h4 className='font-semibold text-white mb-2 text-sm'>
                        {locale === 'en' ? 'Key Points:' : 'النقاط الرئيسية:'}
                      </h4>
                      <ul className='space-y-1.5 text-xs list-disc list-inside text-white/90'>
                        <li>
                          {locale === 'en'
                            ? 'dalabb is a marketplace platform connecting Buyers and Sellers'
                            : 'dalabb هي منصة سوق تربط المشترين والبائعين'}
                        </li>
                        <li>
                          {locale === 'en'
                            ? 'We are not a party to transactions between Buyers and Sellers'
                            : 'نحن لسنا طرفًا في المعاملات بين المشترين والبائعين'}
                        </li>
                        <li>
                          {locale === 'en'
                            ? 'All sales are final - dalabb does not handle refunds or cancellations'
                            : 'جميع المبيعات نهائية - dalabb لا تتعامل مع الاسترداد أو الإلغاء'}
                        </li>
                        <li>
                          {locale === 'en'
                            ? 'Users are responsible for compliance with all applicable laws'
                            : 'المستخدمون مسؤولون عن الامتثال لجميع القوانين المعمول بها'}
                        </li>
                        <li>
                          {locale === 'en'
                            ? 'Disputes must be resolved directly between Buyers and Sellers first'
                            : 'يجب حل النزاعات مباشرة بين المشترين والبائعين أولاً'}
                        </li>
                      </ul>
                    </div>

                    <p className='text-xs text-white/80 mb-6 text-center'>
                      {locale === 'en'
                        ? 'By clicking "Accept", you acknowledge that you have read, understood, and agree to be bound by our Terms of Service and all related policies.'
                        : 'بالنقر فوق "قبول"، فإنك تقر بأنك قد قرأت وفهمت وتوافق على الالتزام بشروط الخدمة وجميع السياسات ذات الصلة.'}
                    </p>

                    <div className='flex gap-2'>
                      <button
                        type='button'
                        onClick={handleViewTerms}
                        className='bg-transparent hover:bg-white/10 transition-colors text-white font-semibold flex-1 py-2.5 rounded-lg border border-white/30'
                      >
                        {locale === 'en'
                          ? 'View Full Terms'
                          : 'عرض الشروط الكاملة'}
                      </button>
                      <button
                        type='button'
                        onClick={handleAccept}
                        className='bg-white hover:opacity-90 transition-opacity text-saudi-green font-semibold flex-1 py-2.5 rounded-lg'
                      >
                        {locale === 'en' ? 'Accept' : 'قبول'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                // Full Terms View
                <>
                  <div className='p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <h2 className='text-2xl font-bold text-white font-display'>
                        {locale === 'en' ? 'Terms of Service' : 'شروط الخدمة'}
                      </h2>
                      <button
                        type='button'
                        onClick={handleBack}
                        className='p-2 hover:bg-white/10 rounded-lg transition-colors'
                      >
                        <HiXMark className='w-5 h-5 text-white' />
                      </button>
                    </div>

                    <div className='flex-1 overflow-y-auto max-h-[60vh]'>
                      <div className='prose prose-sm max-w-none text-white/90'>
                        <p className='text-sm text-white/80 mb-6'>
                          <strong>Effective Date:</strong> 1 October 2025
                        </p>

                        <p className='mb-6 text-white/90'>
                          These Terms of Use (&quot;Terms&quot;) form a binding
                          agreement between dalabb (&quot;Platform,&quot;
                          &quot;we,&quot; &quot;our&quot;), a Saudi-registered
                          company operating an online marketplace; Buyers,
                          individuals who register to purchase items; and
                          Sellers, individuals or entities who register to sell
                          items.
                        </p>

                        <p className='mb-6 text-white/90'>
                          By registering as a Buyer or Seller and using the
                          Platform, you agree to these Terms.
                        </p>

                        <div className='space-y-6'>
                          <section>
                            <h3 className='text-lg font-bold text-white mb-3'>
                              1. Our Role as the Platform
                            </h3>
                            <ul className='space-y-2 text-sm ml-4 text-white/90'>
                              <li>
                                • dalabb is an online marketplace connecting
                                Buyers and Sellers.
                              </li>
                              <li>
                                • We are not a party to any transaction between
                                Buyers and Sellers.
                              </li>
                              <li>
                                • We do not own, control, inspect, guarantee, or
                                warrant any product listed.
                              </li>
                              <li>
                                • All responsibility for products, listings, and
                                transactions lies solely with the Seller.
                              </li>
                            </ul>
                          </section>

                          <section>
                            <h3 className='text-lg font-bold text-white mb-3'>
                              2. Buyer Terms & Conditions
                            </h3>
                            <div className='ml-4 space-y-3'>
                              <div>
                                <h4 className='font-semibold mb-1 text-white'>
                                  1. Responsibility
                                </h4>
                                <ul className='text-sm space-y-1 ml-4 text-white/90'>
                                  <li>• Purchases are at your own risk.</li>
                                  <li>
                                    • dalabb does not guarantee authenticity,
                                    quality, condition, or legality of items.
                                  </li>
                                </ul>
                              </div>
                              <div>
                                <h4 className='font-semibold mb-1 text-white'>
                                  2. Final Sales
                                </h4>
                                <ul className='text-sm space-y-1 ml-4 text-white/90'>
                                  <li>
                                    • All sales are final. dalabb does not
                                    handle refunds or cancellations.
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </section>

                          <section>
                            <h3 className='text-lg font-bold text-white mb-3'>
                              3. Seller Terms & Conditions
                            </h3>
                            <ul className='space-y-2 text-sm ml-4 text-white/90'>
                              <li>
                                • Sellers must be 18+ and have full legal
                                capacity.
                              </li>
                              <li>
                                • Listings must be truthful, accurate, and
                                include clear photos.
                              </li>
                              <li>
                                • Sellers are fully responsible for compliance
                                with all applicable laws.
                              </li>
                            </ul>
                          </section>

                          <section>
                            <h3 className='text-lg font-bold text-white mb-3'>
                              4. Payments & Financial Terms
                            </h3>
                            <ul className='space-y-2 text-sm ml-4 text-white/90'>
                              <li>
                                • All payments are processed through secure,
                                approved third-party providers.
                              </li>
                              <li>
                                • dalabb is not a party to transactions and
                                cannot refund, reverse, or reimburse payments.
                              </li>
                            </ul>
                          </section>

                          <section>
                            <h3 className='text-lg font-bold text-white mb-3'>
                              5. Dispute Resolution
                            </h3>
                            <ul className='space-y-2 text-sm ml-4 text-white/90'>
                              <li>
                                • Disputes must first be raised directly with
                                the other party.
                              </li>
                              <li>
                                • If unresolved, disputes may be escalated to
                                dalabb. Response within 30 days.
                              </li>
                              <li>
                                • dalabb cannot provide monetary reimbursement.
                              </li>
                            </ul>
                          </section>

                          <section>
                            <h3 className='text-lg font-bold text-white mb-3'>
                              6. Governing Law & Jurisdiction
                            </h3>
                            <ul className='space-y-2 text-sm ml-4 text-white/90'>
                              <li>
                                • These Terms are governed by Saudi Arabian law.
                              </li>
                              <li>
                                • The courts of Riyadh, Saudi Arabia have
                                exclusive jurisdiction.
                              </li>
                            </ul>
                          </section>
                        </div>

                        <div className='mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm'>
                          <p className='text-sm mb-2 text-white'>
                            <strong>Full Terms of Service:</strong>
                          </p>
                          <Link
                            href={`/${locale}/terms`}
                            target='_blank'
                            className='text-white hover:underline text-sm'
                          >
                            {locale === 'en'
                              ? 'View complete Terms of Service page'
                              : 'عرض صفحة شروط الخدمة الكاملة'}
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className='flex gap-2 mt-4'>
                      <button
                        type='button'
                        onClick={handleBack}
                        className='bg-transparent hover:bg-white/10 transition-colors text-white font-semibold flex-1 py-2.5 rounded-lg border border-white/30'
                      >
                        {locale === 'en' ? 'Back' : 'رجوع'}
                      </button>
                      <button
                        type='button'
                        onClick={handleAccept}
                        className='bg-white hover:opacity-90 transition-opacity text-saudi-green font-semibold flex-1 py-2.5 rounded-lg'
                      >
                        {locale === 'en' ? 'Accept' : 'قبول'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
