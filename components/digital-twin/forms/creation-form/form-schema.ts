import { z } from "zod";

export const formSchema = z.object({
    industry: z.string().min(1, "Industry is required."),
    customIndustry: z.string().optional(),
    productCharacteristics: z.array(z.string()).min(1, "At least one characteristic must be selected."),
    supplierTiers: z.string().min(1, "Supplier tier is required."),
    operationsLocation: z.array(z.string()).min(1, "At least one location must be selected."),
    country: z.string().optional(),
    currency: z.string().min(1, "Currency is required."),
    shippingMethods: z.array(z.string()).min(1, "At least one shipping method must be selected."),
    annualVolumeType: z.enum(["units", "currency"]),
    annualVolumeValue: z.number().positive("Annual volume must be a positive number."),
    risks: z.array(z.string()).min(1, "At least one risk must be selected."),
}).refine(data => {
    if (data.industry === 'Other') {
        return !!data.customIndustry && data.customIndustry.length > 0;
    }
    return true;
}, {
    message: "Please specify the industry",
    path: ["customIndustry"],
}).refine(data => {
    if (data.operationsLocation.includes('domestic')) {
        return !!data.country && data.country.length > 0;
    }
    return true;
}, {
    message: "Please select a country for domestic operations",
    path: ["country"],
});

export type FormData = z.infer<typeof formSchema>; 