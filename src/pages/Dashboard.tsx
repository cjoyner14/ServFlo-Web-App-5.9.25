import React, { useState, useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { QuickActionsRow } from '../components/dashboard/QuickActionsRow';
// Import the ServiceFlow component that DIRECTLY mirrors Jobs page service flow stages 
import { ServiceFlow } from '../components/dashboard/direct-mirror/ServiceFlow';
// Import the new ServiceFlowMetrics components
import { ServiceFlowMetrics } from '../components/dashboard/ServiceFlowMetrics';
import { ServiceFlowMetricsMobile } from '../components/dashboard/ServiceFlowMetricsMobile';
import { Analytics } from '../components/dashboard/RevenueAnalytics';
import { DaySchedule } from '../components/dashboard/DaySchedule';
import { AddCustomerModal } from '../components/customers/AddCustomerModal';
import { CreateEstimateModal } from '../components/estimates/CreateEstimateModal';
import { CreateJobModal } from '../components/schedule/CreateJobModal';
import { ScheduleJobTypeModal } from '../components/schedule/ScheduleJobTypeModal';
import { ScheduleEstimateVisitModal } from '../components/schedule/ScheduleEstimateVisitModal';
import { CreateInvoiceModal } from '../components/invoices/CreateInvoiceModal';
import { JobDetailsModal } from '../components/schedule/JobDetailsModal';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
// Lazy load the GettingStartedChecklist to avoid flashing
const GettingStartedChecklist = lazy(() => 
  import('../components/onboarding/GettingStartedChecklist').then(module => ({ 
    default: module.GettingStartedChecklist 
  }))
);
import { useJobStore } from '../store/jobStore';
import { useCustomerStore } from '../store/customerStore';
import { useEstimateStore } from '../store/estimateStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useNotifications } from '../hooks/useNotifications';
import type { Customer, Job } from '../lib/supabase-types';

// Track if the dashboard has been loaded already for the session
const DASHBOARD_LOADED_KEY = 'dashboard-loaded';

export const Dashboard = () => {
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showCreateEstimateModal, setShowCreateEstimateModal] = useState(false);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showScheduleJobTypeModal, setShowScheduleJobTypeModal] = useState(false);
  const [showEstimateVisitModal, setShowEstimateVisitModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [isDashboardLoaded, setIsDashboardLoaded] = useState(() => {
    return sessionStorage.getItem(DASHBOARD_LOADED_KEY) === 'true';
  });
  // Removed selectedStage state since it's now managed by the ServiceFlow component
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { jobs, fetchJobs } = useJobStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { fetchEstimates, estimates } = useEstimateStore();
  const { fetchInvoices } = useInvoiceStore();
  const { toast } = useNotifications();

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchJobs(),
          fetchCustomers(),
          fetchEstimates(),
          fetchInvoices()
        ]);
        
        // Simple logging, avoid complex operations that could break
        console.log('Total customers:', customers.length);
        
        // Mark dashboard as loaded for this session
        sessionStorage.setItem(DASHBOARD_LOADED_KEY, 'true');
        setIsDashboardLoaded(true);
      } catch (error) {
        if (!navigator.onLine) {
          toast({
            title: "Offline Mode",
            description: "Working with locally stored data",
            duration: 3000
          });
        } else {
          console.error('Error loading dashboard data:', error);
        }
        // Still mark as loaded so we don't keep trying if there's an error
        sessionStorage.setItem(DASHBOARD_LOADED_KEY, 'true');
        setIsDashboardLoaded(true);
      }
    };
    
    // If not already loaded in this session, load data
    if (!isDashboardLoaded) {
      console.log('Dashboard: Loading data');
      loadData();
    } else {
      console.log('Dashboard: Already loaded this session');
    }

    // Set up online/offline event listeners
    const handleOnline = () => {
      toast({
        title: "Back Online",
        description: "Syncing data with server...",
        duration: 3000
      });
      loadData();
    };

    const handleOffline = () => {
      toast({
        title: "Offline Mode",
        description: "Working with locally stored data",
        duration: 3000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchJobs, fetchCustomers, fetchEstimates, fetchInvoices, toast, isDashboardLoaded]);

  // Get today's jobs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysJobs = jobs.filter(job => {
    const jobDate = new Date(job.scheduled_date);
    jobDate.setHours(0, 0, 0, 0);
    return jobDate.getTime() === today.getTime();
  });
  
  // Sort jobs by time
  const sortedJobs = [...todaysJobs].sort((a, b) => 
    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  );

  // Format today's date
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy');
  
  // Count upcoming jobs for today
  const upcomingJobs = sortedJobs.filter(job => job.status !== 'completed' && job.status !== 'cancelled').length;
  
  // Calculate business metrics
  const completedJobsToday = sortedJobs.filter(job => job.status === 'completed').length;
  const completedJobsTotal = jobs.filter(job => job.status === 'completed').length;
  
  // Removed customer metrics
  
  // Calculate earnings (simplified)
  const todaysEarnings = sortedJobs
    .filter(job => job.status === 'completed')
    .reduce((sum, job) => sum + (job.total_amount || 0), 0);
  
  // Weekly earnings (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const weeklyEarnings = jobs
    .filter(job => {
      const jobDate = new Date(job.scheduled_date);
      return jobDate >= sevenDaysAgo && job.status === 'completed';
    })
    .reduce((sum, job) => sum + (job.total_amount || 0), 0);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-3 pb-24">
      {/* Quick Actions */}
      <QuickActionsRow
        onNewCustomer={() => setShowAddCustomerModal(true)}
        onCreateEstimate={() => setShowCreateEstimateModal(true)}
        onScheduleJob={() => setShowScheduleJobTypeModal(true)}
        onCreateInvoice={() => setShowCreateInvoiceModal(true)}
      />
      
      {/* Main dashboard grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - 8/12 width on large screens */}
        <div className="lg:col-span-8 space-y-6">
          {/* Onboarding checklist */}
          {isDashboardLoaded && (
            <Suspense fallback={null}>
              <div className="mt-6">
                <GettingStartedChecklist />
              </div>
            </Suspense>
          )}

          {/* Service Flow Metrics - responsive display */}
          <div className="hidden md:block">
            <ServiceFlowMetrics />
          </div>
          <div className="md:hidden">
            <ServiceFlowMetricsMobile />
          </div>
          
          {/* Original Service Flow with circles (uncomment to show both) */}
          {/* <ServiceFlow /> */}

          {/* Analytics - Business Insights */}
          <Analytics />
        </div>

        {/* Right column - 4/12 width on large screens */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Schedule - Card with modern design */}
          <DaySchedule jobs={todaysJobs} />
        </div>
      </div>

      {/* Modals */}
      {showAddCustomerModal && (
        <AddCustomerModal onClose={() => setShowAddCustomerModal(false)} />
      )}

      {showCreateEstimateModal && (
        <CreateEstimateModal onClose={() => setShowCreateEstimateModal(false)} />
      )}

      {showScheduleJobTypeModal && (
        <ScheduleJobTypeModal
          onClose={() => setShowScheduleJobTypeModal(false)}
          onSelectEstimateVisit={() => {
            setShowScheduleJobTypeModal(false);
            setShowEstimateVisitModal(true);
          }}
          onSelectJob={() => {
            setShowScheduleJobTypeModal(false);
            setShowCreateJobModal(true);
          }}
        />
      )}
      
      {showEstimateVisitModal && (
        <ScheduleEstimateVisitModal
          customerId=""
          onClose={() => setShowEstimateVisitModal(false)}
        />
      )}
      
      {showCreateJobModal && (
        <CreateJobModal onClose={() => setShowCreateJobModal(false)} />
      )}

      {showCreateInvoiceModal && (
        <CreateInvoiceModal onClose={() => setShowCreateInvoiceModal(false)} />
      )}

      {/* Service flow modal is now handled by the ServiceFlow component */}

      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onStatusChange={() => {
            setSelectedJob(null);
            fetchJobs();
          }}
        />
      )}
    </div>
  );
};