import React from 'react';
import { TrendingUp, Info, Loader2 } from 'lucide-react';
import { MetricGrid } from './metrics/MetricGrid';
import { useMetricData } from './metrics/hooks/useMetricData';

export const Analytics = () => {
  const { metrics, isLoading } = useMetricData();

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gray-200 p-5 flex items-center justify-between border-b border-gray-300">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#2A9D8F] rounded-lg shadow-sm">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2A9D8F]">Business Insights</h2>
            <p className="text-sm text-slate-600">Key performance metrics</p>
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500 bg-[#2A9D8F]/10 px-2 py-0.5 rounded text-xs">
            <Loader2 className="w-3 h-3 animate-spin text-[#2A9D8F]" />
            <span className="text-xs">Loading...</span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-[#2A9D8F] mb-4" />
            <p className="text-sm text-gray-500">Loading business metrics...</p>
          </div>
        ) : (
          <MetricGrid metrics={metrics} />
        )}
      </div>
    </div>
  );
};