# Event Venue Management System - "Venuine"

## Overview

This is a comprehensive event venue management system called "Venuine" built with React/TypeScript frontend and Express.js backend. The application provides venue owners and event managers with tools to manage bookings, customers, proposals, payments, and tasks. It features AI-powered capabilities including smart scheduling, automated email replies, lead scoring, and predictive analytics to optimize venue operations and enhance customer experience.

## Recent Updates (August 2025)

### Latest Completed Features:
- ✅ **Event Creation Modal Redesign (August 2025)**: Successfully redesigned Step 2 of event creation modal to match event edit modal design with clean grid layout, professional package selection cards, improved visual organization, and copy configuration feature for multi-date events. Applied clean two-column layout with packages/services on left and summary on right.
- ✅ **Enhanced Customer Communication System (August 2025)**: Added comprehensive customer communication panel in event summary modal with direct messaging capabilities. Users can now send emails, SMS, or internal notes directly from event details, plus quick access to email and phone contact options.
- ✅ **Fixed Proposal Creation System (August 2025)**: Resolved all proposal creation errors including date formatting issues, TypeScript conflicts, and time conversion problems. Proposals now work correctly for both single events and multi-date contracts with proper status tracking.
- ✅ **Integrated Proposal System (August 2025)**: Completely restructured proposals to be part of the event creation process rather than separate entities. Events can now be sent directly as proposals with integrated status tracking (sent, viewed, accepted, declined) visible on both event cards and table views. Removed separate Proposals page and navigation as proposals are now seamlessly integrated into the event workflow.
- ✅ **Mobile-Responsive Proposal System (August 2025)**: Completely redesigned proposal creation modal and pages for mobile devices with responsive layouts, touch-friendly controls, mobile card views, and optimized spacing for all screen sizes
- ✅ **Adjustable Pricing in Proposals (August 2025)**: Added comprehensive custom pricing functionality allowing venue managers to modify package and service prices within individual proposals for custom quotes, discounts, and special offers with quick discount buttons and visual indicators
- ✅ **Enhanced Calendar Design with Collapsible Sidebar (December 2025)**: Major calendar redesign with collapsible sidebar functionality, wider spacious layout, better event visibility showing up to 3 events per day with comprehensive details, responsive spacing, and calendar as the default primary view
- ✅ **Comprehensive Booking Conflict Detection**: Enhanced conflict detection system with space-specific checking, detailed conflict warnings showing event names, customers, times, and status to prevent overbooking
- ✅ **Real-Time Availability Display**: Calendar shows actual booking status instead of generic "Available" messages with enhanced event cards displaying customer names, times, guest counts, and venue spaces
- ✅ **Integrated Contract System Throughout UI**: Complete contract system integration with Events & Bookings page showing contract summaries, calendar using full edit modal, and contract-aware display with purple highlighting for multi-date events
- ✅ **Multi-Date Contract System**: Fully functional contract system that automatically groups multi-date events under a single contract while creating individual bookings for each date, with proper date validation and error handling
- ✅ **Enhanced Reports & Analytics Page**: Comprehensive reporting dashboard with real-time data refresh, interactive charts, AI-powered insights, performance scoring, and export functionality
- ✅ **AI-Powered Insights with Real Actions**: AI suggestions that can be applied with one click to create actual packages and services based on Google Gemini recommendations
- ✅ **Comprehensive AI Disclaimers**: Clear warnings throughout the interface that AI suggestions may contain errors and should be verified before implementation
- ✅ **Real-Time Analytics Data**: Live dashboard with auto-refresh functionality showing actual venue performance metrics, revenue trends, and utilization rates
- ✅ **Intelligent Voice Booking with Error Correction**: Enhanced voice booking system that automatically corrects speech recognition errors and understands context using Google Gemini AI
- ✅ **Comprehensive Event Editing Modal**: Enhanced event editing to match creation modal functionality with complete component editing capabilities including Copy Config, New Service creation, advanced pricing calculations, and multi-date management
- ✅ **Copy Config Functionality**: Added "Copy to Other Dates" button that copies booking configurations between multiple event dates in both creation and editing modals
- ✅ **New Service Creation**: Added "+ New Service" button in event modals to create services directly during booking process without leaving the workflow
- ✅ **Enhanced Per-Guest Calculation**: Replaced "Apply guest count" with automatic package calculation that shows total price based on guest count
- ✅ **Tax and Fees System**: Created comprehensive tax/fee management section in settings with percentage and fixed-rate options

### Previously Completed Features:
- ✅ **Functional Settings System**: All 6 settings areas (Business, Notifications, AI Features, Payment, Security, Integrations) are fully functional with form validation and API integration
- ✅ **One-Click Stripe Connect Integration**: Implemented using provided setup link instead of manual API key entry - users can connect their Stripe account with a single click
- ✅ **Global Search Functionality**: Comprehensive search across events, services, packages, venues, and customers with real-time results and keyboard shortcuts (Cmd/Ctrl+K)
- ✅ **Mobile Navigation**: Fixed mobile navigation to properly show all sections including Venues, Packages, and Settings
- ✅ **Real Dashboard Data**: Replaced dummy data with comprehensive real booking data showing actual metrics and venue utilization

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with pages for dashboard, events, customers, proposals, payments, tasks, venues, packages, and settings
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with custom styling using Tailwind CSS and shadcn/ui components
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Styling**: Tailwind CSS with CSS variables for theming and custom design tokens

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API structure with organized route handlers in `/server/routes.ts`
- **Database Layer**: Abstracted storage interface (`IStorage`) allowing for flexible database implementations
- **Development Setup**: Custom Vite integration for development with hot module replacement
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

### Data Storage
- **ORM**: Drizzle ORM configured for PostgreSQL with schema definitions in `/shared/schema.ts`
- **Database**: PostgreSQL (configured via Neon serverless) with connection pooling
- **Migrations**: Drizzle Kit for database schema migrations stored in `/migrations` directory
- **Schema**: Comprehensive data model including users, venues, customers, bookings, proposals, payments, tasks, and AI insights

### Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL session store using `connect-pg-simple`
- **User System**: Role-based access with user authentication (manager role by default)
- **Security**: Secure session handling with proper cookie configuration

### AI Integration
- **Provider**: Google Gemini API integration for AI-powered features
- **Voice-to-Text Booking**: Speech recognition for hands-free event creation with automatic field population
- **Smart Scheduling**: AI-driven optimal booking time suggestions based on venue utilization and event patterns
- **Email Automation**: Automated email reply generation with contextual understanding
- **Lead Scoring**: Intelligent lead prioritization using machine learning algorithms
- **Predictive Analytics**: Revenue forecasting and booking trend analysis
- **Content Generation**: AI-powered proposal generation based on customer and event data
- **Natural Language Processing**: Voice transcript parsing to extract booking details automatically

## External Dependencies

### Core Backend Services
- **Database**: Neon PostgreSQL serverless database for data persistence
- **Session Store**: PostgreSQL-backed session storage for user authentication
- **ORM**: Drizzle ORM for type-safe database operations

### AI & Machine Learning
- **Google Gemini API**: Gemini 2.5 Flash model for natural language processing and content generation
- **Voice Recognition**: Browser Web Speech API for voice-to-text functionality
- **Smart Features**: Voice booking, scheduling optimization, email automation, and predictive analytics

### Frontend Libraries
- **UI Framework**: Radix UI component primitives for accessible design system
- **Styling**: Tailwind CSS for utility-first styling approach
- **Validation**: Zod for runtime type validation and schema definitions
- **Date Handling**: date-fns for date manipulation and formatting
- **Carousel**: Embla Carousel for interactive UI components

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Checking**: TypeScript for static type checking across the entire codebase
- **Code Quality**: ESLint and Prettier configurations for consistent code style
- **Development**: Replit-specific plugins for seamless cloud development experience