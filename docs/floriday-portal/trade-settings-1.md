---
updatedAt: 2026-06-17T10:30:26.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade Settings

## Supported Trade settings scenarios

* Get your own CustomerTradeSettings
* Get SupplierTradeSettings by supplierOrganizationId
* Sync SupplierTradeSettings

<br />

## Get CustomerTradeSettings

**Purpose:** Retrieving the Trade settings of the current customer Organization.

<br />

**Process steps:**

| NR | Process step                               | API call / scenario                                                                                                                                                         |
| :- | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Get Trade settings of the current customer | *[GetCustomerTradeSettingFromOrganization](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeSettings/GetCustomerTradeSettingFromOrganization)* |

<br />

## Get SupplierTradeSettings by SupplierOrganizationId

**Purpose:** Retrieving the Trade settings of a specific supplier, based on an OrganizationId.

<br />

**Process steps:**

| NR | Process step                                                                      | API call / scenario                                                                                                                                                           |
| :- | :-------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Get Trade settings of a specific supplier Organization based on an OrganizationId | *[GetSupplierTradeSettingsByOrganizationId](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeSettings/GetSupplierTradeSettingsByOrganizationId)* |

<br />

## Sync SupplierTradeSettings

**Purpose:** Retrieving Trade settings of multiple suppliers.

<br />

| NR | Process step                                                                                  | API call / scenario                                                                                                                                                         |
| :- | :-------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Returns the maximum sequence number found in trade settings.                                  | *[GetSupplierTradeSettingsMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeSettings/GetSupplierTradeSettingsMaxSequence)*         |
| 1B | Returns a list of max 1000 supplier trade settings starting from a specified sequence number. | [GetSupplierTradeSettingsBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/TradeSettings/GetSupplierTradeSettingsBySequenceNumber) |
| 2  | The retrieved trade settings will be added or updated in the customer application.            |                                                                                                                                                                             |