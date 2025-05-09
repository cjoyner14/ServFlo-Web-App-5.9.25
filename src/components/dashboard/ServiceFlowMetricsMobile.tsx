import React, { useState } from 'react';
import { BarChart4, ChevronDown, ChevronRight, ChevronUp, ExternalLink, Shuffle } from 'lucide-react';
import { serviceFlowStages } from './stages/serviceFlowStages';
import { useServiceFlow } from './stages/useServiceFlow';
import { ServiceFlowModal } from './new-service-flow/ServiceFlowModal';
import type { Customer } from '../../lib/supabase-types';
import { useNavigate } from 'react-router-dom';

export const ServiceFlowMetricsMobile: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<{
    title: string;
    customers: Customer[];
    color: string;
  } | null>(null);
  const [expandedSection, setExpandedSection] = useState<'estimates' | 'jobs' | 'invoices' | null>('estimates');
  
  const navigate = useNavigate();

  // Use the service flow hook to get customer counts for each stage
  const serviceFlow = useServiceFlow();
  
  // Get customers for each stage
  const stagesWithData = serviceFlowStages.map(stage => {
    const customers = serviceFlow.getCustomersForStage(stage.id);
    return {
      ...stage,
      count: customers.length,
      customers
    };
  });
  
  // Calculate total active customers
  const totalActiveCustomers = stagesWithData.reduce((sum, stage) => sum + stage.count, 0);
  
  // Group stages by category
  const estimateStages = stagesWithData.filter(stage => 
    ['needsEstimate', 'estimateScheduled', 'pendingApproval'].includes(stage.id)
  );
  
  const jobStages = stagesWithData.filter(stage => 
    ['needsJobScheduled', 'jobScheduled'].includes(stage.id)
  );
  
  const invoiceStages = stagesWithData.filter(stage => 
    ['needsInvoice', 'pendingPayment'].includes(stage.id)
  );
  
  // Calculate totals by category
  const estimateTotal = estimateStages.reduce((sum, stage) => sum + stage.count, 0);
  const jobTotal = jobStages.reduce((sum, stage) => sum + stage.count, 0);
  const invoiceTotal = invoiceStages.reduce((sum, stage) => sum + stage.count, 0);

  // Handle stage selection
  const handleStageClick = (stage: typeof stagesWithData[0]) => {
    if (stage.count > 0) {
      setSelectedStage({
        title: stage.label,
        customers: stage.customers,
        color: stage.color
      });
    }
  };

  // Navigate to Jobs page with appropriate tab
  const handleSeeAllClick = (tab: 'estimates' | 'jobs' | 'invoices') => {
    navigate(`/jobs?tab=${tab}`);
  };

  // Toggle section expansion
  const toggleSection = (section: 'estimates' | 'jobs' | 'invoices') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Get color based on percentage
  const getPercentageColor = (percentage: number) => {
    if (percentage > 50) return '#ef4444';  // High - red
    if (percentage > 25) return '#f59e0b';  // Medium - amber
    return '#10b981';  // Low - green
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gray-200 p-4 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0A7E3D] rounded-lg shadow-sm">
              <BarChart4 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0A7E3D]">Service Flow</h2>
              <p className="text-sm text-slate-500">Customer status overview</p>
            </div>
          </div>
          {totalActiveCustomers > 0 && (
            <div className="bg-[#0A7E3D]/10 px-2 py-0.5 rounded text-xs font-medium text-[#0A7E3D]">
              {totalActiveCustomers} active
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3">
        {totalActiveCustomers === 0 ? (
          <div className="py-6 text-center">
            <div className="mx-auto bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mb-3">
              <Shuffle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No active customers</h3>
            <p className="text-sm text-gray-500 mb-4 px-4">
              Add customers and create estimates to start tracking your workflow
            </p>
            <button 
              onClick={() => navigate('/customers')}
              className="px-4 py-2 bg-[#0A7E3D] text-white rounded-md text-sm font-medium hover:bg-[#0A7E3D]/90 transition-colors"
            >
              Add Customer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary statistics */}
            <div className="grid grid-cols-3 gap-1 mb-4">
              <div 
                className={`p-3 rounded-md text-center ${
                  expandedSection === 'estimates' ? 'bg-[#0A7E3D]/10 border-[#0A7E3D]/20' : 'bg-gray-50'
                } border cursor-pointer transition-colors`}
                onClick={() => toggleSection('estimates')}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ color: '#0A7E3D' }}
                >
                  {estimateTotal}
                </div>
                <div className="text-xs text-gray-500">Estimates</div>
              </div>
              <div 
                className={`p-3 rounded-md text-center ${
                  expandedSection === 'jobs' ? 'bg-[#D97706]/10 border-[#D97706]/20' : 'bg-gray-50'
                } border cursor-pointer transition-colors`}
                onClick={() => toggleSection('jobs')}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ color: '#D97706' }}
                >
                  {jobTotal}
                </div>
                <div className="text-xs text-gray-500">Jobs</div>
              </div>
              <div 
                className={`p-3 rounded-md text-center ${
                  expandedSection === 'invoices' ? 'bg-[#475569]/10 border-[#475569]/20' : 'bg-gray-50'
                } border cursor-pointer transition-colors`}
                onClick={() => toggleSection('invoices')}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ color: '#475569' }}
                >
                  {invoiceTotal}
                </div>
                <div className="text-xs text-gray-500">Invoices</div>
              </div>
            </div>

            {/* Estimates Section */}
            {expandedSection === 'estimates' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm text-[#0A7E3D] flex items-center">
                    ESTIMATES <ChevronDown className="w-3 h-3 ml-1" />
                  </h3>
                  {estimateTotal > 0 && (
                    <button 
                      onClick={() => handleSeeAllClick('estimates')}
                      className="flex items-center text-xs text-[#0A7E3D] hover:text-[#0A7E3D]/80"
                    >
                      All <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {estimateStages.map(stage => (
                    <div 
                      key={stage.id}
                      className={`p-3 rounded-lg border ${stage.count > 0 ? 
                        'border-[#0A7E3D]/20 bg-[#0A7E3D]/5 cursor-pointer hover:bg-[#0A7E3D]/10' : 
                        'border-gray-200 bg-gray-50'
                      } transition-colors`}
                      onClick={() => stage.count > 0 && handleStageClick(stage)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div 
                            className="mr-2 p-1.5 rounded-md"
                            style={{ backgroundColor: `${stage.color}20` }}
                          >
                            <stage.icon 
                              className="w-4 h-4"
                              style={{ color: stage.count > 0 ? stage.color : '#9ca3af' }}
                            />
                          </div>
                          <div>
                            <span 
                              className="block text-sm font-medium"
                              style={{ color: stage.count > 0 ? stage.color : '#9ca3af' }}
                            >
                              {stage.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-lg font-semibold mr-1" style={{ color: stage.color }}>
                            {stage.count}
                          </span>
                          {stage.count > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar with labeled metrics */}
                      {stage.count > 0 && totalActiveCustomers > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-xs text-gray-500">
                              {stage.count} of {totalActiveCustomers} customers
                            </div>
                            <div className="text-xs font-medium" style={{ color: stage.color }}>
                              {Math.round(stage.count / totalActiveCustomers * 100)}%
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(5, Math.round(stage.count / totalActiveCustomers * 100))}%`,
                                backgroundColor: stage.color
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Jobs Section */}
            {expandedSection === 'jobs' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm text-[#D97706] flex items-center">
                    JOBS <ChevronDown className="w-3 h-3 ml-1" />
                  </h3>
                  {jobTotal > 0 && (
                    <button 
                      onClick={() => handleSeeAllClick('jobs')}
                      className="flex items-center text-xs text-[#D97706] hover:text-[#D97706]/80"
                    >
                      All <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {jobStages.map(stage => (
                    <div 
                      key={stage.id}
                      className={`p-3 rounded-lg border ${stage.count > 0 ? 
                        'border-[#D97706]/20 bg-[#D97706]/5 cursor-pointer hover:bg-[#D97706]/10' : 
                        'border-gray-200 bg-gray-50'
                      } transition-colors`}
                      onClick={() => stage.count > 0 && handleStageClick(stage)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div 
                            className="mr-2 p-1.5 rounded-md"
                            style={{ backgroundColor: `${stage.color}20` }}
                          >
                            <stage.icon 
                              className="w-4 h-4"
                              style={{ color: stage.count > 0 ? stage.color : '#9ca3af' }}
                            />
                          </div>
                          <div>
                            <span 
                              className="block text-sm font-medium"
                              style={{ color: stage.count > 0 ? stage.color : '#9ca3af' }}
                            >
                              {stage.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-lg font-semibold mr-1" style={{ color: stage.color }}>
                            {stage.count}
                          </span>
                          {stage.count > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar with labeled metrics */}
                      {stage.count > 0 && totalActiveCustomers > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-xs text-gray-500">
                              {stage.count} of {totalActiveCustomers} customers
                            </div>
                            <div className="text-xs font-medium" style={{ color: stage.color }}>
                              {Math.round(stage.count / totalActiveCustomers * 100)}%
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(5, Math.round(stage.count / totalActiveCustomers * 100))}%`,
                                backgroundColor: stage.color
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Invoices Section */}
            {expandedSection === 'invoices' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm text-[#475569] flex items-center">
                    INVOICES <ChevronDown className="w-3 h-3 ml-1" />
                  </h3>
                  {invoiceTotal > 0 && (
                    <button 
                      onClick={() => handleSeeAllClick('invoices')}
                      className="flex items-center text-xs text-[#475569] hover:text-[#475569]/80"
                    >
                      All <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {invoiceStages.map(stage => (
                    <div 
                      key={stage.id}
                      className={`p-3 rounded-lg border ${stage.count > 0 ? 
                        'border-[#475569]/20 bg-[#475569]/5 cursor-pointer hover:bg-[#475569]/10' : 
                        'border-gray-200 bg-gray-50'
                      } transition-colors`}
                      onClick={() => stage.count > 0 && handleStageClick(stage)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div 
                            className="mr-2 p-1.5 rounded-md"
                            style={{ backgroundColor: `${stage.color}20` }}
                          >
                            <stage.icon 
                              className="w-4 h-4"
                              style={{ color: stage.count > 0 ? stage.color : '#9ca3af' }}
                            />
                          </div>
                          <div>
                            <span 
                              className="block text-sm font-medium"
                              style={{ color: stage.count > 0 ? stage.color : '#9ca3af' }}
                            >
                              {stage.label}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-lg font-semibold mr-1" style={{ color: stage.color }}>
                            {stage.count}
                          </span>
                          {stage.count > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar with labeled metrics */}
                      {stage.count > 0 && totalActiveCustomers > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-xs text-gray-500">
                              {stage.count} of {totalActiveCustomers} customers
                            </div>
                            <div className="text-xs font-medium" style={{ color: stage.color }}>
                              {Math.round(stage.count / totalActiveCustomers * 100)}%
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(5, Math.round(stage.count / totalActiveCustomers * 100))}%`,
                                backgroundColor: stage.color
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for viewing customers in a stage */}
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