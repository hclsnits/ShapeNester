# Overview

This is a React-based web application called "Snijtool v2" - a shape cutting estimation tool. The app allows users to select materials, design various shapes (rectangle, circle, triangle, hexagon, ring, oval, etc.), configure dimensions, calculate nesting patterns on roll material, estimate costs, and export quotes as PDF or Excel files. The application is built as a client-side single-page application (SPA) with a full-stack foundation using Express.js backend and React frontend with TypeScript.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite as the build tool
- **Styling**: TailwindCSS with Radix UI components for consistent design system
- **State Management**: Local component state with localStorage for cart persistence
- **UI Components**: Comprehensive Radix UI component library (shadcn/ui) including forms, dialogs, sheets, and input controls
- **Data Validation**: Zod for type-safe data validation and schema definition

## Backend Architecture
- **Framework**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Development**: Vite dev server integration for seamless development experience

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM providing type-safe queries
- **In-Memory Storage**: Fallback MemStorage implementation for development/testing
- **Client Storage**: localStorage for cart data persistence
- **Schema Management**: Drizzle migrations with automated schema generation

## Authentication and Authorization
- **Session-based**: Express sessions with PostgreSQL store
- **User Schema**: Basic username/password authentication system
- **Storage Interface**: Abstracted storage layer supporting multiple implementations

## External Dependencies
- **Database**: Neon Database (serverless PostgreSQL) for production deployment
- **PDF Generation**: pdf-lib for creating downloadable quote PDFs
- **Excel Export**: xlsx library for spreadsheet quote generation
- **File Downloads**: file-saver for client-side file downloads
- **Geometry Calculations**: Custom geometry libraries for shape area, perimeter, and nesting calculations
- **Money Handling**: BigInt-based monetary calculations to avoid floating-point errors
- **Development Tools**: Replit-specific plugins for development environment integration

The application uses a monorepo structure with shared TypeScript types and schemas between client and server, enabling full-stack type safety. The material catalog is stored as static JSON data, and all shape calculations are performed client-side using custom mathematical libraries.