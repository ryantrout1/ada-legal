import React from 'react';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import OurPromise from '../components/landing/OurPromise';
import MissionQuote from '../components/landing/MissionQuote';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import { createPageUrl } from '../utils';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <HowItWorks />
      <OurPromise />
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