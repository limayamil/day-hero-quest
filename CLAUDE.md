# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Development server**: `npm run dev` (runs on port 8080)
- **Build production**: `npm run build`
- **Build development**: `npm run build:dev`
- **Lint code**: `npm run lint`
- **Preview build**: `npm run preview`

## Project Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC plugin
- **UI Library**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom theme
- **State Management**: React state + localStorage via custom hook
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query
- **Theming**: next-themes for light/dark mode

### Application Structure
This is a gamified productivity app called "Day Hero Quest" for autistic users to track daily activities:

- **Main Page**: `src/pages/Index.tsx` - Activity tracking interface with planned/completed activities
- **Core Types**: `src/types/activity.ts` - Activity, category, and stats type definitions
- **Activity Categories**: 5 categories (personal, laburo, freelance, social, otros) with different point values
- **Activity States**: completed, planned, cancelled
- **Theme Support**: Full dark/light mode with custom category colors

### Key Components
- `ActivityForm`: Form to add new activities with category selection and optional planning dates
- `ActivityCard`: Displays completed activities with points and timestamps
- `PlannedActivityCard`: Shows planned activities with complete/cancel actions
- `StatsCard`: Daily statistics summary (total activities, points, categories)
- `MotivationalMessage`: Dynamic contextual messages based on time/progress
- `ThemeToggle`: Light/dark mode switcher

### State Management Pattern
- Activities stored in localStorage via `useLocalStorage` hook
- State filtered by date for today's activities vs planned activities
- Toast notifications for user feedback on actions
- Memoized calculations for performance (stats, filtered activities)

### Styling System
- Custom Tailwind theme with HSL CSS variables
- Category-specific colors defined in tailwind config
- Custom animations (fade-in-up, pulse-success, bounce-gentle)
- Responsive design optimized for mobile (max-w-md container)

### PWA Configuration
- **Progressive Web App enabled** with vite-plugin-pwa
- **Service Worker**: Auto-generated with Workbox for offline functionality
- **Manifest**: Web app manifest configured for standalone installation
- **Icons**: Complete icon set generated (64x64, 192x192, 512x512, maskable)
- **Update Notifications**: PWAUpdatePrompt component handles app updates
- **Offline Support**: OfflineIndicator shows connection status
- **Installation**: App can be installed on mobile/desktop devices
- **Shortcuts**: PWA shortcut for "Agregar Actividad" action

### Important Conventions
- Spanish language for user-facing text
- Date handling uses native JavaScript Date objects
- Activity IDs generated using timestamp strings
- Points system varies by category (personal: 10, laburo: 15, freelance: 20, social: 12, otros: 8)
- Path alias: `@/` maps to `./src`
- PWA components: PWAUpdatePrompt and OfflineIndicator integrated in App.tsx