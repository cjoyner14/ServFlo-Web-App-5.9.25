import { FileText, Calendar, Clock, CreditCard } from 'lucide-react';
import { useEstimateStore } from '../store/estimateStore';
import { useJobStore } from '../store/jobStore';
import { useInvoiceStore } from '../store/invoiceStore';

export interface CustomerStage {
  label: string;
  icon: typeof FileText;
  bgColor: string;
  textColor: string;
  category: 'estimate' | 'job' | 'invoice';  // Added category to help with grouping
}

export const useCustomerStage = (customerId: string, needsEstimate: boolean) => {
  const { estimates } = useEstimateStore();
  const { jobs } = useJobStore();
  const { invoices } = useInvoiceStore();

  const stages: CustomerStage[] = [];

  // Check if ALL jobs have associated invoices and ALL invoices are paid or void
  const customerJobs = jobs.filter(j => j.customer_id === customerId && !j.description.toLowerCase().includes('estimate visit'));
  const customerInvoices = invoices.filter(i => i.customer_id === customerId);

  // Every job has an invoice AND every invoice is paid or void
  const allJobsHaveInvoices = customerJobs.length > 0 &&
    customerJobs.every(job => customerInvoices.some(invoice => invoice.job_id === job.id));
  const allInvoicesPaid = customerInvoices.length > 0 &&
    customerInvoices.every(invoice => invoice.status === 'paid' || invoice.status === 'void');

  // If the customer has completed all service flow stages, return empty array
  if (allJobsHaveInvoices && allInvoicesPaid && customerJobs.length > 0) {
    return stages;
  }

  // Check if customer needs estimate
  if (needsEstimate) {
    stages.push({
      label: 'Estimates Queue',
      icon: FileText,
      bgColor: '',
      textColor: 'text-[#008B37]',
      category: 'estimate'
    });
  }

  // Check for rejected estimates - if a customer has at least one estimate that's rejected
  // and no other estimates, they should be inactive
  const customerEstimates = estimates.filter(e => e.customer_id === customerId);
  const hasRejectedEstimateOnly = customerEstimates.length > 0 &&
    customerEstimates.every(est => est.status === 'rejected');

  if (hasRejectedEstimateOnly) {
    // Customer with only rejected estimates should be inactive
    return [];
  }

  // Check if any invoices are pending payment (draft or overdue status)
  const hasPendingPayment = invoices.some(i =>
    i.customer_id === customerId &&
    (i.status === 'draft' || i.status === 'overdue')
  );

  if (hasPendingPayment) {
    stages.push({
      label: 'Pending Payment',
      icon: CreditCard,
      bgColor: '',
      textColor: 'text-[#475569]',
      category: 'invoice'
    });
  }

  // Check for scheduled jobs (excluding estimate visits)
  const hasScheduledJob = jobs.some(j =>
    j.customer_id === customerId &&
    !j.description.toLowerCase().includes('estimate visit') &&
    (j.status === 'scheduled' || j.status === 'in_progress')
  );

  if (hasScheduledJob) {
    stages.push({
      label: 'Job Scheduled',
      icon: Calendar,
      bgColor: '',
      textColor: 'text-[#f57c00]',
      category: 'job'
    });
  }

  // Check for scheduled estimate visits
  const hasScheduledEstimateVisit = jobs.some(j =>
    j.customer_id === customerId &&
    j.description.toLowerCase().includes('estimate visit') &&
    (j.status === 'scheduled' || j.status === 'in_progress')
  );

  if (hasScheduledEstimateVisit) {
    stages.push({
      label: 'Scheduled Estimate',
      icon: Calendar,
      bgColor: '',
      textColor: 'text-[#008B37]',
      category: 'estimate'
    });
  }

  // Check for pending estimates
  const hasPendingEstimate = estimates.some(e =>
    e.customer_id === customerId &&
    e.status === 'pending'
  );

  if (hasPendingEstimate) {
    stages.push({
      label: 'Pending Estimate',
      icon: Clock,
      bgColor: '',
      textColor: 'text-[#008B37]',
      category: 'estimate'
    });
  }

  // Check for approved estimates - they become unscheduled jobs
  const hasApprovedEstimate = estimates.some(e =>
    e.customer_id === customerId &&
    e.status === 'approved'
  );

  if (hasApprovedEstimate) {
    stages.push({
      label: 'Jobs Queue',
      icon: Calendar,
      bgColor: '',
      textColor: 'text-[#f57c00]',
      category: 'job'
    });
  }

  // Check for completed jobs needing invoice
  const hasCompletedJob = jobs.some(j =>
    j.customer_id === customerId &&
    j.status === 'completed' &&
    !j.description.toLowerCase().includes('estimate visit') &&
    !invoices.some(i => i.job_id === j.id)
  );

  if (hasCompletedJob) {
    stages.push({
      label: 'Needs Invoice',
      icon: FileText,
      bgColor: '',
      textColor: 'text-[#475569]',
      category: 'invoice'
    });
  }

  return stages;
};