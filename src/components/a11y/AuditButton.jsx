import React, { useState, useEffect } from 'react';
import AuditPanel from './AuditPanel';

const IS_DEV = window.location.hostname === 'localhost' 
  || window.location.hostname.includes('preview') 
  || window.location.hostname.includes('base44')
  || window.location.port !== '';

function loadAxe() {
  return new Promise((resolve, reject) => {
    if (window.axe) { resolve(window.axe); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
    s.onload = () => resolve(window.axe);
    s.onerror = () => reject(new Error('Failed to load axe-core'));
    document.head.appendChild(s);
  });
}

export default function AuditButton({ currentPageName }) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [siteResults, setSiteResults] = useState(null);
  const [runningSite, setRunningSite] = useState(false);
  const [siteProgress, setSiteProgress] = useState('');
  const [highlightedEl, setHighlightedEl] = useState(null);

  // Cleanup highlighted element on close
  useEffect(() => {
    if (!open && highlightedEl) {
      highlightedEl.style.outline = highlightedEl.__prevOutline || '';
      highlightedEl.style.outlineOffset = highlightedEl.__prevOutlineOffset || '';
      setHighlightedEl(null);
    }
  }, [open]);

  if (!IS_DEV) return null;

  const runAudit = async () => {
    setRunning(true);
    setResults(null);
    const axe = await loadAxe();
    const res = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }
    });
    setResults({
      page: currentPageName || window.location.pathname,
      url: window.location.href,
      violations: res.violations,
      passes: res.passes.length,
      incomplete: res.incomplete.length,
      timestamp: new Date().toISOString()
    });
    setRunning(false);
  };

  const handleOpen = () => {
    setOpen(true);
    if (!results) runAudit();
  };

  const highlightElement = (selector) => {
    // Remove previous highlight
    if (highlightedEl) {
      highlightedEl.style.outline = highlightedEl.__prevOutline || '';
      highlightedEl.style.outlineOffset = highlightedEl.__prevOutlineOffset || '';
    }
    try {
      const el = document.querySelector(selector);
      if (el) {
        el.__prevOutline = el.style.outline;
        el.__prevOutlineOffset = el.style.outlineOffset;
        el.style.outline = '3px solid #DC2626';
        el.style.outlineOffset = '2px';
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedEl(el);
      }
    } catch { /* invalid selector */ }
  };

  const SITE_PAGES = [
    { name: 'Home', path: '/Home' },
    { name: 'Intake', path: '/Intake' },
    { name: 'MyCases', path: '/MyCases' },
    { name: 'Marketplace', path: '/Marketplace' },
    { name: 'LawyerDashboard', path: '/LawyerDashboard' },
    { name: 'LawyerProfile', path: '/LawyerProfile' },
    { name: 'Admin', path: '/Admin' },
    { name: 'AdminReview', path: '/AdminReview' },
    { name: 'AdminCases', path: '/AdminCases' },
    { name: 'AdminAnalytics', path: '/AdminAnalytics' },
    { name: 'AdminLawyers', path: '/AdminLawyers' }
  ];

  const runSiteAudit = async () => {
    setRunningSite(true);
    setSiteResults(null);
    const axe = await loadAxe();
    const allResults = [];

    for (const page of SITE_PAGES) {
      setSiteProgress(`Auditing ${page.name}...`);
      // We can only audit the current page client-side; 
      // for a full-site audit we run axe on an iframe
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1280px;height:900px;border:none;';
      iframe.src = page.path;
      document.body.appendChild(iframe);

      try {
        await new Promise((resolve, reject) => {
          iframe.onload = resolve;
          iframe.onerror = reject;
          setTimeout(resolve, 8000); // timeout after 8s
        });
        // Wait a moment for JS to render
        await new Promise(r => setTimeout(r, 2000));

        // Inject axe into iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const script = iframeDoc.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
        iframeDoc.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
          setTimeout(resolve, 5000);
        });

        if (iframe.contentWindow.axe) {
          const res = await iframe.contentWindow.axe.run(iframeDoc, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }
          });
          allResults.push({
            page: page.name,
            violations: res.violations,
            passes: res.passes.length,
            incomplete: res.incomplete.length
          });
        } else {
          allResults.push({ page: page.name, violations: [], passes: 0, incomplete: 0, error: 'axe failed to load' });
        }
      } catch {
        allResults.push({ page: page.name, violations: [], passes: 0, incomplete: 0, error: 'Page failed to load' });
      }
      document.body.removeChild(iframe);
    }

    // Compile summary
    const totalViolations = allResults.reduce((sum, r) => sum + r.violations.length, 0);
    const totalPasses = allResults.reduce((sum, r) => sum + r.passes, 0);
    const violationMap = {};
    allResults.forEach(r => {
      r.violations.forEach(v => {
        if (!violationMap[v.id]) violationMap[v.id] = { ...v, pages: [], totalNodes: 0 };
        violationMap[v.id].pages.push(r.page);
        violationMap[v.id].totalNodes += v.nodes.length;
      });
    });
    const commonViolations = Object.values(violationMap).sort((a, b) => b.totalNodes - a.totalNodes);
    const score = totalPasses > 0 ? Math.round((totalPasses / (totalPasses + totalViolations)) * 100) : 100;

    setSiteResults({
      pages: allResults,
      totalViolations,
      totalPasses,
      commonViolations,
      score,
      timestamp: new Date().toISOString()
    });
    setSiteProgress('');
    setRunningSite(false);
  };

  return (
    <>
      {/* Floating button */}
      <div role="complementary" aria-label="Accessibility tools" style={{ position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 9999 }}>
      <button
        onClick={handleOpen}
        aria-label="Open accessibility audit"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#1D4ED8',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.15s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        ♿
      </button>
      </div>

      {/* Panel */}
      {open && (
        <AuditPanel
          results={results}
          running={running}
          siteResults={siteResults}
          runningSite={runningSite}
          siteProgress={siteProgress}
          currentPageName={currentPageName}
          onClose={() => setOpen(false)}
          onRerun={runAudit}
          onRunSiteAudit={runSiteAudit}
          onHighlight={highlightElement}
        />
      )}
    </>
  );
}