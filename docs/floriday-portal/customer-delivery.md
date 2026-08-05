---
updatedAt: 2026-06-15T07:14:49.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Customer Delivery

## Supported scenarios

* Get delivery orders;
* Add fulfillment orders;
* Delivery via DC;
* Delivery direct.

<br />

![](https://files.readme.io/97aabc742f251527a018ea26bdd76f111b5e302277c172aecb81eaa6b37272b1-image.png)

<br />

***

<br />

## Get Delivery Orders

**Purpose:** Get Delivery Orders for customer delivery in Floriday.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of additional services;
* The supplier application has the latest update of trade-items;
* Direct sales orders are committed.

<br />

**Process steps:**

| NR | Process step                                                                                          | API call / scenario                                                                                                                                              |
| :- | :---------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Get highest generated sequence number.                                                                | *[GetDeliveryOrdersMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/GetDeliveryOrdersMaxSequence)*           |
| 2  | Sync delivery orders by latest sequence number.                                                       | *[GetDeliveryOrdersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/GetDeliveryOrdersBySequenceNumber)* |
|    | Process the retrieved delivery orders in the supplier application with their unique delivery order ID |                                                                                                                                                                  |
| 3  | The retrieved batches will be added or updated in the supplier application with the new batch IDs.    |                                                                                                                                                                  |
| 4  | Get the package stickers as a PDF for the delivery order.                                             | *[GetTrayLabelsAsPdfById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/GetTrayLabelsAsPdfById)*                       |
| 5  | The retrieved stickers will be added or updated in the supplier application.                          |                                                                                                                                                                  |
| 6  | Get plant passports (optional)                                                                        | [GetPlantPassportPdf](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/PlantPassports/GetPlantPassportPdf)                               |
| 7  | The retrieved plant passports will be added or updated in the supplier application.                   |                                                                                                                                                                  |

<br />

<br />

## Synchronize Delivery locations

**Purpose:** Receive delivery location GLN for goods movement in Floriday. Can be used when supplier creates their own sales orders, delivery locations marked as default can be used when delivery location is unknown.

| NR | Process step                                    | API call / scenario                                                                                                                                                       |
| :- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Get highest generated sequence number.          | *[GetDeliveryLocationMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryLocations/GetDeliveryLocationMaxSequence)*             |
| 2  | Sync delivery orders by latest sequence number. | *[GetDeliveryLocationsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryLocations/GetDeliveryLocationsBySequenceNumber)* |

<br />

<br />

## Add Fulfillment Orders

**Purpose:** Add Fulfillment Orders for goods movement in Floriday.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of additional services;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The supplier application has the latest update of delivery orders;
* The user has inserted fulfillment orders in the supplier application.

<br />

**Process steps:**

| NR              | Process step                                                                                                                            | API call / scenario                                                                                                                                         |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1               | Add a fulfillment order with one or more load carrier items with one or more fulfillment requests with a number of packages.            | *[AddFulfillmentOrder](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/AddFulfillmentOrder)*                     |
| 2               | The DC gets an ASN from Floriday.                                                                                                       |                                                                                                                                                             |
| 3 (temporarily) | Financial settlement of sales orders and logistic means is initiated.                                                                   |                                                                                                                                                             |
| 4               | Logistic means balance is received and updated by Logistic Means service provider                                                       |                                                                                                                                                             |
| 5               | Customer receives an ASN and a sales order status, starting with a DESADV.                                                              |                                                                                                                                                             |
| 6               | The DC and the Payment service provider sends a fulfillment status to Floriday.                                                         |                                                                                                                                                             |
| 7               | Get fulfillment order status                                                                                                            | *[GetFulfillmentOrderStatusById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/GetFulfillmentOrderStatusById)* |
| 8               | The retrieved fulfillment order status will be added or updated in the supplier application.                                            |                                                                                                                                                             |
| 9               | Get logistic labels starting with a Delivery Note as pdf by fulfillment order ID.                                                       | *[GetLogisticLabelsById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/GetLogisticLabelsById)*                 |
| 10              | The retrieved logistic labels will be added or updated in the supplier application.                                                     |                                                                                                                                                             |
| 11A             | Get Customer stickers (PDF) by sales order ID for a fulfillment request.                                                                | *[GetTrayLabelsAsPdfById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryOrders/GetTrayLabelsAsPdfById)*                  |
| 12A             | The Customer stickers (PDF) will be added or updated in the supplier application.                                                       |                                                                                                                                                             |
| 11B             | Get Customer stickers (label metadata) by sales order ID for a fulfillment request.                                                     | *[GetCustomerStickerMetaData](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomerStickers/GetCustomerStickerMetaData)*        |
| 12B             | The Customer stickers (label metadata) will be added or updated in the supplier application and used for printing on customised labels. |                                                                                                                                                             |
| 13              | Financial settlement of the logistic means deposit/rental fee is send to Payment service provider.                                      |                                                                                                                                                             |
| 14              | The Financial settlement of the logistic means deposit/rental fee is processed.                                                         |                                                                                                                                                             |

<br />

> 📘 Time out errors
>
> 504 (Gateway Timeout) on Fulfillment orders
>
> * Despite an initial 504 error, sometimes fulflillment orders can later be successfully committed within the fulfillment-service if the time out is resolved quickly enough;
> * You can check the status of a placed fulfillment order after the time-out message, when the status is `accepted` you do not have to replace this fulfillment order, when the status is `cancelled` you do have to place a new fulfillment order.

<br />

## Delivery via DC

**Purpose:** Delivery of goods to a customer location via a DC.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of additional services;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The supplier application has the latest update of delivery orders;
* The supplier application has the latest update of fulfillment orders;

<br />

**Process steps:**

| NR | Process step                                                                                           | API call / scenario                                                                                                                                         |
| :- | :----------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Dispatch of delivery of goods with logistic labels and optional plant passports to a customer location |                                                                                                                                                             |
| 2  | The DC receives the goods and scans the delivery notes.                                                |                                                                                                                                                             |
| 3  | Financial settlement of the service charge by the payment service provider.                            |                                                                                                                                                             |
| 4  | The DC sends a fulfillment status to Floriday                                                          |                                                                                                                                                             |
| 5  | Get fulfillment order status                                                                           | *[GetFulfillmentOrderStatusById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/FulfillmentOrders/GetFulfillmentOrderStatusById)* |
| 6  | The retrieved fulfillment order status will be added or updated in the supplier application.           |                                                                                                                                                             |

<br />

<br />

## Delivery Direct

**Purpose:** Direct delivery of goods to a customer location.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of additional services;
* The supplier application has the latest update of trade-items;
* The supplier application has the latest update of batches;
* The supplier application has the latest update of delivery orders;
* The supplier application has the latest update of fulfillment orders.

<br />

**Process steps:**

| NR | Process step                                                                                           | API call / scenario |
| :- | :----------------------------------------------------------------------------------------------------- | :------------------ |
| 1  | Dispatch of delivery of goods with logistic labels and optional plant passports to a customer location |                     |
| 2  | The Customer location receives the goods and scans the delivery notes.                                 |                     |