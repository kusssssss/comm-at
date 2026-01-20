# Nocta Website Analysis

## Key Design Patterns Observed

### Hero Section
- Full-viewport hero sections with large editorial imagery
- Text overlay on left side with collection name and description
- CTA button with outlined border style ("NOCTA X CODE", "SHOP HOLIDAY '25")
- Sticky navigation bar with minimal design (Shop, Archive, Search, Account, Cart)
- Dark/moody color palette with high contrast imagery

### Scroll Behavior
- Sections transition as full-viewport blocks
- Each collection/campaign gets its own hero section
- Pagination indicator visible (10, 11, 12) suggesting carousel/slide navigation
- Smooth transitions between sections
- Images are cinematic/editorial quality

### Typography
- Clean sans-serif font
- Strong hierarchy: small label text for collection name, larger CTA buttons
- Uppercase text for navigation and CTAs
- Minimal text - let imagery speak

### Layout Patterns
- Full-bleed imagery
- Asymmetric layouts with text on one side
- Product grid appears below hero sections
- Quick-add size buttons appear on hover for products
- Price displayed simply without clutter

### Color Scheme
- Dark backgrounds (black, dark gray)
- Accent color: bright green/yellow for highlights
- White text on dark backgrounds
- High contrast photography

### Product Display
- Grid layout for products
- Size buttons visible on hover
- "Sold out" indicator
- Clean product cards with minimal info (name, price)

## Implementation Notes for COMM@

### Events Hero Section
1. Use full-viewport sections for each event
2. Large editorial/atmospheric event imagery
3. Event info overlay (title, date, location)
4. CTA button matching access type
5. Progress indicator showing current event position
6. Smooth scroll-snap between events

### Technical Approach
- CSS scroll-snap for section transitions
- Intersection Observer for parallax effects
- GSAP or Framer Motion for smooth animations
- Lazy loading for images
- Mobile swipe support via touch events

### Key Differences from Current COMM@
- Current site has more text-heavy sections
- Nocta is more image-forward, editorial
- Need to balance information density with visual impact
- Events should feel like "drops" - exclusive, curated

## Product Grid Patterns (for Merch Section)

### Layout
- 3-column grid on desktop
- Clean product cards with gray background
- Product image takes most of card space
- "NEW", "EXCLUSIVE", "Sold out" badges on images
- Size buttons appear on hover (S, M, L, XL, XXL)

### Product Card Content
- Product name (e.g., "Component 5 Jacket")
- Price (e.g., "$1,300.00 SGD")
- Minimal text, let product speak

### Footer Section
- "NEVER MISS A DROP" newsletter signup
- Email input with subscribe button
- Nike + NOCTA logos
- Clean, minimal footer

## Key Takeaways for COMM@ Implementation

1. **Hero sections should be full-viewport with editorial imagery**
2. **Use scroll-snap for section transitions**
3. **Minimal text overlay - collection name + CTA only**
4. **Product grid should be clean with hover interactions**
5. **Badges for status (NEW, EXCLUSIVE, SOLD OUT)**
6. **Dark color palette with high contrast**
7. **Progress indicator for multi-section heroes**
8. **Newsletter signup at bottom**
