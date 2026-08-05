---
updatedAt: 2025-06-27T11:07:05.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Direct sales Catalog Supply

## Target audience

* Supplier organizations;
* Customer organizations.

***

<br />

## Purpose

* Creating, updating and deleting Catalog supply lines by Supplier organizations;
* Retrieving Catalog supply lines for placing purchase orders or sales orders by Customer organizations.

***

<br />

## Guidance

Catalog Supply is a supply type mainly utilized by plant growers; it is based on a weekly trade period that does not work with Batches. This supply type instead uses an availability filter and an indicative quantity that by default does not count down.

There are two options when implementing Catalog Supply, either with or without the use of price groups in Floriday. Read more about how Price groups work in [the Helpcenter page for Price groups](https://helpcenter.floriday.com/en/articles/4726205-price-groups-2-0).

For the Business Rules and practical differences between the different supply types, please refer to [Supply type overview](https://developer.floriday.io/docs/supply-type-overview).

For the Implementation Guide for Suppliers, see [this page](https://developer.floriday.io/docs/catalog-supply).

<br />

* **Option 1 - Weekly Base supply: Price calculation in Floriday (Price groups)**\
  User sets customer specific price calculation by creating / updating price groups in the **Floriday application**.\ <br />**Weekly base supply** is then created by setting the availability, a base price for price calculation, an indicative quantity and the weekly trade period. The user may set this in either Floriday or in the Supplier application.

<br />

* **Option 2 - Weekly supply-lines: Price calculation in Supplier application (no Price groups)**\
  User sets customer specific price calculation, the availability, a price per piece, an indicitave quantity and the weekly trade period in the **supplier application**, from which **weekly supply lines** are created.\ <br />These weekly supply lines are visualized in Floriday as so called **Promos**, but are managed in the supplier application.

<br />

> 🚧 Trade item availability and counters
>
> Both **Weekly base supply** and **Weekly Supply lines** are dependent on trade item availability. Users may toggle this availability and optionally add exceptions for Customer organizations, which allows them to only set supply as available (or not available) for specific Customer organizations.
>
> Customers may place orders on these supply lines, as long as the supply line is set as available and both prices and indicative quantities are entered. The quantity entered does not count down; a customer may keep placing orders for that amount. However, if the supplier organization has applied a counter to the quantity, that quantity is limited. This means that the quantity **does** count down and becomes unavailable when it reaches zero.
>
> Although customers cannot place orders on Weekly Base supply or Weekly Supply lines that are set as unavailable, supply lines with prices and indicative quantity are still visible for customer in the respective channels. In this situation, customers have the option to create a [Request](https://developer.floriday.io/docs/supply-request) for the respective trade item(s) or put the trade item(s) on a price list.

***

<br />

> 👍 Checking direct sales supply in Floriday
>
> Users and developers may check created, updated and deleted the different types of direct sales supply in the Floriday application by going to [Direct sales > Supply overview](https://app.floriday.io/supply/direct-sales/supply-overview).
>
> See the image below for an example.

<br />

![](https://files.readme.io/c92559d-Screenshot_2021-02-20_at_03.14.08.png "Screenshot 2021-02-20 at 03.14.08.png")

***

<br />

> 👍 Checking direct sales supply in Floriday 'My Shop'
>
> Users and developers may view direct sales supply in the Floriday application in '[My Shop](https://app.floriday.io/shop/statistics)' as if they were one of their customers. See the [Helpcenter page](https://helpcenter.floriday.com/en/articles/4713721-activate-my-shop) for more information.

***

<br />

## Implementation model

![](https://files.readme.io/b0fc43c-Screenshot_2022-02-15_at_20.35.23.png "Screenshot 2022-02-15 at 20.35.23.png")

***

<br />

## Interaction model Weekly base supply

![](https://files.readme.io/c26b9f5-image.png)

<br />

***

<br />

## Interaction model Weekly supply-lines

![](https://files.readme.io/ab2f1f8-image.png)