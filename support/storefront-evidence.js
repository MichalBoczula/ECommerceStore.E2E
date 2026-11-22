import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

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
