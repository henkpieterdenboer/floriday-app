---
updatedAt: 2026-06-15T07:12:13.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Packing configuration requests

## Supported packing configuration requests scenarios

* Receiving packing configuration requests
* Accepting packing configuration requests
* Rejecting packing configuration requests

For the business rules concerning supply requests, please read [Packing configuration request](https://developer.floriday.io/docs/packing-configuration-request).

<br />

## Receiving packing configuration requests

**Purpose:**\
Receiving packing configuration requests which are placed by buyers in order to accept or reject them.

<br />

| NR  | Process step                                                                                         | API call / scenario                                                                                                                                                                                        |
| :-- | :--------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 A | Returns a packing configuration request based on an ID.                                              | *[GetPackingConfigurationRequestById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/PackingConfigurationRequests/GetPackingConfigurationRequestById)*                           |
| 1 B | Returns the maximum sequence number found in packing configuration requests.                         | *[GetPackingConfigurationRequestsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/PackingConfigurationRequests/GetPackingConfigurationRequestsMaxSequence)*           |
| 1 B | Returns a list of max 1000 packing configuration requests starting from a specified sequence number. | *[GetPackingConfigurationRequestsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/PackingConfigurationRequests/GetPackingConfigurationRequestsBySequenceNumber)* |

<br />

<br />

## Accepting packing configuration requests

**Purpose:**\
Accepting packing configuration request because the grower wants to add the requested packing configuration to Floriday.

<br />

| NR | Process step                                                      | API call / scenario                                                                                                                                                                      |
| :- | :---------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Accept the packing configuration request.                         | *[SetPackingConfigurationRequestAccepted](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/PackingConfigurationRequests/SetPackingConfigurationRequestAccepted)* |
| 2  | The packing configuration request receives the status "Accepted". |                                                                                                                                                                                          |
| 3  | The new packing configuration will be added to Floriday.          |                                                                                                                                                                                          |

<br />

<br />

## Rejecting packing configuration requests

**Purpose:**\
Rejecting packing configuration request because grower does not want to add the requested packing configuration to Floriday.

<br />

| NR | Process step                                                      | API call / scenario                                                                                                                                                                      |
| :- | :---------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Reject the packing configuration request                          | *[SetPackingConfigurationRequestRejected](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/PackingConfigurationRequests/SetPackingConfigurationRequestRejected)* |
| 2  | The packing configuration request receives the status "Rejected". |                                                                                                                                                                                          |