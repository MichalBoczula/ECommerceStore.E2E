# ECommerceStore.E2E

JavaScript Gherkin acceptance tests for the ECommerce Store. Playwright runs the storefront journey in Chromium and exercises the Users HTTP API. Both suites record HTML and Allure results.

## Catalog to details

The smoke opens `/list`, reads the ID, name and price of a listed phone, and clicks its details link. It checks the selected ID in `/details/:id`, compares the displayed values, and looks for a populated specifications section. The catalog in the test environment supplies the phone data.

## Run locally

```sh
npm ci
npx playwright install chromium
npm run check
E2E_BASE_URL=http://localhost:4200 npm test
```

Set `E2E_BASE_URL` to the storefront test environment. The `check` command compiles and lists the JavaScript BDD tests. `npm test` runs the browser. Results are under `TestResults/` with screenshots and traces on browser failure.

## Users API

The API suite registers a customer and reads the profile back, rejects an invalid billing address and checks the missing-customer response. The scenarios send their Gherkin JSON and assert the expected response tables. They create synthetic profiles and require an isolated Users database.

```sh
E2E_USERS_API_URL=http://localhost:8080 npm run test:users
```

Use the [authoring guide and complete examples](AGENTS.md) and the [API scenario template](templates/api-scenario.feature) to add tests.

## GitHub Actions and QA

Pull requests compile the scenarios and resolve step bindings. Set the repository variable `E2E_BASE_URL` to a storefront URL reachable by GitHub Actions and backed by a populated catalog. The smoke runs on pull requests from branches in this repository and pushes to `main`. You can also dispatch **Storefront E2E** with a `base_url`.

The `storefront-test-results` artifact contains Allure results and `storefront-evidence.json` after Playwright runs. The manifest records the PR head, actual checkout, feature hash, workflow run and attempt, and Playwright step outcome. Reruns add an `-attempt-N` suffix to preserve the earlier artifact. Pull request run titles include the PR number and head SHA for correlation.

To run Users, dispatch **Storefront E2E**, choose the `users-api` suite and provide `users_api_url` or configure the `E2E_USERS_API_URL` repository variable. The `users-api-test-results` artifact includes `allure-results/` with the request and response JSON and expected-versus-actual tables.

The QA service can publish the catalog feature through a pull request tied to an approved BA handoff. The generated feature uses the checked-in step vocabulary and records the BA run, snapshot, selected criterion and draft hash. Review the criterion and these links in the PR. [QA repository](https://github.com/MichalBoczula/ECommerceStore.QA)
