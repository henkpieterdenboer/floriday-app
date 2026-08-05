---
updatedAt: 2026-06-15T14:58:15.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Delivery conditions

## Supported delivery conditions scenarios

* Receiving delivery condition sets.

For the business rules concerning delivery conditions, please read [Delivery conditions](https://developer.floriday.io/docs/delivery-conditions-1).

<br />

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

<br />

## Syncing delivery condition sets

<br />

#### Purpose:

To synchronize delivery condition set information from suppliers on Floriday.

<br />

| NR | Process step                                                                                | API call / scenario                                                                                                                                                                |
| :- | :------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns the maximum sequence number found in delivery condition sets.                       | *[GetDeliveryConditionDetailsMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/DeliveryConditions/GetDeliveryConditionSetsMaxSequence)*        |
| 2  | Returns a list of max 1000 delivery conditions starting  from a specified sequence number.  | *[GetDeliveryConditionSetsBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/DeliveryConditions/GetDeliveryConditionSetsBySequenceNumber)* |
| 3  | The retrieved delivery condition sets will be added or updated in the customer application. |                                                                                                                                                                                    |

***

<br />

## Receiving delivery conditions

<br />

#### Purpose

To return a delivery condition set by deliveryConditionSetId.

<br />

| NR | Process step                                                                                | API call / scenario                                                                                                                                              |
| :- | :------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns a delivery condition set by ID.                                                     | *[GetDeliveryConditionDetailsById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/DeliveryConditions/GetDeliveryConditionDetailsById)* |
| 2  | The retrieved delivery condition sets will be added or updated in the customer application. |                                                                                                                                                                  |