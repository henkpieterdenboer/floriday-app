---
updatedAt: 2025-04-28T13:56:40.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Goods movement

## Target audience

* Supplier organizations;
* Supplier warehouse organizations;
* External stock warehouse organizations.

<br />
## Purpose

* Enables fulfillment of delivery of goods (batches) by supplier (external) despatch warehouse organizations;
* Enables goods movements by supplier organizations from a dispatch warehouse to an external stock warehouse;
* Enables planning of transport of delivery of goods (batches) by a carrier organisation.

<br />
## Brief

* Supplier warehouses and external warehouse organizations (e.g. import agents) can provide external stock services in Floriday for other suppliers (e.g. international growers);
* External warehouse organizations can add suppliers in Floriday for access to their external stock services;
* Suppliers can only move batches to an external warehouse if the owner of the external warehouse has given permission to the supplier;
* External warehouses can get and mark inbound fulfillment orders as received. Suppliers can track and trace these fulfillment orders;
* For Supplier ERP Delivery order and Fulfillment order events can be received by webhooks.
* (Supplier) external warehouses can access specific Supplier API endpoints. See [Authorization External Warehouses](https://developer.floriday.io/docs/authorization-profiles#authorization-external-warehouses)

<br />
## Guidance

> 📘 **Note**
>
> Use the application
>
> Please use the Floriday modules *stock*, *delivery orders* and *fulfillment orders* for supplier and supplier warehouse organizations and *inbound orders* for supplier warehouse organizations only for a better understanding of the workflow and functions.

<br />
<br />

**Goods movement Delivery Orders:**

* Also named 'External stock delivery orders'.
* Specifies an order for movement of goods as a fulfilment request from a dispatch warehouse to an external stock warehouse by the supplier organization based on existing batches;
* Contains: fulfillmentrequest ID, batch ID, number of packages, deliverydatetime, destination warehouse Id, despatch warehouse Id, **number of pieces picked** and time started orderpicking at. In addition an orderline Id, one or more additional service Ids, package, pieces per package, load carrier, servicecode and packing agent organization Id can be added.
* **CHANGE** Can only be created **and deleted** by the supplier organization.
* After successful processing of the Goods movement Delivery orders by Floriday, 'Logistic stickers' are created by Floriday for the supplier (external stock) warehouse organization.

**Logistic stickers:**

* Also named 'package stickers', 'package labels', 'batch stickers' or 'stickers'.
* Enable logistic handling of packages by an external stock warehouses.
* Are usually mandatory for the supplier (external stock) warehouse organization as determined by the external stock warehouse.
* Specify stickers as a PDF for a delivery order.
* Are to be placed on packages by the supplier (external stock) warehouse organization.

**Fulfillment Orders:**

* Specifies the distribution of the fulfillment requests among the load carriers resulting in fulfillment orders by the supplier (external stock) warehouse organization based on fulfillment requests in the Goods movement delivery orders.
* Contains: fulfillmentorder ID a loadcarrier type, number of additional layers, loadcarrier sequence number (within the shipment) with one or more load carrier items containing fulfillment request Id and numer of packages. In addition a packing agent organization Id can be added.
* Can be deleted by the supplier (external stock) warehouse organization.
* After successful processing of the Goods movement Delivery orders by Floriday, 'Logistic labels' are created by Floriday.

**Logistic labels:**

* Also named 'SSCC labels' or 'delivery notes'.
* Enable logistic handling of load carriers by an external stock warehouses.
* Are mandatory for the supplier (external stock) warehouse organization.
* Specifies logistic labels as PDF for a delivery order.

<br />
<br />

**Delivery**\
The delivery of goods and the fulfillment status of the delivery.

> 📘 **Note**
>
> RFH external warehouses
>
> RFH external warehouses require logistic package stickers and load carrier SSCC-labels.

<br />
* for Supplier batches/fulfillment requests inbound/on warehouse.

<br />
## Implementation model

![](https://files.readme.io/6de3fa4-Screenshot_2022-05-09_at_08.40.02.png "Screenshot 2022-05-09 at 08.40.02.png")

## Interaction model

![](https://files.readme.io/85a42d1-Screenshot_2022-08-02_at_12.45.19.png "Screenshot 2022-08-02 at 12.45.19.png")