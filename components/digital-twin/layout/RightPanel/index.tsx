import { FC, useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Cookies from 'js-cookie';
import { DeleteIcon } from '@/components/icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import NodeConfiguration from './NodeConfiguration';
import EdgeConfiguration from './EdgeConfiguration';
import TemplateGroupConfiguration from './TemplateGroupConfiguration';
import SaveStatusIndicator from './SaveStatusIndicator';
import EmptyState from './EmptyState';
import CollapsedState from './CollapsedState';
import { RightPanelProps, SaveStatus } from './types';
import { panelVariants, contentVariants, iconVariants } from './animations';
import { createDebouncedSave, isNodeElement } from './functions';

const RightPanel: FC<RightPanelProps> = ({ 
  selectedElement, 
  onUpdate, 
  onDelete, 
  onUngroup, 
  nodes = [], 
  onSave 
}) => {
  const [formValues, setFormValues] = useState<any>({});
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [shouldSkipConfirmation, setShouldSkipConfirmation] = useState(false);
  
  // Create debounced save function
  const { debouncedSave } = createDebouncedSave(onSave, setSaveStatus);

  // Check cookie on component mount
  useEffect(() => {
    const skipConfirmation = Cookies.get('deleteNodeSkipConfirmation') === 'true';
    setShouldSkipConfirmation(skipConfirmation);
  }, []);

  // Update form values when selected element changes
  useEffect(() => {
    if (selectedElement) {
      setFormValues(selectedElement.data || {});
      setSaveStatus('saved'); // Reset status when switching elements
    } else {
      setFormValues({});
      setSaveStatus('saved');
    }
  }, [selectedElement]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Handle delete action
  const handleDelete = () => {
    if (selectedElement && onDelete) {
      // Save preference to cookie if "don't ask again" was checked
      if (dontAskAgain) {
        Cookies.set('deleteNodeSkipConfirmation', 'true', { 
          expires: 365, // 1 year
          path: '/' 
        });
      }
      onDelete(selectedElement.id);
    }
  };

  // Handle direct delete without confirmation
  const handleDirectDelete = () => {
    if (selectedElement && onDelete) {
      onDelete(selectedElement.id);
    }
  };

  // Determine if we're dealing with a node or edge
  const isNode = isNodeElement(selectedElement);

  // Collapsed state
  if (isCollapsed) {
    return (
      <CollapsedState
        selectedElement={selectedElement as Node | null}
        formValues={formValues}
        onExpand={() => setIsCollapsed(false)}
        onDelete={onDelete}
      />
    );
  }

  // Empty state - no element selected
  if (!selectedElement) {
    return (
      <motion.div 
        className="border-l border-border bg-card/50 backdrop-blur-sm flex flex-col shadow-sm overflow-hidden"
        variants={panelVariants}
        animate="expanded"
        initial={false}
      >
        <EmptyState onCollapse={() => setIsCollapsed(true)} />
      </motion.div>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    const updatedFormValues = {
      ...formValues,
      [field]: value
    };
    
    setFormValues(updatedFormValues);
    
    // Only change to unsaved if we're not already in unsaved state
    if (saveStatus !== 'unsaved') {
      setSaveStatus('unsaved');
    }
    
    // Immediately update the React Flow node/edge data for real-time preview
    if (selectedElement) {
      const updatedElement = {
        ...selectedElement,
        data: {
          ...selectedElement.data,
          ...updatedFormValues
        }
      };
      onUpdate(updatedElement);
    }

    // Trigger debounced save
    debouncedSave();
  };

  const handleMapCoordinatesChange = (lat: string, lng: string, address?: string) => {
    setLatitude(lat)
    setLongitude(lng)
    
    // Also update the address field if provided
    if (address) {
      const updatedFormValues = {
        ...formValues,
        address: address
      };
      setFormValues(updatedFormValues);
      
      // Only change to unsaved if we're not already in unsaved state
      if (saveStatus !== 'unsaved') {
        setSaveStatus('unsaved');
      }
      
      // Update the element immediately for real-time preview
      if (selectedElement) {
        const updatedElement = {
          ...selectedElement,
          data: {
            ...selectedElement.data,
            ...updatedFormValues
          }
        };
        onUpdate(updatedElement);
      }
      
      // Trigger debounced save
      debouncedSave();
    }
  }

  // Render the appropriate configuration component
  const renderConfiguration = () => {
    if (isNode) {
      const node = selectedElement as Node;
      
      // Handle template groups
      if (node.type === 'group' && node.data.isTemplate) {
        return <TemplateGroupConfiguration node={node} nodes={nodes} />;
      }
      
      // Handle regular nodes
      return (
        <NodeConfiguration
          selectedNode={node}
          formValues={formValues}
          onInputChange={handleInputChange}
          onMapCoordinatesChange={handleMapCoordinatesChange}
        />
      );
    } else {
      // Handle edges
      const edge = selectedElement as Edge;
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      return (
        <EdgeConfiguration
          selectedEdge={edge}
          formValues={formValues}
          onInputChange={handleInputChange}
          sourceNode={sourceNode}
          targetNode={targetNode}
        />
      );
    }
  };

  return (
    <motion.div 
      className="border-l border-border bg-card/50 backdrop-blur-sm shadow-sm flex flex-col h-full overflow-hidden dark:bg-slate-950"
      variants={panelVariants}
      animate="expanded"
      initial={false}
      style={{ position: 'relative', zIndex: 40 }}
    >
      {/* Header with Save Status */}
      <motion.div 
        className="flex-shrink-0 p-6 border-b border-border bg-gradient-to-r from-card to-card/80 space-y-3 "
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-between dark:bg-slate-950" >
          <h3 className="text-lg font-semibold text-foreground">Properties</h3>
        </div>
        
        {/* Save Status Indicator */}
        <SaveStatusIndicator saveStatus={saveStatus} />
        
        <motion.p 
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Editing {isNode ? 'node' : 'edge'}: <span className="font-medium text-blue-600 dark:text-blue-400">{formValues.label || selectedElement.id}</span>
        </motion.p>
      </motion.div>
      
      {/* Scrollable Content */}
      <motion.div 
        className="flex-1 overflow-y-auto overflow-x-visible"
        variants={contentVariants}
        animate="visible"
        initial="hidden"
        style={{ position: 'relative' }}
      >
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedElement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderConfiguration()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Fixed Bottom Section */}
      <motion.div 
        className="flex-shrink-0 p-6 border-t border-border bg-gradient-to-r from-card to-card/80 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        {/* Ungroup Button for Template Groups */}
        {isNode && selectedElement.type === 'group' && selectedElement.data.isTemplate && onUngroup && (
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUngroup(selectedElement.id)}
              className="text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/30"
            >
              <span className="mr-2">⚡</span>
              Ungroup Template
            </Button>
          </motion.div>
        )}

        {/* Delete Button for Regular Nodes */}
        {isNode && selectedElement.type !== 'group' && onDelete && (
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {shouldSkipConfirmation ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDirectDelete}
                className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 shadow-md"
              >
                <DeleteIcon size={12} className="w-3 h-3 mr-1" />
                Delete
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 shadow-md"
                  >
                    <DeleteIcon size={12} className="w-3 h-3 mr-1 " />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Node</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <div>
                        Are you sure you want to delete "{formValues.label || selectedElement.id}"? This action cannot be undone and will also remove all connected edges.
                      </div>
                      <div className="flex items-center space-x-2 pt-4">
                        <Checkbox 
                          id="dont-ask-again-main" 
                          checked={dontAskAgain}
                          onCheckedChange={(checked) => setDontAskAgain(checked as boolean)}
                        />
                        <label 
                          htmlFor="dont-ask-again-main" 
                          className="text-sm text-muted-foreground cursor-pointer select-none"
                        >
                          Don't ask again
                        </label>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </motion.div>
        )}
        
        {/* Collapse Button */}
        <motion.button
          onClick={() => setIsCollapsed(true)}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
          title="Collapse Properties Panel"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-xs text-muted-foreground group-hover:text-primary font-medium ">Hide Panel</span>
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

export default RightPanel; 