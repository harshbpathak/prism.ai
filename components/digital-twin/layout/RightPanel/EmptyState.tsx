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
      className="flex-1 flex flex-col"
      variants={contentVariants}
      animate="visible"
      initial="hidden"
    >
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8">
        {/* Header */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold text-foreground">
            Properties Panel
          </h3>
          <motion.div 
            className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </motion.div>

        {/* Icon and animation */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-24 h-24 mx-auto mb-6 relative">
            {/* Outer ring with subtle animation */}
            <motion.div 
              className="absolute inset-0 w-24 h-24 border-2 border-muted-foreground/20 rounded-full"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Inner content */}
            <div className="absolute inset-3 w-18 h-18 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-full flex items-center justify-center shadow-inner">
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-9 w-9 text-blue-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" 
                />
              </motion.svg>
            </div>
          </div>
        </motion.div>

        {/* Main message */}
        <motion.div 
          className="space-y-4 max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <p className="text-base font-medium text-foreground">
            Select an element to get started
          </p>
          <p className="text-sm text-muted-foreground leading-tight">
            Click on any node or edge in the canvas to view and edit its properties, configuration, and details.
          </p>
        </motion.div>

        {/* Helpful tips */}
        <motion.div 
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="bg-muted/50 rounded-xl p-5 border border-border/50 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Tip:</span> Changes are automatically saved after you stop editing. No need to manually save!
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Collapse button at bottom - now properly positioned */}
      <motion.div 
        className="flex-shrink-0 flex justify-center p-4 border-t border-border/20 bg-background/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <motion.button
          onClick={onCollapse}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors group"
          title="Collapse Properties Panel"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-xs text-muted-foreground group-hover:text-primary font-medium">Hide Panel</span>
          <motion.div
            variants={iconVariants}
            animate="expanded"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default EmptyState; 