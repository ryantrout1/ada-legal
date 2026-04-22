/**
 * Plain-language labels for ADA classifications.
 *
 * AdaTitle values are technical codes ("I", "II", "III"). Users need
 * human labels. This module is the single source of truth for those
 * labels.
 *
 * Rules:
 *
 *   - shortLabel is what goes in a card header. Max ~30 chars.
 *   - plainDescription is one sentence. What this classification
 *     MEANS in real life, not what the law says.
 *   - technicalLabel is optional context, for users who want to
 *     look up the regulation themselves.
 *
 * Do not add "Title I / II / III" language into shortLabel. The
 * community uses those terms; many users do not. Lead with what
 * it IS.
 *
 * Ref: Step 18 plan, Commit 3.
 */

import type { AdaTitle } from '../../types/db.js';
import type { ClassificationLabel } from './types.js';

export function labelFor(title: AdaTitle): ClassificationLabel {
  switch (title) {
    case 'I':
      return {
        shortLabel: 'Workplace / Employment',
        plainDescription:
          'Disability discrimination at work is handled through the Equal Employment Opportunity Commission.',
        technicalLabel: 'Title I of the ADA',
      };
    case 'II':
      return {
        shortLabel: 'Government Services',
        plainDescription:
          'Accessibility issues with state or local government — city offices, public schools, transit, courthouses, DMVs — are handled by the Department of Justice.',
        technicalLabel: 'Title II of the ADA',
      };
    case 'III':
      return {
        shortLabel: 'Public Accommodation',
        plainDescription:
          'Private businesses serving the public — restaurants, stores, hotels, medical offices, websites — must be accessible under the ADA.',
        technicalLabel: 'Title III of the ADA',
      };
    case 'class_action':
      return {
        shortLabel: 'Possible Class Action',
        plainDescription:
          'Your experience may match a pattern that is being addressed in a class-action lawsuit. We are building this matching system now.',
        technicalLabel: 'Class-action pattern',
      };
    case 'out_of_scope':
      return {
        shortLabel: 'Not Covered by the ADA',
        plainDescription:
          'What you described is not an ADA matter, but it may still be covered by another law or regulation. The resources below can help point you the right direction.',
        technicalLabel: 'Outside the ADA',
      };
    case 'none':
      return {
        shortLabel: 'No Specific Issue Found',
        plainDescription:
          "Ada could not identify a specific legal issue based on what was shared, but the resources below can still help if you want to talk to someone.",
        technicalLabel: 'No classification',
      };
    default: {
      const _exhaustive: never = title;
      void _exhaustive;
      return {
        shortLabel: 'Not Classified',
        plainDescription: 'This session was not classified.',
        technicalLabel: '',
      };
    }
  }
}
