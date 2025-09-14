import { relations } from "drizzle-orm/relations";
import { tenants, venues, users, taxSettings, bookings, contracts, customers, spaces, campaignSources, communications, proposals, aiInsights, companies, leadActivities, leads, packages, leadTags, tags, payments, leadTasks, settings, setupStyles, tasks, services, tours, subscriptionPackages } from "./schema";

export const venuesRelations = relations(venues, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [venues.tenantId],
		references: [tenants.id]
	}),
	bookings: many(bookings),
	leads: many(leads),
	proposals: many(proposals),
	spaces: many(spaces),
	tours: many(tours),
}));

export const tenantsRelations = relations(tenants, ({one, many}) => ({
	venues: many(venues),
	users: many(users),
	taxSettings: many(taxSettings),
	bookings: many(bookings),
	campaignSources: many(campaignSources),
	communications: many(communications),
	aiInsights: many(aiInsights),
	companies: many(companies),
	customers: many(customers),
	leadActivities: many(leadActivities),
	leads: many(leads),
	packages: many(packages),
	leadTags: many(leadTags),
	payments: many(payments),
	contracts: many(contracts),
	leadTasks: many(leadTasks),
	settings: many(settings),
	setupStyles: many(setupStyles),
	tasks: many(tasks),
	proposals: many(proposals),
	services: many(services),
	tags: many(tags),
	tours: many(tours),
	subscriptionPackage: one(subscriptionPackages, {
		fields: [tenants.subscriptionPackageId],
		references: [subscriptionPackages.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [users.tenantId],
		references: [tenants.id]
	}),
	bookings: many(bookings),
	leadActivities: many(leadActivities),
	leadTasks: many(leadTasks),
	tasks: many(tasks),
	tours: many(tours),
}));

export const taxSettingsRelations = relations(taxSettings, ({one}) => ({
	tenant: one(tenants, {
		fields: [taxSettings.tenantId],
		references: [tenants.id]
	}),
}));

export const bookingsRelations = relations(bookings, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [bookings.tenantId],
		references: [tenants.id]
	}),
	contract: one(contracts, {
		fields: [bookings.contractId],
		references: [contracts.id]
	}),
	customer: one(customers, {
		fields: [bookings.customerId],
		references: [customers.id]
	}),
	venue: one(venues, {
		fields: [bookings.venueId],
		references: [venues.id]
	}),
	space: one(spaces, {
		fields: [bookings.spaceId],
		references: [spaces.id]
	}),
	user: one(users, {
		fields: [bookings.cancelledBy],
		references: [users.id]
	}),
	communications: many(communications),
	payments: many(payments),
	tasks: many(tasks),
	proposals: many(proposals),
}));

export const contractsRelations = relations(contracts, ({one, many}) => ({
	bookings: many(bookings),
	tenant: one(tenants, {
		fields: [contracts.tenantId],
		references: [tenants.id]
	}),
	customer: one(customers, {
		fields: [contracts.customerId],
		references: [customers.id]
	}),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	bookings: many(bookings),
	communications: many(communications),
	tenant: one(tenants, {
		fields: [customers.tenantId],
		references: [tenants.id]
	}),
	company: one(companies, {
		fields: [customers.companyId],
		references: [companies.id]
	}),
	leads: many(leads),
	contracts: many(contracts),
	proposals: many(proposals),
}));

export const spacesRelations = relations(spaces, ({one, many}) => ({
	bookings: many(bookings),
	proposals: many(proposals),
	venue: one(venues, {
		fields: [spaces.venueId],
		references: [venues.id]
	}),
}));

export const campaignSourcesRelations = relations(campaignSources, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [campaignSources.tenantId],
		references: [tenants.id]
	}),
	leads: many(leads),
}));

export const communicationsRelations = relations(communications, ({one}) => ({
	tenant: one(tenants, {
		fields: [communications.tenantId],
		references: [tenants.id]
	}),
	booking: one(bookings, {
		fields: [communications.bookingId],
		references: [bookings.id]
	}),
	proposal: one(proposals, {
		fields: [communications.proposalId],
		references: [proposals.id]
	}),
	customer: one(customers, {
		fields: [communications.customerId],
		references: [customers.id]
	}),
}));

export const proposalsRelations = relations(proposals, ({one, many}) => ({
	communications: many(communications),
	leads: many(leads),
	tenant: one(tenants, {
		fields: [proposals.tenantId],
		references: [tenants.id]
	}),
	booking: one(bookings, {
		fields: [proposals.bookingId],
		references: [bookings.id]
	}),
	customer: one(customers, {
		fields: [proposals.customerId],
		references: [customers.id]
	}),
	venue: one(venues, {
		fields: [proposals.venueId],
		references: [venues.id]
	}),
	space: one(spaces, {
		fields: [proposals.spaceId],
		references: [spaces.id]
	}),
}));

export const aiInsightsRelations = relations(aiInsights, ({one}) => ({
	tenant: one(tenants, {
		fields: [aiInsights.tenantId],
		references: [tenants.id]
	}),
}));

export const companiesRelations = relations(companies, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [companies.tenantId],
		references: [tenants.id]
	}),
	customers: many(customers),
}));

export const leadActivitiesRelations = relations(leadActivities, ({one}) => ({
	tenant: one(tenants, {
		fields: [leadActivities.tenantId],
		references: [tenants.id]
	}),
	lead: one(leads, {
		fields: [leadActivities.leadId],
		references: [leads.id]
	}),
	user: one(users, {
		fields: [leadActivities.createdBy],
		references: [users.id]
	}),
}));

export const leadsRelations = relations(leads, ({one, many}) => ({
	leadActivities: many(leadActivities),
	tenant: one(tenants, {
		fields: [leads.tenantId],
		references: [tenants.id]
	}),
	venue: one(venues, {
		fields: [leads.venueId],
		references: [venues.id]
	}),
	campaignSource: one(campaignSources, {
		fields: [leads.sourceId],
		references: [campaignSources.id]
	}),
	customer: one(customers, {
		fields: [leads.convertedCustomerId],
		references: [customers.id]
	}),
	proposal: one(proposals, {
		fields: [leads.proposalId],
		references: [proposals.id]
	}),
	leadTags: many(leadTags),
	leadTasks: many(leadTasks),
	tours: many(tours),
}));

export const packagesRelations = relations(packages, ({one}) => ({
	tenant: one(tenants, {
		fields: [packages.tenantId],
		references: [tenants.id]
	}),
}));

export const leadTagsRelations = relations(leadTags, ({one}) => ({
	tenant: one(tenants, {
		fields: [leadTags.tenantId],
		references: [tenants.id]
	}),
	lead: one(leads, {
		fields: [leadTags.leadId],
		references: [leads.id]
	}),
	tag: one(tags, {
		fields: [leadTags.tagId],
		references: [tags.id]
	}),
}));

export const tagsRelations = relations(tags, ({one, many}) => ({
	leadTags: many(leadTags),
	tenant: one(tenants, {
		fields: [tags.tenantId],
		references: [tenants.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	tenant: one(tenants, {
		fields: [payments.tenantId],
		references: [tenants.id]
	}),
	booking: one(bookings, {
		fields: [payments.bookingId],
		references: [bookings.id]
	}),
}));

export const leadTasksRelations = relations(leadTasks, ({one}) => ({
	tenant: one(tenants, {
		fields: [leadTasks.tenantId],
		references: [tenants.id]
	}),
	lead: one(leads, {
		fields: [leadTasks.leadId],
		references: [leads.id]
	}),
	user: one(users, {
		fields: [leadTasks.assignedTo],
		references: [users.id]
	}),
}));

export const settingsRelations = relations(settings, ({one}) => ({
	tenant: one(tenants, {
		fields: [settings.tenantId],
		references: [tenants.id]
	}),
}));

export const setupStylesRelations = relations(setupStyles, ({one}) => ({
	tenant: one(tenants, {
		fields: [setupStyles.tenantId],
		references: [tenants.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one}) => ({
	tenant: one(tenants, {
		fields: [tasks.tenantId],
		references: [tenants.id]
	}),
	user: one(users, {
		fields: [tasks.assignedTo],
		references: [users.id]
	}),
	booking: one(bookings, {
		fields: [tasks.bookingId],
		references: [bookings.id]
	}),
}));

export const servicesRelations = relations(services, ({one}) => ({
	tenant: one(tenants, {
		fields: [services.tenantId],
		references: [tenants.id]
	}),
}));

export const toursRelations = relations(tours, ({one}) => ({
	tenant: one(tenants, {
		fields: [tours.tenantId],
		references: [tenants.id]
	}),
	lead: one(leads, {
		fields: [tours.leadId],
		references: [leads.id]
	}),
	venue: one(venues, {
		fields: [tours.venueId],
		references: [venues.id]
	}),
	user: one(users, {
		fields: [tours.conductedBy],
		references: [users.id]
	}),
}));

export const subscriptionPackagesRelations = relations(subscriptionPackages, ({many}) => ({
	tenants: many(tenants),
}));