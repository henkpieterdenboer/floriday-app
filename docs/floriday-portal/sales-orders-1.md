---
updatedAt: 2026-06-15T15:00:38.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Sales orders

## Supported sales orders scenarios

* Placing sales orders
* Cancelling sales orders
* Receive sales orders

<br />

***

## Placing sales orders

**Purpose:**\
Add direct sales sales orders in Floriday trading agent.

**Prerequisites:**

* Customer has up to date supply lines
* Information in a sales order meets all the criteria:
  * Price should match with supply;
  * Delivery period should match with DeliveryPeriod in supply;
  * Order period should match with OrderPeriod in supply;
  * Packing configuration should exist in the right SupplyLine or TradeItem;
  * Delivery location should be a valid LocationGLN;
  * Delivery date should match with DeliveryConditions of supplier.

<br />

| NR | Proces steps               | API call / scenario                                                                                                   |
| :- | :------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| 1  | Creates a new sales order. | *[AddSalesOrder](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/AddSalesOrder)* |

<br />

***

## Cancelling sales orders

**Purpose:**\
Cancelling direct sales sales orders in Floriday trading agent.

**Prerequisites:**

* Sales order does not have the status 'Committed'.

<br />

| NR | Proces steps                                           | API call / scenario                                                                                                                   |
| :- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Cancel a sales order before the cancellation deadline. | *[SetSalesOrderCanceled](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/SetSalesOrderCanceled)* |

<br />

***

## Receiving sales orders

**Purpose:**\
Receiving placed direct sales sales orders in Floriday trading agent.

**Prerequisites:**

* Sales order must be placed on Floriday.

<br />

| NR | Proces steps                                                                                                                                                                           | API call / scenario                                                                                                                                     |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Returns a list of sales orders.                                                                                                                                                        | *[GetSalesOrders](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrders)*                                 |
| 2  | Returns a list of sales orders by ID.                                                                                                                                                  | *[GetSalesOrderById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrderById)*                           |
| 3  | Receive sales order by id and version.                                                                                                                                                 | *[GetSalesOrderByIdAndVersion](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrderByIdAndVersion)*       |
| 4A | Returns the maximum sequence number found in sales orders.                                                                                                                             | *[GetSalesOrdersMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrdersMaxSequence)*           |
| 4B | Receive sales orders based on the provided sequence number.                                                                                                                            | *[GetSalesOrdersBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrdersBySequenceNumber)* |
| 5  | Receive the RFH delivery notes of the given sales order based on the fulfillment orders. Will return multiple delivery notes if the sales order is divided into multiple loadCarriers. | *[GetSalesOrderDeliveryNotesById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrderDeliveryNotesById)* |
| 6  | Receive invoice lines by sales order ID.                                                                                                                                               | *[GetInvoiceLinesBySalesOrderId](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/InvoiceLines/GetInvoiceLinesBySalesOrderId)*  |

**Note:**\
NR 5 is a temporary endpoint which will become obsolete if the *Advanced shipping notes* endpoints will be implemented.

<br />

***

## NEW: Adding Additional Sticker Service to existing sales order

For the business rules concerning stickers, please read [Stickers via Floriday](https://developer.floriday.io/docs/customer-stickers).

**Purpose:**

* Adding an additional service of type sticker to an existing sales order;
* Placed Additional Sticker service will be matched by Floriday with existing addtional sticker services from supplier;
* Succesfully adding an additional sticker service will result in a new [sticker object](https://developer.floriday.io/docs/stickers#receiving-customer-stickers) with an optional PDF.

**Prerequisites:**

* Sales order must be placed on Floriday;
* Is linked to a salesOrder that has a latestOrderDateTime based on the delivery conditions of the supplier.

<br />

| NR | Process steps                                                                                                                                              | API call / scenario                                                                                                                                                   |
| :- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Adds an additional service of type sticker to an existing sales order.                                                                                     | *[AddSalesOrderAdditionalStickerService](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SalesOrders/AddSalesOrderAdditionalStickerService)* |
| 2  | Floriday matches additional services with existing additional services from supplier and adds the matched additional service to the sales order.           |                                                                                                                                                                       |
| 3  | After successfully matching the additional service, a new customer sticker object will be created by Floriday and linked to the corresponding sales order. |                                                                                                                                                                       |