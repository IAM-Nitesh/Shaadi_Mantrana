'use client';

import React, { useState } from 'react';
import { EmailInvitationService, InvitationSummary } from '../../../services/email-invitation-service';

export default function AdminEmailInvitations() {
  const [adminKey, setAdminKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<InvitationSummary | null>(null);
  const [error, setError] = useState('');
  const [approvedEmails, setApprovedEmails] = useState<string[]>([]);
  const [showEmails, setShowEmails] = useState(false);

  const loadApprovedEmails = async () => {
    try {
      const emails = await EmailInvitationService.getApprovedEmails();
      setApprovedEmails(emails);
      setShowEmails(true);
    } catch (error: unknown) {
      setError(`Failed to load emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSendInvitations = async () => {
    setError('');
    setResults(null);

    if (!EmailInvitationService.validateAdminKey(adminKey)) {
      setError('Admin key must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const summary = await EmailInvitationService.sendInvitations(adminKey);
      setResults(summary);
      setError('');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmailPreview = () => {
    return EmailInvitationService.getEmailPreview();
  };

  const preview = getEmailPreview();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              📧 Admin Email Invitations
            </h1>
            <p className="text-rose-100">
              Send welcome emails to all approved users
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Admin Authentication */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-amber-800 mb-3">
                🔐 Admin Authentication
              </h2>
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Enter admin key..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-sm text-amber-700">
                  ⚠️ This key is required to authorize sending invitations to all approved users.
                </p>
              </div>
            </div>

            {/* Approved Emails Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-blue-800">
                  👥 Approved Email Addresses
                </h2>
                <button
                  onClick={loadApprovedEmails}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showEmails ? 'Refresh' : 'Load Emails'}
                </button>
              </div>
              
              {showEmails && (
                <div className="space-y-2">
                  <p className="text-blue-700 font-medium">
                    📊 Total Approved Emails: {approvedEmails.length}
                  </p>
                  <div className="bg-white border border-blue-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {approvedEmails.map((email, index) => (
                      <div key={index} className="flex items-center space-x-2 py-1">
                        <span className="text-green-600">✅</span>
                        <span className="text-gray-700 font-mono text-sm">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Email Preview */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-purple-800 mb-3">
                👁️ Email Preview
              </h2>
              <div className="space-y-3">
                <div className="bg-white border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Subject:</p>
                  <p className="font-semibold text-gray-800">{preview.subject}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-2">Features Highlighted:</p>
                    <ul className="space-y-1">
                      {preview.features.map((feature: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-white border border-purple-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-2">Getting Started Steps:</p>
                    <ol className="space-y-1">
                      {preview.steps.map((step: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                          <span className="text-purple-500 font-semibold">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                
                <div className="bg-white border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Support Contact: 
                    <span className="font-semibold text-purple-600 ml-1">{preview.support}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Send Invitations Button */}
            <div className="text-center">
              <button
                onClick={handleSendInvitations}
                disabled={isLoading || !adminKey}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all transform ${
                  isLoading || !adminKey
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 hover:scale-105 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending Invitations...</span>
                  </span>
                ) : (
                  '🚀 Send Invitations to All Approved Users'
                )}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600 text-xl">❌</span>
                  <p className="text-red-800 font-semibold">Error</p>
                </div>
                <p className="text-red-700 mt-2">{error}</p>
              </div>
            )}

            {/* Results Display */}
            {results && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-green-600 text-xl">✅</span>
                  <p className="text-green-800 font-semibold text-lg">Invitation Results</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{results.total}</p>
                    <p className="text-sm text-gray-600">Total Emails</p>
                  </div>
                  <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{results.sent}</p>
                    <p className="text-sm text-gray-600">Successfully Sent</p>
                  </div>
                  <div className="bg-white border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                </div>

                {results.results.length > 0 && (
                  <div className="bg-white border border-green-200 rounded-lg p-3">
                    <p className="font-semibold text-gray-700 mb-2">📋 Detailed Results:</p>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {results.results.map((result: { email: string; status: string; error?: string | null }, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0">
                          <span className="font-mono text-sm text-gray-700">{result.email}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-semibold ${
                              result.status === 'sent' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.status === 'sent' ? '✅ Sent' : '❌ Failed'}
                            </span>
                            {result.error && (
                              <span className="text-xs text-red-500" title={result.error}>
                                ⚠️
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
