# ServFlo App Development Guide

## GitHub Repository Information

### Web App Repository
- Repository URL: https://github.com/cjoyner14/ServFlo-Web-App-5.9.25
- Default branch: main
- Working directory: /Users/cjoyner96/Documents/ServFlo/ServFlo-Web-App-main

### iOS App Repository
- Repository URL: https://github.com/cjoyner14/ServFlo-iOS-App
- Default branch: main
- Working directory: /Users/cjoyner96/Documents/Full App 3.17.25 - working/ServFlo - IOS

## Committing Changes
When committing changes to the ServFlo Web App, follow these steps:
1. Always use the git repository located in the current working directory
2. Add changed files using `git add [file paths]`
3. Commit with a descriptive message using `git commit -m "message"`
4. Push to GitHub using `git push github main`

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build
- `npm run generate-pwa-assets` - Generate PWA assets

## Code Style Guidelines
- **Components**: Functional components with TypeScript interfaces for props
- **Naming**: PascalCase for components/interfaces, camelCase for variables/functions
- **Exports**: Use named exports, not default exports
- **Imports**: Group by source, use 'type' keyword for type imports
- **Types**: Explicit type annotations, descriptive type names
- **Structure**: Feature-based organization, component co-location
- **State**: React context for global state, hooks for local state
- **Styling**: Tailwind CSS with custom color scheme
- **Forms**: Controlled components with validation

## Architecture
- Vite build system with TypeScript integration
- React + TypeScript frontend
- Supabase backend (auth, database, storage, edge functions)
- PWA with service worker support

## Optimizations (Added May 2025)
The following performance optimizations have been implemented:

### Data Fetching & Caching
- Time-based cache expiration (5 minutes by default)
- Smart fetch detection to prevent duplicate requests 
- IndexedDB integration for offline data access
- Cache invalidation on data mutations

### Loading States
- Delayed loading indicators to prevent UI flicker (300ms threshold)
- Minimum display time for loading states
- Smooth transitions between loading states

### Error Handling
- Centralized error handling with categorization
- User-friendly error messages
- Automatic retries with exponential backoff
- Helpful error resolution suggestions

### Component Efficiency
- Zustand store optimizations
- Smart re-rendering prevention
- IndexedDB for offline data persistence

## Using Optimized Utilities
When implementing new features, use the following utilities:

1. **For Data Fetching**
   - Import `optimizedFetch.ts` utilities
   - Use `shouldFetchData()` to check before making API calls
   - Call `markFetchComplete()` after successful fetches
   - Call `invalidateCache()` after data mutations

2. **For Loading States**
   - Import `useDelayedLoading` or `useSmoothLoading` from hooks
   - Pass your raw loading state to get an optimized version

3. **For Error Handling**
   - Import utilities from `errorHandler.ts`
   - Use `createAppError()` to standardize errors
   - Use `withRetry()` for operations that should auto-retry
   - Display user-friendly messages with `getUserFriendlyMessage()`