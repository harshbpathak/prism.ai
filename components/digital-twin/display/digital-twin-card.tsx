"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, Clock } from 'lucide-react';

interface DigitalTwin {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

interface DigitalTwinCardProps {
  twin: DigitalTwin;
}

export default function DigitalTwinCard({ twin }: DigitalTwinCardProps) {
  const getRiskColor = (tag: string) => {
    if (tag.toLowerCase().includes('high risk')) return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900 dark:to-red-800 dark:text-red-200 shadow-sm';
    if (tag.toLowerCase().includes('medium risk')) return 'bg-gradient-to-r from-yellow-100 to-orange-200 text-yellow-800 dark:from-yellow-900 dark:to-orange-800 dark:text-yellow-200 shadow-sm';
    if (tag.toLowerCase().includes('low risk')) return 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 dark:from-green-900 dark:to-emerald-800 dark:text-green-200 shadow-sm';
    return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200 shadow-sm';
  };

  return (
    <Link href={`/digital-twin/view/${twin.id}`} className="block h-full">
      <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 h-full dark:bg-slate-950 border shadow-md group relative overflow-visible cursor-pointer">
        {/* Subtle animated gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        
        {/* Floating action indicator */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 z-50">
          <div className="bg-white/90 dark:bg-gray-700/90 rounded-full p-2 shadow-sm">
            <ArrowRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
        
        <CardHeader className="relative z-10 pb-3">
          <CardTitle className="text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200 flex items-start justify-between pr-12">
            <span className="line-clamp-2">{twin.name}</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200 line-clamp-2">
            {twin.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10 pt-0">
          <div className="flex flex-wrap gap-2">
            {twin.tags.map((tag, index) => {
              const isRiskTag = tag.toLowerCase().includes('risk');
              const tagClass = isRiskTag ? getRiskColor(tag) : 'bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 dark:from-blue-900 dark:to-indigo-800 dark:text-blue-200 shadow-sm';
              const isDateTag = /\w{3}-\d{4}/.test(tag); // Matches format like "Jun-2024"
              
              return (
                <Badge 
                  key={tag} 
                  className={`${tagClass} transition-all duration-200 border-0 font-medium text-xs px-2 py-1 flex items-center gap-1`}
                >
                  {isDateTag && <Clock className="h-3 w-3" />}
                  {tag}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 