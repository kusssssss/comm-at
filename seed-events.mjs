import mysql from 'mysql2/promise';

// Cool secret events - mix of underground music, art, dinners, drops
// Using correct enum values:
// eventVisibility: 'public', 'members', 'inner_circle'
// eventAccessType: 'invite_only', 'members_only', 'open'
// markState: 'outside', 'initiate', 'member', 'inner_circle', 'dormant', 'restricted', 'revoked'
// eventSecretLevel: 'low', 'medium', 'high'
// eventStatus: 'draft', 'published', 'completed', 'cancelled'

const events = [
  {
    title: "THE VOID",
    slug: "the-void",
    tagline: "Where sound disappears into darkness",
    description: "An immersive underground techno experience in an abandoned warehouse. No phones. No photos. Just pure sound and movement in complete darkness. Limited to 80 souls who understand that some moments are meant to be felt, not captured.",
    category: "music",
    chapter: "South Jakarta",
    city: "Jakarta",
    area: "Kemang",
    venueName: "The Bunker",
    capacity: 80,
    eventAccessType: "members_only",
    eventVisibility: "members",
    markState: "member",
    eventSecretLevel: "high",
    timeRevealHoursBefore: 24,
    locationRevealHoursBefore: 6,
    coverImageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1600&q=80",
    tags: JSON.stringify(["techno", "underground", "warehouse", "secret"]),
    featuredOrder: 4,
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    eventStatus: "published"
  },
  {
    title: "SUPPER CLUB",
    slug: "supper-club-feb",
    tagline: "12 strangers. 1 table. No small talk.",
    description: "An intimate dinner experience where conversation is curated and connections are real. Each course paired with a topic that matters. You'll leave with new perspectives and possibly new friends. Dress code: Come as you are, leave as someone new.",
    category: "community",
    chapter: "South Jakarta",
    city: "Jakarta",
    area: "Menteng",
    venueName: "Private Residence",
    capacity: 12,
    eventAccessType: "invite_only",
    eventVisibility: "inner_circle",
    markState: "inner_circle",
    eventSecretLevel: "high",
    timeRevealHoursBefore: 48,
    locationRevealHoursBefore: 12,
    coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80",
    tags: JSON.stringify(["dinner", "intimate", "conversation", "exclusive"]),
    featuredOrder: 3,
    eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    eventStatus: "published"
  },
  {
    title: "GALLERY AFTER DARK",
    slug: "gallery-after-dark",
    tagline: "Art is better when the crowds are gone",
    description: "Private viewing of emerging Indonesian artists after hours. Wine. Conversation with the artists. First access to acquire pieces before public opening. This is how art was meant to be experienced - without the pretense, without the crowds.",
    category: "art",
    chapter: "South Jakarta",
    city: "Jakarta",
    area: "Senopati",
    venueName: "ISA Art Gallery",
    capacity: 40,
    eventAccessType: "members_only",
    eventVisibility: "members",
    markState: "member",
    eventSecretLevel: "medium",
    timeRevealHoursBefore: 72,
    locationRevealHoursBefore: 24,
    coverImageUrl: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1600&q=80",
    tags: JSON.stringify(["art", "gallery", "private", "emerging-artists"]),
    featuredOrder: 2,
    eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    eventStatus: "published"
  },
  {
    title: "ROOFTOP SESSIONS",
    slug: "rooftop-sessions-feb",
    tagline: "Above the noise. Below the stars.",
    description: "Sunset to sunrise on a hidden rooftop. Local DJs. Cold drinks. City lights. The kind of night that starts with 'just one drink' and ends with watching the sun rise over Jakarta. Bring someone you want to know better.",
    category: "music",
    chapter: "South Jakarta",
    city: "Jakarta",
    area: "SCBD",
    venueName: "Undisclosed Rooftop",
    capacity: 60,
    eventAccessType: "members_only",
    eventVisibility: "members",
    markState: "initiate",
    eventSecretLevel: "medium",
    timeRevealHoursBefore: 48,
    locationRevealHoursBefore: 12,
    coverImageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80",
    tags: JSON.stringify(["rooftop", "party", "sunset", "dj"]),
    featuredOrder: 1,
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    eventStatus: "published"
  },
  {
    title: "FILM NOIR",
    slug: "film-noir-screening",
    tagline: "Cinema the way it was meant to be",
    description: "Underground film screening in a converted warehouse. Rare prints. Director Q&A. No streaming, no downloads - just celluloid and conversation. This month: Indonesian New Wave classics you've never seen.",
    category: "art",
    chapter: "South Jakarta",
    city: "Jakarta",
    area: "Blok M",
    venueName: "The Projection Room",
    capacity: 35,
    eventAccessType: "open",
    eventVisibility: "public",
    markState: "initiate",
    eventSecretLevel: "low",
    timeRevealHoursBefore: 168,
    locationRevealHoursBefore: 48,
    coverImageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80",
    tags: JSON.stringify(["film", "cinema", "screening", "culture"]),
    featuredOrder: 0,
    eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    eventStatus: "published"
  },
  {
    title: "DROP 003",
    slug: "drop-003-release",
    tagline: "Limited pieces. Unlimited meaning.",
    description: "Exclusive merch drop for inner circle members. First access to our collaboration with local artists. Each piece tells a story. Each piece is numbered. When they're gone, they're gone.",
    category: "merch",
    chapter: "South Jakarta",
    city: "Jakarta",
    area: "PIK",
    venueName: "Pop-up Location",
    capacity: 50,
    eventAccessType: "members_only",
    eventVisibility: "members",
    markState: "member",
    eventSecretLevel: "high",
    timeRevealHoursBefore: 24,
    locationRevealHoursBefore: 6,
    coverImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
    tags: JSON.stringify(["merch", "drop", "limited", "exclusive"]),
    featuredOrder: 0,
    eventDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    eventStatus: "published"
  }
];

async function seedEvents() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log("Clearing existing events...");
  await connection.execute("DELETE FROM events");
  
  console.log("Seeding new events...");
  
  for (const event of events) {
    const sql = `
      INSERT INTO events (
        title, slug, tagline, description, category, chapter, city, area, venueName,
        capacity, eventAccessType, eventVisibility, markState, eventSecretLevel,
        timeRevealHoursBefore, locationRevealHoursBefore, coverImageUrl, tags,
        featuredOrder, eventDate, eventStatus, publishedAt, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    `;
    
    await connection.execute(sql, [
      event.title,
      event.slug,
      event.tagline,
      event.description,
      event.category,
      event.chapter,
      event.city,
      event.area,
      event.venueName,
      event.capacity,
      event.eventAccessType,
      event.eventVisibility,
      event.markState,
      event.eventSecretLevel,
      event.timeRevealHoursBefore,
      event.locationRevealHoursBefore,
      event.coverImageUrl,
      event.tags,
      event.featuredOrder,
      event.eventDate,
      event.eventStatus
    ]);
    
    console.log(`  ✓ ${event.title}`);
  }
  
  console.log("\\nSeeding complete!");
  await connection.end();
}

seedEvents().catch(console.error);
