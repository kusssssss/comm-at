# Nocta Exact Design Analysis

## Hero Section Layout
- **Top bar**: Neon green/yellow background with "Free shipping" text, full width
- **Navigation**: Clean minimal nav with "Shop | Archive" on left, "NOCTA" logo center, "Search | Account | Cart (0)" on right
- **Hero image**: Takes up RIGHT SIDE of screen (not full bleed), shows model wearing product
- **Text content**: LEFT SIDE, vertically centered
  - Small caps subtitle: "NOCTA in Association with CODE"
  - Paragraph description text (3-4 lines)
  - Green outlined CTA button: "NOCTA X CODE"

## Key Design Elements
- **Background**: Dark gray/brown gradient, NOT pure black
- **Image placement**: Model/product on RIGHT, text on LEFT
- **Button style**: Green (#00ff00) outlined, NOT filled, uppercase text
- **Typography**: Clean sans-serif, small caps for labels
- **Spacing**: Generous whitespace, text starts about 1/3 from left edge

## What I Got Wrong
1. My hero has text overlaid ON the image - Nocta has text on LEFT, image on RIGHT (split layout)
2. My hero uses full-bleed background images - Nocta uses a split layout with product photography
3. My layout is centered - Nocta is asymmetric (left text, right image)

## Correct Implementation
- Split the hero into 2 columns: LEFT = text content, RIGHT = product/event image
- Use dark gradient background behind both
- Position text at left with proper spacing
- Green outlined buttons

## Second Hero Section (Holiday '25)
- FULL BLEED editorial photography (multiple models in green outfits)
- Text overlay on BOTTOM LEFT: "Holiday '25 Cardinal Stock"
- Green outlined button: "SHOP HOLIDAY '25"
- Pagination dots on BOTTOM RIGHT (10, 11, 12 style numbers)
- This is a CAROUSEL with multiple hero slides

## Key Insight: Nocta uses a CAROUSEL
- Multiple hero slides that auto-rotate or can be navigated
- Each slide is full-viewport height
- Some slides have split layout (text left, image right)
- Some slides have full-bleed imagery with text overlay
- Pagination numbers in bottom right corner

## Collection Grid Section (Below Hero Carousel)
- 2x2 GRID of collection images (not products yet)
- Each cell is a clickable collection link with:
  - Full-bleed editorial photography
  - Collection name overlay at BOTTOM LEFT (e.g., "SU25 CARDINAL STOCK", "DIFFUSED BLUE")
  - No buttons, just the image and text
- Grid is 50/50 split horizontally
- This is BEFORE the product grid

## Visual Style
- Editorial photography with models
- Moody lighting, urban environments
- Mix of studio shots and location shots
- Text always in bottom-left corner
- Green (#00ff00) accent for interactive elements

## Product Grid Section
- Section header: "CODE" in small text on left, black background strip
- 3-COLUMN product grid
- Product cards have:
  - Gray/neutral background (NOT white)
  - Product image (model wearing item, cropped)
  - "Sold out" badge in top-right if applicable
  - NO visible text until hover
- On HOVER: size buttons appear (S, M, L, XL, XXL)
- Below image: Product name + Price

## Key Layout Structure
1. Hero Carousel (full viewport, multiple slides)
2. Collection Grid (2x2 editorial images)
3. Product Grid (3-column, gray backgrounds)
4. Footer with newsletter

## CRITICAL DIFFERENCES FROM MY IMPLEMENTATION
1. Hero is a CAROUSEL with pagination, not vertical scroll sections
2. Collection grid comes BEFORE product grid
3. Product cards have GRAY backgrounds, not dark
4. Size buttons appear on HOVER, not always visible
5. Much more editorial photography focus
