---
updatedAt: 2026-06-15T07:09:33.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Creating contracts

## Supported scenarios

* Creating contract drafts
* Editing contract drafts
* Approving/Declining finalized contracts
* Deleting contract approvals
* Approve request for contract delete

<br />

<br />

<br />

## Creating contract drafts

**Purpose:**\
Creating contract drafts via the API in stead of using the online Floriday supplier portal.

<br />

| NR | Proces steps                            | API call / scenario                                                                                             |
| :- | :-------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| 1  | Adding a new contract draft to Floriday | *[AddContract](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/AddContract)* |

<br />

<br />

## Editing contract drafts

| NR | Proces steps                                     | API call / scenario                                                                                               |
| :- | :----------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| 1  | Updating an existing contract draft based on id. | *[EditContract](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/EditContract)* |

<br />

<br />

## Approving and Declining finalized contracts

**Purpose:**\
Responding to finalized contracts from suppliers.

<br />

| NR | Proces steps                                                                                 | API call / scenario                                                                                                       |
| :- | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| 1a | Sets the contract status to `FINALIZED` and offers the contract to the customer for approval | *[FinalizeContract](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/FinalizeContract)* |
| 2a | Customer receives finalized contract and can either approve or decline contract.             |                                                                                                                           |
| 1b | Setst the state of the contract to `Approved` if already finalized by the customer.          | *[ApproveContract](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/ApproveContract)*   |
| 2b | Creates valid contract for placing BlanketOrders.                                            |                                                                                                                           |
| 1c | Setst the state of the contract to `Declined` if already finalized by the customer.          | *[DeclineContract](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/DeclineContract)*   |
| 2c | Customer can either delete or adjust the declined contract as a draft.                       |                                                                                                                           |

<br />

<br />

## Deleting contract approvals

**Purpose:**

* Makes it possible to retract contract approvals from customers when the contract approvals are not yet accepted;
* When contract is allready approved, it will request for a contract delete.

<br />

| NR | Proces steps                                                                                       | API call / scenario                                                                                                                 |
| :- | :------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Deletes contract if contract is not yet approved. Requests delete by customer if already approved. | *[RequestDeleteContract](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/RequestDeleteContract)* |

<br />

<br />

## Approve request for contract delete

**Purpose:**\
Approving contract delete requests created by customer.

<br />

| NR | Proces steps                                          | API call / scenario                                                                                                                 |
| :- | :---------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Approves contract delete request created by customer. | *[ApproveDeleteContract](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/ApproveDeleteContract)* |