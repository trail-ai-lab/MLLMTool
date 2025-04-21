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
  file_path: string; // Must match the `file_path` column in your DB
  duration?: string;
}): Promise<Source> => {
  try {
    const { data, error } = await supabase
      .from('sources')
      .insert([source])
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
