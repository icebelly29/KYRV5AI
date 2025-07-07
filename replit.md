# UK Legal AI Chatbot

## Overview

This is a full-stack web application that provides a UK-focused legal AI chatbot powered by OpenAI's GPT-4. The application helps users understand their legal rights across various domains including employment, housing, consumer rights, police encounters, family law, benefits, and more. The system provides contextually aware legal advice with proper citations from UK legislation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Integration**: OpenAI GPT-4 for AI-powered legal responses
- **Session Management**: In-memory storage with planned PostgreSQL integration
- **Middleware**: Custom logging and error handling

### Database Strategy
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Current State**: In-memory storage implementation (MemStorage class)
- **Planned**: PostgreSQL with Neon serverless database
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Chat System
- **Real-time Messaging**: Instant chat interface with typing indicators
- **Context Awareness**: Maintains conversation history and context
- **Category Detection**: Automatically categorizes legal questions
- **Citation Support**: Provides references to UK legislation and legal sources

### Legal Knowledge Base
- **Domain Coverage**: Employment, housing, consumer rights, police powers, family law, benefits, immigration, criminal law, discrimination, and data protection
- **UK Law Focus**: Specialized knowledge of UK legislation including:
  - Employment Rights Act 1996
  - Housing Act 1988
  - Consumer Rights Act 2015
  - Police and Criminal Evidence Act 1984 (PACE)
  - Human Rights Act 1998
  - Equality Act 2010

### UI/UX Features
- **Dark Theme**: Professional dark theme optimized for legal consultation
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Component Library**: Comprehensive UI components from Radix UI

## Data Flow

1. **User Input**: Messages entered through ChatInput component
2. **Preprocessing**: Category detection and context preparation
3. **AI Processing**: OpenAI GPT-4 generates legal responses with citations
4. **Response Handling**: Formatted responses with legal sources
5. **State Management**: Conversation state maintained in memory/database
6. **UI Updates**: Real-time updates via React Query

## External Dependencies

### Core Dependencies
- **OpenAI API**: GPT-4 integration for AI responses
- **Neon Database**: Serverless PostgreSQL for production
- **React Ecosystem**: React 18, React Query, React Hook Form
- **UI Libraries**: Radix UI primitives, Lucide React icons
- **Development Tools**: Vite, TypeScript, ESBuild

### Development Environment
- **Replit Integration**: Custom Vite plugins for Replit development
- **Hot Reload**: Vite HMR with custom middleware
- **Error Handling**: Runtime error overlay for development

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: ESBuild bundles Express server to `dist/index.js`
- **Assets**: Static assets served from built frontend

### Environment Configuration
- **Development**: tsx for TypeScript execution with hot reload
- **Production**: Node.js execution of bundled server
- **Database**: Environment-based connection strings

### Scaling Considerations
- **Session Storage**: Designed for easy migration from memory to PostgreSQL
- **API Rate Limiting**: Ready for OpenAI API quota management
- **Static Assets**: CDN-ready static file serving

## Changelog

```
Changelog:
- July 07, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```