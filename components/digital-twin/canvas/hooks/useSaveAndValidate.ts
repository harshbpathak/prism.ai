"use client";

import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

import { useUser } from '@/lib/stores/user';
import { saveSupplyChainToDatabase } from '@/lib/api/supply-chain';
import { validateSupplyChain, ValidationIssue } from '@/lib/validation/supply-chain-validator';
import { decompressArchData } from '@/lib/utils/url-compression';

export function useSaveAndValidate({
  nodes,
  edges,
  supplyChainName,
  description,
  selectedSupplyChain,
}: {
  nodes: Node[];
  edges: Edge[];
  supplyChainName: string;
  description: string;
  selectedSupplyChain: string;
}) {
  const { userData } = useUser();
  const router = useRouter();
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const performSave = useCallback(async (): Promise<string | null> => {
    setIsSaving(true);
    try {
      const connections = edges.map(edge => {
        const sourceNode = nodes.find(node => node.id === edge.source);
        const targetNode = nodes.find(node => node.id === edge.target);
        return {
          sourceId: edge.source, targetId: edge.target, sourceLabel: sourceNode?.data.label, targetLabel: targetNode?.data.label,
          mode: edge.data.mode, cost: edge.data.cost, transitTime: edge.data.transitTime, riskMultiplier: edge.data.riskMultiplier
        };
      });
      // Ensure each node carries its on-screen position when persisted. This duplicates the position
      // into the `data` payload so that the backend – which already stores the `data` column as JSON –
      // receives the coordinates even if it strips unknown top-level properties.
      const nodesWithPositions = nodes.map((node) => ({
        ...node,
        data: {
          ...(node.data || {}),
          /** Store position explicitly so it survives backend transformations */
          position: node.position,
        },
      }));
      const urlParams = new URLSearchParams(window.location.search);
      const saveNameFromUrl = urlParams.get('saveName');
      const saveDescriptionFromUrl = urlParams.get('saveDescription');
      const finalSupplyChainName = saveNameFromUrl || supplyChainName;
      const finalDescription = saveDescriptionFromUrl || description;
      
      // Extract form data: prioritize compressed 'form' param, fallback to individual params
      let formDataFromUrl = null;
      const compressedForm = urlParams.get('form');
      
      if (compressedForm) {
        try {
          formDataFromUrl = decompressArchData(compressedForm);
        } catch (error) {
          console.error('❌ Failed to decompress form data from URL:', error);
          // Fall through to individual param extraction
        }
      }
      
      // Fallback: extract from individual URL parameters (legacy support)
      if (!formDataFromUrl) {
        formDataFromUrl = {
          industry: urlParams.get('industry'), 
          customIndustry: urlParams.get('customIndustry'),
          productCharacteristics: urlParams.get('productCharacteristics')?.split(',') || [],
          supplierTiers: urlParams.get('supplierTiers'), 
          operationsLocation: urlParams.get('operationsLocation')?.split(',') || [],
          country: urlParams.get('country'), 
          currency: urlParams.get('currency'), 
          shippingMethods: urlParams.get('shippingMethods')?.split(',') || [],
          annualVolumeType: urlParams.get('annualVolumeType'),
          annualVolumeValue: urlParams.get('annualVolumeValue') ? parseInt(urlParams.get('annualVolumeValue')!) : null,
          risks: urlParams.get('risks')?.split(',') || []
        };
      }
      let formDataFromLocalStorage = null;
      try {
        const storedData = localStorage.getItem(`supplyChain-${selectedSupplyChain}`);
        if (storedData) formDataFromLocalStorage = JSON.parse(storedData);
      } catch (error) { console.error('Error parsing localStorage data:', error); }
      const supplyChainData = {
        id: selectedSupplyChain, name: finalSupplyChainName, description: finalDescription,
        nodes: nodesWithPositions, edges, connections, timestamp: new Date().toISOString(),
        formData: formDataFromLocalStorage || formDataFromUrl,
        organisation: {
          id: userData?.id, name: userData?.organisation_name, description: userData?.description,
          industry: userData?.industry, sub_industry: userData?.sub_industry, location: userData?.location
        }
      };
      const savedData = await saveSupplyChainToDatabase(supplyChainData);
      toast.success('Supply chain saved successfully!');

      // Notify interested components (e.g., SimulationToolbar) that the supply chain
      // has been saved and provide the new supply_chain_id so that follow-up dialogs
      // like IntelligenceAnalysisDialog can be opened consistently.
      if (typeof window !== 'undefined' && savedData?.supply_chain_id) {
        window.dispatchEvent(
          new CustomEvent('supply_chain_saved', {
            detail: { supplyChainId: savedData.supply_chain_id },
          })
        );
      }
      setShowValidationDialog(false);
      if (saveNameFromUrl || saveDescriptionFromUrl) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('saveName');
        newUrl.searchParams.delete('saveDescription');
        window.history.replaceState({}, '', newUrl.toString());
      }
      return savedData.supply_chain_id;
    } catch (error) {
      console.error('Error saving supply chain:', error);
      toast.error('Failed to save supply chain.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, selectedSupplyChain, supplyChainName, description, userData, router]);

  const handleSave = useCallback(async (): Promise<string | null> => {
    try {
      const issues = validateSupplyChain(nodes, edges);
      
      setValidationIssues(issues);
      const errors = issues.filter(issue => issue.severity === 'error');
      
      // Only block on hard errors, not warnings
      if (errors.length > 0) {
        setShowValidationDialog(true);
        return null;
      }
      
      // Warnings: show dialog but proceed with save anyway
      const warnings = issues.filter(issue => issue.severity === 'warning');
      if (warnings.length > 0) {
        console.warn('⚠️ [Save] Proceeding with warnings:', warnings.map(w => w.message));
      }
      
      return await performSave();
    } catch (error) {
      console.error('❌ [useSaveAndValidate] Error during handleSave:', error);
      console.error('❌ [useSaveAndValidate] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error
      });
      throw error;
    }
  }, [nodes, edges, performSave]);

  const handleValidateSupplyChain = useCallback(() => {
    const issues = validateSupplyChain(nodes, edges);
    setValidationIssues(issues);
    setShowValidationDialog(true);
  }, [nodes, edges]);

  return {
    handleSave,
    performSave,
    isSaving,
    validationIssues,
    showValidationDialog,
    setShowValidationDialog,
    handleValidateSupplyChain,
  };
} 