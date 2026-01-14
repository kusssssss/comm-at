# Debug Notes - Events Issue

## Events in Admin Panel
All 3 events show as "published":
1. the hanging - South Jakarta - published
2. CHAPTER INITIATION - South Jakarta - 2/4/2026, 1:11:05 PM - published
3. THE MIDNIGHT SESSION - Jakarta - 1/21/2026, 1:10:56 PM - published

## Issue
Events are published but not showing on /gatherings page.

## Root Cause Analysis
The getPublishedEvents query uses eventStatus='published' but the Events page may have additional filtering:
- Role eligibility check (marked_initiate, marked_member, marked_inner_circle)
- User role check in routers.ts

The user's role is 'admin' but the role hierarchy only includes marked roles.
Need to check if admin/staff bypass is working correctly.
