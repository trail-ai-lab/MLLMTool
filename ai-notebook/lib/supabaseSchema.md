# Supabase Schema Setup

## Required Tables

### 1. profiles
- **Purpose**: Store additional information about users
- **Structure**:
  ```sql
  create table profiles (
    id uuid references auth.users(id) primary key,
    email text not null,
    display_name text,
    created_at timestamp with time zone default now() not null
  );

  -- Set up Row Level Security (RLS)
  alter table profiles enable row level security;
  
  -- Create policy for users to see only their own profile
  create policy "Users can view their own profile" on profiles
    for select using (auth.uid() = id);
    
  -- Create policy for users to update only their own profile
  create policy "Users can update their own profile" on profiles
    for update using (auth.uid() = id);
  ```

### 2. audio_sources
- **Purpose**: Store information about audio recordings and files
- **Structure**:
  ```sql
  create table audio_sources (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) not null,
    title text not null,
    type text not null check (type in ('audio', 'pdf', 'transcript')),
    duration text,
    file_path text not null,
    created_at timestamp with time zone default now() not null
  );
  
  -- Set up Row Level Security (RLS)
  alter table audio_sources enable row level security;
  
  -- Create policy for users to see only their own audio sources
  create policy "Users can view their own audio sources" on audio_sources
    for select using (auth.uid() = user_id);
    
  -- Create policy for users to insert their own audio sources
  create policy "Users can insert their own audio sources" on audio_sources
    for insert with check (auth.uid() = user_id);
    
  -- Create policy for users to update their own audio sources
  create policy "Users can update their own audio sources" on audio_sources
    for update using (auth.uid() = user_id);
    
  -- Create policy for users to delete their own audio sources
  create policy "Users can delete their own audio sources" on audio_sources
    for delete using (auth.uid() = user_id);
  ```

### 3. source_data
- **Purpose**: Store transcripts, summaries, and other processed data associated with audio sources
- **Structure**:
  ```sql
  create table source_data (
    id uuid default uuid_generate_v4() primary key,
    source_id uuid references audio_sources(id) on delete cascade not null,
    user_id uuid references auth.users(id) not null,
    transcript text,
    summary text,
    text_content text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
  );
  
  -- Set up Row Level Security (RLS)
  alter table source_data enable row level security;
  
  -- Create policy for users to see only their own source data
  create policy "Users can view their own source data" on source_data
    for select using (auth.uid() = user_id);
    
  -- Create policy for users to insert their own source data
  create policy "Users can insert their own source data" on source_data
    for insert with check (auth.uid() = user_id);
    
  -- Create policy for users to update their own source data
  create policy "Users can update their own source data" on source_data
    for update using (auth.uid() = user_id);
    
  -- Create policy for users to delete their own source data
  create policy "Users can delete their own source data" on source_data
    for delete using (auth.uid() = user_id);
  ```

## Storage Buckets

### 1. audio_files
- **Purpose**: Store uploaded audio files
- **Setup**:
  ```sql
  -- Create a storage bucket for audio files
  insert into storage.buckets (id, name, public) values ('audio_files', 'audio_files', false);
  
  -- Set up Row Level Security (RLS) for the bucket
  create policy "Users can view their own audio files" on storage.objects
    for select using (auth.uid() = owner and bucket_id = 'audio_files');
    
  create policy "Users can upload their own audio files" on storage.objects
    for insert with check (auth.uid() = owner and bucket_id = 'audio_files');
    
  create policy "Users can update their own audio files" on storage.objects
    for update using (auth.uid() = owner and bucket_id = 'audio_files');
    
  create policy "Users can delete their own audio files" on storage.objects
    for delete using (auth.uid() = owner and bucket_id = 'audio_files');
  ```

### 2. pdf_files
- **Purpose**: Store uploaded PDF files
- **Setup**:
  ```sql
  -- Create a storage bucket for PDF files
  insert into storage.buckets (id, name, public) values ('pdf_files', 'pdf_files', false);
  
  -- Set up Row Level Security (RLS) for the bucket
  create policy "Users can view their own PDF files" on storage.objects
    for select using (auth.uid() = owner and bucket_id = 'pdf_files');
    
  create policy "Users can upload their own PDF files" on storage.objects
    for insert with check (auth.uid() = owner and bucket_id = 'pdf_files');
    
  create policy "Users can update their own PDF files" on storage.objects
    for update using (auth.uid() = owner and bucket_id = 'pdf_files');
    
  create policy "Users can delete their own PDF files" on storage.objects
    for delete using (auth.uid() = owner and bucket_id = 'pdf_files');
  ```

## Setup Steps

1. Create a new Supabase project at [https://supabase.com/](https://supabase.com/)
2. Go to the SQL Editor in your Supabase project dashboard
3. Create each table by running the SQL commands above
4. Set up the storage buckets using the SQL commands for each bucket
5. Update your `.env.local` file with the Supabase URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ``` 