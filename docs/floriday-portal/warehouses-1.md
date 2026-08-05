---
updatedAt: 2025-04-28T11:19:23.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Warehouses

## Target audience

* Customer organizations;
* Supplier organizations;
* Supplier warehouse organizations.

<br />

## Purpose

* Enables use of warehouses in all Floriday domains.

<br />

## Guidance

**A warehouse:**

* Is a location for stock keeping batches;
* Can be owned by suppliers, and other warehouse organizations (e.g. import agents, auctions, exporters);
* Has a warehouse ID;
* Has a name;
* Can have a location-specific servicetype:
  * external stock: warehouses with an external stock capability for fulfillment services;
  * auctioning: warehouses with an auction capability for auction fulfillment services;
* Has a GLN location code registered with Floricode with location details;
* Has a specific set of delivery conditions;
* Is owned by one warehouse organization;
* Can support optional additional services (e.g. apply stickers, sleeves);
* Can be a default warehouse for Catalog supply.

<br />

* An organization can have one or more warehouses;
* Only warehouses can be retrieved where the customer or supplier is authorised to ship to or ship from;
* Delivery conditions apply to one or more warehouses;
* Delivery conditions can apply to supplier or external stock warehouses provided by the warehouse;
* One batch can only be on one warehouse at a given time;
* A customer supply-line is related to additional services and delivery conditions by a warehouseID.

<br/>
<br/>

## Implementation model

![](https://files.readme.io/75d1163-Screenshot_2022-02-17_at_16.08.21.png "Screenshot 2022-02-17 at 16.08.21.png")

<br/>
<br/>

## Interaction model

![](https://files.readme.io/b4a9264-Screenshot_2022-02-14_at_22.18.50.png "Screenshot 2022-02-14 at 22.18.50.png")