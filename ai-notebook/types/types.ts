export interface Source {
    id: string;
    title: string;
    type: 'audio' | 'pdf';
    duration?: string;
    path: string;
    file?: File;
    transcript?: string;
    summary?: string;
  }
  
  export interface AudioFile {
    id: string;
    source_id: string;
    file_path: string;
    content_type: string;
  }
  
  export interface Content {
    id: string;
    source_id: string;
    transcript: string;
    summary: string;
    transcript_completed_at: string;
    summary_completed_at: string;
  }