---
updatedAt: 2026-06-17T10:25:53.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Sales order correction requests

## Supported sales order correction requests scenarios

* Receiving sales order correction requests;
* Creating sales order correction requests;
* Responding to sales order correction requests;
* Deleting sales order correction requests.

For the business rules concerning correction requests, please read [Sales order correction requests](https://developer.floriday.io/docs/correction-sales-order).

<br />

<Callout icon="📘" theme="info">
  **Correcting Delivery time and Delivery location**

  In the 2025v2 version of the Floriday API, both customer organizations and supplier organizations will be able to perform correction requests on Delivery time and Delivery location. This will impact Fulfillment Requests and how they are processed by supplier organizations.

  Fulfillment requests are grouped into Delivery Orders based on both Delivery time and Delivery location. Correcting either of these can result in changed or new Fulfillment requests being created by Floriday.

  When a correction on either Delivery time and Delivery location takes place:

  * The FulfillmentRequestId stays the same.
  * The Delivery Order where the Fulfillment Request was a part of, receives an update that it no longer contains the corresponding FulfillmentRequestId.
  * A new Delivery Order is created or an existing Delivery Order (that matches the Delivery time and/or date of the now corrected Fulfillment request) is updated with this FulfillmentRequestId.
</Callout>

***

## Receiving sales order correction requests

**Purpose:** Receiving sales order corrections requests from Floriday and their latest status.

<br />

| NR | Process step                                                                                           | API call / scenario                                                                                                                                                                                        |
| :- | :----------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns a sales order correction request by ID.                                                        | *[GetSalesOrderCorrectionRequestById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/GetSalesOrderCorrectionRequestById)*                           |
| 2  | Returns the maximum sequence number found in sales order correction requests.                          | *[GetSalesOrderCorrectionRequestsMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/GetSalesOrderCorrectionRequestsMaxSequence)*           |
| 3  | Returns a list of max 1000 sales order correction requests starting  from a specified sequence number. | *[GetSalesOrderCorrectionRequestsBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/GetSalesOrderCorrectionRequestsBySequenceNumber)* |

<br />

***

## Creating  sales order correction requests

**Purpose:** Creating a sales order correction request on which a supplier can respond.

<br />

**Prerequisites:**

* Sales order used for correction request has to have the status 'committed'.

<br />

| NR | Process step                                  | API call / scenario                                                                                                                                                      |
| :- | :-------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Creates a new sales order correction request. | *[AddSalesOrderCorrectionRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/AddSalesOrderCorrectionRequest)* |

<br />

***

## Responding to sales order correction requests

**Purpose:** Declining or accepting sales order correction requests which are created by supplier.

<br />

**Prerequisites:**

* Sales order correction request has been placed by supplier;
* Sales order correction request has not yet have the status 'committed'.

<br />

| NR  | Process step                              | API call / scenario                                                                                                                                                              |
| :-- | :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 A | Accept a sales order correction request.  | *[AcceptSalesOrderCorrectionRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/AcceptSalesOrderCorrectionRequest)*   |
| 1 B | Decline a sales order correction request. | *[DeclineSalesOrderCorrectionRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/DeclineSalesOrderCorrectionRequest)* |

<br />

***

## Deleting sales order correction requests

**Purpose:** Deleting a sales order correction request.

<br />

**Prerequisites:**

* Sales order correction request does not have the status 'committed'.

<br />

| NR | Process step                             | API call / scenario                                                                                                                                                            |
| :- | :--------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Delete a sales order correction request. | *[DeleteSalesOrderCorrectionRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/DeleteSalesOrderCorrectionRequest)* |