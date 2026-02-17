import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Scale, Shield, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--slate-900) 0%, var(--slate-800) 100%)',
        color: 'white',
        padding: '4rem 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            marginBottom: '1.5rem',
            color: 'white'
          }}>
            Stand Up For Your Rights
          </h1>
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '2rem',
            color: 'var(--slate-300)',
            maxWidth: '700px',
            margin: '0 auto 2rem'
          }}>
            Connect with experienced ADA attorneys who can help you fight discrimination and secure the access you deserve.
          </p>
          <Link
            to={createPageUrl('Intake')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--terra-600)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '1.125rem',
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: '44px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--terra-700)'}
            onMouseLeave={(e) => e.target.style.background = 'var(--terra-600)'}
          >
            Report a Violation
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '4rem auto',
        padding: '0 1.5rem'
      }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '2rem',
          textAlign: 'center',
          marginBottom: '3rem',
          color: 'var(--slate-900)'
        }}>
          How It Works
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{
            background: 'var(--surface)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--terra-100)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Scale size={32} style={{ color: 'var(--terra-600)' }} />
            </div>
            <h3 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
              color: 'var(--slate-900)'
            }}>
              Submit Your Case
            </h3>
            <p style={{ color: 'var(--slate-600)', lineHeight: 1.6 }}>
              Tell us about the ADA violation you experienced through our simple, guided form.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--terra-100)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Shield size={32} style={{ color: 'var(--terra-600)' }} />
            </div>
            <h3 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
              color: 'var(--slate-900)'
            }}>
              We Review
            </h3>
            <p style={{ color: 'var(--slate-600)', lineHeight: 1.6 }}>
              Our team reviews your submission to ensure quality and completeness.
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--terra-100)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Users size={32} style={{ color: 'var(--terra-600)' }} />
            </div>
            <h3 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
              color: 'var(--slate-900)'
            }}>
              Get Matched
            </h3>
            <p style={{ color: 'var(--slate-600)', lineHeight: 1.6 }}>
              An experienced ADA attorney claims your case and contacts you directly.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'var(--terra-100)',
        padding: '4rem 1.5rem',
        textAlign: 'center',
        marginTop: '4rem'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: '2rem',
            marginBottom: '1rem',
            color: 'var(--slate-900)'
          }}>
            Ready to Take Action?
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--slate-700)',
            marginBottom: '2rem'
          }}>
            Report your ADA violation today and connect with an attorney who can help.
          </p>
          <Link
            to={createPageUrl('Intake')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--terra-600)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '1.125rem',
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: '44px'
            }}
          >
            Get Started
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}