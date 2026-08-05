---
updatedAt: 2025-10-22T08:02:34.000Z
---

Fetch the complete documentation index at: https://developer.floriday.io/llms.txt. Use this file to discover all available pages before exploring further.

# How do I connect to Floriday?

This page supplies a step by step explanation on how to connect to Floriday.

> 📘 Read the General Topics first
>
> Before applying for registration, we strongly recommend reading the General Topics first and browsing the Implementation Guides and Business Rules as well. These can be found in the Navigation bar on the left hand side.

## 1. Apply for registration

If you are interested in connecting to Floriday, you can apply for registration by filling in the client application form. For registration see [Register client application](https://www.floriday.io/nl/aanmelden-softwareleverancier).

Once you've submitted your application, one of our implementation consultants will contact you to make an appointment voor a meeting.

***

<br />

## 2. Intake application registration

In an initial meeting the implementation consultant will inform you about the possibilities of the Floriday API and assess your needs. After the assessment you can determine if you want to continue registration and implementation.

***

<br />

## 3. Receive client credentials

After successful registration of your client application and a positive intake, your client application is granted access to the Floriday API staging (test) environment. You will receive client credentials and credentials for access for scenario testing purposes. Based on how you initially plan to use Floriday, credentials and access are granted to either our customer or our supplier application.

***

<br />

## 4. Intake implementation

In follow-up meetings the implementation scope, sequence, planning and launching customer are determined together with our implementation consultants.

**Scope:** What will the users do in the client application and which connections with the Floriday modules are required.\
**Sequence:** In what sequence will the required Floriday modules be connected.
**Planning:** What is the expected implementation timetable.
**Launching customer:** The supplier or customer you wish to first start testing your application with.

Once the implementation scope, sequence, planning and launching customer are determined, the development phase can begin. We will then publish your application and associated modules on the Application overview page in Floriday.

* [Public supplier application overview](https://www.floriday.io/nl/softwareleveranciers-kwekers)
* [Public customers application overview](https://www.floriday.io/nl/softwareleveranciers-kopers)

***

<br />

## 5. Development & Slack support in staging

The Floriday staging environment is available for development & testing of API-connections with (external) applications. The developers of the (external) application can use the credentials received from Floriday Implementation support during the registration process to:

* Access the Supplier and/or Customer API. See [Authorization](https://developer.floriday.io/docs/authorization) and [API key](https://developer.floriday.io/docs/api-key) for more information.
* Access the Supplier and or Customer application with your launching customer account in Floriday for scenario testing purposes.
  * [Login page Suppliers](https://app.staging.floriday.io/login)
  * [Login page Customers](https://customers.staging.floriday.io/login)

For technical implementation support for developers we use Slack channels where you can contact our tech-support:

* Technical implementation support Supplier API: **#suppliers-api-support**
* Technical implementation support Customer API: **#customers-api-support**

<br />

> 📘 Technical implementation support
>
> We have some general rules for the technical implementation support:
>
> 1. We openly welcome developers to post their issues, questions and suggestion regarding the development.
> 2. We use a single channel for all developers so you can learn from each other or indicate that you have the same issue.
> 3. We kindly ask you to refer to our documentation and our channel history first if you have a question regarding the Supplier or Customer ERP-API. With over 100 active developers in this channel, we prefer to focus on new questions.
> 4. For questions or remarks regarding functional implementation scope & planning please refer to your Implementation consultant.

***

<br />

## 6. Testing in Staging

Once the application development tests have been successfully completed, you can contact your implementation consultant for an acceptance test. After a successful test, access will be granted to the live environment for a final Live test. The test criteria are supplied in the implementation guide of the Floriday API-documentation per module.

Depending on the implementation, your implementation consultant determines if additional, different or less test requirements are applicable. Without a Floriday acceptance test, Floriday will not (be able to) provide live support of the implementation and depending on the situation we can decide to revoke access to the API.

<br />

> 📘 Floriday Staging & Live environment
>
> Floriday has two different environments to work in: Staging (test) and Live (production). These environments are completely separated; as such they use different URLS and require different credentials.
>
> Take note that the Staging environment is also used by the Floriday developers for testing purposes.

***

<br />

## 7. Final Live test

Following a successful final staging test, the final live test will take place in consultation with the implementation consultant and the launching customer of the application.

Once the Live test is successfully completed, the application is given access to all its users in the Live environment for the connected modules.

* Technical live support Supplier API: **#suppliers-api-live-issues**
* Technical live support Customer API: **#customers-api-live-issues**

<br />

> 👍 Live per module
>
> If possible we recommend to go live per module for early feedback from your launching customers.

***

<br />

## 8. New releases

Floriday will deploy new releases based on its release process.

Changes are communicated in the release notes:

* [Release notes Supplier API](release-notes-suppliers-api)
* [Release notes Customer API](release-notes-customers-api)