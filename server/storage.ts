async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const result = await this.db.update(venues).set(venue).where(eq(venues.id, id)).returning();
    return result[0];
  }