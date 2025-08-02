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
                By accessing or using ShaadiMantrana ("Service"), you agree to be bound by these Terms of Service ("Terms"), which form a legally binding agreement between you and ShaadiMantrana under the Indian Contract Act, 1872. If you do not agree with these Terms, you may not use the Service. These Terms are subject to applicable Indian laws, including but not limited to the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Service Description</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                ShaadiMantrana is a matrimonial platform designed to facilitate meaningful connections for marriage in compliance with Indian laws and cultural values. Our service includes:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Profile creation and management for matrimonial purposes</li>
                <li>Matching algorithms based on compatibility preferences, respecting community and religious sensitivities</li>
                <li>Secure communication tools for respectful interaction between matched users</li>
                <li>Safety features including identity verification compliant with Indian regulations</li>
                <li>Privacy controls adhering to the Digital Personal Data Protection Act, 2023</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Free Service Commitment</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                ShaadiMantrana is committed to providing a free matrimonial service to all users:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>No subscription fees, premium charges, or hidden costs</li>
                <li>Full access to all platform features without payment</li>
                <li>Free messaging, matching, and communication tools</li>
                <li>Long-term commitment to maintaining free access</li>
                <li>No advertisements or third-party promotions, in compliance with Indian advertising regulations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Eligibility and Registration</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                To use ShaadiMantrana, you must:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Be at least 21 years of age for males and 18 for females, as per the legal marriageable age under the Hindu Marriage Act, 1955, or other applicable personal laws in India</li>
                <li>Provide a valid Indian phone number or government-issued ID for verification, as required under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</li>
                <li>Have genuine intent to find a life partner for marriage</li>
                <li>Provide accurate and truthful information in compliance with Indian laws</li>
                <li>Not be prohibited from entering into marriage under any applicable personal or civil law in India</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">5. User Responsibilities and Conduct</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                As a user, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Provide accurate, complete, and current profile information, including details required under Indian matrimonial laws</li>
                <li>Use genuine, recent photographs that accurately represent you</li>
                <li>Treat all users with respect and dignity, adhering to Indian cultural norms</li>
                <li>Use the platform exclusively for matrimonial purposes under applicable personal laws</li>
                <li>Report inappropriate behavior or content via in-app mechanisms, as mandated by the Information Technology Rules, 2021</li>
                <li>Maintain confidentiality of personal information shared by others, in line with the Digital Personal Data Protection Act, 2023</li>
                <li>Not engage in harassment, discrimination, or offensive behavior, including acts prohibited under the Indian Penal Code, 1860</li>
                <li>Not create multiple accounts or impersonate others, as per Section 66C of the Information Technology Act, 2000</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Prohibited Activities</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                The following activities are strictly prohibited under Indian law and platform policies:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Soliciting money, dowry, gifts, or financial information, as prohibited under the Dowry Prohibition Act, 1961</li>
                <li>Sharing contact information for commercial or non-matrimonial purposes</li>
                <li>Posting inappropriate, obscene, or misleading content, as defined under Section 67 of the Information Technology Act, 2000</li>
                <li>Engaging in fraudulent or deceptive practices, violating the Indian Contract Act, 1872</li>
                <li>Using the platform for casual dating or purposes not aligned with matrimonial intent</li>
                <li>Violating any applicable Indian laws, including personal laws governing marriage</li>
                <li>Attempting to compromise platform security, as per Section 66 of the Information Technology Act, 2000</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Privacy and Data Protection</h2>
              <p className="text-gray-600 leading-relaxed">
                We prioritize your privacy and comply with the Digital Personal Data Protection Act, 2023. Your personal information is processed as per our Privacy Policy, which is integral to these Terms. We implement robust security measures to protect your data and do not sell or share it with third parties except as required by Indian law.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Content Moderation and Safety</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                To ensure a safe and compliant platform, in accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>All profiles undergo verification, including government-issued ID checks where required</li>
                <li>We employ automated and manual content review systems to detect unlawful content</li>
                <li>Users can report inappropriate behavior or content via in-app tools</li>
                <li>We reserve the right to remove content or suspend accounts for violations</li>
                <li>Serious violations, such as dowry demands or obscene content, may result in permanent bans and reporting to authorities</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content, features, and functionality of ShaadiMantrana are protected under the Copyright Act, 1957 and other applicable Indian intellectual property laws. Users retain rights to their uploaded content but grant us a non-exclusive license to use it for platform operations and improvement, subject to privacy laws.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                ShaadiMantrana provides the platform "as is" without warranties, subject to the Consumer Protection Act, 2019. We are not liable for user actions, meeting outcomes, or indirect damages. Our maximum liability is limited to the amount paid (zero for our free platform), as permitted under Indian law.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">11. Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                Either party may terminate this agreement at any time. We may suspend or terminate accounts for violations of these Terms or Indian law. Upon termination, your right to use the Service ceases, and we may delete your data in accordance with the Digital Personal Data Protection Act, 2023.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">12. Dispute Resolution</h2>
              <p className="text-gray-600 leading-relaxed">
                Any disputes shall be resolved through binding arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in New Delhi, India. Users waive the right to class action lawsuits and agree to resolve disputes individually, subject to applicable Indian laws.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">13. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We may modify these Terms at any time, with notice provided via the platform or email, as required under the Information Technology Rules, 2021. Continued use after changes constitutes acceptance of the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">14. Governing Law and Jurisdiction</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms are governed by the laws of India. Subject to the arbitration clause, any legal proceedings shall be subject to the exclusive jurisdiction of courts in New Delhi, India.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">15. Contact Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                For queries or grievances, contact our Grievance Officer as per the Information Technology Rules, 2021, through:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Support Email: <a href="mailto:shaadimantrana.help@gmail.com" className="text-blue-600">shaadimantrana.help@gmail.com</a></li>
                <li>Admin Contact: +91 7086875013</li>
                <li>In-app support section</li>
                <li>Customer service channels within the platform</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                We aim to address complaints within the timelines prescribed under Indian law.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: July 2025
              </p>
              <p className="text-sm text-gray-500 mt-2">
                These Terms of Service are effective immediately and govern your use of ShaadiMantrana in compliance with Indian laws.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}