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
- **User System**: Multi-tenant authentication with role-based access control (Super Admin, Admin, Staff).
- **Tenant Authentication**: Isolated authentication system for tenant accounts with proper session management.
- **Security**: Secure session handling with tenant data isolation.

### Core Technical Implementations & Feature Specifications
- **Multi-Tenant Authentication System**: Complete tenant authentication with isolated data access, session management, and role-based access control supporting Super Admin, Admin, and Staff roles with demo credentials (john@venuineevents.com / demo123, jane@venuineevents.com / demo123).
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
- **User Management System**: Fully functional tenant user management with role-based access control (Admin, Staff, Viewer), feature-based permissions tied to subscription packages, and complete CRUD operations through Settings → Users tab.
- **Super Admin Panel**: Complete platform administration with tenant account management, custom package creation, real-time updates, and activity monitoring. Account management includes proper edit modal functionality for existing accounts.

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