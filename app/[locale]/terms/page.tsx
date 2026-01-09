import {
  HiDocumentText,
  HiShieldCheck,
  HiUserGroup,
  HiShoppingBag,
  HiCreditCard,
  HiChartBar,
  HiExclamationTriangle,
  HiCake,
  HiXCircle,
  HiSparkles,
  HiArrowUturnLeft,
  HiGlobeEuropeAfrica,
} from 'react-icons/hi2';

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = locale === 'ar';

  return (
    <div className='min-h-screen bg-gradient-to-br from-off-white via-white to-off-white' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-saudi-green to-emerald-600 mb-6 shadow-lg'>
            <HiDocumentText className='w-10 h-10 text-white' />
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-deep-charcoal mb-4 font-display'>
            {locale === 'en' ? 'Terms of Service' : 'شروط الخدمة'}
          </h1>
          <div className='h-1.5 w-32 bg-gradient-to-r from-saudi-green to-emerald-500 rounded-full mx-auto mb-4'></div>
          <p className='text-deep-charcoal/70 text-sm'>
            <strong>Effective Date:</strong> 1 October 2025
          </p>
        </div>

        {/* Content */}
        <div className='space-y-6'>
          {/* Introduction Card */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-start gap-4 mb-6'>
              <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-saudi-green/10 to-emerald-500/10 flex items-center justify-center'>
                <HiShieldCheck className='w-6 h-6 text-saudi-green' />
              </div>
              <div className='flex-1'>
                <h2 className='text-2xl md:text-3xl font-bold text-deep-charcoal mb-4 font-display'>
                  dوُlabb! Terms of Use
                </h2>
                <p className='text-deep-charcoal leading-relaxed mb-4'>
                  These Terms of Use ("Terms") form a binding agreement between:
                </p>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-saudi-green/5 to-emerald-500/5 border border-saudi-green/10'>
                    <div className='flex-shrink-0 w-2 h-2 rounded-full bg-saudi-green mt-2'></div>
                    <p className='text-deep-charcoal'>
                      <strong>dوُlabb!</strong> ("Platform," "we," "our"), a
                      Registered company operating an online marketplace;
                    </p>
                  </div>
                  <div className='flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/30'>
                    <div className='flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2'></div>
                    <p className='text-deep-charcoal'>
                      <strong>Buyers</strong>, individuals who register to purchase items;
                    </p>
                  </div>
                  <div className='flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200/30'>
                    <div className='flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-2'></div>
                    <p className='text-deep-charcoal'>
                      <strong>Sellers</strong>, individuals or entities who register to sell items.
                    </p>
                  </div>
                </div>
                <p className='text-deep-charcoal leading-relaxed mt-6 p-4 bg-saudi-green/5 rounded-lg border-l-4 border-saudi-green'>
                  By registering as a Buyer or Seller and using the Platform, you agree to these Terms.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-saudi-green to-emerald-600 flex items-center justify-center shadow-md'>
                <HiShieldCheck className='w-7 h-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-deep-charcoal font-display'>
                1. Our Role as the Platform
              </h3>
            </div>
            <div className='space-y-3 text-deep-charcoal'>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-saudi-green/5 transition-colors'>
                <span className='text-saudi-green font-bold mt-0.5'>•</span>
                <p>dوُlabb! is an online marketplace connecting Buyers and Sellers.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-saudi-green/5 transition-colors'>
                <span className='text-saudi-green font-bold mt-0.5'>•</span>
                <p>We are not a party to any transaction between Buyers and Sellers.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-saudi-green/5 transition-colors'>
                <span className='text-saudi-green font-bold mt-0.5'>•</span>
                <p>We do not own, control, inspect, guarantee, or warrant any product listed.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-saudi-green/5 transition-colors'>
                <span className='text-saudi-green font-bold mt-0.5'>•</span>
                <p>All responsibility for products, listings, and transactions lies solely with the Seller.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-saudi-green/5 transition-colors'>
                <span className='text-saudi-green font-bold mt-0.5'>•</span>
                <p>Buyers and Sellers understand they are contracting directly with each other, and dوُlabb! is not a participant in the sale.</p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md'>
                <HiShoppingBag className='w-7 h-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-deep-charcoal font-display'>
                2. Buyer Terms & Conditions
              </h3>
            </div>
            
            <div className='space-y-6'>
              <div className='p-5 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-blue-500'></span>
                  1. Responsibility
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-blue-500 mt-1'>•</span>
                    <span>Purchases are at your own risk.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-blue-500 mt-1'>•</span>
                    <span>dوُlabb! does not guarantee authenticity, quality, condition, or legality of items.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-blue-500 mt-1'>•</span>
                    <span>Verify all details with the Seller before purchasing.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-orange-500'></span>
                  2. Final Sales
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-orange-500 mt-1'>•</span>
                    <span>All sales are final. dوُlabb! does not handle refunds or cancellations.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-orange-500 mt-1'>•</span>
                    <span>If a Seller offers a return policy, you must confirm and agree directly with the Seller.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-green-500'></span>
                  3. Payments
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-green-500 mt-1'>•</span>
                    <span>Provide accurate and authorized payment information.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-green-500 mt-1'>•</span>
                    <span>You are responsible for all charges under your account.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-green-500 mt-1'>•</span>
                    <span>Buyers pay shipping fees unless otherwise agreed with the Seller.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-green-500 mt-1'>•</span>
                    <span>Payment is complete only when confirmed by the payment processor.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-purple-500'></span>
                  4. Shipping
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-purple-500 mt-1'>•</span>
                    <span>Buyers are responsible for agreeing shipping terms with the Seller.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-purple-500 mt-1'>•</span>
                    <span>dوُlabb! is not responsible for lost, damaged, or defective items.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-red-500'></span>
                  5. Disputes
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-red-500 mt-1'>•</span>
                    <span>Contact the Seller first to resolve disputes.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-red-500 mt-1'>•</span>
                    <span>If unresolved, you may escalate to dوُlabb! for review. Response within 30 days.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-red-500 mt-1'>•</span>
                    <span>dوُlabb! cannot provide reimbursement. Maximum action is suspending or closing the Seller's account.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md'>
                <HiUserGroup className='w-7 h-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-deep-charcoal font-display'>
                3. Seller Terms & Conditions
              </h3>
            </div>
            
            <div className='space-y-4'>
              <div className='p-5 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3'>1. Eligibility & Registration</h4>
                <ul className='space-y-2 text-deep-charcoal ml-4'>
                  <li>• Sellers must be 18+ and have full legal capacity.</li>
                  <li>• Provide valid, accurate registration details and legal documents.</li>
                  <li>• Represent and warrant that all submitted documents are valid and legally binding.</li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100/50 border border-indigo-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3'>2. Compliance with Laws</h4>
                <ul className='space-y-2 text-deep-charcoal ml-4'>
                  <li>• Sellers are fully responsible for compliance with all applicable laws in:</li>
                  <li className='ml-4'>- Kingdom of Saudi Arabia</li>
                  <li className='ml-4'>- Country of operation or shipment</li>
                  <li className='ml-4'>- Country of delivery</li>
                  <li>• dوُlabb! is not liable for Sellers' legal or regulatory failures.</li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-pink-50 to-pink-100/50 border border-pink-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3'>3. Listings</h4>
                <ul className='space-y-2 text-deep-charcoal ml-4'>
                  <li>• Listings must be truthful, accurate, and include clear photos.</li>
                  <li>• False or misleading listings may result in suspension or termination.</li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-teal-50 to-teal-100/50 border border-teal-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3'>4. Pricing & Payments</h4>
                <ul className='space-y-2 text-deep-charcoal ml-4'>
                  <li>• Sellers set their own prices but must disclose additional charges (e.g., shipping).</li>
                  <li>• dوُlabb! may charge a platform fee, deducted from the final sale price.</li>
                  <li>• Payments follow the Platform's payout schedule and system.</li>
                  <li>• Sellers are responsible for correct payout information and compliance with local financial regulations.</li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-cyan-50 to-cyan-100/50 border border-cyan-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3'>5. Shipping & Fulfillment</h4>
                <ul className='space-y-2 text-deep-charcoal ml-4'>
                  <li>• Ship items within agreed timeframe and provide tracking.</li>
                  <li>• Delays or failure to ship may result in penalties or account suspension.</li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3'>6. Returns & Refunds</h4>
                <ul className='space-y-2 text-deep-charcoal ml-4'>
                  <li>• Sellers must handle returns/refunds according to their own policy and applicable law.</li>
                  <li>• dوُlabb! does not process returns or refunds.</li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-gradient-to-r from-rose-50 to-rose-100/50 border border-rose-200/30'>
                <h4 className='font-semibold text-deep-charcoal mb-3'>7. Prohibited Items</h4>
                <ul className='space-y-2 text-deep-charcoal ml-4'>
                  <li>• No illegal, counterfeit, or restricted items.</li>
                  <li>• Violations may lead to immediate suspension or termination.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md'>
                <HiCreditCard className='w-7 h-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-deep-charcoal font-display'>
                4. Payments & Financial Terms
              </h3>
            </div>
            <div className='space-y-3 text-deep-charcoal'>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors'>
                <span className='text-green-500 font-bold mt-0.5'>•</span>
                <p>All payments are processed through secure, approved third-party providers.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors'>
                <span className='text-green-500 font-bold mt-0.5'>•</span>
                <p>Buyers and Sellers are responsible for fees, charges, and currency conversion costs.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors'>
                <span className='text-green-500 font-bold mt-0.5'>•</span>
                <p>Payment completion is confirmed by the payment processor.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors'>
                <span className='text-green-500 font-bold mt-0.5'>•</span>
                <p>dوُlabb! is not responsible for payment disputes beyond account review.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors'>
                <span className='text-green-500 font-bold mt-0.5'>•</span>
                <p>Buyers and Sellers acknowledge that dوُlabb! is not a party to transactions and cannot refund, reverse, or reimburse payments.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors'>
                <span className='text-green-500 font-bold mt-0.5'>•</span>
                <p>Sellers agree that platform fees and any applicable taxes will be handled according to the payout system.</p>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md'>
                <HiChartBar className='w-7 h-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-deep-charcoal font-display'>
                5. Dispute Resolution
              </h3>
            </div>
            <div className='space-y-3 text-deep-charcoal'>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors'>
                <span className='text-orange-500 font-bold mt-0.5'>•</span>
                <p>Disputes between Buyers and Sellers must first be raised directly with the other party.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors'>
                <span className='text-orange-500 font-bold mt-0.5'>•</span>
                <p>If unresolved, the dispute may be escalated to dوُlabb!. Response within 30 days.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors'>
                <span className='text-orange-500 font-bold mt-0.5'>•</span>
                <p>dوُlabb! is not a party to disputes and cannot provide monetary reimbursement. Maximum action is suspension or closure of an account.</p>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md'>
                <HiGlobeEuropeAfrica className='w-7 h-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-deep-charcoal font-display'>
                6. Governing Law & Jurisdiction
              </h3>
            </div>
            <div className='space-y-3 text-deep-charcoal'>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors'>
                <span className='text-indigo-500 font-bold mt-0.5'>•</span>
                <p>These Terms are governed by Saudi Arabian law.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors'>
                <span className='text-indigo-500 font-bold mt-0.5'>•</span>
                <p>The courts of Riyadh, Saudi Arabia have exclusive jurisdiction.</p>
              </div>
              <div className='flex items-start gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors'>
                <span className='text-indigo-500 font-bold mt-0.5'>•</span>
                <p>Sellers must comply with local laws of their country and country of delivery.</p>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md'>
                <HiExclamationTriangle className='w-7 h-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-deep-charcoal font-display'>
                7. Disclaimer of Warranties
              </h3>
            </div>
            <p className='text-deep-charcoal mb-4 p-4 bg-red-50 rounded-lg border-l-4 border-red-500'>Platform provided "as is" and "as available."</p>
            <p className='text-deep-charcoal mb-4 font-semibold'>No warranties or guarantees regarding:</p>
            <ul className='space-y-2 text-deep-charcoal ml-4'>
              <li className='flex items-start gap-2'>
                <span className='text-red-500 mt-1'>•</span>
                <span>Platform operation</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-red-500 mt-1'>•</span>
                <span>Listings, quality, authenticity, or legality of items</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-red-500 mt-1'>•</span>
                <span>Conduct of Buyers or Sellers</span>
              </li>
            </ul>
          </div>

          {/* Section 8 */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md'>
                <HiDocumentText className='w-7 h-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-deep-charcoal font-display'>
                8. Additional Policies Integration
              </h3>
            </div>
            <p className='text-deep-charcoal mb-4'>
              By using dوُlabb!, users also agree to:
            </p>
            <div className='grid md:grid-cols-2 gap-3'>
              <div className='p-4 rounded-lg bg-teal-50 border border-teal-200/30'>
                <p className='text-deep-charcoal'><strong>Privacy Policy</strong> - data collection and processing rules</p>
              </div>
              <div className='p-4 rounded-lg bg-teal-50 border border-teal-200/30'>
                <p className='text-deep-charcoal'><strong>Cookie Policy</strong> - website cookie use</p>
              </div>
              <div className='p-4 rounded-lg bg-teal-50 border border-teal-200/30'>
                <p className='text-deep-charcoal'><strong>Acceptable Use Policy</strong> - rules for platform behavior</p>
              </div>
              <div className='p-4 rounded-lg bg-teal-50 border border-teal-200/30'>
                <p className='text-deep-charcoal'><strong>Intellectual Property & Counterfeit Policy</strong> - prohibited listings and IP compliance</p>
              </div>
              <div className='p-4 rounded-lg bg-teal-50 border border-teal-200/30'>
                <p className='text-deep-charcoal'><strong>Community Guidelines</strong> - standards for interactions</p>
              </div>
              <div className='p-4 rounded-lg bg-teal-50 border border-teal-200/30'>
                <p className='text-deep-charcoal'><strong>Returns & Refunds Disclaimer</strong> - no platform-managed refunds</p>
              </div>
            </div>
          </div>

          {/* Privacy Policy Section */}
          <div className='bg-gradient-to-br from-white to-saudi-green/5 rounded-2xl shadow-lg border-2 border-saudi-green/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-saudi-green to-emerald-600 flex items-center justify-center shadow-md'>
                <HiShieldCheck className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl md:text-3xl font-bold text-deep-charcoal font-display'>
                  dوُlabb! Privacy Policy
                </h2>
                <p className='text-sm text-deep-charcoal/70 mt-1'>
                  <strong>Effective Date:</strong> 1 October 2025
                </p>
              </div>
            </div>
            <p className='text-deep-charcoal mb-6 p-4 bg-white/60 rounded-lg'>
              This Privacy Policy ("Policy") explains how dوُlabb! ("we," "our," "Platform") collects, processes, and protects personal data of Buyers and Sellers ("users," "you"). By using the Platform, you agree to this Policy.
            </p>

            <div className='space-y-5'>
              <div className='p-5 rounded-xl bg-white/60 border border-saudi-green/20'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-saudi-green'></span>
                  1. Role of dوُlabb!
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>dوُlabb! collects and processes data necessary to operate the Platform.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>dوُlabb! is not responsible for personal information exchanged directly between Buyers and Sellers. Such exchanges occur at the parties' own risk.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-white/60 border border-saudi-green/20'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-saudi-green'></span>
                  2. Information We Collect
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span><strong>Account Information:</strong> Name, email, phone number, password, profile details.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span><strong>Payment Data:</strong> Billing details, bank/payment credentials (processed through secure third parties).</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span><strong>Transaction Data:</strong> Purchase and sales history, shipping details.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span><strong>Device Data:</strong> IP address, browser, operating system, device identifiers.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span><strong>Communications:</strong> Messages exchanged with dوُlabb! support.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-white/60 border border-saudi-green/20'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-saudi-green'></span>
                  3. How We Use Your Information
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>To provide and operate the Platform.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>To process payments and facilitate transactions.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>To prevent fraud and ensure compliance with laws.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>To communicate with you regarding your account and activity.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>To improve Platform functionality and security.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-white/60 border border-saudi-green/20'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-saudi-green'></span>
                  4. User Rights
                </h4>
                <p className='text-deep-charcoal mb-3 font-semibold'>You have the right to:</p>
                <ul className='space-y-2 text-deep-charcoal ml-6 mb-4'>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>Access your personal data.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>Correct inaccurate information.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>Erase your data (subject to legal obligations).</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>Restrict processing of your data.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>Withdraw consent where processing is based on consent.</span>
                  </li>
                </ul>
                <p className='text-deep-charcoal p-3 bg-saudi-green/10 rounded-lg'>
                  Requests may be submitted to{' '}
                  <a href='mailto:contact@dolabb.com' className='text-saudi-green hover:underline font-semibold'>
                    contact@dolabb.com
                  </a>
                  .
                </p>
              </div>

              <div className='p-5 rounded-xl bg-white/60 border border-saudi-green/20'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-saudi-green'></span>
                  5. Data Security & Retention
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>We use technical and organizational measures to protect personal data.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>Data is retained only as long as necessary for operational, regulatory, or legal reasons, after which it is securely deleted.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-white/60 border border-saudi-green/20'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-saudi-green'></span>
                  6. Sharing of Information
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>We may share data with service providers (e.g., payment processors, hosting providers) to operate the Platform.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>We may disclose information if required by law or to protect our legal rights.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>dوُlabb! is not responsible for information exchanged directly between Buyers and Sellers.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-white/60 border border-saudi-green/20'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-saudi-green'></span>
                  7. GCC Users
                </h4>
                <ul className='space-y-2 text-deep-charcoal ml-6'>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>The Platform is operated under Saudi law.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>By using dوُlabb!, you acknowledge and agree that your personal data is collected, processed, and stored in accordance with Saudi Arabian law, even if you are located in another GCC country.</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <span className='text-saudi-green mt-1'>•</span>
                    <span>Sellers remain responsible for compliance with the data protection laws of their country of operation or delivery.</span>
                  </li>
                </ul>
              </div>

              <div className='p-5 rounded-xl bg-white/60 border border-saudi-green/20'>
                <h4 className='font-semibold text-deep-charcoal mb-3 flex items-center gap-2'>
                  <span className='w-2 h-2 rounded-full bg-saudi-green'></span>
                  8. Governing Law
                </h4>
                <p className='text-deep-charcoal'>
                  This Policy is governed by the laws of the Kingdom of Saudi Arabia. Any disputes relating to this Policy shall be subject to the exclusive jurisdiction of the courts of Riyadh, Saudi Arabia.
                </p>
              </div>
            </div>
          </div>

          {/* Cookie Policy */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md'>
                <HiCake className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-deep-charcoal font-display'>
                  Cookie Policy (Website)
                </h2>
                <p className='text-sm text-deep-charcoal/70 mt-1'>
                  <strong>Effective Date:</strong> 1 October 2025
                </p>
              </div>
            </div>
            <p className='text-deep-charcoal mb-6 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500'>
              dوُlabb! uses cookies and similar technologies to enhance your experience on our website. By using our website, you consent to the use of cookies as described below.
            </p>

            <div className='p-5 rounded-xl bg-amber-50 border border-amber-200/30 mb-4'>
              <h4 className='font-semibold text-deep-charcoal mb-3'>What Cookies We Use:</h4>
              <ul className='space-y-2 text-deep-charcoal ml-4'>
                <li className='flex items-start gap-2'>
                  <span className='text-amber-600 mt-1'>•</span>
                  <span><strong>Essential Cookies:</strong> Required for the website to function.</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-amber-600 mt-1'>•</span>
                  <span><strong>Analytics Cookies:</strong> Help us understand how users interact with our website.</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-amber-600 mt-1'>•</span>
                  <span><strong>Advertising/Marketing Cookies:</strong> Optional, used to personalize ads.</span>
                </li>
              </ul>
            </div>

            <div className='p-5 rounded-xl bg-amber-50 border border-amber-200/30'>
              <h4 className='font-semibold text-deep-charcoal mb-3'>Managing Cookies:</h4>
              <p className='text-deep-charcoal'>
                You can disable cookies through your browser settings, but some features of the website may not function correctly if cookies are disabled.
              </p>
            </div>
          </div>

          {/* Acceptable Use Policy */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md'>
                <HiXCircle className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-deep-charcoal font-display'>
                  Acceptable Use Policy (AUP)
                </h2>
                <p className='text-sm text-deep-charcoal/70 mt-1'>
                  <strong>Effective Date:</strong> 1 October 2025
                </p>
              </div>
            </div>
            <p className='text-deep-charcoal mb-6 p-4 bg-red-50 rounded-lg border-l-4 border-red-500'>
              All users of dوُlabb! agree to use the Platform responsibly. The following activities are strictly prohibited:
            </p>
            <ol className='list-decimal list-inside space-y-3 text-deep-charcoal ml-4 p-5 bg-red-50 rounded-lg'>
              <li>Using the Platform to engage in illegal activity.</li>
              <li>Listing counterfeit, stolen, or prohibited items.</li>
              <li>Sending spam, unsolicited messages, or malware.</li>
              <li>Impersonating another person or entity.</li>
              <li>Attempting to disrupt, hack, or gain unauthorized access to the Platform.</li>
            </ol>
            <p className='text-deep-charcoal mt-4 p-4 bg-red-100/50 rounded-lg font-semibold'>
              Violation may result in account suspension, removal of listings, or permanent termination.
            </p>
          </div>

          {/* Intellectual Property Policy */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md'>
                <HiSparkles className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-deep-charcoal font-display'>
                  Intellectual Property & Counterfeit Policy
                </h2>
                <p className='text-sm text-deep-charcoal/70 mt-1'>
                  <strong>Effective Date:</strong> 1 October 2025
                </p>
              </div>
            </div>
            <p className='text-deep-charcoal mb-6 p-4 bg-violet-50 rounded-lg border-l-4 border-violet-500'>
              dوُlabb! respects intellectual property rights and expects all users to do the same.
            </p>

            <div className='p-5 rounded-xl bg-violet-50 border border-violet-200/30 mb-4'>
              <h4 className='font-semibold text-deep-charcoal mb-3'>Sellers Must:</h4>
              <ul className='space-y-2 text-deep-charcoal ml-4'>
                <li className='flex items-start gap-2'>
                  <span className='text-violet-600 mt-1'>•</span>
                  <span>Only list items they legally own or are authorized to sell.</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-violet-600 mt-1'>•</span>
                  <span>Avoid infringing trademarks, copyrights, or patents.</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-violet-600 mt-1'>•</span>
                  <span>Immediately remove items if an IP complaint is raised.</span>
                </li>
              </ul>
            </div>

            <div className='p-5 rounded-xl bg-violet-50 border border-violet-200/30'>
              <h4 className='font-semibold text-deep-charcoal mb-3'>Platform Rights:</h4>
              <ul className='space-y-2 text-deep-charcoal ml-4'>
                <li className='flex items-start gap-2'>
                  <span className='text-violet-600 mt-1'>•</span>
                  <span>dوُlabb! may remove listings or suspend accounts for IP violations.</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-violet-600 mt-1'>•</span>
                  <span>Users may submit a takedown request if they believe their IP rights are infringed.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Returns & Refunds Disclaimer */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md'>
                <HiArrowUturnLeft className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-deep-charcoal font-display'>
                  Returns & Refunds Disclaimer
                </h2>
                <p className='text-sm text-deep-charcoal/70 mt-1'>
                  <strong>Effective Date:</strong> 1 October 2025
                </p>
              </div>
            </div>
            <div className='space-y-3 text-deep-charcoal'>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200/30'>
                <span className='text-orange-500 font-bold mt-0.5'>•</span>
                <p>dوُlabb! does not handle refunds, cancellations, or returns.</p>
              </div>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200/30'>
                <span className='text-orange-500 font-bold mt-0.5'>•</span>
                <p>Buyers must confirm any return policy directly with Sellers before purchase.</p>
              </div>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200/30'>
                <span className='text-orange-500 font-bold mt-0.5'>•</span>
                <p>Sellers are responsible for processing returns in accordance with applicable local laws.</p>
              </div>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200/30'>
                <span className='text-orange-500 font-bold mt-0.5'>•</span>
                <p>dوُlabb! is not liable for any loss, damage, or disputes related to refunds.</p>
              </div>
            </div>
          </div>

          {/* Community Guidelines */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md'>
                <HiUserGroup className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-deep-charcoal font-display'>
                  Community Guidelines / Seller Standards
                </h2>
                <p className='text-sm text-deep-charcoal/70 mt-1'>
                  <strong>Effective Date:</strong> 1 October 2025
                </p>
              </div>
            </div>
            <p className='text-deep-charcoal mb-6 p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-500'>
              To maintain a safe, trustworthy marketplace, all users must follow these guidelines:
            </p>
            <ol className='list-decimal list-inside space-y-3 text-deep-charcoal ml-4 p-5 bg-emerald-50 rounded-lg'>
              <li><strong>Honesty:</strong> All descriptions and photos must be accurate.</li>
              <li><strong>Respect:</strong> Treat other users professionally and respectfully.</li>
              <li><strong>Timeliness:</strong> Ship items promptly and provide tracking information.</li>
              <li><strong>Compliance:</strong> Follow local laws and regulations, and ensure items are legally sellable.</li>
              <li><strong>No Abuse:</strong> Do not harass, scam, or mislead other users.</li>
            </ol>
            <p className='text-deep-charcoal mt-4 p-4 bg-emerald-100/50 rounded-lg font-semibold'>
              Failure to follow these guidelines may result in account suspension or termination.
            </p>
          </div>

          {/* Dispute Resolution */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md'>
                <HiChartBar className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-deep-charcoal font-display'>
                  Dispute Resolution & Escalation Policy
                </h2>
                <p className='text-sm text-deep-charcoal/70 mt-1'>
                  <strong>Effective Date:</strong> 1 October 2025
                </p>
              </div>
            </div>
            <ol className='list-decimal list-inside space-y-3 text-deep-charcoal ml-4 p-5 bg-blue-50 rounded-lg mb-4'>
              <li><strong>Step 1:</strong> Buyer contacts Seller directly to resolve issues.</li>
              <li><strong>Step 2:</strong> If unresolved, Buyer or Seller may escalate to dوُlabb! for review.</li>
              <li><strong>Step 3:</strong> dوُlabb! will review and respond within 30 days.</li>
            </ol>
            <p className='text-deep-charcoal mt-4 p-4 bg-blue-100/50 rounded-lg border-l-4 border-blue-500 font-semibold'>
              Important: dوُlabb! is not a party to the transaction and cannot provide monetary reimbursement. Maximum action is suspending or closing a Seller's account.
            </p>
          </div>

          {/* Disclaimer */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-md'>
                <HiExclamationTriangle className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-deep-charcoal font-display'>
                  Disclaimer / Limitation of Liability
                </h2>
                <p className='text-sm text-deep-charcoal/70 mt-1'>
                  <strong>Effective Date:</strong> 1 October 2025
                </p>
              </div>
            </div>
            <div className='space-y-3 text-deep-charcoal'>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200/30'>
                <span className='text-gray-600 font-bold mt-0.5'>•</span>
                <p>dوُlabb! is a marketplace platform. We do not own, sell, or guarantee the items listed.</p>
              </div>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200/30'>
                <span className='text-gray-600 font-bold mt-0.5'>•</span>
                <p>All transactions occur directly between Buyers and Sellers.</p>
              </div>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200/30'>
                <span className='text-gray-600 font-bold mt-0.5'>•</span>
                <p>We make no warranties regarding authenticity, quality, legality, or delivery of items.</p>
              </div>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200/30'>
                <span className='text-gray-600 font-bold mt-0.5'>•</span>
                <p>Users agree that they use the Platform at their own risk.</p>
              </div>
            </div>
          </div>

          {/* GCC Cross-Border Disclaimer */}
          <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10 hover:shadow-xl transition-shadow duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md'>
                <HiGlobeEuropeAfrica className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-deep-charcoal font-display'>
                  GCC Cross-Border Disclaimer
                </h2>
                <p className='text-sm text-deep-charcoal/70 mt-1'>
                  <strong>Effective Date:</strong> 1 October 2025
                </p>
              </div>
            </div>
            <div className='space-y-3 text-deep-charcoal'>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-indigo-50 border border-indigo-200/30'>
                <span className='text-indigo-500 font-bold mt-0.5'>•</span>
                <p>The Platform operates under Saudi law.</p>
              </div>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-indigo-50 border border-indigo-200/30'>
                <span className='text-indigo-500 font-bold mt-0.5'>•</span>
                <p>Sellers are solely responsible for compliance with the laws of their country of residence and the country of delivery.</p>
              </div>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-indigo-50 border border-indigo-200/30'>
                <span className='text-indigo-500 font-bold mt-0.5'>•</span>
                <p>dوُlabb! accepts no liability for cross-border legal issues.</p>
              </div>
              <div className='flex items-start gap-3 p-4 rounded-lg bg-indigo-50 border border-indigo-200/30'>
                <span className='text-indigo-500 font-bold mt-0.5'>•</span>
                <p>Buyers and Sellers agree to abide by the Terms of Use and acknowledge that disputes may be reviewed but dوُlabb! is not a party.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
