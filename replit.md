# VENUIN - Complete Venue Management Platform Documentation

## Overview

VENUIN is an advanced multi-tenant SaaS platform designed for comprehensive venue management. Its primary purpose is to provide venue owners and event managers with a complete suite of tools for managing bookings, customers, proposals, payments, and tasks. The platform incorporates AI-powered features to optimize operations, enhance administrative capabilities with role-based access controls, and ensure scalability. The business vision is to streamline venue operations, improve efficiency, and leverage AI for intelligent insights, positioning VENUIN as a leading solution in the event management market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

VENUIN is built with a modern, scalable multi-tenant architecture designed for high performance and maintainability.

**Frontend Architecture:**
- **Framework**: React 18 with TypeScript, using Vite for build tooling.
- **Routing**: Wouter for lightweight client-side routing.
- **State Management**: TanStack Query (React Query v5) for server state and caching.
- **UI Components**: Radix UI primitives with shadcn/ui design system.
- **Styling**: Tailwind CSS with custom CSS variables for theming.
- **Forms**: React Hook Form with Zod validation schemas.
- **Icons**: Lucide React icons.

**Backend Architecture:**
- **Runtime**: Node.js with Express.js and TypeScript.
- **API Design**: RESTful API with comprehensive error handling.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations.
- **Session Management**: Express sessions with PostgreSQL session store.

**Major Features & Capabilities:**
- **Dashboard & Analytics**: Real-time metrics, booking pipeline visualization, AI-powered insights, and comprehensive reports.
- **Event & Booking Management**: Complete booking lifecycle, multi-date event support, interactive calendar, proposal integration, and 2D floor plan designer.
- **Customer & Lead Management**: Lead capture with UTM tracking, lead scoring, customer lifecycle tracking, and communication history.
- **Proposal System**: Professional proposal generation, email delivery with tracking, digital signature acceptance, and auto-conversion to bookings.
- **Payment Processing**: Secure payment handling via Stripe Connect, including onboarding, payment intent creation, and webhook integration.
- **Venue & Space Management**: Multi-venue support, capacity management, amenity tracking, and flexible pricing configuration.
- **Service & Package Management**: Flexible service catalog, package bundling, dynamic pricing models, and tax/fee application.
- **Communication & Notifications**: Gmail integration for automated workflows, internal notes, and customizable email templates.
- **Task & Team Management**: Task assignment, due date tracking, booking-linked automation, and team collaboration.
- **AI-Powered Features**: Voice-to-text booking capture, smart scheduling, automated email replies, lead priority scoring, predictive analytics, and proposal content generation.

**User Interface & Experience:**
- **Design System**: Modern, clean interface using Tailwind CSS, responsive design for desktop and mobile, with infrastructure for dark/light themes. Consistent component library built with Radix UI.
- **Navigation Structure**: Collapsible sidebar with organized sections for Dashboard, Events, Customers, Leads, Proposals, Business tools (Payments, Tasks, Venues, Setup Styles, Packages), AI features, and Configuration.
- **Mobile Responsiveness**: Fully responsive layout, mobile-optimized navigation, and touch-friendly elements.

**Security & Role Management:**
- Comprehensive 5-tier RBAC system (Super Admin → Tenant Admin → Manager → Staff → Customer).
- Multi-tenant data isolation with tenant ID validation on all operations.
- Session-based authentication with PostgreSQL session store.
- Permission-based access control with middleware enforcement.
- Secure session handling with HTTP-only cookies and environment-based secret management.
- Admin development interface for role testing and tenant management.

**Recent Fixes (August 11, 2025):**
- Resolved booking and proposal creation validation errors by implementing proper tenant ID injection.
- Fixed multi-tenant data isolation issues in booking and proposal systems.
- Enhanced subscription package management with complete CRUD operations and professional UI.
- Implemented comprehensive admin interfaces for tenant management and subscription packages.

## External Dependencies

- **AI Provider**: Google Gemini 2.5 Flash (for AI-powered insights, voice-to-text, scheduling, lead scoring, and content generation).
- **Payments**: Stripe Connect (for secure payment processing, account onboarding, and payment intent creation).
- **Email Services**: Gmail SMTP integration (for notifications, proposals, and automated email workflows).
- **Icons**: Lucide React (for UI icons).