---
updatedAt: 2026-06-17T10:29:18.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Receiving contracts

## Receiving contracts

**Purpose:**\
Sync contract information and included contract lines from Floriday.

<br />

**Prerequisites:**

* There are contracts available on the Floriday platform;
* Contracts have the status "Approved".

<br />

| NR | Proces steps                                                                              | API call / scenario                                                                                                                               |
| :- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Returns the maximum sequence number found in contracts.                                   | *[GetContractsMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/GetContractsMaxSequence)*           |
| 2  | Returns a list with a maximum of 1000 contracts starting from a specified sequencenumber. | *[GetContractsBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/GetContractsBySequenceNumber)* |

<br />

***

## Receiving contract attachments

**Purpose:**\
Get contract attachments uploaded to Floriday.

**Prerequisites:**

* There are contracts available on the Floriday platorm;
* Contracts have the status "Approved";
* Contracts have attachments.

<br />

| NR | Process steps                                                                     | API call / scenario                                                                                                                         |
| :- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Returns attachment file of a specific contract (AttachmentDetails - AttachmentId) | *[GetContractAttachmentById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Contracts/GetContractAttachmentById)* |