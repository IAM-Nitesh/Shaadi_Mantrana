import { Html, Head, Body, Container, Section, Heading, Text, Hr, Button, Link } from '@react-email/components';
import * as React from 'react';

const WelcomeEmail = ({ userEmail, inviteLink, userUuid }) => {
  return (
    <Html>
      <Head>
        <title>Welcome to Shaadi Mantra - Your Journey Begins!</title>
        <style>
          {`
            @keyframes bounce { 
              0%, 20%, 50%, 80%, 100% { transform: translateY(0) rotate(0deg); } 
              10% { transform: translateY(-15px) rotate(-5deg); } 
              30% { transform: translateY(-10px) rotate(5deg); } 
              60% { transform: translateY(-5px) rotate(-3deg); } 
              90% { transform: translateY(-2px) rotate(3deg); } 
            }
          `}
        </style>
      </Head>
      <Body style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", lineHeight: 1.6, color: '#374151', background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #fbcfe8 70%, #f3e8ff 100%)', minHeight: '100vh', padding: '20px', margin: 0 }}>
        <Container style={{ maxWidth: '650px', margin: '0 auto', background: 'white', borderRadius: '32px', boxShadow: '0 20px 40px rgba(244, 63, 94, 0.12)', border: '1px solid #fce7f3', overflow: 'hidden' }}>
          
          {/* Hero Header */}
          <Section style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #ec4899 100%)', padding: '48px 32px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ fontSize: '80px', marginBottom: '16px', animation: 'bounce 2s ease-in-out infinite' }}>🎉</div>
              <Heading style={{ fontSize: '48px', fontWeight: '800', marginBottom: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Welcome!</Heading>
              <Text style={{ fontSize: '18px', opacity: 0.95, fontWeight: '400' }}>Your journey to forever starts here</Text>
            </div>
          </Section>

          {/* Main Content */}
          <Section style={{ padding: '48px' }}>
            {/* Welcome Message */}
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <Heading style={{ fontSize: '32px', fontWeight: '700', color: '#374151', marginBottom: '20px' }}>You're now part of Shaadi Mantra!</Heading>
              <Text style={{ fontSize: '16px', color: '#6b7280', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                We're thrilled to have you join our exclusive community of individuals looking for meaningful relationships. Your perfect match is just a few steps away.
              </Text>
            </div>

            {/* Getting Started Steps */}
            <div style={{ marginBottom: '56px' }}>
              <Heading style={{ fontSize: '24px', fontWeight: '700', color: '#374151', textAlign: 'center', marginBottom: '40px' }}>Let's get you started in 3 simple steps:</Heading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {[
                  {
                    number: '1',
                    title: 'Complete Your Profile',
                    desc: 'Add photos, write about yourself, and share your preferences to help us find your perfect match.',
                  },
                  {
                    number: '2',
                    title: 'Set Your Preferences',
                    desc: "Tell us what you're looking for in a partner - age, location, interests, and relationship goals.",
                  },
                  {
                    number: '3',
                    title: 'Start Connecting',
                    desc: 'Browse compatible profiles, send likes, and start meaningful conversations with potential matches.',
                  },
                ].map((step) => (
                  <div key={step.number} style={{ display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', border: '1px solid #fecdd3', borderRadius: '16px', padding: '64px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', color: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '38px', marginRight: '48px', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)', flexShrink: 0 }}>{step.number}</div>
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: '#374151', fontSize: '16px', marginBottom: '8px' }}>{step.title}</Text>
                      <Text style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{step.desc}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Hr style={{ height: '1px', background: 'linear-gradient(to right, transparent, #e2e8f0, transparent)', border: 'none', margin: '40px 0' }} />

            {/* Features Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '56px' }}>
              {[
                {
                  icon: '🔒',
                  title: 'Secure & Private',
                  desc: 'Your privacy is our priority with verified profiles and secure messaging.',
                },
                {
                  icon: '💖',
                  title: 'Smart Matching',
                  desc: 'AI-powered compatibility algorithm considers values, interests, and lifestyle.',
                },
                {
                  icon: '⭐',
                  title: 'Premium Experience',
                  desc: 'Exclusive features designed for serious relationships and long-term commitment.',
                },
                {
                  icon: '📱',
                  title: 'Mobile First',
                  desc: 'Seamless experience across all devices with our intuitive mobile app.',
                },
              ].map((feature) => (
                <div key={feature.title} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '64px', textAlign: 'center' }}>
                  <div style={{ width: '96px', height: '96px', background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px', margin: '0 auto 48px', boxShadow: '0 4px 15px rgba(244, 63, 94, 0.2)', flexShrink: 0 }}>{feature.icon}</div>
                  <Text style={{ fontWeight: '600', color: '#374151', fontSize: '16px', marginBottom: '36px' }}>{feature.title}</Text>
                  <Text style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{feature.desc}</Text>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div style={{ background: 'linear-gradient(135deg, #fef7ff 0%, #fae8ff 100%)', border: '2px solid #f3e8ff', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '40px' }}>
              <Heading style={{ fontSize: '20px', fontWeight: '700', color: '#374151', marginBottom: '16px' }}>Ready to find your perfect match?</Heading>
              <Text style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
                Download our mobile app or continue in your web browser to start your journey.
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
                <Button href="#" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', color: 'white', padding: '16px 32px', borderRadius: '25px', fontWeight: '600', fontSize: '16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(244, 63, 94, 0.4)' }}>📱 Download Mobile App</Button>
                <Button href={inviteLink} style={{ background: 'white', color: '#f43f5e', padding: '16px 32px', borderRadius: '25px', fontWeight: '600', fontSize: '16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '2px solid #f43f5e' }}>🌐 Continue in Browser</Button>
              </div>
            </div>
          </Section>

          {/* Footer */}
          <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '32px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              <strong>Shaadi Mantra</strong> - Where meaningful relationships begin
            </Text>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
              {['📧', '📱', '🌐', '💬'].map((icon) => (
                <Link href="#" key={icon} style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', textDecoration: 'none' }}>{icon}</Link>
              ))}
            </div>
            <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              Need help getting started? Contact us at 
              <Link href="mailto:support@shaadimantra.com" style={{ color: '#f43f5e', fontWeight: '500', textDecoration: 'none' }}> support@shaadimantra.com</Link>
            </Text>
            <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
              © 2025 Shaadi Mantra. All rights reserved.<br />
              You received this email because you signed up for Shaadi Mantra.
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail; 