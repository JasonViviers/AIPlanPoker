import { supabase } from '../supabaseClient';

// --- Sessions ---
export async function createSession(id: string, created_by: string, name: string) {
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ id, created_by, name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSession(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (error) throw error;
  return data;
}

export async function endSession(id: string) {
  const { error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function getActiveSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .is('ended_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Defensive sort in case DB order fails
  return (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function deleteSession(id: string) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --- Stories ---
// AI suggestion data - mocked for now
const getAISuggestion = (title: string, description: string) => {
  // Generate a consistent but seemingly intelligent estimate based on text length
  const combinedText = (title + description).toLowerCase();
  
  // Base the estimate on text complexity and length
  let baseEstimate = Math.max(1, Math.min(13, Math.floor(combinedText.length / 20)));
  
  // Adjust based on keywords suggesting complexity
  const complexityTerms = ['complex', 'difficult', 'challenging', 'integration', 'refactor', 'security', 'performance'];
  complexityTerms.forEach(term => {
    if (combinedText.includes(term)) baseEstimate += 2;
  });
  
  // Adjust based on keywords suggesting simplicity
  const simplicityTerms = ['simple', 'easy', 'quick', 'minor', 'small', 'trivial'];
  simplicityTerms.forEach(term => {
    if (combinedText.includes(term)) baseEstimate = Math.max(1, baseEstimate - 2);
  });
  
  // Map to Fibonacci
  const fibonacci = [1, 2, 3, 5, 8, 13, 21];
  const closestFib = fibonacci.reduce((prev, curr) => 
    Math.abs(curr - baseEstimate) < Math.abs(prev - baseEstimate) ? curr : prev
  );
  
  return closestFib;
};

export async function addStory(session_id: string, title: string, description: string) {
  // Generate AI suggestion
  const suggestedEstimate = getAISuggestion(title, description);
  
  const { data, error } = await supabase
    .from('stories')
    .insert([{ 
      session_id, 
      title, 
      description,
      suggested_estimate: suggestedEstimate
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getStories(session_id: string) {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('session_id', session_id)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function finalizeStory(storyId: string, final_estimate: number) {
  console.log('Finalizing story with ID:', storyId, 'estimate:', final_estimate);
  try {
    const { data, error } = await supabase
      .from('stories')
      .update({ final_estimate })
      .eq('id', storyId)
      .select()
      .single();
    
    if (error) {
      console.error('Error finalizing story:', error);
      throw error;
    }
    
    console.log('Story finalized successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception in finalizeStory:', error);
    throw error;
  }
}

// --- Votes ---
export async function submitVote(story_id: string, user_id: string, estimate: number) {
  console.log('API submitVote called with:', { story_id, user_id, estimate });
  
  // Validate that story_id is a valid UUID
  if (!story_id || typeof story_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(story_id)) {
    console.error('Invalid story_id format:', story_id);
    throw new Error(`Invalid story_id format: ${story_id}`);
  }
  
  // Validate that user_id is a valid UUID
  if (!user_id || typeof user_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id)) {
    console.error('Invalid user_id format:', user_id);
    throw new Error(`Invalid user_id format: ${user_id}`);
  }
  
  try {
    const { data, error } = await supabase
      .from('votes')
      .upsert([{ story_id, user_id, estimate }], { onConflict: 'story_id,user_id' })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error in submitVote:', error);
      throw error;
    }
    
    console.log('Vote submitted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in submitVote:', error);
    throw error;
  }
}

export async function getVotes(story_id: string) {
  console.log('API getVotes called for story_id:', story_id);
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('story_id', story_id);
    
    if (error) {
      console.error('Error fetching votes:', error);
      throw error;
    }
    
    console.log('Votes retrieved:', data);
    return data;
  } catch (error) {
    console.error('Exception in getVotes:', error);
    throw error;
  }
}

// --- Participants ---
export async function joinSession(session_id: string, user_id: string) {
  const { data, error } = await supabase
    .from('participants')
    .upsert([{ session_id, user_id }], { onConflict: 'session_id,user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getParticipants(session_id: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('session_id', session_id);
  if (error) throw error;
  return data;
}
