# ECommerceStore.E2E

JavaScript Gherkin acceptance tests for the deployed ECommerce Store storefront. Playwright runs the steps in Chromium and records HTML and Allure results.

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

## GitHub Actions and QA

Pull requests compile the scenarios and resolve step bindings. Set the repository variable `E2E_BASE_URL` to run the smoke on pull requests from branches in this repository and pushes to `main`. You can also dispatch **Storefront E2E** with a `base_url`. Reports are retained as the `storefront-test-results` artifact.

The QA service can publish the catalog feature through a pull request tied to an approved BA handoff. The generated feature uses the checked-in step vocabulary and records the BA run, snapshot, selected criterion and draft hash. Review the criterion and these links in the PR. [QA repository](https://github.com/MichalBoczula/ECommerceStore.QA)
