import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, User2, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Job } from '../../lib/supabase-types';
import { useCustomerStore } from '../../store/customerStore';
import { JobDetailsModal } from '../schedule/JobDetailsModal';

interface DayScheduleProps {
  jobs: Job[];
}

export const DaySchedule = ({ jobs }: DayScheduleProps) => {
  const { customers, loading: customersLoading } = useCustomerStore();
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track loading state based on customers data
  useEffect(() => {
    // Consider loading complete when customers are loaded and not empty
    const isDataMissing = !Array.isArray(customers) || customers.length === 0;
    setIsLoading(customersLoading || isDataMissing);
  }, [customers, customersLoading]);
  
  const sortedJobs = [...jobs].sort((a, b) => 
    new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  );

  const getCustomer = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const completedJobs = sortedJobs.filter(job => job.status === 'completed').length;
  const pendingJobs = sortedJobs.length - completedJobs;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 min-h-[40vh]">
        <div className="bg-gray-200 p-4 flex items-center border-b border-gray-300">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#E76F51] rounded-lg shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#E76F51]">Today's Schedule</h2>
              <p className="text-sm text-slate-500">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center space-x-2 ml-auto text-gray-500 bg-[#FDEDE9] px-2 py-0.5 rounded text-xs">
              <Loader2 className="w-3 h-3 animate-spin text-[#E76F51]" />
              <span className="text-xs">Loading...</span>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-10 h-10 animate-spin text-[#E76F51] mb-4" />
              <p className="text-sm text-gray-500">Loading schedule data...</p>
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 rounded-full bg-[#E76F51]/10 mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-[#E76F51]" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Jobs Today</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Your schedule is clear for today. Use this time to plan ahead or catch up on other tasks.
              </p>
              <button 
                onClick={() => navigate('/schedule')}
                className="mt-4 bg-[#E76F51] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#D05A3D] transition-colors"
              >
                View Schedule
              </button>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-[#FDEDE9] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#E76F51]">{pendingJobs}</p>
                  <p className="text-xs text-gray-600">Scheduled</p>
                </div>
                <div className="bg-[#FDEDE9] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#E76F51]">{completedJobs}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
              </div>
            
              <div className="space-y-3">
                {sortedJobs.map((job) => {
                  const customer = getCustomer(job.customer_id);
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex space-x-2 items-center">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(job.scheduled_date), 'h:mm a')}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          job.status === 'completed' ? 'bg-green-100 text-green-700' :
                          job.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {job.status === 'completed' ? 'Completed' :
                          job.status === 'in_progress' ? 'In Progress' :
                          'Scheduled'}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#E76F51]/10 text-[#E76F51] flex items-center justify-center mr-3">
                          <User2 className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {customer?.name || 'Unknown Customer'}
                        </p>
                      </div>
                      
                      {customer?.address && (
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                      
                      {job.status === 'completed' && (
                        <div className="flex items-center mt-2 text-green-600 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          <span>Completed</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-[60]">
          <JobDetailsModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
          />
        </div>
      )}
    </>
  );
};