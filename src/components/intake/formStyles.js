// Shared form input styles and handlers for intake wizard steps
// Extracted to eliminate 4-way duplication across step components

export const inputStyle = {
  width: '100%',
  minHeight: '44px',
  padding: '0.625rem 0.75rem',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '1rem',
  color: 'var(--heading)',
  backgroundColor: 'var(--surface)',
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box'
};

export const focusHandler = (e) => {
  e.target.style.borderColor = '#1D4ED8';
  e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.15)';
};

export const blurHandler = (e) => {
  e.target.style.borderColor = 'var(--border)';
  e.target.style.boxShadow = 'none';
};

// Selected state background for radio/checkbox labels
// Uses CSS token instead of hardcoded #FFF8F5 for display-mode compatibility
export const SELECTED_BG = 'var(--card-bg-tinted)';
