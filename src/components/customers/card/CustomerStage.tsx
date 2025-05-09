import React, { useEffect, useState } from 'react';
import { CustomerStageIndicator } from './CustomerStageIndicator';
import { useCustomerStage, CustomerStage as CustomerStageType } from '../../../hooks/useCustomerStage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomerStageProps {
  customerId: string;
  needsEstimate: boolean;
}

export const CustomerStage = ({ customerId, needsEstimate }: CustomerStageProps) => {
  const stages = useCustomerStage(customerId, needsEstimate);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Group stages by category
  const groupedStages = React.useMemo(() => {
    const byCategory = {
      estimate: stages.filter(stage => stage.category === 'estimate'),
      job: stages.filter(stage => stage.category === 'job'),
      invoice: stages.filter(stage => stage.category === 'invoice')
    };

    // Flatten them but keep them in category priority
    return [
      ...byCategory.estimate,
      ...byCategory.job,
      ...byCategory.invoice
    ];
  }, [stages]);

  // Reset current stage index when stages change
  useEffect(() => {
    setCurrentStageIndex(0);
  }, [groupedStages.length]);

  if (groupedStages.length === 0) return null;

  const handlePreviousStage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentStageIndex(prev => (prev - 1 + groupedStages.length) % groupedStages.length);
  };

  const handleNextStage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentStageIndex(prev => (prev + 1) % groupedStages.length);
  };

  return (
    <div className="mt-auto">
      {groupedStages.length > 1 ? (
        <div className="relative">
          <CustomerStageIndicator stage={groupedStages[currentStageIndex]} />

          {/* Stage Pagination - improved version */}
          <div className="absolute top-0 right-0 bottom-0 flex items-center pr-2 pl-3">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={handlePreviousStage}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Previous stage"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>

              <div className="px-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-900 border-x border-gray-200 dark:border-gray-700">
                {currentStageIndex + 1}/{groupedStages.length}
              </div>

              <button
                onClick={handleNextStage}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Next stage"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <CustomerStageIndicator stage={groupedStages[0]} />
      )}
    </div>
  );
};