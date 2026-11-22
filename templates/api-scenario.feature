# Copy this template to features/<service>/ and replace the example values.
# Give each scenario a stable ID and link the producer evidence in the PR.
@api @users @allure.label.epic:Users @allure.label.feature:Customer_profiles
Feature: Customer registration
  A customer can register a profile with separate billing and shipping addresses.

  @allure.label.scenarioId:E2E_Users_Template_01
  Scenario: A valid registration returns the created customer
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
      | Field       | Check  | Expected           |
      | status      | equals | 200                |
      | mediaType   | equals | "application/json" |
      | /id         | uuid   |                    |
      | /externalId | equals | "{{externalId}}"   |
      | /companies  | equals | []                 |
