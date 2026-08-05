---
updatedAt: 2026-06-15T14:59:54.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Supply lines

## Supported supply lines scenarios

* Syncing modified supply lines.
* Receiving supply lines of a selected supplier.
* Receiving supply data of a selected supply line.

For all the types of supply lines and their business rules, please read [Supply](https://developer.floriday.io/docs/supply-1).

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

<br />

<Callout icon="❗️" theme="error">
  **Why zero new results does not have to mean you are up to date!**

  In the case of Synchronizing Supply lines, it can happen that the results are empty, but the MaximumSequenceNumber is incremented. This is due to a filtering that happens in the sync endpoint itself.

  When using the SupplyLines endpoint in the Customers API, the supply lines are automatically filtered based on a customer's connected suppliers. When the result is zero, this would mean that only supply lines of non-connected suppliers are retrieved. This is why you should keep fetching sequence numbers until the MaximumSequenceNumber is reached.
</Callout>

***

<br />

## Syncing modified supply lines

**Purpose:** Synchronise modified supply lines of all connected suppliers from Floriday in customer application.

**Prerequisites:**

* Known sequence numbers retrieved from Floriday are used for this scenario.

<br />

| NR | Steps                                                                                              | API call / scenario                                                                                                                                     |
| :- | :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Returns the maximum sequence number found in supply lines.                                         | *[GetSupplyLinesMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyLines/GetSupplyLinesMaxSequence)*           |
| 2  | Receive supply lines from all the suppliers in your network based on the provided sequence number. | [*GetSupplyLinesBySequenceNumber*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyLines/GetSupplyLinesBySequenceNumber) |

***

<br />

## Receiving supply lines of a selected supplier

**Purpose:** Synchronise supply lines of specified supplier from Floriday in customer application.

**Prerequisites:**

* The specified supplier is a connection of the customer;
* There are valid supply lines available for the customer.

| NR | Steps                                                                                                               | API call / scenario                                                                                                     |
| :- | :------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------- |
| 1  | Receive a maximum of 1000 supply lines which are valid in the given timeframe for the specified supplier.           | [*GetSupplyLines*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyLines/GetSupplyLines) |
| 2  | Use filtering to restrict the amount of supply lines you will receive in one call to make sure it stays under 1000. |                                                                                                                         |

***

## Receiving supply data of a selected supply line

**Purpose:** Synchronise supply lines of specified supplier from Floriday in customer application.

**Prerequisites:**

* A known supply line id retrieved from Floriday is specified for this scenario;
* The specified supply line is from a supplier which is a connection of the customer.

| NR | Steps                                               | API call / scenario                                                                                                            |
| :- | :-------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| 1  | Receive supply data based on a specified Supply ID. | [*GetSupplyLinesById*](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/SupplyLines/GetSupplyLineById) |