---
updatedAt: 2025-04-28T11:37:10.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# UTC Time Notation

Times and dates stored in the Floriday databases are primarily based on the UTC (Universal Time Coordinated) time notation. This is to make sure that there is no misunderstanding about order and delivery times in Floriday.

> 📘 Delivery conditions
>
> The only exception to this are the delivery conditions of supplier organizations. When interacting with delivery conditions, the time zone of the location the customer organization is in is used.

* User input from the online portal Floriday is converted from local time into UTC time;
* The Floriday API's expect all submitted times and dates to be in UTC format;
* Floriday only returns dates and times in UTC format via the API;
* All times and dates shown to Floriday Portal users are converted from UTC to their local timezones.