# Event Venue Management System

## Overview

This is a comprehensive event venue management system built with React/TypeScript frontend and Express.js backend. The application provides venue owners and event managers with tools to manage bookings, customers, proposals, payments, and tasks. It features AI-powered capabilities including smart scheduling, automated email replies, lead scoring, and predictive analytics to optimize venue operations and enhance customer experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with pages for dashboard, events, customers, proposals, payments, and tasks
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