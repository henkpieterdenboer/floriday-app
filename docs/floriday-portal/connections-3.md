---
updatedAt: 2026-06-15T07:11:19.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Connections

## Supported connection scenarios

* Sync connections.

For the business rules concerning connections, please read [Connections](https://developer.floriday.io/docs/connections-1).

<br />

<br />

## Sync Connections

**Purpose:**\
Receive current connections on Floriday

<br />

| NR | Process steps                                                                      | API call / scenario                                                                                                                                     |
| :- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Returns the maximum sequence number found in connections.                          | *[GetConnectionsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Connections/GetConnectionsMaxSequence)*           |
| 2  | Returns a list of max 1000 connections starting  from a specified sequence number. | *[GetConnectionsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Connections/GetConnectionsBySequenceNumber)* |