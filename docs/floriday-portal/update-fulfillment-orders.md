---
updatedAt: 2026-06-15T07:15:03.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Corrections and updating Fulfillment Orders

## Supported scenarios

* Post corrections on fulfillment orders;
* Receive corrections on fulfillment orders;
* Update fulfillment orders;
* Delete fulfillment orders.

<br />

## Corrections on fulfillment orders

**Purpose:**

* Correcting a placed fulfillment orders;
* Receiving corrections on fulfillment orders and status.

<br />

**Process steps:**

| NR | Process step                                      | API call / scenario                                                                                                                                                 |
| :- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Post correction on fulfillment order              | *[AddFulfillmentOrderCorrection](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/AddFulfillmentOrderCorrection)*         |
| 2  | Receive fulfillment order corrections based on ID | [GetFulfillmentOrderCorrectionsById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/GetFulfillmentOrderCorrectionsById) |

<br />

<br />

## Updating and deleting fulfillment orders

**Purpose:**

* Updating fulfillment orders;
* Deleting fulfillment orders.

**Process steps:**

| NR | Process step                          | API call / scenario                                                                                                                           |
| :- | :------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Update fulfillment order based on ID. | *[EditFulfillmentOrder](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/EditFulfillmentOrder)*     |
| 2  | Delete fulfillment order based on ID  | *[DeleteFulfillmentOrder](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/DeleteFulfillmentOrder)* |