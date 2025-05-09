import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { syncManager } from '../lib/sync/syncManager';
import type { Job } from '../lib/supabase-types';
import { 
  shouldFetchData, 
  markFetchComplete, 
  markFetchFailed, 
  invalidateCache 
} from '../lib/utils/optimizedFetch';

interface JobState {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  fetchJobs: (forceRefresh?: boolean) => Promise<void>;
  addJob: (job: Omit<Job, 'id' | 'created_at'> | Omit<Job, 'id' | 'created_at'>[]) => Promise<Job[] | null>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
}

const STORE_KEY = 'jobs';

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  loading: false,
  error: null,

  fetchJobs: async (forceRefresh = false) => {
    // Check if we should actually fetch based on cache
    if (!shouldFetchData(STORE_KEY, forceRefresh)) {
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      // Try to load from IndexedDB first for instant loading if available
      const localData = await loadFromIndexedDB();
      if (localData.success) {
        // Update immediately with cached data
        set({ jobs: localData.data || [], loading: false });
      }
      
      // Continue with network fetch
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      
      // Save to IndexedDB for offline access
      if (data && data.length > 0) {
        saveToIndexedDB(data);
      }
      
      // Update the state
      set({ jobs: data || [], loading: false, error: null });
      
      // Mark fetch as complete
      markFetchComplete(STORE_KEY);
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      
      // Try to use IndexedDB data as fallback
      const localData = await loadFromIndexedDB();
      if (localData.success) {
        set({ 
          jobs: localData.data || [], 
          loading: false,
          error: 'Using cached job data. Some information may not be up to date.'
        });
      } else {
        set({ 
          jobs: [],
          loading: false, 
          error: 'Unable to load jobs. Please check your connection.'
        });
      }
      
      // Mark fetch as failed
      markFetchFailed(STORE_KEY);
    }
  },

  addJob: async (job) => {
    set({ loading: true, error: null });
    try {
      if (!navigator.onLine) {
        // Handle offline creation
        let tempJobs: Job[] = [];
        
        if (Array.isArray(job)) {
          tempJobs = job.map(j => ({
            ...j,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
          })) as Job[];
          
          // Queue jobs for sync when back online
          for (const j of tempJobs) {
            await syncManager.queueChange({
              type: 'jobs',
              operation: 'create',
              data: j
            });
          }
        } else {
          const tempJob = {
            ...job,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
          } as Job;
          
          tempJobs = [tempJob];
          
          await syncManager.queueChange({
            type: 'jobs',
            operation: 'create',
            data: tempJob
          });
        }
        
        // Update state
        set((state) => ({
          jobs: [...tempJobs, ...state.jobs],
          loading: false,
          error: null
        }));
        
        // Invalidate cache
        invalidateCache(STORE_KEY);
        
        return tempJobs;
      }
      
      // Handle online creation
      if (Array.isArray(job)) {
        const { data, error } = await supabase
          .from('jobs')
          .insert(job)
          .select();
          
        if (error) throw error;
        
        set((state) => ({
          jobs: [...(data || []), ...state.jobs],
          loading: false,
          error: null
        }));
        
        // Invalidate cache
        invalidateCache(STORE_KEY);
        
        return data || null;
      } else {
        const { data, error } = await supabase
          .from('jobs')
          .insert(job)
          .select()
          .single();
          
        if (error) throw error;
        
        set((state) => ({
          jobs: data ? [data, ...state.jobs] : state.jobs,
          loading: false,
          error: null
        }));
        
        // Invalidate cache
        invalidateCache(STORE_KEY);
        
        return data ? [data] : null;
      }
    } catch (error: any) {
      console.error('Failed to add job:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },

  updateJob: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      if (!navigator.onLine) {
        // Queue for sync when back online
        await syncManager.queueChange({
          type: 'jobs',
          operation: 'update',
          data: { id, ...updates }
        });
        
        // Update state immediately
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, ...updates } : job
          ),
          loading: false,
          error: null
        }));
        
        // Invalidate cache
        invalidateCache(STORE_KEY);
        
        return;
      }
      
      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id);
        
      if (error) throw error;
      
      set((state) => ({
        jobs: state.jobs.map((job) =>
          job.id === id ? { ...job, ...updates } : job
        ),
        loading: false,
        error: null
      }));
      
      // Invalidate cache
      invalidateCache(STORE_KEY);
    } catch (error: any) {
      console.error('Failed to update job:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  deleteJob: async (id) => {
    set({ loading: true, error: null });
    try {
      if (!navigator.onLine) {
        // Queue for sync when back online
        await syncManager.queueChange({
          type: 'jobs',
          operation: 'delete',
          data: { id }
        });
        
        // Update state immediately
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
          loading: false,
          error: null
        }));
        
        // Invalidate cache
        invalidateCache(STORE_KEY);
        
        return;
      }
      
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id),
        loading: false,
        error: null
      }));
      
      // Invalidate cache
      invalidateCache(STORE_KEY);
    } catch (error: any) {
      console.error('Failed to delete job:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  }
}));

// Helper function to save jobs to IndexedDB
async function saveToIndexedDB(jobs: Job[]): Promise<void> {
  try {
    const request = window.indexedDB.open('servflo-db', 3);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('jobs')) {
        db.createObjectStore('jobs', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = request.result;
      const tx = db.transaction('jobs', 'readwrite');
      const store = tx.objectStore('jobs');
      
      // Clear existing data
      store.clear();
      
      // Add all jobs
      jobs.forEach(job => {
        store.put({
          ...job,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString()
        });
      });
      
      tx.oncomplete = () => {
        db.close();
        console.log('Jobs saved to IndexedDB');
      };
      
      tx.onerror = (error) => {
        console.error('Error saving jobs to IndexedDB:', error);
        db.close();
      };
    };
    
    request.onerror = (error) => {
      console.error('Failed to open IndexedDB for jobs:', error);
    };
  } catch (error) {
    console.error('Exception during IndexedDB job save:', error);
  }
}

// Helper function to load jobs from IndexedDB
async function loadFromIndexedDB(): Promise<{ success: boolean, data: Job[] }> {
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open('servflo-db', 3);
      
      request.onsuccess = (event) => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('jobs')) {
          db.close();
          resolve({ success: false, data: [] });
          return;
        }
        
        try {
          const tx = db.transaction('jobs', 'readonly');
          const store = tx.objectStore('jobs');
          const getAll = store.getAll();
          
          getAll.onsuccess = () => {
            db.close();
            resolve({ success: true, data: getAll.result || [] });
          };
          
          getAll.onerror = () => {
            db.close();
            resolve({ success: false, data: [] });
          };
        } catch (error) {
          db.close();
          resolve({ success: false, data: [] });
        }
      };
      
      request.onerror = () => {
        resolve({ success: false, data: [] });
      };
    } catch (error) {
      resolve({ success: false, data: [] });
    }
  });
}