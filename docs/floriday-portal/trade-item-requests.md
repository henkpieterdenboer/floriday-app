---
updatedAt: 2026-06-15T07:11:59.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade item requests

## Supported trade item requests scenarios

* Receiving trade item requests
* Accepting trade item requests
* Rejecting trade item requests

For the business rules concerning supply requests, please read [Trade item request](https://developer.floriday.io/docs/trade-item-request).

<br />

## Receiving trade item requests

**Purpose:**\
Receiving trade item requests which are placed by buyers in order to accept or reject them.

<br />

| NR  | Process step                                                                              | API call / scenario                                                                                                                                                       |
| :-- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 A | Returns a trade item request based on an ID.                                              | *[GetTradeItemRequestById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItemRequests/GetTradeItemRequestById)*                           |
| 1 B | Returns the maximum sequence number found in trade item requests.                         | *[GetTradeItemRequestsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItemRequests/GetTradeItemRequestsMaxSequence)*           |
| 1 B | Returns a list of max 1000 trade item requests starting from a specified sequence number. | *[GetTradeItemRequestsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItemRequests/GetTradeItemRequestsBySequenceNumber)* |

<br />

<br />

## Accepting trade item requests

**Purpose:**\
Accepting trade item request because the grower wants to add the requested trade item to Floriday.

<br />

Consists of multiple steps:

* Making sure there is a matching trade item for the received trade item request by:
  * [Create a new trade item;](https://developer.floriday.io/v2022.1/docs/trade-items#create-trade-items)
  * Updating an existing trade item (by including the customer in a customer specific trade item for example);
* Refer to the new trade item id while accepting the trade item request.

<br />

> 👍 Validation for succesful accept
>
> * Request must have status PENDING;
> * Request cannot be EXPIRED;
> * Request must be sent to supplier;
> * Trade item must be in catalog of supplier;
> * Trade item must be visible for customer (*customerspecific: FALSE* or customer specific for that customer);
> * Trade item must not be hidden;
> * Requested packing configuration must be added to trade item.

| NR  | Process step                                                                           | API call / scenario                                                                                                                                     |
| :-- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 A | Add trade item to Floriday with the specified characteristics from trade item request. | *[AddTradeItem](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/AddTradeItem)*                                      |
| 1 B | Updating an existing trade item to match the criteria of the trade item request.       | *[EditTradeItem](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/EditTradeItem)*                                    |
| 3   | Accept trade item request, and include trade item id from added trade item.            | *[SetTradeItemRequestAccepted](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItemRequests/SetTradeItemRequestAccepted)* |
| 4   | The trade item request receives the status "Accepted".                                 |                                                                                                                                                         |

<br />

<br />

## Rejecting trade item requests

**Purpose:**\
Rejecting trade item request because grower does not want to add the requested trade item to Floriday.

<br />

| NR | Process step                                           | API call / scenario                                                                                                                                     |
| :- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Reject trade item request.                             | *[SetTradeItemRequestRejected](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItemRequests/SetTradeItemRequestRejected)* |
| 2  | The trade item request receives the status "Rejected". |                                                                                                                                                         |