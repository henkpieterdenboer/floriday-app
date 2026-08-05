---
updatedAt: 2026-06-12T08:02:37.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Delivery conditions sets

## Supported scenarios

* Receive delivery condition sets;
* Sync delivery condition sets;

For the business rules concerning delivery conditions, please read [Business Rules - Delivery conditions](https://developer.floriday.io/docs/delivery-conditions-1).

***

<br />

## Sync Delivery Conditions sets

<br />

#### Purpose

Get the information of the supplier organization delivery conditions.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations.
* The supplier application has the latest update of warehouses.
* The user has added delivery condition sets applicable for its warehouse(s) in the Floriday application with or without customers organizations for direct sales.

***

<br />

#### Process steps

| NR  | Process step                                                                                         | API call / scenario                                                                                                                                                                   |
| :-- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 A | Returns the maximum sequence number found in Delivery condition sets.                                | *[GetDeliveryConditionSetsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryConditionSets/GetDeliveryConditionSetsMaxSequence)*           |
| 1 B | Return a list of max 100 delivery condition sets starting from a specified sequence number.          | *[GetDeliveryConditionSetsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryConditionSets/GetDeliveryConditionSetsBySequenceNumber)* |
| 2   | The retrieved delivery condition sets will be added, updated or deleted in the supplier application. |                                                                                                                                                                                       |

***

<br />

## Get Delivery Conditions sets

<br />

#### Purpose

Get the information of the supplier organization delivery conditions.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations.
* The supplier application has the latest update of warehouses.
* The user has added delivery condition sets applicable for its warehouse(s) in the Floriday application with or without customers organizations for direct sales.

***

<br />

#### Process steps

| NR  | Process step                                                                                         | API call / scenario                                                                                                                                         |
| :-- | :--------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 A | Get delivery condition sets with delivery conditions for warehouse locations.                        | *[GetDeliveryConditionSets](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryConditionSets/GetDeliveryConditionSets)*       |
| 1 B | Get delivery condition sets with delivery conditions for warehouse locations based on ID.            | *[GetDeliveryConditionSetById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DeliveryConditionSets/GetDeliveryConditionSetById)* |
| 2   | The retrieved delivery condition sets will be added, updated or deleted in the supplier application. |                                                                                                                                                             |