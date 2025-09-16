async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const result = await this.db.update(venues).set(venue).where(eq(venues.id, id)).returning();
    return result[0];
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const result = await this.db.insert(venues).values(venue).returning();
    return result[0];
  }