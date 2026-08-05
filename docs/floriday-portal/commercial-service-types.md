---
updatedAt: 2026-06-15T14:58:57.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Commercial service types

## Supported commercial service types scenarios

* Receiving commercial service types.

<br />

***

## Receiving commercial service types

**Purpose:**\
Receiving commercial service types (of an additional service).

<br />

| NR  | Process step                                                                                    | API call / scenario                                                                                                                                                                      |
| :-- | :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Returns list of al commercial service types.                                                    | *[GetCommercialServiceTypes](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CommercialServiceTypes/GetCommercialServiceTypes)*                                 |
| 2 A | Returns the maximum sequence number found in commercial service types.                          | *[GetCommercialServiceTypesMaxSequence](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CommercialServiceTypes/GetCommercialServiceTypesMaxSequence)*           |
| 2 B | Returns a list of max 1000 commercial service types starting  from a specified sequence number. | *[GetCommercialServiceTypesBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/CommercialServiceTypes/GetCommercialServiceTypesBySequenceNumber)* |