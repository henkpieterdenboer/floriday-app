---
updatedAt: 2026-06-22T11:01:13.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Direct sales sales order correction requests

## Supported direct sales sales order correction scenario's

* Adding sales order correction requests;
* Receiving sales order correction requests;
* Accepting sales order correction requests;
* Deleting sales order correction requests.

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

<br />

<Callout icon="📘" theme="info">
  * If a sales order can not be (completely) fulfilled, a correction request may be initiated.
  * A correction request for a sales order may be initiated by both the supplier and the customer.
  * A Sales order correction request can either be a modification or a cancellation.

  See the Business rules on [Sales order correction requests](https://developer.floriday.io/docs/correction-sales-order) for more information.
</Callout>

<br />

## Add direct sales sales order correction request

**Purpose:** Request to correct a sales order in Floriday before, during or after delivery or payment.

<br />

| NR | Process steps                                                           | API call / scenario                                                                                                                                                      |
| :- | :---------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Add a correction request for a sales order in Floriday by the supplier. | *[AddSalesOrderCorrectionRequest](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/AddSalesOrderCorrectionRequest)* |
|    | Sales order correction request is processed by Floriday.                |                                                                                                                                                                          |

<br />

<br />

## Receiving direct sales sales order correction requests

**Purpose:** Receive latest status of sales order correction from Floriday before, during or after delivery or payment.

| NR | Process steps                                                                                                | API call / scenario                                                                                                                                                                                        |
| :- | :----------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | The latest correction status and corrections of the sales order can be retrieved from Floriday by ID.        | *[GetSalesOrderCorrectionRequestById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/GetSalesOrderCorrectionRequestById)*                           |
| 2  | Returns the maximum sequence number found in direct sales order correction requests.                         | *[GetSalesOrderCorrectionRequestsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/GetSalesOrderCorrectionRequestsMaxSequence)*           |
| 3  | Returns a list of max 1000 direct sales order correction requests starting from a specified sequence number. | *[GetSalesOrderCorrectionRequestsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/GetSalesOrderCorrectionRequestsBySequenceNumber)* |

<br />

<br />

## Accepting direct sales sales order correction requests

| NR | Process steps                                    | API call / scenario                                                                                                                                                            |
| :- | :----------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Accepting direct sales order correction request. | *[AcceptSalesOrderCorrectionRequest](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/AcceptSalesOrderCorrectionRequest)* |

<br />

<br />

## Declining direct sales sales order correction requests

| NR | Process steps                                    | API call / scenario                                                                                                                                                              |
| :- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Declining direct sales order correction request. | *[DeclineSalesOrderCorrectionRequest](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/DeclineSalesOrderCorrectionRequest)* |

<br />

<br />

## Deleting  direct sales sales order correction requests

| NR | Process steps                             | API call / scenario                                                                                                                                                            |
| :- | :---------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Deleting  sales order correction request. | *[DeleteSalesOrderCorrectionRequest](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrderCorrectionRequests/DeleteSalesOrderCorrectionRequest)* |