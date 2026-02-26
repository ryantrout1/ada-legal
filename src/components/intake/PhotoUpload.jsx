import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, Upload } from 'lucide-react';

const MAX_PHOTOS = 3;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export default function PhotoUpload({ photos = [], onChange }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const processFiles = useCallback((files) => {
    setError('');
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }

    const validFiles = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
        setError('Only JPEG, PNG, WebP, and HEIC images are accepted.');
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`Each photo must be under ${MAX_SIZE_MB}MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    Promise.all(validFiles.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, data: reader.result, file: file });
      reader.readAsDataURL(file);
    }))).then(results => {
      onChange([...photos, ...results]);
    });
  }, [photos, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  }, [processFiles]);

  const removePhoto = useCallback((index) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
    setError('');
  }, [photos, onChange]);

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <div>
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Upload photo. ${photos.length} of ${MAX_PHOTOS} added.`}
          style={{
            border: `2px dashed ${dragOver ? '#C2410C' : 'var(--slate-300)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            backgroundColor: dragOver ? '#FFF8F5' : 'var(--surface)',
            outline: 'none',
            minHeight: '44px'
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#C2410C'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(194,65,12,0.15)'; }}
          onBlur={e => { if (!dragOver) { e.currentTarget.style.borderColor = 'var(--slate-300)'; e.currentTarget.style.boxShadow = 'none'; } }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.heic"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: dragOver ? 'var(--terra-100)' : 'var(--slate-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', transition: 'background 0.15s'
          }}>
            {dragOver
              ? <Upload size={22} aria-hidden="true" style={{ color: '#C2410C' }} />
              : <Camera size={22} aria-hidden="true" style={{ color: 'var(--slate-500)' }} />
            }
          </div>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            fontWeight: 600, color: 'var(--slate-700)', margin: '0 0 4px'
          }}>
            {dragOver ? 'Drop photos here' : 'Tap or click to add photos'}
          </p>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
            color: 'var(--slate-500)', margin: 0
          }}>
            Up to {MAX_PHOTOS} photos, {MAX_SIZE_MB}MB each. JPG, PNG, or WebP.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: '#B91C1C', margin: '8px 0 0', lineHeight: 1.4
        }}>
          {error}
        </p>
      )}

      {photos.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '10px', marginTop: '12px'
        }}>
          {photos.map((photo, i) => (
            <div key={i} style={{
              position: 'relative', borderRadius: '10px', overflow: 'hidden',
              border: '1px solid var(--slate-200)', aspectRatio: '1',
              backgroundColor: 'var(--slate-100)'
            }}>
              <img
                src={photo.data}
                alt={`Uploaded photo ${i + 1}: ${photo.name}`}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  display: 'block'
                }}
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={`Remove photo ${i + 1}: ${photo.name}`}
                style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.6)', border: 'none',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  padding: 0, minWidth: '36px', minHeight: '36px'
                }}
              >
                <X size={14} style={{ color: 'white' }} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
          color: 'var(--slate-500)', margin: '8px 0 0'
        }}>
          {photos.length} of {MAX_PHOTOS} photos added
          {canAddMore && ' — click above to add more'}
        </p>
      )}
    </div>
  );
}