# Legacy Payment Records System

## Overview

The Legacy Payment Records system allows mosque administrators to import historical payment records from their previous systems. Once imported and matched to users, members can see their complete payment history including both legacy and current contributions.

## System Architecture

### Database

**Table:** `legacy_khairat_records`

Key fields:
- `id`: UUID primary key
- `mosque_id`: Reference to mosque
- `ic_passport_number`: Identification number
- `full_name`: Payer's name
- `amount`: Payment amount
- `payment_date`: Date of payment
- `payment_method`: Method of payment
- `invoice_number`: Invoice/receipt reference
- `is_matched`: Boolean indicating if matched to a user
- `matched_user_id`: Reference to user profile when matched
- `contribution_id`: Reference to created contribution record

### How It Works

```
1. Admin Upload
   ↓
2. CSV Import → legacy_khairat_records table
   ↓
3. Admin Match Record to User (by IC/Name)
   ↓
4. System Creates khairat_contribution + Links to legacy_record
   ↓
5. User Sees Combined History (Legacy + Current)
```

## Features Implemented

### ✅ Admin Features

1. **CSV Upload** (`/khairat` → Legacy Data tab)
   - Upload CSV files with historical records
   - Preview data before import
   - Bulk import validation

2. **Manual Matching** 
   - Match individual legacy records to users
   - IC/Passport number auto-matching
   - Suggest potential matches
   - Bulk matching for multiple records

3. **Management Dashboard**
   - View all legacy records
   - Filter by matched/unmatched status
   - Statistics (total records, matched records, amounts)
   - Search functionality

### ✅ User Features

1. **Combined Payment History**
   - View both legacy and current contributions
   - Unified payment table
   - Visual "Legacy" badge for historical records
   - Chronological sorting

2. **Legacy Record Details**
   - Amount paid
   - Payment date
   - Payment method
   - Invoice/receipt number
   - Description/notes

## API Functions

### Admin APIs

**Location:** `/src/lib/api/legacy-records.ts`

```typescript
// Create legacy records from CSV
createLegacyKhairatRecords(data: { mosque_id, records })

// Get all legacy records with filters
getLegacyKhairatRecords(filters: { mosque_id, page, limit, search, match_filter })

// Match single record to user
matchLegacyKhairatRecords({ legacy_record_id, user_id, program_id })

// Bulk match multiple records
bulkMatchLegacyKhairatRecords({ legacy_record_ids, user_id, program_id })

// Unmatch record
unmatchLegacyKhairatRecords({ legacy_record_id })

// Get statistics
getLegacyRecordStats(mosqueId)
```

### User APIs

**Location:** `/src/lib/api.ts`

```typescript
// Get combined payment history (NEW)
getUserPaymentHistory(userId, mosqueId?)
  Returns: Array of {
    id, amount, contributed_at, status,
    payment_method, payment_reference, notes,
    program, mosque,
    payment_type: 'legacy' | 'current'  // ← Distinguishes type
  }
```

## CSV Format

Download template: `/public/legacy-khairat-records-template.csv`

Required columns:
```csv
ic_passport_number,full_name,payment_date,amount,payment_method,invoice_number,description,address_line1,address_line2,address_line3
```

Example:
```csv
"123456-78-9012","Ahmad bin Ali","2020-01-15",100.00,"cash","INV001","Khairat contribution","123 Main St","","Kuala Lumpur"
```

## UI Components

### Admin Components

1. **LegacyDataManagement** (`/src/components/admin/LegacyDataManagement.tsx`)
   - Main management interface
   - CSV upload dialog
   - Data table with match/unmatch actions
   - Bulk operations

2. **LegacyKhairatDashboard** (`/src/components/admin/LegacyKhairatDashboard.tsx`)
   - Tabbed interface for legacy data, applications, and memberships
   - Statistics cards

### User Components

1. **UserPaymentsTable** (`/src/components/khairat/UserPaymentsTable.tsx`)
   - Enhanced to show legacy badge
   - Displays combined payment history
   - Supports legacy payment method labels

## User Pages Updated

1. **My Khairat** (`/src/app/[locale]/my-khairat/page.tsx`)
   - Now uses `getUserPaymentHistory()`
   - Shows combined legacy + current contributions

2. **My Mosques** (`/src/app/[locale]/my-mosques/page.tsx`)
   - Same updates as My Khairat page
   - Unified payment history view

## Translations

**English** (`messages/en.json`)
```json
{
  "legacy": "Legacy",
  "legacyRecord": "Legacy Record"
}
```

**Malay** (`messages/ms.json`)
```json
{
  "legacy": "Legasi",
  "legacyRecord": "Rekod Legasi"
}
```

## Usage Guide

### For Administrators

1. **Navigate to Legacy Data Management**
   - Go to `/khairat` page
   - Click "Legacy Data" tab (if using LegacyKhairatDashboard)
   - Or access via admin dashboard

2. **Upload CSV File**
   - Click "Upload Legacy Data" button
   - Download template if needed
   - Select your CSV file
   - Preview the data
   - Click "Upload Records"

3. **Match Records to Users**
   - View unmatched records in the table
   - Click "Match" button on a record
   - System suggests users with matching IC/Passport numbers
   - Select the correct user
   - Choose khairat program
   - Confirm match

4. **Bulk Operations**
   - Select multiple records using checkboxes
   - Click "Bulk Actions" dropdown
   - Choose "Bulk Match" or "Bulk Unmatch"
   - Complete the operation

### For Users

1. **View Payment History**
   - Navigate to "My Khairat" or "My Mosques"
   - Click "Payment History" tab
   - See all contributions (legacy records show "Legacy" badge)

2. **Identify Legacy Records**
   - Look for amber "Legacy" badge next to program name
   - Payment method shows "Legacy Record"
   - Date reflects historical payment date

## Technical Details

### Matching Process

When admin matches a legacy record:

1. **Validation**
   - Check if record exists and is unmatched
   - Verify user exists and has active membership
   - Validate program selection

2. **Create Contribution**
   - Create `khairat_contribution` record with:
     - `contributor_id`: matched user
     - `amount`: from legacy record
     - `contributed_at`: legacy payment_date
     - `status`: 'completed'
     - `payment_method`: 'legacy_record'
     - `payment_reference`: legacy invoice_number

3. **Update Legacy Record**
   - Set `is_matched = true`
   - Set `matched_user_id = user.id`
   - Set `contribution_id = contribution.id`

4. **User Can Now See**
   - The matched record appears in their payment history
   - Combined with current contributions
   - Sorted chronologically

### Unmatching Process

When admin unmatches a record:

1. Delete the associated `khairat_contribution` record
2. Reset legacy record fields:
   - `is_matched = false`
   - `matched_user_id = NULL`
   - `contribution_id = NULL`

## Benefits

1. **Historical Continuity**: Users can see their complete payment history
2. **Data Migration**: Easy migration from old systems
3. **Trust Building**: Shows long-term payment records
4. **Admin Control**: Full control over matching and verification
5. **Unified View**: Single interface for all payment types

## Future Enhancements

- [ ] Auto-matching based on IC/Passport number
- [ ] Import from other file formats (Excel, JSON)
- [ ] Export matched records report
- [ ] Duplicate detection
- [ ] Advanced search and filtering
- [ ] Audit log for all matching operations

## Support

For issues or questions about legacy payment records:
1. Check this documentation
2. Review the CSV template format
3. Contact system administrator

---

**Last Updated:** November 2025  
**Version:** 1.0

