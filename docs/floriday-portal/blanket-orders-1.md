---
updatedAt: 2026-06-15T07:10:40.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Blanket orders

## Sync Blanket orders

**Purpose:**\
Sync blanket orders from Floriday in supplier application.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of delivery conditions;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of custom packages;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of contracts;
* The supplier organization and/or customer organization has inserted blanket orders in the Floriday.

<br />

**Process steps:**

| NR | Process step                                                                                                                                                                 | API call / scenario                                                                                                                                           |
| :- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Get highest generated sequence number.                                                                                                                                       | *[GetBlanketOrdersMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BlanketOrders/GetBlanketOrdersMaxSequence)*           |
| 2  | Sync blanket orders with the current lowest sequence number and a max result limit in the supplier application.                                                              | *[GetBlanketOrdersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BlanketOrders/GetBlanketOrdersBySequenceNumber)* |
| 3  | Process the blanket orders in the supplier application with their unique blanket order ID. The blanket orders will be added, updated or deleted in the supplier application. |                                                                                                                                                               |
|    | Repeat steps.                                                                                                                                                                |                                                                                                                                                               |

<br />

<br />

## Approve Blanket orders

**Purpose:**\
Approving finalized blanket orders from the customer in Floriday.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of delivery conditions;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of custom packages;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of contracts;
* The supplier application has the latest update of blanket orders;
* The user has approved blanket orders in the supplier application.

<br />

**Process steps:**

| NR | Process step                                                                                                                                                                  | API call / scenario                                                                                                                                           |
| :- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Place finalized blanket order by the customer organization in the Floriday.                                                                                                   |                                                                                                                                                               |
| 2  | The finalized blanket order will be available for the supplier organization in Floriday.                                                                                      | *[GetBlanketOrdersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BlanketOrders/GetBlanketOrdersBySequenceNumber)* |
| 3  | Approve a finalized blanket order with a final price, quantity, trade-item and packingconfiguration, delivery date/time within contract-line margins and a dispatchwarehouse. | *[SetBlanketOrderApproved](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BlanketOrders/SetBlanketOrderApproved)*                   |
|    | The approved blanket order is validated by Floriday and will be processed in Floriday.                                                                                        |                                                                                                                                                               |
| 4  | The approved blanket order will be available for the customer organization in Floriday.                                                                                       |                                                                                                                                                               |
| 5  | The approved blanket order can be retrieved by the Customer organization from Floriday.                                                                                       |                                                                                                                                                               |
| 6  | Get new sales orders that will be automatically created based on blanket orders.                                                                                              | *[GetSalesOrdersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrdersBySequenceNumber)*       |
| 7  | The sales orders will be processed in the supplier application.                                                                                                               |                                                                                                                                                               |
| 8  | The sales orders will be available for the customer organization in Floriday.                                                                                                 |                                                                                                                                                               |
| 9  | The sales order can be retrieved by the Customer organization from Floriday.                                                                                                  |                                                                                                                                                               |

<br />

<br />

## Create Blanket orders

**Purpose:**\
Creating new approved blanket orders in Floriday.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of delivery conditions;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of custom packages;
* The supplier application has the latest update of warehouses;
* The supplier application has the latest update of contracts;
* The user has inserted blanket orders in the supplier application;
* The user has approved inserted blanket orders in the supplier application.

<br />

**Process steps:**

| NR | Process step                                                                                                                                                                  | API call / scenario                                                                                                                                     |
| :- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Create finalized blanket order by the supplier organization in the Floriday.                                                                                                  | *[AddBlanketOrder](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BlanketOrders/AddBlanketOrder)*                             |
|    | The new blanket order is validated by Floriday and will be processed in Floriday.                                                                                             |                                                                                                                                                         |
| 2  | The finalized blanket order will be available for the customer organization in Floriday.                                                                                      |                                                                                                                                                         |
| 3  | The finalized blanket order can be retrieved by the customer organization from Floriday.                                                                                      |                                                                                                                                                         |
| 4  | Approve a finalized blanket order with a final price, quantity, trade item and packingconfiguration, delivery date/time within contract-line margins and a dispatchwarehouse. | *[SetBlanketOrderApproved](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BlanketOrders/SetBlanketOrderApproved)*             |
|    | The approved blanket order is validated by Floriday and will be processed in Floriday.                                                                                        |                                                                                                                                                         |
| 5  | The approved blanket order will be available for the customer organization in Floriday.                                                                                       |                                                                                                                                                         |
| 6  | The approved blanket order can be retrieved by the Customer organization from Floriday.                                                                                       |                                                                                                                                                         |
| 7  | Get new sales orders that will be automatically created based on blanket orders.                                                                                              | *[GetSalesOrdersBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SalesOrders/GetSalesOrdersBySequenceNumber)* |
| 8  | The sales orders will be processed in the supplier application.                                                                                                               |                                                                                                                                                         |
| 9  | The sales orders will be available for the customer organization in Floriday.                                                                                                 |                                                                                                                                                         |
| 10 | The sales order can be retrieved by the Customer organization from Floriday.                                                                                                  |                                                                                                                                                         |