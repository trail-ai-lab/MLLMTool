import { supabase } from './supabaseClient';

// Define the structure of the data returned by Supabase
interface Source {
  id: string;
  title: string;
  type: string;
  file_path: string;
  created_at?: string;
  duration?: string;
  processing_status?: string;
}

/**
 * Fetches the latest recordings (rows) from the `sources` table,
 * ordered by `created_at` descending.
 */
export const fetchLatestRecordings = async (): Promise<Source[] | null> => {
  try {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recordings:', error);
      return null;
    }

    console.log('Fetched recordings:', data);
    return data as Source[];
  } catch (error) {
    console.error('Unexpected error in fetchLatestRecordings:', error);
    return null;
  }
};

/**
 * Inserts a new row into the `sources` table.
 */
export const insertSource = async (source: {
  title: string;
  type: string;
  file_path: string;
  duration?: string;
}): Promise<Source> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Insert into the audio_sources table to match your schema
    const { data, error } = await supabase
      .from('audio_sources') // Make sure this matches your schema
      .insert([{
        user_id: user.id, // Add the user_id
        title: source.title,
        type: source.type,
        duration: source.duration,
        file_path: source.file_path,
      }])
      .select() // Ensure the inserted row is returned
      .single();

    if (error) {
      console.error('Error inserting source:', error);
      throw new Error(`Failed to insert source: ${error.message}`);
    }

    console.log('Source inserted successfully:', data);
    return data as Source;
  } catch (error) {
    console.error('Unexpected error in insertSource:', error);
    throw new Error('An unexpected error occurred while inserting the source.');
  }
};
