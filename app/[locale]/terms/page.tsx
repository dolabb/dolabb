export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = locale === 'ar';

  return (
    <div className='min-h-screen bg-off-white' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl md:text-4xl font-bold text-deep-charcoal mb-2 font-display'>
            {locale === 'en' ? 'Terms of Service' : 'شروط الخدمة'}
          </h1>
          <div className='h-1 w-20 bg-saudi-green rounded-full'></div>
        </div>

        {/* Content */}
        <div className='prose prose-lg max-w-none'>
          <div className='bg-white rounded-lg shadow-sm border border-rich-sand/30 p-6 md:p-8 space-y-8'>
            {/* Introduction */}
            <section>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                dalabb Terms of Use
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <p className='text-deep-charcoal leading-relaxed'>
                These Terms of Use ("Terms") form a binding agreement between:
              </p>
              <ul className='list-disc list-inside mt-4 space-y-2 text-deep-charcoal ml-4'>
                <li>
                  <strong>dalabb</strong> ("Platform," "we," "our"), a
                  Saudi-registered company operating an online marketplace;
                </li>
                <li>
                  <strong>Buyers</strong>, individuals who register to purchase
                  items;
                </li>
                <li>
                  <strong>Sellers</strong>, individuals or entities who register
                  to sell items.
                </li>
              </ul>
              <p className='text-deep-charcoal leading-relaxed mt-4'>
                By registering as a Buyer or Seller and using the Platform, you
                agree to these Terms.
              </p>
            </section>

            {/* Section 1 */}
            <section>
              <h3 className='text-xl font-bold text-saudi-green mb-3 font-display'>
                1. Our Role as the Platform
              </h3>
              <ul className='space-y-2 text-deep-charcoal'>
                <li>• dalabb is an online marketplace connecting Buyers and Sellers.</li>
                <li>• We are not a party to any transaction between Buyers and Sellers.</li>
                <li>• We do not own, control, inspect, guarantee, or warrant any product listed.</li>
                <li>• All responsibility for products, listings, and transactions lies solely with the Seller.</li>
                <li>• Buyers and Sellers understand they are contracting directly with each other, and dalabb is not a participant in the sale.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className='text-xl font-bold text-saudi-green mb-3 font-display'>
                2. Buyer Terms & Conditions
              </h3>
              
              <div className='ml-4 space-y-4'>
                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>1. Responsibility</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Purchases are at your own risk.</li>
                    <li>• dalabb does not guarantee authenticity, quality, condition, or legality of items.</li>
                    <li>• Verify all details with the Seller before purchasing.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>2. Final Sales</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• All sales are final. dalabb does not handle refunds or cancellations.</li>
                    <li>• If a Seller offers a return policy, you must confirm and agree directly with the Seller.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>3. Payments</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Provide accurate and authorized payment information.</li>
                    <li>• You are responsible for all charges under your account.</li>
                    <li>• Buyers pay shipping fees unless otherwise agreed with the Seller.</li>
                    <li>• Payment is complete only when confirmed by the payment processor.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>4. Shipping</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Buyers are responsible for agreeing shipping terms with the Seller.</li>
                    <li>• dalabb is not responsible for lost, damaged, or defective items.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>5. Disputes</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Contact the Seller first to resolve disputes.</li>
                    <li>• If unresolved, you may escalate to dalabb for review. Response within 30 days.</li>
                    <li>• dalabb cannot provide reimbursement. Maximum action is suspending or closing the Seller's account.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className='text-xl font-bold text-saudi-green mb-3 font-display'>
                3. Seller Terms & Conditions
              </h3>
              
              <div className='ml-4 space-y-4'>
                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>1. Eligibility & Registration</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Sellers must be 18+ and have full legal capacity.</li>
                    <li>• Provide valid, accurate registration details and legal documents.</li>
                    <li>• Represent and warrant that all submitted documents are valid and legally binding.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>2. Compliance with Laws</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Sellers are fully responsible for compliance with all applicable laws in:</li>
                    <li className='ml-4'>- Kingdom of Saudi Arabia</li>
                    <li className='ml-4'>- Country of operation or shipment</li>
                    <li className='ml-4'>- Country of delivery</li>
                    <li>• dalabb is not liable for Sellers' legal or regulatory failures.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>3. Listings</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Listings must be truthful, accurate, and include clear photos.</li>
                    <li>• False or misleading listings may result in suspension or termination.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>4. Pricing & Payments</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Sellers set their own prices but must disclose additional charges (e.g., shipping).</li>
                    <li>• dalabb may charge a platform fee, deducted from the final sale price.</li>
                    <li>• Payments follow the Platform's payout schedule and system.</li>
                    <li>• Sellers are responsible for correct payout information and compliance with local financial regulations.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>5. Shipping & Fulfillment</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Ship items within agreed timeframe and provide tracking.</li>
                    <li>• Delays or failure to ship may result in penalties or account suspension.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>6. Returns & Refunds</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Sellers must handle returns/refunds according to their own policy and applicable law.</li>
                    <li>• dalabb does not process returns or refunds.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>7. Prohibited Items</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• No illegal, counterfeit, or restricted items.</li>
                    <li>• Violations may lead to immediate suspension or termination.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className='text-xl font-bold text-saudi-green mb-3 font-display'>
                4. Payments & Financial Terms
              </h3>
              <ul className='space-y-2 text-deep-charcoal'>
                <li>• All payments are processed through secure, approved third-party providers.</li>
                <li>• Buyers and Sellers are responsible for fees, charges, and currency conversion costs.</li>
                <li>• Payment completion is confirmed by the payment processor.</li>
                <li>• dalabb is not responsible for payment disputes beyond account review.</li>
                <li>• Buyers and Sellers acknowledge that dalabb is not a party to transactions and cannot refund, reverse, or reimburse payments.</li>
                <li>• Sellers agree that platform fees and any applicable taxes will be handled according to the payout system.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className='text-xl font-bold text-saudi-green mb-3 font-display'>
                5. Dispute Resolution
              </h3>
              <ul className='space-y-2 text-deep-charcoal'>
                <li>• Disputes between Buyers and Sellers must first be raised directly with the other party.</li>
                <li>• If unresolved, the dispute may be escalated to dalabb. Response within 30 days.</li>
                <li>• dalabb is not a party to disputes and cannot provide monetary reimbursement. Maximum action is suspension or closure of an account.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h3 className='text-xl font-bold text-saudi-green mb-3 font-display'>
                6. Governing Law & Jurisdiction
              </h3>
              <ul className='space-y-2 text-deep-charcoal'>
                <li>• These Terms are governed by Saudi Arabian law.</li>
                <li>• The courts of Riyadh, Saudi Arabia have exclusive jurisdiction.</li>
                <li>• Sellers must comply with local laws of their country and country of delivery.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h3 className='text-xl font-bold text-saudi-green mb-3 font-display'>
                7. Disclaimer of Warranties
              </h3>
              <p className='text-deep-charcoal mb-2'>Platform provided "as is" and "as available."</p>
              <p className='text-deep-charcoal mb-2'>No warranties or guarantees regarding:</p>
              <ul className='space-y-1 text-deep-charcoal ml-4'>
                <li>• Platform operation</li>
                <li>• Listings, quality, authenticity, or legality of items</li>
                <li>• Conduct of Buyers or Sellers</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h3 className='text-xl font-bold text-saudi-green mb-3 font-display'>
                8. Additional Policies Integration
              </h3>
              <p className='text-deep-charcoal mb-2'>
                By using dalabb, users also agree to:
              </p>
              <ul className='space-y-1 text-deep-charcoal ml-4'>
                <li>• <strong>Privacy Policy</strong> - data collection and processing rules</li>
                <li>• <strong>Cookie Policy</strong> - website cookie use</li>
                <li>• <strong>Acceptable Use Policy</strong> - rules for platform behavior</li>
                <li>• <strong>Intellectual Property & Counterfeit Policy</strong> - prohibited listings and IP compliance</li>
                <li>• <strong>Community Guidelines</strong> - standards for interactions</li>
                <li>• <strong>Returns & Refunds Disclaimer</strong> - no platform-managed refunds</li>
              </ul>
            </section>

            {/* Privacy Policy Section */}
            <section className='border-t border-rich-sand/30 pt-6 mt-6'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                dalabb Privacy Policy
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <p className='text-deep-charcoal mb-4'>
                This Privacy Policy ("Policy") explains how dalabb ("we," "our," "Platform") collects, processes, and protects personal data of Buyers and Sellers ("users," "you"). By using the Platform, you agree to this Policy.
              </p>

              <div className='space-y-4'>
                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>1. Role of dalabb</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• dalabb collects and processes data necessary to operate the Platform.</li>
                    <li>• dalabb is not responsible for personal information exchanged directly between Buyers and Sellers. Such exchanges occur at the parties' own risk.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>2. Information We Collect</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• <strong>Account Information:</strong> Name, email, phone number, password, profile details.</li>
                    <li>• <strong>Payment Data:</strong> Billing details, bank/payment credentials (processed through secure third parties).</li>
                    <li>• <strong>Transaction Data:</strong> Purchase and sales history, shipping details.</li>
                    <li>• <strong>Device Data:</strong> IP address, browser, operating system, device identifiers.</li>
                    <li>• <strong>Communications:</strong> Messages exchanged with dalabb support.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>3. How We Use Your Information</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• To provide and operate the Platform.</li>
                    <li>• To process payments and facilitate transactions.</li>
                    <li>• To prevent fraud and ensure compliance with laws.</li>
                    <li>• To communicate with you regarding your account and activity.</li>
                    <li>• To improve Platform functionality and security.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>4. User Rights</h4>
                  <p className='text-deep-charcoal mb-2'>You have the right to:</p>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• Access your personal data.</li>
                    <li>• Correct inaccurate information.</li>
                    <li>• Erase your data (subject to legal obligations).</li>
                    <li>• Restrict processing of your data.</li>
                    <li>• Withdraw consent where processing is based on consent.</li>
                  </ul>
                  <p className='text-deep-charcoal mt-2'>
                    Requests may be submitted to{' '}
                    <a href='mailto:contact@dolabb.com' className='text-saudi-green hover:underline'>
                      contact@dolabb.com
                    </a>
                    .
                  </p>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>5. Data Security & Retention</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• We use technical and organizational measures to protect personal data.</li>
                    <li>• Data is retained only as long as necessary for operational, regulatory, or legal reasons, after which it is securely deleted.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>6. Sharing of Information</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• We may share data with service providers (e.g., payment processors, hosting providers) to operate the Platform.</li>
                    <li>• We may disclose information if required by law or to protect our legal rights.</li>
                    <li>• dalabb is not responsible for information exchanged directly between Buyers and Sellers.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>7. GCC Users</h4>
                  <ul className='space-y-1 text-deep-charcoal ml-4'>
                    <li>• The Platform is operated under Saudi law.</li>
                    <li>• By using dalabb, you acknowledge and agree that your personal data is collected, processed, and stored in accordance with Saudi Arabian law, even if you are located in another GCC country.</li>
                    <li>• Sellers remain responsible for compliance with the data protection laws of their country of operation or delivery.</li>
                  </ul>
                </div>

                <div>
                  <h4 className='font-semibold text-deep-charcoal mb-2'>8. Governing Law</h4>
                  <p className='text-deep-charcoal'>
                    This Policy is governed by the laws of the Kingdom of Saudi Arabia. Any disputes relating to this Policy shall be subject to the exclusive jurisdiction of the courts of Riyadh, Saudi Arabia.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookie Policy */}
            <section className='border-t border-rich-sand/30 pt-6 mt-6'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                Cookie Policy (Website)
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <p className='text-deep-charcoal mb-4'>
                dalabb uses cookies and similar technologies to enhance your experience on our website. By using our website, you consent to the use of cookies as described below.
              </p>

              <div>
                <h4 className='font-semibold text-deep-charcoal mb-2'>What Cookies We Use:</h4>
                <ul className='space-y-1 text-deep-charcoal ml-4'>
                  <li>• <strong>Essential Cookies:</strong> Required for the website to function.</li>
                  <li>• <strong>Analytics Cookies:</strong> Help us understand how users interact with our website.</li>
                  <li>• <strong>Advertising/Marketing Cookies:</strong> Optional, used to personalize ads.</li>
                </ul>
              </div>

              <div className='mt-4'>
                <h4 className='font-semibold text-deep-charcoal mb-2'>Managing Cookies:</h4>
                <p className='text-deep-charcoal'>
                  You can disable cookies through your browser settings, but some features of the website may not function correctly if cookies are disabled.
                </p>
              </div>
            </section>

            {/* Acceptable Use Policy */}
            <section className='border-t border-rich-sand/30 pt-6 mt-6'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                Acceptable Use Policy (AUP)
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <p className='text-deep-charcoal mb-4'>
                All users of dalabb agree to use the Platform responsibly. The following activities are strictly prohibited:
              </p>
              <ol className='list-decimal list-inside space-y-2 text-deep-charcoal ml-4'>
                <li>Using the Platform to engage in illegal activity.</li>
                <li>Listing counterfeit, stolen, or prohibited items.</li>
                <li>Sending spam, unsolicited messages, or malware.</li>
                <li>Impersonating another person or entity.</li>
                <li>Attempting to disrupt, hack, or gain unauthorized access to the Platform.</li>
              </ol>
              <p className='text-deep-charcoal mt-4'>
                Violation may result in account suspension, removal of listings, or permanent termination.
              </p>
            </section>

            {/* Intellectual Property Policy */}
            <section className='border-t border-rich-sand/30 pt-6 mt-6'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                Intellectual Property & Counterfeit Policy
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <p className='text-deep-charcoal mb-4'>
                dalabb respects intellectual property rights and expects all users to do the same.
              </p>

              <div>
                <h4 className='font-semibold text-deep-charcoal mb-2'>Sellers Must:</h4>
                <ul className='space-y-1 text-deep-charcoal ml-4'>
                  <li>• Only list items they legally own or are authorized to sell.</li>
                  <li>• Avoid infringing trademarks, copyrights, or patents.</li>
                  <li>• Immediately remove items if an IP complaint is raised.</li>
                </ul>
              </div>

              <div className='mt-4'>
                <h4 className='font-semibold text-deep-charcoal mb-2'>Platform Rights:</h4>
                <ul className='space-y-1 text-deep-charcoal ml-4'>
                  <li>• dalabb may remove listings or suspend accounts for IP violations.</li>
                  <li>• Users may submit a takedown request if they believe their IP rights are infringed.</li>
                </ul>
              </div>
            </section>

            {/* Returns & Refunds Disclaimer */}
            <section className='border-t border-rich-sand/30 pt-6 mt-6'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                Returns & Refunds Disclaimer
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <ul className='space-y-2 text-deep-charcoal'>
                <li>• dalabb does not handle refunds, cancellations, or returns.</li>
                <li>• Buyers must confirm any return policy directly with Sellers before purchase.</li>
                <li>• Sellers are responsible for processing returns in accordance with applicable local laws.</li>
                <li>• dalabb is not liable for any loss, damage, or disputes related to refunds.</li>
              </ul>
            </section>

            {/* Community Guidelines */}
            <section className='border-t border-rich-sand/30 pt-6 mt-6'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                Community Guidelines / Seller Standards
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <p className='text-deep-charcoal mb-4'>
                To maintain a safe, trustworthy marketplace, all users must follow these guidelines:
              </p>
              <ol className='list-decimal list-inside space-y-2 text-deep-charcoal ml-4'>
                <li><strong>Honesty:</strong> All descriptions and photos must be accurate.</li>
                <li><strong>Respect:</strong> Treat other users professionally and respectfully.</li>
                <li><strong>Timeliness:</strong> Ship items promptly and provide tracking information.</li>
                <li><strong>Compliance:</strong> Follow local laws and regulations, and ensure items are legally sellable.</li>
                <li><strong>No Abuse:</strong> Do not harass, scam, or mislead other users.</li>
              </ol>
              <p className='text-deep-charcoal mt-4'>
                Failure to follow these guidelines may result in account suspension or termination.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className='border-t border-rich-sand/30 pt-6 mt-6'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                Dispute Resolution & Escalation Policy
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <ol className='list-decimal list-inside space-y-2 text-deep-charcoal ml-4'>
                <li><strong>Step 1:</strong> Buyer contacts Seller directly to resolve issues.</li>
                <li><strong>Step 2:</strong> If unresolved, Buyer or Seller may escalate to dalabb for review.</li>
                <li><strong>Step 3:</strong> dalabb will review and respond within 30 days.</li>
              </ol>
              <p className='text-deep-charcoal mt-4 font-semibold'>
                Important: dalabb is not a party to the transaction and cannot provide monetary reimbursement. Maximum action is suspending or closing a Seller's account.
              </p>
            </section>

            {/* Disclaimer */}
            <section className='border-t border-rich-sand/30 pt-6 mt-6'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                Disclaimer / Limitation of Liability
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <ul className='space-y-2 text-deep-charcoal'>
                <li>• dalabb is a marketplace platform. We do not own, sell, or guarantee the items listed.</li>
                <li>• All transactions occur directly between Buyers and Sellers.</li>
                <li>• We make no warranties regarding authenticity, quality, legality, or delivery of items.</li>
                <li>• Users agree that they use the Platform at their own risk.</li>
              </ul>
            </section>

            {/* GCC Cross-Border Disclaimer */}
            <section className='border-t border-rich-sand/30 pt-6 mt-6'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-4 font-display'>
                GCC Cross-Border Disclaimer
              </h2>
              <p className='text-sm text-deep-charcoal/70 mb-4'>
                <strong>Effective Date:</strong> 1 October 2025
              </p>
              <ul className='space-y-2 text-deep-charcoal'>
                <li>• The Platform operates under Saudi law.</li>
                <li>• Sellers are solely responsible for compliance with the laws of their country of residence and the country of delivery.</li>
                <li>• dalabb accepts no liability for cross-border legal issues.</li>
                <li>• Buyers and Sellers agree to abide by the Terms of Use and acknowledge that disputes may be reviewed but dalabb is not a party.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

