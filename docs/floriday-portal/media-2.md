---
updatedAt: 2025-04-28T11:37:29.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Media

## Target audience

* Customer organizations;
* Supplier organizations.

<br />

## Purpose

* Enables use of image media in all Floriday domains.

<br />

## Brief

Media that can be upload and retrieved to and from Floriday.

<br />

## Guidance

**Image Media**

* Suppliers and customers use Floriday image media for trade-items, base-items, batch photos, custom packages, profiles, logos, etc.
* Customers use Floriday image media for profiles, logos, etc.
* Supplier ERP can add image media in Floriday using a mediaID.
* Supplier and Customer ERP can get image media by using a Floriday image media URL
  * For staging: **<https://image.staging.floriday.io/mediaId.jpg> `{media type extension}`**
  * For live: **<https://image.floriday.io/mediaId.jpg> `{media type extension}`**
* Supplier ERP can add image media to and get image media from trade-items or batches using a Floriday media URL.

<br />

> 📘 Floriday image media rules
>
> -Min. resolution: 640x640\
> -Max. size: 5MB\
> -Media type extension:\
> .jpg or .jpeg (image/jpeg)\
> .png (image/png)

<br />

> 📘 Rescaling Floriday images
>
> To reduce image file size, you may rescale images by adding the `width` and/or `height` parameter to the image URL. We recommend using either width or height, as using just one will automatically rescale the image proportionally.
>
> Alternatively, you may use both width and height. In that case, we recommend using the `crop` parameter as well.
>
> Available crop types are: Crop, Fill, Fit, Pad & Scale (default).
>
> Example: <https://image.staging.floriday.io/2fdc9779-a742-40f9-a6cf-bb1b0736be3a.jpg?width=300;height=100;crop=fit>
>
> <Image align="center" src="https://files.readme.io/4ade347-image_2.png" />

**Document Media**

* Suppliers and Customers can upload document media for contract attachments via the front end of Floriday when creating a contract.
* This media will be referred to as *Attachments*.

<br />

> 📘 Floriday document media rules
>
> -Media type:\
> .pdf (application/pdf)\
> .doc (application/msword)\
> .docx (application/vnd.openxmlformats-officedocument.wordprocessingml.document)\
> .xls (application/vnd.ms-excel)\
> .xlsx (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)\
> .csv (text/csv)\
> .jpg or .jpeg (image/jpeg)\
> .png (image/png)

<br />

## Implementation model

![](https://files.readme.io/2c8acc2-Screenshot_2022-02-17_at_16.13.35.png "Screenshot 2022-02-17 at 16.13.35.png")

<br />

## Interaction model

![](https://files.readme.io/6dca60d-Screenshot_2022-02-14_at_22.21.23.png "Screenshot 2022-02-14 at 22.21.23.png")

<br />

Additional:

* Sales channels and service providers can access Media.