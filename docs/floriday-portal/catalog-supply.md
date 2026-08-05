---
updatedAt: 2026-06-15T07:05:30.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Catalog supply

## Supported scenarios

Use Weekly Base Supply, which creates supply lines based on pre-entered price groups that are created in the Floriday application.

* **Weekly Base Supply**
  * Create Weekly Base Supply;
  * Get Weekly Base Supply Lines;
  * Toggle Trade item availabilities;
  * Sync availabilities;
  * Get availaibilites.

<br />

Use Weekly Supply lines, which creates customer specific supply lines and are created entirely in the Supplier application.

* **Weekly Supply lines**
  * Add Weekly Supply lines;
  * Edit Weekly Supply lines;
  * Delete Weekly Supply lines.
  * Toggle Trade item availabilities;
  * Sync availabilities
  * Get availaibilites

<br />

For the Business rules concerning Catalog supply and the difference between both methods of creating Catalog Supply, please read [Business Rules - Catalog Supply](https://developer.floriday.io/docs/direct-sales-catalog-supply-1).

> 📘 **Note**
>
> Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

<br />

> 🚧 **Warning**
>
> Important developments - Adjustable weekly prices
>
> Weekly base supply is characterized by the fact that prices are fixed for the next week, once prices are entered after Thursday at 10:00 AM CET.
>
> Starting October 1st 2024, it will be possible to change the prices of Weekly Base supply once every 24 hours.
>
> Read [the news article](https://www.floriday.io/en/news/adjustable-weekly-prices-in-floriday-from-1-october) regarding Adjustable weekly prices for more information.

***

<br />

# Weekly Base Supply

<br />

## Create Weekly Base Supply

<br />

#### Purpose

Creating weekly base supply for a specific period (year/week).

***

<br />

#### Prerequisites

* The supplier application has the latest update of `[organizations]`(doc:organizations);
* The supplier application has the latest update of [trade items](https://developer.floriday.io/docs/trade-items);
* The user has created one or more **Customer specific** price groups, containing at least one customer Organization for Direct Sales in the Floriday application;

<br />

***

#### Process steps

| NR | Process step                                                                                                                                                         | API call / scenario                                                                                                                 |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Adds Weekly base supply for the entered tradeItemId, including availability, a base price for price calculation, an indicative quantity and the weekly trade period. | [EditWeeklyBaseSupply](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/EditWeeklyBaseSupply) |
|    | Weekly Base Supply will be updated in Floriday based on price conditions and delivery conditions.                                                                    |                                                                                                                                     |
| 2  | Weekly Base Supply will be updated in the Customer channels.                                                                                                         |                                                                                                                                     |
| 3  | Weekly Base supply can be retrieved by the Customer organizations from the Customer channel.                                                                         |                                                                                                                                     |

<br />

***

<br />

## Get Weekly Base Supply

<br />

#### Purpose

To retrieve existing weekly base supply from a specific period (year/week).

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The user has created one or more price groups, containing at least one customer Organization for Direct Sales in the Floriday application;
* The user has created Weekly base supply for at least one trade item by setting the number of pieces and price, in a specific week and year.
  * Weekly base supply may be created in either the Floriday application or the supplier application.

<br />

![ ](https://files.readme.io/5f23360-image.png)

<br />

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                               | API call / scenario                                                                                                                   |
| :- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Returns Weekly base supply created within the given year and week.                                                                                                                         | [GetWeeklyBaseSupplies](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetWeeklyBaseSupplies) |
| 2  | Process the retrieved Weekly base supply in the supplier application. Base supply is shown per tradeItemId. The base supply will be added, updated or deleted in the supplier application. |                                                                                                                                       |

<br />

***

<br />

## Update Weekly Base Supply

<br />

#### Purpose

Update the number of pieces, set a warehouse or toggle the availability of existing weekly base supply, based on tradeItemId.

***

<br />

#### Prerequisites

* The supplier application has the latest update of trade items;
* The supplier application has the latest update of warehouses.
* The user has created Weekly base supply for at least one trade item.
* The supplier application has the latest update of Weekly base supply;

***

<br />

#### Process steps

| NR | Process step                                                   | API call / scenario                                                                                                                                           |
| :- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1A | Update the number of pieces of an existing Weekly base supply. | [SetWeeklyBaseSupplyNumberOfPieces](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/SetWeeklyBaseSupplyNumberOfPieces) |
| 1B | Set a warehouse for an existing Weekly base supply.            | [SetTradeItemWarehouse](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/SetTradeItemWarehouse)                         |

<br />

> 👍 Setting a warehouse for a trade item
>
> Optionally, a user may set a warehouse for a trade item used in Catalog supply. Setting a warehouse indicates that this trade item is offered from a specific warehouse.
>
> Since Delivery conditions apply to warehouses as well, a user may appoint specific delivery conditions to a specific trade item in Catalog supply this way. This means that products that are sold from warehouse A can have different delivery conditions than products sold from warehouse B.

***

<br />

## Toggle Trade item availabilities

<br />

#### Purpose

To set trade items used in Catalog supply to **available** or **unavailable** and optionally creating exceptions for customer Organizations.

***

<br />

#### Prequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of warehouses.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                                                           | API call / scenario                                                                                                                                                                                                                       |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Toggle the availability of a trade item. Optionally add customerOrganizationIds as an exception. For instance, if a trade item is available, it will be unavailable for the added customerOrganizations and vice versa | [EditContinuousStock](tps://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/EditContinuousStockhttps://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/EditContinuousStock) |

***

<br />

## Sync trade item availabilities

#### Purpose

To sync the availabilities of trade items used in Catalog supply.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of warehouses.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                  | API call / scenario                                                                                                                                                             |
| :- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Get highest generated sequence number.                                                                                                                                        | [GetTradeItemAvailabilitiesMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetTradeItemAvailabilitiesMaxSequence)           |
| 1  | Sync trade item availabilities with limit and latest sequence number.                                                                                                         | [GetTradeItemAvailabilitiesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetTradeItemAvailabilitiesBySequenceNumber) |
| 2  | Process the retrieved trade item availabilites in the supplier application on a tradeItemId basis. The trade item availabilities will be updated in the supplier application. |                                                                                                                                                                                 |

***

<br />

## Get trade item availabilities

<br />

#### Purpose

To retrieve the availabilities of trade items used in Catalog supply.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of warehouses.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                  | API call / scenario                                                                                                                             |
| :- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Get trade item availabilities of all trade items in Catalog Supply.                                                                                                           | [GetTradeItemAvailabilities](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetTradeItemAvailabilities) |
| 2  | Process the retrieved trade item availabilites in the supplier application on a tradeItemId basis. The trade item availabilities will be updated in the supplier application. |                                                                                                                                                 |

***

<br />

# Weekly Supply lines

<br />

## Add Weekly Supply lines

<br />

#### Purpose

To add new weekly supply lines for trade items.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has weekly supply-lines;

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                                | API call / scenario                                                                                                               |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Create customer specific supply lines for a trade item in a specific week, including prices, indicative available quantity, sales unit and included services (Transport and Sticker costs). | [AddWeeklySupplyLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/AddWeeklySupplyLine) |
|    | Weekly Supply lines will be created in Floriday based on delivery conditions.                                                                                                               |                                                                                                                                   |
| 2  | Weekly Supply lines will be allocated in the Customer channels.                                                                                                                             |                                                                                                                                   |
| 3  | Weekly supply lines can be retrieved by Customer organizations from the Customer channel.                                                                                                   |                                                                                                                                   |

***

<br />

## Update Weekly Supply lines

<br />

#### Purpose

To update existing Weekly supply lines in Floriday, based on `supplyLineId`.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The user has created Weekly supply lines in the supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                              | API call / scenario                                                                                                                 |
| :- | :---------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Update the price, number of pieces and/or Sales unit of an existing Weekly supply line.   | [EditWeeklySupplyLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/EditWeeklySupplyLine) |
|    | Weekly Supply lines will be updated in Floriday based delivery conditions.                |                                                                                                                                     |
| 2  | Weekly Supply lines will be updated in the Customer channels.                             |                                                                                                                                     |
| 3  | Weekly supply lines can be retrieved by Customer organizations from the Customer channel. |                                                                                                                                     |

***

<br />

## Delete Weekly Supply lines

<br />

#### Purpose

Delete existing weekly supply lines in Floriday, based on `supplyLineId`.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The user has created Weekly supply lines in the supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                                        | API call / scenario                                                                                                                       |
| :- | :-------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Delete an existing Weekly Supply line, based on supplyLineId.                                       | [DeleteWeeklySupplyLines](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/DeleteWeeklySupplyLines) |
|    | Weekly Supply lines will be deleted in Floriady.                                                    |                                                                                                                                           |
| 2  | Weekly Supply lines will be deleted in the Customer channels.                                       |                                                                                                                                           |
| 3  | Weekly supply lines can no longer be retrieved by Customer organizations from the Customer channel. |                                                                                                                                           |

***

<br />

## Toggle Trade item availabilities

<br />

#### Purpose

To set trade items used in Weekly Supply lines to **available** or **unavailable** and optionally creating exceptions for customer Organizations.

***

<br />

#### Prequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of warehouses.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                                                            | API call / scenario                                                                                                               |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Toggle the availability of a trade item. Optionally add customerOrganizationIds as an exception. For instance, if a trade item is available, it will be unavailable for the added customerOrganizations and vice versa. | [EditContinuousStock](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/EditContinuousStock) |

***

<br />

## Sync trade item availabilities

<br />

#### Purpose

To sync the availabilities of trade items used in Weekly Supply lines.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of warehouses.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                  | API call / scenario                                                                                                                                                             |
| :- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Get highest generated sequence number.                                                                                                                                        | [GetTradeItemAvailabilitiesMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetTradeItemAvailabilitiesMaxSequence)           |
| 1  | Sync trade item availabilities with limit and latest sequence number.                                                                                                         | [GetTradeItemAvailabilitiesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetTradeItemAvailabilitiesBySequenceNumber) |
| 2  | Process the retrieved trade item availabilites in the supplier application on a tradeItemId basis. The trade item availabilities will be updated in the supplier application. |                                                                                                                                                                                 |

***

<br />

## Get trade item availabilities

<br />

#### Purpose

To retrieve the availabilities of trade items used in Weekly Supply lines.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of warehouses.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                  | API call / scenario                                                                                                                             |
| :- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Get trade item availabilities of all trade items in Weekly Supply lines.                                                                                                      | [GetTradeItemAvailabilities](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CatalogPrices/GetTradeItemAvailabilities) |
| 2  | Process the retrieved trade item availabilites in the supplier application on a tradeItemId basis. The trade item availabilities will be updated in the supplier application. |                                                                                                                                                 |