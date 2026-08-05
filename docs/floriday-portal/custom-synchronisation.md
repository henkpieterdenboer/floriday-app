---
updatedAt: 2025-06-17T11:03:05.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Custom synchronization

## Target audience

* Customer organizations.

***

<br />

## Brief

* Enables an additional supply synchronization;
* Reduces the amount of data that has to be processed while synchronising supply lines.

***

<br />

## Guidance

In short, the customSync enables users to reduce the total number of supplyLines by only making the supply lines that have a valid OrderPeriod available for synchronization. Furthermore, the user can reduce those results by selecting the type of supply, the amount of trade items, different suppliers and length of the delivery period. For more information about synchronization of Floriday data, please read about [synchronization](https://developer.floriday.io/docs/how-do-i-fetch-and-send-data-to-floriday) .

The output of the customSync endpoints has to be managed in the Floriday Customer portal. For more information please read the [Helpcenter page](https://helpcenter-customers.floriday.com/en/articles/6811442-integration-managing-supply-rules).

***

<br />

## Activating the custom supply synchronization

* Custom supply synchronization is only available on request. If you wish to use Custom supply synchronization, please contact your Implementation Consultant.
* The custom supply synchronization has to be activated by the main user of the customer organization by starting a rebuild;
* The rebuild process may take two to three hours to be completed;
* Executing a sync while a rebuild is in process will trigger an error code 423 response;
* Ideally the rebuild process only has to be performed once, the first time;
* After a rebuild is completed the synchronization will start with sequence number 0;
* In order to keep the synchronization working, without the customer having to execute a rebuild, Floriday requires API calls at least once a week on the different custom sync endpoints.

***

<br />

## Breaking and non-breaking changes

The customer can alter the active custom supply synchronization with the [Integration settings](https://customers.floriday.io/settings/integration) on the customer portal. Please note that some changes in these integrations require the custom supply synchronization to undergo a rebuild. We call these changes "breaking changes" which provide a completely new dataset after a rebuild. The sequence will start from 0 again after the rebuild.

<br />

### Breaking changes which requires a rebuild:

* Changes to which supply lines you want to receive for new connections (selected assortment, all assortment or none);
* Changes to the default delivery period (from 0 till a maximum of 14 days);
* Changes to sources of the requested supply lines (Catalogue prices, Batch prices, Customer offers and/or Purchase tips).

<br />

### Non-breaking changes:

The following changes or events do not require a rebuild, they simply add additional mutations in the custom supply synchronization:

* Changing the settings for one or more suppliers specifically (selected assortment, all assortment or none);
* Adding or removing connections in the customer's network;
* Mutations in the selected assortment of suppliers in the customer's network.

***

<br />

## Mutations disabled for sync

* Any mutations that reduce the amount of supply lines during an active synchronization build will be shown with DisabledForSync = True;
* After a rebuild these specific supply lines will simply not be included in the custom sync, there will be no history of these mutations.
* We strongly recommend filtering out the mutations that have DisabledForSync = True.