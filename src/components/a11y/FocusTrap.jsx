import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive, onEscape) {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the element that triggered the modal
    triggerRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const container = containerRef.current;
    if (!container) return;

    // Focus first focusable element (but not the confirm button)
    const focusable = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      // Focus the cancel button or first non-primary button
      const cancelBtn = Array.from(focusable).find(
        el => el.textContent.toLowerCase().includes('cancel') || el.textContent.toLowerCase().includes('back')
      );
      setTimeout(() => (cancelBtn || focusable[0]).focus(), 50);
    }

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }
      if (e.key === 'Tab') {
        const focusableEls = container.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableEls.length === 0) return;
        const first = focusableEls[0];
        const last = focusableEls[focusableEls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      // Return focus to trigger
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isActive, onEscape]);

  return containerRef;
}