---
updatedAt: 2026-06-12T09:03:10.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Additional services

## Supported scenarios

* Sync Additional services.
* Get Additional services.

For the business rules concerning additional services, please read [Business Rules - Additional services](https://developer.floriday.io/docs/additional-services-1).

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

***

## Sync Additional services

<br />

#### Purpose

Sync additional services data of the supplier organization.

<br />

#### Prerequisites

* The user has inserted one or more warehouse(s) in the Floriday application;
* The user has inserted one or more additional service(s) in the Floriday application.

<br />

#### Process Steps

| NR | Process step                                                                                                                                                               | API call / scenario                                                                                                                                                        |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Retrieve commercial service types.                                                                                                                                         | *[GetCommercialServiceTypes](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CommercialServiceTypes/GetCommercialServiceTypes)*                   |
| 2  | The retrieved commercial service types will be added or updated in the supplier application.                                                                               |                                                                                                                                                                            |
| 3  | Get highest max sequencenumber found in additional services.                                                                                                               | *[GetAdditionalServicesMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/AdditionalServices/GetAdditionalServicesMaxSequence)*         |
| 4  | Sync additional services                                                                                                                                                   | *[GetAdditionalServiceBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/AdditionalServices/GetAdditionalServiceBySequenceNumber)* |
| 5  | The retrieved additional services with additional service details will be added or updated in the supplier application with a reference to the corresponding warehouse(s). |                                                                                                                                                                            |

***

<br />

## Get Additional services

<br />

#### Purpose

Get additional services data of the supplier organization.

<br />

#### Prerequisites

* The user has inserted one or more warehouse(s) in the Floriday application;
* The user has inserted one or more additional service(s) in the Floriday application.

<br />

#### Process steps

| NR | Process step                                                                                                                                                               | API call / scenario                                                                                                                                      |
| :- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Retrieve commercial service types.                                                                                                                                         | *[GetCommercialServiceTypes](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/CommercialServiceTypes/GetCommercialServiceTypes)* |
| 2  | The retrieved commercial service types will be added or updated in the supplier application.                                                                               |                                                                                                                                                          |
| 3A | Get additional services.                                                                                                                                                   | *[GetAdditionalServices](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/AdditionalServices/GetAdditionalServices)*             |
| 3B | Get additional service by ID.                                                                                                                                              | *[GetAdditionalServiceById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/AdditionalServices/GetAdditionalServiceById)*       |
| 4  | The retrieved additional services with additional service details will be added or updated in the supplier application with a reference to the corresponding warehouse(s). |                                                                                                                                                          |