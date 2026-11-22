# ECommerceStore.E2E agent instructions

## Authoring a scenario

1. Start from the approved acceptance criterion and the producing service's OpenAPI and BDD evidence. Record the criterion, producer commit and scenario links in the PR.
2. Copy the [API scenario template](templates/api-scenario.feature) into `features/<service>/`. Give the feature a business description and each scenario a stable `@allure.label.scenarioId:...` tag. Use the service, feature and story labels to group related results in Allure.
3. Describe each exchange with the `Description | Method | Path` Gherkin table. Put the request body in a `"""json` document string. The step sends the JSON with `application/json`. A read such as GET has a request row and no body.
4. Express expected outcomes with the `Field | Check | Expected` table. The step asserts every row against the actual response. Add a read after a write when persistence is part of the acceptance criterion. Keep data setup and assertions within the scenario.
5. Reuse the shared API steps. Add service-specific project settings for a new service and keep storefront steps under the Chromium project. Preserve the wording and managed marker for the QA-owned catalog feature.

| Response table column | How it is used |
| --- | --- |
| `Field` | `status` for the HTTP status, `mediaType` for the media type without parameters, or a JSON Pointer such as `/individual/email` or `/errors/0/name` |
| `Check` | `equals` for exact values, `uuid` for an identifier, or `non-empty` for a string containing text |
| `Expected` | A typed JSON literal for `equals`. Quote strings and keep numbers, arrays, booleans and null in JSON form. Leave the cell empty for `uuid` and `non-empty`. |

Each scenario gets a synthetic `{{externalId}}`. Use it in paths and inside JSON strings. The step `I remember response field "/id" as "customerId"` captures a string for later use as `{{customerId}}`. Run scenarios that create profiles against an isolated Users test database and reset it between test runs. Use synthetic customer data and keep credentials, cookies and authorization headers out of report attachments.

## Allure and LiveDocs

Each completed exchange attaches its description, method, path and actual JSON request, followed by the HTTP status, media type and response body. The response step attaches the expected and actual values as a table. Business failures should verify the status, problem code, relevant error entries and `traceId`. Keep the Gherkin, report and request evidence together when handing off a failure.

Run `npm run check` to generate and list the tests. Run `npm run test:users` with `E2E_USERS_API_URL` for a real Users test run. The **Storefront E2E** workflow has a `users-api` choice and an optional `users_api_url` input. Collect `TestResults/allure-results/` from the `users-api-test-results` artifact. Include the actual run and any verification limits in the PR.

A future LiveDocs snapshot can use the committed features and the flat raw Allure results with their attachments, source commit and CI run. The current LiveDocs service bundle also requires OpenAPI, flows and validation exports. Register E2E as a test-report producer when adding its bundle and portal entry. [LiveDocs artifact contract](https://github.com/MichalBoczula/ECommerceStore.LiveDocs/blob/main/docs/artifact-contract.md)

## Complete Users examples

These examples exercise registration and lookup through the public HTTP contract. The validation scenario uses a follow-up GET to check that the rejected profile is absent. The runnable copy is [customer-profiles.feature](features/users/customer-profiles.feature). Keep this example in sync with it.

| E2E scenario | Producer acceptance evidence |
| --- | --- |
| Register and retrieve the profile | [CreateCustomerSuccess](https://github.com/MichalBoczula/ECommerceStoreUsers/blob/a654c3feb41dbb87bf1274743749007761cdf9dc/tests/ECommerceStoreUsers.AcceptanceTests/Features/Customers/CreateCustomerSuccess/CreateCustomerSuccess.feature) · [GetCustomerSuccess](https://github.com/MichalBoczula/ECommerceStoreUsers/blob/a654c3feb41dbb87bf1274743749007761cdf9dc/tests/ECommerceStoreUsers.AcceptanceTests/Features/Customers/GetCustomerSuccess/GetCustomerSuccess.feature) |
| Reject a blank billing city | [CreateCustomerValidationError](https://github.com/MichalBoczula/ECommerceStoreUsers/blob/a654c3feb41dbb87bf1274743749007761cdf9dc/tests/ECommerceStoreUsers.AcceptanceTests/Features/Customers/CreateCustomerValidationError/CreateCustomerValidationError.feature) |
| Look up a missing customer | [GetCustomerNotFound](https://github.com/MichalBoczula/ECommerceStoreUsers/blob/a654c3feb41dbb87bf1274743749007761cdf9dc/tests/ECommerceStoreUsers.AcceptanceTests/Features/Customers/GetCustomerNotFound/GetCustomerNotFound.feature) |

```gherkin
@api @users @allure.label.epic:Users @allure.label.feature:Customer_profiles
Feature: Customer profiles
  A customer can register individual data and retrieve the profile by external identity.
  The API returns a problem when an address is invalid or a profile is missing.

  @allure.label.story:Registration @allure.label.scenarioId:E2E_Users_CreateAndReadCustomer_01
  Scenario: Register a customer and retrieve the same profile by external ID
    Given an API request
      | Description             | Method | Path       |
      | Register a new customer | POST   | /customers |
    And the JSON request body is
      """json
      {
        "externalId": "{{externalId}}",
        "individual": {
          "firstName": "Alex",
          "lastName": "Example",
          "email": "{{externalId}}@example.com",
          "phone": "123456789",
          "billingAddress": {
            "postalCode": "00-001",
            "city": "Warsaw",
            "street": "Example Street",
            "buildingNumber": "10",
            "apartmentNumber": null
          },
          "shippingAddress": {
            "postalCode": "30-001",
            "city": "Krakow",
            "street": "Shipping Street",
            "buildingNumber": "15",
            "apartmentNumber": "25"
          }
        },
        "companies": []
      }
      """
    When I send the API request
    Then the API response matches
      | Field       | Check     | Expected           |
      | status      | equals    | 200                |
      | mediaType   | equals    | "application/json" |
      | /id         | uuid      |                    |
      | /externalId | equals    | "{{externalId}}"   |
      | /updatedAt  | non-empty |                    |
      | /companies  | equals    | []                 |
    And I remember response field "/id" as "customerId"
    Given an API request
      | Description                      | Method | Path                               |
      | Read the stored customer profile | GET    | /customers/external/{{externalId}} |
    When I send the API request
    Then the API response matches
      | Field                                       | Check  | Expected                     |
      | status                                      | equals | 200                          |
      | mediaType                                   | equals | "application/json"           |
      | /id                                         | equals | "{{customerId}}"             |
      | /externalId                                 | equals | "{{externalId}}"             |
      | /individual/firstName                       | equals | "Alex"                       |
      | /individual/lastName                        | equals | "Example"                    |
      | /individual/email                           | equals | "{{externalId}}@example.com" |
      | /individual/phone                           | equals | "123456789"                  |
      | /individual/billingAddress/city             | equals | "Warsaw"                     |
      | /individual/billingAddress/apartmentNumber  | equals | null                         |
      | /individual/shippingAddress/city            | equals | "Krakow"                     |
      | /individual/shippingAddress/apartmentNumber | equals | "25"                         |
      | /companies                                  | equals | []                           |

  @allure.label.story:Registration @allure.label.scenarioId:E2E_Users_RejectMissingBillingCity_01
  Scenario: Reject a registration when the individual billing city is blank
    Given an API request
      | Description                                | Method | Path       |
      | Register a customer without a billing city | POST   | /customers |
    And the JSON request body is
      """json
      {
        "externalId": "{{externalId}}",
        "individual": {
          "firstName": "Alex",
          "lastName": "Example",
          "email": "{{externalId}}@example.com",
          "phone": "123456789",
          "billingAddress": {
            "postalCode": "00-001",
            "city": "",
            "street": "Example Street",
            "buildingNumber": "10",
            "apartmentNumber": null
          },
          "shippingAddress": {
            "postalCode": "30-001",
            "city": "Krakow",
            "street": "Shipping Street",
            "buildingNumber": "15",
            "apartmentNumber": "25"
          }
        },
        "companies": []
      }
      """
    When I send the API request
    Then the API response matches
      | Field              | Check     | Expected                                                                                                   |
      | status             | equals    | 400                                                                                                        |
      | mediaType          | equals    | "application/problem+json"                                                                                 |
      | /status            | equals    | 400                                                                                                        |
      | /code              | equals    | "validation_failed"                                                                                        |
      | /instance          | equals    | "/customers"                                                                                               |
      | /errors            | equals    | [{"name":"AddressCityValidationRule","message":"City cannot be empty or white space.","entity":"Address"}] |
      | /missingProperties | equals    | []                                                                                                         |
      | /traceId           | non-empty |                                                                                                            |
    Given an API request
      | Description                       | Method | Path                               |
      | Look up the rejected registration | GET    | /customers/external/{{externalId}} |
    When I send the API request
    Then the API response matches
      | Field     | Check  | Expected                   |
      | status    | equals | 404                        |
      | mediaType | equals | "application/problem+json" |
      | /code     | equals | "resource_not_found"       |

  @allure.label.story:Customer_lookup @allure.label.scenarioId:E2E_Users_CustomerNotFound_01
  Scenario: Return a problem when the external ID has no customer profile
    Given an API request
      | Description                 | Method | Path                               |
      | Look up an unknown customer | GET    | /customers/external/{{externalId}} |
    When I send the API request
    Then the API response matches
      | Field              | Check     | Expected                             |
      | status             | equals    | 404                                  |
      | mediaType          | equals    | "application/problem+json"           |
      | /status            | equals    | 404                                  |
      | /code              | equals    | "resource_not_found"                 |
      | /title             | equals    | "Resource not found."                |
      | /instance          | equals    | "/customers/external/{{externalId}}" |
      | /errors            | equals    | []                                   |
      | /missingProperties | equals    | []                                   |
      | /traceId           | non-empty |                                      |
```
