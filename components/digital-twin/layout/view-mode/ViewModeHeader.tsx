"use client";

import { FC } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViewModeHeaderProps {
  /** Optional override title */
  title?: string;
  /** Additional classname */
  className?: string;
}

/**
 * ViewModeHeader
 * --------------
 * A slim header bar for View-Only pages. It surfaces a **Back to Dashboard**
 * button and an optional title. The header is intentionally minimal: no save
 * or intelligence actions are shown.
 */
const ViewModeHeader: FC<ViewModeHeaderProps> = ({ title = 'Supply Chain View', className }) => {
  const router = useRouter();

  return (
    <header
      className={`flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 py-2 shadow-md ${className ?? ''}`}
    >
      <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold whitespace-nowrap">{title}</span>
          </Button>
      </div>
    </header>
  );
};

export default ViewModeHeader;