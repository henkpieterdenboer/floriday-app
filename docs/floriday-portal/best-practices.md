---
updatedAt: 2025-04-28T11:37:12.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Best practices

## Using Sync Endpoints Over Non-Sync GET

When utilizing the Floriday API, we highly recommend using the sync endpoints whenever possible. By doing so, you'll only need to retrieve updated data, resulting in more efficient data management.

**Efficiency of Data Retrieval:** Sync endpoints minimize redundant data retrieval by providing only the changes in data, unlike non-sync GET endpoints, which fetch all data within the specified filter options, including unchanged data. This reduces unnecessary server load and network traffic.

**Real-Time Updates:** Sync endpoints facilitate real-time updates by automatically incrementing a unique 'sequenceNumber' with each modification to the data model. Users can fetch only the relevant changes by invoking the sync endpoint with the last known sequence number in their system, ensuring data accuracy.

***

<br />

## Retrieving New Data with Sync

When retrieving new data, such as when establishing a new connection with a grower, it's crucial to commence from sequence number 0 rather than the current sequence number used for that endpoint. This ensures the retrieval of all available data, thereby maintaining data integrity.

***

<br />

## Suggested Sync Frequencies

A common question when using the sync endpoints is how often these endpoints should be called. The general rule we recommend is to look at how often certain data updates and base the frequency on that.

For example, we recommend syncing data such as supply lines at least every minute. Supply line data is subject to frequent changes, which is why we recommend syncing in smaller intervals. This not only keeps the data up to date, but also reduces the size of the calls. On the other hand, Organizations will not change frequently, so syncing once a day is more than sufficient. Note that some changes may have impact on your daily process, which is why we suggest to always have an option to manually sync.

To further reduce the load on our servers, we strongly suggest implementing delays after fetching and processing data. For instance, if your software is running at 20 companies and syncing every 5 minutes, this creates server spikes every 5 minutes that we would prefer to spread out. By introducing a delay, where the next sync cycle only occurs after data has been fetched and processed, these spikes can be distributed more evenly.