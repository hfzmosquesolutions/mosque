# Testing Legacy Payment Records

## Complete Flow Testing Guide

### Prerequisites

1. Have at least one mosque in the system
2. Have admin access to that mosque  
3. Have at least one user registered as a kariah/khairat member

### Test Flow

## Step 1: Prepare Test Data

Create a test CSV file named `test-legacy-records.csv`:

```csv
ic_passport_number,full_name,payment_date,amount,payment_method,invoice_number,description,address_line1,address_line2,address_line3
"123456-78-9012","Ahmad bin Ali","2020-01-15",100.00,"cash","INV001","Annual contribution 2020","123 Jalan Masjid","Taman Sejahtera","50000 Kuala Lumpur"
"234567-89-0123","Fatimah binti Hassan","2020-02-20",150.00,"bank transfer","INV002","Annual contribution 2020","45 Lorong Bahagia","","51000 Kuala Lumpur"
"345678-90-1234","Muhammad bin Ibrahim","2020-03-10",200.00,"cash","INV003","Special contribution","78 Jalan Raya","Kampung Baru","52000 Kuala Lumpur"
```

**Important:** Use IC/Passport numbers that match users in your system for easy testing.

## Step 2: Admin Upload (Backend)

1. **Login as Admin**
   ```
   URL: /login
   Use admin credentials
   ```

2. **Navigate to Khairat Management**
   ```
   URL: /khairat
   Should see: Dashboard with multiple tabs
   ```

3. **Go to Legacy Data Tab**
   ```
   Click: "Legacy Data" tab
   Should see: Legacy Data Management interface
   ```

4. **Upload CSV**
   - Click "Upload Legacy Data" button
   - Download template to verify format (optional)
   - Click file input and select `test-legacy-records.csv`
   - **Verify Preview Shows:**
     - All 3 records displayed in preview table
     - Columns: IC/Passport, Full Name, Payment Date, Amount, Method
     - Data looks correct

5. **Confirm Upload**
   - Click "Upload Records" button
   - Wait for success toast: "Successfully uploaded 3 records"
   - **Verify:**
     - Records appear in main table
     - All show "Unmatched" badge (yellow)
     - Stats card shows: 3 total records, 0 matched, 3 unmatched

## Step 3: Match Records to Users

### Test Single Match

1. **Find Unmatched Record**
   ```
   In the Legacy Data table:
   - Find record with IC matching a test user (e.g., "123456-78-9012")
   - Status should show "Unmatched"
   ```

2. **Click Match Button**
   - Click "Match" button for that record
   - **Match Dialog Opens**

3. **Verify Match Dialog Shows:**
   - ✅ Record details (Name, IC, Amount, Payment Date)
   - ✅ List of mosque members
   - ✅ Checkbox: "Show All Members" (default: unchecked)
   - ✅ Members with matching IC highlighted with green badge
   - ✅ Program selection dropdown

4. **Select User**
   - If IC matches, user should be at the top with "IC Match" badge
   - Click radio button for correct user
   - Select a khairat program

5. **Confirm Match**
   - Click "Match Record" button
   - Wait for success toast: "Record matched successfully"
   - **Verify:**
     - Dialog closes
     - Record in table now shows "Matched" badge (green)
     - "Matched User" column shows user's name
     - Stats updated: 1 matched, 2 unmatched

### Test Bulk Match

1. **Select Multiple Records**
   - Check boxes for 2 remaining unmatched records
   - "Bulk Actions" button should show count: "(2)"

2. **Open Bulk Match**
   - Click "Bulk Actions" dropdown
   - Click "Bulk Match (2)"
   - **Bulk Match Dialog Opens**

3. **Verify Bulk Match Dialog:**
   - ✅ Summary box shows 2 selected records
   - ✅ Lists record names, ICs, amounts
   - ✅ User selection dropdown
   - ✅ Program selection dropdown

4. **Execute Bulk Match**
   - Select a test user from dropdown
   - Select a khairat program
   - Click "Match 2 Records" button
   - Wait for success toast: "Successfully matched 2 records"
   - **Verify:**
     - All records now show "Matched"
     - Stats: 3 matched, 0 unmatched
     - Selection cleared

## Step 4: Verify Backend Data

### Check Database (Optional)

If you have database access:

```sql
-- Check legacy records table
SELECT 
  id, full_name, ic_passport_number, amount, 
  is_matched, matched_user_id, contribution_id
FROM legacy_khairat_records
WHERE mosque_id = 'YOUR_MOSQUE_ID'
ORDER BY created_at DESC;

-- Check created contributions
SELECT 
  c.id, c.contributor_id, c.amount, c.contributed_at,
  c.payment_method, c.status
FROM khairat_contributions c
WHERE c.payment_method = 'legacy_record'
ORDER BY c.created_at DESC;
```

**Expected Results:**
- All 3 legacy records have `is_matched = true`
- All have `matched_user_id` set
- All have `contribution_id` linking to khairat_contributions
- 3 new contributions exist with `payment_method = 'legacy_record'`

## Step 5: User View (Frontend)

### Test as Regular User

1. **Logout and Login as User**
   ```
   Logout from admin account
   Login as the user who was matched to records
   (e.g., user with IC "123456-78-9012")
   ```

2. **Navigate to My Khairat**
   ```
   URL: /my-khairat
   Click: "Payment History" tab
   ```

3. **Verify Payment History Display:**
   - ✅ See both current AND legacy contributions
   - ✅ Legacy records have amber "Legacy" badge next to program name
   - ✅ Legacy records show correct amounts
   - ✅ Payment method shows "Legacy Record"
   - ✅ Payment date shows historical date (2020-01-15, etc.)
   - ✅ Records sorted chronologically

4. **Click View Details on Legacy Record**
   - Click "View" button on a legacy record
   - **Modal Opens with Details:**
     - ✅ Program: "Legacy Khairat"
     - ✅ Mosque name shown
     - ✅ Amount displayed correctly
     - ✅ Status: "Completed" (with green icon)
     - ✅ Payment Method: "Legacy Record"
     - ✅ Date: Historical payment date
     - ✅ Payment Reference: Invoice number (if available)
     - ✅ Notes: Description (if available)

5. **Test Search/Filter**
   - Use search box to search for "Legacy"
   - **Verify:** Only legacy records appear
   - Clear search
   - **Verify:** All records show again

## Step 6: Test Unmatch (Admin)

1. **Back to Admin Dashboard**
   ```
   Logout and login as admin
   Navigate to /khairat → Legacy Data tab
   ```

2. **Unmatch a Record**
   - Find a matched record
   - Click "Unmatch" button
   - **Confirmation Dialog Shows:**
     - ✅ Warning message
     - ✅ Lists what will happen:
       - Delete contribution
       - Reset status
       - Cannot undo

3. **Confirm Unmatch**
   - Click "Unmatch Record" button
   - Wait for success toast: "Record unmatched successfully"
   - **Verify:**
     - Record status changes to "Unmatched"
     - Stats updated: 2 matched, 1 unmatched

4. **Verify User View Updated**
   - Switch to user account
   - Check Payment History
   - **Verify:** Unmatched record NO LONGER appears

## Step 7: Test Filters and Search

### As Admin

1. **Test Match Filter**
   - Select "Matched Only" from filter dropdown
   - **Verify:** Only matched records show
   - Select "Unmatched Only"
   - **Verify:** Only unmatched records show
   - Select "All Records"
   - **Verify:** All records show

2. **Test Search**
   - Type user's name in search box
   - **Verify:** Only records matching that name show
   - Type IC number
   - **Verify:** Record with that IC shows
   - Clear search
   - **Verify:** All records show again

3. **Test Pagination** (if > 10 records)
   - Should show page controls at bottom
   - Click "Next" button
   - **Verify:** Next page of records loads

## Expected Results Summary

✅ **Admin Can:**
- Upload CSV files with legacy records
- Preview data before importing
- Match individual records to users
- Bulk match multiple records at once
- See suggested matches based on IC number
- View statistics (total, matched, unmatched, amounts)
- Unmatch records if needed
- Search and filter records

✅ **Users Can:**
- See combined payment history (legacy + current)
- Distinguish legacy records with "Legacy" badge
- View full details of legacy payments
- See historical payment dates
- Search through all payments
- Access from "My Khairat" or "My Mosques" pages

✅ **System:**
- Creates khairat_contribution for each matched legacy record
- Links contribution to legacy record via contribution_id
- Maintains data integrity when unmatching
- Displays data chronologically
- Translates labels (English/Malay)

## Common Issues and Solutions

### Issue: CSV upload fails

**Solution:**
- Check CSV format matches template exactly
- Ensure dates are in YYYY-MM-DD format
- Verify amounts are numeric (no currency symbols)
- Check file encoding (UTF-8)

### Issue: No users show in match dialog

**Solution:**
- Verify users have active kariah/khairat membership
- Check if users have completed their profiles
- Try checking "Show All Members" checkbox

### Issue: User doesn't see legacy records

**Solution:**
- Verify admin has matched the record
- Check IC/Passport number matches correctly
- Ensure user is logged in with correct account
- Refresh the page

### Issue: Stats don't update after matching

**Solution:**
- Reload the page
- Check browser console for errors
- Verify API calls completed successfully

## Performance Testing

For large datasets:

1. **Upload 100+ records**
   - Should complete in reasonable time
   - Preview should paginate

2. **Test bulk match with 50+ records**
   - Should handle without timeout
   - Progress indication helpful

3. **User with 100+ total contributions**
   - Payment history should load smoothly
   - Search/filter should be responsive

---

## Testing Checklist

- [ ] CSV upload works
- [ ] Preview shows correct data
- [ ] Single record matching works
- [ ] Bulk matching works
- [ ] IC auto-matching suggests correct users
- [ ] Statistics update correctly
- [ ] User sees combined history
- [ ] Legacy badge displays
- [ ] Details modal shows all information
- [ ] Unmatch works correctly
- [ ] User view updates after unmatch
- [ ] Search functionality works
- [ ] Filter functionality works
- [ ] Pagination works (if applicable)
- [ ] Translations work (English/Malay)
- [ ] No console errors
- [ ] Mobile responsive

---

**Testing Completed:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

