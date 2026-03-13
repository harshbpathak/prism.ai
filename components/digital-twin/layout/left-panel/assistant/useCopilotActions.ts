"use client"

import { useMemo } from 'react';
import { useCopilotReadable } from "@copilotkit/react-core";
import { Node, Edge } from 'reactflow';
import { validateSupplyChain, getValidationSummary, ValidationIssue } from '@/lib/validation/supply-chain-validator';
import { 
  useNodeActions,
  useEdgeActions,
  useCanvasActions,
  useValidationActions,
  useTemplateActions,
  useSearchActions,
  useRiskActions,
  useAdvancedNodeActions,
  useAdvancedEdgeActions,
  useAdvancedRiskActions,
  useVisualPerformanceActions
} from './actions';

interface UseCopilotActionsProps {
  nodes: Node[];
  edges: Edge[];
  onAddNode?: (nodeType: string, label: string, enhancedData?: any) => void;
  onAddMultipleNodes?: (nodes: Partial<Node>[]) => void;
  onAddMultipleEdges?: (edges: Partial<Edge>[]) => void;
  onLoadTemplate?: (templateId: string) => void;
  onClearCanvas?: () => void;
  onValidateSupplyChain?: () => void;
  onUpdateNode?: (nodeId: string, properties: object) => void;
  onDeleteNode?: (nodeId: string) => void;
  onUpdateMultipleNodes?: (nodeIds: string[], properties: object) => void;
  onUpdateNodePositions?: (nodePositions: { [nodeId: string]: { x: number; y: number } }) => void;
  onFindAndSelectNode?: (nodeId: string) => void;
  onUpdateEdge?: (edgeId: string, properties: object) => void;
  onFindAndSelectEdges?: (edgeIds: string[]) => void;

  onHighlightNodes?: (nodeIds: string[]) => void;
  // Additional handlers for advanced actions
  onFocusNode?: (nodeId: string) => void;
  onZoomToNodes?: (nodeIds: string[]) => void;
  onGetNodeConnections?: (nodeId: string) => Edge[];
  onAnalyzeNetworkPaths?: (sourceId: string, targetId: string) => void;
  onBulkUpdateEdges?: (edgeIds: string[], properties: object) => void;
  onCreateNodeGroup?: (nodeIds: string[], groupName: string) => void;
  onExportSubgraph?: (nodeIds: string[]) => void;
}

export const useCopilotActions = (props: UseCopilotActionsProps) => {
  const { nodes, edges } = props;
  // console.log("useCopilotActions props:", props);  
  // Generate unique action names to prevent conflicts
  const panelId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  // Comprehensive validation analysis
  const validationIssues = useMemo(() => validateSupplyChain(nodes, edges), [nodes, edges]);
  const validationSummary = useMemo(() => getValidationSummary(validationIssues), [validationIssues]);

  // Action context for all action hooks
  const actionContext = {
    nodes,
    edges,
    panelId,
    props
  };

  // Initialize all action hooks - Core actions (Phase 1)
  useNodeActions(actionContext);
  useEdgeActions(actionContext);
  useCanvasActions(actionContext);
  useValidationActions(actionContext);
  useTemplateActions(actionContext);
  useSearchActions(actionContext);
  useRiskActions(actionContext);

  // Initialize advanced action hooks (Phases 2-5)
  useAdvancedNodeActions(actionContext);
  useAdvancedEdgeActions(actionContext);
  useAdvancedRiskActions(actionContext);
  useVisualPerformanceActions(actionContext);

  // Enhanced nodes data with validation context
  const nodesData = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      label: node.data?.label || 'Untitled',
      position: node.position,
      data: {
        // Core properties
        description: node.data?.description,
        country: node.data?.country || node.data?.location?.country,
        address: node.data?.address,
        type: node.data?.type,
        
        // Common properties
        capacity: node.data?.capacity,
        leadTime: node.data?.leadTime,
        riskScore: node.data?.riskScore,
        
        // Supplier-specific
        supplierTier: node.data?.supplierTier,
        supplyCapacity: node.data?.supplyCapacity,
        materialType: node.data?.materialType,
        reliabilityPct: node.data?.reliabilityPct,
        
        // Factory-specific
        productionCapacity: node.data?.productionCapacity,
        cycleTime: node.data?.cycleTime,
        utilizationPct: node.data?.utilizationPct,
        yieldRate: node.data?.yieldRate,
        
        // Warehouse-specific
        storageCapacity: node.data?.storageCapacity,
        temperatureControl: node.data?.temperatureControl,
        storageCostPerUnit: node.data?.storageCostPerUnit,
        handlingCostPerUnit: node.data?.handlingCostPerUnit,
        
        // Distribution-specific
        fleetSize: node.data?.fleetSize,
        deliveryRangeKm: node.data?.deliveryRangeKm,
        serviceLevelPct: node.data?.serviceLevelPct,
        
        // Retailer-specific
        demandRate: node.data?.demandRate,
        shelfSpaceCap: node.data?.shelfSpaceCap,
        reorderPoint: node.data?.reorderPoint,
        
        // External dependencies
        dependsOnExternalCompany: node.data?.dependsOnExternalCompany,
        externalCompanyName: node.data?.externalCompanyName,
        externalCompanyCountry: node.data?.externalCompanyCountry,
        externalCompanyDescription: node.data?.externalCompanyDescription
      }
    })),
    totalNodes: nodes.length,
    nodeTypes: [...new Set(nodes.map(n => n.data?.type))],
    hasConnections: edges.length > 0,
    validation: {
      errors: validationSummary.errors,
      warnings: validationSummary.warnings,
      canSave: validationSummary.canSave,
      criticalIssues: validationIssues.filter(issue => issue.severity === 'error').slice(0, 5)
    }
  };
  
  // console.log("🔍 CopilotReadable - Enhanced Nodes Data:", nodesData);
  
  useCopilotReadable({
    description: "Current supply chain canvas nodes with their comprehensive configurations and validation status",
    value: nodesData
  });

  // Enhanced edge/connection information with risk analysis
  const edgesData = {
    connections: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      mode: edge.data?.mode || 'road',
      cost: edge.data?.cost || 0,
      transitTime: edge.data?.transitTime || 0,
      riskMultiplier: edge.data?.riskMultiplier || 1,
      
      // Risk and disruption data
      avgDelayDays: edge.data?.avgDelayDays,
      frequencyOfDisruptions: edge.data?.frequencyOfDisruptions,
      hasAltRoute: edge.data?.hasAltRoute,
      altRouteDetails: edge.data?.altRouteDetails,
      passesThroughChokepoint: edge.data?.passesThroughChokepoint,
      chokepointNames: edge.data?.chokepointNames
    })),
    totalConnections: edges.length,
    riskConnections: edges.filter(e => (e.data?.frequencyOfDisruptions || 0) > 2).length,
    chokepointRoutes: edges.filter(e => e.data?.passesThroughChokepoint).length
  };
  
  // console.log("🔍 CopilotReadable - Enhanced Edges Data:", edgesData);
  
  useCopilotReadable({
    description: "Current supply chain connections with transportation routes and risk assessments",
    value: edgesData
  });

  // Enhanced supply chain analysis
  const supplyChainAnalysis = {
    structure: {
      nodeCount: nodes.length,
      connectionCount: edges.length,
      nodeTypes: [...new Set(nodes.map(n => n.type))],
      countries: [...new Set(nodes.map(n => n.data?.country || n.data?.location?.country).filter(Boolean))],
      avgRiskScore: nodes.length > 0 ? 
        nodes.reduce((sum: number, n: Node) => sum + (n.data?.riskScore || 0), 0) / nodes.length : 0
    },
    validation: validationSummary,
    recommendations: [] // Recommendations are now handled by validation actions
  };
  
  useCopilotReadable({
    description: "Comprehensive supply chain analysis including structure, validation, and recommendations",
    value: supplyChainAnalysis
  });

  // All actions are now handled by separate action hooks

  return {
    nodesData,
    edgesData,
    validationSummary,
    supplyChainAnalysis
  };
};

