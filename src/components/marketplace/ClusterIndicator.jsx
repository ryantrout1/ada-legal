import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function ClusterIndicator({ caseData }) {
  const count = caseData.ai_duplicate_cluster_size;
  if (!count || count < 2) return null;

  return (
    <div
      style={{
        backgroundColor: '#EFF6FF',
        borderRadius: '8px',
        padding: '8px 12px',
      }}
      aria-label={`${count} reports for this business. Multiple reports strengthen the legal case.`}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <BarChart3 size={14} aria-hidden="true" style={{ color: '#1D4ED8', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 600,
          color: '#1D4ED8',
        }}>
          {count} reports for this business
        </span>
      </div>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 400,
        color: '#475569', margin: '2px 0 0 20px', lineHeight: 1.4,
      }}>
        Multiple reports strengthen the legal case
      </p>
    </div>
  );
}