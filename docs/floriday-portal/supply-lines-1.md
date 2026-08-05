---
updatedAt: 2026-06-15T07:05:05.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Supply lines

We define a supply line as a trade item that is marketed at a specific price and period during which a customer is allowed to purchase it.

Supply lines are a basis to create and process sales orders. We recommend syncing all supply lines a supplier organization has made and to make a distinction between Direct sales Supply lines and Clock (pre sales) Supply lines. These are seperate entities and should be treated as such during the implementation. The difference between the various Supply line types are listed on the [Supply](docs:supply) page.

Below is an instruction of how to retrieve Supply lines in general, using the Sync endpoint and the Get endpoint. In the following chapters you can read how to implement the different types of Supply lines.

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

<br />

## Sync Supply-lines

<br />

#### Purpose

To Sync Supply lines from Floriday to the supplier application.

***

<br />

#### Prerequisites

The following models must be present in your system in order to fully process a supply line.

* [Organizations](https://developer.floriday.io/docs/organizations), these determine for which customer(s) the supply line is available and which supplier is the owner.
* [TradeItems](https://developer.floriday.io/docs/trade-items), which contains the specific product information for which the supplyline has been offered.
* [Batches](https://developer.floriday.io/docs/batches), which is required when the supply is based on an existing batch. **Take note:** Batches may contain  batch-specific values that override the tradeItem data.
* Note that you will only receive supply lines when the supplier organization works with one of the following flows via Floriday (Portal and/or API)
  * Catalog base supply;
  * Batch base supply;
  * Weekly lines;
  * Customer offer;
  * Supply and Order requests.

<br />

***

<br />

#### Process steps

| NR | Process step                                                                                                                                                                                                                                      | API call / scenario                                                                                                                                     |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Get highest generated sequence number.                                                                                                                                                                                                            | *[GetSupplyLinesMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/GetSupplyLinesMaxSequence)*           |
| 1  | Sync supply lines with limit and latest sequence number. Supply has supply type 'catalog price'.                                                                                                                                                  | *[GetSupplyLinesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/GetSupplyLinesBySequenceNumber)* |
| 2  | Process the retrieved supply lines in the supplier application with their unique supply line ID. The supply lines will be added, updated or deleted in the supplier application. The supply lines are a basis to create and process sales orders. |                                                                                                                                                         |

***

<br />

## Get Supply lines

<br />

#### Purpose

To retrieve Supply lines within a given timeframe from Floriday to the supplier application.

***

<br />

#### Prerequisites

The following models must be present in your system in order to fully process a supply line.

* [Organizations](https://developer.floriday.io/docs/organizations), these determine for which customer(s) the supply line is available and which supplier is the owner.
* [TradeItems](https://developer.floriday.io/docs/trade-items), which contains the specific product information for which the supplyline has been offered.
* [Batches](https://developer.floriday.io/docs/batches), which is required when the supply is based on an existing batch. **Take note:** Batches may contain  batch-specific values that override the tradeItem data.
* Note that you will only receive supply lines when the supplier organization works with one of the following flows via Floriday (Portal and/or API)
  * Catalog base supply;
  * Batch base supply;
  * Weekly lines;
  * Customer offer;
  * Supply and Order requests.

***

<br />

#### Process steps

| NR  | Process step                                                                                                                                                                                                                                      | API call / scenario                                                                                                           |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------- |
| 1 A | Returns supply lines created within the given timeframe.                                                                                                                                                                                          | *[GetSupplyLines](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/GetSupplyLines)*       |
| 1 B | Returns a supply line based on ID.                                                                                                                                                                                                                | *[GetSupplyLineById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/DirectSales/GetSupplyLineById)* |
| 2   | Process the retrieved supply lines in the supplier application with their unique supply line ID. The supply lines will be added, updated or deleted in the supplier application. The supply lines are a basis to create and process sales orders. |                                                                                                                               |

***