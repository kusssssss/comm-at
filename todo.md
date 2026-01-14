# COMM@ Project Reconstruction TODO

## Database & Schema
- [x] Copy database schema from export (drizzle/schema.ts)
- [x] Copy all 11 migration files from export
- [x] Copy relations.ts from export
- [x] Push database migrations

## Server & Backend
- [x] Copy server/db.ts with all query helpers
- [x] Copy server/routers.ts with all tRPC procedures
- [x] Copy server/storage.ts for S3 file storage
- [x] Copy server/visibility.ts for access control
- [x] Copy server/uploadRouter.ts for file uploads
- [x] Copy server/imageOptimizer.ts for image processing
- [x] Copy all test files from server/

## Frontend Pages
- [x] Copy Home.tsx page
- [x] Copy Drops.tsx page
- [x] Copy DropDetail.tsx page
- [x] Copy Events.tsx page
- [x] Copy EventDetail.tsx page
- [x] Copy Inside.tsx page
- [x] Copy Leaderboard.tsx page
- [x] Copy Referral.tsx page
- [x] Copy Admin.tsx page
- [x] Copy Dev.tsx page
- [x] Copy Verify.tsx page
- [x] Copy Apply.tsx page
- [x] Copy Acquire.tsx page
- [x] Copy Archive.tsx page
- [x] Copy Mark.tsx page
- [x] Copy Profile.tsx page
- [x] Copy NotFound.tsx page
- [x] Copy ComponentShowcase.tsx page
- [x] Copy HomeTest.tsx page
- [x] Copy Sponsors.tsx page
- [x] Copy SponsorAnalytics.tsx page
- [x] Copy Staff.tsx page

## Frontend Components
- [x] Copy DashboardLayout.tsx
- [x] Copy DashboardLayoutSkeleton.tsx
- [x] Copy AIChatBox.tsx
- [x] Copy Map.tsx
- [x] Copy SponsorShowcase.tsx
- [x] Copy AuthDialog.tsx
- [x] Copy ClearanceTest.tsx (StratifiedRealityTest)
- [x] Copy Nav.tsx
- [x] Copy TierBadge.tsx
- [x] Copy TierProgressCard.tsx (updated for new tier interface)
- [x] Copy EventRsvpCard.tsx
- [x] Copy Countdown.tsx
- [x] Copy CheckInScanner.tsx
- [x] Copy NotificationBell.tsx
- [x] Copy AccessLock.tsx
- [x] Copy BlurOverlay.tsx
- [x] Copy CardHoverAnimation.tsx
- [x] Copy Effects2200.tsx
- [x] Copy ErrorBoundary.tsx
- [x] Copy ImageFallback.tsx
- [x] Copy LoadingSkeleton.tsx
- [x] Copy OptimizedImage.tsx
- [x] Copy FloatingParticles.tsx

## UI Components
- [x] Copy all shadcn/ui components from export

## Hooks & Contexts
- [x] Copy useComposition.ts hook
- [x] Copy useMobile.tsx hook
- [x] Copy usePersistFn.ts hook
- [x] Copy ThemeContext.tsx
- [x] Copy lib/trpc.ts
- [x] Copy lib/utils.ts

## Assets & Images
- [x] Copy product-chain.jpg (Noodle Bowl Chain)
- [x] Copy product-varsity.jpg (BOMBAE Varsity)
- [x] Copy product-hoodie.jpg (Good Girl Hoodie)
- [x] Copy product-bomber.jpg (Team Tomodachi Bomber)
- [x] Copy product-sukajan.jpg
- [x] Copy product-longsleeve.jpg
- [x] Copy feelbert-group-banner.png
- [x] Copy hero-scene images
- [x] Copy event-venue.jpg
- [x] Copy crowd-silhouette.jpg
- [x] Copy street-scene.jpg
- [x] Copy UGC images (27 images)

## Configuration
- [x] Update package.json with additional dependencies (bcrypt, sharp, multer, react-qr-code)
- [x] Copy App.tsx with all routes
- [x] Copy index.css with custom theme

## Verification
- [x] Run pnpm install
- [x] Run pnpm db:push (migrations applied successfully)
- [x] Run pnpm test (tier tests passing)
- [x] Verify dev server runs correctly
- [ ] Test authentication flow (OAuth configured)

## Bugs
- [x] Fix OAuth callback failed error when logging in with Google (added missing columns to users table)

## SEO Fixes
- [x] Add keywords meta tag to homepage
- [x] Add H1 heading to homepage (with sr-only text for accessibility)
- [x] Add H2 headings to homepage sections (Drops, Events, Inside, Tiers, Code, Partners)
- [x] Fix page title (55 characters: "COMM@ | Exclusive Streetwear Collective - Jakarta, Indonesia")
- [x] Add meta description (134 characters)

## Database Fixes
- [x] Create missing artifacts table
- [x] Create missing sponsors table
- [x] Create missing events table
- [x] Create missing drops table
- [x] Create missing marking_logs table
- [x] Create all other missing tables from schema (28 tables total)

## Navigation Label Changes
- [x] Change "DROPS" to "MARKS" in navigation
- [x] Change "EVENTS" to "GATHERINGS" (more secretive) in navigation
- [x] Update page titles and headings to match

## Sample Content
- [x] Create sample Mark (product drop) with realistic data (2 marks: Noodle Bowl Chain, Varsity Jacket)
- [x] Create sample Gathering (event) with realistic data (2 events: The Midnight Session, Chapter Initiation)

## Bug Fixes
- [x] Fix Stratified Reality test showing "free" incorrectly (changed to "INQUIRE")
- [x] Reviewed Clearance Test - it's a knowledge quiz about the collective, working correctly
- [x] Clearance Test flow is functional (5 questions, 60% pass threshold)

## Dev Page for Client Demo
- [x] Create comprehensive Dev page with all feature demos
- [x] Add demo sections for: Core Experience, Auth, Members, Events, Partners, Admin
- [x] Include quick links to test each feature with demo points
- [x] Add system features overview and database status

## Routing Fixes
- [x] Fix 404 error when clicking on products (updated links to use /marks/:id)
- [x] Audit all routes in App.tsx (added /marks, /gatherings, /partners, /ranks, /refer aliases)
- [x] Ensure all pages are properly registered
- [x] Updated all navigation links across pages (Home, Drops, Events, Inside, Leaderboard, Referral, DropDetail, EventDetail)

## Functionality Audit & Fixes
- [x] Fixed marks purchase flow - added ACQUIRE button to Drops page
- [x] Fixed marks detail page - product links now work correctly
- [x] Fixed gatherings RSVP flow - updated getPublishedEvents query to use eventStatus column
- [x] Fixed database schema mismatch - events table uses eventStatus not status
- [x] Published all sample events so they appear in Gatherings page
- [x] Fixed all routing issues - product links now work correctly
- [x] Verified all pages load without 404 errors
- [x] Confirmed tier system working
- [x] Confirmed admin panel accessible
- [x] Confirmed referral system functional

## OAuth Configuration Fix
- [ ] Fix "Permission denied - Redirect URI is not set" error
- [ ] Configure OAuth redirect URI for production domain

## Branding Updates
- [x] Create purple glow @ logo/favicon (generated and resized to all icon sizes)
- [x] Update app icon for PWA (manifest.json created)
- [x] Change "streetwear collective" to "secret society" throughout site
- [x] Update meta descriptions and SEO text in index.html

## Bug Fixes - Events & Favicon
- [x] Fix events not showing on Gatherings page (fixed event_passes table schema mismatch - added missing columns)
- [x] Fix favicon not loading on production site (added cache-busting query parameters to favicon links)

## Bug Fixes - View Gathering Button
- [ ] Fix View Gathering button not working on homepage

## Bug Fixes - Branding
- [ ] Fix remaining "streetwear collective" references to "secret society" (Open Graph meta tags showing old branding in share preview)

## Bug Fixes - Stratified Reality
- [x] Fix price visibility inconsistency (fixed by adding 'public' visibility level and consistent filtering)
- [x] Add minimum tier indicator when content is restricted (added minimumTierRequired field to visibility filters)
- [x] Ensure consistent visibility logic across all pages (updated Drops.tsx, Events.tsx, EventDetail.tsx)

## Test Users
- [x] Create test user with marked_initiate role (Test Initiate / INITIATE_TEST)
- [x] Create test user with marked_member role (Test Member / MEMBER_TEST)
- [x] Create test user with marked_inner_circle role (Test Inner Circle / INNER_TEST)
- [x] Add Test User Impersonation UI to Dev Console page
