---
updatedAt: 2026-06-15T07:25:13.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Connections

## Supported connection scenarios

* Receiving connections
* Creating supplier connections
* Removing supplier connections

For the business rules concerning connections, please read [Connections](https://developer.floriday.io/docs/connections-1).

<br />

***

## Receiving connections

**Purpose:**\
Receiving connections from Floriday.

<br />

**Prerequisites:**

* Customer has active connections on Floriday.

<br />

| NR  | Process step                                                                      | API call / scenario                                                                                                                                     |
| :-- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Returns list of all active connections.                                           | *[GetConnections](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Connections/GetConnections)*                                 |
| 2 A | Returns the maximum sequence number found in connections.                         | *[GetConnectionsMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Connections/GetConnectionsMaxSequence)*           |
| 2 B | Returns a list of max 1000 connections starting from a specified sequence number. | *[GetConnectionsBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Connections/GetConnectionsBySequenceNumber)* |

<br />

***

## Creating a new supplier connection

**Purpose:**\
Creating a new supplier connection on Floriday.

<br />

| NR | Process step                                              | API call / scenario                                                                                                                                                         |
| :- | :-------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Creates a new connection based on SupplierOrganisationId. | *[CreateConnectionBySupplierOrganizationId](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Connections/CreateConnectionBySupplierOrganizationId)* |
| 2  | Supplier will be notified on Floriday of a new connection |                                                                                                                                                                             |

<br />

***

## Deleting a connection on Floriday

**Purpose:**\
Delete a specific connection with a supplier on Floriday.

<br />

**Prerequisites:**

* Customer has an active connection with the specified supplier on Floriday.

<br />

| NR | Process step                                                                                                       | API call / scenario                                                                                                         |
| :- | :----------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| 1  | Removes a connection with a specified supplier based on SupplierOrganisationId.                                    | *[DeleteConnection](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Connections/DeleteConnection)* |
| 2  | Specified supplier will no longer have the customer as a connection but will not actively be notified by Floriday. |                                                                                                                             |