import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import LandingStyles from '../components/landing/LandingStyles';
import LandingHeroNew from '../components/landing/LandingHeroNew';
import StoriesSection from '../components/landing/StoriesSection';
import HowItWorksNew from '../components/landing/HowItWorksNew';
import KnowYourRightsSection from '../components/landing/KnowYourRightsSection';
import CommitmentSection from '../components/landing/CommitmentSection';
import ForAttorneysNew from '../components/landing/ForAttorneysNew';
import FinalCTANew from '../components/landing/FinalCTANew';
import CommunityVoices from '../components/landing/CommunityVoices';

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
          window.location.href = createPageUrl('AdminCases');
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
    <>
      <LandingStyles />
      <LandingHeroNew />
      <StoriesSection />
      <CommunityVoices />
      <HowItWorksNew />
      <KnowYourRightsSection />
      <CommitmentSection />
      <ForAttorneysNew />
      <FinalCTANew />
    </>
  );
}