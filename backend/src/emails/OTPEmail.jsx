import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components';
import * as React from 'react';

const OTPEmail = ({ otp, userEmail }) => {
  return (
    <Html lang="en">
      <Head>
        <title>Verify Your Shaadi Mantra Account</title>
        <style>
          {`
            @keyframes glow { 
              0%, 100% { filter: drop-shadow(0 0 5px rgba(225, 29, 72, 0.3)); } 
              50% { filter: drop-shadow(0 0 20px rgba(225, 29, 72, 0.5)); } 
            }
            @keyframes urgentPulse { 
              0%, 100% { transform: scale(1); } 
              50% { transform: scale(1.02); } 
            }
          `}
        </style>
      </Head>
      <Body
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          lineHeight: 1.6,
          color: '#1e293b',
          background: 'linear-gradient(135deg, #fefcff 0%, #fdf4ff 30%, #fae8ff 70%, #f3e8ff 100%)',
          minHeight: '100vh',
          padding: '20px 0',
          margin: 0,
        }}
      >
        <Container style={{ maxWidth: '700px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.95)', borderRadius: '40px', boxShadow: '0 32px 64px -12px rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.08)', overflow: 'hidden' }}>
          
          {/* Hero Header */}
          <Section style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.95) 0%, rgba(225, 29, 72, 0.95) 50%, rgba(236, 72, 153, 0.95) 100%)', textAlign: 'center', padding: '64px 32px', position: 'relative' }}>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ fontSize: '96px', marginBottom: '24px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>🛡️</div>
              <Heading style={{ color: 'white', fontSize: '48px', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Verify Your Account</Heading>
              <Text style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '18px', fontWeight: '500' }}>Enter the verification code below to secure your account.</Text>
              <div style={{ display: 'inline-block', background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.25)', borderRadius: '25px', padding: '8px 16px', marginTop: '20px', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Verification Required</div>
            </div>
          </Section>

          {/* OTP Code Section */}
          <Section style={{ padding: '48px 32px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)', border: '2px solid rgba(244, 63, 94, 0.15)', borderRadius: '24px', padding: '40px', margin: '40px 0', textAlign: 'center', position: 'relative' }}>
              <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc2626', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '2px' }}>Verification Code</Text>
              <div style={{ fontSize: '80px', fontWeight: '900', color: '#dc2626', fontFamily: 'monospace', letterSpacing: '16px', margin: '20px 0', animation: 'glow 3s ease-in-out infinite' }}>{otp}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#dc2626', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', padding: '12px 20px', borderRadius: '25px', border: '1px solid #fecaca', fontWeight: '600', marginTop: '20px', animation: 'urgentPulse 2s ease-in-out infinite' }}>⏰ Expires in 10 minutes</div>
            </div>

            {/* Instructions */}
            <div style={{ background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%)', border: '1px solid #e2e8f0', borderLeft: '4px solid #f43f5e', padding: '24px', margin: '32px 0', borderRadius: '16px', textAlign: 'left', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '20px', background: 'white', padding: '10px', borderRadius: '50%', fontSize: '20px' }}>💡</div>
              <Heading style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', fontSize: '16px' }}>How to verify:</Heading>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px', marginTop: '2px' }}>✨</span>
                <Text style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>Open the Shaadi Mantra mobile app</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px', marginTop: '2px' }}>✨</span>
                <Text style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>Navigate to the verification screen</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px', marginTop: '2px' }}>✨</span>
                <Text style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>Enter the 6-digit code shown above</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '18px', marginTop: '2px' }}>✨</span>
                <Text style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>Tap "Verify" to activate your account</Text>
              </div>
            </div>

            {/* Call to Action */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Button 
                href="#" 
                style={{ 
                  background: 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)', 
                  color: 'white', 
                  fontWeight: 'bold', 
                  padding: '16px 40px', 
                  borderRadius: '25px', 
                  textDecoration: 'none', 
                  display: 'inline-block', 
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)' 
                }}
              >
                Open App to Verify
              </Button>
            </div>
          </Section>

          {/* Footer */}
          <Hr style={{ border: 'none', borderTop: '1px solid #e5e7eb' }} />
          <Section style={{ textAlign: 'center', padding: '20px' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>Didn't request this code? You can safely ignore this email.</Text>
            <Text style={{ fontSize: '14px', color: '#6b7280' }}>Need help? Contact us at <span style={{ color: '#f43f5e', fontWeight: '600' }}>support@shaadimantra.com</span></Text>
            <Text style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>© 2025 Shaadi Mantra. All rights reserved.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OTPEmail; 