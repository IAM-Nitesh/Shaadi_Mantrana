'use client';

import Link from 'next/link';
import CustomIcon from '../../components/CustomIcon';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white z-40 px-4 py-3 shadow-sm">
        <div className="flex items-center">
          <Link href="/settings" className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 mr-3">
            <CustomIcon name="ri-arrow-left-line" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 pb-6 px-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                ShaadiMantrana (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to safeguarding your privacy in compliance with the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023 (DPDP Act) of India. This Privacy Policy outlines how we collect, use, process, and protect your personal data on our matrimonial platform, ensuring transparency and adherence to Indian legal and regulatory standards.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We collect the following information, categorized as personal and technical data, in compliance with the DPDP Act and IT Rules, 2011:
              </p>
              
              <h3 className="text-md font-semibold text-gray-700 mb-2 mt-4">Personal Information:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Phone number for authentication and verification (mandatory for account creation)</li>
                <li>Profile details (name, age, gender, location, profession, caste, religion, community)</li>
                <li>Partner preferences and marital requirements</li>
                <li>Profile photographs and user-uploaded content</li>
                <li>In-platform communication data (messages, chat history)</li>
                <li>Family background, educational qualifications, and lifestyle details</li>
              </ul>

              <h3 className="text-md font-semibold text-gray-700 mb-2 mt-4">Technical Information:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Device information (type, OS, unique identifiers)</li>
                <li>IP address and approximate location (city-level)</li>
                <li>Usage patterns and interaction data for analytics</li>
                <li>Log files, crash reports, and error logs</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We process your data under lawful grounds as per the DPDP Act for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Account setup, verification, and authentication</li>
                <li>Profile creation and visibility for matchmaking</li>
                <li>Matching algorithms for compatibility analysis</li>
                <li>Facilitating secure communication between users</li>
                <li>Ensuring platform safety and preventing fraud</li>
                <li>Providing customer support and resolving issues</li>
                <li>Improving platform functionality and user experience</li>
                <li>Complying with legal obligations under Indian laws</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Information Sharing</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We do not sell, rent, or trade your personal data. Data sharing is limited and compliant with the DPDP Act:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Profile information shared with potential matches as per your privacy settings</li>
                <li>Disclosure to comply with legal obligations (e.g., court orders under Indian law)</li>
                <li>Sharing with trusted service providers under strict Data Processing Agreements</li>
                <li>Data sharing during business transfers (e.g., mergers), with user consent where required</li>
                <li>Emergency disclosures to protect user safety or platform integrity</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We implement robust security measures as mandated by the IT Act, 2000, and DPDP Act:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>End-to-end encryption for data transmission (TLS/SSL protocols)</li>
                <li>Encrypted storage using AES-256 standards</li>
                <li>Regular security audits and CERT-In compliance</li>
                <li>Multi-factor authentication for account access</li>
                <li>Role-based access controls for internal personnel</li>
                <li>Real-time monitoring for unauthorized access</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Your Privacy Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Under the DPDP Act, you have the following rights over your personal data:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Access and obtain a copy of your personal data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request data deletion, subject to legal obligations</li>
                <li>Control profile visibility and match-sharing preferences</li>
                <li>Block or report users for inappropriate behavior</li>
                <li>Opt-out of non-essential communications</li>
                <li>File complaints with our Data Protection Officer or the Data Protection Authority of India</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your data only as long as necessary for the purposes outlined or as required by Indian law. Upon account deletion, personal data is securely erased within one year, except for data required for legal compliance (e.g., tax or audit purposes under the IT Act, 2000).
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed">
                We use only essential cookies for platform functionality, authentication, and security, in line with the IT Rules, 2011. No cookies are used for advertising or behavioral tracking. You can manage cookie settings via your browser, but disabling essential cookies may impair platform performance.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Third-Party Services</h2>
              <p className="text-gray-600 leading-relaxed">
                We engage third-party services (e.g., SMS verification providers) that comply with the DPDP Act and IT Act, 2000. These providers are bound by strict data protection agreements to ensure your data is handled securely.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">10. International Data Transfers</h2>
              <p className="text-gray-600 leading-relaxed">
                Your data may be transferred to servers outside India, subject to compliance with the DPDP Act’s cross-border data transfer requirements. We ensure adequate safeguards, such as Standard Contractual Clauses, to protect your data during such transfers.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">11. Age Restrictions</h2>
              <p className="text-gray-600 leading-relaxed">
                Our platform is restricted to users aged 18+ for women and 21+ for men, as per Indian marriage laws (Hindu Marriage Act, 1955, and other applicable laws). We do not collect data from minors and promptly delete any such data if identified.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this policy to reflect changes in our practices or Indian laws. Significant updates will be notified via in-app messages, email, or platform announcements, as required by the DPDP Act. Continued use of the platform after such updates implies consent to the revised policy.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">13. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                For privacy-related queries, concerns, or to exercise your rights under the DPDP Act, contact our Data Protection Officer:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Support Email: <a href="mailto:shaadimantrana.help@gmail.com" className="text-blue-600">shaadimantrana.help@gmail.com</a></li>
                <li>Admin Contact: +91 7086875013</li>
                <li>In-app support section</li>
                <li>Customer service channels within the platform</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">14. Legal Compliance</h2>
              <p className="text-gray-600 leading-relaxed">
                We adhere to the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, IT Rules, 2011, and other applicable Indian laws. We implement all necessary measures, including obtaining consent, providing notices, and maintaining security standards, to ensure compliance.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: July 2025
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This Privacy Policy governs your use of ShaadiMantrana and reflects our commitment to protecting your personal data in accordance with Indian laws.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}