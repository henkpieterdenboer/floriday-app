---
updatedAt: 2026-06-17T10:27:00.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade item requests

## Supported trade item requests scenarios

* Receiving trade item requests
* Placing trade item requests

For the business rules concerning requests, please read [Trade item request](https://developer.floriday.io/docs/trade-item-request).

<br />

***

## Placing trade item requests

**Purpose:**\
Enables customer to request a trade item by specifying the characteristics of a desired trade item. Supplier can finalize this trade item in Floriday after accepting a trade item request.

<br />

| NR | Process step                 | API call / scenario                                                                                                                   |
| :- | :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Create a trade item request. | *[AddTradeItemRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CatalogRequests/AddTradeItemRequest)* |

<br />

***

## Receiving trade item requests

**Purpose:**\
Receiving updates of placed trade item requests.

<br />

| NR | Process step                                                                       | API call / scenario                                                                                                                                                     |
| :- | :--------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Return the trade item request by ID.                                               | *[GetTradeItemRequestById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CatalogRequests/GetTradeItemRequestById)*                           |
| 2  | Return the maximum sequence number found in trade item requests.                   | *[GetTradeItemRequestsMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CatalogRequests/GetTradeItemRequestsMaxSequence)*           |
| 3  | Returns a list of max 1000 connections starting  from a specified sequence number. | *[GetTradeItemRequestsBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CatalogRequests/GetTradeItemRequestsBySequenceNumber)* |