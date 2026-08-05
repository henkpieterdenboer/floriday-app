---
updatedAt: 2025-04-28T11:19:49.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade items

## Target audience

* Customer organizations;
* Supplier organizations;
* Supplier warehouse organizations.

<br />

## Purpose

* Enable identification and specification of supplier horticultural trade items (e.g. flowers, plants, trees and composites) for use in all Floriday domains catalog, stock, supply, purchase and sales, fulfillment and payment and invoicing.

<br />

## Guidance

> 📘 Use the application
>
> Please use the Floriday application for *trade-items* and *trade-item variants* for a better understanding of the workflow and functions.
>
> The following explanation with video is available:
>
> * [Getting started with the catalog](https://helpcenter.floriday.com/en/articles/4599418-getting-started-with-the-catalog)
> * [Creating trade items in the catalog](https://helpcenter.floriday.com/en/articles/3923927-creating-trade-items-in-the-catalog)

**A Trade item contains:**

* Trade item Id that is used as a technical reference in the Floriday supply chain, including supplier-, customer- and warehouse applications;
* A supplier article code that is unique and is used as a trade item reference by the Supplier organization and should not be used as a technical reference by the Customer application.
* Name, optional GTIN;
* Plant Passport (Plants only, not applicable to Cut flowers), including:
  * Botanical name;
  * Country of origin (countryOfOriginIsoCodes);
* VBN productcode and VBN characteristics (at least mandatory);
  * This includes the mandatory characteristic S62, **Country of Origin**. Not to be confused with the **Country of Origin (countryOfOriginIsoCodes)** used in Plant Passports (see above).
* One or more product images;
* One or more packing configurations;
* Seasonal availability;
* Optional one or more customer organizations;
* Optional one or more trade item components (base-items);
* One or more **Package configurations**;
* Can be customer specific by adding one or more `customerOrganizationIds`. A ‘general’ trade item however, can not be changed into a customer-specific one, and vice versa;
* The supplier article code set by the supplier is mandatory and cannot be changed after the trade item is created;
* Botanical name and Country of origin are used to create Plantpassports;
* All trade items are visible to customers unless
  * It is explicitly hidden (IshiddenInCatalog is true ); or
  * The trade item is customer-specific, in which case it is only visible to specific organizations;
* 'IsHiddenInCatalog' is used in the trade items by supplier organizations to hide the trade item in the Floriday customer catalog application. Supplier organizations usually use these trade items for auctioning only;
* Use the current Floricode standards for product classification: VBN product code and VBN characteristics. These have there own implementation model (Linnaeus). For more info we refer tot [www.floricode.com](http://www.floricode.com);
* Can be soft-deleted by the Supplier. If supply and batches are created before deletion, they will stay available. New supply and batches cannot be created based on deleted trade items;

<br />

**Packing configuration in a Trade item**

* Contains:
  * VBN package code;
  * Optional custom package code;
  * Optional bunches per package;
  * Pieces per package;
  * Packages per layer;
  * Layers per loadcarrier;
  * Optional productimage with packing;
  * Optional one or more customer organizations;
  * Loadcarriertype;

> ❗️
>
> When adding a Packing configuration to a **Trade item**, the LoadCarrierType may not be "None". This value only exists because it's a valid option when processing **Fulfillment orders**.

* A packing configuration can have a custom package;
* A packing configuration can be selected in the sales order by the customer;\
  Trade item packing configurations are used for calculation of packing density, batch or supply availability in pieces, layers or loadcarriers;
* An image can be added to a packing configuration to represent the trade item in the corresponding package;
* A packing configuration can be customer (group) specific by adding specific customerOrganiztionIds.

<br />

**Trade item versions**

* For every trade item update a new trade item version is created, with the same trade item ID and a higher version number;
* Older versions of a trade item are archived;
* Trade item versions are commercially identical to each other and should only differ in added or changed optional data like optional characteristics, photo’s or added packing configurations.

<br />

**Deleting trade items**

* A trade item should only be deleted when it is not commercially available anymore. Frequent deletion interrupts the ( automated ) purchase process of customers.
* If a trade item is (soft) deleted and in use for supply, contracts or stock, the supply, contract and stock will stay available. New supply, contracts, stock cannot be created based on (soft) deleted trade items.

<br />

**Changing trade items**

* Only if a trade item is fundamentally changed it is advised to delete and create a new trade item instead of updating a trade item;
* If a trade item is further specified or if a trade item is corrected for a mistake it is advised to change a trade item e.g. adding an additional specifying characteristic or changing a VBN product code 'other' to a specific VBN product code.
* The supplier article code should remain unique for the supplier organization after changing the trade item.
* Please use with caution, as customers select and process trade items for their (automated) purchasing proces;
* Frequently deleting and re-uploading the entire catalog will result in unselected trade items and therefor less supply known with buyers.

<br />

**Trade items variants**

* Intended to bundle comparable trade items in the Floriday application and create a manageable catalog of trade items;
* Variants are only relevant to suppliers. For customers a trade item variant is used as any other trade item;
* Trade items variants can only vary in trade item characteristics;
* ‘Parent trade items’: Trade items that are part of the primary assortment of a supplier;
* ‘Child trade items’: Trade items that are variants of the parent trade item;
* All parent- and child trade items are unique trade items;
* The child trade item refers to the parent trade item ID;
* If the parent trade item is (soft) deleted, all the child trade items are (soft) deleted;
* Floriday always creates a new trade item for a new trade item variant and creates a new supplier article code by adding a letter to the inherited supplier article code of the parent.

<br />

## Implementation model

![](https://files.readme.io/5bcff7d-Screenshot_2022-02-17_at_16.32.34.png "Screenshot 2022-02-17 at 16.32.34.png")

<br/>
<br/>

## Interaction model Trade items and variants

![](https://files.readme.io/d3543f8-Screenshot_2022-02-14_at_22.33.49.png "Screenshot 2022-02-14 at 22.33.49.png")