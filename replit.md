# VENUIN - Complete SaaS Venue Management Platform

## Overview

VENUIN is a comprehensive SaaS platform that combines a public marketing website, self-serve signup with Stripe billing, and advanced multi-tenant venue management capabilities. The platform features a public marketing site with pricing plans, complete authentication suite, automated tenant provisioning, and a superadmin console for platform management. Each tenant receives a full venue management system with booking management, customer relations, AI-powered features, and Stripe Connect for client payments, while the platform uses Stripe Billing for subscription management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

VENUIN is built with a modern, scalable architecture designed for high performance and maintainability.

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

**Platform Architecture:**
- **Public Marketing Site**: Landing pages (/), feature showcase (/features), pricing plans (/pricing), contact/legal pages with SEO optimization and responsive design.
- **Authentication Suite**: Email/password signup/login, email verification, password recovery, secure session management with httpOnly cookies.
- **Subscription Billing**: Stripe Billing integration for plan management, automated provisioning, webhook handling, and customer portal access.
- **Multi-tenant System**: Isolated tenant environments at /t/:tenantSlug/app/* with plan-based feature gating and usage enforcement.
- **Superadmin Console**: Platform management at /super-admin for tenant oversight, plan management, activity monitoring, and Stripe sync.

**Tenant Features & Capabilities:**
- **Dashboard & Analytics**: Real-time metrics, booking pipeline visualization, AI-powered insights, and comprehensive reports.
- **Event & Booking Management**: Complete booking lifecycle, multi-date event support, interactive calendar, proposal integration, and 2D floor plan designer.
- **Customer & Lead Management**: Lead capture with UTM tracking, lead scoring, customer lifecycle tracking, and communication history.
- **Proposal System**: Professional proposal generation, email delivery with tracking, digital signature acceptance, and auto-conversion to bookings.
- **Payment Processing**: Stripe Connect for client payments, secure deposit handling, and automated payment workflows.
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
- Session-based authentication with PostgreSQL session store.
- Role-based access control with an initial "manager" role and future extensibility for multi-role systems.
- Secure session handling with HTTP-only cookies and environment-based secret management.

## External Dependencies

- **AI Provider**: Google Gemini 2.5 Flash (for AI-powered insights, voice-to-text, scheduling, lead scoring, and content generation).
- **Payment Processing**: 
  - Stripe Billing (for platform subscription management, plan enforcement, and automated provisioning)
  - Stripe Connect (for tenant client payments, deposit handling, and payout management)
- **Email Services**: Gmail SMTP integration (for transactional emails, notifications, email verification, and automated workflows).
- **Icons**: Lucide React (for UI icons).

## Recent Changes (August 2025)

### Complete SaaS Platform Transformation
- **Multi-tenant Architecture**: Implemented comprehensive tenant isolation with database-level separation
- **Public Marketing Site**: Created SEO-optimized pages with Apple.com-inspired design, large typography, and gradient effects  
- **Authentication System**: Built complete email/password auth with verification, password recovery, and secure sessions
- **Stripe Billing Integration**: Added subscription management, automated provisioning, and plan enforcement
- **Superadmin Console**: Developed platform management tools with working authentication and feature package creation
- **Dynamic Package System**: Frontend now pulls pricing data from actual feature packages created by super admin
- **Fixed Authentication Issues**: Resolved super admin login and authentication middleware problems
- **Real Data Integration**: Public pricing page displays actual packages instead of hardcoded data
- **Plan Management System**: Built complete tenant plan management with API endpoints, beautiful UI, and upgrade functionality
- **Clean Tenant Environment**: New tenants start with pristine databases without demo data, properly linked to chosen plans
- **Feature Package Editing**: Completed full CRUD operations for feature packages with edit/delete functionality
- **Onboarding Fixes**: Resolved user onboarding issues by fixing password authentication problems
- **Comprehensive User Management**: Added Users tab to super admin dashboard with user listing, deletion, and analytics
- **Enhanced Security System**: Implemented strict role-based access control preventing cross-role access and unauthorized impersonation
- **Complete Logout System**: Added proper logout functionality for both super admin and tenant users with session clearing and secure redirects
- **Single Super Admin Policy**: Implemented database-level constraints ensuring only one super admin can exist, with emergency transfer privileges functionality
- **Enhanced Permission System**: Added granular permission middleware with role presets (owner, admin, manager, staff, viewer) and plan enforcement capabilities following industry best practices
- **Clean Database State**: Reset database to clean state with only the protected super admin account (eyosiasyimer@gmail.com) for fresh platform start
- **Frontend Security Fix**: Fixed critical security vulnerability where regular users could access super admin interface - added proper authentication checks and automatic redirects

### Performance & Optimization Improvements (August 2025)
- **Dashboard Performance Optimization**: Reduced API calls from 12+ to 3-4 essential calls using optimized endpoints
- **Lazy Loading Implementation**: Added React lazy loading with Suspense for non-critical dashboard components
- **Unified AI Service**: Consolidated Gemini and OpenAI services into single AI service to eliminate duplication and reduce complexity
- **Optimized Dashboard API**: Created `/api/dashboard/overview` endpoint that fetches all essential data in parallel
- **Component Caching**: Added 5-minute cache for dashboard data and 30-second refresh for real-time stats
- **TypeScript Error Resolution**: Fixed all LSP diagnostics and maintained site stability during optimizations
- **Performance Skeleton Loading**: Added loading states and skeleton screens for better user experience