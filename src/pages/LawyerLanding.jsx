import React from 'react';
import LawyerHero from '../components/landing/LawyerHero';
import LawyerValueProps from '../components/landing/LawyerValueProps';
import LawyerHowItWorks from '../components/landing/LawyerHowItWorks';
import PricingSection from '../components/landing/PricingSection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import { createPageUrl } from '../utils';

export default function LawyerLanding() {
  return (
    <div>
      <style>{`
        .landing-cta:focus-visible {
          outline: 3px solid var(--accent-light);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
        @media (prefers-contrast: more) {
          .landing-cta { border: 2px solid currentColor !important; }
        }
      `}</style>
      <LawyerHero />
      <LawyerValueProps />
      <LawyerHowItWorks />
      <PricingSection />
      <FinalCTA
        heading="Ready to Grow Your ADA Practice?"
        subtitle="Apply today and start receiving pre-screened, exclusive cases matched to your jurisdiction."
        buttonText="Apply Now"
        buttonLink={createPageUrl('LawyerRegister')}
        variant="dark"
      />
      <LandingFooter />
    </div>
  );
}