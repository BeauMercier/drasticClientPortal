import { CheckCircle, AlertTriangle, FileEdit, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type BirStatus = 'pending' | 'submitted' | 'approved';

interface BirStatusBannerProps {
  status: BirStatus;

  /* Optional CTA callbacks */
  onEdit?: () => void;
  onReview?: () => void;
}

const bannerMap = {
  pending: {
    bg: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    icon: Clock,
    title: 'Draft Saved',
    body: 'You have a draft in progress. Continue editing when you\'re ready.'
  },
  submitted: {
    bg: 'bg-red-50 border-red-200 text-red-700',
    icon: AlertTriangle,
    title: 'Business Information Submitted — Awaiting Review',
    body:
      'You can still review or update your answers while our team looks them over.'
  },
  approved: {
    bg: 'bg-green-50 border-green-200 text-green-700',
    icon: CheckCircle,
    title: 'Business Information Approved!',
    body: 'All set. You may review the approved information at any time.'
  }
} as const;

export function BirStatusBanner({ status, onEdit, onReview }: BirStatusBannerProps) {
  const cfg = bannerMap[status];
  const Icon = cfg.icon;

  return (
    <div className={`p-4 border rounded-lg shadow-sm space-y-3 ${cfg.bg}`}>
      <div className="flex items-center">
        <Icon className="h-5 w-5 mr-2" />
        <p className="text-sm font-medium">{cfg.title}</p>
      </div>

      <p className="text-xs">{cfg.body}</p>

      {(onEdit || onReview) && (
        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button size="sm" onClick={onEdit}>
              <FileEdit className="h-4 w-4 mr-1" />
              Edit Information
            </Button>
          )}
          {onReview && (
            <Button size="sm" variant="outline" onClick={onReview}>
              Review Info
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 