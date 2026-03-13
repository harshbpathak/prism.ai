# Node Types

This document outlines the different types of nodes used in the supply chain digital twin templates.

---

### 1. Supplier Node (`supplierNode`)

*   **Type:** Supplier
*   **Description:** Represents entities that provide raw materials, components, or finished goods. This can include farms, chemical plants, parts manufacturers, and other vendors at various tiers in the supply chain.
    *   *Examples:*
        *   `Chemical Supplier`: Licensed hazardous materials supplier.
        *   `Luxury Component Supplier`: High-end materials with premium quality.
        *   `Regional Supplier`: Local supplier within a specific region.
        *   `Asian Supplier`: Primary APAC supplier hub.
        *   `Steel Supplier`: Tier 3 raw steel supplier.
        *   `Semiconductor Supplier`: Tier 3 chip manufacturer.
        *   `Coal Mine`: Large-scale coal extraction operation.
        *   `Cotton Farm`: Tier 3 organic cotton supplier.
        *   `Organic Farm`: Fresh produce supplier with cold storage.
        *   `API Manufacturer`: FDA-approved Active Pharmaceutical Ingredients.
        *   `Tier 1 Supplier`: Direct supplier with complete component assembly.
        *   `Raw Material Supplier`: Tier 3 raw material extraction and processing.

### 2. Factory Node (`factoryNode`)

*   **Type:** Factory
*   **Description:** Represents manufacturing, processing, or assembly facilities where products are made or transformed.
    *   *Examples:*
        *   `HAZMAT Processing`: Specialized hazardous materials processing.
        *   `Secure Assembly`: High-security manufacturing with quality controls.
        *   `Central Manufacturing`: Main production facility.
        *   `Assembly Plant`: Final vehicle assembly.
        *   `Assembly Factory`: Tier 1 final assembly facility for electronics.
        *   `Power Generation Plant`: Coal-fired electricity generation facility.
        *   `Textile Mill`: Tier 2 fabric production facility.
        *   `Processing Plant`: Food processing with HACCP compliance.
        *   `GMP Manufacturing`: Good Manufacturing Practice certified facility.
        *   `Final Assembly`: Complex final product assembly.

### 3. Warehouse Node (`warehouseNode`)

*   **Type:** Warehouse
*   **Description:** Represents storage facilities, distribution centers, or staging areas where goods are held.
    *   *Examples:*
        *   `Certified Storage`: DOT-certified hazardous materials storage.
        *   `Regional DC`: Central regional distribution hub.
        *   `Global Coordination Center`: Central planning and coordination hub.
        *   `Parts Staging`: JIT sequencing and staging facility.
        *   `West Coast DC`: Primary distribution center for electronics.
        *   `Rail Loading Terminal`: Bulk commodity rail loading facility.
        *   `Seasonal DC`: Pre-season inventory buildup facility.
        *   `Cold Storage DC`: Temperature-controlled distribution center.
        *   `QA/QC Warehouse`: Quality assurance and regulatory compliance hub.
        *   `Distribution Center`: Finished goods distribution.

### 4. Distribution Node (`distributionNode`)

*   **Type:** Distribution
*   **Description:** Represents the logistics and transport network responsible for moving goods between locations, including final delivery.
    *   *Examples:*
        *   `HAZMAT Transport`: Specialized hazardous materials transport.
        *   `Premium Distribution`: White-glove delivery service.
        *   `Local Distribution`: Last-mile delivery network.
        *   `APAC Distribution`: Asia-Pacific regional distribution.
        *   `Dealership Network`: Regional dealership distribution.
        *   `Retail Distribution`: Final mile to retail stores.
        *   `Electrical Grid`: Regional electrical distribution network.
        *   `Fast Fashion Retail`: Rapid distribution to retail chains.
        *   `Regional Distribution`: Last-mile cold chain delivery.
        *   `Specialty Pharmacy`: Temperature-controlled specialty distribution.
        *   `Global Distribution`: Worldwide distribution network coordination.

### 5. Port Node (`portNode`)

*   **Type:** Port
*   **Description:** Represents major shipping hubs like sea ports or air freight terminals where goods enter or exit a region.
    *   *Examples:*
        *   `Air Freight Hub`: Express air shipping for high-value goods.
        *   `Singapore Hub`: APAC shipping and logistics hub.
        *   `Singapore Port`: Major Asian shipping hub for electronics.
        *   `Ho Chi Minh Port`: Container shipping to global markets. 

### 6. Retailer Node (`retailerNode`)

*   **Type:** Retailer
*   **Description:** Represents the final point of sale in the supply chain, such as physical stores or online platforms where consumers purchase the product. This node type was not found in the existing templates but is added here for completeness. 