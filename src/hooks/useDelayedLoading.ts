import { useState, useEffect } from 'react';

/**
 * Hook to prevent loading flicker for fast operations by delaying the show/hide of loading indicators.
 * This improves UX by only showing loading indicators for operations that take longer than the threshold.
 * 
 * @param isLoading The actual loading state from the store or operation
 * @param showDelay Delay in ms before showing the loading indicator (default: 300ms)
 * @param hideDelay Delay in ms before hiding the loading indicator (default: 100ms)
 * @returns The delayed loading state to use for UI
 */
export function useDelayedLoading(
  isLoading: boolean,
  showDelay = 300,
  hideDelay = 100
): boolean {
  const [delayedLoading, setDelayedLoading] = useState(false);
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isLoading) {
      // Set a timer before showing loading state to prevent flicker
      timer = setTimeout(() => {
        setDelayedLoading(true);
      }, showDelay);
      
      return () => clearTimeout(timer);
    } else if (delayedLoading) {
      // Add a small delay before hiding the loading indicator 
      // This helps prevent abrupt UI changes
      timer = setTimeout(() => {
        setDelayedLoading(false);
      }, hideDelay);
      
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [isLoading, delayedLoading, showDelay, hideDelay]);
  
  return delayedLoading;
}

/**
 * Hook to provide a loading indicator that only shows for operations
 * taking longer than a threshold, and ensures minimum display duration.
 * 
 * @param isLoading The actual loading state from the store or operation
 * @param minDisplayTime Minimum time (ms) to show the loading indicator
 * @param delay Delay (ms) before showing the loading indicator
 * @returns The processed loading state to use for UI
 */
export function useSmoothLoading(
  isLoading: boolean,
  minDisplayTime = 500,
  delay = 300
): boolean {
  const [smoothLoading, setSmoothLoading] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  
  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    
    if (isLoading && !smoothLoading) {
      // Delay showing the loading indicator
      showTimer = setTimeout(() => {
        setSmoothLoading(true);
        setLoadingStartTime(Date.now());
      }, delay);
      
      return () => clearTimeout(showTimer);
    } 
    
    if (!isLoading && smoothLoading && loadingStartTime) {
      // Calculate how long the loading indicator has been shown
      const elapsedTime = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      
      // Ensure the loading indicator is shown for at least minDisplayTime
      hideTimer = setTimeout(() => {
        setSmoothLoading(false);
        setLoadingStartTime(null);
      }, remainingTime);
      
      return () => clearTimeout(hideTimer);
    }
    
    return undefined;
  }, [isLoading, smoothLoading, loadingStartTime, minDisplayTime, delay]);
  
  return smoothLoading;
}