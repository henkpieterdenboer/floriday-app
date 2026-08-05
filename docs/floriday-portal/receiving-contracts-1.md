---
updatedAt: 2026-06-15T07:10:16.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Receiving contracts

## Sync Contracts

**Purpose:**\
Sync contracts from Floriday in supplier application.

**Prerequisites:**

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of delivery conditions;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of custom packages;
* The supplier organization and/or customer organization has inserted and accepted contracts with contract lines and attachments in the Floriday contract module.

<br />

**Process steps:**

| NR  | Process step                                                                                                                                                                                                                     | API call / scenario                                                                                                                               |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Get highest generated sequence number.                                                                                                                                                                                           | *[GetContractsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/GetContractsMaxSequence)*           |
| 2   | Sync contracts with contract lines with the current lowest sequence number and a max result limit in the supplier application.                                                                                                   | *[GetContractsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/GetContractsBySequenceNumber)* |
| 3   | Process the retrieved contracts and contract lines in the supplier application with their unique contract ID and version number. The contracts and contract lines will be added, updated or deleted in the supplier application. |                                                                                                                                                   |
| 4 A | Get contract attachments from contracts by attachmentID.                                                                                                                                                                         | *[GetContractAttachmentById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/GetContractAttachmentById)*       |
| 4 B | Get contract by ID.                                                                                                                                                                                                              | *[GetContractById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Contracts/GetContractById)*                           |
|     | Process the retrieved contract attachments in the supplier application.                                                                                                                                                          |                                                                                                                                                   |
|     | Repeat steps.                                                                                                                                                                                                                    |                                                                                                                                                   |