'use client';

import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryState, parseAsString, parseAsBoolean } from 'nuqs';
import debounce from 'lodash.debounce';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CopilotTextarea } from '@copilotkit/react-textarea';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SaveSupplyChainDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  nodes: Node[];
  edges: Edge[];
}

interface FormErrors {
  name?: string;
  description?: string;
}

const SaveSupplyChainDialog: FC<SaveSupplyChainDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialDescription = '',
  nodes,
  edges,
}) => {
  // URL state for name and description with debouncing
  const [nameParam, setNameParam] = useQueryState('saveName', parseAsString);
  const [descriptionParam, setDescriptionParam] = useQueryState('saveDescription', parseAsString);
  const [useLiteModel, setUseLiteModel] = useQueryState('use_lite_model', parseAsBoolean.withDefault(false));
  
  // Local state for immediate UI updates
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const supplyChainContext = useMemo(() => {
    const context = {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodeTypes: Array.from(new Set(nodes.map(n => n.data.type))),
      countries: Array.from(new Set(nodes.map(n => n.data.country).filter(Boolean))),
    };
    return JSON.stringify(context, null, 2);
  }, [nodes, edges]);

  const autosuggestionsConfig = useMemo(() => {
    const config = {
      textareaPurpose:
        'Generate a detailed summary for a supply chain. ' +
        'Use the following context to inform the description: ' +
        supplyChainContext,
      chatApiConfigs: {
        suggestionsApiConfig: {},
      },
    };

    if (useLiteModel) {
      (config.chatApiConfigs.suggestionsApiConfig as any).endpoint = '/api/copilotkitlitemodel';
    }

    return config;
  }, [supplyChainContext, useLiteModel]);

  // Debounced URL parameter updates
  const debouncedSetNameParam = useCallback(
    debounce((value: string) => {
      setNameParam(value);
    }, 500),
    [setNameParam]
  );

  const debouncedSetDescriptionParam = useCallback(
    debounce((value: string) => {
      setDescriptionParam(value);
    }, 500),
    [setDescriptionParam]
  );

  // Initialize values from URL params or props when dialog opens
  useEffect(() => {
    if (isOpen) {
      const initialNameValue = nameParam ?? initialName ?? 'Default Supply Chain';
      const initialDescValue = descriptionParam ?? initialDescription ?? '';
      
      setName(initialNameValue);
      setDescription(initialDescValue);
    }
  }, [isOpen, nameParam, descriptionParam, initialName, initialDescription]);

  // Update URL params when local values change
  useEffect(() => {
    if (isOpen && name !== (nameParam || initialName)) {
      debouncedSetNameParam(name);
    }
  }, [name, nameParam, initialName, isOpen, debouncedSetNameParam]);

  useEffect(() => {
    if (isOpen && description !== (descriptionParam || initialDescription)) {
      debouncedSetDescriptionParam(description);
    }
  }, [description, descriptionParam, initialDescription, isOpen, debouncedSetDescriptionParam]);

  useEffect(() => {
    setUseLiteModel(isOpen);
  }, [isOpen, setUseLiteModel]);

  // Validate form inputs
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Supply chain name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Supply chain name must be at least 3 characters';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Supply chain name must be less than 50 characters';
    }

    if (description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save action
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(name.trim(), description.trim());
      handleClose();
    } catch (error) {
      toast.error('Failed to save supply chain. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    // Clear URL parameters when dialog closes successfully
    setNameParam(null);
    setDescriptionParam(null);
    
    setName(initialName);
    setDescription(initialDescription);
    setErrors({});
    setIsLoading(false);
    onClose();
  };

  // Handle key press events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  // Handle input changes with immediate local state update
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg w-full mx-4 p-8 rounded-xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Save Supply Chain
          </DialogTitle>
          <DialogDescription className="text-base text-gray-500 dark:text-gray-400">
            Provide a name and description for your supply chain configuration. 
            This will help you identify and manage it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-6">
          {/* Supply Chain Name Input */}
          <div className="space-y-2">
            <label htmlFor="supply-chain-name" className="text-base font-medium text-gray-800 dark:text-gray-200">
              Supply Chain Name *
            </label>
            <Input
              id="supply-chain-name"
              type="text"
              placeholder="e.g., Global Electronics Supply Chain"
              value={name}
              onChange={handleNameChange}
              onKeyPress={handleKeyPress}
              className={cn(
                'border border-gray-300 text-base p-4 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700',
                {
                  'border-red-500 focus-visible:ring-red-500': errors.name,
                }
              )}
              maxLength={50}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                {errors.name}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {name.length}/50 characters
            </p>
          </div>

          {/* Supply Chain Description Textarea */}
          <div className="space-y-2">
            <label htmlFor="supply-chain-description" className="text-base font-medium text-gray-800 dark:text-gray-200">
              Description
            </label>
            <CopilotTextarea
              id="supply-chain-description"
              placeholder="Describe your supply chain configuration, key components, and objectives..."
              value={description}
              onValueChange={setDescription}
              className={cn(
                'border border-gray-300 h-[120px] resize-none text-base p-4 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 scrollbar-hide',
                {
                  'border-red-500 focus-visible:ring-red-500': errors.description,
                }
              )}
              maxLength={500}
              disabled={isLoading}
              autosuggestionsConfig={autosuggestionsConfig}
            />
            {errors.description && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                {errors.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1 text-base py-3 px-5 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="w-full sm:w-auto order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-base py-3 px-5 rounded-lg shadow-md"
          >
            <Save className="w-5 h-5 mr-2.5" />
            {isLoading ? 'Saving...' : 'Save Supply Chain'}
          </Button>
        </DialogFooter>

        <div className="text-sm text-gray-500 dark:text-gray-400 text-center pt-3">
          Press Ctrl + Enter to save quickly
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSupplyChainDialog; 