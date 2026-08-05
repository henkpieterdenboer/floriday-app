---
updatedAt: 2026-06-12T09:02:09.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade items

## Supported Trade-item scenarios

* Sync Trade items
* Create trade items
* Delete trade items
* Update trade items
* Change trade items

For the business rules concerning Trade items, please read [Business Rules - Trade items](https://developer.floriday.io/docs/trade-items-2).

***

<br />

## Sync Trade items

<br />

#### Purpose

Synchronise trade items from Floriday to the supplier application.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations.
* The supplier application has the latest update of custom packages.
* The supplier application has the latest update of base items.
* The user has inserted trade items in the Floriday catalog.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                  | API call / scenario                                                                                                                                |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns the maximum sequence number found in Trade items.                                                                                                     | [GetTradeItemsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/GetTradeItemsMaxSequence)           |
| 2  | Retrieve changed Trade items since last sequence number. Repeat step until all trade items are synchronised.                                                  | [GetTradeItemsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/GetTradeItemsBySequenceNumber) |
| 3  | Process the retrieved trade items from Floriday with their unique `tradeItemId`, `tradeItemVersion` and Trade item details including one or more `imageURL`s. |                                                                                                                                                    |
| 4  | The trade items will be added, updated or deleted in the supplier application                                                                                 |                                                                                                                                                    |

***

<br />

## Create Trade items

<br />

#### Purpose

Creating new trade items in the supplier application and adding them to Floriday.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations.
* The supplier application has the latest update of custom packages.
* The supplier application has the latest update of base items.
* The user has inserted a trade item in the supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                                                                    | API call / scenario                                                                                              |
| :- | :------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------- |
| 1  | Create one or more images.                                                                                                      | [AddImage](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Media/AddImage)              |
| 2  | Create a new trade item with a unique `tradeItemId` and trade item details including one or more `imageURL`s.                   | [AddTradeItem](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/AddTradeItem) |
|    | The new trade item is validated by Floriday and will be added to the Supplier organization catalog in Floriday.                 |                                                                                                                  |
| 3  | The new trade item will be added to the Supplier organization catalog in the Customer channel if `hiddenfromcustomer` is false. |                                                                                                                  |
| 4  | The new trade item can be retrieved by the Customer organization from the Customer channel.                                     |                                                                                                                  |

***

<br />

## Delete Trade items

<br />

#### Purpose

(Soft) Deleting trade items in Floriday.

***

<br />

#### Prerequisites

* The supplier application has the latest update of trade items;
* The user is deleting a trade item in the supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                                                                         | API call / scenario                                                                                                    |
| :- | :----------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| 1  | Soft delete an existing trade item with a unique `tradeItemId`.                                                                      | [DeleteTradeItem](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/DeleteTradeItem) |
|    | The trade item will be soft deleted from the Supplier organization catalog in Floriday.                                              |                                                                                                                        |
| 2  | The trade item will be soft deleted from the Supplier organization catalog in the Customer channel if `hiddenFromCustomer` is false. |                                                                                                                        |
| 3  | The trade item will be soft deleted by the Customer channel for the Customer oranization.                                            |                                                                                                                        |

***

<br />

## Update Trade items

<br />

#### Purpose

Updating trade items in Floriday.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of custom packages;
* The supplier application has the latest update of base items;
* The supplier application has the latest update of trade items;
* The user has updated the trade item in the supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                                                                    | API call / scenario                                                                                                |
| :- | :------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------- |
| 1  | Update a trade item based on its unique \`\`tradeItemId\`.                                                                      | [EditTradeItem](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/EditTradeItem) |
|    | The trade item will be updated in the Supplier organization catalog in Floriday and get a new `tradeItemVersion`.               |                                                                                                                    |
| 2  | The trade item will be updated from the Supplier organization catalog to the Customer channel if `hiddenFromCustomer` is false. |                                                                                                                    |
| 3  | The trade item will be updated in the Customer channel for the Customer organization.                                           |                                                                                                                    |

***

<br />

## Interaction model Trade item variants

In the next section we will discuss Trade item variants. These are variations on existing trade items. See the Interaction model below for a detailed illustration on how trade item variants work.

For the business rules concerning Trade item variants, please read [Business Rules - Trade item variants](https://developer.floriday.io/docs/trade-items-2#interaction-model-trade-items-and-variants).

![](https://files.readme.io/385325e-APIv1.1-IAM-Trade-item_variants.png "APIv1.1-IAM-Trade-item variants.png")

Supported Trade item scenarios:

* Create trade item variants;
* Update trade item variants.

***

<br />

## Create Trade item variants

<br />

#### Purpose

Create new trade item variants in Floriday.

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of custom packages;
* The supplier application has the latest update of base items;
* The supplier application has the latest update of trade items;
* The user has inserted a trade item variants in the supplier application with different product characteristics and/or country of origin.

***

#### Process steps

| NR | Process step                                                                                                                                                                                                                                                                                                                                                                                                      | API call / scenario                                                                                                            |
| :- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| 1  | Create a new trade item variant with a unique `tradeItemId` with different product characteristics and reference to the `parentId`.                                                                                                                                                                                                                                                                               | [AddTradeItemVariant](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/AddTradeItemVariant) |
|    | The new trade item variant is validated by Floriday and will be added to the Supplier organization catalog in Floriday as a new trade item with a unique `tradeItemId`. The trade item variant will have a reference to the `parentId` with  a unique `supplierArticleCode` containing the parent `supplierArticleCode` +'additional string'. The parent Trade item is updated with `isParentForVariant` is true. |                                                                                                                                |
| 2  | Get and process created trade item variant with unique `tradeItemId`, `tradeItemVersion`, supplierArticleCode and trade item details.                                                                                                                                                                                                                                                                             | [GetTradeItemById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/GetTradeItemById)       |
| 3  | The new trade item variant will be added as a new trade item to the Supplier organization catalog in the Customer channel if `hiddenFromCustomer` is false.                                                                                                                                                                                                                                                       |                                                                                                                                |
| 4  | The new trade item can be retrieved by the Customer organization from the Customer channel.                                                                                                                                                                                                                                                                                                                       |                                                                                                                                |

***

<br />

## Update Trade item variants

<br />

#### Purpose

Updating trade item variants in Floriday.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of custom packages;
* The supplier application has the latest update of base items;
* The supplier application has the latest update of trade items;
* The user has updated the trade item variant characteristics and/or country of origin in the supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                                                                    | API call / scenario                                                                                                              |
| :- | :------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Update a trade item variant based on its unique `tradeItemId`.                                                                  | [EditTradeItemVariant](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeItems/EditTradeItemVariant) |
|    | The trade item variant will be updated in the Supplier organization catalog in Floriday and get a new `tradeItemVersion`.       |                                                                                                                                  |
| 2  | The trade item will be updated from the Supplier organization catalog to the Customer channel if `hiddenFromCustomer` is false. |                                                                                                                                  |
| 3  | The trade item will be updated in the Customer channel for the Customer organization.                                           |                                                                                                                                  |