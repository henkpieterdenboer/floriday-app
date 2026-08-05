---
updatedAt: 2026-06-15T07:08:12.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Clock sales Supply

## Supported scenarios

* Sync clock supply lines;
* Get clock supply lines;
* Get auction status.

For the business rules concerning clock sales supply, please read [Business Rules - Clock sales supply](https://developer.floriday.io/docs/clock-sales-supply-1).

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

<br />

## Sync Clock supply lines

<br />

### Purpose

Sync Clock sales supply lines added or changed in Floriday from Floriday in supplier application.

***

<br />

### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of batches;
* The user has inserted fulfillment orders based on auction delivery orders;
* Floriday has allocated clock sales supply lines to the auction sales channel.

***

<br />

### Process steps

| NR | Process step                                                                                                                                                                                                                                   | API call / scenario                                                                                                                                           |
| :- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Get highest generated sequence number.                                                                                                                                                                                                         | \*[GetClockSupplyLinesMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/GetClockSupplyLinesMaxSequence) \*        |
| 2  | Sync clock sales supply lines with limit and latest sequence number.                                                                                                                                                                           | *[GetClockSupplyLinesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/GetClockSupplyLinesBySequenceNumber)* |
| 3  | Process the retrieved clock supply-lines in the supplier application with their unique supply line ID. The supply lines will be added or updated in the supplier application. The supply lines are a basis to create and process sales orders. | Sync clock supply-lines with limit, startdate/time, enddate/time and latest sequence number.                                                                  |

***

<br />

## Get Clock supply lines

<br />

### Purpose

Get Clock sales supply-lines added or changed in Floriday from Floriday in supplier application.

***

<br />

### Prerequisites

* The supplier application has the latest update of organizations;
* The supplier application has the latest update of trade items;
* The supplier application has the latest update of batches;
* The user has inserted fulfillment orders based on auction delivery orders;
* Floriday has allocated clock sales supply-lines to the auction sales channel.

***

<br />

### Process steps

| NR | Process step                                                                                                                                                                                                                                   | API call / scenario                                                                                                                 |
| :- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Receive clock sales supply lines based on ID.                                                                                                                                                                                                  | *[GetClockSupplyLineById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Auction/GetClockSupplyLineById)* |
| 2  | Process the retrieved clock supply-lines in the supplier application with their unique supply line ID. The supply-lines will be added or updated in the supplier application. The supply-lines are a basis to create and process sales orders. |                                                                                                                                     |