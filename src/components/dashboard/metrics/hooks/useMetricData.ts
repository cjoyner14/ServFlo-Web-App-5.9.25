import { useJobStore } from '../../../../store/jobStore';
import { useInvoiceStore } from '../../../../store/invoiceStore';
import { useEstimateStore } from '../../../../store/estimateStore';
import { useCustomerStore } from '../../../../store/customerStore';
import { useMetricCalculations } from './useMetricCalculations';
import { useMetricFilters } from './useMetricFilters';
import { formatCurrency } from '../../../../utils/currency';
import type { Metric } from '../types';
import { useEffect, useState } from 'react';

export const useMetricData = () => {
  const { jobs, loading: jobsLoading } = useJobStore();
  const { invoices, loading: invoicesLoading } = useInvoiceStore();
  const { estimates, loading: estimatesLoading } = useEstimateStore();
  const { loading: customersLoading } = useCustomerStore();
  const [isLoading, setIsLoading] = useState(true);
  const { calculateMonthlyData, calculatePercentageChange } = useMetricCalculations();
  const { getTodaysJobs, getWeeklyBookings, getMonthlyDateRanges } = useMetricFilters();

  const pipelineRevenue = estimates
    .filter(estimate => estimate.status === 'approved')
    .reduce((sum, estimate) => sum + estimate.total_amount, 0);

  const todaysJobs = getTodaysJobs(jobs);
  const todaysRevenue = todaysJobs
    .filter(job => job.status === 'completed')
    .reduce((sum, job) => sum + (job.total_amount || 0), 0);

  const { currentWeekBookings, lastWeekBookings } = getWeeklyBookings(jobs);
  const dateRanges = getMonthlyDateRanges();

  const currentMonthData = calculateMonthlyData(
    jobs, 
    invoices, 
    dateRanges.currentMonth.start, 
    dateRanges.currentMonth.end
  );

  const lastMonthData = calculateMonthlyData(
    jobs, 
    invoices, 
    dateRanges.lastMonth.start, 
    dateRanges.lastMonth.end
  );

  // Calculate estimate conversion rate
  const currentMonthEstimates = estimates.filter(e => {
    const date = new Date(e.created_at);
    return date >= dateRanges.currentMonth.start && date <= dateRanges.currentMonth.end;
  });
  
  const lastMonthEstimates = estimates.filter(e => {
    const date = new Date(e.created_at);
    return date >= dateRanges.lastMonth.start && date <= dateRanges.lastMonth.end;
  });

  const currentConversionRate = currentMonthEstimates.length > 0
    ? (currentMonthEstimates.filter(e => e.status === 'approved').length / currentMonthEstimates.length) * 100
    : 0;

  const lastConversionRate = lastMonthEstimates.length > 0
    ? (lastMonthEstimates.filter(e => e.status === 'approved').length / lastMonthEstimates.length) * 100
    : 0;

  const conversionRateChange = calculatePercentageChange(currentConversionRate, lastConversionRate);

  const revenueChange = calculatePercentageChange(currentMonthData.revenue, lastMonthData.revenue);
  const outstandingChange = calculatePercentageChange(currentMonthData.outstandingRevenue, lastMonthData.outstandingRevenue);
  const avgValueChange = calculatePercentageChange(currentMonthData.averageJobValue, lastMonthData.averageJobValue);
  const weeklyBookingsChange = calculatePercentageChange(currentWeekBookings, lastWeekBookings);

  // Track loading state for all required data
  useEffect(() => {
    // If any data is loading, consider the metrics as loading
    const isAnyDataLoading = jobsLoading || invoicesLoading || estimatesLoading || customersLoading;

    // Data might be available but empty
    const isDataMissing = !Array.isArray(jobs) || !Array.isArray(invoices) || !Array.isArray(estimates);

    // Only stop loading when all data is loaded
    setIsLoading(isAnyDataLoading || isDataMissing);
  }, [jobs, jobsLoading, invoices, invoicesLoading, estimates, estimatesLoading, customersLoading]);

  const metrics: Metric[] = [
    {
      title: "Monthly Revenue",
      value: formatCurrency(currentMonthData.revenue),
      change: revenueChange,
      subtitle: `${currentMonthData.completedJobCount} completed jobs`
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(todaysRevenue),
      change: todaysRevenue > 0 ? 100 : 0,
      subtitle: `${todaysJobs.filter(job => job.status === 'completed').length} completed jobs`
    },
    {
      title: 'Pipeline Revenue',
      value: formatCurrency(pipelineRevenue),
      change: 0,
      subtitle: 'Approved estimates'
    },
    {
      title: 'Outstanding Revenue',
      value: formatCurrency(currentMonthData.outstandingRevenue),
      change: outstandingChange,
      subtitle: `${currentMonthData.outstandingCount} unpaid invoices`
    },
    {
      title: 'Average Job Value',
      value: formatCurrency(currentMonthData.averageJobValue),
      change: avgValueChange,
      subtitle: `${currentMonthData.completedJobCount} jobs this month`
    },
    {
      title: 'Estimate Conversion',
      value: `${Math.round(currentConversionRate)}%`,
      change: conversionRateChange,
      subtitle: `${currentMonthEstimates.length} total estimates`
    }
  ];

  return { metrics, isLoading };
};