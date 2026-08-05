---
updatedAt: 2026-06-12T08:01:28.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Organizations

## Supported scenarios

* Sync Organizations
* Get Organization

For the business rules concerning organizations, please read [Business Rules - Organizations](https://developer.floriday.io/docs/organisations).

> 📘 Sync vs Get
>
> This page describes how to utilize both the Sync and non-sync Get endpoints. We strongly recommend using the Sync endpoints whenever possible.
>
> Read the [Best Practices](https://developer.floriday.io/docs/best-practices) for more information.

> 📘 Organizations without GLN codes
>
> The sync endpoint currently returns Organization data which is retrieved directly from Floricode. Unfortunately, Floricode still lists organization data without GLN codes. These results should be ignored, as these organizations no longer exist.
>
> We aim to make changes to our Organization service in the near future, which will result in only returning existing and usable organizations.

***

<br />

## Sync Organizations

<br />

#### Purpose

Sync the information of organizations that are registered in Floriday.

***

<br />

#### Process steps

| NR | Process step                                                                             | API call / scenario                                                                                                                                           |
| :- | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Returns the maximum sequence number found in organizations.                              | *[GetOrganizationsMaxSequence](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Organizations/GetOrganizationsMaxSequence)*           |
| 2  | Sync all organizations with a result limit.                                              | *[GetOrganizationsBySequenceNumber](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Organizations/GetOrganizationsBySequenceNumber)* |
| 3  | The retrieved organizations will be added or updated in the supplier application.        |                                                                                                                                                               |
|    | Determine the latest sequence number in the supplier application and repeat second step. |                                                                                                                                                               |

***

<br />

## Get Organizations

<br />

#### Purpose

Get the information of an organization that is registered in Floriday.

***

<br />

#### Process steps

| NR | Process step                                                                             | API call / scenario                                                                                                                                 |
| :- | :--------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1A | Get organization details with Floriday organization id                                   | *[GetOrganizationById](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Organizations/GetOrganizationById)*                 |
| 1B | Get organization details with GLN id                                                     | *[GetOrganizationByCompanyGln](https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Organizations/GetOrganizationByCompanyGln)* |
| 2  | The retrieved organization details will be added or updated in the supplier application. |                                                                                                                                                     |