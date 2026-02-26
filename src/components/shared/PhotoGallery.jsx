import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PhotoGallery({ photos = [] }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const overlayRef = useRef(null);
  const closeRef = useRef(null);

  const isOpen = lightboxIndex !== null;

  const openPhoto = useCallback((index) => { setLightboxIndex(index); }, []);
  const closePhoto = useCallback(() => { setLightboxIndex(null); }, []);
  const prevPhoto = useCallback(() => { setLightboxIndex(i => (i > 0 ? i - 1 : photos.length - 1)); }, [photos.length]);
  const nextPhoto = useCallback(() => { setLightboxIndex(i => (i < photos.length - 1 ? i + 1 : 0)); }, [photos.length]);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') closePhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [isOpen, closePhoto, prevPhoto, nextPhoto]);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
          color: '#475569'
        }}>
          <Camera size={14} aria-hidden="true" style={{ color: '#434E5E' }} />
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </div>
        {photos.map((photo, i) => {
          const src = typeof photo === 'string' ? photo : photo?.data;
          if (!src) return null;
          return (
            <button
              key={i}
              type="button"
              onClick={() => openPhoto(i)}
              aria-label={`View photo ${i + 1} of ${photos.length}`}
              style={{
                width: '56px', height: '56px', borderRadius: '8px',
                overflow: 'hidden', border: '1px solid var(--slate-200)',
                cursor: 'pointer', padding: 0, background: 'var(--slate-100)',
                flexShrink: 0, outline: 'none', transition: 'border-color 0.15s'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#C2410C'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(194,65,12,0.15)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <img
                src={src}
                alt={`Violation photo ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          );
        })}
      </div>

      {isOpen && (() => {
        const currentSrc = typeof photos[lightboxIndex] === 'string' ? photos[lightboxIndex] : photos[lightboxIndex]?.data;
        return (
          <div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Photo ${lightboxIndex + 1} of ${photos.length}`}
            onClick={(e) => { if (e.target === overlayRef.current) closePhoto(); }}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '2rem'
            }}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={closePhoto}
              aria-label="Close photo viewer"
              style={{
                position: 'absolute', top: '16px', right: '16px',
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.1)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', zIndex: 10
              }}
            >
              <X size={22} />
            </button>

            {photos.length > 1 && (
              <button
                type="button"
                onClick={prevPhoto}
                aria-label="Previous photo"
                style={{
                  position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                  width: '44px', height: '44px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.1)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', zIndex: 10
                }}
              >
                <ChevronLeft size={22} />
              </button>
            )}

            <img
              src={currentSrc}
              alt={`Violation photo ${lightboxIndex + 1} of ${photos.length}`}
              style={{
                maxWidth: '90vw', maxHeight: '85vh',
                objectFit: 'contain', borderRadius: '8px'
              }}
            />

            {photos.length > 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                aria-label="Next photo"
                style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  width: '44px', height: '44px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.1)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', zIndex: 10
                }}
              >
                <ChevronRight size={22} />
              </button>
            )}

            <div style={{
              position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.7)'
            }}>
              {lightboxIndex + 1} / {photos.length}
            </div>
          </div>
        );
      })()}
    </>
  );
}