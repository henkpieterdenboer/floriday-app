---
updatedAt: 2026-06-17T10:29:33.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Blanket orders

## Placing blanket orders

**Purpose:**\
Add direct sales blanket orders in Floriday trading agent.

**Prerequisites:**

* There are contracts available on the Floriday platorm;
* Contracts have the status "Approved";
* Blanket order is placed on specific ContractId.

<br />

| NR | Proces steps                                                                                                                                         | API call / scenario                                                                                                     |
| :- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| 1  | Creates a new blanket order                                                                                                                          | *[AddBlanketOrder](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/AddBlanketOrder)* |
| 2  | Floriday matches blanket order to the bandwiths of the contract.                                                                                     |                                                                                                                         |
| 2A | When a blanket order falls within the bandwith of the contract, Floriday will create a sales order.                                                  | SalesOrder                                                                                                              |
| 2B | When a blanket order does not fall within the bandwith of the contract, Floriday will notify the supplier that the blanket order has to be approved. | Response: Status *Pending*                                                                                              |

<br />

***

## Receiving blanket orders

**Purpose:**\
Receive direct sales blanket orders from Floriday trading agent.

**Prerequisites:**

* There are blanket orders placed on the Floriday trading agent.

<br />

| NR | Proces steps                                                                                   | API call / scenario                                                                                                                                       |
| :- | :--------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns a blanket order by ID.                                                                 | *[GetBlanketOrderById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/GetBlanketOrderById)*                           |
| 2  | Returns the maximum sequence number found in blanket orders.                                   | *[GetBlanketOrdersMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/GetBlanketOrdersMaxSequence)*           |
| 3  | Returns a list with a maximum of 1000 blanket orders starting from a specified sequencenumber. | *[GetBlanketOrdersBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/GetBlanketOrdersBySequenceNumber)* |

<br />

***

## Finalizing, Approving, or Declining blanket orders.

**Purpose:**\
Finalizing concept blanket orders, approving or declining blanket orders in Floriday trading agent.

<br />

| Nr | Proces steps                                                             | API call / scenario                                                                                                                       |
| :- | :----------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Sets the ApprovalStatus of the blanket order from Draft to Finalized.    | *[SetBlanketOrderFinalized](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/SetBlanketOrderFinalized)* |
| 2  | Sets the ApprovalStatus of the blanket order from Finalized to Approved. | *[SetBlanketOrderApproved](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/SetBlanketOrderApproved)*   |
| 3  | Sets the ApprovalStatus of the blanket order from Finalized to Declined. | *[SetBlanketOrderDeclined](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/SetBlanketOrderDeclined)*   |

<br />

***

## Modifying an existing blanket order

**Purpose:**\
Finalizing concept blanket orders, approving or declining blanket orders in Floriday trading agent.

<br />

| Nr | Proces  steps                       | API call / scenario                                                                                                       |
| :- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| 1  | Modifies an existing blanket order. | *[EditBlanketOrder](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/EditBlanketOrder)* |