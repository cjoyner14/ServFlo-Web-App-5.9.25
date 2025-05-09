import React, { useState, useEffect, useRef } from 'react';
import { 
  UserPlus, Database,
  Loader2, Search, Users, Plus,
  Phone, MapPin, ChevronDown, ChevronUp,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { CustomerCard } from '../components/customers/CustomerCard';
import { CustomerDetailView } from '../components/customers/CustomerDetailView';
import { AddCustomerModal } from '../components/customers/AddCustomerModal';
import { CustomerEmptyState } from '../components/empty-states/CustomerEmptyState';
import { JobTabButton } from '../components/jobs/JobTabButton';
import { FilterToggle } from '../components/common/FilterToggle';
import { CollapsibleSection } from '../components/common/CollapsibleSection';
import { useCustomerStore } from '../store/customerStore';
import { useEstimateStore } from '../store/estimateStore';
import { useJobStore } from '../store/jobStore';
import { useInvoiceStore } from '../store/invoiceStore';

export const Customers = () => {
  const { customers, loading, error, fetchCustomers } = useCustomerStore();
  const { estimates } = useEstimateStore();
  const { jobs } = useJobStore();
  const { invoices } = useInvoiceStore();
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailView, setShowDetailView] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    sortBy: 'recent_added',
    serviceFlow: 'all',
  });

  // Remove pagination completely
  
  // Alphabetical navigation
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  // Ensure jobs data is loaded
  const { fetchJobs } = useJobStore();
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const getCustomerServiceFlow = (customerId: string) => {
    const serviceFlows: string[] = [];
    const needsEstimate = customers.find(c => c.id === customerId)?.needs_estimate;

    // Check if ALL jobs have associated invoices and ALL invoices are paid or void
    const customerJobs = jobs.filter(j => j.customer_id === customerId && !j.description.toLowerCase().includes('estimate visit'));
    const customerInvoices = invoices.filter(i => i.customer_id === customerId);

    // Every job has an invoice AND every invoice is paid or void
    const allJobsHaveInvoices = customerJobs.length > 0 &&
      customerJobs.every(job => customerInvoices.some(invoice => invoice.job_id === job.id));
    const allInvoicesPaid = customerInvoices.length > 0 &&
      customerInvoices.every(invoice => invoice.status === 'paid' || invoice.status === 'void');

    // If the customer has completed all service flow stages, they're inactive
    if (allJobsHaveInvoices && allInvoicesPaid && customerJobs.length > 0) {
      return 'none';
    }

    // Check if customer needs estimate
    if (needsEstimate) {
      serviceFlows.push('needs_estimate');
    }

    // Check for rejected estimates - if a customer has at least one estimate that's rejected
    // and no other estimates, they should be inactive
    const customerEstimates = estimates.filter(e => e.customer_id === customerId);
    const hasRejectedEstimateOnly = customerEstimates.length > 0 &&
      customerEstimates.every(est => est.status === 'rejected');

    if (hasRejectedEstimateOnly) {
      // Customer with only rejected estimates should be inactive
      return 'none';
    }

    // Check for pending payments
    const hasPendingPayment = invoices.some(i =>
      i.customer_id === customerId &&
      (i.status === 'draft' || i.status === 'overdue')
    );
    if (hasPendingPayment) {
      serviceFlows.push('pending_payment');
    }

    // Check for completed jobs needing invoice (excluding estimate visits)
    const hasCompletedJob = jobs.some(j =>
      j.customer_id === customerId &&
      j.status === 'completed' &&
      !j.description.toLowerCase().includes('estimate visit') &&
      !invoices.some(i => i.job_id === j.id)
    );
    if (hasCompletedJob) {
      serviceFlows.push('needs_invoice');
    }

    // Check for scheduled jobs (excluding estimate visits)
    const hasScheduledJob = jobs.some(j =>
      j.customer_id === customerId &&
      !j.description.toLowerCase().includes('estimate visit') &&
      (j.status === 'scheduled' || j.status === 'in_progress')
    );
    if (hasScheduledJob) {
      serviceFlows.push('job_scheduled');
    }

    // Check for approved estimates - they become unscheduled jobs
    const hasApprovedEstimate = estimates.some(e =>
      e.customer_id === customerId &&
      e.status === 'approved'
    );
    if (hasApprovedEstimate) {
      serviceFlows.push('needs_scheduling'); // Map to "Unscheduled Job" in UI
    }

    // Check for pending estimates
    const hasPendingEstimate = estimates.some(e =>
      e.customer_id === customerId &&
      e.status === 'pending'
    );
    if (hasPendingEstimate) {
      serviceFlows.push('pending_estimate');
    }

    // Check for scheduled estimate visits
    const hasScheduledEstimateVisit = jobs.some(j =>
      j.customer_id === customerId &&
      j.description.toLowerCase().includes('estimate visit') &&
      (j.status === 'scheduled' || j.status === 'in_progress')
    );
    if (hasScheduledEstimateVisit) {
      serviceFlows.push('estimate_scheduled'); // "Scheduled Estimate" in UI
    }

    // For filtering purposes, return the first service flow if any exist, or 'none' if empty
    return serviceFlows.length > 0 ? serviceFlows[0] : 'none';
  };

  const serviceFlowFilters = [
    { id: 'all', label: 'All Stages', color: 'gray' },
    { id: 'needs_estimate', label: 'Estimates Queue', color: '#008B37' },
    { id: 'estimate_scheduled', label: 'Scheduled Estimate', color: '#008B37' },
    { id: 'pending_estimate', label: 'Pending Estimate', color: '#008B37' },
    { id: 'needs_scheduling', label: 'Jobs Queue', color: '#D97706' },
    { id: 'job_scheduled', label: 'Job Scheduled', color: '#D97706' },
    { id: 'needs_invoice', label: 'Needs Invoice', color: '#475569' },
    { id: 'pending_payment', label: 'Pending Payment', color: '#475569' },
  ];

  const isCustomerActive = (customerId: string) => {
    const serviceFlow = getCustomerServiceFlow(customerId);
    return serviceFlow !== 'none';
  };

  // Helper function to get sortable name (display name or actual name)
  const getSortableName = (customer: any): string => {
    if (customer.type === 'commercial' && customer.business_name) {
      return customer.business_name.toLowerCase();
    }
    return (customer.name || '').toLowerCase();
  };
  
  // Get first letter of a customer's name
  const getFirstLetter = (customer: any): string => {
    const name = getSortableName(customer);
    return name.charAt(0).toUpperCase();
  };
  
  // Get all customers, filtered by everything EXCEPT the letter filter
  const customersBeforeLetterFilter = React.useMemo(() => {
    if (!Array.isArray(customers)) return [];
    
    return customers.filter(customer => {
      if (!customer || !customer.id) return false;
      
      const query = searchQuery?.toLowerCase() || '';
      const matchesSearch = !query || 
        (customer.name && customer.name.toLowerCase().includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.phone && customer.phone.includes(query)) ||
        (customer.address && customer.address.toLowerCase().includes(query)) ||
        (customer.business_name && customer.business_name.toLowerCase().includes(query));

      const matchesType = filters.type === 'all' || customer.type === filters.type;
      const isActive = isCustomerActive(customer.id);
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'active' && isActive);

      const serviceFlow = getCustomerServiceFlow(customer.id);
      const matchesServiceFlow = filters.serviceFlow === 'all' || serviceFlow === filters.serviceFlow;
      
      return matchesSearch && matchesType && matchesTab && matchesServiceFlow;
    });
  }, [customers, searchQuery, filters, activeTab, estimates, jobs, invoices]);
  
  // Get filtered customers (all filters applied, used for counts and display)
  // We're now using selectedLetter only for scrolling, not filtering
  const filteredCustomers = React.useMemo(() => {
    // No longer filter by letter - show all customers that match other criteria
    return customersBeforeLetterFilter;
  }, [customersBeforeLetterFilter]);
  
  // Group customers by first letter for sectioned display
  const groupedCustomers = React.useMemo(() => {
    // Use the filtered customers (with letter filter applied)
    const customersToGroup = filteredCustomers;
    
    // Create groups by first letter
    const groups: {[key: string]: any[]} = {};
    
    customersToGroup.forEach(customer => {
      if (!customer || !customer.id) return;
      
      const firstLetter = getFirstLetter(customer);
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      
      groups[firstLetter].push(customer);
    });
    
    // Sort each group by display name
    Object.keys(groups).forEach(letter => {
      groups[letter].sort((a, b) => getSortableName(a).localeCompare(getSortableName(b)));
    });
    
    return groups;
  }, [customersBeforeLetterFilter, selectedLetter]);
  
  // Get available letters from all customers (before letter filtering)
  const availableLetters = React.useMemo(() => {
    // Create a set of all first letters from all customers (before letter filtering)
    const letterSet = new Set(
      customersBeforeLetterFilter.map(customer => getFirstLetter(customer))
    );
    
    // Convert to array and sort alphabetically
    return Array.from(letterSet).sort();
  }, [customersBeforeLetterFilter]);
  
  // All possible alphabet letters for the sidebar, regardless of filtering
  const allLetters = React.useMemo(() => {
    // Create array of all alphabet letters A-Z
    return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  }, []);
  
  // Scroll to a letter section when selected
  const letterRefs = React.useRef<{[key: string]: HTMLDivElement | null}>({});
  
  // Scroll to selected letter section and update UI when a letter is selected
  useEffect(() => {
    if (selectedLetter) {
      // First check if the letter exists in our data
      if (letterRefs.current[selectedLetter]) {
        // Scroll to the letter section with smooth behavior for continuous feel
        letterRefs.current[selectedLetter]?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start' 
        });
      } else {
        // If this letter doesn't exist in our data, try to scroll to the closest available letter
        // Find all available letters
        const letters = Object.keys(letterRefs.current).filter(key => letterRefs.current[key]);
        
        if (letters.length > 0) {
          // Sort the letters alphabetically
          letters.sort();
          
          // Find the closest letter that exists in our data
          let closestLetter = letters[0];
          for (const letter of letters) {
            if (letter <= selectedLetter) {
              closestLetter = letter;
            } else {
              break;
            }
          }
          
          // Scroll to the closest letter
          letterRefs.current[closestLetter]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
      
      // Always show the letter indicator for better feedback
      setIndicatorLetter(selectedLetter);
      setShowLetterIndicator(true);
      
      // Hide the indicator after a delay
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }
      indicatorTimeoutRef.current = setTimeout(() => {
        setShowLetterIndicator(false);
      }, 1000);
    }
  }, [selectedLetter]);

  // Track scroll position for UI interactions 
  const [scrollY, setScrollY] = useState(0);
  // Track letter indicator state
  const [showLetterIndicator, setShowLetterIndicator] = useState(false);
  const [indicatorLetter, setIndicatorLetter] = useState('');
  const indicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track the currently touched letter (for continuous sliding)
  const lastTouchedLetterRef = useRef<string | null>(null);
  
  // Track whether we're currently in a sliding operation
  const isSlidingRef = useRef<boolean>(false);
  
  // Reference to the customer list container
  const customerListRef = useRef<HTMLDivElement>(null);

  // Update scroll position for floating elements
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Setup global touch end handler to ensure scrolling is re-enabled
  useEffect(() => {
    const handleTouchEnd = () => {
      // If we were sliding but a touch ended somewhere else (outside our controls),
      // make sure to reset the body styles and sliding state
      if (isSlidingRef.current) {
        isSlidingRef.current = false;
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        
        // Also reset any webkitUserSelect that might have been set
        document.body.style.webkitUserSelect = '';
        document.body.style.userSelect = '';
        
        // Reset any related styles on specific elements
        if (customerListRef.current) {
          customerListRef.current.style.pointerEvents = '';
          customerListRef.current.style.touchAction = '';
        }
      }
    };
    
    // Add a global touch end handler as a safety net
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }
      // Reset body styles when component unmounts to prevent issues
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.userSelect = '';
      
      // Remove the global touch end handler
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  // No need for currentItems variable since we use groupedCustomers now

  const tabCounts = {
    all: Array.isArray(customers) ? customers.length : 0,
    active: Array.isArray(customers) ? customers.filter(c => c && c.id && isCustomerActive(c.id)).length : 0,
  };

  const serviceFlowCounts = serviceFlowFilters.reduce((acc, filter) => ({
    ...acc,
    [filter.id]: filter.id === 'all' 
      ? (Array.isArray(customers) ? customers.length : 0)
      : (Array.isArray(customers) ? customers.filter(c => c && c.id && getCustomerServiceFlow(c.id) === filter.id).length : 0)
  }), {} as Record<string, number>);

  if (error && !loading) {
    // Don't show this error if we're still loading
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Database className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-600 text-center max-w-md mb-4">
          {error}
        </p>
        <button 
          onClick={() => fetchCustomers()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const renderContent = () => {
    if (loading) {
      return <CustomerEmptyState onAddCustomer={() => setShowAddModal(true)} isLoading={true} />;
    }

    // Don't immediately show empty state when offline - might be still loading from IndexedDB
  if ((!Array.isArray(customers) || customers.length === 0) && !loading) {
    // Check if we're offline
    const isOffline = !navigator.onLine;
    const hasOfflineError = error?.includes('offline') || error?.includes('Unable to find');
    
    // If we're offline, show a specialized offline empty state
    if (isOffline || hasOfflineError) {
      return (
        <CustomerEmptyState 
          onAddCustomer={() => setShowAddModal(true)} 
          isOffline={true}
          onRetry={() => fetchCustomers()}
        />
      );
    }
    
    // Regular "no customers yet" state
    return <CustomerEmptyState onAddCustomer={() => setShowAddModal(true)} />;
  }

    if (filteredCustomers.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Search className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
            <p className="text-sm text-gray-600 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  type: 'all',
                  sortBy: 'recent_added',
                  serviceFlow: 'all',
                });
              }}
              className="text-sm text-primary hover:text-primary/80"
            >
              Clear all filters
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {/* Alphabet slider - fixed position with touch/slide functionality */}
        <div 
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-l-lg px-1 py-3 shadow-lg border-l border-t border-b border-gray-200 z-50 flex flex-col items-center touch-manipulation"
          onTouchStart={(e) => {
            e.preventDefault(); // Prevent default touch behavior
            e.stopPropagation(); // Prevent event propagation to parent elements
            
            // Mark that we're starting a sliding operation
            isSlidingRef.current = true;
            
            // Temporarily disable body scrolling while using the alphabet slider
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            
            // Prevent text selection during the sliding operation
            document.body.style.webkitUserSelect = 'none';
            document.body.style.userSelect = 'none';
            
            // Disable pointer events on the customer list during sliding
            if (customerListRef.current) {
              customerListRef.current.style.pointerEvents = 'none';
            }
          }}
          onTouchMove={(e) => {
            e.preventDefault(); // Prevent scrolling while touching the alphabet
            e.stopPropagation(); // Stop propagation to prevent pull-to-refresh
            
            // Get the touch point
            const touch = e.touches[0];
            // Get the alphabet container
            const alphabetContainer = e.currentTarget;
            const containerRect = alphabetContainer.getBoundingClientRect();
            
            // Calculate which letter is being touched based on Y position
            const relativeY = touch.clientY - containerRect.top;
            const letterHeight = containerRect.height / allLetters.length;
            const letterIndex = Math.floor(relativeY / letterHeight);
            
            // Select the letter if it's valid
            if (letterIndex >= 0 && letterIndex < allLetters.length) {
              const letter = allLetters[letterIndex];
              
              // Improve continuous scrolling by not filtering by available letters
              // This allows the user to smoothly scroll through all letters
              
              // Check if we've moved to a new letter to avoid jittery updates
              if (letter !== lastTouchedLetterRef.current) {
                // Update our reference of the last letter we touched
                lastTouchedLetterRef.current = letter;
                
                // Visual feedback
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                
                // Set the active letter for scrolling immediately - this will trigger the useEffect
                setSelectedLetter(letter);
                
                // Show indicator for visual feedback even for letters without customers
                setIndicatorLetter(letter);
                setShowLetterIndicator(true);
              }
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault(); // Prevent default behavior
            e.stopPropagation(); // Prevent propagation
            
            // Reset visual feedback
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.boxShadow = '';
            
            // Reset the last touched letter reference
            lastTouchedLetterRef.current = null;
            
            // Mark that we're done sliding
            isSlidingRef.current = false;
            
            // Hide letter indicator after a short delay (in case it's still showing)
            setTimeout(() => {
              setShowLetterIndicator(false);
            }, 300);
            
            // Important: Reset all touch handling to allow normal scrolling
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.body.style.webkitUserSelect = '';
            document.body.style.userSelect = '';
            
            // Re-enable pointer events on the customer list
            if (customerListRef.current) {
              customerListRef.current.style.pointerEvents = '';
              customerListRef.current.style.touchAction = '';
            }
            
            // Force an immediate small scroll to "unstick" the page on iOS
            window.scrollBy(0, 1);
            setTimeout(() => window.scrollBy(0, -1), 10);
          }}
        >
          {/* Show all available letters as a vertical slider */}
          <div 
            className="max-h-[60vh] overflow-y-auto py-1 scrollbar-hide flex flex-col items-center"
          >
            {allLetters.map(letter => {
              const isAvailable = availableLetters.includes(letter);
              
              return (
                <button
                  key={letter}
                  onTouchStart={(e) => {
                    // Prevent default and stop propagation for the buttons too
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Only do something with this touch if we're not already sliding
                    if (!isSlidingRef.current && isAvailable) {
                      // Set the selected letter immediately
                      setSelectedLetter(letter);
                      lastTouchedLetterRef.current = letter;
                    }
                  }}
                  onClick={() => {
                    // Allow clicking any letter for better continuous navigation
                    // Always set the selected letter, allowing clicking the same letter multiple times
                    setSelectedLetter(letter);
                    
                    // Show the letter indicator for visual feedback
                    setIndicatorLetter(letter);
                    setShowLetterIndicator(true);
                    
                    // Track which letter was last touched
                    lastTouchedLetterRef.current = letter;
                    
                    // Make sure we're not blocking normal scrolling
                    document.body.style.overflow = '';
                    document.body.style.touchAction = '';
                    isSlidingRef.current = false;
                    
                    // Hide the indicator after a delay
                    if (indicatorTimeoutRef.current) {
                      clearTimeout(indicatorTimeoutRef.current);
                    }
                    indicatorTimeoutRef.current = setTimeout(() => {
                      setShowLetterIndicator(false);
                    }, 1000);
                  }}
                  className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center my-0.5 rounded-full text-[9px] sm:text-xs
                    ${letter === selectedLetter 
                      ? 'bg-[#3A6EA5] text-white font-medium' 
                      : isAvailable
                        ? 'hover:bg-gray-200 transition-colors'
                        : 'text-gray-300 hover:bg-gray-100 transition-colors'}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
          
          {/* Show message when no letters available */}
          {availableLetters.length === 0 && <div className="text-gray-400 text-[10px] sm:text-xs py-2">No data</div>}
        </div>
        
        {/* Letter indicator overlay - shows in the center of screen when dragging */}
        {showLetterIndicator && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="bg-[#3A6EA5]/90 text-white font-bold text-5xl rounded-xl w-20 h-20 flex items-center justify-center shadow-lg animate-pulse">
              {indicatorLetter}
            </div>
          </div>
        )}
      
        <div 
          className="bg-white rounded-lg shadow-md overflow-hidden" 
          ref={customerListRef}
          onClick={() => {
            // Reset any stuck touch events when clicking on the customer list
            if (isSlidingRef.current) {
              isSlidingRef.current = false;
              document.body.style.overflow = '';
              document.body.style.touchAction = '';
              document.body.style.webkitUserSelect = '';
              document.body.style.userSelect = '';
            }
          }}
        >
          {/* Header with actions */}
          <div className="p-2 border-b border-gray-200 flex justify-between items-center">
            <div className="text-xs text-gray-600">
              {activeTab === 'active' && `Showing ${filteredCustomers.length} active customers`}
              {activeTab === 'all' && `Showing all ${filteredCustomers.length} customers`}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="divide-y divide-gray-200">
              {/* Render customers grouped by first letter */}
              {availableLetters.map(letter => (
                <div key={letter} className="group">
                  {/* Letter section header - sticky */}
                  <div 
                    ref={el => letterRefs.current[letter] = el}
                    className="sticky top-0 z-10 bg-blue-900/10 px-3 py-1.5 font-semibold text-sm text-blue-900 uppercase border-b border-blue-900/20"
                    id={`section-${letter}`}
                  >
                    {letter}
                  </div>
                  
                  {/* Customers in this letter group */}
                  <table className="w-full table-fixed md:table-auto">
                    <tbody className="divide-y divide-gray-100">
                      {groupedCustomers[letter].map(customer => {
                        if (!customer || !customer.id) return null;
                        
                        // Get all customer stages
                        const stages = (() => {
                          try {
                            const stageItems = [];

                            // Check if customer needs estimate
                            if (customer.needs_estimate) {
                              stageItems.push({
                                label: 'Estimates Queue',
                                color: 'text-[#008B37] bg-[#E6F4EA]'
                              });
                            }

                            // Check for scheduled estimate visits
                            const hasScheduledEstimate = jobs.some(j =>
                              j.customer_id === customer.id &&
                              j.description.toLowerCase().includes('estimate visit') &&
                              (j.status === 'scheduled' || j.status === 'in_progress')
                            );

                            if (hasScheduledEstimate) {
                              stageItems.push({
                                label: 'Scheduled Estimate',
                                color: 'text-[#008B37] bg-[#E6F4EA]'
                              });
                            }

                            // Check for pending estimates
                            const hasPendingEstimate = estimates.some(e =>
                              e.customer_id === customer.id &&
                              e.status === 'pending'
                            );

                            if (hasPendingEstimate) {
                              stageItems.push({
                                label: 'Pending Estimate',
                                color: 'text-[#008B37] bg-[#E6F4EA]'
                              });
                            }

                            // Check for approved estimates
                            const hasApprovedEstimate = estimates.some(e =>
                              e.customer_id === customer.id &&
                              e.status === 'approved'
                            );

                            if (hasApprovedEstimate) {
                              stageItems.push({
                                label: 'Unscheduled Job',
                                color: 'text-[#f57c00] bg-orange-100'
                              });
                            }

                            // Check for scheduled jobs
                            const hasScheduledJob = jobs.some(j =>
                              j.customer_id === customer.id &&
                              !j.description.toLowerCase().includes('estimate visit') &&
                              (j.status === 'scheduled' || j.status === 'in_progress')
                            );

                            if (hasScheduledJob) {
                              stageItems.push({
                                label: 'Job Scheduled',
                                color: 'text-[#f57c00] bg-orange-100'
                              });
                            }

                            // Check for completed jobs needing invoices
                            const hasCompletedJob = jobs.some(j =>
                              j.customer_id === customer.id &&
                              j.status === 'completed' &&
                              !j.description.toLowerCase().includes('estimate visit') &&
                              !invoices.some(i => i.job_id === j.id)
                            );

                            if (hasCompletedJob) {
                              stageItems.push({
                                label: 'Needs Invoice',
                                color: 'text-[#475569] bg-gray-100'
                              });
                            }

                            // Check for invoices pending payment
                            const hasPendingPayment = invoices.some(i =>
                              i.customer_id === customer.id &&
                              (i.status === 'draft' || i.status === 'overdue')
                            );

                            if (hasPendingPayment) {
                              stageItems.push({
                                label: 'Pending Payment',
                                color: 'text-[#475569] bg-gray-100'
                              });
                            }

                            return stageItems;
                          } catch (error) {
                            console.error('Error determining customer stages:', error);
                            return [];
                          }
                        })();

                        // Format address to exclude zipcode and country
                        const formatAddress = (address: string) => {
                          if (!address) return "No address";
                          try {
                            // Simple approach - take just the first part of the address
                            return address.split(',').slice(0, 2).join(',');
                          } catch (error) {
                            return "Address error";
                          }
                        };

                        const displayName = customer.type === 'commercial' && customer.business_name
                          ? customer.business_name
                          : customer.name;

                        return (
                          <tr
                            key={customer.id}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setShowDetailView(customer.id)}
                          >
                            <td className="px-3 sm:px-4 py-3 sm:py-4 w-[70%] md:w-auto">
                              <div>
                                <div className="font-medium text-gray-900 text-sm sm:text-base md:text-lg truncate pr-1">{displayName}</div>
                                {stages.length > 0 && (
                                  <div className="mt-2">
                                    {/* Group stages by category */}
                                    {(() => {
                                      // Group by color for visual organization
                                      const estimateStages = stages.filter(s => s.color === 'text-[#008B37] bg-[#E6F4EA]');
                                      const jobStages = stages.filter(s => s.color === 'text-[#f57c00] bg-orange-100');
                                      const invoiceStages = stages.filter(s => s.color === 'text-[#475569] bg-gray-100');

                                      // Determine primary stage by priority (estimate > job > invoice)
                                      let primaryStage;
                                      if (estimateStages.length > 0) primaryStage = estimateStages[0];
                                      else if (jobStages.length > 0) primaryStage = jobStages[0];
                                      else if (invoiceStages.length > 0) primaryStage = invoiceStages[0];
                                      else primaryStage = stages[0];

                                      return (
                                        <>
                                          {/* Primary stage */}
                                          <span
                                            className={`inline-flex items-center rounded-full px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-medium ${primaryStage.color}`}
                                          >
                                            {primaryStage.label}
                                          </span>

                                          {/* Show category counts if multiple stages */}
                                          {stages.length > 1 && (
                                            <div className="inline-flex ml-1.5">
                                              {estimateStages.length > 0 && estimateStages[0] !== primaryStage && (
                                                <span className="inline-flex items-center justify-center rounded-full bg-[#E6F4EA] text-[#008B37] w-5 h-5 text-xs font-medium">
                                                  {estimateStages.length}
                                                </span>
                                              )}

                                              {jobStages.length > 0 && jobStages[0] !== primaryStage && (
                                                <span className="inline-flex items-center justify-center rounded-full bg-orange-100 text-[#f57c00] w-5 h-5 text-xs font-medium ml-0.5">
                                                  {jobStages.length}
                                                </span>
                                              )}

                                              {invoiceStages.length > 0 && invoiceStages[0] !== primaryStage && (
                                                <span className="inline-flex items-center justify-center rounded-full bg-gray-100 text-[#475569] w-5 h-5 text-xs font-medium ml-0.5">
                                                  {invoiceStages.length}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-4 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-700">{formatAddress(customer.address)}</td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4 text-right w-[30%] md:w-auto" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`tel:${customer.phone}`}
                                  className="p-2 text-blue-900/70 hover:text-blue-900 hover:bg-blue-900/10 rounded-full transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Call customer"
                                >
                                  <Phone className="w-5 h-5" />
                                </a>
                                <button
                                  type="button"
                                  className="p-2 text-blue-900/70 hover:text-blue-900 hover:bg-blue-900/10 rounded-full transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    
                                    try {
                                      // For iOS specifically, use Apple Maps format
                                      const address = encodeURIComponent(customer.address || '');
                                      const iOSUrl = `https://maps.apple.com/?q=${address}&dirflg=d`;
                                      const androidUrl = `geo:0,0?q=${address}`;
                                      const desktopUrl = `https://maps.google.com/maps?q=${address}`;
                                      
                                      // Simple mobile detection
                                      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                                      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                                      
                                      if (isIOS) {
                                        window.location.href = iOSUrl;
                                      } else if (isMobile) {
                                        window.location.href = androidUrl;
                                      } else {
                                        window.open(desktopUrl, '_blank');
                                      }
                                    } catch (error) {
                                      console.error('Error opening maps:', error);
                                    }
                                  }}
                                  aria-label="Get directions"
                                >
                                  <MapPin className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
              
              {/* Show empty state when no customers */}
              {availableLetters.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  No customers found matching your criteria
                </div>
              )}
            </div>
          
          {/* Footer */}
          <div className="p-2 border-t border-gray-200 flex justify-center items-center">
            <div className="text-xs text-gray-400">
              {filteredCustomers.length === 0 ? 'No customers match your criteria' : 
               filteredCustomers.length === 1 ? 
                 activeTab === 'active' ? '1 active customer found' :
                 '1 customer found' 
               : 
               activeTab === 'active' ? `${filteredCustomers.length} active customers found` :
               `${filteredCustomers.length} customers found`}
            </div>
          </div>
          </div>
        </div>
          
        {/* Fixed "back to top" button in bottom corner - only shows when scrolled down */}
        {/* This button is positioned outside other containers for optimal visibility */}
        
      </div>
    );
  };

  // Back to top button has been removed

  return (
    <>
      
      <div className="max-w-7xl mx-auto pb-20 px-1 pr-5 sm:px-4 relative">
      
      {/* Header with controls - now simplified */}
      <div className="mt-2 mb-4"></div>

      {/* Tab navigation with search bar and action buttons */}
      <div className="flex flex-col sm:flex-row items-center rounded-lg overflow-hidden shadow-sm mb-4 w-full border border-[#3A6EA5]/20 bg-white">
        <div className="flex w-full sm:w-auto sm:border-r border-[#3A6EA5]/20">
          <button 
            className={`py-2 px-3 sm:px-4 flex-1 sm:flex-initial flex items-center justify-center transition-colors ${
              activeTab === 'active' 
                ? 'bg-[#3A6EA5]/20 text-[#3A6EA5] font-medium' 
                : 'bg-white text-gray-700 hover:bg-[#3A6EA5]/5'
            } ${activeTab === 'active' ? 'border-b-2 sm:border-b-0 border-[#3A6EA5]' : 'border-b border-[#3A6EA5]/20 sm:border-b-0'}`}
            onClick={() => setActiveTab('active')}
          >
            <span>Active</span>
            <span className="ml-1.5 bg-[#3A6EA5]/30 text-[#3A6EA5] rounded-full min-w-[22px] h-6 inline-flex items-center justify-center px-1.5 text-xs font-medium shadow-sm">
              {tabCounts.active}
            </span>
          </button>
          <button 
            className={`py-2 px-3 sm:px-4 flex-1 sm:flex-initial flex items-center justify-center transition-colors 
              border-l border-[#3A6EA5]/20 
              ${activeTab === 'all' 
                ? 'bg-[#3A6EA5]/20 text-[#3A6EA5] font-medium' 
                : 'bg-white text-gray-700 hover:bg-[#3A6EA5]/5'
              } ${activeTab === 'all' ? 'border-b-2 sm:border-b-0 border-[#3A6EA5]' : 'border-b border-[#3A6EA5]/20 sm:border-b-0'}`}
            onClick={() => setActiveTab('all')}
          >
            <span className="whitespace-nowrap">All</span>
            <span className="ml-1.5 bg-[#3A6EA5]/30 text-[#3A6EA5] rounded-full min-w-[22px] h-6 inline-flex items-center justify-center px-1.5 text-xs font-medium shadow-sm">
              {tabCounts.all}
            </span>
          </button>
        </div>
        
        <div className="flex-1 px-3 py-2 sm:py-0 flex items-center justify-between sm:justify-end w-full">
          {/* Search Input - Always visible */}
          <div className="flex-1 max-w-md relative mx-1 sm:mx-2">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery === null ? '' : searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-gray-300 py-1.5 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3A6EA5]/30 focus:border-[#3A6EA5]/30 text-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && searchQuery.length > 0 && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex">
            {/* Filter Button - Circular */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 ${showFilters ? 'bg-[#3A6EA5]/20' : 'bg-[#3A6EA5]/10'} rounded-full hover:bg-[#3A6EA5]/20 transition-colors text-[#3A6EA5] shadow-sm flex-shrink-0 border border-[#3A6EA5]/20 mr-1`}
              aria-label="Filter customers"
            >
              <FilterToggle 
                showFilters={showFilters} 
                onToggle={() => {}} 
                color="#3A6EA5"
                noBackground={true}
              />
            </button>
            
            {/* Add Button - Circular */}
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1.5 bg-[#3A6EA5]/10 rounded-full hover:bg-[#3A6EA5]/20 transition-colors text-[#3A6EA5] shadow-sm flex-shrink-0 border border-[#3A6EA5]/20"
              aria-label="Add new customer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters section */}
      <CollapsibleSection show={showFilters}>
        <div className="bg-white rounded-lg shadow-sm mb-4 p-3">
          <div className="space-y-3">
            
            {/* Basic Filter Tabs - In a row for compact mobile display */}
            <div className="flex flex-col gap-2">
              {/* Customer Type Filter - More compact segmented control */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Customer Type</label>
                <div className="flex rounded-md overflow-hidden border border-[#3A6EA5]/20 shadow-sm text-xs">
                  <button
                    onClick={() => setFilters({ ...filters, type: 'all' })}
                    className={`flex-1 py-1.5 px-2 transition-colors ${
                      filters.type === 'all' 
                        ? 'bg-[#3A6EA5]/20 text-[#3A6EA5] font-medium' 
                        : 'bg-white text-gray-700 hover:bg-[#3A6EA5]/5'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, type: 'residential' })}
                    className={`flex-1 py-1.5 px-2 transition-colors ${
                      filters.type === 'residential' 
                        ? 'bg-[#3A6EA5]/20 text-[#3A6EA5] font-medium' 
                        : 'bg-white text-gray-700 hover:bg-[#3A6EA5]/5'
                    }`}
                  >
                    Residential
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, type: 'commercial' })}
                    className={`flex-1 py-1.5 px-2 transition-colors ${
                      filters.type === 'commercial' 
                        ? 'bg-[#3A6EA5]/20 text-[#3A6EA5] font-medium' 
                        : 'bg-white text-gray-700 hover:bg-[#3A6EA5]/5'
                    }`}
                  >
                    Commercial
                  </button>
                </div>
              </div>

              {/* Sort Filter - More compact for mobile */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <div className="flex rounded-md overflow-hidden border border-[#3A6EA5]/20 shadow-sm text-xs">
                  <button
                    onClick={() => setFilters({ ...filters, sortBy: 'recent_added' })}
                    className={`flex-1 py-1.5 px-2 transition-colors ${
                      filters.sortBy === 'recent_added' 
                        ? 'bg-[#3A6EA5]/20 text-[#3A6EA5] font-medium' 
                        : 'bg-white text-gray-700 hover:bg-[#3A6EA5]/5'
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, sortBy: 'first' })}
                    className={`flex-1 py-1.5 px-2 transition-colors ${
                      filters.sortBy === 'first' 
                        ? 'bg-[#3A6EA5]/20 text-[#3A6EA5] font-medium' 
                        : 'bg-white text-gray-700 hover:bg-[#3A6EA5]/5'
                    }`}
                  >
                    First
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, sortBy: 'last' })}
                    className={`flex-1 py-1.5 px-2 transition-colors ${
                      filters.sortBy === 'last' 
                        ? 'bg-[#3A6EA5]/20 text-[#3A6EA5] font-medium' 
                        : 'bg-white text-gray-700 hover:bg-[#3A6EA5]/5'
                    }`}
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>

            {/* Service Flow Stages - Accordion style for mobile */}
            <div>
              {/* Category selector for service flow - More compact for mobile */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Service Flow</label>
                <div className="grid grid-cols-3 rounded-md overflow-hidden border border-[#3A6EA5]/20 shadow-sm text-xs">
                  <button
                    onClick={() => setFilters({ ...filters, serviceFlow: 'all' })}
                    className={`py-1.5 px-1 transition-colors ${
                      filters.serviceFlow === 'all' || 
                      !(['needs_estimate', 'estimate_scheduled', 'pending_estimate', 'needs_scheduling', 'job_scheduled', 'needs_invoice', 'pending_payment'].includes(filters.serviceFlow))
                        ? 'bg-[#3A6EA5]/20 text-[#3A6EA5] font-medium' 
                        : 'bg-white text-gray-700 hover:bg-[#3A6EA5]/5'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, serviceFlow: 'needs_estimate' })}
                    className={`py-1.5 px-1 transition-colors ${
                      ['needs_estimate', 'estimate_scheduled', 'pending_estimate'].includes(filters.serviceFlow)
                        ? 'bg-[#0A7E3D]/20 text-[#0A7E3D] font-medium' 
                        : 'bg-white text-gray-700 hover:bg-[#0A7E3D]/5'
                    }`}
                  >
                    Estimates
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, serviceFlow: 'needs_scheduling' })}
                    className={`py-1.5 px-1 transition-colors ${
                      ['needs_scheduling', 'job_scheduled'].includes(filters.serviceFlow)
                        ? 'bg-[#D97706]/20 text-[#D97706] font-medium' 
                        : 'bg-white text-gray-700 hover:bg-[#D97706]/5'
                    }`}
                  >
                    Jobs
                  </button>
                </div>
                
                {/* Show selected service flow group */}
                {['needs_estimate', 'estimate_scheduled', 'pending_estimate'].includes(filters.serviceFlow) && (
                  <div className="bg-[#E6F4EA] p-2 text-xs">
                    <div className="grid grid-cols-1 gap-1">
                      {serviceFlowFilters
                        .filter(f => ['needs_estimate', 'estimate_scheduled', 'pending_estimate'].includes(f.id))
                        .map(filter => (
                          <button
                            key={filter.id}
                            onClick={() => setFilters({ ...filters, serviceFlow: filter.id })}
                            className={`px-2 py-1.5 rounded-md text-left flex items-center justify-between ${
                              filters.serviceFlow === filter.id
                                ? 'bg-white text-[#008B37] font-medium'
                                : 'bg-transparent text-[#008B37]/80'
                            }`}
                          >
                            <span>{filter.label}</span>
                            {serviceFlowCounts[filter.id] > 0 && (
                              <span className="ml-1 px-1 py-0.5 rounded-full text-xs bg-[#008B37] text-white min-w-[16px] text-center">
                                {serviceFlowCounts[filter.id]}
                              </span>
                            )}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {['needs_scheduling', 'job_scheduled'].includes(filters.serviceFlow) && (
                  <div className="bg-orange-100 p-2 text-xs">
                    <div className="grid grid-cols-1 gap-1">
                      {serviceFlowFilters
                        .filter(f => ['needs_scheduling', 'job_scheduled'].includes(f.id))
                        .map(filter => (
                          <button
                            key={filter.id}
                            onClick={() => setFilters({ ...filters, serviceFlow: filter.id })}
                            className={`px-2 py-1.5 rounded-md text-left flex items-center justify-between ${
                              filters.serviceFlow === filter.id
                                ? 'bg-white text-[#f57c00] font-medium'
                                : 'bg-transparent text-[#f57c00]/80'
                            }`}
                          >
                            <span>{filter.label}</span>
                            {serviceFlowCounts[filter.id] > 0 && (
                              <span className="ml-1 px-1 py-0.5 rounded-full text-xs bg-[#f57c00] text-white min-w-[16px] text-center">
                                {serviceFlowCounts[filter.id]}
                              </span>
                            )}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters Pills - More compact for mobile */}
            {(filters.type !== 'all' || 
              filters.sortBy !== 'recent_added' || 
              filters.serviceFlow !== 'all' ||
              searchQuery) && (
              <div className="pt-2 mt-1 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {filters.type !== 'all' && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                      {filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
                      <button
                        onClick={() => setFilters({ ...filters, type: 'all' })}
                        className="ml-1 text-blue-800 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.sortBy !== 'recent_added' && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                      Sort: {filters.sortBy === 'first' ? 'First' : 'Last'}
                      <button
                        onClick={() => setFilters({ ...filters, sortBy: 'recent_added' })}
                        className="ml-1 text-blue-800 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.serviceFlow !== 'all' && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: ['needs_estimate', 'estimate_scheduled', 'pending_estimate'].includes(filters.serviceFlow) 
                          ? '#E6F4EA' 
                          : ['needs_scheduling', 'job_scheduled'].includes(filters.serviceFlow)
                            ? 'rgba(245, 124, 0, 0.1)'
                            : 'rgba(71, 85, 105, 0.1)',
                        color: ['needs_estimate', 'estimate_scheduled', 'pending_estimate'].includes(filters.serviceFlow)
                          ? '#008B37'
                          : ['needs_scheduling', 'job_scheduled'].includes(filters.serviceFlow)
                            ? '#f57c00'
                            : '#475569'
                      }}
                    >
                      {serviceFlowFilters.find(f => f.id === filters.serviceFlow)?.label}
                      <button
                        onClick={() => setFilters({ ...filters, serviceFlow: 'all' })}
                        className="ml-1"
                        style={{
                          color: ['needs_estimate', 'estimate_scheduled', 'pending_estimate'].includes(filters.serviceFlow)
                            ? '#008B37'
                            : ['needs_scheduling', 'job_scheduled'].includes(filters.serviceFlow)
                              ? '#f57c00'
                              : '#475569'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                      "{searchQuery.length > 10 ? searchQuery.substring(0, 10) + '...' : searchQuery}"
                      <button
                        onClick={() => setSearchQuery('')}
                        className="ml-1 text-blue-800 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Content */}
      <div 
        className="mt-4"
        onClick={() => {
          // Reset any stuck touch events when clicking anywhere in the content area
          if (isSlidingRef.current) {
            isSlidingRef.current = false;
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.body.style.webkitUserSelect = '';
            document.body.style.userSelect = '';
            
            // Ensure we can scroll again by triggering a tiny scroll
            window.scrollBy(0, 1);
            setTimeout(() => window.scrollBy(0, -1), 10);
          }
        }}
      >
        {renderContent()}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal onClose={() => setShowAddModal(false)} />
      )}

      {/* Customer Detail Modal */}
      {showDetailView && Array.isArray(customers) && (
        <CustomerDetailView 
          customer={customers.find(c => c && c.id === showDetailView)!} 
          onClose={() => setShowDetailView(null)} 
        />
      )}
    </div>
    </>
  );
};

export default Customers;