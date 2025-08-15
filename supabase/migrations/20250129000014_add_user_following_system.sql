-- Add user-to-user following system and mosque-to-user following
-- This migration creates tables for users to follow each other and mosques to follow users

-- Create user_followers table for user-to-user following
CREATE TABLE public.user_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can't follow themselves
    CONSTRAINT user_followers_no_self_follow CHECK (follower_id != following_id),
    
    -- Ensure unique follower-following pairs
    CONSTRAINT user_followers_unique_pair UNIQUE (follower_id, following_id)
);

-- Create mosque_user_followers table for mosques to follow users
CREATE TABLE public.mosque_user_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique mosque-user pairs
    CONSTRAINT mosque_user_followers_unique_pair UNIQUE (mosque_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX idx_user_followers_follower_id ON public.user_followers(follower_id);
CREATE INDEX idx_user_followers_following_id ON public.user_followers(following_id);
CREATE INDEX idx_mosque_user_followers_mosque_id ON public.mosque_user_followers(mosque_id);
CREATE INDEX idx_mosque_user_followers_user_id ON public.mosque_user_followers(user_id);

-- Enable RLS on new tables
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mosque_user_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_followers
-- Users can view their own following relationships (both as follower and following)
CREATE POLICY "Users can view own following relationships" ON public.user_followers
    FOR SELECT USING (
        auth.uid() = follower_id OR auth.uid() = following_id
    );

-- Users can create following relationships where they are the follower
CREATE POLICY "Users can follow others" ON public.user_followers
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can delete following relationships where they are the follower
CREATE POLICY "Users can unfollow others" ON public.user_followers
    FOR DELETE USING (auth.uid() = follower_id);

-- Public can view following counts (for profile stats)
CREATE POLICY "Public can view following stats" ON public.user_followers
    FOR SELECT USING (true);

-- RLS Policies for mosque_user_followers
-- Mosque owners can manage their mosque's following relationships
CREATE POLICY "Mosque owners can manage mosque following" ON public.mosque_user_followers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.mosques m
            WHERE m.id = mosque_user_followers.mosque_id 
            AND m.user_id = auth.uid()
        )
    );

-- Users can view if they are being followed by mosques
CREATE POLICY "Users can view mosque followers" ON public.mosque_user_followers
    FOR SELECT USING (auth.uid() = user_id);

-- Public can view mosque following stats
CREATE POLICY "Public can view mosque following stats" ON public.mosque_user_followers
    FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.user_followers TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.mosque_user_followers TO authenticated;
GRANT SELECT ON public.user_followers TO anon;
GRANT SELECT ON public.mosque_user_followers TO anon;

-- Add helpful comments
COMMENT ON TABLE public.user_followers IS 'Stores user-to-user following relationships';
COMMENT ON TABLE public.mosque_user_followers IS 'Stores mosque-to-user following relationships';
COMMENT ON COLUMN public.user_followers.follower_id IS 'The user who is following';
COMMENT ON COLUMN public.user_followers.following_id IS 'The user being followed';
COMMENT ON COLUMN public.mosque_user_followers.mosque_id IS 'The mosque that is following';
COMMENT ON COLUMN public.mosque_user_followers.user_id IS 'The user being followed by the mosque';

-- Create functions for getting follower/following counts
CREATE OR REPLACE FUNCTION get_user_follower_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.user_followers 
        WHERE following_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_following_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.user_followers 
        WHERE follower_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_mosque_following_count(mosque_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.mosque_user_followers 
        WHERE mosque_id = mosque_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_follower_count(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_following_count(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_mosque_following_count(UUID) TO authenticated, anon;