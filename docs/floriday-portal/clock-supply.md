---
updatedAt: 2026-06-15T15:00:08.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Clock supply

## Supported clock supply lines scenarios

* Receiving clock supply lines;
* Receiving clock presales supply lines,

<br />

***

| NR | Steps                                                                                                             | API call / scenario                                                                                                                                                             |
| :- | :---------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Receive clock supply lines.                                                                                       | *[GetClockSupplyLineById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Auction/GetClockSupplyLineById)*                                             |
| 2  | Receive clock presales supply lines by id.                                                                        | *[GetClockPresalesSupplyLineById](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Auction/GetClockPresalesSupplyLineById)*                             |
| 3  | Returns the maximum sequence number found in clock presales supply lines.                                         | *[GetClockPresalesSupplyLinesMaxSequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Auction/GetClockPresalesSupplyLinesMaxSequenceNumber)* |
| 4  | Receive clock presales supply lines from all the suppliers in your network based on the provided sequence number. | *[GetClockPresalesSupplyLinesBySequenceNumber](https://api.staging.floriday.io/customers-api-2026v1/swagger/index.html#/Auction/GetClockPresalesSupplyLinesBySequenceNumber)*   |