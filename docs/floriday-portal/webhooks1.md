---
updatedAt: 2026-06-12T08:04:40.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Webhooks

## Supported scenarios

* Subscribe to events;
* Unsubscribe from events.

For the business rules concerning webhooks, please read [Business Rules - Webhooks](https://developer.floriday.io/docs/webhook).

***

<br />

## Subscribe to events

<br />

#### Purpose

A Supplier application may subscribe to organization events that are posted by Floriday at the specified callbackURL. Starting with sales order events: accepted, committed, cancelled and corrected.

***

<br />

#### Process steps

| NR  | Process step                                                                                                                                                                                          | API call / scenario                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A Supplier application may subscribe to organization events that are posted by Floriday at the specified callbackURL. Starting with sales order events: accepted, committed, cancelled and corrected. | [AddWebhookSubscription](\[https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Webhooks/AddWebhookSubscription]\(https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Webhooks/AddWebhookSubscription\)) |
| 2/3 | Floriday posts a message with a subscribeURL on the callbackURL.                                                                                                                                      |                                                                                                                                                                                                                                                   |
| 4/5 | Supplier application confirms registration by using a GET on the subscribeURL.                                                                                                                        |                                                                                                                                                                                                                                                   |
|     | Non confirmed registrations will be deleted after 72h.                                                                                                                                                |                                                                                                                                                                                                                                                   |
|     | After registration Supplier application will receive events on the given callbackURL.                                                                                                                 |                                                                                                                                                                                                                                                   |

<br />

* Supplier application can add more than one callbackURL for an organization.
* Supplier applications can share one callbackURL for multiple organizations.
* For technical reasons a maximum of 120 organizations can share one callbackURL at a time.
* It is advised not to use too many callbackURL for Supplier application maintenance purposes.\
  For technical documentation on the callbackURL please refer to:

***

<br />

## Unsubscribe from events

<br />

#### Purpose

A supplier application may unsubscribe their organization for posting events for the specified callbackURL.

***

<br />

#### Process steps

| NR | Process step                                                                                                                               | API call / scenario                                                                                                                                                                                                                                        |
| :- | :----------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Supplier application unsubscribe organization for posting events for the specified callbackURL                                             | [DeleteWebhookSubscription](\[https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Webhooks/DeleteWebhookSubscription]\(https://api.staging.floriday.io/suppliers-api-2026v1/swagger/index.html#/Webhooks/DeleteWebhookSubscription\)) |
|    | If after unsubscribing no organization has a subscription to the callbackURL, the subscription/registration of the callbackURL is deleted. |                                                                                                                                                                                                                                                            |
|    | After unsubscribing events Supplier application will no longer receive events on the given callbackURL.                                    |                                                                                                                                                                                                                                                            |

***

<br />

## Retry configuration

<br />

Floriday has the current retry configuration:

```json
"minDelayTarget": 20,  
"maxDelayTarget": 20,  
"numRetries": 3,  
"numMaxDelayRetries": 0,  
"numNoDelayRetries": 0,  
"numMinDelayRetries": 0,  
"backoffFunction": "linear"
```

After the initial attempt to delivery the message, 3 additional attempts will follow with an interval of 20s between the attempts.

For technical documentation on the 'message delivery retry' please refer to: