---
updatedAt: 2025-04-28T11:39:47.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Auction Delivery

## Target audience

* Supplier organizations;
* Supplier warehouse organizations;
* External stock warehouse organizations.

<br />

## Purpose

* Enables fulfillment of Auction delivery of goods (batches) by supplier (external) despatch warehouse organizations;
* Enables communication and placement of logistic loadcarrier labels (delivery notes/SSCC labels) and logistic batch stickers on goods;
* Enables planning and incoming of goods by the auction warehouses with inbound fulfillment orders;
* Enables creation of clock and clock pre sales supply based on auction delivery orders and fulfillment orders created by the supplier organizations. In the future clock and clock pre sales supply will create auction delivery orders.
* Enables planning of transport of auction delivery of goods (batches) by a carrier organisation.

<br />

## General guidance

> 📘 Use the application
>
> Please use the Floriday modules *stock* *delivery orders*, *fulfillment orders* for supplier and supplier warehouse organizations for a better understanding of the workflow and functions.

* Supplier (external) warehouse organizations can deliver goods (batches) from their despatch warehouses to auction warehouses based auction delivery orders created supplier organizations in Floriday;
* Supplier external warehouse organizations (e.g. import agents) can provide auction delivery services to other suppliers (e.g. international growers); For details on goods movement to external warehouse organizations see [Goods movements](https://developer.floriday.io/docs/goods-movement);
* Delivery order and fulfillment order events can be received with webhooks by the Supplier (external) warehouse organizations. See [Webhooks](https://developer.floriday.io/docs/webhooks);
* The following auction warehouses are supported by Floriday: RFH Aalsmeer, RFH Naaldwijk, RFH Rijnsburg, RFH Eelde, Rhein-Maas, Plantion.

<br />

> 📘 Auction scenarios development
>
> The following future auction scenarios are in development or are going to be developed and need to be be taken into account for future development;
>
> 1. **Only create clock supply** Only create clock (pre) sales supply by the supplier organization based on batches that are already on an auction warehouse with external stock capabilities via goods movement. RFH warehouses stock are expected to support this scenario;
> 2. **From farm clock sales** Clock sales supply is created by the supplier organization based on batches that are on the supplier (external) despatch warehouse. The auction sales channel supports direct Customer delivery that is despatched from Supplier (external stock) warehouses to the customer location after committed auction sales orders;
> 3. **Create auction delivery order based on Clock (pre) sales supply** Clock (pre sales) supply is created by the supplier organization based on batches. Auction delivery orders are created based on clock (pre) sales supply in Floriday for supplier (external) warehouses.  Commercial supply data e.g. prices are only part of clock (pre) sales supply and are no longer part of auction delivery orders.

<br />

> 📘 Further guidance
>
> Further detailed guidance is mentioned per topic (Auction delivery orders, Fulfillment orders, etc.) via the interaction model.

<br />

## Implementation model

![](https://files.readme.io/d085445-Screenshot_2022-08-19_at_13.21.07.png "Screenshot 2022-08-19 at 13.21.07.png")

<br />

## Interaction model

![](https://files.readme.io/40746ec-Screenshot_2022-08-19_at_13.35.10.png "Screenshot 2022-08-19 at 13.35.10.png")

<br />

1,2) [**Auction delivery orders**](https://developer.floriday.io/docs/auction-delivery-2#auction-delivery-orders) containing fulfillment requests which are created by the supplier organization based on batches in Floriday as a basis for fulfillment by the supplier (external) warehouses.

3,4) [**Auction delivery orders**](https://developer.floriday.io/docs/auction-delivery-2#auction-delivery-orders) containing fulfillment requests are retrieved by the supplier (external) warehouses with a new batch Id from Floriday as a basis for fulfillment by the supplier (external) warehouses.

5,6) [**Batch stickers**](https://developer.floriday.io/docs/auction-delivery-2#batch-stickers) for the for the supplier (external) warehouses are automatically created by fulfillment requests in Floriday. These need to be placed on the packages if required by the auction warehouse.

7,8) [**Fulfillment orders**](https://developer.floriday.io/docs/auction-delivery-2#fulfillment-orders) are created by the supplier (external) warehouse organizations based on the fulfillment requests in the Auction delivery orders.

9,10) [**Logistic-labels (Delivery notes)**](https://developer.floriday.io/docs/auction-delivery-2#logistic-labels) are automatically created by fulfillment orders in Floriday.

11,12) [**Clock sales supply**](https://developer.floriday.io/docs/clock-sales-supply-1) and [**Clock pre sales supply**](https://developer.floriday.io/docs/clock-pre-sales-supply-1) are automatically created by fulfillment orders in Floriday.

13,15) **Inbound fulfillment orders** for auction warehouses are automatically created by fulfillment orders.

14,15) [**Fulfillment order status**](https://developer.floriday.io/docs/auction-delivery-2#fulfillment-orders) status is updated in the fulfillment orders.

16,17) **Goods** are **delivered** by a carrier organization from the despatch warehouse to the auction warehouse.

18,19,20) **Goods** are **marked as received** by the auction warehouse on load carrier level (logistic label) based on an inbound fulfillment orders.

<br />

## Auction delivery orders

* Are used by supplier (external) warehouse organizations;
* Are created by supplier organizations and contain fulfillment requests which are based on batches and grouped by despatch warehouse, auction warehouse, auction date, (latest) delivery date time, auction group;
* Auction delivery orders can be deleted or an additional fulfillment request can be added. Auction delivery orders can not be corrected by supplier organizations;
* Are fulfilled by fulfillment orders;
* Can be fulfilled in multiple fulfillment orders;
* Contains:
  * (latest) Delivery Date Time;
  * Auction date;
  * Auction group code;
  * Destination auction warehouse Id;
  * Despatch warehouse Id;
  * Fulfillment status (true/false), after receiving the auction delivery order a fulfillment status is given. 'false' if the auction delivery order is not completely fulfilled, 'true' if the auction delivery order is completely fulfilled. Fulfillment is initiated with fulfillment orders;
  * Carrier organisation Id, if enabled in Floriday, for transport orders to the carrier organisation;
  * Fulfillments requests containing:
    * Batch Id, after receiving a batch Id from the supplier organization in the auction delivery order, a new batch Id is returned by Floriday (destination warehouse) in the auction delivery order. This is necessary as a Supplier batch can be shipped to multiple destination warehouses and the batch Id needs to be unique for referential purposes;
    * Number of packages;
    * Clock pre sales price is used by the auction sales channel to set a clock pre sales price for clock pre sales supply. As an alternative the supplier organization can set clock pre sales prices in the Floriday application;
    * Clock minimum price is used by the auction sales channel to set a clock minimum price for clock sales supply;
    * VBN package code in addition a custom package Id;
    * Pieces per package;
    * Loadcarrier type;
    * Servicecode;
    * Packing agent organization Id if logistic means of packing agent are owned by a packing agent organization;
    * Delivery remarks are used by the supplier organization for communicating with the auctioneer;
    * Number of pieces picked is used to indicate how many pieces are picked using the picklist orders feature in Floriday;
    * Fulfillment order claims,  after receiving the auction delivery order and fulfillment order(s) the fulfillment order claim(s) containing fulfillment order Ids with claimed number of packages for actual overview of fulfilled (parts of) fulfillment requests of the auction delivery order are given;
* Currently fulfillment orders of auction delivery orders initiate allocation of clock (pre) sales supply;\
  Given this situation certain commercial information is used in the delivery order:
  * Clock pre sales price;
  * Clock minimum price;
  * Auction group (will automatically be determined in the future);
  * Auction date.

<br />

## Batch stickers

* Are used by supplier (external) warehouse organizations and customer organizations;
* Can be required by warehouse organizations and customer organizations;
* Usage of batch stickers is currently not required for auction delivery by auction warehouses;
* Are automatically created by Floriday and contain batch stickers (PDF) based on fulfillment requests in auction delivery orders;
* Are placed on packages by supplier (external) warehouse organizations;
* Are used by warehouses and customer organizations for incoming and handling and tracing of goods on batch/package level in a supply chain;
* Batch stickers contain batchreference (barcode), supplier article description, customer organization name, supplier organization name, 3 most important trade-item characteristics, service code, package code and number of pieces per package.

<br />

## Fulfillment orders

* Are created by Supplier (external) warehouse organizations and contain fulfilled (parts of) fulfillment requests from Auction delivery orders which batches are loaded on a loadcarrier;
* Contain fulfillment requests which have to be grouped by despatch warehouse, customer destination location, latest orderdate/time, latest delivery date/time based on Customer deliver orders;
* Contain fulfillment requests which are distributed among the load carriers resulting in fulfillment orders;
* The containing fulfillment requests can be corrected by accepted sales order corrections and sales order cancellations;
* Can be corrected by supplier organizations for loadcarrier type, number of additional layers and number of packages. The total number of packages of fulfillment request(s) in the fulfillment order(s) corresponding to a sales order can never be higher than the number of packages in the sales order;
* Can be updated by by supplier organizations for reducing the loadcarrier quantity. Loadcarrier(s) with highest sequence-number(s) will be removed first;
* Currently the auction load carrier packing configuration rules are applicable. In general: If a batch is placed on multiple load carriers, the batches need to be distributed equally amongst these load carriers, this rule is based on the current auction delivery, auction sales channels and customer delivery process. If the future new rules can apply to fulfillment orders at RFH warehouses;
* Contains:
  * Logistic hub for handling by cross dock warehouses: RFH Aalsmeer, RFH Naaldwijk, RFH Rijnsburg, RFH Eelde, VRM Rhein Maas, Plantion Ede;
  * One label Only for providing one logistic label (delivery note) for the fulfillment order instead of one logistic label per load carrier;
  * Load carrier type;
  * Number of additional layers in addition to the default layers provided with the loadcarrier;
  * Load carrier reference if available uniquely identifies the load carrier (e.g. RFID tag);
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
    * Item position is the letter related to the item's position on the loadcarrier.

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

## Clock (pre) sales supply

* Is used by auction sales channels and supplier organizations. Auction sales channels provide clock (pre) sales supply to their customers;
* Enables sales of [**Clock sales supply**](https://developer.floriday.io/docs/clock-sales-supply-1) and [**Clock pre sales supply**](https://developer.floriday.io/docs/clock-pre-sales-supply-1) in auction sales channels, insight in allocated clock (pre) sales supply for supplier organizations and clock (pre) sales supply as a basis for auction status and clock (pre) sales sales orders.
* The price of Clock pre sales supply may not be lower than the minimum price set for the matching Clock sales supply.

<br />

## Mark goods as received

* Goods can be marked as received by  the auction warehouse on load carrier level (logistic label) based on an inbound fulfillment orders. and used as fulfillment status by supplier organizations;
* Can be used to mark goods on load carrier level as received by the auction warehouse organization.;
* After marking the goods, the supplier organization can view this as fulfillment order status 'delivered'. This is currently not communicated by the auction warehouses.