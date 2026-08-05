---
updatedAt: 2026-06-15T14:58:38.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Additional services

## Supported additional services scenarios

* Receiving additional services.

For the business rules concerning additional services, please read [Additional services](https://developer.floriday.io/docs/additional-services-1).

<br />

***

## Receiving additional services

**Purpose:**\
Receiving additional services from suppliers.

<br />

**Prerequisites:**

* For non-connected suppliers:
  * SupplierId is needed to receive additional services, regardless of connection or OrganizationType.
* For synchronisation with sequencenumber:
  * Supplier has to be a connection.

<br />

| NR  | Process step                                                                               | API call / scenario                                                                                                                                                          |
| :-- | :----------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Returns list of al active additional services for the specified supplier.                  | *[GetAdditionalServicesForSupplier](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/AdditionalServices/GetAdditionalServicesForSupplier)*           |
| 2 A | Returns the maximum sequence number found in additional services.                          | *[GetAdditionalServicesMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/AdditionalServices/GetAdditionalServicesMaxSequence)*           |
| 2 B | Returns a list of max 1000 additional services starting  from a specified sequence number. | *[GetAdditionalServicesBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/AdditionalServices/GetAdditionalServicesBySequenceNumber)* |