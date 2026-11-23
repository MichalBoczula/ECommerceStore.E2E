import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const featurePath = 'features/catalog/browse-phone-details.feature';
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const testedCommitSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const workflowRunId = Number(process.env.GITHUB_RUN_ID);
const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT);
const playwrightOutcome = process.env.STOREFRONT_OUTCOME;
const pull = event.pull_request;
const sha = /^[a-f0-9]{40}$/;

if (!sha.test(testedCommitSha) || testedCommitSha !== process.env.GITHUB_SHA) {
  throw new Error('The checkout does not match the commit selected by GitHub Actions.');
}
if (!Number.isSafeInteger(workflowRunId) || workflowRunId < 1 || !Number.isSafeInteger(runAttempt) || runAttempt < 1) {
  throw new Error('GitHub Actions did not identify the run and attempt.');
}
if (!['success', 'failure'].includes(playwrightOutcome)) {
  throw new Error('The Playwright step has no completed outcome.');
}
if (pull && (!Number.isSafeInteger(pull.number) || pull.number < 1 || !sha.test(pull.head?.sha ?? ''))) {
  throw new Error('The pull request event did not identify its head revision.');
}

function redactStorefrontUrl() {
  const resultsDir = 'TestResults/allure-results';
  if (!existsSync(resultsDir)) return;

  const baseUrl = process.env.E2E_BASE_URL;
  const url = URL.parse(baseUrl ?? '');
  if (!url) throw new Error('The secret storefront URL is invalid.');
  const variants = [baseUrl, url.href, url.origin, url.hostname].sort((a, b) => b.length - a.length);
  for (const file of readdirSync(resultsDir, { withFileTypes: true })) {
    if (!file.isFile() || !/\.(json|md|txt)$/.test(file.name)) continue;
    const path = join(resultsDir, file.name);
    const content = readFileSync(path, 'utf8');
    const redacted = variants.reduce((value, variant) => value.replaceAll(variant, '[storefront]'), content);
    if (redacted !== content) writeFileSync(path, redacted);
  }
}

if (process.env.E2E_STOREFRONT_PRIVATE === 'true') redactStorefrontUrl();

const evidence = {
  schemaVersion: 1,
  prNumber: pull?.number ?? null,
  prHeadSha: pull?.head.sha ?? null,
  testedCommitSha,
  featureSha256: createHash('sha256').update(readFileSync(featurePath)).digest('hex'),
  workflowRunId,
  runAttempt,
  playwrightOutcome,
};
mkdirSync('TestResults', { recursive: true });
writeFileSync('TestResults/storefront-evidence.json', JSON.stringify(evidence, null, 2) + '\n');
