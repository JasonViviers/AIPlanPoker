import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Check, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';

interface Vote {
  userId: string;
  userName: string;
  estimate: number;
}

interface VoteSummaryCardProps {
  storyId: string;
  storyTitle: string;
  storyDescription: string;
  votes: Vote[];
  suggestedEstimate: number;
  finalEstimate: number | null;
  aiNotes?: string;
  onFinalize: (estimate: number) => void;
}

export const VoteSummaryCard: FC<VoteSummaryCardProps> = ({
  storyTitle,
  storyDescription,
  votes,
  suggestedEstimate,
  finalEstimate,
  aiNotes = "This story seems to involve moderate complexity based on the description. Consider breaking down larger tasks into smaller components.",
  onFinalize
}) => {
  // Always start expanded for better visibility
  const [expanded, setExpanded] = useState(true);
  // Calculate average vote
  const validVotes = votes.filter(v => !isNaN(v.estimate) && v.estimate > 0);
  const averageVote = validVotes.length > 0 
    ? Math.round(validVotes.reduce((sum, v) => sum + v.estimate, 0) / validVotes.length) 
    : null;
  
  // Count vote frequencies
  const voteFrequency: Record<number, number> = {};
  validVotes.forEach(vote => {
    voteFrequency[vote.estimate] = (voteFrequency[vote.estimate] || 0) + 1;
  });
  
  // Find most common vote
  let mostCommonVote: number | null = null;
  let highestFrequency = 0;
  
  Object.entries(voteFrequency).forEach(([estimate, frequency]) => {
    if (frequency > highestFrequency) {
      highestFrequency = frequency;
      mostCommonVote = parseInt(estimate);
    }
  });

  // Get consensus percentage
  const consensusPercentage = validVotes.length > 0 
    ? Math.round((highestFrequency / validVotes.length) * 100) 
    : 0;

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="bg-cyan-950/40 border border-cyan-700 rounded-xl p-6 shadow-lg"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-cyan-100">{storyTitle}</h3>
          <p className="text-cyan-300 text-sm mt-1">{storyDescription}</p>
        </div>
        <div className="flex items-center gap-3">
          {finalEstimate !== null && (
            <div className="flex flex-col items-center bg-cyan-800/50 px-4 py-2 rounded-lg">
              <span className="text-cyan-300 text-xs">Final Estimate</span>
              <span className="text-2xl font-bold text-cyan-100">{finalEstimate}</span>
            </div>
          )}
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="p-2 rounded-full hover:bg-cyan-800/30 transition-colors bg-cyan-900/30"
            aria-label={expanded ? "Collapse details" : "Expand details"}
            title={expanded ? "Collapse details" : "Expand details"}
          >
            {expanded ? <ChevronUp className="text-cyan-300" /> : <ChevronDown className="text-cyan-300" />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <motion.div variants={item} className="bg-cyan-900/30 rounded-lg p-3 flex items-center">
              <Users className="h-5 w-5 text-cyan-400 mr-2" />
              <div>
                <div className="text-xs text-cyan-400">Team Votes</div>
                <div className="text-lg font-semibold text-cyan-100">{validVotes.length} votes</div>
              </div>
            </motion.div>

            <motion.div variants={item} className="bg-cyan-900/30 rounded-lg p-3 flex items-center">
              <BarChart2 className="h-5 w-5 text-cyan-400 mr-2" />
              <div>
                <div className="text-xs text-cyan-400">Average</div>
                <div className="text-lg font-semibold text-cyan-100">{averageVote || '-'}</div>
              </div>
            </motion.div>

            <motion.div variants={item} className="bg-cyan-900/30 rounded-lg p-3 flex items-center">
              <Brain className="h-5 w-5 text-cyan-400 mr-2" />
              <div>
                <div className="text-xs text-cyan-400">AI Suggested</div>
                <div className="text-lg font-semibold text-cyan-100">{suggestedEstimate}</div>
              </div>
            </motion.div>
          </div>

          {finalEstimate === null && (
            <motion.div variants={item} className="mb-6">
              <div className="bg-cyan-900/20 border border-cyan-800 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Brain className="h-5 w-5 text-cyan-400 mr-2" />
                  <span className="text-cyan-200 font-medium">AI Notes</span>
                </div>
                <p className="text-cyan-300 text-sm">{aiNotes}</p>
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="mb-4">
            <h4 className="text-sm font-medium text-cyan-200 mb-2">Vote Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(voteFrequency).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([estimate, count]) => (
                <div 
                  key={estimate} 
                  className={`px-3 py-1 rounded-lg flex items-center ${parseInt(estimate) === mostCommonVote ? 'bg-cyan-600/50 border border-cyan-500' : 'bg-cyan-800/30'}`}
                >
                  <span className="text-cyan-100 font-medium mr-1">{estimate}</span>
                  <span className="text-xs text-cyan-300">({count})</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap gap-2">
            {votes.map((vote, index) => (
              <div key={index} className="px-2 py-1 bg-cyan-900/40 rounded text-xs text-cyan-300">
                {vote.userName || `User ${index + 1}`}: {vote.estimate}
              </div>
            ))}
          </motion.div>
        </>
      )}

      {finalEstimate === null && expanded && (
        <motion.div variants={item} className="mt-6 flex justify-between items-center">
          <div className="text-cyan-300 text-sm">
            <span className="font-medium text-cyan-200">{consensusPercentage}%</span> consensus on {mostCommonVote}
          </div>
          <div className="flex gap-2">
            {mostCommonVote !== null && (
              <button
                onClick={() => mostCommonVote !== null && onFinalize(mostCommonVote)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center text-sm"
              >
                <Check className="h-4 w-4 mr-1" />
                Accept Consensus ({mostCommonVote})
              </button>
            )}
            {averageVote !== null && averageVote !== mostCommonVote && (
              <button
                onClick={() => averageVote !== null && onFinalize(averageVote)}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm"
              >
                Use Average ({averageVote})
              </button>
            )}
            {suggestedEstimate !== null && (
              <button
                onClick={() => onFinalize(suggestedEstimate)}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg flex items-center text-sm"
              >
                <Brain className="h-4 w-4 mr-1" />
                Use AI Suggestion ({suggestedEstimate})
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
