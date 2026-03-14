"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface GlowyButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "ghost";
}

export function GlowyButton({ children, href, onClick, className, variant = "primary" }: GlowyButtonProps) {
  const isGhost = variant === "ghost";

  const buttonClasses = cn(
    "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300",
    "px-8 py-3.5",
    isGhost
      ? "text-[#2563EB] bg-transparent border border-[#2563EB]/30 hover:bg-[#2563EB]/[0.06]"
      : "text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] shadow-[0_4px_24px_rgba(37,99,235,0.25)] hover:shadow-[0_8px_40px_rgba(37,99,235,0.4)] hover:-translate-y-0.5",
    className
  );

  const innerContent = (
    <>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {!isGhost && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
      )}
    </>
  );

  if (href) {
    if (href.startsWith("#")) {
      return (
        <a href={href} onClick={onClick} className={cn(buttonClasses, "group")}>
          {innerContent}
        </a>
      );
    }
    return (
      <Link href={href} onClick={onClick} className={cn(buttonClasses, "group")}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cn(buttonClasses, "group")}>
      {innerContent}
    </button>
  );
} 