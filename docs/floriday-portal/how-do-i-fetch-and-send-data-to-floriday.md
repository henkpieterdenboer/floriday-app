---
updatedAt: 2025-04-28T11:05:10.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# How do I fetch data from Floriday?

## General

All resources of implemented modules should be synchronized between the application and Floriday in order to guarantee data consistency between the ERP and Floriday, whereas some users work in the Floriday modules, ERP or other apps.

In order to keep data between Floriday and the application up-to-date, it is recommended to use the synchronisation endpoints. For instance, each time a new tradeItem is created, modified or deleted by a supplier, Floriday will increment the sequenceNumber of that specific record. These so called sequence numbers are unique for each model, such as tradeItem, supplyLine, etc.

By retrieving the sequenceNumber, it is not necessary to retrieve all the data every time, but only the changed records with a higher sequenceNumber. The data is up-to-date when the `MaximumSequenceNumber` in the result is equal to the inserted `SequenceNumber`.

***

<br/>

## Syncing for the first time

If you wish to start from scratch, it is advised to start with a maxSequence of "0" the first time you use the sync endpoints. This will ensure that everything is retrieved and eventually up-to-date.

The steps you should take are:

* Start with a sequence of "0" when using the \*/GET/.../sync/\{sequenceNumber=0};
* Process the received records and remember the highest provided sequenceNumber (=maxSequenceNumber);
* Use the remembered sequenceNumber when using the \*/GET/.../\{sequenceNumber};
* Process the received records and remember the highest provided sequenceNumber again;
* Repeat until the `MaximumSequenceNumber` in the result is equal to provided sequenceNumber.

If you wish to start over without historic data for some specific data, you can choose to fetch the current maximum sequenceNumber and sync from there.

***

<br/>

## Continuous Synchronisation

For continuous synchronisation it is not necessary to keep using the maxSequence endpoint to check if you are up-to-date. By using the endpoint \*/GET/.../sync/\{sequenceNumber}, you receive the current sequence number and the current maxSequenceNumber. You are up-to-date when the received `MaximumSequenceNumber` is equal to the received `SequenceNumber`.

> ❗️ Why zero new results does not have to mean you are up to date!
>
> In some cases it can happen that the results are empty, but the MaximumSequenceNumber is incremented. This is due to a filtering that happens in the sync endpoint itself.
>
> For example, when using the SupplyLines endpoint in the Customers API, the supply lines are automatically filtered based on a customer's connected suppliers. When the result is zero, this would mean that only supply lines of non-connected suppliers are retrieved. This is why you should keep fetching sequence numbers until the `MaximumSequenceNumber` is reached.

<br/>

***

<br/>

## Interval timers

Depending on how quickly the retrieved data can be processed, we recommend setting interval timers for endpoints that require near real-time synchronization to 1-5 minutes. Examples of these type of endpoints are the TradeItems and SupplyLines for customers or SalesOrder retrieval for suppliers.

For the synchronization of less frequently changed endpoints, such as Delivery conditions or connections, an interval of twice or even once a day may be sufficient.

<br/>