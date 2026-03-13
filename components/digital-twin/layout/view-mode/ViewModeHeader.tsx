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
        <Button variant="ghost" size="icon" aria-label="Back to Dashboard" onClick={() => router.push('/digital-twin')}
          className="rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold whitespace-nowrap">{title}</span>
      </div>
    </header>
  );
};

export default ViewModeHeader; 