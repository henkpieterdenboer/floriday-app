---
updatedAt: 2026-06-15T07:13:02.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Trade settings

## Supported Trade settings scenarios

* Get your own SupplierTradeSettings
* Get CustomerTradeSettings by customerOrganizationId
* Sync CustomerTradeSettings

<br />

## Get SupplierTradeSettings

**Purpose:** Retrieving the Trade settings of the current supplier Organization.

<br />

**Process steps:**

| NR | Process step                               | API call / scenario                                                                                                                                                         |
| :- | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Get Trade settings of the current supplier | *[GetSupplierTradeSettingFromOrganization](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeSettings/GetSupplierTradeSettingFromOrganization)* |

<br />

## Get CustomerTradeSettings by CustomerOrganizationId

**Purpose:** Retrieving the Trade settings of a specific customer, based on an OrganizationId.

<br />

**Process steps:**

| NR | Process step                                                                      | API call / scenario                                                                                                                                                           |
| :- | :-------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Get Trade settings of a specific customer Organization based on an OrganizationId | *[GetCustomerTradeSettingsByOrganizationId](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeSettings/GetCustomerTradeSettingsByOrganizationId)* |

<br />

## Sync CustomerTradeSettings

**Purpose:** Retrieving Trade settings of multiple customers.

<br />

| NR | Process step                                                                         | API call / scenario                                                                                                                                                         |
| :- | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Returns the maximum sequence number found in trade settings.                         | *[GetCustomerTradeSettingsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeSettings/GetCustomerTradeSettingsMaxSequence)*         |
| 1B | Returns a list of max 1000 trade settings starting from a specified sequence number. | [GetCustomerTradeSettingsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/TradeSettings/GetCustomerTradeSettingsBySequenceNumber) |
| 2  | The retrieved trade settings will be added or updated in the supplier application.   |                                                                                                                                                                             |