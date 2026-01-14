# COMM@ Functionality Audit Notes

## Marks Page (/marks)
- Page loads correctly with carousel showing 2 marks
- Varsity Jacket displayed with price IDR 4,500,000
- Shows "25 EDITION" badge
- Has "VERIFY MARK" button - this is for verification, NOT purchase
- Sale countdown timer working (13d 23h 12m 09s)
- No visible "BUY" or "ACQUIRE" button on this page

## Issue Identified
- The marks page only has "VERIFY MARK" button
- There's no purchase/acquire flow visible
- Need to check if there's an Acquire page or if purchase flow is missing

## Acquire Flow Status
- FIXED: Added "ACQUIRE THIS MARK" button to Drops page
- Acquire page (/acquire/:dropId) works correctly
- Shows "Clearance Required" for users without clearance
- Has "REQUEST CLEARANCE" button linking to /apply
- Backend procedure mark.acquire exists and is functional

## Next Steps
- Check gatherings RSVP flow
- Check verify flow
- Check admin panel
- Check other pages
