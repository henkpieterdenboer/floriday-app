---
updatedAt: 2026-06-15T07:12:29.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Supply requests

## Supported supply requests scenarios

* Receiving supply requests
* Accepting supply requests
* Rejecting supply requests

For the business rules concerning supply requests, please read [Supply request](https://developer.floriday.io/docs/supply-request).

<br />

<br />

## Receiving supply requests

**Purpose:**\
Receiving supply requests which are created by the customer on the Floriday platform.

<br />

| NR  | Process step                                                                          | API call / scenario                                                                                                                                              |
| :-- | :------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 A | Returns a supply request based on an ID.                                              | *[GetSupplyRequestById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SupplyRequests/GetSupplyRequestById)*                           |
| 1 B | Returns the maximum sequence number found in supply requests.                         | *[GetSupplyRequestsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SupplyRequests/GetSupplyRequestsMaxSequence)*           |
| 1 B | Returns a list of max 1000 supply requests starting from a specified sequence number. | *[GetSupplyRequestsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SupplyRequests/GetSupplyRequestsBySequenceNumber)* |

<br />

<br />

## Accepting Supply requests

**Purpose:**\
Accepting supply requests which are created by the customer on the Floriday platform.

<br />

| NR | Process step                                               | API call / scenario                                                                                                                                    |
| :- | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Accept the supply request.                                 | *[SetSupplyRequestLineAccepted](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SupplyRequests/SetSupplyRequestLineAccepted)* |
| 2  | The supply request receives the status "Accepted".         |                                                                                                                                                        |
| 3  | Supply is added to Floriday with the type "CustomerOffer". |                                                                                                                                                        |

<br />

<br />

## Rejecting Supply requests

**Purpose:**\
Rejecting supply requests which are created by the customer on the Floriday platform.

<br />

| NR | Process step                                       | API call / scenario                                                                                                                                    |
| :- | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Reject the supply request.                         | *[SetSupplyRequestLineRejected](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/SupplyRequests/SetSupplyRequestLineRejected)* |
| 2  | The supply request receives the status "Rejected". |                                                                                                                                                        |