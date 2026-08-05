---
updatedAt: 2025-04-28T14:03:06.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Customer delivery

## Target audience

* Customer organizations;
* Supplier organizations;
* Supplier warehouse organizations;
* External stock warehouse organizations.

<br />
## Purpose

* Enables fulfillment of customer delivery of goods (batches) by supplier (external) despatch warehouse organizations;
* Enables communication and placement of customer stickers, logistic loadcarrier labels (delivery notes/SSCC labels) and logistic batch stickers on goods;
* Enables planning and incoming of goods by the customer organization with advanced shipment notices;
* Enables planning and incoming of goods by the logistic hubs with inbound fulfillment orders;
* Enables updating the reusable logistic means balance of the supplier organizations, customer organizations and if applicable package organizations;
* Enables financial settlement of the goods and logistic means based on the fulfillment orders and corrections created by the supplier organizations;
* Enables multiplication of plantpassports by customer organizations;
* Enables planning of transport of customer delivery of goods (batches) by a carrier organisation.

<br />
## General guidance

> 📘 **Note**
>
> Use the application
>
> Please use the Floriday modules *stock* *delivery orders*, *fulfillment orders* and *stickers* and *sales orders* for supplier and supplier warehouse organizations and *purchase orders* and *stickers* for customer organizations for a better understanding of the workflow and functions. The ASN is currently a Customer API only feature.

<br />
* Supplier (external) warehouse organizations can deliver goods (batches) from their despatch warehouses to customer destination locations based on sales orders in Floriday;
* Supplier external warehouse organizations (e.g. import agents) can provide customer delivery services to other suppliers (e.g. international growers); For details on goods movement to external warehouse organizations see [Goods movements](https://developer.floriday.io/docs/goods-movement);
* Delivery order and fulfillment order events can be received with webhooks by the Supplier (external) warehouse organizations. See `[Webhooks]`(webhooks)

<br />

> 📘 **Note**
>
> Further guidance
>
> Further detailed guidance is mentioned per topic (Customer delivery orders, Fulfillment orders, Advanced shipment notices, etc.) via the interaction model.

<br />
## Implementation model

![](https://files.readme.io/2455d2d-Screenshot_2022-05-09_at_16.23.10.png "Screenshot 2022-05-09 at 16.23.10.png")

<br />
## Interaction model

![](https://files.readme.io/83b65ac-Screenshot_2022-08-11_at_16.09.21.png "Screenshot 2022-08-11 at 16.09.21.png")

<br />
1,2 5,6) [**Stickers via Floriday**](https://developer.floriday.io/docs/customer-stickers) can be provided by customer organizations to supplier (external) warehouses based on sales orders.

3,4) [**Customer delivery orders**](https://developer.floriday.io/docs/customer-delivery-1#customer-delivery-orders) containing fulfillment requests which are created by Floriday based on direct sales orders in Floriday as a basis for fulfillment by the supplier (external) warehouses.

5,6) [**Batch stickers**](https://developer.floriday.io/docs/customer-delivery-1#batch-stickers) for the for the supplier (external) warehouses are automatically created by fulfillment requests in Floriday. These need to be placed on the packages if required by the customer organization.

7,8) [**Fulfillment orders**](customer-delivery-1#fulfillment-orders) are created by the supplier (external) warehouse organizations based on the fulfillment requests in the Customer delivery orders.

8,9) [**Advanced Shipment Notices (ASN)**](https://developer.floriday.io/docs/customer-delivery-1#advanced-shipment-notices) for customer organizations are automatlically created by \[fulfillment orders in Floriday.

10,11) [**Logistic-labels (Delivery notes)**](https://developer.floriday.io/docs/customer-delivery-1#logistic-labels) are automatically created by fulfillment orders in Floriday.

10,12) [**Logistic means balance**](https://developer.floriday.io/docs/customer-delivery-1#logistic-means) of reusable logistic means of supplier organizations, customer organizations (and if applicable package organizations)  is automatically updated by fulfillment orders in Floriday.

13,14) [**Financial settlement**](https://developer.floriday.io/docs/customer-delivery-1#financial-settlement) of goods and logistic means based on (part of) sales orders and fulfillment orders is automatically initiated by a fulfillment order in Floriday.

13,15) **Inbound fulfillment orders** for logistic hubs/cross dock warehouses are automatically created by fulfillment orders if a logistic hub is used.

16,17) [**Fulfillment order status**](https://developer.floriday.io/docs/customer-delivery-1#fulfillment-orders) status is updated in the fulfillment orders and Advanced Shipment Notices.

18,19,20) [**Mark customer stickers**](https://developer.floriday.io/docs/customer-stickers-1#receiving-customer-sticker-files-1) as printed (and placed) by supplier (external) warehouse organization for the customer organization.

21, 22, 26) **Goods** are **delivered** by a carrier organization from the despatch warehouse to the customer destination location. If applicable via a logistic hub / cross dock warehouse.\
Goods can be marked as received by customer organizations based on an ASN.

23, 24, 25) [**Mark goods as received**](https://developer.floriday.io/docs/customer-delivery-1#mark-goods-as-received) on load carrier level (logistic label) by the logistic hub / cross dock warehouse.

27, 28, 29) **Goods** can be [**marked as received**](https://developer.floriday.io/docs/customer-delivery-1#mark-goods-as-received) on load carrier level (logistic label) by the customer destination location.

30,31) [**Plantpassports**](https://developer.floriday.io/docs/customer-delivery-1#plantpassports) for customer organizations can be retrieved by customer organizations for 'multiplying' plantpassports.

<br />
## Customer delivery orders

* Are used by supplier (external) warehouse organizations;
* Are created by Floriday and contain fulfillment requests which are based on sales orders and created when the direct sales orders status is committed. Sales orders are committed if they can no longer be cancelled by customers;
* Group fulfillment requests by despatch warehouse, customer destination location, latest orderdate/time and latest delivery date/time;
* Fulfillment requests in the customer delivery orders can be corrected by accepted sales order corrections and sales order cancellations.
* Are fulfilled by fulfillment orders;
* Can be fulfilled in multiple fulfillment orders corresponding to the shipments (e.g. a fulfillment order for a shipment in the morning and a a fulfillment order for a shipment  in the afternoon);
* Contains:
  * Latest delivery Date Time;
  * Destination location;
  * Despatch warehouse Id;
  * Fulfillment status (true/false), 'true' if the fulfillment order is completely fulfilled;
  * Fulfillments requests containing:
    * Batch Id;
    * Number of packages;
    * Additional service Ids;
    * VBN package code in addition a custom package Id;
    * Pieces per package;
    * Loadcarrier type;
    * Servicecode;
    * Packing agent organization Id if logistic means of packing agent are owned by a packing agent organization. See [Logistic means](https://developer.floriday.io/docs/customer-delivery-1#logistic-means);
    * Nextlegidentifier is used by the customer organization in the sales order as a basis for grouping fulfillment requests on 'end customer' level by the suppier (external) warehouse organization in a fulfillment order for efficient cross dock handling by the customer organization;
    * Delivery Remarks are used by the customer organization in the sales order for additional logistic fulfillment instructions (e.g. "extra water", "place heavy boxes lower") for the Supplier (external) warehouse organization;
    * Fulfillment order claims containing fulfillment order Ids with claimed number of packages for actual overview of fulfilled (parts of) fulfillment requests of the Customer delivery order.

<br />
## Batch stickers

* Also named 'package stickers', 'package labels', 'batch stickers' or 'stickers'.
* Are used by supplier (external) warehouse organizations and customer organizations;
* Are automatically created by Floriday and contain batch stickers (PDF) based on fulfillment requests in customer delivery orders;
* Need to be placed on the packages if required by the customer organization;
* Are placed on packages by supplier (external) warehouse organizations;
* Are used by warehouses and customer organizations for incoming, handling and tracing of goods on batch/package level in a supply chain;
* Usage of batch stickers is currently in a pilot for customer delivery;
* Batch stickers contain batchreference (barcode), supplier article description, customer organization name, supplier organization name, 3 most important trade-item characteristics, service code, package code and number of pieces per package.

<br />
## Fulfillment orders

* Are created by Supplier (external) warehouse organizations and contain fulfilled (parts of) fulfillment requests from Customer delivery orders which batches are loaded on a loadcarrier;
* Contain fulfillment requests which have to be grouped by despatch warehouse, customer destination location, latest orderdate/time, latest delivery date/time and nextLegIdentifier based on Customer deliver orders;
* Contain fulfillment requests which are distributed among the load carriers resulting in fulfillment orders;
* The containing fulfillment requests can be corrected by accepted sales order corrections and sales order cancellations;
* Can be corrected by supplier organizations for loadcarrier type, number of additional layers and number of packages and delivery location GLN. The total number of packages of fulfillment request(s) in the fulfillment order(s) corresponding to a sales order can never be higher than the number of packages in the sales order;
* Can be updated by by supplier organizations for reducing the loadcarrier quantity. Loadcarrier(s) with highest sequence-number(s) will be removed first;
* Contains:
  * Logistic hub for handling by cross dock warehouses: RFH Aalsmeer, RFH Naaldwijk, RFH Rijnsburg, RFH Eelde, VRM Rhein Maas, Plantion Ede;
  * **NEW:** Optionally contains a delivery location GLN, which can differ from the location GLN in the sales order and fulfillment request;
    * Please note: For tax reasons, the country code of the optional GLN must match the GLN submitted from the sales order and fulfillment request;
    * Please note: Adding a different location GLN code in the fulfillment order or in the fulfillment order correction request will not cause a difference in delivery costs compared to the sales order;
    * Enables supplier to group sales orders from different locations in one fulfillment order;
  * One label Only for providing one logistic label (delivery note) for the fulfillment order instead of one logistic label per load carrier;
  * Load carrier type;
  * Number of additional layers in addition to the default layers provided with the loadcarrier;
  * Load carrier reference if available uniquely identifies the load carrier (e.g. RFID tag). Is also printed on the logistic label;
  * Time started order picking at to indicate when order picking has begun using the picklist orders feature in Floriday;
  * Fulfillment requests on a load carrier item containing:
    * Fulfillment request Id;
    * Number of packages;
    * Servicecode;
    * Packing agent organization Id if logistic means of packing agent are owned by a packing agent organization. See [Logistic means](https://developer.floriday.io/docs/customer-delivery-1#logistic-means)
    * Batch Id;
    * Trade item Id;
    * BatchReference;
    * LogisticLabelCode is created by Floriday after the fulfillment order is created in Floriday, is also the barcode of the logistic label;
    * Item position is the letter related to the item's position on the loadcarrier;
    * Delivery Remarks are intended for the Supplier warehouse organization employee responsible for the handling of the loadcarrier. Is also printed on the logistic label.;
    * Number of pieces picked is used to indicate how many pieces are picked using the picklist orders feature in Floriday.

<br />

> 🚧 **Warning**
>
> Maximum of 200 load carriers.
>
> Due to a technical limitation in the processing of fulfillment orders, the number of load carriers per fulfillmentorder will be limited to a maximum of 200. These must be split into different fulfillmentorders.

<br />
<br />

## Logistic labels

* Are used by supplier (external) warehouse organizations, external warehouse organizatons and customer organizations;
* Enable incoming/handling/tracing of batches by warehouse organizations in a supply chain;
* Are automatically created by fulfillment orders in Floriday;
* Are provided by Floriday for supplier (external) warehouse organizations;
* Contain delivery notes or in the future SSCC labels as a PDF for customer deliveries. The RFH warehouses, customer locations and carriers currently require delivery notes, in the future they will require SSCC-labels;
* Are placed on loadcarriers by supplier (external) warehouse organizations;
* By default every loadcarrier contains a logistic label), if oneLabelOnly is set true in the fulfillment order, one logistic label is provided the fulfillment order;
* Please note logistic hubs and certain customer organizations and carrier organizations require one logistic label per load carrier for incoming/handling/tracing purposes.

<br />
## Logistic means

* Can be reusable or non reusable;
* Logistic means balance of reusable logistic means of supplier organizations, customer organizations (and if applicable package (owner) organizations) is automatically updated by accepted Fulfillment orders in Floriday;
* Reusable logistic means are:
  * VBN reusable packages;
  * CC containers;
  * CC shelves;
* Reusable logistic means are managed and provided by a Logistic means organization (Royal FloraHolland, Veiling Rhein Maas, Plantion) for packaging, warehousing and transport purposes;
* If logistic means are owned by a package organization (e.g. import agent), the package owner other than the supplier organization can be set by default in Floriday and the package organization can be used in the fulfillment order;
* Service fees apply to the balance of reusable logistic means;
* If a fulfillment order is cancelled or corrected, logistic means balance is corrected correspondingly.

<br />
## Financial settlement

* Financial settlement of (part of) sales orders and logistic means is automatically initiated by accepted Fulfillment orders in Floriday;
* Is corrected by cancellation or correction of accepted fulfillment orders by supplier organizations;
* Is corrected by cancellation or correction of sales orders after a fulfillment order is created in Floriday with fulfillment requests of the corresponding accepted sales order corrections.

<br />
## Advanced Shipment Notices

* Are used by Customer organizations;
* Advanced shipping notices from deliveries created by supplier on Floriday are ment to give the customer organization information about which shipments he can expected. By receiving these advanced shipping notices a customer is able to prepare the logistic proces more accurately;
* Enables planning, incoming and handling of inbound shipped customer deliveries (based on sales orders in Floriday) by customer warehouses of customer organizations;
* Advanced Shipment Notice is also known as ASN;
* Specify the delivery information based on sales orders for customer organizations of a customer delivery from a Supplier (external) warehouse organization to a customer organization;
* Are based on fulfillment orders created by Supplier (external) warehouse organizations which are based on sales orders;
* Can be used to replace the Edifact DESADV message. Take in account that currently not all customer deliveries of sales orders are fulfilled and settled via Floriday;
* Can be updated and corrected based on the fulfillment orders. See fulfillment orders;
* Contains:
  * Fulfillment order Id;
  * Expected delivery date time, currently filled with the latest delivery date time;
  * Delivery location of the customer organization;
  * Despatch location of the supplier (external) warehouse organization;
  * Sender organization;
  * Logistic hub for handling by cross dock warehouses: RFH Aalsmeer, RFH Naaldwijk, RFH Rijnsburg, RFH Eelde, VRM Rhein Maas, Plantion Ede;
  * Fulfillment order status;
  * Carrier organization;
  * Load carrier information containing:
    * Number of additional layers in addition to the default layers provided with the loadcarrier.
    * Number of layers;
    * Load carrier type;
    * Load carrier reference if available uniquely identifies the load carrier (e.g. RFID tag).
    * Load carrier items containing:
      * Sales order Id replaces the less reliable customerOrderReference in the DESADV. By using the salesOrderId, a customer can retrieve financial information regarding the settlement initiated by fulfillment orders in Floriday.
      * Trade item Id;
      * Number of packages;
      * Sequence on carrier is the letter related to the item's position on the loadcarrier;
      * Batch reference, als used in the batch stickers. See [Batch stickers](https://developer.floriday.io/docs/customer-delivery-1#batch-stickers);
      * Logistic label code is created by Floriday after the fulfillment order is created in Floriday, is also the barcode of the logistic label (delivery note);

<br />
## Mark goods as received

* Goods can be marked as received by customer organizations and used as fulfillment status by supplier organizations;
* Can be used to mark goods on load carrier level as received by the customer organization;
* After marking the goods, the supplier organization can view this as fulfillment order status 'delivered'.

<br />
## Plantpassports

* Are used by Customer organizations;
* Plantpassport data is created by Floriday and is based on sales orders, batches, trade-item details and organization details;
* Enable multiplication of plantpassports by customer organizations;
* Is available after the sales order is committed. Sales order is committed if the sales order cannot be cancelled by the customer organization;
* Contain:
  * Sales order Id;
  * Sales channel order Id;
  * Botanical names originated from the trade-item. Can be entered by the supplier organization in the trade-item;
  * Country code of the supplier organization, originated from the organization details in Floriday;
  * Phytosanitary number originated from the Supplier organization settings in Floriday. Can be set by the supplier organization;
  * Tracebility code originated from the batch (batch reference) in Floriday;
  * Countries of origin, originated from the trade-item. Can be entered by the supplier organization in the trade-item.