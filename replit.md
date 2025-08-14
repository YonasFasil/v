# Event Venue Management System - "Venuine"

## Overview

"Venuine" is a comprehensive event venue management system designed for venue owners and event managers. It provides tools to manage bookings, customers, proposals, payments, and tasks. The system incorporates AI-powered features such as smart scheduling, automated email replies, lead scoring, and predictive analytics to optimize venue operations and enhance customer experience. The business vision is to streamline venue management, increase efficiency, and provide data-driven insights to maximize revenue and customer satisfaction in the event industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite.
- **Routing**: Wouter.
- **State Management**: TanStack Query (React Query) for server state and caching.
- **UI Components**: Radix UI primitives with custom styling using Tailwind CSS and shadcn/ui.
- **Forms**: React Hook Form with Zod validation.
- **Styling**: Tailwind CSS with CSS variables.
- **UI/UX Decisions**:
    - Default view for Events & Bookings is cards for immediate overview.
    - Full-width calendar layout for enhanced event visibility.
    - Modern settings redesign with organized tabs for clear configuration.
    - Enhanced event action buttons with sticky, semi-transparent design.
    - Clean, grid-based layouts for modals (e.g., event creation/editing).
    - Mobile-responsive design for all key features like proposals.
    - Visual indicators for pricing, categories, and booking statuses.
    - Simplified interface: Removed unnecessary features (pricing models, amenities, appearance settings) per user request for streamlined UI.

### Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js.
- **API Design**: RESTful API.
- **Database Layer**: Abstracted storage interface (`IStorage`) for flexible database implementations.
- **Error Handling**: Centralized middleware.

### Data Storage
- **ORM**: Drizzle ORM configured for PostgreSQL.
- **Database**: PostgreSQL (Neon serverless).
- **Migrations**: Drizzle Kit.
- **Schema**: Comprehensive data model for users, venues, customers, bookings, proposals, payments, tasks, and AI insights.

### Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store.
- **User System**: Role-based access (manager role by default).
- **Security**: Secure session handling.

### Core Technical Implementations & Feature Specifications
- **Dedicated Floor Plans & Setup Section**: Centralized management and design of venue floor plans, independent of venue editing, with interactive 2D designer (drag-and-drop, resizable objects, multiple setup styles, capacity tracking).
- **Modern Settings**: Comprehensive configuration for General, Notifications, Appearance, Integrations, BEO, Taxes, Security.
- **BEO (Banquet Event Orders) System**: Template-based professional BEO generation from event summaries with customizable sections and print/download capabilities.
- **Service & Package Management**: One-click duplication, comprehensive category management (visual overview, color coding), and flexible pricing models including "Per Hour," "Fixed Price," and "Per Person." Corrected package-service pricing logic to include bundled services at no extra cost.
- **Event Workflow**: Seamless integration of proposals into event creation with status tracking (sent, viewed, accepted, declined). Enhanced event creation and editing modals with component editing, copy configuration for multi-date events, and in-workflow service creation.
- **Customer Communication**: Integrated panel for direct messaging (email, SMS, internal notes) from event details.
- **Booking Conflict Detection**: Space-specific checking with detailed warnings.
- **Real-Time Availability**: Calendar shows actual booking status with detailed event cards.
- **Contract System**: Multi-date contract system grouping events, with UI integration and highlighting.
- **Reports & Analytics**: Comprehensive dashboard with real-time data, interactive charts, and AI-powered insights.
- **Tax and Fees System**: Configurable percentage and fixed-rate options.

### AI Integration
- **Provider**: Google Gemini API.
- **Features**: Voice-to-Text Booking (with error correction), Smart Scheduling, Automated Email Replies, Lead Scoring, Predictive Analytics, AI-powered Proposal Generation, Natural Language Processing for voice data extraction.
- **AI-Powered Insights**: Suggestions for packages and services with one-click application.
- **Disclaimers**: Clear warnings about potential AI errors.

## External Dependencies

### Core Backend Services
- **Database**: Neon PostgreSQL serverless database.
- **Session Store**: PostgreSQL-backed session storage (`connect-pg-simple`).
- **ORM**: Drizzle ORM.

### AI & Machine Learning
- **Google Gemini API**: Gemini 2.5 Flash model.
- **Voice Recognition**: Browser Web Speech API.

### Frontend Libraries
- **UI Framework**: Radix UI.
- **Styling**: Tailwind CSS.
- **Validation**: Zod.
- **Date Handling**: date-fns.
- **Carousel**: Embla Carousel.

### Development Tools
- **Build System**: Vite.
- **Type Checking**: TypeScript.
- **Code Quality**: ESLint, Prettier.

## Recent Technical Fixes (August 2025)

### Critical Bug Fixes
- **Proposal Sending 409 Conflict Fixed (August 14, 2025)**: Resolved time slot conflict error when sending proposals by fixing conflict detection logic to use `validatedData.proposalId` instead of `bookingData.proposalId`. Proposals can now be successfully sent and linked to bookings.
- **Intelligent Conflict Detection Implemented (August 14, 2025)**: Updated conflict detection to be more user-friendly:
  - **Blocks creation** for `confirmed_deposit_paid` and `confirmed_fully_paid` bookings (paid bookings cannot be overbooked)
  - **Shows warning but allows creation** for `inquiry`, `pending`, and `tentative` bookings (tentative bookings can coexist)
- **'Confirmed' Status Removal (August 14, 2025)**: Completely removed the deprecated 'confirmed' status from the system:
  - Updated EventStatus type to exclude 'confirmed'
  - Fixed all legacy status mappings to map 'confirmed' to 'tentative'
  - Updated customer analytics to show "Paid" instead of "Confirmed" bookings
- **Booking Creation Validation Error (August 14, 2025)**: Fixed missing `tenantId` field in booking creation that was causing Zod validation failures. Added proper tenant isolation to both single event bookings and multi-event contract creation endpoints.
- **API Endpoint Corrections**: Fixed space management endpoints from `/api/venues/{id}/spaces/{id}` to correct `/api/spaces/{id}` pattern.
- **Enhanced Venue Management**: Implemented separate "Add Space" functionality with proper TypeScript error handling and blue outlined styling.

### System Stability
- All booking creation workflows now properly validated and working
- Proposal sending and booking creation from proposals fully functional
- Intelligent conflict detection prevents overbooking paid events while allowing flexible tentative bookings
- Tenant isolation maintained throughout all booking operations
- Space management operations correctly routing through dedicated endpoints
- All TypeScript errors resolved, system running without LSP diagnostics