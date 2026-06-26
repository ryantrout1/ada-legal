/**
 * PortalViewToggle — List / Board switch shared by the queue and the board.
 * A labelled tablist of two links; the active view is aria-current.
 */

import { Link } from 'react-router-dom';

const BASE =
  'inline-flex items-center justify-center min-h-[44px] px-4 text-sm font-medium border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export default function PortalViewToggle({ active }: { active: 'list' | 'board' }) {
  return (
    <div role="group" aria-label="Switch case view" className="inline-flex rounded-md overflow-hidden">
      <Link
        to="/portal"
        aria-current={active === 'list' ? 'page' : undefined}
        className={`${BASE} rounded-l-md ${
          active === 'list'
            ? 'bg-accent-500 text-white border-accent-500'
            : 'bg-white text-ink-700 border-surface-200 hover:bg-surface-100'
        }`}
      >
        List
      </Link>
      <Link
        to="/portal/board"
        aria-current={active === 'board' ? 'page' : undefined}
        className={`${BASE} rounded-r-md -ml-px ${
          active === 'board'
            ? 'bg-accent-500 text-white border-accent-500'
            : 'bg-white text-ink-700 border-surface-200 hover:bg-surface-100'
        }`}
      >
        Board
      </Link>
    </div>
  );
}
