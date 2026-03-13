"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlowyButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function GlowyButton({ children, href, onClick, className }: GlowyButtonProps) {
  const Component = href ? 'a' : 'button';

  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn("glowy-btn rounded-lg", className)}
    >
      {children}
    </Component>
  );
} 