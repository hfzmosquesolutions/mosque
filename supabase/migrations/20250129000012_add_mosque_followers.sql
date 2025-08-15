-- Add mosque followers table for following system
-- This allows users to follow multiple mosques

CREATE TABLE mosque_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only follow a mosque once
    UNIQUE(user_id, mosque_id)
);

-- Create indexes for better performance
CREATE INDEX idx_mosque_followers_user_id ON mosque_followers(user_id);
CREATE INDEX idx_mosque_followers_mosque_id ON mosque_followers(mosque_id);
CREATE INDEX idx_mosque_followers_followed_at ON mosque_followers(followed_at);

-- Enable RLS
ALTER TABLE mosque_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mosque_followers
-- Users can view their own follows
CREATE POLICY "Users can view own follows" ON mosque_followers
  FOR SELECT USING (auth.uid() = user_id);

-- Users can follow mosques
CREATE POLICY "Users can follow mosques" ON mosque_followers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unfollow mosques
CREATE POLICY "Users can unfollow mosques" ON mosque_followers
  FOR DELETE USING (auth.uid() = user_id);

-- Mosque owners can see who follows their mosque
CREATE POLICY "Mosque owners can see followers" ON mosque_followers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mosques 
      WHERE mosques.id = mosque_followers.mosque_id 
      AND mosques.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON mosque_followers TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;