---
updatedAt: 2025-04-28T11:05:12.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# The Floriday Model

## Domain overview

![](https://files.readme.io/b8237cb-Screenshot_2022-02-14_at_22.11.31.png "Screenshot 2022-02-14 at 22.11.31.png")

<br/>
<br/>

* Floriday is high level grouped by Floriday domains (Core, Match & Connect, Catalog, Stock, Supply and Orders, Fulfillment, Payment & Invoicing).

<Image align="center" src="https://files.readme.io/ebe806e-FloridayDomains.png" />

<br/>
<br/>

* Every Floriday domain has one or more logically grouped Floriday services with resources usually manifested in Floriday modules (e.g. Customer delivery with Fulfillment orders, Delivery orders, Customer Stickers) and should be connected to as a module.
* The exception are the Floriday Core domain services which contains key services with resources which are shared with (most) other Floriday services (e.g. organizations, media, additional service) and should be implemented as such.
* Floriday services can be accessed by the Customer and Supplier ERP gateways.

***

<br />

## Simplified Domain model

![](https://files.readme.io/f84d680-Screenshot_2022-02-14_at_22.12.35.png "Screenshot 2022-02-14 at 22.12.35.png")

<br />

***

<br />

## Entity relationship model

To support the design and development, Floriday provides an entity relationship model with a list of definitions.

Reading guide:

* This model contains the entities and relationships relevant to development. Not all possible entities and relationships are included as this would create confusion.
* The model contains entities that are supported in the current API version.
* The model includes entities of financial service providers that are relevant for context, but not used in the API.
* Floriday is in continuous development, as is the entity model. As soon as a new version of the API is supported, the entity model will be expanded accordingly.
* The entity model may suggest that only supply-lines can be created based on base supply, but this is not the case. Supply-lines can also be created based on the stock domain (Batch/Catalog supply).

<Image align="center" src="https://files.readme.io/4a86e1a-Enterprise_Data_Model_diagram_V1.0.png" />

<br />

***

<br />

## Definitions

<br />

### 1. Organization

* Organization - A registered company with a name, address and a logo.

  1.1. Organizations are typed, e.g. 'supplier', 'customer', 'service provider'.\
  1.2. An organization may be registered as a company with Floricode.\
  1.3. An organization has at least one location with an address.\
  1.4. An organization's location may be registered as a company-location with Floricode.

<br />

### 2. Catalog

* Base Item - The basic level of items at which stock is held. The parts of a trade item.
* Trade Item - Describes all product characteristics. Can be configured from underlying base items.
* Characteristic - A feature of a trade item, for instance 'stemlength' or 'potsize'.

  2.1. A trade item has a VBN productcode.\
  2.2. A trade item has a list of characteristics.\
  2.3. Each characteristic has a VBN code and a VBN value code.\
  2.4. A trade item has at least one packing configuration.

  2.5. A trade item may consist of underlying base items.

<br />

### 3. Stock

* Batch - A specific quantity of stock at a specific warehouse.
* Warehouse - A location for stock keeping.

  3.1. A warehouse is a type of location.\
  3.2. Stock at a warehouse is defined in one or more batches.\
  3.3. A batch is either a quantity of a trade item, or a quantity of a base item.\
  3.4. A batch has one packing configuration.

<br />

### 4. Packing

* Packing Configuration - Describes the way trade items can be packed for transportation.
* Package - Any self-contained wrapping or container which can contain trade items. Packages are used to support the transportation and protection of trade items.
* Custom Package - A customized package with specifications given by the owner, as opposed to the standard VBN specifications.
* Load Carrier - A logistical means used to transport trade items from one place to another. Load carriers usually consist of a rolling base and one or more layers.

  4.1. A packing configuration has one package.\
  4.2. A package has a VBN package code.\
  4.3. A packing configuration has one loadcarrier type.\
  4.4. A package may have a custom package id.

<br />

### 5. Supply

* Supply - Describes the commercial terms and conditions under which trade items are offered for sale.
* Supply Line -  Supply of a specific trade item that is allocated to one or more sales channels.
* Trade Instrument - A specific trading mechanism. Examples are: clock sales, direct sales, clock presales.

  5.1. A supply line has one trade instrument.\
  5.2. A supply line has at least one sales channel.\
  5.3. Stock keeping for one or more supply lines is done at the level of a batch.\
  5.4. A supply line has at least one packing configuration.

<br />

### 6. Sales

* Business Transaction - An event in the business domain that is measurable in money.
* Delivery Condition - The terms and conditions associated with a delivery to a specific location and / or customer.
* Sales Order - An agreement between a supplier and a customer for the purchase of trade items under the supply conditions.
* Sales Channel - A platform where customers can buy trade items. A sales channel supports one or more trade instruments.
* Additional Service - A priced, optional service, provided by a supplier, that can be included in the sales order.
* Purchase Order - An order placed by a customer, that may result in a sales order, either directly by matching supply or after validation by the supplier (see: Order Request).
* Order Request - An order that can not be matched with supply. Will result in a sales order, after validation by the supplier (see also: Purchase Order).
* Customer Request - Customers can ;specify and request a trade item, supply or packing configuration when the suppliers' catalog or supplylines do not match their needs.
* Sales Order Correction Request - Request to change the sales order specification. Results in a new version of the sales order, after both parties have agreed.
* Customer Sticker - Custom label to be added to the delivery of the products, as a service to the customer.

  6.1. A sales order is a type of business transaction.\
  6.2. A business transaction reflects agreements between different organizations.\
  6.3. A purchase order may lead to one or more sales orders.\
  6.4. A sales order may included one or more additional services.\
  6.5. A sales order is initiated in one sales channel.\
  6.6. A sales order has one packing configuration.\
  6.7. Fulfillment of a sales order is subject to the conditions of a delivery condition.\
  6.8. A delivery condition specifies possible delivery locations.\
  6.9. A delivery condition specifies timeframes for delivery.\
  6.10 A sales order may be placed on a supply line ( other option = contract / blanket order. See **Contracts**. )\
  6.11 A sales channel supports one or more trade instruments. A trade instrument can be supported by different sales channels.\
  6.12 A trade item request, supply request and packing configuration request are types of customer requests.\
  6.13 A sales order may have one or more sales order correction requests.\
  6.14 A sales order may have one or more customer stickers.

<br />

### 7. Fulfillment Orchestration

* Delivery Order - Specifies the outbound batches for a (outgoing) shipment. Relates to one or more fulfillment requests.
* Fulfillment Request -  A request to prepare a batch(part) for transport ( e.g. to another warehouse or a customer ). Is triggered from several usecases, e.g. sales order fulfillment or warehouse stocking.
* Fulfillment Order - The business transaction related to a shipment. References the fulfillment requests that are fulfiled.
* Advance Shipping Notice (ASN) - Logistic information about an upcoming delivery, sent to the receiving party. The fulfillment order data is the basis for the ASN.
* Transform Order - Order to change the packaging of a batch(part) from it's default packaging configuration, usually specified in a sales order at the request of a customer.
* Transport Order - The instructions for the carrier organization of a shipment.

  7.1 A delivery order has a despatch- and delivery location.\
  7.2 A delivery order can aggregate many fulfillment requests to specify a preferred shipment.\
  7.3 A delivery order specifies the outbound batches for an outgoing shipment.\
  7.4 A fulfillment request specifies the quantity to fulfill from one batch.\
  7.5 A fulfillment request may be the result of a sales order.\
  7.6 A fulfillment order is a type of business transaction.\
  7.7 A fulfillment order fulfills one or more fulfillment requests.\
  7.8 A fulfillment order relates to one inbound / outbound shipment.\
  7.9 A transform order relates one or more source batches to a result batch with a different packing configuration.\
  7.10 A transform order may be the result of a sales order, in case the customer requests an alternative packing configuration.\
  7.11 A fulfillment order may have an associated transport order.

<br />

### 8. Fulfillment

* Load - Describes the physical stacking of goods per loadcarrier.
* Load Detail - Describes o.a. the quantity per good.
* Logistic Means - The hardware used for transport.
* Inbound/Outbound Shipment - A logical unit of transport. Describes the loads and logistical means involved in the transport.

  8.1. An Inbound / Outbound Shipment specifies one or more loads.\
  8.5. A load consists of one or more load details.\
  8.6. A load specifies the logistic means involved in transport.\
  8.7. (Outbound) A fulfillment request may be referenced in several load details.\
  8.8. (Inbound) A batch may be referenced in several load details

<br />

### 9. Finance

* Charging - The process of determining the total cost or benefit for parties involved in a Business Transaction.
* Claim - The amount of credit reserved for settlement of a Business Transaction.
* Consumption Item - A quantifiable and tradable item. Result of a Business Transaction.
* Billable Item - Specifies costs of a Consumption Item. The result of charging.
* Settlement - The financial fulfillment of a claim or part thereof.

  9.1. A business transaction results in a claim for one or more consumption items.\
  9.2. A consumption item can either specify a trade item, service, logistical means or load carrier.\
  9.3. A billable item is related to one consumption Item.\
  9.4. A settlement involves the settlement of ( part of ) one claim.\
  9.5. A settlement involves the settlement of one or more consumption Items. A consumption Item may be settled in more than one settlement.

<br />

### 10. Contract

* Contract - Agreement between a supplier and a customer for the purchase of trade items in a specified period
* Blanket Order - An order created according to the conditions of the contract, initiated either by the supplier or the customer.

  10.1. A business transaction may have one or more underlying contracts. One contract can lead to multiple business transactions.\
  10.2  A blanket order will result in one or more sales orders.\
  10.3  A blanket order will periodically be created according to the conditions of the contract, initiated either by the supplier or the customer.