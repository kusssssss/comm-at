#!/usr/bin/env node
/**
 * Seed script for COMM@ database
 * Creates 12 sample gatherings and 9 merchandise items for testing
 * 
 * Run with: node scripts/seed-data.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);
const dbConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
};

// ============================================================================
// GATHERINGS DATA - 12 events across different categories and reveal states
// ============================================================================
const gatherings = [
  // Category: MUSIC (3 events)
  {
    title: "THE MIDNIGHT SESSION",
    slug: "midnight-session-jan-2026",
    tagline: "When the city sleeps, we gather",
    description: "An intimate underground music experience featuring Jakarta's finest selectors. Limited to 50 souls who understand the frequency.",
    category: "music",
    capacity: 50,
    eligibilityMinState: "member",
    contentVisibility: "members",
    accessType: "members_only",
    secretLevel: "high",
    timeRevealHoursBefore: 24,
    locationRevealHoursBefore: 6,
    city: "Jakarta",
    area: "Kemang",
    venueName: "The Basement",
    venueAddress: "Jl. Kemang Raya No. 45, Basement Level",
    coverImageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&q=80",
    tags: JSON.stringify(["music", "underground", "exclusive"]),
    eventDate: new Date("2026-02-15T22:00:00"),
    startDatetime: new Date("2026-02-15T22:00:00"),
    endDatetime: new Date("2026-02-16T04:00:00"),
    featuredOrder: 1,
    status: "published"
  },
  {
    title: "CHAPTER INITIATION",
    slug: "chapter-initiation-feb-2026",
    tagline: "Enter the frequency",
    description: "A night of initiation for new members. Experience the full spectrum of what COMM@ represents through sound, visuals, and connection.",
    category: "music",
    capacity: 100,
    eligibilityMinState: "initiate",
    contentVisibility: "members",
    accessType: "members_only",
    secretLevel: "medium",
    timeRevealHoursBefore: 48,
    locationRevealHoursBefore: 12,
    city: "Jakarta",
    area: "Senopati",
    venueName: "Signal House",
    venueAddress: "Jl. Senopati No. 88",
    coverImageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=80",
    tags: JSON.stringify(["music", "initiation", "community"]),
    eventDate: new Date("2026-02-22T21:00:00"),
    startDatetime: new Date("2026-02-22T21:00:00"),
    endDatetime: new Date("2026-02-23T03:00:00"),
    featuredOrder: 2,
    status: "published"
  },
  {
    title: "FREQUENCY 808",
    slug: "frequency-808-mar-2026",
    tagline: "Bass is the foundation",
    description: "A bass-heavy experience for those who feel music in their chest. Featuring international selectors and local legends.",
    category: "music",
    capacity: 200,
    eligibilityMinState: "member",
    contentVisibility: "members",
    accessType: "members_only",
    secretLevel: "medium",
    timeRevealHoursBefore: 72,
    locationRevealHoursBefore: 24,
    city: "Jakarta",
    area: "SCBD",
    venueName: "Warehouse 808",
    venueAddress: "Jl. Jend. Sudirman, SCBD Lot 8",
    coverImageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1920&q=80",
    tags: JSON.stringify(["music", "bass", "warehouse"]),
    eventDate: new Date("2026-03-08T22:00:00"),
    startDatetime: new Date("2026-03-08T22:00:00"),
    endDatetime: new Date("2026-03-09T06:00:00"),
    featuredOrder: 0,
    status: "published"
  },

  // Category: ART (2 events)
  {
    title: "CANVAS COLLECTIVE",
    slug: "canvas-collective-feb-2026",
    tagline: "Art speaks what words cannot",
    description: "An exclusive gallery showing featuring works from COMM@ affiliated artists. Each piece tells a story of the underground.",
    category: "art",
    capacity: 75,
    eligibilityMinState: "member",
    contentVisibility: "members",
    accessType: "members_only",
    secretLevel: "low",
    timeRevealHoursBefore: 168,
    locationRevealHoursBefore: 48,
    city: "Jakarta",
    area: "Menteng",
    venueName: "Gallery M",
    venueAddress: "Jl. Menteng Raya No. 12",
    coverImageUrl: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=1920&q=80",
    tags: JSON.stringify(["art", "gallery", "exhibition"]),
    eventDate: new Date("2026-02-28T18:00:00"),
    startDatetime: new Date("2026-02-28T18:00:00"),
    endDatetime: new Date("2026-02-28T23:00:00"),
    featuredOrder: 0,
    status: "published"
  },
  {
    title: "STREET MARKS",
    slug: "street-marks-mar-2026",
    tagline: "The city is our canvas",
    description: "A live street art activation in an undisclosed location. Watch masters at work and leave your own mark.",
    category: "art",
    capacity: 40,
    eligibilityMinState: "inner_circle",
    contentVisibility: "inner_circle",
    accessType: "invite_only",
    secretLevel: "high",
    timeRevealHoursBefore: 12,
    locationRevealHoursBefore: 3,
    city: "Jakarta",
    area: "Kota Tua",
    venueName: "TBA",
    venueAddress: "Location revealed 3 hours before",
    coverImageUrl: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=1920&q=80",
    tags: JSON.stringify(["art", "street", "graffiti", "exclusive"]),
    eventDate: new Date("2026-03-15T20:00:00"),
    startDatetime: new Date("2026-03-15T20:00:00"),
    endDatetime: new Date("2026-03-16T02:00:00"),
    featuredOrder: 0,
    status: "published"
  },

  // Category: COMMUNITY (3 events)
  {
    title: "THE LAUNCH",
    slug: "the-launch-jan-2026",
    tagline: "Where it all begins",
    description: "The official launch gathering for COMM@ Jakarta chapter. Meet the founding members and understand the vision.",
    category: "community",
    capacity: 150,
    eligibilityMinState: "initiate",
    contentVisibility: "members",
    accessType: "members_only",
    secretLevel: "low",
    timeRevealHoursBefore: 168,
    locationRevealHoursBefore: 72,
    city: "Jakarta",
    area: "PIK",
    venueName: "The Commune",
    venueAddress: "Pantai Indah Kapuk, Jakarta Utara",
    coverImageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80",
    tags: JSON.stringify(["community", "launch", "networking"]),
    eventDate: new Date("2026-01-25T19:00:00"),
    startDatetime: new Date("2026-01-25T19:00:00"),
    endDatetime: new Date("2026-01-25T23:00:00"),
    featuredOrder: 3,
    status: "published"
  },
  {
    title: "GENESIS",
    slug: "genesis-apr-2026",
    tagline: "The beginning of something new",
    description: "A gathering to celebrate our first quarter. Reflect on what we've built and envision what's next.",
    category: "community",
    capacity: 100,
    eligibilityMinState: "member",
    contentVisibility: "members",
    accessType: "members_only",
    secretLevel: "medium",
    timeRevealHoursBefore: 48,
    locationRevealHoursBefore: 24,
    city: "Jakarta",
    area: "Kuningan",
    venueName: "Rooftop 52",
    venueAddress: "Jl. HR Rasuna Said, Kuningan",
    coverImageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1920&q=80",
    tags: JSON.stringify(["community", "celebration", "milestone"]),
    eventDate: new Date("2026-04-05T18:00:00"),
    startDatetime: new Date("2026-04-05T18:00:00"),
    endDatetime: new Date("2026-04-05T23:00:00"),
    featuredOrder: 4,
    status: "published"
  },
  {
    title: "INNER CIRCLE DINNER",
    slug: "inner-circle-dinner-mar-2026",
    tagline: "Reserved for the few",
    description: "An intimate dinner for Inner Circle members only. Strategic discussions about the future of COMM@.",
    category: "community",
    capacity: 20,
    eligibilityMinState: "inner_circle",
    contentVisibility: "inner_circle",
    accessType: "invite_only",
    secretLevel: "high",
    timeRevealHoursBefore: 24,
    locationRevealHoursBefore: 6,
    city: "Jakarta",
    area: "Menteng",
    venueName: "Private Residence",
    venueAddress: "Disclosed to approved attendees only",
    coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80",
    tags: JSON.stringify(["community", "dinner", "inner_circle", "exclusive"]),
    eventDate: new Date("2026-03-20T19:00:00"),
    startDatetime: new Date("2026-03-20T19:00:00"),
    endDatetime: new Date("2026-03-20T23:00:00"),
    featuredOrder: 0,
    status: "published"
  },

  // Category: SPEED (2 events)
  {
    title: "MIDNIGHT RUN",
    slug: "midnight-run-feb-2026",
    tagline: "Speed is a state of mind",
    description: "A late-night automotive gathering for enthusiasts. Showcase your ride and connect with fellow petrolheads.",
    category: "speed",
    capacity: 60,
    eligibilityMinState: "member",
    contentVisibility: "members",
    accessType: "members_only",
    secretLevel: "high",
    timeRevealHoursBefore: 12,
    locationRevealHoursBefore: 2,
    city: "Jakarta",
    area: "BSD",
    venueName: "Track 88",
    venueAddress: "BSD City, Tangerang",
    coverImageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80",
    tags: JSON.stringify(["speed", "automotive", "cars", "night"]),
    eventDate: new Date("2026-02-08T23:00:00"),
    startDatetime: new Date("2026-02-08T23:00:00"),
    endDatetime: new Date("2026-02-09T04:00:00"),
    featuredOrder: 0,
    status: "published"
  },
  {
    title: "TOUGE TAKEOVER",
    slug: "touge-takeover-apr-2026",
    tagline: "The mountain calls",
    description: "A convoy to the mountains. Experience the twisties with fellow drivers who understand the art of the touge.",
    category: "speed",
    capacity: 30,
    eligibilityMinState: "inner_circle",
    contentVisibility: "inner_circle",
    accessType: "invite_only",
    secretLevel: "high",
    timeRevealHoursBefore: 6,
    locationRevealHoursBefore: 1,
    city: "Puncak",
    area: "Bogor",
    venueName: "Mountain Pass",
    venueAddress: "Meeting point revealed 1 hour before",
    coverImageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&q=80",
    tags: JSON.stringify(["speed", "touge", "mountain", "exclusive"]),
    eventDate: new Date("2026-04-12T05:00:00"),
    startDatetime: new Date("2026-04-12T05:00:00"),
    endDatetime: new Date("2026-04-12T12:00:00"),
    featuredOrder: 0,
    status: "published"
  },

  // Category: MISSION (2 events)
  {
    title: "CLEAN THE STREETS",
    slug: "clean-streets-mar-2026",
    tagline: "Give back to the city",
    description: "Community service day. We clean up our neighborhoods and show that COMM@ is about more than parties.",
    category: "mission",
    capacity: 50,
    eligibilityMinState: "initiate",
    contentVisibility: "members",
    accessType: "members_only",
    secretLevel: "low",
    timeRevealHoursBefore: 168,
    locationRevealHoursBefore: 48,
    city: "Jakarta",
    area: "Various",
    venueName: "Multiple Locations",
    venueAddress: "Meeting points announced 48 hours before",
    coverImageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1920&q=80",
    tags: JSON.stringify(["mission", "community_service", "cleanup"]),
    eventDate: new Date("2026-03-22T07:00:00"),
    startDatetime: new Date("2026-03-22T07:00:00"),
    endDatetime: new Date("2026-03-22T12:00:00"),
    featuredOrder: 0,
    status: "published"
  },
  {
    title: "FEED THE CITY",
    slug: "feed-city-apr-2026",
    tagline: "Nourish the community",
    description: "Food distribution to underserved communities. COMM@ members come together to make a real difference.",
    category: "mission",
    capacity: 40,
    eligibilityMinState: "initiate",
    contentVisibility: "members",
    accessType: "members_only",
    secretLevel: "low",
    timeRevealHoursBefore: 168,
    locationRevealHoursBefore: 72,
    city: "Jakarta",
    area: "North Jakarta",
    venueName: "Community Center",
    venueAddress: "Jl. Pluit Raya, Jakarta Utara",
    coverImageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&q=80",
    tags: JSON.stringify(["mission", "charity", "food"]),
    eventDate: new Date("2026-04-19T08:00:00"),
    startDatetime: new Date("2026-04-19T08:00:00"),
    endDatetime: new Date("2026-04-19T14:00:00"),
    featuredOrder: 0,
    status: "published"
  }
];

// ============================================================================
// MERCHANDISE DATA - 9 items with different gating levels
// ============================================================================
const merchandise = [
  // PUBLIC (3 items) - Anyone can view and purchase
  {
    artistName: "COMM@ COLLECTIVE",
    title: "STREETLIGHT TEE",
    slug: "streetlight-tee",
    description: "The entry point. A simple black tee with the @ symbol. For those who've just discovered the frequency.",
    editionSize: 500,
    status: "published",
    chapter: "South Jakarta",
    storyBlurb: "Every journey begins with a single step. The Streetlight Tee marks your first step into the COMM@ world.",
    priceIdr: 350000,
    heroImageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    availableSizes: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
    tags: JSON.stringify(["tee", "basics", "entry"]),
    requiredLayer: "outside",
    attendanceLockEventId: null,
    visibilityLevel: "public"
  },
  {
    artistName: "COMM@ COLLECTIVE",
    title: "SIGNAL CAP",
    slug: "signal-cap",
    description: "A minimal cap with embroidered @ logo. Low profile, high signal.",
    editionSize: 300,
    status: "published",
    chapter: "South Jakarta",
    storyBlurb: "Keep your head covered and your signal strong. The cap that says you're tuned in.",
    priceIdr: 275000,
    heroImageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80",
    availableSizes: JSON.stringify(["One Size"]),
    tags: JSON.stringify(["cap", "accessories", "basics"]),
    requiredLayer: "outside",
    attendanceLockEventId: null,
    visibilityLevel: "public"
  },
  {
    artistName: "COMM@ COLLECTIVE",
    title: "FREQUENCY TOTE",
    slug: "frequency-tote",
    description: "Heavy canvas tote with screen-printed frequency pattern. Carry your essentials in style.",
    editionSize: 200,
    status: "published",
    chapter: "South Jakarta",
    storyBlurb: "A bag for those who carry the frequency wherever they go.",
    priceIdr: 225000,
    heroImageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80",
    availableSizes: JSON.stringify(["One Size"]),
    tags: JSON.stringify(["tote", "bag", "accessories"]),
    requiredLayer: "outside",
    attendanceLockEventId: null,
    visibilityLevel: "public"
  },

  // LAYER-GATED (3 items) - Requires specific membership level
  {
    artistName: "COMM@ COLLECTIVE",
    title: "VERIFIED HOODIE",
    slug: "verified-hoodie",
    description: "Premium heavyweight hoodie for verified members. Embroidered details, hidden pocket for your cipher device.",
    editionSize: 150,
    status: "published",
    chapter: "South Jakarta",
    storyBlurb: "For those who've proven they belong. The Verified Hoodie is your badge of commitment.",
    priceIdr: 850000,
    heroImageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
    availableSizes: JSON.stringify(["S", "M", "L", "XL"]),
    tags: JSON.stringify(["hoodie", "premium", "verified"]),
    requiredLayer: "initiate",
    attendanceLockEventId: null,
    visibilityLevel: "members"
  },
  {
    artistName: "COMM@ COLLECTIVE",
    title: "SIGNAL BOMBER",
    slug: "signal-bomber",
    description: "MA-1 style bomber with custom Signal-level patches. Only for those who've reached the Signal layer.",
    editionSize: 75,
    status: "published",
    chapter: "South Jakarta",
    storyBlurb: "The Signal Bomber represents your elevated status. Wear it with pride, wear it with purpose.",
    priceIdr: 1500000,
    heroImageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    availableSizes: JSON.stringify(["S", "M", "L", "XL"]),
    tags: JSON.stringify(["bomber", "jacket", "signal", "premium"]),
    requiredLayer: "member",
    attendanceLockEventId: null,
    visibilityLevel: "members"
  },
  {
    artistName: "COMM@ COLLECTIVE",
    title: "INNER ROOM VARSITY",
    slug: "inner-room-varsity",
    description: "Wool and leather varsity jacket. Hand-numbered, Inner Room exclusive. The ultimate status symbol.",
    editionSize: 25,
    status: "published",
    chapter: "South Jakarta",
    storyBlurb: "Reserved for the Inner Room. Each jacket is numbered and registered to its owner.",
    priceIdr: 3500000,
    heroImageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
    availableSizes: JSON.stringify(["S", "M", "L", "XL"]),
    tags: JSON.stringify(["varsity", "jacket", "inner_circle", "exclusive"]),
    requiredLayer: "inner_circle",
    attendanceLockEventId: null,
    visibilityLevel: "members"
  },

  // ATTENDANCE-LOCKED (3 items) - Requires attendance at specific event
  {
    artistName: "COMM@ COLLECTIVE",
    title: "MIDNIGHT SESSION TEE",
    slug: "midnight-session-tee",
    description: "Exclusive tee only available to those who attended The Midnight Session. Glow-in-the-dark print.",
    editionSize: 50,
    status: "published",
    chapter: "South Jakarta",
    storyBlurb: "You were there when the city slept. This tee proves it.",
    priceIdr: 450000,
    heroImageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    availableSizes: JSON.stringify(["S", "M", "L", "XL"]),
    tags: JSON.stringify(["tee", "event", "exclusive", "midnight"]),
    requiredLayer: "member",
    attendanceLockEventId: 1, // Will be updated to actual event ID
    visibilityLevel: "members"
  },
  {
    artistName: "COMM@ COLLECTIVE",
    title: "GENESIS CHAIN",
    slug: "genesis-chain",
    description: "Sterling silver chain with @ pendant. Only for Genesis attendees. Your proof of being there from the start.",
    editionSize: 100,
    status: "published",
    chapter: "South Jakarta",
    storyBlurb: "Genesis marked the beginning. This chain marks you as one of the originals.",
    priceIdr: 1200000,
    heroImageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
    availableSizes: JSON.stringify(["One Size"]),
    tags: JSON.stringify(["chain", "jewelry", "genesis", "exclusive"]),
    requiredLayer: "member",
    attendanceLockEventId: 7, // Genesis event
    visibilityLevel: "members"
  },
  {
    artistName: "COMM@ COLLECTIVE",
    title: "FREQUENCY 808 VINYL",
    slug: "frequency-808-vinyl",
    description: "Limited edition vinyl compilation from Frequency 808. Only available to attendees.",
    editionSize: 200,
    status: "published",
    chapter: "South Jakarta",
    storyBlurb: "The sounds that moved you that night, pressed into wax forever.",
    priceIdr: 650000,
    heroImageUrl: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&q=80",
    availableSizes: JSON.stringify(["12\" Vinyl"]),
    tags: JSON.stringify(["vinyl", "music", "808", "exclusive"]),
    requiredLayer: "member",
    attendanceLockEventId: 3, // Frequency 808 event
    visibilityLevel: "members"
  }
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function seed() {
  console.log('🌱 Starting database seed...\n');
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing seed data...');
    await connection.execute('DELETE FROM drops WHERE slug LIKE "%-tee" OR slug LIKE "%-cap" OR slug LIKE "%-tote" OR slug LIKE "%-hoodie" OR slug LIKE "%-bomber" OR slug LIKE "%-varsity" OR slug LIKE "%-chain" OR slug LIKE "%-vinyl"');
    await connection.execute('DELETE FROM events WHERE slug LIKE "%-2026"');
    
    // Insert gatherings
    console.log('\n📅 Inserting 12 gatherings...');
    const eventIds = {};
    
    for (const gathering of gatherings) {
      const [result] = await connection.execute(
        `INSERT INTO events (
          title, slug, tagline, description, category, capacity,
          markState, eventVisibility, eventAccessType, eventSecretLevel,
          timeRevealHoursBefore, locationRevealHoursBefore,
          city, area, venueName, venueAddress, coverImageUrl, tags,
          eventDate, startDatetime, endDatetime, featuredOrder, eventStatus, publishedAt, chapter
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'South Jakarta')`,
        [
          gathering.title, gathering.slug, gathering.tagline, gathering.description,
          gathering.category, gathering.capacity, gathering.eligibilityMinState,
          gathering.contentVisibility, gathering.accessType, gathering.secretLevel,
          gathering.timeRevealHoursBefore, gathering.locationRevealHoursBefore,
          gathering.city, gathering.area, gathering.venueName, gathering.venueAddress,
          gathering.coverImageUrl, gathering.tags, gathering.eventDate,
          gathering.startDatetime, gathering.endDatetime, gathering.featuredOrder,
          gathering.status
        ]
      );
      eventIds[gathering.slug] = result.insertId;
      console.log(`  ✅ ${gathering.title} (ID: ${result.insertId})`);
    }
    
    // Insert merchandise
    console.log('\n🛍️  Inserting 9 merchandise items...');
    
    for (const item of merchandise) {
      // Map attendance lock to actual event IDs
      let attendanceLockEventId = null;
      if (item.slug === 'midnight-session-tee') {
        attendanceLockEventId = eventIds['midnight-session-jan-2026'];
      } else if (item.slug === 'genesis-chain') {
        attendanceLockEventId = eventIds['genesis-apr-2026'];
      } else if (item.slug === 'frequency-808-vinyl') {
        attendanceLockEventId = eventIds['frequency-808-mar-2026'];
      }
      
      const [result] = await connection.execute(
        `INSERT INTO drops (
          artistName, title, slug, description, editionSize, dropStatus,
          chapter, storyBlurb, priceIdr, heroImageUrl, availableSizes,
          tags, markState, attendanceLockEventId, visibilityLevel, publishedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          item.artistName, item.title, item.slug, item.description,
          item.editionSize, item.status, item.chapter, item.storyBlurb,
          item.priceIdr, item.heroImageUrl, item.availableSizes, item.tags,
          item.requiredLayer, attendanceLockEventId, item.visibilityLevel
        ]
      );
      
      const gatingInfo = item.requiredLayer !== 'outside' 
        ? `[${item.requiredLayer.toUpperCase()}]` 
        : attendanceLockEventId 
          ? '[ATTENDANCE]' 
          : '[PUBLIC]';
      console.log(`  ✅ ${item.title} ${gatingInfo} (ID: ${result.insertId})`);
    }
    
    console.log('\n✨ Seed completed successfully!');
    console.log(`   📅 ${gatherings.length} gatherings created`);
    console.log(`   🛍️  ${merchandise.length} merchandise items created`);
    console.log('\n📊 Summary:');
    console.log('   Gatherings by category:');
    console.log('     - Music: 3');
    console.log('     - Art: 2');
    console.log('     - Community: 3');
    console.log('     - Speed: 2');
    console.log('     - Mission: 2');
    console.log('   Merchandise by gating:');
    console.log('     - Public: 3');
    console.log('     - Layer-gated: 3');
    console.log('     - Attendance-locked: 3');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the seed
seed().catch(console.error);
