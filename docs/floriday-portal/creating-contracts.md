---
updatedAt: 2026-06-17T10:28:05.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Creating contracts

Under construction

## Creating contract drafts

**Purpose:**\
Creating contract drafts via the API instead of using the online Floriday customer portal.

<br />

| NR | Process steps                        | API call / scenario                                                                                             |
| :- | :----------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| 1  | Add a new contract draft to Floriday | *[AddContract](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/AddContract)* |

<br />

***

## Editing contract drafts

**Purpose:**

Editing the data of a contract draft.

| NR | Process steps                                  | API call / scenario                                                                                               |
| :- | :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| 1  | Update an existing contract draft based on id. | *[EditContract](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/EditContract)* |

<br />

***

## Approving and Declining finalized contracts

**Purpose:**\
Responding to finalized contracts from suppliers.

<br />

| NR | Process steps                                                                                | API call / scenario                                                                                                       |
| :- | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| 1a | Sets the contract status to `FINALIZED` and offers the contract to the supplier for approval | *[FinalizeContract](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/FinalizeContract)* |
| 2a | Supplier receives finalized contract and can either approve or decline contract.             |                                                                                                                           |
| 1b | Sets the state of the contract to `Approved` if already finalized by the supplier.           | *[ApproveContract](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/ApproveContract)*   |
| 2b | Creates valid contract for placing BlanketOrders.                                            |                                                                                                                           |
| 1c | Sets the state of the contract to `Declined` if already finalized by the supplier.           | *[DeclineContract](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/DeclineContract)*   |
| 2c | Supplier can either delete or adjust the declined contract as a draft.                       |                                                                                                                           |

<br />

***

## Deleting contracts approvals

**Purpose:**

* Makes it possible to retract contract approvals from suppliers when the contract approvals are not yet accepted;
* When contract is already approved, it will request for a contract delete.

<br />

| NR | Proces steps                                                                                       | API call / scenario                                                                                                                 |
| :- | :------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Deletes contract if contract is not yet approved. Requests delete by supplier if already approved. | *[RequestDeleteContract](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/RequestDeleteContract)* |

<br />

***

## Approve request for contract delete

**Purpose:**\
Approving contract delete requests created by supplier.

<br />

| NR | Proces steps                                          | API call / scenario                                                                                                                 |
| :- | :---------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Approves contract delete request created by supplier. | *[ApproveDeleteContract](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/ApproveDeleteContract)* |