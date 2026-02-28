import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import LandingStyles from '../components/landing/LandingStyles';
import LandingHeroNew from '../components/landing/LandingHeroNew';
import StoriesSection from '../components/landing/StoriesSection';
import HowItWorksNew from '../components/landing/HowItWorksNew';
import KnowYourRightsSection from '../components/landing/KnowYourRightsSection';
import CommitmentSection from '../components/landing/CommitmentSection';
import OurStorySection from '../components/landing/OurStorySection';
import ForAttorneysNew from '../components/landing/ForAttorneysNew';
import FinalCTANew from '../components/landing/FinalCTANew';
import CommunityVoices from '../components/landing/CommunityVoices';

export default function Home() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Allow logged-in users to view the landing page via ?view=home
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'home') {
      setChecked(true);
      return;
    }

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
    <div style={{ background: '#141820' }}>
      <LandingStyles />
      <LandingHeroNew />
      <StoriesSection />
      <CommunityVoices />
      <HowItWorksNew />
      <KnowYourRightsSection />
      <CommitmentSection />
      <OurStorySection />
      <ForAttorneysNew />
      <FinalCTANew />
    </div>
  );
}