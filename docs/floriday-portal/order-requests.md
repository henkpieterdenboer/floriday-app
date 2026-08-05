---
updatedAt: 2026-06-15T07:12:44.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Order requests

## Supported order requests scenarios

* Receiving order requests
* Accepting order requests
* Rejecting order requests

For the business rules concerning order requests, please read [Order requests](https://developer.floriday.io/docs/purchase-order-requests-1).

<br />

<br />

## Receiving order requests

**Purpose:**\
Receiving order requests and updates.

| NR  | Process step                                                                          | API call / scenario                                                                                                                                           |
| :-- | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 A | Returns a order request based on an ID.                                               | *[GetOrderRequestById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/OrderRequests/GetOrderRequestById)*                           |
| 1 B | Returns the maximum sequence number found in order requests.                          | *[GetOrderRequestsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/OrderRequests/GetOrderRequestsMaxSequence)*           |
| 1 B | Returns a list of max 1000 order requests starting  from a specified sequence number. | *[GetOrderRequestsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/OrderRequests/GetOrderRequestsBySequenceNumber)* |

<br />

<br />

## Accepting order Requests

**Purpose:**\
Accepting order request.

<br />

> 👍 Validation
>
> * Order request must have status PENDING;
> * Request must be sent to the accepting supplier organization.

<br />

| NR | Process step                                               | API call / scenario                                                                                                                         |
| :- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Accepting order request.                                   | *[SetOrderRequestAccepted](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/OrderRequests/SetOrderRequestAccepted)* |
| 2  | Order request receives the status "Accepted".              |                                                                                                                                             |
| 3  | Sales order based on order request is created by Floriday. |                                                                                                                                             |

<br />

<br />

## Rejecting order Requests

**Purpose:**\
Rejecting order Requests.

<br />

| NR | Process step                                  | API call / scenario                                                                                                                         |
| :- | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Rejecting order request.                      | *[SetOrderRequestRejected](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/OrderRequests/SetOrderRequestRejected)* |
| 2  | Order request receives the status "Rejected". |                                                                                                                                             |