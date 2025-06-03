# Testing Guide for Application and Evaluator Dashboard Fixes

## Overview
This guide explains how to test the fixes implemented for the applicant and evaluator dashboards.

## Fixes Implemented

### 1. Enhanced Debugging and Monitoring
- Added detailed console logging for API calls and data transformations
- Added manual refresh buttons to both dashboards
- Added last refresh timestamp display
- Added debug information panel (visible in development mode)

### 2. Applicant Dashboard (`/dashboard/applicant`)
- Fixed data fetching from `/api/applications`
- Added proper error handling and display
- Added Cache-Control headers to prevent stale data
- Enhanced table with real-time data updates

### 3. Evaluator Dashboard (`/dashboard/evaluator`)  
- Fixed data fetching from `/api/applications/dashboard/list`
- Added filtering to show only `submitted` and `in_evaluation` applications
- Added applicant name column to the table
- Enhanced debugging for data transformation

### 4. New Application Submission
- Explicitly sets status to `submitted` when creating new applications
- Added comprehensive logging for submission process
- Clears cached form data after successful submission

### 5. Security Target Submission
- Updates application status to `submitted` after security target is saved
- Ensures application appears in evaluator's dashboard

### 6. Evaluation Page (`/dashboard/evaluator/evaluation/[id]`)
- Enhanced help/guide display for each class
- Added evaluation criteria display if available
- Added applicant's descriptions and justifications display
- Added per-class evaluation controls (pass/fail/needs revision)
- Added evaluator notes field

## Testing Steps

### 1. Test Data Refresh
1. Open browser developer console (F12)
2. Navigate to applicant dashboard
3. Look for console logs showing:
   - `🔍 Loading applications for applicant...`
   - `📊 Raw API Response Data`
   - `✅ Transformed Data`
4. Click the manual refresh button and verify data reloads
5. Check the "last refresh" timestamp updates

### 2. Test New Application Submission
1. As an applicant, click "درخواست جدید"
2. Fill out the form with test data
3. Submit the application
4. Check console for:
   - `📤 Submitting new application...`
   - `✅ Application submitted successfully`
5. Verify you're redirected to dashboard
6. Verify the new application appears in the table with status "ارسال شده"

### 3. Test Evaluator View
1. Log in as an evaluator
2. Navigate to evaluator dashboard
3. Check console for:
   - `🎯 Filtered applications for evaluator`
   - Number of applications with `submitted` or `in_evaluation` status
4. Verify only relevant applications are shown
5. Click manual refresh to ensure latest data

### 4. Test Evaluation Process
1. As evaluator, click "شروع ارزیابی" on an application
2. For each class, click "نمایش راهنما"
3. Check console for:
   - `📚 Fetching help for class`
   - `✅ Help data loaded`
4. Verify help text is displayed properly
5. Test scoring and note-taking functionality

### 5. API Testing Utility
Open browser console and run:
```javascript
testAPIEndpoints()
```
This will test all API endpoints and show their responses.

## Common Issues and Solutions

### Issue: Table shows "هیچ درخواستی یافت نشد"
**Solution:** 
- Check console for API errors
- Verify authentication token is valid
- Check if backend is returning data
- Use manual refresh button

### Issue: New submissions don't appear in evaluator dashboard
**Solution:**
- Verify application status is `submitted`
- Check console logs during submission
- Ensure both dashboards are refreshed
- Check API response in network tab

### Issue: Evaluation help not showing
**Solution:**
- Check console for help loading errors
- Verify help data exists in backend
- Check if class IDs match

## Debug Mode Features
In development mode, you'll see:
- Debug information panel at bottom of dashboards
- Detailed console logging
- API endpoint information
- Current user information

## Backend Requirements
Ensure the backend API:
1. Returns proper data for `/api/applications`
2. Returns filtered data for `/api/applications/dashboard/list`
3. Accepts status updates via PATCH `/api/applications/{id}/status`
4. Provides evaluation help via `/api/security-targets/evaluation-help/{class_id}` 