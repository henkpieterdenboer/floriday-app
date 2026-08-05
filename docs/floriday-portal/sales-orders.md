---
updatedAt: 2026-06-15T07:13:22.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Sales Orders

## Supported scenarios

* Get Sales Orders;
* Add Sales Orders;
* Receive Sales Order events.

<br />

## Get Sales Orders

**Purpose:**\
Get sales sales orders from Floriday trading agent.

**Prerequisites:**

* The supplier application has the latest update of organization;
* The supplier application has the latest update of delivery conditions;
* The supplier application has the latest update of additional services;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of supply lines from Floriday.

<br />

**Process steps:**

| NR | Process step                                                                                                                                                                | API call / scenario                                                                                                                                     |
| :- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Sales orders are placed or cancelled in the channel by the customer organization on a supply-line with chosen deliverylocation, deliverydatetime and additional service(s). |                                                                                                                                                         |
| 2  | Sales orders are processed by Floriday.                                                                                                                                     |                                                                                                                                                         |
| 3A | Get all sales orders with a result limit.                                                                                                                                   | *[GetSalesOrders](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrders)*                                 |
|    | Process the retrieved sales-orders in the supplier application with their unique sales order ID.                                                                            |                                                                                                                                                         |
|    | Determine latest sequence number in the supplier application.                                                                                                               |                                                                                                                                                         |
|    | Sync sales orders by latest sequence number.                                                                                                                                | *[GetSalesOrdersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrdersBySequenceNumber)* |
|    | Process the retrieved sales-orders in the supplier application with their unique sales order ID.                                                                            |                                                                                                                                                         |
| 3B | Get sales orders (history) within a timeframe from a trade instrument.                                                                                                      | *[GetSalesOrders](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrders)*                                 |
|    | Process the retrieved sales-orders in the supplier application with their unique sales order ID.                                                                            |                                                                                                                                                         |
| 3C | Get sales orders (history) within a timeframe from a trade instrument.                                                                                                      | *[GetSalesOrderByIdAndVersion](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrderByIdAndVersion)*       |
|    | Process the retrieved sales-orders in the supplier application with their unique sales order ID and version.                                                                |                                                                                                                                                         |
| 4  | Sales orders are sent to the customer Channel by Floriday.                                                                                                                  |                                                                                                                                                         |
| 5  | Sales orders can be retrieved by the Customer organizations from the Customer channel.                                                                                      |                                                                                                                                                         |

<br />

<br />

## Add Sales Orders

**Purpose:**\
Add direct sales sales orders in Floriday trading agent.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of delivery conditions;
* The supplier application has the latest update of additional services;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update op supply lines from Floriday.

<br />

**Process steps:**

| NR | Process steps                                                                                   | API call / scenario                                                                                                           |
| :- | :---------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| 1  | Add a sales order in Floriday based on a supply line.                                           | *[AddSalesOrder](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders/AddSalesOrder)*         |
|    | Sales order is processed by Floriday.                                                           |                                                                                                                               |
| 2  | Sales orders are send to the Floriday customer Channel.                                         |                                                                                                                               |
| 4  | Sales orders can be retrieved by the Customer organizations from the Floriday Customer channel. |                                                                                                                               |
| 5  | Get sales order status                                                                          | *[GetSalesOrderById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrderById)* |

<br />

<br />

## Receive Sales Order events

**Purpose:**\
Receive sales order events for supplier applications with a server. See [Webhooks](https://developer.floriday.io/docs/webhooks).