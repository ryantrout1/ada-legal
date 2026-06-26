/**
 * PortalViewToggle — List / Board / Stats switch shared by the case views.
 * A labelled group of links; the active view is aria-current.
 */

import { Link } from 'react-router-dom';

const VIEWS = [
  { key: 'list', label: 'List', to: '/portal' },
  { key: 'board', label: 'Board', to: '/portal/board' },
  { key: 'stats', label: 'Stats', to: '/portal/pipeline' },
] as const;

const BASE =
  'inline-flex items-center justify-center min-h-[44px] px-4 text-sm font-medium border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export default function PortalViewToggle({ active }: { active: 'list' | 'board' | 'stats' }) {
  return (
    <div role="group" aria-label="Switch case view" className="inline-flex rounded-md overflow-hidden">
      {VIEWS.map((v, i) => {
        const on = v.key === active;
        const round =
          i === 0 ? 'rounded-l-md' : i === VIEWS.length - 1 ? 'rounded-r-md -ml-px' : '-ml-px';
        return (
          <Link
            key={v.key}
            to={v.to}
            aria-current={on ? 'page' : undefined}
            className={`${BASE} ${round} ${
              on
                ? 'bg-accent-500 text-white border-accent-500'
                : 'bg-white text-ink-700 border-control-border hover:bg-surface-100'
            }`}
          >
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}
