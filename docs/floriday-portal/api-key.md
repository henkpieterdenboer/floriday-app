---
updatedAt: 2025-04-28T11:05:05.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# API key

In addition to client credentials, an application also needs permission from the user to access the data and use the functionalities on his behalf. This permission is granted through the transfer of the API key.

***

<br />

## Generating an API key

To generate an API key, the user must log in to the Floriday application and go to Settings > Apps & Integrations.

Take note that the API keys used for staging environments are not the same as the API keys for the live environments. A seperate API key must be generated per environment.

> 👍 Direct links to the Apps & Integrations page
>
> * [Staging customers](https://customers.staging.floriday.io/settings/apps)
> * [Staging suppliers](https://app.staging.floriday.io/settings/apps)
> * [Live customers](https://customers.floriday.io/settings/apps)
> * [Live suppliers](https://app.floriday.io/settings/apps)

***

<br/>

In here, the end user needs to search for your application, click on it and click on the **Add application** button.

<Image align="center" src="https://files.readme.io/09c0a66-appIntegrations.png" />

<br/>

An API key will then be generated.

<Image align="center" src="https://files.readme.io/6d78d20-appIntegrations2.png" />

***

<br /> 

> 🚧 The API key is only shown once
>
> The user needs to copy the API key and enter it in the application. For security reasons, the API key will only be shown once.
>
> In case the user forgets to copy or loses the API key, they will need to remove and re-add the application in Floriday, in order to acquire a new API key.

<br />

> 📘 1 API key = 1 Organization ID = 1 GLN company code
>
> 1 API key authorizes the combination of 1 organization and 1 application.
>
> 1 organization corresponds to 1 GLN company code.
>
> If an implementation requires access for more than one organization (e.g. sales agent for multiple supplier organizations), an API key needs to be generated for each separate organization.

<br/>
<br/>

![](https://files.readme.io/dd46549-APIv03-Authenticatie_API-key.JPG "APIv03-Authenticatie_API-key.JPG")

<br/>

By using the API key in combination with the JWT-token, the user's data can be accessed.

![](https://files.readme.io/448dee6-APIv03-Authenticatie_ClientCredentials_Data.JPG "APIv03-Authenticatie_ClientCredentials_Data.JPG")

***

<br/>

## Removing an API key

It is possible for a user to deny access to an application at a later stage. This is done by removing the application in Floriday, which in turn invalidates the API-key.

If the user misplaces the API-key or wants to add the application again, the user will need to generate a new API-key.

***

<br/>

## Authorization

The next step is to choose an authorization method with which to gain access to the user's data. There are two authorization methods to choose from:

* The [Oauth2 Client credentials flow](https://developer.floriday.io/docs/client-credentials-flow)
* The [Oauth2 Authorization code with PKCE flow](https://developer.floriday.io/docs/pkce-flow)