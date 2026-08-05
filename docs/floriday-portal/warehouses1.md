---
updatedAt: 2026-06-12T08:02:19.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Warehouses

## Supported scenarios:

* Sync Warehouses
* Get Warehouses

For the business rules concerning warehouses, please read [Business Rules - Warehouses](https://developer.floriday.io/docs/warehouses-1).

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

<br />

## Sync Warehouses

<br />

#### Purpose

Sync the information of the warehouse location(s) which the supplier organization is authorized to use.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The user has registered one or more warehouse(s) in the Floriday application;
* The warehouse organization has given warehouse access to the supplier.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                | API call / scenario                                                                                                                                  |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Get maximum sequence-number                                                                                                                 | *[GetWarehousesMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Warehouses/GetWarehousesMaxSequence)*           |
| 2  | Sync warehouses                                                                                                                             | *[GetWarehousesBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Warehouses/GetWarehousesBySequenceNumber)* |
| 3  | The retrieved warehouses with warehousedetails including the organization ID will be added, updated or deleted in the supplier application. |                                                                                                                                                      |

***

<br />

## Get Warehouses

#### Purpose

Sync the information of the warehouse location(s) which the supplier organization is authorized to use.

***

<br />

#### Prerequisites

* The supplier application has the latest update of organizations;
* The user has registered one or more warehouse(s) in the Floriday application;
* The warehouse organization has given warehouse access to the supplier.

***

<br />

#### Process steps

| NR | Process step                                                                                                                                | API call / scenario                                                                                                                            |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Get connected warehouses                                                                                                                    | *[GetWarehouses](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Warehouses/GetWarehouses)*                           |
| 1B | Get warehouses with auction capability                                                                                                      | *[GetWarehousesAuction](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Warehouses/GetWarehousesAuction)*             |
| 1C | Get warehouses for external stock management                                                                                                | *[GetWarehousesExternalStock](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Warehouses/GetWarehousesExternalStock)* |
| 2  | The retrieved warehouses with warehousedetails including the organization ID will be added, updated or deleted in the supplier application. |                                                                                                                                                |

<br />

> 📘 Registering warehouse location(s) in Floriday
>
> Supplier's own warehouse locations are generated in Floriday after the physical location has been registered at Royal FloraHolland. In case a supplier does not yet own a warehouse location in Floriday, they will need to log in to the Royal FloraHolland website and register the location under the Company Details section.
>
> A written guide for suppliers can be found [here](https://helpcenter.floriday.com/en/articles/4643461-add-a-warehouse).