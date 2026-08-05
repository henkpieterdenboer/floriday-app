---
updatedAt: 2026-06-15T07:08:37.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Clock pre sales Supply

## Supported scenarios

* Sync clock pre sales supply lines.
* Get clock pre sales supply lines;
* Add clock pre sales supply lines;
* Edit clock pre sales supply lines.

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

<br />

## Sync Clock pre sales supply-lines

<br />

### Purpose

Sync Clock pre sales sales supply lines that are added or changed in the supplier application.

<br />

### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of batches;
* The user has inserted fulfillment orders based on auction delivery orders;
* Floriday has allocated clock pre sales supply-lines to the auction sales channel.

***

<br />

### Process steps

| NR | Process step                                                                                                                                                                                                                                             | API call / scenario                                                                                                                                                           |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Get highest generated sequence number.                                                                                                                                                                                                                   | *[GetClockPresalesSupplyLinesMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/GetClockPresalesSupplyLinesMaxSequence)*           |
| 2  | Sync clock pre sales supply lines with limit and latest sequence number.                                                                                                                                                                                 | *[GetClockPresalesSupplyLinesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/GetClockPresalesSupplyLinesBySequenceNumber)* |
| 3  | Process the retrieved clock pre sales supply lines in the supplier application with their unique supply-line ID. The supply lines will be added or updated in the supplier application. The supply lines are a basis to create and process sales orders. |                                                                                                                                                                               |

***

<br />

## Get Clock pre sales supply-lines

<br />

### Purpose

Get Clock pre sales sales supply lines that are added or changed in the supplier application.

***

<br />

### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of batches;
* The user has inserted fulfillment orders based on auction delivery orders;
* Floriday has allocated clock pre sales supply-lines to the auction sales channel.

***

<br />

### Process steps

| NR | Process step                                                                                                                                                                                                                                             | API call / scenario                                                                                                                                 |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Receive clock sales supply lines based on ID.                                                                                                                                                                                                            | *[GetClockPresalesSupplyLineById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/GetClockPresalesSupplyLineById)* |
| 2  | Process the retrieved clock pre sales supply lines in the supplier application with their unique supply-line ID. The supply lines will be added or updated in the supplier application. The supply lines are a basis to create and process sales orders. |                                                                                                                                                     |

***

<br />

## Add clock pre sales supply lines

<br />

### Purpose

Add Clock pre sales sales supply lines in the supplier application.

| NR | Process step                                                        | API call / scenario                                                                                                                         |
| :- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Add Clock pre sales sales supply lines in the supplier application. | *[AddClockPresalesSupplyLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/AddClockPresalesSupplyLine)* |

***

<br />

## Edit clock pre sales supply lines

<br />

### Purpose

Add Clock pre sales sales supply lines in the supplier application.

| NR | Process step                                                         | API call / scenario                                                                                                                           |
| :- | :------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Edit Clock pre sales sales supply lines in the supplier application. | *[EditClockPresalesSupplyLine](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/EditClockPresalesSupplyLine)* |