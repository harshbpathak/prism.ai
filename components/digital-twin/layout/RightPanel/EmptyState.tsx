import { FC } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { contentVariants, iconVariants } from './animations';

interface EmptyStateProps {
  onCollapse: () => void;
}

const EmptyState: FC<EmptyStateProps> = ({ onCollapse }) => {
  return (
    <motion.div 
      className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900"
      variants={contentVariants}
      animate="visible"
      initial="hidden"
    >
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      
       

        {/* Minimal text */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <p className="text-base font-medium text-slate-900 dark:text-slate-100">
            Select an element
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">
            Click on a node or edge to view properties
          </p>
        </motion.div>
      </div>
      
      {/* Subtle Collapse button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-center">
        <button
          onClick={onCollapse}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <span className="text-xs font-medium">Hide Panel</span>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default EmptyState; 