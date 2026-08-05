---
updatedAt: 2026-06-15T14:59:36.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Custom packages

## Supported custom packages scenarios

* Receiving custom packages

<br />

***

## Receiving custom packages

**Purpose:**

Receive custom package information from suppliers on Floriday.

<br />

| NR | Process step                                                                           | API call / scenario                                                                                                                                              |
| :- | :------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns the  custom package for the given customPackageId                              | *[GetCustomPackageById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomPackages/GetCustomPackageById)*                           |
| 2  | Returns the maximum sequence number found in custom packages.                          | *[GetCustomPackagesMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomPackages/GetCustomPackagesMaxSequence)*           |
| 3  | Returns a list of max 1000 custom packages starting  from a specified sequence number. | *[GetCustomPackagesBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CustomPackages/GetCustomPackagesBySequenceNumber)* |