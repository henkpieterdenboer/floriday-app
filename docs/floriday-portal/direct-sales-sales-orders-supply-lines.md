---
updatedAt: 2025-04-28T11:39:21.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Sales orders

## Target Audience

* Customer organizations
* Supplier organizations

<br />

## Purpose

* Enables a sales or purchase status overview of sales orders from Floriday and sales channels connected to Floriday.
* Initiates customer delivery orders for fulfillment.
* Initiates financial check or claims and are the basis for Financial settlement.

<br />

## Guidance Sales orders

> 📘 Use the applications
>
> Please use the Floriday application for *sales orders* for supplier organizations and *purchase orders* for customer organizations for a better understanding of the workflow and functions.

<br />

* Floriday can receive accepted sales orders from clock sales channels RFH, VRM, Plantion;
* Committed Sales orders result in customer delivery orders with fulfillment requests in Floriday. Currently only applicable for trade instruments `direct sales` and `contracts`;
* When fulfillment orders/sales orders after settlement are corrected, the corresponding Financial settlement will also  be corrected;
* For Supplier ERP, sales orders events can be received by webhooks;

<br />

**Sales orders**

* Are created following:
  * an accepted blanket order (contracts);
  * an accepted direct sales order;
  * an accepted clock pre sales order;
  * an accepted clock bids;
  * an accepted purchase order;
* Are the outcome of a trade instrument;
* Initiate Financial checks or claims by payment provider Royal FloraHolland;
* Are versioned;
* Are supplemented with a BatchReference once the associated FulfillmentOrder has been created.
* Should contain a valid PaymentProvider. Before this property was optional, as of 2023v2 this property is mandatory.
* For Sales orders models, please view the latest Swagger API page.
  * [Supplier Swagger](swagger-docs)
  * [Customer Swagger](swagger-docs-1)
* The Sales order should include the total price with all included price components in the sales order, which is calculated as follows:

> 📘 Calculation total price per piece
>
> Total price per piece:\
> (((price per piece + additional price per piece for the packing configuration + additional price per piece for additional services) X number of pieces) + delivery price)/ number of pieces

<br />

* Sales orders should contain a trade instrument. The currently supported Trade Instruments are Clock pre sales, Clock sales, Contracts & Direct Sales.

<br />

* Sales orders can contain a Sales order status;

> 📘 Sales order status
>
> **Pending**: Sales order is pending approval.\
> **Accepted**: Sales order is accepted and can be cancelled within the cancellation deadline.\
> **Rejected**: Sales order is rejected.\
> **Cancelled**: Sales orders is cancelled.\
> **Committed**: Sales orders are committed and cannot be cancelled.\
> Exemptions:\
> **Expired**: Sales orders have technical issues (e.g. stock cannot be claimed). In practice this status will almost never occur.\
> **Unfulfilled**: Sales orders are committed but are unfulfilled. In practice this status only occurs with clock pre sales if the clock batch is not delivered or auctioned. In that case clock pre sales orders cannot be fulfilled.

<br />

* Sales orders can contain a Goods status (customer only);

> 📘 Goods status (customer only)
>
> * **Idle**: Goods are at the despatch warehouse
>   * **In transit**: Supplier warehouse has created fulfillment orders based on the sales orders.
>   * **Received by customer**: Goods are marked as received by the customer organization.

<br />

* Sales orders can contain a Sales order correction state;

> 📘 Sales order correction state
>
> **Pending** Sales order correction request is pending approval.\
> **Succeeded** Sales order correction request is (automatically) accepted.\
> **Rejected** Sales order correction request is rejected.

<br />

* Sales orders can contain a Credit claim status (Currently only supported with the payment provider RFH);

> 📘 Financial check or claim  'credit check status' (new)
>
> * Sales orders are checked by the Payment provider and Payment security is provided. Currently only supported by the Payment provider RFH.
> * This enables earlier payment security for supplier organizations unlike with the current RFH Connect EAB where this check is done at fulfillment of the customer delivery.
> * As sales orders can be corrected, checks are redone by the payment provider.
>
> Financial status:\
> **OK**:
>
> * Sales order is **accepted** by the Payment provider.
> * Payment security is provided by the Payment provider to the Supplier Organization.
> * **Take note:** A customer may be (temporarily) blocked for direct sales; in that case the fulfillmentOrder will not be accepted, even if the creditClaimStatus of the salesOrder is OK. The Payment Provider of the customer organization will be removed while the customer is blocked.
>
> **Failed**:
>
> * Sales order is **not accepted or has failed** by the Payment provider.
> * Payment security is **not provided** by the Payment provider to the Supplier Organization.
> * Suppliers should contact the customer organization.
> * No customer delivery orders are created.
>
> **Not checked**:
>
> * Sales order is **not checked** by the Payment provider.
> * Payment security is **not checked** by the Payment provider for Supplier Organization.
> * Fallback if the payment provider can not check the sales orders.
>
> **Released**:
>
> * Sales order is **released** by the Payment provider after financial settlement is done.
>
> **Planned**:
>
> * Sales order is **planned** and will be checked in the future by the Payment provider.
> * Applicable where the latest delivery latest date time is further in the future. For RFH payment provider this is currently more than 36 hrs (taking in account working days) which can deviate for different scenarios (international shipments).

<br />

> 📘 Financial settlement
>
> * Financial settlement will be initiated by customer delivery fulfillment orders and based on sales orders and fulfillment orders.
> * When fulfillment orders/sales orders after settlement are corrected, the corresponding Financial settlement will also  be corrected;

<br />

## Implementation model

![](https://files.readme.io/be7e9f4-Screenshot_2022-02-16_at_23.31.57.png "Screenshot 2022-02-16 at 23.31.57.png")

<br />

## Interaction model

![](https://files.readme.io/3cc219b-Screenshot_2022-02-16_at_23.35.24.png "Screenshot 2022-02-16 at 23.35.24.png")