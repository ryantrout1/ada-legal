/**
 * Layer 1 test — parseNewMatterInput (POST /api/portal/cases body validation).
 *
 * Client name is the one required field; everything else is optional and
 * trimmed. A missing / blank / non-string client name is rejected so the
 * endpoint can answer 400 instead of writing a nameless matter.
 *
 * Encodes /plan "Add a matter" Phase 1 — acceptance criterion 5.
 */

import { describe, it, expect } from 'vitest';
import { parseNewMatterInput } from '@/engine/cases/newMatterInput';

describe('parseNewMatterInput', () => {
  it('accepts a full body and trims + passes optionals through', () => {
    const r = parseNewMatterInput({
      clientName: '  Jane Roe  ',
      clientEmail: 'jane@example.com',
      clientPhone: '555-0100',
      classificationTitle: 'Title III',
      jurisdictionState: 'AZ',
      defendantName: 'Acme Diner',
      note: 'Called the client.',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.client.name).toBe('Jane Roe');
      expect(r.value.client.email).toBe('jane@example.com');
      expect(r.value.classificationTitle).toBe('Title III');
      expect(r.value.jurisdictionState).toBe('AZ');
      expect(r.value.defendant?.name).toBe('Acme Diner');
      expect(r.value.openingNote).toBe('Called the client.');
    }
  });

  it('accepts a minimal body (client name only)', () => {
    const r = parseNewMatterInput({ clientName: 'Sam Vance' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.client.name).toBe('Sam Vance');
      expect(r.value.client.email).toBeNull();
      expect(r.value.defendant).toBeNull();
      expect(r.value.openingNote).toBeNull();
    }
  });

  it('rejects a missing, blank, or non-string client name', () => {
    expect(parseNewMatterInput({}).ok).toBe(false);
    expect(parseNewMatterInput({ clientName: '   ' }).ok).toBe(false);
    expect(parseNewMatterInput({ clientName: 123 }).ok).toBe(false);
    expect(parseNewMatterInput(null).ok).toBe(false);
  });
});
