# Storage Setup for Claim Documents

## Option 1: Run the Simple Migration + Manual Policies

1. **Run the simplified migration** (creates bucket only):
```bash
supabase db push
```

2. **Set up policies manually** through the Supabase dashboard (see Option 2 below)

## Option 2: Complete Manual Setup via Supabase Dashboard

If you prefer to set up the storage bucket manually:

### 1. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `documents`
   - **Public bucket**: ✅ **Yes** (checked)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: 
     ```
     image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain
     ```

### 2. Set Up RLS Policies

After creating the bucket, you need to set up Row Level Security policies:

1. Go to **Storage** → **Policies**
2. Click on the `documents` bucket
3. Add the following policies:

#### Policy 1: View Documents
- **Policy name**: `Users can view claim documents`
- **Operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(
  bucket_id = 'documents' AND
  (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND kc.claimant_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND m.user_id = auth.uid()
    )
  )
)
```

#### Policy 2: Upload Documents
- **Policy name**: `Users can upload claim documents`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.khairat_claims kc
    WHERE kc.id::text = (storage.foldername(name))[2]
      AND kc.claimant_id = auth.uid()
      AND kc.status IN ('pending', 'under_review')
  )
)
```

#### Policy 3: Delete Documents
- **Policy name**: `Users can delete claim documents`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND kc.claimant_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND m.user_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
  )
)
```

## File Structure

Documents will be stored with the following structure:
```
documents/
└── claim-documents/
    └── {claim-id}/
        ├── {timestamp}-{random}.jpg
        ├── {timestamp}-{random}.pdf
        └── {timestamp}-{random}.docx
```

## Testing

After setup, you can test the document upload functionality by:

1. Creating a new claim from a mosque profile
2. Uploading a test document
3. Verifying the file appears in the Supabase Storage dashboard
4. Checking that the document shows up in the claim details

## 📝 **IMPORTANT: Policy Setup Required**

If you already have the `DOCUMENTS` bucket created (as shown in your Supabase dashboard), you still need to add the security policies:

### **Add These 3 Policies to the DOCUMENTS Bucket:**

1. **Click "New policy"** next to the DOCUMENTS bucket
2. **Add each policy one by one:**

#### **Policy 1: View Documents**
- **Policy name**: `Users can view claim documents`
- **Operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(
  bucket_id = 'documents' AND
  (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND kc.claimant_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND m.user_id = auth.uid()
    )
  )
)
```

#### **Policy 2: Upload Documents**
- **Policy name**: `Users can upload claim documents`
- **Operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.khairat_claims kc
    WHERE kc.id::text = (storage.foldername(name))[2]
      AND kc.claimant_id = auth.uid()
      AND kc.status IN ('pending', 'under_review')
  )
)
```

#### **Policy 3: Delete Documents**
- **Policy name**: `Users can delete claim documents`
- **Operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
(
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL AND
  (
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND kc.claimant_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.khairat_claims kc
      JOIN public.mosques m ON m.id = kc.mosque_id
      WHERE kc.id::text = (storage.foldername(name))[2]
        AND m.user_id = auth.uid()
        AND kc.status IN ('pending', 'under_review')
    )
  )
)
```

### **After Adding Policies:**
- ✅ Users can upload documents when submitting claims
- ✅ Users can view/download their own claim documents
- ✅ Mosque admins can view documents for claims in their mosque
- ✅ Documents are properly secured with RLS policies

## Troubleshooting

- **Upload fails**: Check that the bucket exists and policies are set correctly
- **Access denied**: Verify RLS policies allow the current user to access the claim
- **File not found**: Ensure the file path matches the expected structure
- **Large files rejected**: Check the file size limit (10MB) and file type restrictions
