---
updatedAt: 2026-06-15T14:57:59.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Warehouses

## Supported warehouse scenarios

* Receiving warehouses.

For the business rules concerning warehouses, please read [Warehouses](https://developer.floriday.io/docs/warehouses-1).

<br />

***

## Receiving warehouses

**Purpose:**\
Receive warehouse information from suppliers on Floriday.

<br />

| NR  | Process step                                                                      | API call / scenario                                                                                                                                  |
| :-- | :-------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Returns a warehouse by ID.                                                        | *[GetWarehouseById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Warehouses/GetWarehouseById)*                           |
| 2 A | Returns the maximum sequence number found in warehouses.                          | *[GetWarehousesMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Warehouses/GetWarehousesMaxSequence)*           |
| 2 B | Returns a list of max 1000 warehouses starting  from a specified sequence number. | *[GetWarehousesBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Warehouses/GetWarehousesBySequenceNumber)* |