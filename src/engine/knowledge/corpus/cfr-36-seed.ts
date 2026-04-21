/**
 * Seed corpus for Ada's knowledge base.
 *
 * Source: 28 CFR Part 36 (ADA Title III — Nondiscrimination on the
 * Basis of Disability by Public Accommodations and in Commercial
 * Facilities). This is the highest-volume section of the ADA for
 * consumer-facing questions.
 *
 * The authoritative corpus lives in cfr-36-seed.json (source of truth).
 * This TS file is a typed re-export so the engine code can import
 * RawSection[] with type safety. The ingestion script also reads
 * the JSON directly — see scripts/ingest-knowledge.mjs.
 *
 * tsconfig has resolveJsonModule enabled already.
 */

import type { RawSection } from '../chunking.js';
import corpus from './cfr-36-seed.json' with { type: 'json' };

export const SEED_CORPUS: RawSection[] = corpus as RawSection[];
