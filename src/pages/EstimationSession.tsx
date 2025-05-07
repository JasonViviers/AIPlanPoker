import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Brain, Check, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { useEstimation } from '../contexts/EstimationContext';
import { EstimationCard } from '../components/EstimationCard';
import { useAuth } from '../contexts/AuthContext';

const FIBONACCI_SEQUENCE = ['?', '1', '2', '5', '8', '13', '21'];

export function EstimationSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [newStory, setNewStory] = useState({ title: '', description: '' });
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  // We'll track votes directly in userVotes instead of selectedValue
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voteStatus, setVoteStatus] = useState<'submitted' | 'updated' | null>(null);
  const [endingSession, setEndingSession] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{visible: boolean; stories: any[]}>({visible: false, stories: []});
  const [expandedStories, setExpandedStories] = useState<Record<string, boolean>>({});

  const estimation = useEstimation();
  const stories = estimation((state) => state.stories);
  const votes = estimation((state) => state.votes);
  const addStory = estimation((state) => state.addStory);
  const submitVote = estimation((state) => state.submitVote);
  const finalizeEstimate = estimation((state) => state.finalizeEstimate);
  const setActiveSession = estimation((state) => state.setActiveSession);

  const { user } = useAuth();
  
  // Generate AI notes based on story content
  const getAINotes = (story: any) => {
    const estimate = story.suggested_estimate || story.suggestedEstimate || 5;
    
    // Base notes on the estimate value
    if (estimate <= 2) {
      return "This appears to be a straightforward task with minimal complexity. Should be quick to implement with low risk.";
    } else if (estimate <= 5) {
      return "This story has moderate complexity. Consider breaking it into smaller tasks if implementation takes longer than expected.";
    } else if (estimate <= 8) {
      return "This is a complex story with several moving parts. Ensure proper testing and consider potential integration issues.";
    } else {
      return "This is a very complex task that might benefit from being broken down into smaller stories. Watch for scope creep and technical challenges.";
    }
  };

  // Initialize expanded state when stories change
  useEffect(() => {
    // For any stories with final estimates, set their expanded state to false by default
    const initialExpandedState: Record<string, boolean> = {};
    stories.forEach(story => {
      if (story.final_estimate || story.finalEstimate) {
        // Default to collapsed state for finalized stories
        initialExpandedState[story.id] = initialExpandedState[story.id] ?? false;
      }
    });
    setExpandedStories(prev => ({
      ...prev,
      ...initialExpandedState
    }));
  }, [stories]);

  useEffect(() => {
    if (sessionId) {
      setActiveSession(sessionId);
      
      // Fetch stories and votes when session ID changes
      import('../api/supabaseApi').then(async (api) => {
        try {
          // Fetch stories
          const stories = await api.getStories(sessionId);
          console.log('Fetched stories:', stories);
          estimation.setState(state => ({ ...state, stories }));
          
          // Fetch votes for each story
          const allVotes: Record<string, number> = {};
          for (const story of stories) {
            try {
              const storyVotes = await api.getVotes(story.id);
              console.log(`Fetched votes for story ${story.id}:`, storyVotes);
              
              // Map votes to the correct format
              storyVotes.forEach(vote => {
                allVotes[story.id] = vote.estimate;
              });
            } catch (voteErr) {
              console.error(`Error fetching votes for story ${story.id}:`, voteErr);
            }
          }
          
          // Update votes in state
          console.log('Setting all votes:', allVotes);
          estimation.setState(state => ({ ...state, votes: allVotes }));
          
        } catch (err) {
          console.error('Error fetching session data:', err);
          setError('Failed to load session data');
        }
      });
    }
  }, [sessionId, setActiveSession, estimation]);

  useEffect(() => {
    // Ensure session exists in DB
    const ensureSession = async () => {
      if (!sessionId || !user) return;
      try {
        await import('../api/supabaseApi').then(async (api) => {
          try {
            await api.getSession(sessionId);
          } catch (e) {
            // If not found, create it
            await api.createSession(sessionId, user.id, 'Untitled Session');
          }
        });
      } catch (e) {
        setError('Failed to create or verify session: ' + (e as Error).message);
      }
    };
    ensureSession();
  }, [sessionId, user]);

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addStory(newStory);
      setNewStory({ title: '', description: '' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Track user votes for each story
  const userVotes = useMemo(() => {
    const result: Record<string, number> = {};
    console.log('Current votes state:', votes);
    Object.entries(votes).forEach(([storyId, estimate]) => {
      if (storyId && typeof storyId === 'string') {
        result[storyId] = estimate;
      }
    });
    return result;
  }, [votes]);

  const handleVote = (storyId: string, estimate: string) => {
    if (!user) {
      setError('You must be logged in to vote');
      return;
    }
    
    // Debug the story ID to ensure it's a valid UUID
    console.log('Vote debug info:', { 
      storyId, 
      storyIdType: typeof storyId, 
      estimate, 
      userId: user.id 
    });
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!storyId || typeof storyId !== 'string' || !uuidRegex.test(storyId)) {
      console.error('Invalid story ID format:', storyId);
      setError('Invalid story ID format. Please try again.');
      return;
    }
    
    // Check if this is a new vote or an update
    const isUpdate = userVotes[storyId] !== undefined;
    
    try {
      // Update the vote
      submitVote(storyId, user.id, Number(estimate) || 0);
      setVoteStatus(isUpdate ? 'updated' : 'submitted');
      
      // Clear feedback after 2 seconds
      setTimeout(() => setVoteStatus(null), 2000);
    } catch (error) {
      console.error('Vote submission error:', error);
      setError(`Failed to submit vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFinalize = async (storyId: string, providedEstimate?: number) => {
    // Use provided estimate if available, otherwise use the user's vote
    const finalEstimate = providedEstimate !== undefined ? providedEstimate : votes[storyId];
    if (finalEstimate) {
      try {
        // Call the API directly to ensure persistence
        await import('../api/supabaseApi').then(api => 
          api.finalizeStory(storyId, finalEstimate)
        );
        
        // Update local state
        finalizeEstimate(storyId, finalEstimate);
        setSelectedStory(null);
        
        // Refresh stories to get the updated final estimate
        import('../api/supabaseApi').then(api => {
          api.getStories(sessionId as string).then(data => {
            console.log('Refreshed stories after finalize:', data);
            estimation.setState(state => ({ ...state, stories: data }));
          });
        });
      } catch (error) {
        console.error('Error finalizing story:', error);
        setError(`Failed to finalize story: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    try {
      setEndingSession(true);
      await import('../api/supabaseApi').then(api => api.endSession(sessionId));
      
      // Prepare session summary before clearing state
      const storiesWithVotes = stories.map(story => ({
        ...story,
        votes: Object.entries(votes)
          .filter(([id]) => id === story.id)
          .map(([_, value]) => value),
        // Ensure we're using the correct property names consistently
        finalEstimate: story.final_estimate || story.finalEstimate
      }));
      
      // Show session summary
      setSessionSummary({
        visible: true,
        stories: storiesWithVotes
      });
      
      // Don't navigate away immediately - let user see the summary
    } catch (e) {
      setError('Failed to end session: ' + (e as Error).message);
      setEndingSession(false);
    }
  };
  
  const closeSessionSummary = () => {
    setSessionSummary({visible: false, stories: []});
    setActiveSession(null);
    navigate('/');
  };

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-black py-8 px-2 md:px-0">
      {/* Session Summary Modal */}
      {sessionSummary.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="bg-gradient-to-br from-cyan-900/90 to-cyan-800/90 border border-cyan-600/30 rounded-2xl shadow-xl p-8 w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-cyan-100 mb-6">Session Summary</h2>
            <div className="max-h-[60vh] overflow-y-auto">
              {sessionSummary.stories.length === 0 ? (
                <p className="text-cyan-200">No stories were estimated in this session.</p>
              ) : (
                <div className="space-y-6">
                  {sessionSummary.stories.map(story => (
                    <div key={story.id} className="bg-cyan-950/40 border border-cyan-700 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-cyan-100 mb-2">{story.title}</h3>
                      <p className="text-cyan-300 text-sm mb-3">{story.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-cyan-400 text-sm">Final Estimate: </span>
                          {story.finalEstimate ? (
                            <span className="text-2xl font-bold text-cyan-100">{story.finalEstimate}</span>
                          ) : (
                            <span className="text-xl font-bold text-amber-400">Not finalized</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {story.votes && story.votes.length > 0 ? (
                            <div className="flex gap-1">
                              {story.votes.map((vote: number, i: number) => (
                                <span key={i} className="px-2 py-1 bg-cyan-800/60 text-cyan-200 rounded text-xs">
                                  {vote}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-cyan-400 text-xs">No votes</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl shadow-lg"
                onClick={closeSessionSummary}
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white/10 backdrop-blur border border-cyan-800 shadow-xl rounded-2xl max-w-3xl mx-auto">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-cyan-100 drop-shadow">Active Session</h2>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-xs text-cyan-400 font-mono mb-1">Session ID:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-cyan-200 bg-cyan-900/60 px-2 py-1 rounded select-all border border-cyan-700">{sessionId}</span>
                  <button
                    className="ml-1 text-cyan-300 hover:text-cyan-100 text-xs px-2 py-1 rounded border border-cyan-600 bg-cyan-700/30 transition"
                    onClick={() => { navigator.clipboard.writeText(sessionId || ''); }}
                    title="Copy Session ID"
                  >Copy</button>
                </div>
              </div>
              <div className="flex items-center text-sm text-cyan-200">
                <Users className="h-5 w-5 mr-1" />
                <span>6 participants</span>
              </div>
              <div className="flex flex-col items-end">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-red-400/30 shadow"
                  onClick={handleEndSession}
                  disabled={endingSession}
                >
                  {endingSession ? 'Ending...' : 'End Session'}
                </button>
                <span className="text-cyan-300 text-xs mt-1">All votes will be finalized</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddStory} className="mt-6 space-y-6">
            {error && <div className="text-red-400 font-semibold mb-2">{error}</div>}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-cyan-200 mb-1">
                Story Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={newStory.title}
                onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                className="mt-1 block w-full rounded-xl border border-cyan-700 bg-cyan-950/30 text-cyan-100 placeholder-cyan-400 shadow focus:border-cyan-400 focus:ring-cyan-400 sm:text-base px-4 py-2 transition-all"
                placeholder="Enter story title..."
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-cyan-200 mb-1">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={newStory.description}
                onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
                className="mt-1 block w-full rounded-xl border border-cyan-700 bg-cyan-950/30 text-cyan-100 placeholder-cyan-400 shadow focus:border-cyan-400 focus:ring-cyan-400 sm:text-base px-4 py-2 transition-all"
                placeholder="Add a description..."
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 border border-cyan-700 rounded-xl shadow-cyan-500/30 shadow-lg text-white bg-cyan-600 hover:bg-cyan-700 font-semibold text-base tracking-wide transition-all"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Story'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur border border-cyan-800 shadow-xl rounded-2xl max-w-3xl mx-auto">
        <div className="px-6 py-8">
          <h3 className="text-lg font-semibold text-cyan-100 mb-6">Stories</h3>
          <div className="space-y-6">
            {stories.map((story) => (
              <div
                key={story.id}
                className={`border rounded-2xl p-6 bg-cyan-950/40 shadow-lg transition-all duration-200 ${selectedStory === story.id ? 'border-cyan-400 ring-2 ring-cyan-400' : 'border-cyan-800'}`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-cyan-100">{story.title}</h4>
                      <p className="mt-1 text-sm text-cyan-200">{story.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Final Estimate Badge */}
                      {(story.final_estimate || story.finalEstimate) ? (
                        <div className="flex flex-col items-center bg-cyan-800/50 px-4 py-2 rounded-lg">
                          <span className="text-cyan-300 text-xs">Final Estimate</span>
                          <span className="text-2xl font-bold text-cyan-100">{story.final_estimate || story.finalEstimate}</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-cyan-300">
                          <Brain className="h-5 w-5 mr-1" />
                          <span>Suggested: {story.suggested_estimate || story.suggestedEstimate || 5}</span>
                        </div>
                      )}
                      
                      {/* Collapse/Expand Button for finalized stories */}
                      {(story.final_estimate || story.finalEstimate) && (
                        <button 
                          onClick={() => {
                            setExpandedStories(prev => ({
                              ...prev,
                              [story.id]: !prev[story.id]
                            }));
                          }} 
                          className="p-2 rounded-full hover:bg-cyan-800/30 transition-colors bg-cyan-900/30"
                          aria-label={expandedStories[story.id] ? "Collapse details" : "Expand details"}
                          title={expandedStories[story.id] ? "Collapse details" : "Expand details"}
                        >
                          {expandedStories[story.id] ? <ChevronUp className="text-cyan-300" /> : <ChevronDown className="text-cyan-300" />}
                        </button>
                      )}
                      
                      {/* Vote/Finalize buttons for non-finalized stories */}
                      {!(story.final_estimate || story.finalEstimate) && !selectedStory && (
                        <div className="flex gap-2">
                          <button
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm"
                            onClick={() => setSelectedStory(story.id)}
                          >
                            {userVotes[story.id] !== undefined ? 'Change Vote' : 'Vote'}
                          </button>
                          {userVotes[story.id] !== undefined && (
                            <button
                              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm flex items-center"
                              onClick={() => handleFinalize(story.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Finalize
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Summary Content - Only shown when expanded */}
                  {(story.final_estimate || story.finalEstimate) && expandedStories[story.id] && (
                    <div className="mt-4 bg-cyan-950/40 border border-cyan-800 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-cyan-900/30 rounded-lg p-3 flex items-center">
                          <Users className="h-5 w-5 text-cyan-400 mr-2" />
                          <div>
                            <div className="text-xs text-cyan-400">Team Votes</div>
                            <div className="text-lg font-semibold text-cyan-100">
                              {Object.entries(votes).filter(([id]) => id === story.id).length} votes
                            </div>
                          </div>
                        </div>

                        <div className="bg-cyan-900/30 rounded-lg p-3 flex items-center">
                          <BarChart2 className="h-5 w-5 text-cyan-400 mr-2" />
                          <div>
                            <div className="text-xs text-cyan-400">Average</div>
                            <div className="text-lg font-semibold text-cyan-100">
                              {story.final_estimate || story.finalEstimate}
                            </div>
                          </div>
                        </div>

                        <div className="bg-cyan-900/30 rounded-lg p-3 flex items-center">
                          <Brain className="h-5 w-5 text-cyan-400 mr-2" />
                          <div>
                            <div className="text-xs text-cyan-400">AI Suggested</div>
                            <div className="text-lg font-semibold text-cyan-100">
                              {story.suggested_estimate || story.suggestedEstimate || 5}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-cyan-900/20 border border-cyan-800 rounded-lg p-4 mb-4">
                        <div className="flex items-center mb-2">
                          <Brain className="h-5 w-5 text-cyan-400 mr-2" />
                          <span className="text-cyan-200 font-medium">AI Notes</span>
                        </div>
                        <p className="text-cyan-300 text-sm">{getAINotes(story)}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-cyan-200 mb-2">Vote Distribution</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(votes)
                            .filter(([storyId]) => storyId === story.id)
                            .map(([_, estimate], index) => (
                              <div key={index} className="px-2 py-1 bg-cyan-900/40 rounded text-xs text-cyan-300">
                                Team Member {index + 1}: {estimate}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedStory === story.id && !(story.final_estimate || story.finalEstimate) && (
                  <div className="mt-6 flex flex-col items-center">
                    <div className="flex flex-col items-center gap-4">
                      {voteStatus && (
                        <span className="text-green-400 text-sm animate-pulse mb-2">
                          {voteStatus === 'submitted' ? 'Vote submitted!' : 'Vote updated!'}
                        </span>
                      )}
                      <div className="flex flex-wrap gap-4 justify-center">
                        {FIBONACCI_SEQUENCE.map((value) => (
                          <EstimationCard
                            key={value}
                            value={value}
                            selected={userVotes[story.id] === Number(value) || (value === '?' && userVotes[story.id] === 0)}
                            onSelect={() => handleVote(story.id, value)}
                          />
                        ))}
                      </div>
                    </div>
                    {userVotes[story.id] !== undefined && (
                      <div className="mt-4 flex gap-2">
                        <button
                          className="px-4 py-2 bg-cyan-600 text-white rounded-lg flex items-center"
                          onClick={() => handleFinalize(story.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Finalize Vote
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}