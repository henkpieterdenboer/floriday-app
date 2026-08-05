---
updatedAt: 2026-06-17T10:29:51.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Advanced shipping notices

## Supported Advanced shipping Notices scenarios

* Receiving Advanced shipping notices;
* Confirming fulfillment order as received.

For the business rules concerning Advanced Shipping Notices, please read [Advanced Shipping Notice](https://developer.floriday.io/docs/advanced-shipping-notice).

<br />

***

## Receiving Advanced shipping notices

**Purpose:**\
Receiving advanced shipping notices from deliveries created by suppliers on Floriday.

<br />

| NR | Process step                                                                                     | API call / scenario                                                                                                                                                                      |
| :- | :----------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns list of all active Advanced shipping notices by delivery date.                           | *[GetAdvanceShippingNoticesByDeliveryDate](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/AdvanceShippingNotices/GetAdvanceShippingNoticesByDeliveryDate)*     |
| 2  | Returns list of all active Advanced shipping notices by salesOrderId.                            | *[GetAdvanceShippingNoticesBySalesOrderId](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/AdvanceShippingNotices/GetAdvanceShippingNoticesBySalesOrderId)*     |
| 3  | Returns the maximum sequence number found in Advanced shipping notices.                          | *[GetAdvanceShippingNoticesMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/AdvanceShippingNotices/GetAdvanceShippingNoticesMaxSequence)*           |
| 4  | Returns a list of max 1000 Advanced shipping notices starting  from a specified sequence number. | *[GetAdvanceShippingNoticesBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/AdvanceShippingNotices/GetAdvanceShippingNoticesBySequenceNumber)* |

<br />

***

## Confirming fulfillment order as received.

**Purpose:**\
Confirming a fulfillment order by setting it on Received.

<br />

| NR | Process step                                                                           | API call / scenario                                                                                                                                                                  |
| :- | :------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Sets the fulfillment order load carriers on Received based on the `documentReference`. | *[SetFulfillmentOrderLoadCarriersReceived](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/AdvanceShippingNotices/SetFulfillmentOrderLoadCarriersReceived)* |