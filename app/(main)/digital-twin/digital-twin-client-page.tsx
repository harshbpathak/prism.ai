'use client';

import { useState, useEffect } from 'react';
import { useQueryState, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs';
import { decompressArchData } from '@/lib/utils/url-compression';
import { Header } from '@/components/header';
import DigitalTwinDashboard from '@/components/digital-twin/display/dashboard';
import CreationForm from '@/components/digital-twin/forms/creation-form';
import DigitalTwinCanvas from '@/components/digital-twin/canvas/digital-twin-canvas';
import { selectTemplate, getTemplateInfo } from '@/lib/template-selector';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import DigitalTwinEditSkeleton from '@/components/digital-twin/display/DigitalTwinEditSkeleton';

export default function DigitalTwinClientPage() {
  const [twinId, setTwinId] = useQueryState('twinId', parseAsString);
  const [view, setView] = useQueryState('view', parseAsString);
  const [archParam] = useQueryState('arch', parseAsString);
  const [formParam] = useQueryState('form', parseAsString);
  const [activeTwinData, setActiveTwinData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL state for form data - to recreate twin from URL parameters
  const [industryParam] = useQueryState('industry', parseAsString);
  const [customIndustryParam] = useQueryState('customIndustry', parseAsString);
  const [productCharacteristicsParam] = useQueryState('productCharacteristics', parseAsArrayOf(parseAsString));
  const [supplierTiersParam] = useQueryState('supplierTiers', parseAsString);
  const [operationsLocationParam] = useQueryState('operationsLocation', parseAsArrayOf(parseAsString));
  const [countryParam] = useQueryState('country', parseAsString);
  const [currencyParam] = useQueryState('currency', parseAsString);
  const [shippingMethodsParam] = useQueryState('shippingMethods', parseAsArrayOf(parseAsString));
  const [annualVolumeTypeParam] = useQueryState('annualVolumeType', parseAsString);
  const [annualVolumeValueParam] = useQueryState('annualVolumeValue', parseAsInteger);
  const [risksParam] = useQueryState('risks', parseAsArrayOf(parseAsString));

  // Determine if header should be shown (only when neither twinId nor arch are present)
  const shouldShowHeader = !twinId && !archParam;

  // Helper to check compressed form data or legacy individual params
  const hasFormDataInUrl = () => {
    return (
      !!formParam || (
        industryParam && 
        productCharacteristicsParam && 
        supplierTiersParam && 
        operationsLocationParam && 
        currencyParam && 
        shippingMethodsParam && 
        annualVolumeTypeParam && 
        annualVolumeValueParam && 
        risksParam
      )
    );
  };

  // Load twin data when twinId changes
  useEffect(() => {
    if (twinId) {
      setIsLoading(true);
      
      // If there's an arch parameter, we'll let the canvas handle the state
      // Only load from localStorage if there's no arch parameter
      if (!archParam) {
        // First, try to recreate twin from URL parameters if available
        if (formParam) {
          try {
            const formDataFromUrl = decompressArchData(formParam);

            console.log('🔄 Recreating twin from COMPRESSED URL parameters...');

            // Select template based on decompressed form data
            const { nodes, edges } = selectTemplate(formDataFromUrl);
            const templateInfo = getTemplateInfo(formDataFromUrl);

            const twinData = {
              ...formDataFromUrl,
              nodes,
              edges,
              templateInfo,
              createdAt: new Date().toISOString(),
            };

            console.log('✅ Twin recreated from COMPRESSED URL:', twinData);
            setActiveTwinData(twinData);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error recreating twin from compressed form param:', error);
          }
        } else if (hasFormDataInUrl()) {
          console.log('🔄 Recreating twin from URL parameters...');
          
          const formDataFromUrl = {
            industry: industryParam!,
            customIndustry: customIndustryParam || "",
            productCharacteristics: productCharacteristicsParam!,
            supplierTiers: supplierTiersParam!,
            operationsLocation: operationsLocationParam!,
            country: countryParam || "",
            currency: currencyParam!,
            shippingMethods: shippingMethodsParam!,
            annualVolumeType: annualVolumeTypeParam as "units" | "currency",
            annualVolumeValue: annualVolumeValueParam!,
            risks: risksParam!
          };

          try {
            // Select the appropriate template based on form data
            const { nodes, edges } = selectTemplate(formDataFromUrl);
            const templateInfo = getTemplateInfo(formDataFromUrl);

            const twinData = {
              ...formDataFromUrl,
              nodes,
              edges,
              templateInfo,
              createdAt: new Date().toISOString()
            };

            console.log('✅ Twin recreated from URL parameters:', twinData);
            setActiveTwinData(twinData);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Error recreating twin from URL parameters:', error);
          }
        }

        // Fallback to localStorage
        const data = localStorage.getItem(`supplyChain-${twinId}`);
        if (data) {
          try {
            const parsedData = JSON.parse(data);
            setActiveTwinData(parsedData);
          } catch (error) {
            console.error('Error parsing twin data:', error);
            setActiveTwinData(null);
          }
        } else {
          console.error('No localStorage data found for twin:', twinId, 'Available keys:', Object.keys(localStorage));
          
          // Check if this might be a newly created twin that hasn't been properly saved yet
          const allStorageKeys = Object.keys(localStorage);
          const possibleTwinKey = allStorageKeys.find(key => key.startsWith('supplyChain-'));
          
          if (possibleTwinKey) {
            try {
              console.log('Found potential twin data in:', possibleTwinKey, 'trying to use it instead');
              const alternativeData = JSON.parse(localStorage.getItem(possibleTwinKey) || '{}');
              setActiveTwinData(alternativeData);
              setIsLoading(false);
              return;
            } catch (err) {
              console.error('Error parsing alternative twin data:', err);
            }
          }
          
          setActiveTwinData(null);
        }
      } else {
        // When arch param exists, set minimal twin data to indicate we have a twin
        // but let the canvas handle the actual node/edge state from the URL
        setActiveTwinData({ hasArchData: true });
      }
      setIsLoading(false);
    } else {
      setActiveTwinData(null);
      setIsLoading(false);
    }
  }, [twinId, archParam, formParam, industryParam, productCharacteristicsParam, supplierTiersParam, operationsLocationParam, currencyParam, shippingMethodsParam, annualVolumeTypeParam, annualVolumeValueParam, risksParam]);

  const handleCreationCancel = () => {
    setView(null, { scroll: false });
  };

  const handleCreationSuccess = (data: any) => {
    console.log('🚀 Supply chain created with form data:', data);
    console.log('📋 Form Data Details:', {
      industry: data.industry,
      customIndustry: data.customIndustry,
      productCharacteristics: data.productCharacteristics,
      supplierTiers: data.supplierTiers,
      operationsLocation: data.operationsLocation,
      country: data.country,
      currency: data.currency,
      shippingMethods: data.shippingMethods,
      annualVolumeType: data.annualVolumeType,
      annualVolumeValue: data.annualVolumeValue,
      risks: data.risks
    });

    // Select the appropriate template based on form data
    const { nodes, edges } = selectTemplate(data);
    const templateInfo = getTemplateInfo(data);

    console.log(`🎯 Selected template: ${templateInfo.templateName} - ${templateInfo.reason}`);

    // Create dummy twin ID with current date
    const twinId = `twin-${Date.now()}`;
    
    // Store the template data temporarily for the canvas to use
    const twinData = {
      ...data,
      nodes,
      edges,
      templateInfo,
      createdAt: new Date().toISOString()
    };
    
    
    console.log('✅ Digital twin created with dummy ID:', twinId);
    console.log('💾 Template data stored temporarily:', twinData);
    
    // Store the data in localStorage so it can be retrieved when loading the canvas
    localStorage.setItem(`supplyChain-${twinId}`, JSON.stringify(twinData));
    console.log('💾 Template data stored in localStorage with key:', `supplyChain-${twinId}`);
    
    // Close the dialog
    setView(null, { scroll: false });
    
    // Set the twin ID to show the canvas
    setTwinId(twinId);
  };

  // If a twinId is present, we would show the canvas/details view.
  if (twinId) {
    if (isLoading) {
      return <DigitalTwinEditSkeleton />;
    }

    if (activeTwinData) {
      // If we have arch data in URL, let the canvas handle state entirely
      if (activeTwinData.hasArchData) {
        return <DigitalTwinCanvas />;
      }
      
      // Otherwise, use the localStorage data if available
      if (activeTwinData.nodes && activeTwinData.edges) {
        return (
          <DigitalTwinCanvas
            initialNodes={activeTwinData.nodes}
            initialEdges={activeTwinData.edges}
          />
        );
      }
    }

    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">Digital twin not found.</p>
          <button
            onClick={() => setTwinId(null)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // The dashboard is always rendered, and the dialog is overlaid on top.
  return (
    <>
      {shouldShowHeader && <Header title="Digital Twin" />}
      <main className={shouldShowHeader ? "flex-1 overflow-auto" : ""}>
        <DigitalTwinDashboard />
      </main>
      <Dialog
        open={view === 'create'}
        onOpenChange={(isOpen) => !isOpen && setView(null, { scroll: false })}
      >
        <DialogContent className="sm:max-w-2xl p-0" hideCloseIcon={true}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Create a New Digital Twin
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Fill out the steps below to build your supply chain model.
            </DialogDescription>
          </DialogHeader>
          <CreationForm
            onSuccess={handleCreationSuccess}
            onCancel={handleCreationCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 