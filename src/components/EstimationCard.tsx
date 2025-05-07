import * as React from 'react';
import { motion } from 'framer-motion';

const guidelines: Record<string, { short: string; long: string }> = {
  '?': {
    short: 'Not enough info',
    long: 'There is not enough information to estimate this item. Ask for clarification or more details.'
  },
  '1': {
    short: 'Trivial',
    long: 'Very simple, quick win, no unknowns. Should take minimal time and effort.'
  },
  '2': {
    short: 'Simple',
    long: 'Straightforward, low complexity, well understood. Should be quick to implement.'
  },
  '5': {
    short: 'Moderate',
    long: 'Some complexity or a few unknowns, but manageable. Requires some thought or coordination.'
  },
  '8': {
    short: 'Complex',
    long: 'Significant complexity, multiple unknowns, or dependencies. Will take notable effort.'
  },
  '13': {
    short: 'Very complex',
    long: 'High risk, lots of unknowns, or a large task. Consider breaking it down.'
  },
  '21': {
    short: 'Epic',
    long: 'Too large for a single sprint. Needs to be split or re-estimated.'
  }
};

export function EstimationCard({ value, selected, onSelect }: {
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  const [flipped, setFlipped] = React.useState(false);

  return (
    <motion.div
      className={`relative w-28 h-40 cursor-pointer select-none rounded-2xl bg-white/10 backdrop-blur border-2 transition-shadow duration-300 flex flex-col items-center justify-center shadow-xl ${selected ? 'border-cyan-400 shadow-cyan-600/40' : 'border-cyan-900/40'} group`}
      style={{ perspective: 900 }}
      onClick={() => onSelect(value)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        className="absolute inset-0 w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.4s',
          }}
        >
          <span className="text-5xl font-bold text-cyan-300 drop-shadow-lg">{value}</span>
          <span className="mt-2 text-cyan-200 text-xs font-medium opacity-80">{guidelines[value]?.short}</span>
        </motion.div>
        {/* Back Side */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/80 rounded-2xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: flipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            transition: 'transform 0.4s',
          }}
        >
          <span className="text-xs text-cyan-100 px-4 text-center">{guidelines[value]?.long}</span>
        </motion.div>
      </div>
      <div className={`absolute inset-0 rounded-2xl pointer-events-none ${selected ? 'ring-4 ring-cyan-400/60 animate-pulse' : ''}`}></div>
    </motion.div>
  );
}
