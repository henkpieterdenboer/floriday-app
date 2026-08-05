---
updatedAt: 2026-06-12T09:41:23.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade item availabilities

## Supported scenarios

* Sync Trade item availabilities;
* Get Trade item availabilities;
* Toggle Trade item availabilities.

For the business rules concerning trade item availabilities, please read [Business Rules - Trade item availabilities](https://developer.floriday.io/docs/trade-item-availabilities2).

> 🚧 Continuous stock to be called Trade item availabilities
>
> We decided to rename the term **Continuous Stock** to **Trade item availabilities**. We feel this change better describes the purpose of the feature. For now, this change will only be made in the API Documentation.
>
> The endpoints [GetContinuousStock](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetContinuousStock) and [EditContinuousStock](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/EditContinuousStock) will remain unchanged for now. Once a functional change is planned for these endpoints, we will rename the endpoints to match the new term. We will communicate the changes to these endpoints well in advance.

<br />

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

<br />

## Sync Trade item availabilities

<br />

#### Purpose

Synchronize Trade Item Availabilities from Floriday in supplier application.

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The user has set or changed its current Trade item availability in Floriday.

<br />

#### Process steps

| NR | Process step                                                           | API call / scenario                                                                                                                                                             |
| :- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Return the maximum sequence number found in trade item availabilities. | [GetTradeItemAvailabilitiesMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetTradeItemAvailabilitiesMaxSequence)           |
| 2  | Sync all trade item availabilities with a result limit.                | [GetTradeItemAvailabilitiesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetTradeItemAvailabilitiesBySequenceNumber) |

***

<br />

## Get Trade item availabilities

<br />

#### Purpose

Get Trade item availability of a trade item from Floriday in supplier application.

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The user has set or changed its current Trade item availability in Floriday.

<br />

#### Process steps

| NR | Process step                                                                           | API call / scenario                                                                                                               |
| :- | :------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Get current Trade item availability of trade items with or without excluded customers. | *[GetContinuousStock](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetContinuousStock)* |
| 2  | The retrieved Trade item availability is processed in the supplier application.        |                                                                                                                                   |

***

<br />

## Toggle Trade item availability

<br />

#### Purpose

Set Trade item availability on **available** or **not available** in Floriday.

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade-items;
* The user has set or changed its current Trade item availability in the supplier application.

<br />

#### Process steps

| NR | Process step                                                                                                                         | API call / scenario                                                                                                                 |
| :- | :----------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Toggle current availability (true or false) of an existing trade item with an unique tradeItemId with or without excluded customers. | *[EditContinuousStock](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/EditContinuousStock)* |
|    | The Trade item availability is set to available (true) or not available (false) in Floriday.                                         |                                                                                                                                     |

***

<br />

> 📘 Set Trade item availability for excluded customers
>
> An exception for the Trade item availability can be set by adding specific customers to `excludedCustomerOrganizationIds`.
>
> For instance, if `available` is set to False, but a customerOrganzationId has been added to `excludedCustomerOrganizationIds`, the Trade item availability for that specific customer will be set to True.
>
> * This means that the supply line will only be available for that specific customer.
> * You can also exclude certain customers by setting `available` to True in a similar manner.
> * More than one customerOrganizationId may be added to `excludedCustomerOrganizationIds`.