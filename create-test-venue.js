import { db } from './server/db.ts';
import { venues, spaces } from './shared/schema.ts';

async function createTestVenue() {
  try {
    console.log('Creating test venue...');
    const venueData = {
      id: 'test-venue-' + Date.now(),
      name: 'Grand Ballroom Test',
      address: '123 Event Street',
      city: 'Event City',
      state: 'CA',
      zipCode: '90210',
      country: 'USA',
      phone: '555-123-4567',
      email: 'info@grandballroom.com',
      capacity: 200,
      description: 'Beautiful venue for your special events',
      amenities: ['parking', 'catering', 'av_equipment'],
      tenantId: 'd8057223-0b2d-4ba1-a15f-90e4a7aad21f',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.insert(venues).values(venueData).returning();
    console.log('✅ Venue created:', result[0]);

    // Also create a space for this venue
    const spaceData = {
      id: 'test-space-' + Date.now(),
      venueId: result[0].id,
      name: 'Main Hall',
      capacity: 150,
      type: 'ballroom',
      tenantId: 'd8057223-0b2d-4ba1-a15f-90e4a7aad21f',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const spaceResult = await db.insert(spaces).values(spaceData).returning();
    console.log('✅ Space created:', spaceResult[0]);

    // Verify the venue exists by querying it back
    const allVenues = await db.select().from(venues);
    console.log(`📊 Total venues in database: ${allVenues.length}`);
    console.log('All venues:', allVenues.map(v => ({ id: v.id, name: v.name, tenantId: v.tenantId })));

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create venue:', error);
    process.exit(1);
  }
}

createTestVenue();