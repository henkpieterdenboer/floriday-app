---
updatedAt: 2025-09-17T09:00:17.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Error codes

This section provides additional information on Error codes, what caused them and how to solve them

Error codes are shown in the following format:

<Image align="center" className="border" border={true} src="https://files.readme.io/e17f888-image.png" />

More information about this format can be found here:
<https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.validationproblemdetails?view=aspnetcore-8.0>

Below is a list of error codes you may encounter when using the Floriday API.

***

## Proxy error codes

### Validation error

A Validation error with a **400** status code indicates the server couldn't process the request due to a client error. For instance, a mandatory field was given an incorrect value type or wasn't given a value at all. Please check if the value was entered (correctly).

### Invalid enum value

An Invalid enum value with a **400** status code indicates that an enum value was used incorrectly. See the exception message for more information.

### Unauthorized

A Unauthorized **401** error indicates that the request has not been fulfilled due to lack of authorization. We recommend checking the credentials used to perform the request. This error message is mostly generic, except for when a deprecated version is used. In that case a specific error message is shown.

### Forbidden

A Forbidden **403** error indicates that you either do not have permission to perform the request or that incorrect or insufficient scopes have been added to the request. It may also mean that the version you are using is deactivated and/or offline.

### Internal server error

An Internal server error with a **500** status code indicates that an error has occurred in one of our services. Please contact the appropriate channels to notify us of this error.

### Gateway time out

A Gateway time out error with a **504** status code indicates that the action has taken too long to complete. The default time out limit is 30 seconds.

### Not implemented

A Not implemented error with a **501** status code indicates that the server does not (yet) support the functionality required to fulfill the request. Please contact us when you receive this error code. We aim to add all the required functionalities as soon as possible.

### Unknown error

An Unknown error with a **500** status code indicates that an exception message for this error has not been defined yet.

### Unsupported Media Type

An Unsupported Media Type error with a **415** status code indicates that the server is rejecting the request because it cannot process the payload format. This typically indicates that the Content-Type header does not align with the format of the submitted data, or that the server lacks support for the specified media type.

### Method not allowed

A Method not allowed error with a **405** status code indicates that the incorrect HTTP method was used (GET versus POST for example). It could also mean that you do not have the necessary permissions to execute the request (read-only access, but trying to perform a write operation when using a PUT or POST request). Please check if you're using the correct HTTP method or have the required scopes listed with the endpoint on the Swagger page.

### URI Too Long

A URI Too Long error with a **414** status code indicates that the URI provided was too long for the server to process. We recommend performing separate requests to reduce the length of the URI.

***

## Domain error codes

### already-exists

The id used when creating a new entity has already been used. Please generate a different unique identifier.

### does-not-exist

The referenced entity does not exist. Validate if the id that was used is correct. It is possible that the entity has been deleted and is not available within the chosen endpoint.

### deleted

You are trying to use, edit or delete an entity that has already been deleted.

### immutable

The entity is in a status that can no longer be modified. See the exception message for more information.

### invalid-price

The price you entered is invalid. Please choose a different value.

### invalid-location

The location cannot be used within this specific message. It may be possible that the location has expired. See the exception message for more information.

### invalid-package

The package code you entered could not be found. Please enter a valid package code.

### invalid-correction

The requested correction or cancellation is invalid. See the exception message for more information.

### invalid-organization

The organization cannot be used within this specific message. It may be possible that the organization either does not exist, is invalid, has no RFH number, has the wrong organization type and/or has expired. See the exception message for more information.

### invalid-additional-service

The additional service you entered is invalid. Please enter a correct value.

### invalid-owner

You are trying to complete an action for an entity with an incorrect owner. Please use the correct owner.

### invalid-status

The action could not be completed because of the current status of the entity. See the exception message for more information.

### invalid-deadline

The deadline you entered is not valid. See the exception message for more information.

### expired-deadline

The action could not be completed because the deadline of the action has expired. See the exception message for more information.

### invalid-currency

The currency you entered is not equal to the currency of the entity. Please enter the correct currency.

### invalid-email-address

The email address you entered is invalid. Please enter a valid email address.

### invalid-number-of-pieces

The number of pieces you entered is invalid. See the exception message for more information.

### invalid-trade-instrument

The trade instrument you entered is incorrect. Please use a valid trade instrument.

### invalid-payment-provider

The payment provider you entered does not match with organizations, the currency is invalid or the payment provider cannot be used with this action. See the exception message for more information.

### retry-delay

You have attempted this action too many times in the given period. See the exception for when you can attempt the action again.

### trade-setting

The action cannot be completed due to a trade setting of the other party. Please contact the other organization for more information.

### invalid-incoterm

The Incoterm you entered is invalid. Please use a valid Incoterm that corresponds with the delivery location.

### duplicate-lines

The request contains a list with duplicate values or id's.

### invalid-warehouse

*The request contains a warehouse reference that does not exist or is either deleted or owned by a different organization.*

### invalid-image-url

*The request contains an invalid image url.*

The image must be uploaded to Floriday and the url must be in the following format: `image.floriday.io/images/{id}.jpg`

### invalid-period

The request contains a time period with an expired date or a start date after the end date.

### invalid-customer-specific-modification

The request attempts to modify the customer-specific data, which is not allowed.

### invalid-trade-item

The request contains a trade-item reference that is either deleted, owned by a different organization, contains invalid data or does not exist.

### invalid-vbn-product

The request contains a VBN product code reference that does not exist or is expired.

### invalid-vbn-package

The request contains a VBN package code reference that does not exist or is expired.

### invalid-custom-package

The request contains a custom package reference that is either deleted, owned by a different organization, contains invalid data or does not exist.

### sold-out

The order was placed on supply which has already been sold out.

### insufficient-number-of-pieces

The number of pieces you entered is insufficient. See the exception message for more information.

### trade-period-not-started

The order was placed on supply of which the trade period hasn't started yet. Please try again once the trade period has started.

### trade-period-expired

The order was placed on supply where the trade period has already expired.

### delivery-period-not-started

The order was placed with a date and time before the delivery period has started. Please use a correct date and time within the delivery period.

### delivery-period-expired

The order was placed with a date and time after the delivery period has ended. Please use a correct date and time within the delivery period.

### invalid-delivery-date-time

The selected delivery date time is no longer possible. See the exception for more information.

### invalid-sales-unit

The number of pieces is not divisible by the amount of pieces in the sales unit.

### invalid-delivery-location-gln

The selected delivery location GLN either does not exist or has expired. Please use a valid delivery location GLN.

### invalid-packing-configuration

The request contains a packing configuration reference that does not match the referenced object.

### invalid-load-carrier-code

The entered load carrier code is either not known at Floricode or is not numeric.

### file-not-found

There is no file linked to this object.

### invalid-pdf

PDF is not in a valid format.

### invalid-threshold

It is not allowed to have a threshold on both price and minimal number of load carriers.

### unable-to-copy-supply-request

You either tried to copy a FloraXchange supply request with more than one supplier or copy a supply request while an associated trade item request has the status Pending or Rejected.

### invalid-parameters

One or more of the specified parameters are incorrect. See the exception message for more information.

### route-not-found

The URL you entered is invalid, please consult the Swagger for the correct URL.

### blocked-by-organization-settings

The request was blocked due to the Trade settings of the target organization. See the exception message for more information.

### customer-specific-modification

The request tried to modify a state to or from customer specific, which is not allowed. See the exception message for more information.

### duplicate-line

The request contains a list with duplicate values or id's.

### insufficient-wallet-amount

The wallet of the customer organization does not contain sufficient funds to accept the request.

### invalid-batch

The requested entity for this batch does not exist.

### invalid-countdown-method

The countdown method used is not available for the chosen type of supply. See the exception message for more information.

### invalid-filter

At least one of the filter options must be provided. See the exception message for more information.

### invalid-image

The provided image URL is not valid. See the exception message for more information.

### invalid-season-photo

The provided season photo does not have a season period.

### invalid-supply-line

The request contains a supply line reference that is either deleted, owned by a different organization, contains invalid data or does not exist. See the exception message for more information.

### weeklist-closed

The request contains supply that originates from a closed weeklist, prices and number of pieces can't be changed for this supply.

### gateway-authorizer-error

Access denied due to an authorization error. See the exception message for more information.

### unregistered-batch

The batch is not registered (yet). See the exception message for more information.

### invalid-photos

The photos you entered are invalid. See the exception message for more information.

### file-already-exists

You are trying to add a file to an entity that already has a file.

### incorrect-number-of-pdf-pages

The PDF has an incorrect number of pages.

### invalid-date

The entered date is invalid. See the exception message for more information.

### invalid-sales-order

The request is invalid, e.g. the sales order status is incorrect, the sales order is not accessible for this organization or the sales order does not exist.

### missing-correction-reason

The request does not contain a reason for the correction request.

### missing-customer-order-id

The request is missing a customerOrderId, which is required when creating sales orders specifically for Majo.