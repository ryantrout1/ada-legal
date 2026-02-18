import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import OurPromise from '../components/landing/OurPromise';
import MissionQuote from '../components/landing/MissionQuote';
import ForAttorneysSection from '../components/landing/ForAttorneysSection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import { createPageUrl } from '../utils';

export default function Home() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkRole() {
      try {
        const user = await base44.auth.me();
        if (user?.role === 'user') {
          window.location.href = createPageUrl('MyCases');
          return;
        }
        if (user?.role === 'lawyer') {
          window.location.href = createPageUrl('Marketplace');
          return;
        }
        if (user?.role === 'admin') {
          window.location.href = createPageUrl('Admin');
          return;
        }
      } catch {
        // Not logged in — show landing page
      }
      setChecked(true);
    }
    checkRole();
  }, []);

  if (!checked) return null;

  return (
    <div role="region" aria-label="Landing page">
      <HeroSection />
      <HowItWorks />
      <OurPromise />
      <ForAttorneysSection />
      <MissionQuote />
      <FinalCTA
        heading="Ready to Take Action?"
        subtitle="Report your ADA violation today and connect with an attorney who can help — completely free."
        buttonText="Report a Violation"
        buttonLink={createPageUrl('Intake')}
      />
      <LandingFooter />
    </div>
  );
}