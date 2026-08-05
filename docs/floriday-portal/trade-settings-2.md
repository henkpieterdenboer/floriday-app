---
updatedAt: 2025-04-28T11:19:46.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade Settings

## Target audience

* Customer organizations
* Supplier organizations

***

<br />

## Purpose

* Customizing how suppliers and customers wish to trade with each other in Floriday.

***

<br />

## Guidance

**Trade settings:**

* Can only be actively enabled or disabled in the Floriday application.
* Can only be actively enabled or disabledby a Main user of an Organization.
* May be enabled or disabled for all Organizations at once.
* Exceptions may be enabled or disabled for seperate Organizations.

<br />

Trade settings may be retrieved using their corresponding Endpoints.

* A supplier organization may only retrieve their own supplier trade settings, but may retrieve the trade settings of all customer Organizations. See the [Supplier Implementation guide](https://developer.floriday.io/docs/trade-settings) for more information.
* In turn, a customer organization may only retrieve their own customer trade settings, but may retrieve the trade settings of all supplier Organizations. See the [Customer Implementation guide](https://developer.floriday.io/docs/trade-settings-1) for more information.
* For more information on which trade settings may be configured, please consult the [Supplier Helpcenter page](https://helpcenter.floriday.com/en/articles/6254856-trade-settings) or the [Customer Helpcenter page](https://helpcenter-customers.floriday.com/en/articles/6266033-trade-settings).

<br />

> 📘 Trade setting sequences
>
> The sequence between *CustomerTradeSetting* and *SupplierTradeSetting* are not shared, each model has their own sequence.
>
> Retrieving a *CustomerTradeSetting* for a specific organization with no trade settings will result in a default model with the sequence as 0 and the lastModified as null.

***

<br />

## Implementation model

![](https://files.readme.io/ffd8094-image.png)

***

<br />

## Interaction model

![](https://files.readme.io/47d3201-image.png)