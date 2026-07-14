-- Enable RLS on storage if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Read" ON storage.objects;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow authenticated users to read their own files
CREATE POLICY "Authenticated Read" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow authenticated users to update their own files
CREATE POLICY "Authenticated Update" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy to allow authenticated users to delete their own files
CREATE POLICY "Authenticated Delete" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Grant access to the attachments bucket
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON SCHEMA storage TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO authenticated;
