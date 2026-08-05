---
updatedAt: 2026-06-17T10:27:37.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Supply requests

## Supported supply requests scenarios

* Receiving supply requests;
* Placing supply requests;
* Editing existing supply requests;
  * Rewriting the base properties of an existing supply request;
  * Adding a new supply line to an existing supply request;
  * Deleting a supply line from an existing supply request;
  * Deleting a supply request;
* Setting supply requests line as selected.

For the business rules concerning requests, please read [Supply request](https://developer.floriday.io/docs/supply-request).

<br />

***

## Placing supply requests

**Purpose:**\
Enables customers to request one or more missing supply lines to be added to a specific trade item by specifying one or more supply lines in this request. After the supplier has accepted the supply request, the supply line(s) are added in Floriday.

<br />

| NR | Process step             | API call / scenario                                                                                                            |
| :- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| 1  | Create a supply request. | *[AddSupplyRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyRequests/AddSupplyRequest)* |

<br />

***

## Receiving supply requests

**Purpose:**\
Receiving updates of placed supply requests.

<br />

| NR | Process step                                                                     | API call / scenario                                                                                                                                              |
| :- | :------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1a | Return the supply request by ID.                                                 | *[GetSupplyRequestById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyRequests/GetSupplyRequestById)*                           |
| 1b | Return the maximum sequence number found in supply requests.                     | *[GetSupplyRequestsMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyRequests/GetSupplyRequestsMaxSequence)*           |
| 2b | Return a list of max 1000 connections starting from a specified sequence number. | *[GetSupplyRequestsBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyRequests/GetSupplyRequestsBySequenceNumber)* |

<br />

***

## Editing existing supply request

**Purpose:**\
Editing placed supply requests.

<br />

| NR | Process step                                                                    | API call / scenario                                                                                                                          |
| :- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- |
| 1a | Rewrite the properties of an existing supply request                            | *[EditSupplyRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyRequests/EditSupplyRequest)*             |
| 1b | Add supply request llines to an existing supply request                         | *[AddSupplyRequestLine](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyRequests/AddSupplyRequestLine)*       |
| 1c | Delete supply request llines from an existing supply request                    | *[DeleteSupplyRequestLine](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyRequests/DeleteSupplyRequestLine)* |
| 2c | Supply lines created from accepted supply request lines will be set as deleted. |                                                                                                                                              |
| 1d | Delete a supply request and its supply request lines                            | *[DeleteSupplyRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyRequests/DeleteSupplyRequest)*         |
| 2d | Supply lines created from accepted supply request lines will be set as deleted. |                                                                                                                                              |

<br />

***

## Sets the selected supply request line as selected

**Purpose:**\
Locking one or more selected supply lines to prevent the supplier from making changes to them.

<br />

| NR | Process step                             | API call / scenario                                                                                                                                                        |
| :- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Setting supply request line as selected. | *[SetSupplyRequestLineIsLockedByCustomer](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyRequests/SetSupplyRequestLineIsLockedByCustomer)* |