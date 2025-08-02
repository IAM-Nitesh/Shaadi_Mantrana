'use client';

import Link from 'next/link';
import CustomIcon from '../../components/CustomIcon';
import { ContactService } from '../../services/contact-service';

export default function Help() {
  const faqs = [
    {
      question: 'How do I create a profile?',
      answer: 'After logging in with your approved phone number, navigate to the Profile section and fill in your details including photos, education, profession, and preferences.'
    },
    {
      question: 'How does matching work?',
      answer: 'Our smart algorithm shows you potential matches based on your preferences. Swipe right to like someone or left to pass. When both users like each other, it creates a match!'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! All your conversations are end-to-end encrypted, and we follow strict privacy guidelines. Your data is never shared with third parties.'
    },
    {
      question: 'How do I get my number approved?',
      answer: 'Contact our admin team to get your phone number approved. Only approved numbers can access the app for security reasons.'
    },
    {
      question: 'Can I change my preferences?',
      answer: 'Yes, you can update your matching preferences anytime from the Settings or Filter options on the main screen.'
    },
    {
      question: 'How do I report someone?',
      answer: 'If you encounter inappropriate behavior, use the report option in the chat or profile section. Our team reviews all reports promptly.'
    },
    {
      question: 'How can I delete my data?',
      answer: 'You can request complete data deletion by contacting our admin team. We will permanently remove all your information within 30 days.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white z-40 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/settings" className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
              <CustomIcon name="ri-arrow-left-line" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Help & Support</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 pb-8 px-4">
        {/* Contact Support */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6 transform hover:scale-105 transition-all duration-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CustomIcon name="ri-customer-service-line" className="text-2xl text-rose-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Need Help?</h2>
            <p className="text-gray-600 mb-6">Our admin team is here to help you with any questions or issues.</p>
            
            <div className="space-y-3">
              <button
                onClick={() => ContactService.handleEmailContact()}
                className="flex items-center justify-center space-x-3 w-full bg-white border-2 border-rose-500 text-rose-500 py-3 rounded-xl font-medium hover:bg-rose-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <CustomIcon name="ri-mail-line" />
                <span>Email Support</span>
              </button>
              <button
                onClick={() => ContactService.handlePhoneContact()}
                className="flex items-center justify-center space-x-3 w-full border border-rose-500 text-rose-500 py-3 rounded-xl font-medium !rounded-button hover:bg-rose-50 transition-all duration-200 transform hover:scale-105"
              >
                <CustomIcon name="ri-phone-line" />
                <span>Call Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Frequently Asked Questions</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, index) => (
              <details key={index} className="group">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <span className="font-medium text-gray-800">{faq.question}</span>
                  <CustomIcon name="ri-arrow-right-s-line" className="text-gray-400 group-open:rotate-90 transition-transform duration-200" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Data Deletion Request */}
        <div className="bg-white rounded-xl p-4 shadow-sm mt-4">
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Data Deletion Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have the right to request deletion of all your personal data from our systems. This includes your profile, messages, photos, and all associated data.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                ⚠️ This action is permanent and cannot be undone. You will lose access to all matches, conversations, and profile data.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => ContactService.handleEmailContact(
                  'Data Deletion Request',
                  'I would like to request deletion of all my personal data from Shaadi Mantrana app.\n\nPlease confirm that you will:\n1. Delete my profile and all personal information\n2. Remove all my photos and documents\n3. Delete all my messages and conversations\n4. Remove my account from the matching system\n5. Delete all activity logs and preferences\n\nEmail associated with account: [Please specify]\nPhone number: [Please specify]\nReason for deletion: [Optional]'
                )}
                className="inline-block bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-all duration-200"
              >
                Request Complete Data Deletion
              </button>
              <p className="text-xs text-gray-500 mt-2">
                We will process your request within 30 days as per GDPR/CCPA requirements
              </p>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white rounded-xl p-4 shadow-sm mt-4">
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Export Your Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              Request a copy of all your personal data stored in our systems.
            </p>
            <button
              onClick={() => ContactService.handleEmailContact(
                'Data Export Request',
                'I would like to request an export of all my personal data from Shaadi Mantrana app.\n\nPlease provide:\n1. My complete profile information\n2. All my photos and documents\n3. Message history and conversations\n4. Matching preferences and activity\n5. Account settings and privacy preferences\n\nEmail associated with account: [Please specify]\nPhone number: [Please specify]'
              )}
              className="inline-block bg-white border-2 border-rose-500 text-rose-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-50 transition-all duration-200 shadow-lg"
            >
              Request Data Export
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm mt-4 border border-rose-100">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-white border-2 border-rose-400 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-sm">💝</span>
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 bg-clip-text text-transparent">
                    Shaadi
                  </span>
                  <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent ml-1">
                    Mantrana
                  </span>
                </h3>
                <div className="flex items-center justify-center space-x-1 mt-0.5">
                  <div className="w-5 h-0.5 bg-gradient-to-r from-rose-400 to-pink-400"></div>
                  <div className="w-1 h-1 bg-rose-400 rounded-full"></div>
                  <div className="w-5 h-0.5 bg-gradient-to-r from-pink-400 to-rose-400"></div>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-rose-600">v1.0 • 100% Free Platform</p>
              <p className="text-xs flex items-center justify-center space-x-3">
                <span className="flex items-center space-x-1">
                  <span>🔒</span>
                  <span>End-to-end encrypted</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>🛡️</span>
                  <span>HTTPS secured</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>📱</span>
                  <span>Play Store compliant</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}