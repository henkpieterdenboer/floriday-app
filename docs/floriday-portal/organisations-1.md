---
updatedAt: 2026-06-15T07:24:28.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Organizations

## Supported organizations scenarios

* Receiving organizations;
* Receiving warehouses;
* Receiving delivery conditions;
* Receiving certificates.

For the business rules concerning organizations, please read [Organizations](https://developer.floriday.io/docs/organisations).

<br />

***

## Receiving organizations

**Purpose:**\
Returns supplier organization information.

<br />

**Prerequisites:**

* Requested suppliers are known in Floriday.

<br />

| NR  | Process step                                                                         | API call / scenario                                                                                                                                           |
| :-- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Returns organizations based on id.                                                   | *[GetOrganizationById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Organizations/GetOrganizationById)*                           |
| 2   | Returns organizations based on GLN.                                                  | *[GetOrganizationByCompanyGln](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Organizations/GetOrganizationByCompanyGln)*           |
| 3 A | Returns the maximum sequence number found in organizations.                          | *[GetOrganizationsMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Organizations/GetOrganizationsMaxSequence)*           |
| 3 B | Returns a list of max 1000 organizations starting  from a specified sequence number. | *[GetOrganizationsBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Organizations/GetOrganizationsBySequenceNumber)* |

<br />

***

## Receiving warehouses, delivery conditions and certificates

**Purpose:**\
Retrieve warehouse, delivery conditions and certificate information from specified suppliers.

<br />

| NR | Process step                                            | API call / scenario                                                                                                                                                     |
| :- | :------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns warehouses for the specified supplier.          | *[GetWarehousesOfSupplierById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Organizations/GetWarehousesOfSupplierById)*                     |
| 2  | Returns delivery conditions for the specified supplier. | *[GetDeliveryConditionSetOfSupplierById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Organizations/GetDeliveryConditionSetOfSupplierById)* |
| 3  | Returns certificates for the specified supplier.        | *[GetCertificatesOfSupplierById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Organizations/GetCertificatesOfSupplierById)*                 |