---
updatedAt: 2026-06-12T09:50:24.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Supply

**Supply** is the umbrella term for one or more [Supply lines](https://developer.floriday.io/docs/supply-lines-1) and comes in many forms. The difference between the various Supply types are listed below.

***

<br />

## Overview of supply types

<br />

### Catalog Supply

<Table>
  <thead>
    <tr>
      <th>

      </th>

      <th>

      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        **Trade instrument**
      </td>

      <td>
        Direct Sales
      </td>
    </tr>

    <tr>
      <td>
        **Supply type**
      </td>

      <td>
        Catalog price
      </td>
    </tr>

    <tr>
      <td>
        **AKA**
      </td>

      <td>
        Weekly supply
      </td>
    </tr>

    <tr>
      <td>
        **Link**
      </td>

      <td>
        [Catalog Supply](https://developer.floriday.io/docs/catalog-supply)
      </td>
    </tr>

    <tr>
      <td>
        **Sales channels**
      </td>

      <td>
        * Floriday
      </td>
    </tr>

    <tr>
      <td>
        **Availability based on**
      </td>

      <td>
        Current trade item availabilities
      </td>
    </tr>

    <tr>
      <td>
        **'Purchase tip' rules (can change dynamically)**
      </td>

      <td>
        Not supported
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Floriday application**
      </td>

      <td>
        Supported with Weekly base supply
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Supplier application**
      </td>

      <td>
        Supported with Weekly supply lines
      </td>
    </tr>

    <tr>
      <td>
        **Supply can be allocated to**
      </td>

      <td>
        Specific customers in a network only
      </td>
    </tr>

    <tr>
      <td>
        **Pricing period**
      </td>

      <td>
        Weekly Catalog prices
      </td>
    </tr>

    <tr>
      <td>
        **Forward (future) pricing and orders**
      </td>

      <td>
        Forward customer specific pricing after the current week is possible, even if current trade item availability is toggled to unavailable.
      </td>
    </tr>

    <tr>
      <td>
        Forward orders based on forward prices are supported.
      </td>

      <td>

      </td>
    </tr>

    <tr>
      <td>
        **Pricing rules**
      </td>

      <td>
        * The weekly prices are fixed on Thursday 10am (UTC+1) in the current week, until the end of next week.
        * Before Thursday 10am in the current week both prices and supply may be updated.
        * After Thursday 10am only new weekly supply may be added.
      </td>
    </tr>

    <tr>
      <td>
        **Additional delivery pricing (delivery conditions)**
      </td>

      <td>
        Supported
      </td>
    </tr>

    <tr>
      <td>
        **Additional services (pricing)**
      </td>

      <td>
        Supported
      </td>
    </tr>

    <tr>
      <td>
        **Quantity rules**
      </td>

      <td>
        Available quantity is indicative on a weekly basis.
      </td>
    </tr>
  </tbody>
</Table>

***

<br />

### Batch Supply

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>

      </th>

      <th>

      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        **Trade instrument**
      </td>

      <td>
        Direct sales
      </td>
    </tr>

    <tr>
      <td>
        **Supply type**
      </td>

      <td>
        Batch price
      </td>
    </tr>

    <tr>
      <td>
        **AKA**
      </td>

      <td>
        Daily Supply
      </td>
    </tr>

    <tr>
      <td>
        **Link**
      </td>

      <td>
        [Batch supply](https://developer.floriday.io/docs/batch-supply)
      </td>
    </tr>

    <tr>
      <td>
        **Sales channels**
      </td>

      <td>
        * FloraMondo - Floriday
      </td>
    </tr>

    <tr>
      <td>
        **Availability based on**
      </td>

      <td>
        Batch available quantity for a period
      </td>
    </tr>

    <tr>
      <td>
        **'Purchase tip' rules (can change dynamically)**
      </td>

      <td>
        Not supported
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Floriday application**
      </td>

      <td>
        Supported with Base supply
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Supplier application**
      </td>

      <td>
        Supported with Supply-lines
      </td>
    </tr>

    <tr>
      <td>
        **Supply can be allocated to**
      </td>

      <td>
        General and specific customers
      </td>
    </tr>

    <tr>
      <td>
        **Pricing period**
      </td>

      <td>
        Specific period
      </td>
    </tr>

    <tr>
      <td>
        **Forward (future) pricing and orders**
      </td>

      <td>
        Currently not supported
      </td>
    </tr>

    <tr>
      <td>
        **Pricing rules**
      </td>

      <td>
        Prices may be changed (By setting supply unavailable and creating new supply)
      </td>
    </tr>

    <tr>
      <td>
        **Additional delivery pricing (delivery conditions)**
      </td>

      <td>
        Supported
      </td>
    </tr>

    <tr>
      <td>
        **Additional services (pricing)**
      </td>

      <td>
        Supported
      </td>
    </tr>

    <tr>
      <td>
        **Quantity rules**
      </td>

      <td>
        * Available quantity is the maximum amount available for the given period.  - The ordered sales order quantity can never exceed the available quantity.  - Available quantity can be corrected by the supplier.
      </td>
    </tr>

    <tr>
      <td>
        **Packing configurations**
      </td>

      <td>
        * The default packing configuration of the batch is applicable if no packing configuration(s) are added in the supply-line.  - If packing configurations are added in the supply-line then these will be applicable and overrule the default packing configuration of the batch. The packing configurations in the supply-line needs to exist in the trade-item.
      </td>
    </tr>

    <tr>
      <td>
        **Custom packages**
      </td>

      <td>
        Supported
      </td>
    </tr>
  </tbody>
</Table>

***

<br />

### Customer Offer

<Table>
  <thead>
    <tr>
      <th>

      </th>

      <th>

      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        **Trade instrument**
      </td>

      <td>
        Direct sales
      </td>
    </tr>

    <tr>
      <td>
        **Supply type**
      </td>

      <td>
        Customer offer
      </td>
    </tr>

    <tr>
      <td>
        **AKA**
      </td>

      <td>
        Offer
      </td>
    </tr>

    <tr>
      <td>
        **Link**
      </td>

      <td>
        [Customer offer](https://developer.floriday.io/docs/customer-offer)
      </td>
    </tr>

    <tr>
      <td>
        **Sales channels**
      </td>

      <td>
        * Floriday
      </td>
    </tr>

    <tr>
      <td>
        **Availability based on**
      </td>

      <td>
        * Unlimited quantity, availability is based on availability set in [Catalog Supply](https://developer.floriday.io/docs/catalog-supply) or:
        * Limited quantity of supply that is set for supply lines in the offer. When supply of a supply line reaches zero, the supply line will become unavailable.
      </td>
    </tr>

    <tr>
      <td>
        **'Purchase tip' rules (can change dynamically)**
      </td>

      <td>
        Supported  

        * Maximum of 1 specific customer
        * Maximum availability of 3 hours
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Floriday application**
      </td>

      <td>
        Currently not supported
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Supplier application**
      </td>

      <td>
        Supported with customer offers
      </td>
    </tr>

    <tr>
      <td>
        **Supply can be allocated to**
      </td>

      <td>
        One or more specific customers.
      </td>
    </tr>

    <tr>
      <td>
        **Pricing period**
      </td>

      <td>
        Specific period
      </td>
    </tr>

    <tr>
      <td>
        **Forward (future) pricing and orders**
      </td>

      <td>
        Forward customer specific pricing for a future period is possible. Forward orders based on forward prices are supported.
      </td>
    </tr>

    <tr>
      <td>
        **Pricing rules**
      </td>

      <td>
        Prices may be changed.
      </td>
    </tr>

    <tr>
      <td>
        **Additional delivery pricing (delivery conditions)**
      </td>

      <td>
        Supported
      </td>
    </tr>

    <tr>
      <td>
        **Additional services (pricing)**
      </td>

      <td>
        Supported
      </td>
    </tr>

    <tr>
      <td>
        **Custom packages**
      </td>

      <td>
        Supported
      </td>
    </tr>

    <tr>
      <td>
        **Quantity rules**
      </td>

      <td>
        * When no packing configuration is selected, then all packing configurations are available for use.
        * There are 2 options, in both cases the ordered sales order quantity can never exceed the available quantity. Available quantity may be updated by the supplier.  
          * Unlimited quantity, availability is based on availability set in 
            [Catalog Supply](https://developer.floriday.io/v2024.1/docs/direct-sales-catalog-supply)
            . 
          * Limited quantity of supply that is set for supply line(s) in the offer. When supply of a supply line reaches zero, the supply line will become unavailable. | | **Packing configurations**  | The default packing configurations of the trade-item are applicable. If packing configurations are added in the customer offer then these will be applicable. 
      </td>
    </tr>
  </tbody>
</Table>

***

<br />

### Purchase tip

The Purchase tip is a variation on the Customer offer that allows suppliers to send short term offers with an order period of 3 hours to a single customer. These are offers that are created to stand out and to instill a sense of urgency for customers.

As of 2024v1, the Purchase tip has been added as a SupplyType in the **SupplyLine** model.

***

<br />

### Clock sales Supply

<Table align={["left","left"]}>
  <thead>
    <tr>
      <th>

      </th>

      <th>

      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        **Trade instrument**
      </td>

      <td>
        Clock sales
      </td>
    </tr>

    <tr>
      <td>
        **Supply type**
      </td>

      <td>
        Not applicable
      </td>
    </tr>

    <tr>
      <td>
        **AKA**
      </td>

      <td>
        Auction sales
      </td>
    </tr>

    <tr>
      <td>
        **Link**
      </td>

      <td>
        [Clock supply](https://developer.floriday.io/docs/clock-sales-supply)
      </td>
    </tr>

    <tr>
      <td>
        **Sales channels**
      </td>

      <td>
        * RFH auction channels (Dutch: KOA or Kopen Op Afstand)
      </td>
    </tr>

    <tr>
      <td>
        **Availability based on**
      </td>

      <td>
        Batch available quantity based on an auction delivery.
      </td>
    </tr>

    <tr>
      <td>
        **'Purchase tip' rules (can change dynamically)**
      </td>

      <td>
        Not applicable
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Floriday application**
      </td>

      <td>
        Not applicable
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Supplier application**
      </td>

      <td>
        Not applicable
      </td>
    </tr>

    <tr>
      <td>
        **Supply can be allocated to**
      </td>

      <td>
        Auction location
      </td>
    </tr>

    <tr>
      <td>
        **Pricing period**
      </td>

      <td>
        During auction
      </td>
    </tr>

    <tr>
      <td>
        **Forward (future) pricing and orders**
      </td>

      <td>
        Not applicable
      </td>
    </tr>

    <tr>
      <td>
        **Pricing rules**
      </td>

      <td>
        Not applicable
      </td>
    </tr>

    <tr>
      <td>
        **Additional delivery pricing (delivery conditions)**
      </td>

      <td>
        Not supported
      </td>
    </tr>

    <tr>
      <td>
        **Additional services (pricing)**
      </td>

      <td>
        Not supported
      </td>
    </tr>

    <tr>
      <td>
        **Quantity rules**
      </td>

      <td>
        * Available quantity is the maximum available amount for the given auction date. - The ordered (bid) sales order quantity can never exceed the available quantity.
      </td>
    </tr>

    <tr>
      <td>
        **Packing configurations**
      </td>

      <td>
        * By default, the packing configuration(s) of the trade item are applicable. - Only one packing configuration may be used. - A packing configuration may be added when creating the Clock sales Supply.
      </td>
    </tr>

    <tr>
      <td>
        **Custom packages**
      </td>

      <td>
        Not supported
      </td>
    </tr>
  </tbody>
</Table>

***

<br />

### Clock pre sales Supply

<Table>
  <thead>
    <tr>
      <th>

      </th>

      <th>

      </th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>
        **Trade instrument**
      </td>

      <td>
        Clock pre sales
      </td>
    </tr>

    <tr>
      <td>
        **Supply type**
      </td>

      <td>
        Not applicable
      </td>
    </tr>

    <tr>
      <td>
        **AKA**
      </td>

      <td>
        Auction pre sales
      </td>
    </tr>

    <tr>
      <td>
        **Link**
      </td>

      <td>
        [Clock pre sales supply](https://developer.floriday.io/docs/clock-pre-sales-supply)
      </td>
    </tr>

    <tr>
      <td>
        **Sales channels**
      </td>

      <td>
        * FloraMondo
      </td>
    </tr>

    <tr>
      <td>
        **Availability based on**
      </td>

      <td>
        A percentage of available quantity of potential Clock sales supply.
      </td>
    </tr>

    <tr>
      <td>
        **'Purchase tip' rules (can change dynamically)**
      </td>

      <td>
        Not supported
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Floriday application**
      </td>

      <td>
        Supported with pre-set prices and clock pre sales percentages.
      </td>
    </tr>

    <tr>
      <td>
        **Customer specific pricegroups & availability filters in Supplier application**
      </td>

      <td>
        Supported with Auction Delivery orders for prices only.
      </td>
    </tr>

    <tr>
      <td>
        **Supply can be allocated to**
      </td>

      <td>
        Auction location
      </td>
    </tr>

    <tr>
      <td>
        **Pricing period**
      </td>

      <td>
        Specific period
      </td>
    </tr>

    <tr>
      <td>
        **Forward (future) pricing and orders**
      </td>

      <td>
        Not applicable
      </td>
    </tr>

    <tr>
      <td>
        **Pricing rules**
      </td>

      <td>
        Prices may be changed. After the first sales order in FloraMondo, prices may only be altered upwards.
      </td>
    </tr>

    <tr>
      <td>
        **Additional delivery pricing (delivery conditions)**
      </td>

      <td>
        Not supported
      </td>
    </tr>

    <tr>
      <td>
        **Additional services (pricing)**
      </td>

      <td>
        Not supported
      </td>
    </tr>

    <tr>
      <td>
        **Quantity rules**
      </td>

      <td>
        * Available quantity is the maximum available amount for the given period.  
        * The ordered sales order quantity can never exceed the available quantity.
      </td>
    </tr>

    <tr>
      <td>
        **Custom packages**
      </td>

      <td>
        Not supported
      </td>
    </tr>

    <tr>
      <td>

      </td>

      <td>

      </td>
    </tr>

    <tr>
      <td>
        **Packing configurations**
      </td>

      <td>
        * By default, the packing configuration(s) of the trade item are applicable.
        * One packing configuration is used, which is based on the packing configuration used in the Clock sales Supply.
        * A packing configuration may be added when creating the Clock sales Supply.
      </td>
    </tr>
  </tbody>
</Table>

<br />

***

<br />

If you're looking for information on **Bundled Offers**, please read [the Business Rules](https://developer.floriday.io/docs/direct-sales-bundled-offer).