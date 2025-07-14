# User Onboarding Feature

## Overview

The onboarding feature provides a guided profile setup experience for new users after they sign up for the Mosque Management System. This ensures that users provide essential information needed for the system to function effectively.

## Features

### Multi-Step Profile Setup

The onboarding process is divided into 3 logical steps:

1. **Personal Information** (Required)

   - Full Name
   - Username
   - Phone Number
   - Date of Birth
   - Gender

2. **Contact & Address** (Optional)

   - Full Address
   - Emergency Contact Name
   - Emergency Contact Phone

3. **Background Information** (Required)
   - Marital Status
   - Occupation (Optional)
   - Education Level
   - Interests & Skills (Optional)

### Progressive Validation

Each step is validated independently, allowing users to proceed only when required fields are completed.

### Smart Redirection

- New users are automatically redirected to onboarding after signup
- Existing users with incomplete profiles are redirected when accessing protected routes
- Users can skip onboarding and complete it later from their account settings

### Profile Completion Tracking

- Real-time progress indicator shows completion percentage
- Dashboard displays profile completion card for users with incomplete profiles
- Welcome notification appears for users who just completed onboarding

## Technical Implementation

### Components

- `/src/app/onboarding/page.tsx` - Main onboarding page
- `/src/components/guards/ProfileGuard.tsx` - Route protection and redirection
- `/src/components/dashboard/WelcomeNotification.tsx` - Welcome message for new users
- `/src/components/dashboard/ProfileCompletionCard.tsx` - Profile completion reminder

### Services

- Extended `AuthService.updateUserProfileExtended()` method for comprehensive profile updates
- Profile completion utilities in `/src/utils/profileUtils.ts`

### Database

- Enhanced profiles table with additional fields (see migration `003_extended_profiles.sql`)
- Profile completion timestamp tracking

## User Experience

### For New Users

1. Sign up with email, password, and basic name
2. Receive email verification
3. Upon login, automatically redirected to onboarding
4. Complete 3-step profile setup process
5. Redirected to dashboard with welcome notification

### For Existing Users

- Profile completion card appears on dashboard if profile is incomplete
- Can access onboarding anytime from account settings
- Gentle reminders without blocking access to core functionality

## Configuration

### Required Fields

The system considers a profile "complete" when these fields are filled:

- Full Name
- Phone Number
- Email
- Username

### Optional Fields

Additional information enhances the user experience but doesn't block access:

- Address, Date of Birth, Emergency Contacts, Occupation, Education, Interests

## Future Enhancements

1. **Mosque Selection**: Allow users to select or request to join specific mosques
2. **Profile Photos**: Add avatar upload functionality
3. **Skills Matching**: Match users with mosque activities based on interests
4. **Mentor Assignment**: Pair new members with existing community members
5. **Progressive Disclosure**: Show additional fields based on user role
6. **Localization**: Multi-language support for onboarding content

## Development Notes

- Uses React Hook Form with Zod validation for type safety
- Responsive design works on mobile and desktop
- Graceful degradation if extended profile fields aren't available yet
- Middleware handles route protection
- Profile completion percentage calculation is centralized in utilities
