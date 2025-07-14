# Khairat (Death Benefits) Management System

This document provides a comprehensive guide to the Khairat (Death Benefits) management system implemented in the mosque management application.

## Overview

The Khairat system allows mosque members to make contributions towards a death benefits fund, which is then used to provide financial assistance to families of deceased members. The system includes features for:

- Member contribution tracking
- Payment method management (cash, bank transfer, cheque)
- Approval workflow for administrators
- Receipt management and file uploads
- Comprehensive reporting and analytics
- Export functionality

## Database Structure

### Tables Created

1. **khairat_records** - Main table for storing contribution records
2. **khairat_transactions** - Transaction history and audit trail
3. **khairat_settings** - Mosque-specific configuration settings

### Key Fields

#### khairat_records

- `id` - Unique identifier
- `mosque_id` - Reference to mosque
- `member_id` - Reference to contributing member
- `member_name`, `member_phone`, `member_email` - Member details (denormalized)
- `contribution_amount` - Amount contributed
- `payment_method` - Cash, bank transfer, or cheque
- `payment_date` - Date of payment
- `status` - Pending, approved, paid, or rejected
- `receipt_number` - Generated receipt number
- `receipt_file_url` - Uploaded receipt file
- Audit fields for tracking who approved/paid/rejected

#### khairat_settings

- `mosque_id` - Reference to mosque
- `default_contribution_amount` - Default amount to suggest
- `minimum_contribution_amount` - Minimum allowed amount
- `maximum_contribution_amount` - Maximum allowed amount
- `receipt_prefix` - Prefix for receipt numbers (e.g., "KH")
- `auto_generate_receipt_number` - Whether to auto-generate receipts
- `require_receipt_upload` - Whether receipt upload is mandatory
- `allowed_payment_methods` - Array of allowed payment methods
- Approval settings and bank details

## Features Implemented

### 1. Member Features

- **Add Contribution Records**: Members can submit new contribution records
- **View Own Records**: Members can view their contribution history
- **Upload Receipts**: Members can upload payment receipts
- **Track Status**: Members can track the approval status of their contributions

### 2. Administrator Features

- **Manage All Records**: View and manage all contribution records
- **Approval Workflow**: Approve, reject, or mark records as paid
- **Generate Receipt Numbers**: Auto-generate receipt numbers upon approval
- **Advanced Filtering**: Filter by status, payment method, date range
- **Export Data**: Export records to CSV format
- **Statistics Dashboard**: View comprehensive statistics and analytics

### 3. System Features

- **Role-based Access**: Different views for members vs administrators
- **Audit Trail**: Complete transaction history for all changes
- **File Management**: Secure file upload and storage for receipts
- **Multi-language Support**: Full Malay and English translations
- **Responsive Design**: Mobile-friendly interface

## API Services

### KhairatService Class

Located in `/src/services/khairat.ts`

Key methods:

- `getKhairatRecords()` - Fetch records with filtering
- `createKhairatRecord()` - Create new contribution record
- `updateKhairatRecord()` - Update existing record
- `approveKhairatRecord()` - Approve a record
- `rejectKhairatRecord()` - Reject a record
- `markKhairatRecordAsPaid()` - Mark record as paid
- `uploadReceiptFile()` - Upload receipt files
- `getKhairatStatistics()` - Get statistics and analytics
- `exportKhairatRecords()` - Export records to CSV

### Custom Hook: useKhairat

Located in `/src/hooks/useKhairat.ts`

Provides a React hook for managing Khairat operations:

- State management for records, settings, and statistics
- CRUD operations with loading states
- Error handling and user feedback
- Role-based permission checks

## Components

### 1. KhairatRecordForm

Located in `/src/components/khairat/KhairatRecordForm.tsx`

Features:

- Form for creating/editing contribution records
- Member information section
- Payment details with conditional fields
- Status management (admin only)
- Receipt file upload
- Comprehensive validation

### 2. Khairat Main Page

Located in `/src/app/khairat/page.tsx`

Features:

- Statistics dashboard with key metrics
- Role-based views (member vs admin)
- Advanced filtering and search
- Export functionality
- Records management table

## User Roles and Permissions

### Member

- Can create their own contribution records
- Can view their own records only
- Can upload receipts
- Cannot change record status

### AJK (Committee Member)

- Can view all records
- Can approve/reject records
- Can mark records as paid
- Can generate receipt numbers

### Mosque Admin

- Full access to all features
- Can manage settings
- Can delete records
- Can export data

### Super Admin

- Complete system access
- Can manage all mosques

## Workflow

### 1. Member Submits Contribution

1. Member fills out contribution form
2. System creates record with "pending" status
3. Member can upload receipt (optional)
4. Record appears in admin dashboard for review

### 2. Admin Reviews Contribution

1. Admin sees pending records in dashboard
2. Admin can approve, reject, or request more information
3. Upon approval, receipt number is auto-generated
4. Member is notified of status change

### 3. Payment Processing

1. Approved records can be marked as "paid"
2. System tracks who processed the payment and when
3. Complete audit trail is maintained

## Configuration

### Environment Variables

- Supabase URL and keys for database access
- Storage bucket configuration for file uploads

### Mosque Settings

Each mosque can configure:

- Default contribution amounts
- Minimum/maximum limits
- Receipt number format
- Approval requirements
- Allowed payment methods
- Bank account details

## File Structure

```
src/
├── app/khairat/
│   └── page.tsx                 # Main Khairat page
├── components/khairat/
│   └── KhairatRecordForm.tsx    # Form component
├── hooks/
│   └── useKhairat.ts            # Custom hook
├── services/
│   └── khairat.ts               # API service
├── types/
│   └── database.ts              # TypeScript types
└── lib/
    └── translations.ts          # Multi-language support
```

## Database Migration

The database migration is provided in:
`/supabase/migrations/002_khairat_tables.sql`

This migration includes:

- Table creation with proper relationships
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for audit trails
- Helper functions for receipt number generation

## Testing

### Manual Testing Steps

1. **Member Flow**:

   - Login as member
   - Create new contribution record
   - Upload receipt
   - View record status

2. **Admin Flow**:
   - Login as admin
   - View all pending records
   - Approve/reject records
   - Generate reports
   - Export data

### Key Test Cases

- Form validation
- File upload limits
- Role-based access control
- Receipt number generation
- Status change audit trail

## Security Considerations

1. **Row Level Security**: All database access is protected by RLS policies
2. **File Upload Security**: File type and size validation
3. **Role-based Access**: Different permissions for different user roles
4. **Audit Trail**: Complete logging of all changes
5. **Data Privacy**: Member data is only accessible to authorized users

## Performance Optimizations

1. **Database Indexes**: Proper indexing on frequently queried fields
2. **Pagination**: Large datasets are paginated for better performance
3. **Caching**: Statistics and settings are cached appropriately
4. **Lazy Loading**: Components and data are loaded on demand

## Future Enhancements

1. **Email Notifications**: Automatic notifications for status changes
2. **SMS Integration**: SMS alerts for important updates
3. **Advanced Reporting**: More detailed analytics and charts
4. **Bulk Operations**: Bulk approval/rejection of records
5. **Mobile App**: Dedicated mobile application
6. **Payment Gateway**: Integration with online payment systems
7. **QR Code Receipts**: Generate QR codes for receipt verification

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check user roles and RLS policies
2. **File Upload Fails**: Verify file type and size limits
3. **Receipt Number Not Generated**: Check mosque settings for auto-generation
4. **Statistics Not Loading**: Ensure proper mosque_id association

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify database connections and queries
3. Check Supabase logs for server-side errors
4. Validate user permissions and roles

## Support

For technical support or questions about the Khairat system:

1. Check the application logs
2. Review the database migration status
3. Verify user permissions
4. Contact system administrator

---

This implementation provides a complete, production-ready Khairat management system with comprehensive features for both members and administrators.
