---
updatedAt: 2026-05-11T09:52:03.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Rate limiting

* Rate limits are implemented to ensure optimal performance for all Floriday users;
* Rate limits apply per API key;
* The exact rate limits are mentioned in the Swagger pages and specified per endpoint;
* Currently, most endpoints are limited to 3.4 calls per second (\~204 per minute) with a burst limit of 1000;
* When deemed necessary, Floriday reserves the right to adjust the rate limits of Endpoints to guarantee the best operation of the platform;
  * Users will be notified when rate limits are adjusted in the known Slack channels.
* When deemed necessary (i.e. in case of abuse), Floriday reserves the right to temporarily block an endpoint for an organization or client.

> 📘 Tokens and Burst limit
>
> As an example, think of the burst limit as a bucket that holds 1000 tokens.
>
> * When the bucket is full, 1000 tokens are available.
> * Each request = 1 token
> * Tokens refill at 3.4 per second.
> * Your client can send up to \~1000 requests almost instantly.
> * After that, the bucket is empty and requests start getting throttled.
> * When the bucket is empty (burst is gone), Tokens refill at 3.4 per second.
> * This means that the client can sustain \~3-4 requests per second indefinitely.
> * The time to fully recover to 1000 tokens is 1000 / 3.4 = \~294 seconds or \~5 minutes.
> * So full burst capacity comes back after \~5 minutes of no trafffic.
> * In other words, a burst limit of 1000 does **not** mean you can always do 1000 requests per second. It means you can temporarily exceed your rate limit, up to 1000 requests total, if you've built up credit.