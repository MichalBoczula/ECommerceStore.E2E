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
