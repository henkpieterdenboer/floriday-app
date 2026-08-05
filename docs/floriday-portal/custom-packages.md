---
updatedAt: 2026-06-12T09:02:30.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Custom packages

## Supported scenarios

* Sync custom packages.
* Receive custom packages;

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

## Sync Custom Packages

<br />

#### Purpose

* Get the information of custom packages.

***

<br />

#### Prerequisites

* The user has added custom packages in the Floriday application.

***

<br />

#### Process steps

| NR  | Process step                                                                                                    | API call / scenario                                                                                                                                              |
| :-- | :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 A | Returns the maximum sequence number found in custom packages.                                                   | *[GetCustomPackagesMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomPackages/GetCustomPackagesMaxSequence)*           |
| 1 B | Return a list of max 1000 custom packages starting from a specified sequence number.                            | *[GetCustomPackagesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomPackages/GetCustomPackagesBySequenceNumber)* |
| 2   | The retrieved custom packages with custom package details will be added or updated in the supplier application. |                                                                                                                                                                  |

***

<br />

## Get Custom Packages

#### Purpose

Get the information of custom packages.

***

#### Prerequisites

* The user has added custom packages in the Floriday application.

***

#### Process steps

| NR  | Process step                                                                                                    | API call / scenario                                                                                                                    |
| :-- | :-------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| 1 A | Get custom packages.                                                                                            | *[GetCustomPackages](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomPackages/GetCustomPackages)*       |
| 1 B | Get custom packages by ID.                                                                                      | *[GetCustomPackageById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CustomPackages/GetCustomPackageById)* |
| 2   | The retrieved custom packages with custom package details will be added or updated in the supplier application. |                                                                                                                                        |