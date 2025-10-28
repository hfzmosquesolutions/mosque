-- Mosque Management System - Supabase Migration
-- This migration creates all necessary tables for the mosque management system
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_account_type AS ENUM ('member', 'admin');
CREATE TYPE membership_type AS ENUM ('regular', 'family', 'student', 'senior');
CREATE TYPE user_role AS ENUM ('admin', 'imam', 'board_member', 'volunteer_coordinator', 'treasurer', 'secretary', 'moderator', 'member');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE khairat_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- =============================================
-- CORE TABLES
-- =============================================

-- Mosques table
CREATE TABLE mosques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    settings JSONB DEFAULT '{}', -- Store mosque-specific settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    account_type user_account_type NOT NULL DEFAULT 'member',
    membership_type membership_type DEFAULT 'regular',
    role user_role NOT NULL DEFAULT 'member',
    status user_status NOT NULL DEFAULT 'active',
    mosque_id UUID REFERENCES mosques(id) ON DELETE SET NULL,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    occupation VARCHAR(255),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    profile_picture_url TEXT,
    preferences JSONB DEFAULT '{}', -- Store user preferences (notifications, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mosque administrators junction table (for multi-mosque support)
CREATE TABLE mosque_administrators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '{}', -- Store specific permissions
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, mosque_id)
);

-- =============================================
-- EVENTS MODULE
-- =============================================

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT FALSE,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    status event_status DEFAULT 'draft',
    category VARCHAR(100), -- e.g., 'religious', 'educational', 'community'
    image_url TEXT,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event registrations table
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attended BOOLEAN DEFAULT FALSE,
    notes TEXT,
    UNIQUE(event_id, user_id)
);

-- =============================================
-- DONATIONS MODULE
-- =============================================

-- Donation categories table
CREATE TABLE donation_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations table
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    donor_name VARCHAR(255), -- For anonymous or guest donations
    donor_email VARCHAR(255),
    donor_phone VARCHAR(50),
    category_id UUID REFERENCES donation_categories(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MYR',
    payment_method VARCHAR(50), -- e.g., 'card', 'bank_transfer', 'cash'
    payment_reference VARCHAR(255),
    status donation_status DEFAULT 'pending',
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20), -- 'monthly', 'yearly', etc.
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- KHAIRAT (WELFARE) MODULE
-- =============================================

-- Khairat programs table
CREATE TABLE khairat_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Khairat contributions table
CREATE TABLE khairat_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES khairat_programs(id) ON DELETE CASCADE,
    contributor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    contributor_name VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    status khairat_status DEFAULT 'pending',
    notes TEXT,
    contributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANNOUNCEMENTS MODULE
-- =============================================

-- Announcements table
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority announcement_priority DEFAULT 'medium',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    target_audience JSONB DEFAULT '{}', -- Store targeting criteria
    image_url TEXT,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RESOURCES MODULE
-- =============================================

-- Resource categories table
CREATE TABLE resource_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES resource_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
    category_id UUID REFERENCES resource_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    file_url TEXT,
    external_url TEXT,
    resource_type VARCHAR(50), -- 'article', 'video', 'audio', 'document', 'link'
    language VARCHAR(10) DEFAULT 'en',
    tags TEXT[], -- Array of tags for searching
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SYSTEM TABLES
-- =============================================

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    mosque_id UUID REFERENCES mosques(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    mosque_id UUID REFERENCES mosques(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'success', 'error'
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Settings table for system-wide configurations
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mosque_id UUID REFERENCES mosques(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mosque_id, key)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_mosque_id ON user_profiles(mosque_id);
CREATE INDEX idx_user_profiles_account_type ON user_profiles(account_type);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_email ON user_profiles USING gin(to_tsvector('english', full_name));

-- Events indexes
CREATE INDEX idx_events_mosque_id ON events(mosque_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);

-- Donations indexes
CREATE INDEX idx_donations_mosque_id ON donations(mosque_id);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at);

-- Khairat indexes
CREATE INDEX idx_khairat_contributions_program_id ON khairat_contributions(program_id);
CREATE INDEX idx_khairat_contributions_contributor_id ON khairat_contributions(contributor_id);

-- Announcements indexes
CREATE INDEX idx_announcements_mosque_id ON announcements(mosque_id);
CREATE INDEX idx_announcements_published ON announcements(is_published, published_at);
CREATE INDEX idx_announcements_priority ON announcements(priority);

-- Resources indexes
CREATE INDEX idx_resources_mosque_id ON resources(mosque_id);
CREATE INDEX idx_resources_category_id ON resources(category_id);
CREATE INDEX idx_resources_published ON resources(is_published);
CREATE INDEX idx_resources_tags ON resources USING gin(tags);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_mosques_updated_at BEFORE UPDATE ON mosques FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_khairat_programs_updated_at BEFORE UPDATE ON khairat_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE khairat_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE khairat_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles in their mosque" ON user_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM mosque_administrators ma 
        JOIN user_profiles up ON ma.user_id = up.id 
        WHERE up.id = auth.uid() AND ma.mosque_id = user_profiles.mosque_id AND ma.is_active = true
    )
);

-- Mosque policies
CREATE POLICY "Users can view their mosque" ON mosques FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.mosque_id = mosques.id
    )
);
CREATE POLICY "Admins can update their mosque" ON mosques FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM mosque_administrators ma 
        JOIN user_profiles up ON ma.user_id = up.id 
        WHERE up.id = auth.uid() AND ma.mosque_id = mosques.id AND ma.is_active = true
    )
);

-- Events policies
CREATE POLICY "Users can view events in their mosque" ON events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.id = auth.uid() AND up.mosque_id = events.mosque_id
    )
);
CREATE POLICY "Admins can manage events in their mosque" ON events FOR ALL USING (
    EXISTS (
        SELECT 1 FROM mosque_administrators ma 
        JOIN user_profiles up ON ma.user_id = up.id 
        WHERE up.id = auth.uid() AND ma.mosque_id = events.mosque_id AND ma.is_active = true
    )
);

-- Donations policies
CREATE POLICY "Users can view their own donations" ON donations FOR SELECT USING (auth.uid() = donor_id);
CREATE POLICY "Admins can view all donations in their mosque" ON donations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM mosque_administrators ma 
        JOIN user_profiles up ON ma.user_id = up.id 
        WHERE up.id = auth.uid() AND ma.mosque_id = donations.mosque_id AND ma.is_active = true
    )
);
CREATE POLICY "Users can create donations" ON donations FOR INSERT WITH CHECK (auth.uid() = donor_id OR donor_id IS NULL);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =============================================

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, account_type)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'member');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update khairat program current amount
CREATE OR REPLACE FUNCTION update_khairat_program_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE khairat_programs 
        SET current_amount = current_amount + NEW.amount
        WHERE id = NEW.program_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        UPDATE khairat_programs 
        SET current_amount = current_amount + NEW.amount
        WHERE id = NEW.program_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
        UPDATE khairat_programs 
        SET current_amount = current_amount - OLD.amount
        WHERE id = OLD.program_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'completed' THEN
        UPDATE khairat_programs 
        SET current_amount = current_amount - OLD.amount
        WHERE id = OLD.program_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for khairat amount updates
CREATE TRIGGER khairat_contribution_amount_trigger
    AFTER INSERT OR UPDATE OR DELETE ON khairat_contributions
    FOR EACH ROW EXECUTE FUNCTION update_khairat_program_amount();

-- =============================================
-- SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert a sample mosque (you can modify or remove this)
INSERT INTO mosques (id, name, address, phone, email, website, description) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'Islamic Center of Excellence',
    '123 Main Street, City, State 12345',
    '+1 (555) 987-6543',
    'info@mosque.org',
    'https://mosque.org',
    'A community-centered mosque serving the local Muslim community with various programs and services.'
);

-- Insert sample donation categories
INSERT INTO donation_categories (mosque_id, name, description, target_amount) VALUES 
('00000000-0000-0000-0000-000000000001', 'General Fund', 'General mosque operations and maintenance', 10000.00),
('00000000-0000-0000-0000-000000000001', 'Building Fund', 'Mosque construction and renovation projects', 50000.00),
('00000000-0000-0000-0000-000000000001', 'Education Fund', 'Islamic education programs and resources', 5000.00),
('00000000-0000-0000-0000-000000000001', 'Charity Fund', 'Community welfare and assistance programs', 15000.00);

-- Insert sample khairat program
INSERT INTO khairat_programs (mosque_id, name, description, target_amount, start_date, end_date, created_by) VALUES 
('00000000-0000-0000-0000-000000000001', 'Monthly Community Support', 'Monthly welfare program for community members in need', 2000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', '00000000-0000-0000-0000-000000000001');

-- Insert sample resource categories
INSERT INTO resource_categories (mosque_id, name, description) VALUES 
('00000000-0000-0000-0000-000000000001', 'Islamic Studies', 'Educational materials about Islamic teachings'),
('00000000-0000-0000-0000-000000000001', 'Prayer Guides', 'Resources for prayer and worship'),
('00000000-0000-0000-0000-000000000001', 'Community Guidelines', 'Information about mosque policies and procedures'),
('00000000-0000-0000-0000-000000000001', 'Events & Programs', 'Information about upcoming events and programs');

COMMIT;

-- =============================================
-- NOTES FOR IMPLEMENTATION
-- =============================================

/*
IMPORTANT NOTES:

1. ENVIRONMENT VARIABLES:
   Make sure to set up these environment variables in your Next.js app:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (for admin operations)

2. AUTHENTICATION:
   - This schema extends Supabase's built-in auth.users table
   - User profiles are automatically created when users sign up
   - The system supports both member and admin account types

3. MULTI-MOSQUE SUPPORT:
   - The schema supports multiple mosques
   - Users can be associated with one primary mosque
   - Admins can manage multiple mosques through mosque_administrators table

4. SECURITY:
   - Row Level Security (RLS) is enabled on all tables
   - Users can only access data related to their mosque
   - Admins have broader access within their mosque(s)

5. FEATURES SUPPORTED:
   - User management with roles and permissions
   - Event management and registration
   - Donation tracking and categorization
   - Khairat (welfare) programs
   - Announcements system
   - Resource library
   - Audit logging
   - Notifications system

6. NEXT STEPS:
   - Update your TypeScript types to match this schema
   - Implement API routes for CRUD operations
   - Set up proper error handling and validation
   - Configure email templates for notifications
   - Set up file storage for images and documents

7. CUSTOMIZATION:
   - Modify the sample mosque data or remove it entirely
   - Adjust the enum values to match your specific needs
   - Add additional fields as required for your implementation
   - Configure mosque-specific settings

8. PERFORMANCE:
   - Indexes are created for common query patterns
   - Consider adding more indexes based on your specific usage patterns
   - Monitor query performance and optimize as needed

9. BACKUP AND MAINTENANCE:
   - Set up regular database backups
   - Monitor the audit_logs table size and implement archiving if needed
   - Regularly review and update RLS policies as features evolve
*/