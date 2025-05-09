/**
 * Utility functions for optimizing data fetching across the application
 * These functions help prevent redundant API calls and manage caching
 */

// Cache to store last fetch times for different data types
interface FetchCache {
  [key: string]: {
    timestamp: number;
    inProgress: boolean;
  };
}

// Cache expiry time in milliseconds (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Singleton cache object
const fetchCache: FetchCache = {};

/**
 * Determines if data should be fetched based on last fetch time
 * @param dataType The type of data being fetched (e.g., 'customers', 'jobs')
 * @param forceRefresh Whether to force a refresh regardless of cache
 * @returns Boolean indicating if fetch should proceed
 */
export const shouldFetchData = (dataType: string, forceRefresh = false): boolean => {
  const now = Date.now();
  
  // Always fetch if forced refresh
  if (forceRefresh) {
    // Mark fetch as in progress
    fetchCache[dataType] = { timestamp: now, inProgress: true };
    return true;
  }
  
  // Check if we have a cache entry
  const cacheEntry = fetchCache[dataType];
  
  // If fetch is in progress, don't start another one
  if (cacheEntry?.inProgress) {
    return false;
  }
  
  // If no cache entry or cache is expired, fetch data
  if (!cacheEntry || now - cacheEntry.timestamp > CACHE_EXPIRY) {
    // Mark fetch as in progress
    fetchCache[dataType] = { timestamp: now, inProgress: true };
    return true;
  }
  
  // Cache is valid, no need to fetch
  return false;
};

/**
 * Marks a fetch operation as complete and updates the cache timestamp
 * @param dataType The type of data that was fetched
 */
export const markFetchComplete = (dataType: string): void => {
  const now = Date.now();
  fetchCache[dataType] = { timestamp: now, inProgress: false };
};

/**
 * Marks a fetch operation as failed
 * @param dataType The type of data fetch that failed
 */
export const markFetchFailed = (dataType: string): void => {
  // Keep the previous timestamp but mark as not in progress
  const previousTimestamp = fetchCache[dataType]?.timestamp || 0;
  fetchCache[dataType] = { timestamp: previousTimestamp, inProgress: false };
};

/**
 * Invalidates the cache for a specific data type
 * This should be called when data is changed (create, update, delete)
 * @param dataType The type of data to invalidate
 */
export const invalidateCache = (dataType: string): void => {
  if (fetchCache[dataType]) {
    delete fetchCache[dataType];
  }
};

/**
 * Invalidates all caches
 * This can be used when user logs out or when major data refresh is needed
 */
export const invalidateAllCaches = (): void => {
  Object.keys(fetchCache).forEach(key => {
    delete fetchCache[key];
  });
};