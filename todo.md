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

## Sponsor Image Fix
- [x] Add octopus NFT image to FEELBERT GROUP sponsor section (generated NEO-OCTO #888 cyberpunk octopus NFT)

## Custom Authentication System (Replace Manus OAuth)
- [x] Design database schema for user credentials (username, password hash, phone)
- [x] Add user_credentials table to store login info
- [x] Build admin UI for creating user accounts with password
- [x] Build admin UI for managing user credentials (reset password, bind phone)
- [x] Implement custom login page (/login)
- [x] Implement password hashing and verification (bcryptjs)
- [x] Add phone number binding to user accounts
- [x] Create session management (JWT tokens)
- [x] Add migration path for existing Manus OAuth users (admin can create credentials for any existing user)
- [x] Test complete authentication flow (login page, admin panel, phone verification)

## UI Fix - Login Page Colors
- [x] Change login page color scheme from purple to blue (updated all purple references to blue/cyan)

## Global Theme Change - Purple to Blue
- [x] Update index.css global theme colors from purple to blue
- [x] Update all component files with purple color references (93 references in 13 files)
- [x] Verify blue theme across all pages (homepage, leaderboard, referral)

## Hero Section - TAKEOVER Text
- [x] Change TAKEOVER text gradient from purple/magenta to blue (updated 200+ purple hex codes across 20 files)


## Homepage Redesign (Nocta-Style)
- [x] Events Hero Section (full viewport, editorial scroll)
  - [x] Full-viewport event cards with large imagery
  - [x] Event info overlay (title, tagline, date, location, CTA)
  - [x] Navigation dots for scrolling between events
  - [x] Filters (Now/Upcoming/This Week, Location, Search)
- [x] Merchandise Section (drop-style grid with "The Drop" header)
- [x] Community Section
  - [x] Manifesto section
  - [x] How it works steps
  - [x] Code of conduct
  - [x] Chapters/ranks teaser
  - [x] FAQ accordion
- [x] Update events data model with new fields (tagline, coverImageUrl, tags, area, featuredOrder)
- [x] Add seed data (8 events with cover images, tags, locations)

## Nocta Scroll Replication
- [x] Analyze Nocta's exact scroll mechanics (sticky sections, z-index stacking)
- [x] Implement sticky scroll sections that stack on top of each other
- [x] Add event slides with full-viewport hero images
- [x] Add navigation dots on right side
- [ ] Test on mobile and desktop (user testing needed)

## Nocta Exact Scroll Replication
- [x] Deep analysis of Nocta hero scroll mechanics (regular vertical scroll, no sticky)
- [x] Create placeholder events with proper imagery (Unsplash concert/party images)
- [x] Implement exact Nocta scroll behavior (100vh sections, vertical scroll)
- [x] Green accent color for CTAs (#00ff00 Nocta signature)
- [x] Product grid with size buttons on hover
- [ ] Test on mobile and desktop (user testing needed)


## Nocta EXACT Replication (Redo)
- [x] Implemented full-viewport (100vh) event sections that scroll vertically
- [x] Each event has full-bleed background image with gradient overlay
- [x] Left-aligned text overlay with event title, tagline, date, venue, capacity
- [x] Green (#00ff00) outlined RESERVE button matching Nocta style
- [x] Scroll indicator on first slide with animated arrow
- [x] Progress dots on right side showing current position
- [x] 2x2 Collection grid after events section
- [x] Product grid with size buttons on hover
- [x] Newsletter section with green SUBSCRIBE button
- [ ] Test on mobile and desktop (user testing needed)

## Scroll-Snap Full-Screen Events
- [x] Implement CSS scroll-snap for full-screen event sections
- [x] Each scroll action should snap to the next complete event
- [x] Smooth transition between event sections
- [x] Navigation dots click to jump to specific events
- [ ] Test scroll-snap behavior on mobile (user testing needed)

## Natural Scroll-to-Reveal (Remove Snap)
- [x] Remove scroll-snap CSS from homepage
- [x] Implement regular vertical scrolling with 100vh sections
- [x] Sections reveal naturally as user scrolls (no snapping)
- [x] Navigation dots kept for position indication and click-to-jump

## Nocta Sticky Scroll Effect (EXACT Replication)
- [x] Implement position: sticky with top: 0 for each event section
- [x] Create tall parent wrapper (multiple viewport heights)
- [x] Parent wrapper has position: relative
- [x] Each section sticks to top and gets covered by next section as user scrolls
- [x] Later sections have higher z-index to cover earlier ones
- [x] Test the sticky scroll-to-reveal behavior - working!


## Restore Missing Elements & Stratified Reality Integration
- [x] Restore navigation header with COMM@ logo
- [x] Apply sticky scroll effect to collection grid section (same as hero events)
- [x] Integrate Stratified Reality narrative into homepage
- [x] Add "STRATIFIED REALITY" hero section with layer explanation
- [x] Update events feed to show reveal status (Tease, Window, Locked, Revealed)
- [x] Add layer badges and requirements to event cards
- [x] Restore product grid section (renamed to "Artifacts" with Stratified Commerce messaging)
- [x] Restore newsletter section
- [x] Mobile optimization - responsive classes added
- [x] Add Layers explanation section (Streetlight, Verified, Signal, Inner Room, Black Label)
- [x] 8 sticky scroll sections total (4 events + Stratified Reality + Collection Grid + Layers + Artifacts)

## Tiffany Blue Color Scheme Update
- [x] Change primary accent color from green (#00ff00) to Tiffany Blue (#0ABAB5)
- [x] Update all buttons, badges, and accent elements in Home.tsx
- [x] Update progress dots and scroll indicators
- [x] Update global theme colors in index.css (OKLCH format)
- [x] Update Effects2200.tsx boot sequence colors
- [x] Review and fix any UI issues - all sections verified working

## Restore Sponsor Section
- [x] Add sponsor/partners section back to homepage
- [x] Place after Artifacts section and before Newsletter
- [x] Use SponsorShowcase component
- [x] Add 6 sample sponsors (FEELBERT GROUP, NEON DISTRICT, MIDNIGHT LABS, URBAN COLLECTIVE, SOUND SYSTEM, STREET KINGS)

## Rename Partners to Sponsors
- [x] Update navigation link from PARTNERS to SPONSORS
- [x] Update "Become a Partner" CTA to "Become a Sponsor"
- [x] Update route from /partners to /sponsors
- [x] Update SponsorShowcase header to "Our Sponsors"
- [x] Update Dev.tsx references


## FloatScroll-Style UI Effects
- [x] Add horizontal scrolling marquee of @ symbols to hero section
- [x] Enhance hero typography with layered Tiffany Blue backdrop (circular glow behind title)
- [x] Ensure all existing features remain intact (sticky scroll, navigation, sponsors, etc.)
- [x] CSS keyframe animations for seamless infinite marquee loop

## Personal Cipher MVP (Future Build)
- [ ] Personal Cipher enrollment and sign-in (TOTP-style rotating codes)
- [ ] Device binding and recovery codes
- [ ] Invite code system for enrollment
- [ ] Gatherings reveal system (Tease → Window → Locked → Revealed)
- [ ] Request and approval flow for gatherings
- [ ] Check-in system with reputation updates
- [ ] Merch gating (layer and attendance-locked)
- [ ] Administrator panel for members, invites, gatherings, requests, merch
- [ ] Seed 12 gatherings and 9 merch items
