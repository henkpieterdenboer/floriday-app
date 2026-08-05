---
updatedAt: 2026-06-12T09:02:47.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Base items

## Supported scenarios

* Receive base items;
* Sync base items;
* Create base items;
* Delete base items;
* Update base items.

For the business rules concerning organizations, please read [Business Rules - Base items](https://developer.floriday.io/docs/base-items-1).

> 📘 **Note**
>
> Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

<br />

## Receive base items

<br />

#### Purpose

* Receive base items from Floriday in supplier application.

***

<br />

#### Prerequisites

* The user has added base items to the Floriday catalog.

***

<br />

#### Process steps

| NR | Process step                                                                          | API call / scenario                                                                                                         |
| :- | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| 1  | Get organization details with Floriday base item id                                   | *`[GetBaseItemById]`(<https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BaseItems/GetBaseItemById>)* |
| 2  | The retrieved base item details will be added or updated in the supplier application. |                                                                                                                             |

***

<br />

## Sync base items

<br />

#### Purpose

* Synchronise base-items from Floriday in supplier application.

***

<br />

#### Prerequisites

* The user has inserted base-items in the Floriday catalog.

***

<br />

#### Process steps

| NR                                                                            | Process step                                                                                                                                                   | API call / scenario                                                                                                                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 A                                                                           | Returns the maximum sequence number found in organizations.                                                                                                    | *`[GetBaseItemsMaxSequence]`(<https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BaseItems/GetBaseItemsMaxSequence>)*           |
| 1 B                                                                           | Get changed base items since last sequence number. Repeat step until all base items are synchronised                                                           | *`[GetBaseItemsBySequenceNumber]`(<https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BaseItems/GetBaseItemsBySequenceNumber>)* |
| 2                                                                             | Process the retrieved base items with the base items in the supplier application with their unique `baseItemId` and base item details including an `imageURL`. |                                                                                                                                                       |
| The base items will be added, updated or deleted in the supplier application. |                                                                                                                                                                |                                                                                                                                                       |
| 3                                                                             | Get base item images by `imageURL`.                                                                                                                            |                                                                                                                                                       |
| 4                                                                             | Process the retrieved images.                                                                                                                                  |                                                                                                                                                       |

***

<br />

## Create base items

#### Purpose

* Create base items from supplier application in Floriday.

***

<br />

#### Prerequisites

* The user has inserted base items in the Floriday catalog.

***

<br />

#### Process steps

| NR | Process step                                                                                                   | API call / scenario                                                                                                 |
| :- | :------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| 1  | Create an image.                                                                                               | *`[AddImage]`(<https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Media/AddImage>)*           |
| 2  | Create a new base item with an unique `baseItemId` and base item details including an `imageURL`.              | *`[AddBaseItem]`(<https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BaseItems/AddBaseItem>)* |
|    | The new base item is validated by Floriday and will be added to the Supplier organization catalog in Floriday. |                                                                                                                     |

***

<br />

## Delete base items

<br />

#### Purpose

Deleting base items from supplier application in Floriday.

***

<br />

#### Prerequisites

* The supplier application has the latest update of base items;
* The user is deleting a base item in the supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                      | API call / scenario                                                                                                       |
| :- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| 1  | Delete an existing base item with an unique `baseItemId`                          | *`[DeleteBaseItem]`(<https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BaseItems/DeleteBaseItem>)* |
|    | The base item will be deleted from the Supplier organization catalog in Floriday. |                                                                                                                           |

***

<br />

## Update base items

<br />

#### Purpose

* Updating base items from supplier application in Floriday.

***

<br />

#### Prerequisites

* The supplier application has the latest update of base items;
* The user has updated the base item in the supplier application.

***

<br />

#### Process steps

| NR | Process step                                                                    | API call / scenario                                                                                                   |
| :- | :------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| 1  | Update a base item with an unique `baseItemId`.                                 | *`[EditBaseItem]`(<https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/BaseItems/EditBaseItem>)* |
|    | The base item will be updated in the Supplier organization catalog in Floriday. |                                                                                                                       |