'use client';

import Link from 'next/link';
import CustomIcon from '../../components/CustomIcon';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white z-40 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Privacy Policy</h1>
          <Link href="/settings" className="w-8 h-8 flex items-center justify-center text-gray-600">
            <CustomIcon name="ri-arrow-left-line" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 pb-6 px-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                This Privacy Policy explains how ShaadiMantra (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, processes, and protects your personal information when you use our matrimonial platform. We are committed to protecting your privacy and ensuring the security of your personal data.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We collect information that you provide directly to us and information that is automatically collected when you use our service:
              </p>
              
              <h3 className="text-md font-semibold text-gray-700 mb-2 mt-4">Personal Information:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Phone number for authentication and verification</li>
                <li>Profile information (name, age, gender, location, profession)</li>
                <li>Personal preferences and partner requirements</li>
                <li>Profile photographs and other uploaded content</li>
                <li>Communication data within the platform</li>
                <li>Family and educational background information</li>
              </ul>

              <h3 className="text-md font-semibold text-gray-700 mb-2 mt-4">Technical Information:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Device information and unique identifiers</li>
                <li>IP address and location data</li>
                <li>App usage patterns and interaction data</li>
                <li>Log files and error reports</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Account creation, authentication, and security</li>
                <li>Profile creation and display to potential matches</li>
                <li>Matching algorithms and compatibility analysis</li>
                <li>Facilitating communication between matched users</li>
                <li>Platform safety, moderation, and fraud prevention</li>
                <li>Customer support and technical assistance</li>
                <li>Service improvement and feature development</li>
                <li>Legal compliance and dispute resolution</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We do not sell, rent, or trade your personal information. We may share your information in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Profile information visible to potential matches within the platform</li>
                <li>When required by law, legal process, or government requests</li>
                <li>To protect the safety, rights, and security of our users</li>
                <li>With service providers who assist in platform operations (under strict confidentiality)</li>
                <li>In case of business transfers (merger, acquisition, etc.)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We implement comprehensive security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>End-to-end encryption for sensitive data transmission</li>
                <li>Secure data storage with advanced encryption protocols</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Multi-factor authentication for account access</li>
                <li>Restricted access to personal data by authorized personnel only</li>
                <li>Continuous monitoring for suspicious activities</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Your Privacy Rights and Controls</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                You have comprehensive control over your privacy and data:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Profile visibility and privacy settings</li>
                <li>Control over what information is shared with matches</li>
                <li>Blocking and reporting features for unwanted contact</li>
                <li>Account deletion and data removal options</li>
                <li>Access to your personal data upon request</li>
                <li>Correction of inaccurate personal information</li>
                <li>Opt-out of non-essential communications</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your personal information only as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When you delete your account, we permanently remove your personal data from our active databases within 30 days, except for information we are required to retain by law.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 leading-relaxed">
                We use minimal, essential cookies for authentication, security, and platform functionality. We do not use tracking cookies for advertising purposes. You can manage cookie preferences through your device settings, though disabling essential cookies may affect platform functionality.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Third-Party Services</h2>
              <p className="text-gray-600 leading-relaxed">
                Our platform may integrate with third-party services for essential functions like SMS verification. These services operate under their own privacy policies, and we ensure they meet our strict privacy and security standards before integration.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">10. International Data Transfers</h2>
              <p className="text-gray-600 leading-relaxed">
                Your data may be stored and processed in servers located in different countries. We ensure that any international data transfers comply with applicable privacy laws and include appropriate safeguards to protect your personal information.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">11. Age Restrictions</h2>
              <p className="text-gray-600 leading-relaxed">
                Our service is intended exclusively for adults aged 18 and above who are legally eligible for marriage. We do not knowingly collect personal information from individuals under 18. If we discover such information, we will promptly delete it.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. Significant changes will be communicated through the app or email notification. Your continued use of the service after such changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">13. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                If you have questions, concerns, or requests regarding this Privacy Policy or how we handle your personal data, please contact us through:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>In-app support and feedback section</li>
                <li>Customer service channels within the platform</li>
                <li>Privacy-specific inquiries through our support team</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">14. Legal Compliance</h2>
              <p className="text-gray-600 leading-relaxed">
                We comply with applicable privacy laws and regulations, including data protection requirements in jurisdictions where we operate. This includes providing appropriate notice, obtaining necessary consents, and implementing required security measures.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: December 2024
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This Privacy Policy is effective immediately and governs your use of ShaadiMantra. We are committed to protecting your privacy and maintaining the security of your personal information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
