import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { playSpatialSwitch } from '../lib/spatialAudio';
import { ChessSection } from '../sections/ChessSection';

export function InterestsPage() {
  return (
    <div className="pt-2 pb-28">
      <div className="mx-auto mb-4 flex max-w-[1120px] justify-end px-6 sm:px-8 lg:px-10">
        <Link
          to="/game"
          onClick={() => playSpatialSwitch()}
          className="liquid-glass liquid-glass-interactive inline-flex h-9 items-center gap-2 rounded-full px-4 text-xs font-medium text-ink"
        >
          <span>♞ Play Knight&apos;s Sprint</span>
          <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        </Link>
      </div>
      <ChessSection />
    </div>
  );
}
