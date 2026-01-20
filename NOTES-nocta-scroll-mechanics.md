# Nocta Scroll Mechanics Analysis

## Key Findings

### 1. Position: Sticky Sections
- Main sections use `position: sticky` - this is the KEY to their scroll effect
- Sections stack on top of each other as you scroll
- Each section "sticks" at the top while the next one scrolls up behind it

### 2. Scroll Snap
- `scroll-snap-align: start` on each section
- Sections snap to the top of the viewport
- Height: 1100px (approximately full viewport)

### 3. Section Structure
- `section-slide main-slide` class for hero sections
- `collection-card nested-slide` for sub-sections within a collection
- Video slides have different behavior (no snap)

### 4. The Effect
- As you scroll down, the current section stays "stuck" at top
- The next section scrolls UP and covers the previous one
- Creates a "reveal" or "stack" effect
- NOT a traditional scroll-snap carousel

## CSS Implementation

```css
.section-slide {
  position: sticky;
  top: 0;
  height: 100vh;
  scroll-snap-align: start;
}

html {
  scroll-snap-type: y mandatory; /* or proximity */
}
```

## Key Difference from Current COMM@ Implementation
- Current: Using navigation dots to switch between events (like a carousel)
- Nocta: Vertical scroll with sticky sections that stack/reveal

## Implementation Plan
1. Remove carousel-style navigation
2. Make each event a full-viewport sticky section
3. Stack sections so they reveal as user scrolls
4. Add scroll-snap for smooth stopping points
