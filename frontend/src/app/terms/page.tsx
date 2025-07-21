'use client';

import Link from 'next/link';
import CustomIcon from '../../components/CustomIcon';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white z-40 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Terms of Service</h1>
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
              <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using ShaadiMantra ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms constitute a legally binding agreement between you and ShaadiMantra.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Service Description</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                ShaadiMantra is a matrimonial platform designed to help individuals find meaningful connections for marriage. Our service includes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Profile creation and management for matrimonial purposes</li>
                <li>Matching algorithms based on compatibility preferences</li>
                <li>Secure communication tools between matched users</li>
                <li>Safety features including verification and reporting systems</li>
                <li>Privacy controls and data protection measures</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Free Service Commitment</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                ShaadiMantra is committed to providing a completely free matrimonial service:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>No subscription fees, premium charges, or hidden costs</li>
                <li>Full access to all platform features without payment</li>
                <li>Free messaging, matching, and communication tools</li>
                <li>Long-term commitment to maintaining free access</li>
                <li>No advertisements or third-party promotions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Eligibility and Registration</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                To use ShaadiMantra, you must:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Be at least 18 years of age and legally able to enter into matrimony</li>
                <li>Provide a valid phone number for verification purposes</li>
                <li>Have genuine intent to find a life partner for marriage</li>
                <li>Agree to provide accurate and truthful information</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">5. User Responsibilities and Conduct</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                As a user, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Provide accurate, complete, and current profile information</li>
                <li>Use genuine, recent photographs that represent you accurately</li>
                <li>Treat all users with respect and dignity</li>
                <li>Use the platform exclusively for matrimonial purposes</li>
                <li>Report inappropriate behavior or content immediately</li>
                <li>Maintain confidentiality of personal information shared by others</li>
                <li>Not engage in harassment, discrimination, or offensive behavior</li>
                <li>Not create multiple accounts or impersonate others</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Prohibited Activities</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                The following activities are strictly prohibited:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Soliciting money, gifts, or financial information</li>
                <li>Sharing contact information for commercial purposes</li>
                <li>Posting inappropriate, offensive, or misleading content</li>
                <li>Engaging in fraudulent or deceptive practices</li>
                <li>Using the platform for casual dating or non-matrimonial purposes</li>
                <li>Violating any applicable laws or regulations</li>
                <li>Attempting to compromise platform security</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Privacy and Data Protection</h2>
              <p className="text-gray-600 leading-relaxed">
                Your privacy is paramount to us. We collect and process personal information in accordance with our Privacy Policy, which forms an integral part of these Terms. We implement robust security measures to protect your data and never sell your information to third parties.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Content Moderation and Safety</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                To ensure user safety:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>All profiles undergo verification and moderation</li>
                <li>We employ automated and manual content review systems</li>
                <li>Users can report inappropriate behavior or content</li>
                <li>We reserve the right to remove content or suspend accounts</li>
                <li>Serious violations may result in permanent bans</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content, features, and functionality of ShaadiMantra are owned by us and protected by intellectual property laws. Users retain rights to their uploaded content but grant us license to use it for platform operation and improvement.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                ShaadiMantra provides the platform "as is" without warranties. We are not liable for user actions, meeting outcomes, or any indirect damages. Our maximum liability is limited to the amount you paid for the service (which is zero for our free platform).
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">11. Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                Either party may terminate this agreement at any time. We may suspend or terminate accounts for Terms violations. Upon termination, your right to use the Service ceases immediately, and we may delete your account and data.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">12. Dispute Resolution</h2>
              <p className="text-gray-600 leading-relaxed">
                Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with applicable laws. Users waive the right to class action lawsuits and agree to resolve disputes individually.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">13. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. Significant changes will be communicated through the platform or email. Continued use after changes constitutes acceptance of the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">14. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                For questions, concerns, or support regarding these Terms of Service, please contact us through the app's support section or customer service channels.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: December 2024
              </p>
              <p className="text-sm text-gray-500 mt-2">
                These Terms of Service are effective immediately and govern your use of ShaadiMantra.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
