---
updatedAt: 2026-06-17T10:25:35.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Plant passports

## Supported plant passports scenarios

* Receiving plant passports

<br />

***

## Receiving plant passports

**Purpose:**\
Receiving plant passport data from sales orders from Floriday.

<br />

**Prerequisites:**

* Sales order has to have the status 'committed'.

<br />

| NR | Process step                                     | API call / scenario                                                                                                                                                              |
| :- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Returns plant passport data for the sales order. | *[GetPlantPassportDataBySalesChannelOrderId](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/PlantPassports/GetPlantPassportDataBySalesChannelOrderId)* |
| 2  | Returns plant passport data for the sales order. | *[GetPlantPassportDataBySalesOrderId](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/PlantPassports/GetPlantPassportDataBySalesOrderId)*               |