# Managed by ECommerceStore.QA. Journey catalog-phone-details v1.
@catalog @smoke
Feature: Browse smartphone details

  Scenario: Open a listed smartphone and verify its details
    Given the smartphone catalog is open
    When I open a listed smartphone
    Then the details match the selected smartphone
    And I can see its specifications
