---
updatedAt: 2026-04-15T07:52:44.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Delivery conditions

## Target audience

* Customer organizations;
* Supplier organizations;
* Supplier warehouse organizations.

***

<br />

## Purpose

* Enables use of delivery conditions in all Floriday domains, currently only applicable for direct sales.

***

<br />

## Guidance

Delivery conditions are used by a supplier organization to specify under which conditions goods are delivered from a dispatch warehouse to a customer location. Delivery conditions currently only apply to Direct sales.

* A delivery condition may be set as a general delivery condition, which applies to all customers organizations.
* A delivery condition may be set as a customer specific delivery condition instead. These are usually created when a supplier has made a seperate agreement with customers regarding delivery (e.g. deviating time frames, no transport / delivery costs, delivery on Non-working days, etc.).

<br />

#### A delivery condition contains:

* Dispatch warehouses;
* Delivery regions;
* Incoterms;
* Transport and delivery costs;
* Minimum delivery quantity;
* Order periods;
* Non-working days with deviating timeframes.

***

<br />

### Dispatch warehouses

A delivery condition applies to one or more dispatch warehouses.

***

<br />

### Delivery regions

As per August 2024 the following delivery regions are supported in Floriday. New delivery regions can be added or existing regions can be modified. Please refer to the Floriday application for the latest supported regions.

| Delivery region                                    | GLN           |
| :------------------------------------------------- | :------------ |
| Naaldwijk                                          | 8713783479070 |
| Aalsmeer                                           | 8713783479063 |
| Rijnsburg                                          | 8713783479087 |
| Rhein-Maas                                         | 8713783843772 |
| Eelde                                              | 8713783205822 |
| Ede                                                | 8718288045720 |
| Boskoop                                            | 8713783217689 |
| Venlo                                              | 8713783479094 |
| Bleiswijk                                          | 8714231141891 |
| Bremen                                             | 8713783809662 |
| Nairobi Airport                                    | 8718288046703 |
| Schiphol Airport                                   | 8713783468548 |
| Addis Abeba Airport                                | 8718288046918 |
| Quito Airport                                      | 8718288046925 |
| Tel Aviv Airport                                   | 8718288046949 |
| Casablanca Airport                                 | 8718288099914 |
| Bogota Airport                                     | 8718288046932 |
| Vestiging koper                                    | 8713783295878 |
| Af tuin (with Incoterm EXW, picked up at supplier) | 8714231208761 |

***

<br />

### Incoterms

As per August 2024 the following Incoterms are supported in Floriday. New Incoterms may be added in the future. Please refer to the Floriday application for the latest supported Incoterms.

* DDP - Deliveries are brought to a logistic hub;
* EXW - Deliveries are picked up at supplier warehouse;
* FCA - Deliveries are brought to the airport of departure.

See [Business rules - Incoterms](https://developer.floriday.io/docs/incoterms) for more information.

***

<br />

### Transport and Delivery costs

A supplier organization may set separate Transport and Delivery costs in their delivery conditions. Transport and delivery costs are applied by default, unless specified otherwise by means of **Included services**. Transport and Delivery costs only apply when a supply line does not contain `includedServices: delivery`.

<br />

#### Configuring costs per unit & costs per delivery

As a part of the Transport and delivery costs, a supplier organization may set a **Cost per unit** or a **Cost per delivery**.

* The **Cost per unit** applies **per Load carrier** when an order is placed on supply lines excluding delivery costs.
* The **Cost per delivery** applies **per delivery** when an order is placed on supply lines excluding delivery costs. The Cost per delivery is dropped when a specified amount or volume is reached.

![](https://files.readme.io/1562cd2195a755c41307a975222e964e0ae4350a31fc56a7711cd646753c4238-image.png)

Transport and delivery costs are charged in the price per piece of the sales order. This is currently the only way for Financial service providers to process these costs.

<br />

#### Included services

When creating supply lines, a supplier organization may choose if their Transport and Delivery costs apply to orders placed on those supply lines. This can be done by stating that the supply line has **Included services**, which apply to delivery and transport.

E.g. if a supply line contains `includedServices: delivery`, any transport and delivery costs that would normally apply, will now not apply.

#### Examples

A supplier organization that uses supply based on Price groups may set **Including services** in the Price groups. Whenever the supplier organization creates supply lines that use this Price group, the Transport and Delivery costs present in the corresponding Delivery Conditions will now not apply.

<Image align="center" alt="Included services within Price group configuration in the Floriday application" caption="Included services within Price group configuration in the Floriday application" src="https://files.readme.io/508ab2a590e3e472f856c5f3139d0dc9a705d9739a2ba08ac3732065f3d1563c-image.png" />

<br />

* Other supply types such as [Customer offers](https://developer.floriday.io/docs/direct-sales-customer-offer-1) have a seperate option to configure the Included services. Customer offers are supply lines that do not use Price groups. Instead, the supplier organization may manually set the Included services for this type of supply line:

<Image align="center" alt="Included services when creating a Customer offer in the Floriday application" caption="Included services when creating a Customer offer in the Floriday application" src="https://files.readme.io/2c28ba50bd2358d2e0afd2625fa0f56e254295802f43f5261b11a25af5ab77a3-image.png" />

***

<br />

### Minimum delivery quantity

A supplier organization may set a minimum delivery quantity. By default this minimum quantity is one package and can optionally be set as multiple packages, one or more layers or one or more load carriers. If this minimum quantity is not reached once the latest order moment has passed, a supplier organization may decide not to deliver by accepting or cancelling the order.

Customer initiated sales orders remain uncommitted until the minimum delivery quantity is met. By default Floriday confirms orders when the minimum delivery quantity is met with the exception of loadcarrier(s): a minimum delivery quantity of a Load carrier is met when a Load carrier is loaded to 80% capacity.

A supplier organization may configure their Trade settings in Floriday to manage orders that do not reach the minimum delivery quantity.

![](https://files.readme.io/cd2898186bc46e1d3b161c4fac4eaea3c80ca0caf443305ef157c959dea761dc-image.png)

* If this trade setting is **disabled** (default), the supplier can manually approve these orders for the duration of an hour after the latest order moment. If approved, the order is committed. Without manual approval, the orders are automatically cancelled after **one hour**.
* If this trade setting is **enabled**, orders are automatically cancelled if the minimum quantity has not been reached. Orders are automatically committed if the minimum quantity is reached.

Read the Helpcenter article: [Pending orders](https://helpcenter.floriday.com/en/articles/8645454-pending-orders) for more information.

***

<br />

### Order periods

A supplier organization configures their order periods by setting:

* The days when orders may be placed (**1: days**, eg. Monday, Tuesday, Wednesday, Thursday);
* Each day includes **2: orderTimeFrames**, which consist of:
* Times before which can be ordered (**3: latestOrderTime**, eg. 06:00, 13:00);
* Calculated Day(s) when the goods will be delivered (**4: deliveryDaysOffset**, e.g. 0, +1);
* Times at which goods will be delivered (**5: latestDeliveryTime**, e.g. 15:00, 07:00).

<br />

Below is an image from the Floriday supplier application for a visualisation of this concept:

![](https://files.readme.io/15cf4c45d903c7d45cef99798dc232a5e42653d3c8a0e7b5b5f5ae8ad90af838-image.png)

**Note:** The Delivery Conditions also include the option to add an additionalPrice within these orderTimeFrames. This additionalPrice is currently not used, but may be used in the future to add additional costs for night time deliveries for instance.

***

<br />

### Non-working days

Non-working days allow supplier organizations to specify on which National holidays (NL, BE and DE) a supplier organization does not **deliver**. In other words, the **orderTimeFrames** for Non-working days are dropped. Instead, the next available **orderTimeFrame** is chosen.

Note that orders may still be placed on Non-working days, as long as the delivery time is not on a Non-working day.

If a supplier organization decides to add a **deviating time frame**, the next available **orderTimeFrame** is replaced with the deviatingTimeFrame set by the supplier organization. See Example 3 below for a detailed explanation.

> 📘 National holidays without fixed dates
>
> Some National holidays do not have a fixed date every year. We currently do not have a native feature that calculates the National holidays each year, but use an external source for this calculation.
>
> In order to implement the Non-working days for **customer applications**, you will need to create your own calculations of when these National holidays occur each year.
>
> The external source we use can be found here: <https://www.codeproject.com/Articles/10860/Calculating-Christian-Holidays>.

<br />

Below are some practical examples to visualize how the Non-working days function. We use Ascension Day as our example, which is on a Thursday by default.

<br />

<details>
  <summary><b>Example 1</b> - A single same day order period</summary>

  <br />

The supplier organization has set the same order period for Monday through Friday. On the selected weekdays, anything ordered before 06:00 is delivered on the same day at 13:00.

![](https://files.readme.io/de75e73-image.png)

The order and delivery days for this supplier organization will look like this:

* Orders before **Monday 06:00** are delivered on **Monday at 13:00**.
* Orders before **Tuesday 06:00** are delivered on **Tuesday at 13:00**.
* Orders before **Wednesday 06:00** are delivered on **Wednesday at 13:00**.
* Orders before **Thursday 06:00** are delivered on **Thursday at 13:00**.
* Orders before **Friday 06:00** are delivered on **Friday at 13:00**.

This also means that anything ordered **after** 06:00 will be delivered the **next working day** at 13:00.

Take note that Saturday and Sunday are not enabled in this example. Anything ordered **after** Friday 06:00 (including the weekend) will be seen as ordered **before** Monday 06:00 and will therefor be delivered the next Monday at 13:00.

With regards to Ascension Day, the Thursday as a **delivery day** is ignored. Instead, Friday is chosen as the next available delivery day.

With Ascension Day as a Non-working day, the order and delivery days for this supplier organization will look like this:

* Orders before **Monday 06:00** are delivered on **Monday at 13:00**.
* Orders before **Tuesday 06:00** are delivered on **Tuesday at 13:00**.
* Orders before **Wednesday 06:00** are delivered on **Wednesday at 13:00**.
* ~~Orders before **Thursday 06:00** are delivered on **Thursday at 13:00**.~~
* Orders before **Friday 06:00** are delivered on **Friday at 13:00**.

  <br />

**Note:** Orders before Friday 06:00 include orders placed on Thursday.

***

</details>

<details>
  <summary><b>Example 2</b> - Multiple order periods per day</summary>

  <br />

The first example was fairly simple where ordering and delivering was done on the same day. In practice, a supplier organization usually has more than one orderTimeFrame per day. Our next supplier is no different.

![](https://files.readme.io/e566596-image.png)

This supplier organization has two orderTimeFrames per working day:

* Orders before **Monday 06:00** are delivered on **Monday at 13:00**.
* Orders before **Monday 13:00** are delivered on **Tuesday at 07:00**.
* Orders before **Tuesday 06:00** are delivered on **Tuesday at 13:00**.
* ...
* Orders before **Friday 13:00** are delivered on **Monday at 07:00**.
* Orders before **Monday 06:00** are delivered on **Monday at 13:00**.
* Etc.

  <br />

See the coloured timeline in the image for a visual representation.

* The green bar represents the order period with the green dot.
* The purple bar represents the order period with the blue dot.

***

  <br />

With this in mind, we can now establish Thursday as a delivery date. We will include the latest delivery time on Wednesday and first delivery time on Friday as a reference:

* Orders before **Wednesday 06:00** are delivered on **Wednesday at 13:00**
* Orders before **Wednesday 13:00** are delivered on **Thursday at 07:00**.
* Orders before **Thursday 06:00** are delivered on **Thursday at 13:00**.
* Orders before **Thursday 13:00** are delivered on **Friday at 07:00**.
* Orders before **Friday 06:00** are delivered on **Friday at 13:00**.

  <br />

On Ascension Day, Thursday as an order date and as a delivery date is ignored:

* Orders before **Wednesday 06:00** are delivered on **Wednesday at 13:00**
* ~~Orders before **Wednesday 13:00** are delivered on **Thursday at 07:00**.~~
* ~~Orders before **Thursday 06:00** are delivered on **Thursday at 13:00**.~~
* ~~Orders before **Thursday 13:00** are delivered on **Friday at 07:00**.~~
* Orders before **Friday 06:00** are delivered on **Friday at 13:00**.

***

</details>

<details>
  <summary><b>Example 3</b> - Deviating time frames</summary>

  <br />

In addition to Non-working days, a supplier organization may also configure a different delivery time for the day **after** a Non-working day. This is referred to as the `deviatingTimeFrame` and applies to the first valid orderTimeFrame that would be chosen in case of a Non-working day.

For the sake of simplicity, we will use the supplier organization from Example 1 with the same order period for Monday through Friday. On the selected weekdays, anything ordered before 06:00 is delivered on the same day at 13:00.

![](https://files.readme.io/c0a7d7b-image.png)

The supplier has selected Ascension Day as one of their Non-Working days.

The order and delivery days for this supplier organization will look like this:

* Orders before **Monday 06:00** are delivered on **Monday at 13:00**.
* Orders before **Tuesday 06:00** are delivered on **Tuesday at 13:00**.
* Orders before **Wednesday 06:00** are delivered on **Wednesday at 13:00**.
* ~~Orders before **Thursday 06:00** are delivered on **Thursday at 13:00**.~~
* Orders before **Friday 06:00** are delivered on **Friday at 13:00**.
* Orders before **Monday 06:00** are delivered on **Monday at 13:00**.

This time, the supplier organization has set a different delivery time for the day **after** the Non-working day. Below is another visual representation of this feature from the Floriday supplier application.

![](https://files.readme.io/7fa4596-image.png)

Because the supplier selected a deviating delivery time, the standard delivery time for Friday is replaced:

* Orders before **Monday 06:00** are delivered on **Monday at 13:00**.
* Orders before **Tuesday 06:00** are delivered on **Tuesday at 13:00**.
* Orders before **Wednesday 06:00** are delivered on **Wednesday at 13:00**.
* ~~Orders before **Thursday 06:00** are delivered on **Thursday at 13:00**.~~
* Orders before **Friday 06:00** are delivered on **Friday at 15:00**.
* Orders before **Monday 06:00** are delivered on **Monday at 13:00**.

As stated before. the `deviatingTimeFrame` only applies to the delivery time after the Non-working day. Subsequent delivery times are unaffected.

</details>

***

<br />

## Implementation model

![](https://files.readme.io/0097779-Screenshot_2022-02-17_at_16.07.13.png "Screenshot 2022-02-17 at 16.07.13.png")

***

<br />

## Interaction model

![](https://files.readme.io/c4797ca-Screenshot_2022-02-14_at_22.19.35.png "Screenshot 2022-02-14 at 22.19.35.png")