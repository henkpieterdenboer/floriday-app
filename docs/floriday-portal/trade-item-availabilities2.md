---
updatedAt: 2025-04-28T11:19:52.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade item availabilities

## Target audience

* Supplier organizations.

***

<br />

## Purpose

* Configuring and checking the availability of trade items used in Catalog prices and Customer offers with availability type "unlimited".

***

<br />

## Guidance

**Trade item availabilities:**

* Is dominant with plant growers;
* Is used with weekly supply or customer offers with availability type "unlimited";
* Applies to the current (actual) availability. 'True' is available, 'False' is unavailable;
* Availability of a trade item is by default applicable to a single warehouse and all customer organizations.
  * Customers organizations can be included or excluded with an update;
  * The warehouse can be changed with an update;
* When used for direct sales supply, the given available 'number of pieces' is an **indicative** maximum total order quantity. Even though no order quantity validation is done by Floriday, customers should take this indication into account.

***

<br />

## Implementation model

![](https://files.readme.io/68f27e5-image.png)

<br />

***

<br />

## Interaction model

![](https://files.readme.io/e20690e-image.png)