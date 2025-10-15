# Mosque Management System - Onboarding Guide

## Overview

The mosque management system now includes a comprehensive onboarding process that ensures users get the appropriate account type and permissions based on their role in the mosque community.

## User Roles

### 1. Community Member
- **Purpose**: Regular mosque attendees and community members
- **Access**: 
  - Khairat (welfare) programs and payments
  - Khairat (welfare) programs
  - Islamic resources and educational materials
- **Membership Types**:
  - Regular Member
  - Family Membership
  - Student Member
  - Senior Member

### 2. Mosque Administrator
- **Purpose**: Mosque staff, board members, and authorized personnel
- **Access**: All member features plus:
  - Member management
  - Khairat program management
  
  - Financial reports and analytics
  - Mosque settings configuration
  - System administration
- **Admin Roles**:
  - Imam
  - Board Member
  - Volunteer Coordinator
  - Treasurer
  - Secretary

## Onboarding Process

### Step 1: Personal Information
- Full name (required)
- Phone number (required)
- Address (optional)

### Step 2: Account Type Selection
Users choose between:
- **Community Member**: For regular mosque attendees
- **Mosque Administrator**: For authorized staff and volunteers

### Step 3: Role-Specific Details

#### For Community Members:
- Membership type selection
- Emergency contact information

#### For Administrators:
- Admin verification code (required)
- Specific mosque role selection

### Step 4: Review and Confirmation
- Review all entered information
- Complete the onboarding process

## Security Features

### Admin Verification
- Admin accounts require a verification code
- Current code: `MOSQUE_ADMIN_2024` (should be changed in production)
- Only authorized personnel should have access to this code

### Role-Based Access Control
- Features are dynamically shown/hidden based on user role
- Admin-only sections are clearly marked
- Automatic redirection to onboarding for incomplete profiles

## Technical Implementation

### Data Storage
Currently using localStorage for demonstration:
- `onboarding_completed_{user_id}`: Boolean flag
- `user_profile_{user_id}`: Complete user profile data

### Production Considerations
1. **Database Integration**: Replace localStorage with proper database storage
2. **Security**: Implement secure admin verification system
3. **Validation**: Add server-side validation for all user inputs
4. **Audit Trail**: Log all role assignments and changes

## User Flow

1. **New User Registration**:
   - User signs up with email/password
   - Redirected to onboarding process
   - Cannot access dashboard until onboarding is complete

2. **Existing Users**:
   - Automatic check for onboarding completion
   - Redirect to onboarding if incomplete
   - Full access to role-appropriate features once complete

3. **Dashboard Experience**:
   - Personalized welcome with user role information
   - Role-based feature cards
   - Clear distinction between member and admin features

## Admin Features

### Member Management
- View all community members
- Add new members manually
- Edit member information
- Manage member roles and permissions

### Khairat Program Management
- Create and edit khairat programs
- Manage khairat payments
- Review khairat claims

- Track khairat contributions
- Generate financial analytics

### Communication
- Manage notification preferences
- Broadcast important messages

## Future Enhancements

1. **Multi-Mosque Support**: Support for multiple mosque locations
2. **Advanced Permissions**: Granular permission system
3. **Approval Workflow**: Admin approval process for new members
4. **Integration**: Connect with existing mosque management systems
5. **Mobile App**: Dedicated mobile application

## Support

For technical support or questions about the onboarding process, contact the mosque administration or system administrators.