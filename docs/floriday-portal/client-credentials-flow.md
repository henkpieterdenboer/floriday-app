---
updatedAt: 2026-04-16T06:42:26.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# Oauth2 Client credentials flow

Oauth2 Client Credentials flow is the most direct form of authorization. The Client Credentials must be treated confidentially and must not be disclosed to third parties.

## Guidelines

The following guidelines apply:

* The Client Credentials are not accessible by or visible to the user.
* The code is not plainly accessible in a public downloadable binary.
* An API key is required.
* The Client Cedentials consist of two fields:
  * Client ID: XXXXXXXXXXXX
  * Client Secret: XXXXXXXXXXXXXXXXXXXXXXXXX

***

<br />

## JSON web token

After registration, the Client Credentials are provided per application by email.

![](https://files.readme.io/258aaf0-APIv03-Authenticatie_registratie.JPG "APIv03-Authenticatie_registratie.JPG")

<br />

<br />

These Credentials can be exchanged for a JWT (JSON web token), which can then be used to communicate with the APIs. This takes place via the OAuth2 Client Credentials flow. Read more about this in [Okta's documentation](https://developer.okta.com/authentication-guide/implementing-authentication/client-creds#3-using-the-client-credentials-flow).

This JWT is an encrypted JSON message. To inspect the contents and learn more about this token, please visit [www.jwt.io](http://jwt.io).

The URL with which credentials can be exchanged for a JWT is included in the configuration files of the authorization server:

**Staging**: <https://idm.staging.floriday.io/oauth2/ausmw6b47z1BnlHkw0h7/.well-known/oauth-authorization-server>

**Live**: <https://idm.floriday.io/oauth2/aus3testdcf2vyfs70i7>

<br />

> 🚧 Configure token endpoint
>
> Please note that depending on the OAuth library that you use, you have to either:
>
> * Configure the token endpoint directly (<https://idm.floriday.io/oauth2/aus3testdcf2vyfs70i7/v1/token>) or
> * Use the address of the authorization server itself (<https://idm.floriday.io/oauth2/aus3testdcf2vyfs70i7/>)

***

<br />

## Using the JWT-token

The obtained JWT has to be included with every API call in the Authorization HTTP header, preceded by 'Bearer'.

![](https://files.readme.io/b652eb3-APIv03-Authenticatie_ClientCredentials_Token.JPG "APIv03-Authenticatie_ClientCredentials_Token.JPG")

> 👍 Refresh JWT Tokens
>
> JWT Tokens may be reused for multiple calls and should be stored system wide.
>
> We highly recommend reusing JWT Tokens as long as they haven't expired yet and only renew them once they are about to be actively used. This not only allows for a more consistent user experience, it also decreases the load on the Okta servers.
>
> [Read the Okta documentation](https://developer.okta.com/docs/guides/refresh-tokens/main/) for more information.

***

<br />

<br />

<br />

By using the [API key](https://developer.floriday.io/docs/api-key) alongside the JWT-token, the user's data can be accessed.

![](https://files.readme.io/c009b53-APIv03-Authenticatie_ClientCredentials_Data.JPG "APIv03-Authenticatie_ClientCredentials_Data.JPG")

<br />

<br />

The implementation will then look as follows:

![](https://files.readme.io/bfa1cb5-APIv03-Authenticatie_Client_credentials_overview.JPG "APIv03-Authenticatie_Client credentials overview.JPG")

<br />

<br />

More information can be found here: <https://developer.okta.com/docs/guides/implement-client-creds/overview/>

***

<br />

## Validation

By executing the following requests, one can easily validate if the authorization properly works.

First request a token. Replace the *CLIENT\_ID* and *CLIENT\_SECRET* placeholders with your personal values.

```shell
curl --location --request POST 'https://idm.staging.floriday.io/oauth2/ausmw6b47z1BnlHkw0h7/v1/token' \
--header 'Accept: application/json' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'client_id=##CLIENT_ID##' \
--data-urlencode 'client_secret=##CLIENT_SECRET##' \
--data-urlencode 'scope=role:app catalog:read sales-order:write organization:read supply:read supply:write sales-order:read delivery-conditions:read fulfillment:write fulfillment:read'
```

<br />

<br />

With the returned access token try to GET all organization belonging to the account identified by the [API-Key](https://developer.floriday.io/docs/api-key).

#### For suppliers

```shell
curl --location --request GET 'https://api.staging.floriday.io/suppliers-api-{version}/identities' \
--header 'X-Api-Key: ##API_KEY##' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer ##ACCESS_TOKEN##
```

<br />

#### For customers

```shell
curl --location --request GET 'https://api.staging.floriday.io/customers-api-{version}/identities' \
--header 'X-Api-Key: ##API_KEY##' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer ##ACCESS_TOKEN##
```

<br />

If you're not getting a 200 response after these requests, please review your request or contact a Floriday Implementation Consultant.

<br />