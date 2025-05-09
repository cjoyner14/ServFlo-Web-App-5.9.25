import React, { useState, useEffect } from 'react';
import { BarChart4, Loader2 } from 'lucide-react';
import { ServiceFlowEmptyState } from '../ServiceFlowEmptyState';
import { serviceFlowStages } from '../stages/serviceFlowStages';
import { useServiceFlow } from '../stages/useServiceFlow';
import { ServiceFlowModal } from '../new-service-flow/ServiceFlowModal';
import { ServiceFlowStages } from '../stages/ServiceFlowStages';
import type { Customer } from '../../../lib/supabase-types';
import { useCustomerStore } from '../../../store/customerStore';
import { useEstimateStore } from '../../../store/estimateStore';
import { useJobStore } from '../../../store/jobStore';
import { useInvoiceStore } from '../../../store/invoiceStore';

/**
 * This component directly imports and renders the Jobs page's ServiceFlowStages component,
 * ensuring identical display and customer counts between Dashboard and Jobs page.
 */
export const ServiceFlow: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<{
    title: string;
    customers: Customer[];
    color: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get store data - same as Jobs page
  const { customers, loading: customersLoading } = useCustomerStore();
  const { estimates, loading: estimatesLoading } = useEstimateStore();
  const { jobs, loading: jobsLoading } = useJobStore();
  const { invoices, loading: invoicesLoading } = useInvoiceStore();

  // Track loading state for all required data
  useEffect(() => {
    // If any data is loading or if customers array is empty, consider the component as loading
    const isAnyDataLoading = customersLoading || estimatesLoading || jobsLoading || invoicesLoading;
    const isDataMissing = !Array.isArray(customers) || customers.length === 0;

    // Only stop loading when all data is loaded and customers array is populated
    setIsLoading(isAnyDataLoading || isDataMissing);
  }, [customers, customersLoading, estimates, estimatesLoading, jobs, jobsLoading, invoices, invoicesLoading]);

  // Use the exact same service flow hook as used in the Jobs page
  const serviceFlow = useServiceFlow();

  // Get customers for each stage exactly as in the Jobs page
  const stagesWithCustomers = serviceFlowStages.map(stage => {
    const customers = serviceFlow.getCustomersForStage(stage.id);
    return {
      ...stage,
      count: customers.length,
      customers
    };
  });

  // Calculate total active customers
  const totalActiveCustomers = stagesWithCustomers.reduce((sum, stage) => sum + stage.count, 0);

  // Handle stage selection (for showing modal)
  const handleStageSelect = (stageInfo: {
    title: string;
    customers: Customer[];
    color: string;
  } | null) => {
    setSelectedStage(stageInfo);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gray-200 p-5 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0A7E3D] rounded-lg shadow-sm">
              <BarChart4 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0A7E3D]">Service Flow</h2>
              <p className="text-sm text-slate-500">Track customer lifecycle stages</p>
            </div>
          </div>
          {!isLoading && totalActiveCustomers > 0 && (
            <div className="bg-[#0A7E3D]/10 px-2 py-0.5 rounded text-xs font-medium text-[#0A7E3D]">
              {totalActiveCustomers} active
            </div>
          )}
          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-[#0A7E3D]" />
              <span className="text-xs">Loading...</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-[#0A7E3D] mb-4" />
            <p className="text-sm text-gray-500">Loading customer data...</p>
          </div>
        ) : totalActiveCustomers === 0 ? (
          <ServiceFlowEmptyState />
        ) : (
          /* DIRECTLY MIRROR the Jobs page service flow stages */
          <div className="overflow-x-auto pb-2">
            <div className="min-w-max">
              <ServiceFlowStages
                stages={stagesWithCustomers}
                onStageSelect={handleStageSelect}
              />
            </div>
          </div>
        )}
      </div>

      {/* Use the same modal as Jobs page */}
      {selectedStage && (
        <ServiceFlowModal
          title={selectedStage.title}
          customers={selectedStage.customers}
          color={selectedStage.color}
          onClose={() => setSelectedStage(null)}
        />
      )}
    </div>
  );
};