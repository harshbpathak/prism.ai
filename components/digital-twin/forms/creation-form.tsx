"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryState, parseAsInteger, parseAsString, parseAsArrayOf } from 'nuqs';
import { compressArchData, decompressArchData } from "@/lib/utils/url-compression";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FORM_STEPS } from "@/constants/supply-chain-form";
import { 
    formSchema, 
    FormData,
    SupplyChainInfoStep,
    LogisticsStep,
    RiskFactorsStep,
    CountrySelectionDialog
} from "./creation-form/index";

const steps = FORM_STEPS;

interface CreationFormProps {
  onSuccess: (data: FormData) => void;
  onCancel: () => void;
}

export default function CreationForm({ onSuccess, onCancel }: CreationFormProps) {
  const [step, setStep] = useQueryState('step', parseAsInteger.withDefault(0));
  const [showCountryDialog, setShowCountryDialog] = useState(false);
  
  // URL state for form data
  const [industryParam, setIndustryParam] = useQueryState('industry', parseAsString);
  const [customIndustryParam, setCustomIndustryParam] = useQueryState('customIndustry', parseAsString);
  const [productCharacteristicsParam, setProductCharacteristicsParam] = useQueryState('productCharacteristics', parseAsArrayOf(parseAsString));
  const [supplierTiersParam, setSupplierTiersParam] = useQueryState('supplierTiers', parseAsString);
  const [operationsLocationParam, setOperationsLocationParam] = useQueryState('operationsLocation', parseAsArrayOf(parseAsString));
  const [countryParam, setCountryParam] = useQueryState('country', parseAsString);
  const [currencyParam, setCurrencyParam] = useQueryState('currency', parseAsString);
  const [shippingMethodsParam, setShippingMethodsParam] = useQueryState('shippingMethods', parseAsArrayOf(parseAsString));
  const [annualVolumeTypeParam, setAnnualVolumeTypeParam] = useQueryState('annualVolumeType', parseAsString);
  const [annualVolumeValueParam, setAnnualVolumeValueParam] = useQueryState('annualVolumeValue', parseAsInteger);
  const [risksParam, setRisksParam] = useQueryState('risks', parseAsArrayOf(parseAsString));
  const [formParam, setFormParam] = useQueryState('form', parseAsString);
  
  // Determine initial default values
  const defaultValuesFromParams: FormData = {
    productCharacteristics: productCharacteristicsParam || [],
    operationsLocation: operationsLocationParam || [],
    shippingMethods: shippingMethodsParam || [],
    risks: risksParam || [],
    annualVolumeType: (annualVolumeTypeParam as "units" | "currency") || "units",
    annualVolumeValue: annualVolumeValueParam || 0,
    industry: industryParam || "",
    customIndustry: customIndustryParam || "",
    supplierTiers: supplierTiersParam || "",
    country: countryParam || "",
    currency: currencyParam || "",
  };

  let mergedDefaultValues: FormData = defaultValuesFromParams;
  if (formParam) {
    try {
      mergedDefaultValues = {
        ...mergedDefaultValues,
        ...decompressArchData(formParam) as Partial<FormData>,
      } as FormData;
    } catch (error) {
      console.error('Failed to decompress form data from URL:', error);
    }
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: mergedDefaultValues,
  });

  const watchOperationsLocation = form.watch("operationsLocation");

  const handleNext = async () => {
    const fields = steps[step].fields;
    const output = await form.trigger(fields as any, { shouldFocus: true });

    if (!output) return;

    if (step === 0 && watchOperationsLocation.includes('domestic') && !form.getValues("country")) {
      setShowCountryDialog(true);
      return;
    }

    if (step < steps.length - 1) {
        setStep(step + 1);
    } else {
        form.handleSubmit(onSubmit)();
    }
  };

  const handleCountryNext = async () => {
    const countryValid = await form.trigger(["country"], { shouldFocus: true });
    
    if (countryValid) {
      setShowCountryDialog(false);
      if (step < steps.length - 1) {
        setStep(step + 1);
      } else {
        form.handleSubmit(onSubmit)();
      }
    }
  };

  const handleBack = () => {
    setStep(Math.max(step - 1, 0));
  };
  
  const onSubmit = (data: FormData) => {
    // Store all form data in URL parameters
    setIndustryParam(data.industry);
    setCustomIndustryParam(data.customIndustry || null);
    setProductCharacteristicsParam(data.productCharacteristics);
    setSupplierTiersParam(data.supplierTiers);
    setOperationsLocationParam(data.operationsLocation);
    setCountryParam(data.country || null);
    setCurrencyParam(data.currency);
    setShippingMethodsParam(data.shippingMethods);
    setAnnualVolumeTypeParam(data.annualVolumeType);
    setAnnualVolumeValueParam(data.annualVolumeValue);
    setRisksParam(data.risks);
    
    console.log('Form data stored in URL parameters:', data);
    
    onSuccess(data);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <SupplyChainInfoStep />;
      case 1:
        return <LogisticsStep />;
      case 2:
        return <RiskFactorsStep />;
      default:
        return null;
    }
  }

  return (
    <FormProvider {...form}>
      <motion.div
        layout
        transition={{ 
          duration: 0.4, 
          ease: [0.4, 0.0, 0.2, 1],
          layout: { duration: 0.4 }
        }}
        className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl shadow-2xl shadow-slate-400/20 dark:shadow-black/50 border border-slate-200/80 dark:border-slate-700/60"
      >
        {/* Simplified Header */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              {steps[step].name}
            </h2>
            <Badge 
              variant="secondary" 
              className="px-3 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-sm"
            >
              Step {step + 1}/{steps.length}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="w-full bg-slate-200/80 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>
          
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <motion.div 
                className="px-6 pt-2 pb-4 space-y-5"
                layout
                transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
            >
                <AnimatePresence mode="wait">
                    {renderStep()}
                </AnimatePresence>
            </motion.div>
        
            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 pb-5 pt-4">
              <Button 
                onClick={() => {
                    setStep(0);
                    onCancel();
                }} 
                variant="ghost" 
                className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 rounded-lg"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleBack} 
                  disabled={step === 0} 
                  variant="outline" 
                  className="disabled:cursor-not-allowed shadow-sm border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all duration-200 rounded-lg"
                >
                    Back
                </Button>
                <Button 
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5 border-0 px-6 font-semibold rounded-lg"
                >
                  {step === steps.length - 1 ? "Create Digital Twin" : "Continue"}
                </Button>
              </div>
            </div>
        </form>
        </motion.div>

        <CountrySelectionDialog
            open={showCountryDialog}
            onOpenChange={setShowCountryDialog}
            onContinue={handleCountryNext}
        />
    </FormProvider>
  );
} 