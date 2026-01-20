# Nocta Scroll Mechanics - Exact Analysis

## Key Observations

### Hero Section Structure
1. **Full-viewport hero sections** - Each collection gets 100vh height
2. **NO scroll-snap** - Regular smooth scrolling, sections flow naturally
3. **Sticky navigation** - Nav bar stays fixed at top
4. **Pagination dots** on right side (10, 11, 12 visible) - shows current slide position

### Scroll Behavior
1. **NOT sticky sections** - Sections scroll normally (not position:sticky)
2. **Continuous vertical scroll** - Each section flows into the next
3. **No snap points** - User can stop anywhere mid-scroll
4. **Parallax-like effect** - Background images are large and create depth as you scroll

### Visual Layout
1. **Text overlay on left** - Collection name, description, CTA button
2. **Large editorial imagery** - Full-bleed background images
3. **Outlined CTA buttons** - Green/neon accent color
4. **Dark color palette** - Black/dark backgrounds

### Transition Between Sections
1. **Simple scroll** - No complex animations between sections
2. **Each section is full viewport height**
3. **Images are positioned to create visual flow**
4. **Bottom of one section meets top of next**

## Implementation Plan for COMM@
1. Remove sticky positioning - use regular scroll
2. Each event = 100vh section with full-bleed image
3. Text overlay on left side
4. Navigation dots on right (optional, for position indicator)
5. Smooth scroll behavior (CSS scroll-behavior: smooth)
6. NO scroll-snap - let user scroll freely
