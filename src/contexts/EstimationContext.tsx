import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';
import * as api from '../api/supabaseApi';
// Don't import useAuth here - we'll pass the user ID as a parameter
import { supabase } from '../supabaseClient';

interface Story {
  id: string;
  title: string;
  description: string;
  suggested_estimate: number;
  final_estimate: number | null;
  // Add camelCase aliases for TypeScript compatibility
  suggestedEstimate?: number;
  finalEstimate?: number | null;
}

interface EstimationStore {
  activeSession: string | null;
  stories: Story[];
  votes: Record<string, number>;
  setActiveSession: (sessionId: string | null) => void;
  fetchStories: (sessionId: string) => Promise<void>;
  addStory: (story: { title: string; description: string }) => Promise<void>;
  submitVote: (storyId: string, userId: string, estimate: number) => Promise<void>;
  finalizeEstimate: (storyId: string, estimate: number) => Promise<void>;
  fetchVotes: (storyId: string) => Promise<void>;
  subscribeToRealtime: (sessionId: string) => void;
  unsubscribeFromRealtime: () => void;
}

let storySubscription: any = null;
let voteSubscription: any = null;

const useEstimationStore = create<EstimationStore>((set, get) => ({
  activeSession: null,
  stories: [],
  votes: {},
  setActiveSession: (sessionId) => set({ activeSession: sessionId }),
  fetchStories: async (sessionId) => {
    try {
      console.log('Fetching stories for session:', sessionId);
      const data = await api.getStories(sessionId);
      console.log('Stories fetched:', data);
      set({ stories: data });
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  },
  addStory: (story) => {
    return new Promise<void>(async (resolve, reject) => {
      const sessionId = get().activeSession;
      if (!sessionId) {
        reject(new Error('Session not ready'));
        return;
      }
      try {
        const data = await api.addStory(sessionId, story.title, story.description);
        set((state) => ({ stories: [...state.stories, data] }));
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  },
  submitVote: async (storyId: string, userId: string, estimate: number) => {
    if (!userId) return;
    try {
      console.log('Submitting vote:', storyId, userId, estimate);
      await api.submitVote(storyId, userId, estimate);
      set((state) => ({ votes: { ...state.votes, [storyId]: estimate } }));
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  },
  finalizeEstimate: async (storyId, estimate) => {
    set((state) => ({
      stories: state.stories.map((story) =>
        story.id === storyId ? { ...story, finalEstimate: estimate } : story
      ),
    }));
  },
  fetchVotes: async (storyId: string) => {
    try {
      console.log('Fetching votes for story:', storyId);
      const votesArr = await api.getVotes(storyId);
      console.log('Votes fetched:', votesArr);
      const votes: Record<string, number> = {};
      for (const vote of votesArr) {
        // Use the story ID as the key, not the vote's story_id
        votes[storyId] = vote.estimate;
      }
      set((state) => ({ votes: { ...state.votes, ...votes } }));
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  },
  subscribeToRealtime: (sessionId: string) => {
    console.log('Setting up realtime subscriptions for session:', sessionId);
    
    // Unsubscribe from existing channels if any
    if (storySubscription) storySubscription.unsubscribe();
    if (voteSubscription) voteSubscription.unsubscribe();
    
    // Subscribe to stories changes
    storySubscription = supabase
      .channel('stories-' + sessionId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stories', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          console.log('Story change detected:', payload);
          get().fetchStories(sessionId);
        }
      )
      .subscribe((status) => {
        console.log('Stories subscription status:', status);
      });
    
    // Subscribe to votes changes
    voteSubscription = supabase
      .channel('votes-' + sessionId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        (payload) => {
          console.log('Vote change detected:', payload);
          // Fetch votes for all stories in this session
          get().stories.forEach((story) => get().fetchVotes(story.id));
        }
      )
      .subscribe((status) => {
        console.log('Votes subscription status:', status);
      });
  },
  unsubscribeFromRealtime: () => {
    if (storySubscription) storySubscription.unsubscribe();
    if (voteSubscription) voteSubscription.unsubscribe();
    storySubscription = null;
    voteSubscription = null;
  },
}));

const EstimationContext = createContext<typeof useEstimationStore | null>(null);

export function EstimationProvider({ children }: { children: React.ReactNode }) {
  const estimation = useEstimationStore;
  // Only subscribe when there is an active session
  useEffect(() => {
    const sessionId = estimation.getState().activeSession;
    console.log('Active session changed:', sessionId);
    
    if (sessionId) {
      // Load initial data
      console.log('Loading initial data for session:', sessionId);
      estimation.getState().fetchStories(sessionId);
      
      // Setup realtime subscriptions
      estimation.getState().subscribeToRealtime(sessionId);
      
      // Fetch votes for each story after stories are loaded
      setTimeout(() => {
        const stories = estimation.getState().stories;
        console.log('Fetching votes for stories:', stories);
        stories.forEach(story => estimation.getState().fetchVotes(story.id));
      }, 500); // Small delay to ensure stories are loaded first
    }
    
    return () => {
      estimation.getState().unsubscribeFromRealtime();
    };
  }, [estimation.getState().activeSession]);

  useEffect(() => {
    if (!estimation.getState().activeSession) {
      estimation.setState({ stories: [], votes: {} });
    }
  }, [estimation.getState().activeSession]);

  return (
    <EstimationContext.Provider value={estimation}>
      {children}
    </EstimationContext.Provider>
  );
}

export const useEstimation = () => {
  const context = useContext(EstimationContext);
  if (!context) {
    throw new Error('useEstimation must be used within an EstimationProvider');
  }
  return context;
};