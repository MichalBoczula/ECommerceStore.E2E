import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import { label } from 'allure-js-commons';
import { createBdd, test as base } from 'playwright-bdd';
import { attachJson } from '../support/evidence.js';

export const test = base.extend({
  api: async ({}, use) => {
    await use({
      request: null,
      response: null,
      variables: new Map([['externalId', `e2e-${randomUUID()}`]]),
    });
  },
});

const { Before, Given, When, Then } = createBdd(test);

Before({ tags: '@api' }, async ({ $tags }) => {
  for (const tag of $tags) {
    const metadata = /^@allure\.label\.(epic|feature|story|scenarioId):(.+)$/.exec(tag);
    if (metadata) {
      await label(metadata[1], metadata[2]);
    }
  }
});

Given('an API request', async ({ api }, table) => {
  const rows = table.hashes();
  const { Description, Method, Path } = rows[0] ?? {};
  if (rows.length !== 1 || !Description?.trim() || !/^(GET|POST|PUT|PATCH|DELETE)$/.test(Method) || !Path?.startsWith('/')) {
    throw new Error('Provide one API request row with Description, Method and a relative Path starting with /.');
  }
  api.request = { description: Description, method: Method, path: resolve(Path, api.variables, encodeURIComponent) };
  api.response = null;
});

Given('the JSON request body is', async ({ api }, body) => {
  api.request.body = JSON.parse(resolveJson(body, api.variables));
});

When('I send the API request', async ({ api, request, baseURL, $testInfo }) => {
  if (!baseURL) {
    throw new Error('Set E2E_USERS_API_URL to an isolated Users API test environment.');
  }
  const target = new URL(api.request.path, baseURL);
  if (target.origin !== new URL(baseURL).origin || target.username || target.password) {
    throw new Error('The request path must stay within the configured API origin.');
  }

  const { description, method, path, body } = api.request;
  await attachJson($testInfo, `${description} - request.json`, { method, path, ...(body === undefined ? {} : { body }) });
  const response = await request.fetch(target.href, {
    method,
    data: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    maxRedirects: 0,
    failOnStatusCode: false,
    timeout: 30_000,
  });
  const status = response.status();
  const mediaType = response.headers()['content-type']?.split(';', 1)[0].trim().toLowerCase() ?? '';
  const rawBody = await response.text();
  await response.dispose();
  let responseBody = rawBody || null;
  try {
    responseBody = JSON.parse(rawBody);
  } catch {
    // Keep the response text as evidence when the server returns non-JSON.
  }
  api.response = { status, mediaType, body: responseBody };
  await attachJson($testInfo, `${description} - response.json`, api.response);
});

Then('the API response matches', async ({ api, $testInfo }, table) => {
  const checks = table.hashes().map(({ Field, Check, Expected }) => ({
    field: Field,
    check: Check,
    expected: Check === 'equals' ? JSON.parse(resolveJson(Expected, api.variables)) : Check,
    actual: responseField(api.response, Field),
  }));
  if (!checks.length) {
    throw new Error('Provide a response table with Field, Check and Expected columns.');
  }
  const rows = checks.map(({ field, check, expected, actual }) => [
    field,
    check,
    JSON.stringify(expected),
    actual === undefined ? '[missing]' : JSON.stringify(actual),
  ].join('\t'));
  await $testInfo.attach(`${api.request.description} - expected and actual.tsv`, {
    body: ['Field\tCheck\tExpected\tActual', ...rows].join('\n'),
    contentType: 'text/tab-separated-values',
  });
  for (const { field, check, expected, actual } of checks) {
    const assertion = expect(actual, field);
    switch (check) {
      case 'equals':
        assertion.toEqual(expected);
        break;
      case 'uuid':
        assertion.toMatch(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
        break;
      case 'non-empty':
        assertion.toMatch(/\S/);
        break;
      default:
        throw new Error(`Unsupported response check: ${check}`);
    }
  }
});

Then('I remember response field {string} as {string}', async ({ api }, field, variable) => {
  const value = responseField(api.response, field);
  expect(value, field).toMatch(/\S/);
  api.variables.set(variable, value);
});

function responseField(response, field) {
  if (field === 'status' || field === 'mediaType') {
    return response[field];
  }
  if (!field?.startsWith('/')) {
    throw new Error('Use status, mediaType or a JSON Pointer starting with / in the response table.');
  }
  return field.slice(1).split('/').reduce((value, segment) => {
    const key = segment.replaceAll('~1', '/').replaceAll('~0', '~');
    return value && typeof value === 'object' && Object.hasOwn(value, key) ? value[key] : undefined;
  }, response.body);
}

function resolve(text, variables, encode) {
  return text.replace(/\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g, (_, variable) => {
    if (!variables.has(variable)) {
      throw new Error(`Unknown test variable: ${variable}`);
    }
    return encode(variables.get(variable));
  });
}

function resolveJson(text, variables) {
  return resolve(text, variables, value => JSON.stringify(value).slice(1, -1));
}
