---
updatedAt: 2026-06-17T10:27:19.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Packing configuration requests

## Supported packing configuration requests scenarios

* Receiving packing configuration requests
* Placing packing configuration requests

For the business rules concerning requests, please read [Packing configuration request](https://developer.floriday.io/docs/packing-configuration-request).

<br />

***

## Placing packing configuration requests

**Purpose:**\
Enables customers to request a missing packing configuration to be added to a specific trade item by specifying the packing configuration in this request. Supplier can add the packing configuration to a specific trade item in Floriday after accepting the packing configuration request.

<br />

| NR | Process step                            | API call / scenario                                                                                                                                         |
| :- | :-------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Create a packing configuration request. | *[AddPackingConfigurationRequest](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CatalogRequests/AddPackingConfigurationRequest)* |

<br />

***

## Receiving packing configuration requests

**Purpose:**\
Receiving updates of placed packing configuration requests.

<br />

| NR | Process step                                                                       | API call / scenario                                                                                                                                                                           |
| :- | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Return the packing configuration request by ID.                                    | *[GetPackingConfigurationRequestById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CatalogRequests/GetPackingConfigurationRequestById)*                           |
| 2  | Return the maximum sequence number found in packing configuration requests.        | *[GetPackingConfigurationRequestsMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CatalogRequests/GetPackingConfigurationRequestsMaxSequence)*           |
| 3  | Returns a list of max 1000 connections starting  from a specified sequence number. | *[GetPackingConfigurationRequestsBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CatalogRequests/GetPackingConfigurationRequestsBySequenceNumber)* |