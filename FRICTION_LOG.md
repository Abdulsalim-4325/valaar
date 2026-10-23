# V.A.L.A.A.R. — Complete Development Friction Log

**Project:** V.A.L.A.A.R. — Personal AI Command Center / Agentic Workflow Orchestrator  
**Repository:** `Abdulsalim-4325/valaar`  
**Development environment:** WSL 2 / Ubuntu, VS Code, Python, FastAPI, React, TypeScript, Vite, PostgreSQL, MCP, Amazon Bedrock  
**AI model targeted:** Anthropic Claude Sonnet 4.5 through Amazon Bedrock  
**Log purpose:** Document real development friction, debugging decisions, workarounds, verification results, and actionable improvements throughout the project.

> **Documentation note:** This log is reconstructed from the development notes, terminal outputs, errors, and verification results recorded during the project. Severity reflects the impact on development or the deliverable, not a security vulnerability score. Where an exact first-occurrence timestamp or root cause was not established, the entry explicitly says so.

## 1. Executive summary

V.A.L.A.A.R. was developed as a personal AI command center intended to combine task management, an AI assistant, and tool-based workflows behind a web interface and backend services.

The core application progressed beyond initial setup: the FastAPI service, PostgreSQL-backed task management, React frontend, and MCP task tools were implemented and manually exercised. Frontend build and lint checks passed, and task operations were verified through REST and MCP testing.

The most significant external integration friction occurred during the Amazon Bedrock and Anthropic Claude Sonnet 4.5 setup. The development process encountered an incomplete Anthropic use-case submission, an AWS Marketplace authorization error, and then a daily-token throttling error. The global inference profile was confirmed active, but a small inference request still failed with the daily-token error. Consequently, a successful Claude response has **not** been verified.

The principal lesson is that successful infrastructure configuration, model-profile availability, IAM policy attachment, and application code compilation are separate milestones. None should be treated as proof that end-to-end AI inference works.

### Final state represented by this log

| Area | Evidence-based status |
|---|---|
| FastAPI backend | Implemented; health and readiness endpoints returned HTTP 200 |
| PostgreSQL | Connected in the development environment; readiness reported database `valaar` |
| REST task management | CRUD operations manually verified |
| React frontend | Build and lint passed; user reported task persistence after refresh |
| MCP server | Initialization, tool discovery, and task CRUD test passed |
| Bedrock profile | Global Claude Sonnet 4.5 profile reported `ACTIVE` |
| Claude inference | **Blocked / unverified:** daily-token `ThrottlingException` |
| Frontend AI chat | Integration and complete end-to-end behavior not yet verified |
| Automated backend test suite | Comprehensive suite not established during this workflow |
| Direct Alexa+ connection | Not verified |
| Submission-ready documentation | This friction log is a reconstructed development record; README and final submission checks remain separate deliverables |

---

## 2. Severity scale

- **Critical:** Prevents the core deliverable from functioning or being demonstrated.
- **High:** Blocks a major feature or consumes substantial development time.
- **Medium:** Blocks a workflow or causes significant rework, but a workaround exists.
- **Low:** Limited disruption, mostly affecting developer experience or documentation.
- **Informational:** A lesson, limitation, or improvement opportunity without a demonstrated failure.

Severity may change as the project evolves. An issue marked unresolved is not considered fixed merely because a workaround exists.

---

# Phase I — Project setup and environment

## FR-01 — Aligning the development environment with the intended stack

**Task attempted:** Establish a working local development environment for the V.A.L.A.A.R. backend and frontend.

**Steps taken:**
1. Used WSL 2 with Ubuntu as the Linux development environment.
2. Worked from the project directory under the existing Git backup workspace.
3. Used Python virtual-environment tooling for backend dependencies.
4. Used npm for frontend development and validation.
5. Identified the required services and their local endpoints.

**Expected vs. actual:** The expected result was a repeatable local environment where backend, database, frontend, and AI services could be developed and tested independently. The actual environment required several configuration and dependency checks, and not every dependency was available or configured at the beginning.

**Severity:** Medium.

**Workaround:** Validate each component independently and use the existing virtual environment and project-specific commands rather than assuming the entire stack is ready because one service starts.

**Actionable suggestion:** Provide a documented bootstrap script or Makefile with separate commands for installing backend dependencies, installing frontend dependencies, checking configuration, running services, and executing tests. Include minimum supported versions and a clean-install validation step.

**Status:** Partially resolved. The development stack was operational enough to test the core features; a clean-room installation was not verified.

## FR-02 — Docker Desktop and WSL integration was unavailable

**Task attempted:** Use Docker-based tooling from the Ubuntu development environment.

**Steps taken:**
1. Checked Docker availability in WSL.
2. Ran the `docker` command from the Ubuntu shell.
3. Observed that the command was not found, despite Docker having been installed or available on the Windows side previously.

**Expected vs. actual:** The expectation was that Docker commands would be accessible inside WSL. The actual result was `docker: command not found` in the active Linux distribution.

**Severity:** Medium.

**Workaround:** Continue with local development and direct service execution where possible rather than making Docker a prerequisite for every task.

**Actionable suggestion:** Document the required Docker Desktop WSL integration settings, confirm the correct Ubuntu distribution is enabled, and add a preflight check. Do not make Docker an undocumented requirement if the current development path can run without it.

**Status:** Unresolved in the last recorded environment notes. Docker availability inside the active WSL distribution must be verified before claiming containerized deployment works.

## FR-03 — Node.js tooling was not consistently available in the shell

**Task attempted:** Prepare the frontend toolchain.

**Steps taken:** Checked available commands and package tooling while setting up the project.

**Expected vs. actual:** Node.js was initially reported unavailable, while npm was present in the recorded environment. This indicated an inconsistent or incomplete command-line toolchain.

**Severity:** Medium.

**Workaround:** Use the working package manager only after confirming the required runtime is available, and validate the frontend build rather than assuming that npm's presence proves a complete Node.js setup.

**Actionable suggestion:** Add a preflight check for both `node --version` and `npm --version`; document a supported Node.js LTS version and use a version manager or reproducible development environment.

**Status:** The frontend was subsequently built and linted successfully. A reproducible clean installation of the original toolchain was not verified.

## FR-04 — Python runtime and dependency compatibility needed explicit validation

**Task attempted:** Run the FastAPI and MCP application in the Python environment.

**Steps taken:**
1. Used a dedicated backend virtual environment.
2. Installed and used the project's Python dependencies.
3. Compiled the application source with `python -m compileall -q backend/app`.
4. Added `boto3` to the declared backend requirements when implementing the Bedrock service.

**Expected vs. actual:** The expectation was that installing the declared requirements would provide all imports needed to start the application. The implementation required an explicit dependency update for the AWS SDK, and source compilation alone did not prove that all runtime integrations would work.

**Severity:** Medium.

**Workaround:** Add dependencies to `backend/requirements.txt` as they become actual application requirements and run targeted smoke tests after installation.

**Actionable suggestion:** Pin compatible dependency ranges, test installation in a fresh virtual environment, and add automated tests for application startup, route registration, database connectivity, and external service error handling.

**Status:** Core source compilation passed after the Bedrock changes. A complete clean-install test was not recorded.

---

# Phase II — Configuration and application foundations

## FR-05 — Environment template did not match the actual database stack

**Task attempted:** Make local setup configuration consistent with the implemented backend.

**Steps taken:**
1. Compared the environment template with the application’s actual database configuration.
2. Found SQLite/aiosqlite-style defaults in the template even though the working stack used PostgreSQL with `asyncpg`.
3. Corrected the template to use a PostgreSQL asynchronous connection URL.
4. Corrected the development CORS origin to match the Vite frontend on port `5173`.

**Expected vs. actual:** A new developer following the template should be able to configure the intended database and frontend origin. The original template risked directing them toward a database driver and port that did not match the implementation.

**Severity:** High for fresh setup; Medium for the existing local environment.

**Workaround:** Correct the example configuration and use the actual development environment values locally.

**Actionable suggestion:** Keep the environment template synchronized with the settings class and dependency manifest. Add a configuration validation command that detects unsupported database drivers and mismatched development origins.

**Status:** Corrected in the tracked template. A clean installation using only the documented template was not verified.

## FR-06 — Local secrets needed to remain separate from tracked source

**Task attempted:** Configure the application and AWS credentials without exposing secrets in the public repository.

**Steps taken:**
1. Used local environment files for development configuration.
2. Kept the real application environment separate from the example template.
3. Checked Git's tracked-file list for `.env`-style files.
4. Confirmed the tracked environment file was the safe backend example template rather than the real credentials file.
5. Used a local AWS CLI-style credentials profile for Boto3 without printing the secret key.

**Expected vs. actual:** Real database passwords and AWS credentials should remain local. The recorded checks showed the tracked environment template rather than the real `.env` file.

**Severity:** High because accidental credential publication can compromise the project and AWS account.

**Workaround:** Keep actual environment files ignored by Git, commit placeholders only, and inspect staged files before pushing.

**Actionable suggestion:** Use a comprehensive `.gitignore`, add a secret scanner to the repository workflow, review the full staged diff before each commit, and rotate any credential that is accidentally exposed. Do not rely on `.gitignore` alone to protect a file already tracked by Git.

**Status:** The tracked-file check was satisfactory at the time it was run. A complete secret scan of every historical Git revision was not established by that check.

## FR-07 — Database connectivity needed a readiness check, not just a running server

**Task attempted:** Verify that the backend could reach its configured PostgreSQL database.

**Steps taken:**
1. Implemented and exercised health and readiness endpoints.
2. Checked `/api/v1/health`.
3. Checked `/api/v1/ready`, which reported the database as ready.

**Expected vs. actual:** A successful HTTP response from the health endpoint alone would only show that the application responds. The readiness endpoint also reported successful database connectivity.

**Severity:** Medium.

**Workaround:** Use separate liveness and readiness checks to distinguish an application process that is running from one whose database dependency is available.

**Actionable suggestion:** Keep liveness checks lightweight, use readiness checks for critical dependencies, and ensure that public responses expose only necessary operational information.

**Status:** Both health and readiness returned HTTP 200 in the recorded checks.

**Additional improvement identified:** The readiness response included the database username. Consider removing that detail from production-facing responses and keeping diagnostic information in protected logs.

---

# Phase III — React frontend development

## FR-08 — React Hooks lint rule rejected synchronous state updates in an effect

**Task attempted:** Load the initial task list when the frontend mounts.

**Steps taken:**
1. Called `loadTasks()` directly from a `useEffect`.
2. Ran the frontend lint checks.
3. Encountered the `react-hooks/set-state-in-effect` lint rule.
4. Changed the initial effect to schedule `loadTasks()` using `window.setTimeout(..., 0)`.
5. Added cleanup to clear the scheduled timeout when the component unmounts.
6. Re-ran the frontend build and lint checks.

**Expected vs. actual:** The direct effect was intended to load the task list on startup. The actual result was a lint failure even though the intent was a normal initial data fetch. The deferred call passed the checks.

**Severity:** Medium.

**Workaround used:**

```tsx
useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    void loadTasks();
  }, 0);

  return () => window.clearTimeout(timeoutId);
}, [loadTasks]);
```

**Actionable suggestion:** Review the current React Hooks lint guidance and consider a data-fetching abstraction or a clearer effect design. Retain the workaround only if its lifecycle behavior is understood and tested; do not treat a passing lint result as proof of ideal architecture.

**Status:** Build and lint passed with the workaround. The implementation remains a pragmatic solution that may merit architectural refinement.

## FR-09 — API errors needed to be surfaced instead of silently treated as successful requests

**Task attempted:** Connect the frontend to the backend's task endpoints.

**Steps taken:**
1. Centralized HTTP requests in the frontend API service.
2. Added handling for fetch/network errors.
3. Added handling for non-success HTTP status codes.
4. Added task methods for list, create, update, and delete.
5. Exposed a health-check method to the UI.

**Expected vs. actual:** The UI should distinguish an unreachable backend from an unsuccessful API request. Centralized request handling made these failures easier to surface consistently.

**Severity:** Medium.

**Workaround:** Reuse a single API request helper instead of duplicating fetch/error logic across task components.

**Actionable suggestion:** Add typed error handling, test network failures and HTTP errors, and avoid showing raw internal server responses to users in production.

**Status:** The API helper and task operations were implemented. Exhaustive automated error-path coverage was not recorded.

## FR-10 — Task persistence needed to be verified across refreshes

**Task attempted:** Confirm that frontend task operations were backed by persistent storage rather than only local UI state.

**Steps taken:**
1. Created a temporary task in the UI.
2. Changed its status.
3. Refreshed the page.
4. Confirmed the updated state persisted, according to the recorded manual verification.
5. Deleted the temporary task through the UI.

**Expected vs. actual:** The task should remain updated after a page refresh because the state is stored by the backend. The user reported that the update persisted and deletion worked.

**Severity:** High if persistence failed; no failure was observed in the recorded verification.

**Workaround:** Verify persistence using a browser refresh and the backend API rather than relying only on the visible state immediately after a click.

**Actionable suggestion:** Convert this workflow into an automated integration test that creates a task, retrieves it, updates it, retrieves it again, deletes it, and verifies that it is no longer found.

**Status:** Manually verified by the user; automated regression coverage remains a follow-up.

---

# Phase IV — REST API and MCP integration

## FR-11 — REST CRUD needed end-to-end verification

**Task attempted:** Verify the backend task-management lifecycle.

**Steps taken:**
1. Checked the health and readiness endpoints.
2. Created a temporary task.
3. Read and updated the task.
4. Checked task-list behavior.
5. Deleted the temporary task.
6. Confirmed that a subsequent GET returned HTTP 404 for deleted task IDs.
7. Repeated a cleanup workflow for temporary tasks.

**Expected vs. actual:** Every operation should produce a consistent result in the API and database. The recorded workflow verified the lifecycle for temporary task IDs 5 and 8, including their deletion.

**Severity:** High for the core task-management feature.

**Workaround:** Use temporary records and verify deletion independently rather than assuming a successful DELETE response proves the item is gone.

**Actionable suggestion:** Add API tests for success cases, missing IDs, invalid input, and persistence. Use unique test data and cleanup fixtures to prevent test records from accumulating.

**Status:** Manual REST CRUD verification passed.

**Cleanup caveat:** Cleanup of temporary task ID 6 was attempted but not verified. Its deletion must not be claimed as successful.

## FR-12 — MCP client import name did not match the installed SDK

**Task attempted:** Test the MCP server using the Python MCP client.

**Steps taken:**
1. Wrote a test harness using a Streamable HTTP client.
2. Attempted to import `streamablehttp_client`.
3. Encountered a mismatch with the installed SDK's exported name.
4. Changed the import to `streamable_http_client`.
5. Re-ran the harness.

**Expected vs. actual:** The initial test harness was expected to import the client helper, but the SDK used a different spelling with an underscore between `streamable` and `http`.

**Severity:** Medium.

**Workaround:** Use the actual helper name exported by the installed SDK.

**Actionable suggestion:** Pin the MCP SDK version and include a minimal initialization smoke test in the repository. Confirm imports against the installed package rather than copying names from examples targeting a different version.

**Status:** Corrected.

## FR-13 — MCP client context manager returned a different number of values than expected

**Task attempted:** Establish a client session to exercise MCP tools.

**Steps taken:**
1. Wrote the test harness assuming the context manager yielded three values.
2. Observed that the installed client yielded two values.
3. Updated the unpacking logic to match the actual API.

**Expected vs. actual:** The test harness expected a three-value return; the actual SDK API yielded two.

**Severity:** Medium.

**Workaround:** Match the test harness to the installed SDK's return contract.

**Actionable suggestion:** Keep a minimal, version-compatible MCP client example in the repository and test initialization separately before building a larger integration harness.

**Status:** Corrected.

## FR-14 — MCP initialization response field differed from the assumed name

**Task attempted:** Read server metadata from the MCP initialization result.

**Steps taken:**
1. Wrote the harness expecting a `serverInfo` property.
2. Encountered a property mismatch.
3. Changed the harness to use `server_info`, as exposed by the installed SDK.

**Expected vs. actual:** The harness assumed a field naming convention that did not match the Python SDK's returned object.

**Severity:** Low to Medium.

**Workaround:** Read the actual SDK response object and use the correct Python field name.

**Actionable suggestion:** Avoid assuming that JSON protocol field names map directly to Python object properties. Document the installed SDK version and add a test for initialization metadata.

**Status:** Corrected.

## FR-15 — MCP tool output required additional parsing

**Task attempted:** Read task results returned by MCP tools in the test harness.

**Steps taken:**
1. Called task tools through the MCP client.
2. Initially expected the result in a directly structured form.
3. Observed JSON content nested inside a string in the tool result.
4. Adjusted the harness to parse the returned content correctly.

**Expected vs. actual:** The harness expected a direct object, but the result representation required another parsing step.

**Severity:** Medium.

**Workaround:** Parse the actual returned content according to the MCP SDK's content/result structure rather than assuming a specific serialization.

**Actionable suggestion:** Add a typed helper for decoding tool results and validate both successful and error responses. Keep protocol-level response handling separate from application-level task logic.

**Status:** Corrected in the test harness.

## FR-16 — MCP validation was easy to overinterpret as full assistant integration

**Task attempted:** Validate the MCP server and its tools.

**Steps taken:**
1. Initialized an MCP client session.
2. Discovered the available tools.
3. Exercised task creation, listing, updating, and deletion through MCP.
4. Confirmed that the MCP test workflow passed.

**Expected vs. actual:** The expected milestone was a working MCP server. The actual result supports that the server and its tools work through the tested client, but it does not establish that an external Alexa+ service is connected or that Claude autonomously invokes these tools.

**Severity:** High if the distinction is missed in a judging demo or README.

**Workaround:** Describe MCP as implemented and tested at the protocol/tool level, and describe Alexa+ connectivity or model-driven tool invocation as unverified unless a separate end-to-end test succeeds.

**Actionable suggestion:** Create a dedicated end-to-end test that proves the complete chain: user request → model reasoning/tool selection → MCP invocation → database change → user-visible result. Record exactly which external services are included.

**Status:** MCP server/tool validation passed; direct Alexa+ integration remains unverified.

---

# Phase V — Amazon Bedrock and Anthropic Claude Sonnet 4.5

This phase produced the most consequential unresolved integration blocker. The following entries are deliberately separate because each error represented a different stage of setup.

## FR-17 — Initial Claude inference failed because Anthropic use-case details were missing

**Task attempted:** Invoke Claude Sonnet 4.5 through Amazon Bedrock.

**Steps taken:**
1. Selected the Claude Sonnet 4.5 model in the Bedrock console.
2. Configured the intended AWS region as `us-east-1`.
3. Attempted model inference.
4. Received a `ResourceNotFoundException` explaining that model use-case details had not been submitted.
5. Opened the model details and submitted the Anthropic use-case form.
6. The console confirmed submission, but an immediate retry indicated that additional waiting time was needed.

**Expected vs. actual:** A model that appeared in the catalog was expected to be invokable. The actual result showed that catalog visibility did not mean all provider-specific prerequisites were complete.

**Severity:** High.

**Workaround used:** Submitted the required use-case details and paused the assumption that the model would become available immediately.

**Actionable suggestion:** Add a preflight checklist for provider-specific use-case submission, model access status, region, account permissions, and inference profile selection. After submission, wait for access propagation and test only once before investigating the next error.

**Status:** The use-case form was submitted. Successful inference was not established by that submission.

## FR-18 — Marketplace authorization error blocked an inference attempt

**Task attempted:** Continue Claude inference after submitting the Anthropic use-case form.

**Steps taken:**
1. Retried model inference.
2. Received an `AccessDeniedException` referring to the actions `aws-marketplace:ViewSubscriptions` and `aws-marketplace:Subscribe`.
3. Inspected the IAM user’s attached policies.
4. Reviewed the inference policy and Marketplace policy.
5. Added or confirmed a task-specific policy permitting the relevant Marketplace actions.
6. Inspected the Marketplace console, which subsequently showed an active agreement for Claude Sonnet 4.5.

**Expected vs. actual:** The attached policy was expected to permit the required actions. The actual error indicated that the request was still denied at that point. The later Marketplace console state showed an active agreement, but that did not by itself prove that all inference prerequisites or effective IAM permissions were correct.

**Severity:** High.

**Workaround used:** Investigated the Marketplace agreement and IAM policy state instead of granting broad administrator permissions.

**Actionable suggestion:**
- Check the exact denied action, resource, principal, and region in the error or CloudTrail.
- Check for permission boundaries, organization service control policies, explicit denies, and policy propagation.
- Separate permission to subscribe to a model from permission to invoke it.
- Avoid repeatedly subscribing when an active agreement is already shown.

**Status:** The Marketplace console later showed an active agreement. The original authorization error was not the last observed failure, and its complete underlying cause was not conclusively established.

**Security lesson:** Do not use broad `AdministratorAccess` as a shortcut for debugging model access. Use least-privilege policies and verify the exact denied action.

## FR-19 — Marketplace product status did not establish working inference

**Task attempted:** Determine whether Claude Sonnet 4.5 was fully configured after the Marketplace error.

**Steps taken:**
1. Opened the Marketplace listing for Claude Sonnet 4.5.
2. Observed an active agreement and a deployed-on-AWS status.
3. Observed that the console also displayed account setup links and a license-view permission warning.
4. Avoided treating those indicators alone as proof that the Bedrock Runtime API would succeed.

**Expected vs. actual:** An active agreement was expected to resolve the Marketplace-related blocker. The actual state confirmed an agreement but did not guarantee that the runtime request had sufficient quota or permissions.

**Severity:** Medium.

**Workaround used:** Returned to runtime error evidence rather than repeatedly changing Marketplace settings.

**Actionable suggestion:** Treat model catalog status, Marketplace agreement status, model access, IAM authorization, quotas, and successful inference as separate checklist items. Record an explicit successful runtime response as the completion criterion.

**Status:** Agreement reported active; inference remained unsuccessful.

## FR-20 — AWS CLI was absent from the active WSL environment

**Task attempted:** Use AWS command-line tooling for model configuration and diagnostics.

**Steps taken:**
1. Checked command availability in WSL.
2. Found that the AWS CLI was not available in the active shell.
3. Used Boto3, already installed in the backend virtual environment, for AWS API calls.
4. Added `boto3` to the backend requirements because the application now uses it.

**Expected vs. actual:** The initial diagnostic workflow could have used the AWS CLI, but it was not available in the active environment.

**Severity:** Medium.

**Workaround used:** Used Boto3 for metadata and runtime requests rather than delaying all AWS work until CLI installation.

**Actionable suggestion:** Document whether the AWS CLI is optional or required. If required, provide supported installation instructions and a safe verification command such as `aws sts get-caller-identity`. Never print access keys in troubleshooting output.

**Status:** Boto3-based access worked for the STS identity check and Bedrock metadata calls. AWS CLI availability inside WSL was not verified later.

## FR-21 — Local AWS profile setup required explicit credential handling

**Task attempted:** Authenticate local code to AWS without embedding credentials in the repository.

**Steps taken:**
1. Created an IAM access key for local development.
2. Configured a local profile named `valaar`.
3. Set the intended default region to `us-east-1`.
4. Used the profile with Boto3.
5. Verified the identity using STS.

**Expected vs. actual:** Local code needed a reliable credential source. The profile provided one, and the identity check succeeded.

**Severity:** High due to the risk of credential leakage or excessive permissions.

**Workaround used:** Kept credentials in the local AWS credentials configuration instead of hardcoding them in source.

**Actionable suggestion:** Use a short-lived or federated credential mechanism where practical, restrict the IAM user's permissions to the project’s actual needs, protect the local credentials file, and rotate/revoke unused access keys. Do not commit credential files or share their contents.

**Status:** The local profile was usable for AWS API calls. A full least-privilege audit and key-rotation plan remain follow-ups.

## FR-22 — The initial Bedrock model ID did not resolve to a usable inference path

**Task attempted:** Invoke Claude Sonnet 4.5 with the initial US inference-profile identifier.

**Steps taken:**
1. Configured the backend to use `us.anthropic.claude-sonnet-4-5-20250929-v1:0`.
2. Implemented the Bedrock Runtime service using Boto3's `converse` API.
3. Encountered provider/account access errors and later a daily-token throttling error.
4. Investigated the availability of a global inference profile instead of continuing to repeat the same invocation.

**Expected vs. actual:** The configured model ID was expected to support a successful request after access setup. The actual outcome was unsuccessful inference.

**Severity:** High.

**Workaround used:** Queried the global profile's metadata before switching the backend default.

**Actionable suggestion:** Validate the exact model or inference-profile identifier against the account and region. Keep model ID and region configurable, and run a minimal inference smoke test only after access and quota checks.

**Status:** The initial profile was not proven operational.

## FR-23 — Daily token throttling persisted despite the active global inference profile

**Task attempted:** Find a viable Claude Sonnet 4.5 inference path through the global profile.

**Steps taken:**
1. Queried the global profile identifier `global.anthropic.claude-sonnet-4-5-20250929-v1:0` in `us-east-1`.
2. Received a profile status of `ACTIVE`.
3. Changed the backend default model ID to the global profile.
4. Issued a single small test prompt asking for the exact text `VALAAR_MODEL_OK`, with `maxTokens` set to 20.
5. Received the same daily-token error.

**Expected vs. actual:** An active global profile was expected to provide a viable inference route. The actual request failed with:

`ThrottlingException: Too many tokens per day, please wait before trying again.`

**Severity:** Critical for a deliverable that requires a functioning live Claude response.

**Workaround used:** Stopped further inference attempts to avoid repeated failures and potentially unnecessary charges. Continued with the application and documentation work that does not depend on a successful model response.

**Actionable suggestion:**
1. Check the applicable model invocation and token quotas for the exact account, profile, and region.
2. Check whether the limit is a daily quota, account-level restriction, model-specific quota, or another service-side enforcement condition.
3. Confirm the reset window and any required quota adjustment through the AWS console or an authorized administrator.
4. Retry only after evidence that the blocking condition has cleared.
5. If the deadline arrives first, demonstrate the application honestly with the AI service marked unavailable rather than fabricating a model response.

**Status:** **Unresolved.** The profile is active, but successful Claude inference has not been verified.

**Important conclusion:** Switching from the US profile to the global profile did not resolve the observed daily-token error. The log does not claim that the exact quota root cause is known.

## FR-24 — Service Quotas API access was missing

**Task attempted:** Retrieve the exact Bedrock daily-token quota programmatically.

**Steps taken:**
1. Created a Boto3 Service Quotas client in `us-east-1`.
2. Attempted to list Bedrock service quotas.
3. Received an access-denied response indicating the IAM user lacked `servicequotas:ListServiceQuotas`.
4. Reviewed the quota information available through the AWS console.
5. Found multiple cross-region Claude Sonnet 4.5 quota rows, including some with applied values of zero.
6. Did not identify the exact daily-token quota responsible for the runtime error.

**Expected vs. actual:** The API call was expected to return the quota rows. It was denied because the required read permission was not granted.

**Severity:** Medium to High because the missing diagnostic permission delayed resolution of the critical inference blocker.

**Workaround used:** Used the console's Service Quotas listing and continued without adding permissions blindly.

**Actionable suggestion:** If programmatic quota inspection is needed, grant only the necessary read-only Service Quotas permissions through an authorized administrator. Alternatively, use the console. Do not add a permission simply to make the error disappear unless the associated diagnostic action is actually needed.

**Status:** Unresolved. The precise daily-token limit remained unidentified.

## FR-25 — Quota names and inference-profile destinations were easy to misinterpret

**Task attempted:** Determine whether the visible quota values or profile metadata explained the throttling error.

**Steps taken:**
1. Reviewed the console’s Claude Sonnet 4.5 quota rows.
2. Saw several cross-region requests-per-minute and tokens-per-minute quotas with applied values of zero.
3. Noted that the console list also contained a separate daily-token quota for the 1M-context profile.
4. Queried the global profile and attempted to print its destination information.
5. The initial script printed `0` for the destination fields because it extracted the wrong part of the returned ARN.

**Expected vs. actual:** The intention was to display the destination regions clearly. The script instead printed the trailing ARN component, which was `0`; that output did not identify the actual region.

**Severity:** Medium.

**Workaround used:** Avoided treating the printed `0` as evidence that the destination region itself was zero or unavailable.

**Actionable suggestion:** Parse and display the complete model ARN, or extract its AWS region using the documented ARN structure. Keep quota names and dimensions intact when comparing quota entries; similarly named limits may refer to different inference paths or context windows.

**Status:** The global profile was confirmed active. The printed destination output was not sufficient to establish its actual destination regions.

## FR-26 — Region switching was considered but not assumed to be a fix

**Task attempted:** Determine whether another AWS region might offer a working Claude Sonnet 4.5 path.

**Steps taken:**
1. Investigated the possibility of using Asia Pacific (Sydney) instead of `us-east-1`.
2. Noted that the Sydney console view did not expose the expected model-invocation quota in the location being checked.
3. Recognized that model availability, inference-profile routing, and quotas are region- and profile-dependent.
4. Did not treat a region switch as a verified fix.

**Expected vs. actual:** The expectation was that an alternate region might avoid the current blocker. The actual available evidence was insufficient to establish that Sydney would support the required profile with usable quota.

**Severity:** Medium.

**Workaround used:** Kept the known active global profile configuration and stopped repeated inference tests while the quota issue remained.

**Actionable suggestion:** Before switching regions, verify model availability, supported inference profiles, effective quota, required permissions, and the region from which the application will invoke the model. Do not assume that a different region has additional capacity.

**Status:** No alternate-region inference success was established.

## FR-27 — Bedrock service code compiled, but the live provider path remained unverified

**Task attempted:** Implement a backend abstraction for Claude responses.

**Steps taken:**
1. Added `backend/app/ai/bedrock.py`.
2. Used Boto3's `bedrock-runtime` client and the `converse` API.
3. Wrapped the synchronous SDK invocation in `asyncio.to_thread` to avoid blocking the async FastAPI event loop.
4. Added handling for `BotoCoreError` and `ClientError`.
5. Added a chat route that returns a `503` response when the service raises `BedrockUnavailable`.
6. Added `boto3` to the requirements.
7. Compiled the backend source successfully.

**Expected vs. actual:** The implementation was expected to provide an asynchronous HTTP-facing abstraction around the Bedrock call. Source compilation passed, but real provider inference continued to fail due to throttling.

**Severity:** High.

**Workaround used:** Kept provider errors behind a service-level exception and returned a user-facing unavailable response rather than exposing the full AWS exception.

**Actionable suggestion:**
- Add automated tests for successful provider responses using a mock client.
- Test the exact HTTP behavior for provider failures and throttling.
- Use structured logging rather than `print`.
- Add timeouts and carefully bounded retries only for errors that can reasonably recover; do not repeatedly retry a daily quota exhaustion error.
- Avoid logging request contents or credentials.
- Verify the endpoint with a real successful provider response before declaring the AI integration complete.

**Status:** Source compilation passed. Successful inference through the service and chat route remains unverified.

## FR-28 — AI integration introduced configuration and error-handling requirements beyond model access

**Task attempted:** Make the Bedrock service configurable and safe to expose through the backend.

**Steps taken:**
1. Added `bedrock_region` and `bedrock_model_id` to application settings.
2. Changed the default model ID to the global inference profile.
3. Used `AWS_PROFILE` in the Bedrock service when present.
4. Kept AWS access keys outside the source code.
5. Added request validation for chat messages, including a maximum message length.
6. Returned a service-unavailable response when `BedrockUnavailable` was raised.

**Expected vs. actual:** The route and service structure should allow configuration to be changed without hardcoding a model into every call. However, the service's successful response path and frontend integration were not verified against a live working model.

**Severity:** High.

**Workaround used:** Kept configuration centralized and returned a controlled unavailable response for known AWS SDK failures.

**Actionable suggestion:** Test settings precedence carefully, including local `.env`, process environment variables, and default values. Verify that the backend process uses the intended AWS profile, and add tests for blank messages, oversized messages, provider errors, and success responses.

**Status:** Configuration and source structure implemented; complete live end-to-end behavior not verified.

---

# Phase VI — Repository quality, validation, and delivery

## FR-29 — Passing compilation did not prove external service success

**Task attempted:** Validate the backend after adding the Bedrock service and chat route.

**Steps taken:**
1. Ran Python compilation checks.
2. Ran frontend build and lint checks.
3. Ran Git whitespace/diff validation.
4. Separately exercised the real Bedrock Runtime API.
5. Recorded the runtime throttling failure independently of compilation results.

**Expected vs. actual:** Compilation and static checks should catch syntax and some code-quality problems. The actual results demonstrated that those checks could pass while an external dependency still blocked the user-facing feature.

**Severity:** High if validation results are presented without their scope.

**Workaround used:** Reported static validation and provider inference as separate statuses.

**Actionable suggestion:** Use a layered test strategy:
1. Static analysis and compilation.
2. Unit tests with mocked external services.
3. Database integration tests.
4. MCP protocol tests.
5. Live external-service smoke tests.
6. Browser-based end-to-end tests.

Each layer should have an explicit pass/fail result.

**Status:** Static and several manual integration checks passed; the live Bedrock smoke test failed.

## FR-30 — Repository documentation needed to distinguish implemented features from intended capabilities

**Task attempted:** Prepare V.A.L.A.A.R. for review and judging.

**Steps taken:** Consolidated the implemented architecture, test results, AWS troubleshooting history, and unresolved integration issues into a single chronological development record.

**Expected vs. actual:** Documentation should help reviewers reproduce the project and understand the work without overstating its capabilities. The project's intended agentic architecture is broader than the features whose end-to-end behavior has been verified.

**Severity:** High for judging credibility and reproducibility.

**Workaround used:** Explicitly labeled the model inference, direct Alexa+ connection, and clean-room installation as unverified.

**Actionable suggestion:** In the README, separate:
- Implemented and tested.
- Implemented but not fully verified.
- Planned or currently blocked.

Provide setup instructions, architecture diagrams, test commands, environment-variable examples, a demo path, and a concise known-limitations section.

**Status:** This friction log provides the detailed incident record. The README and final submission artifacts must be validated independently.

---

# 3. Consolidated timeline

This timeline follows the order supported by the development record. It does not assign exact timestamps to incidents whose first occurrence was not recorded.

1. **Local environment preparation:** Set up development in WSL Ubuntu and established Python and npm-based workflows. Encountered missing or inconsistent Docker and Node.js command availability.
2. **Backend configuration:** Aligned environment templates with PostgreSQL/asyncpg and the Vite development origin.
3. **Database-backed task management:** Implemented and verified backend health, readiness, and task CRUD workflows.
4. **Frontend integration:** Built the task-management UI and API helper. Resolved the React Hooks lint issue using a deferred initial load.
5. **MCP implementation and testing:** Corrected SDK import, context-manager return, initialization-field, and result-parsing assumptions. Completed MCP initialization, discovery, and task CRUD testing.
6. **Bedrock service implementation:** Added the Boto3-based Claude service and chat endpoint, and declared the AWS SDK dependency.
7. **Anthropic onboarding:** Encountered missing use-case details and submitted the required form.
8. **Marketplace and IAM investigation:** Encountered a Marketplace authorization error, inspected policies, and confirmed the console later showed an active agreement.
9. **AWS credential setup:** Configured a local profile and verified AWS identity without embedding credentials in source.
10. **Inference-profile investigation:** Queried the global Claude Sonnet 4.5 profile and confirmed `ACTIVE`.
11. **Daily-token blocker:** The global-profile request failed with `ThrottlingException`. Repeated inference attempts were stopped.
12. **Quota investigation:** The exact daily quota could not be retrieved through the API because the IAM user lacked Service Quotas read permission. The visible quota data did not conclusively identify the exact blocking limit.
13. **Submission preparation:** Documented the verified features, unresolved provider integration, and improvements required for reproducibility and honest demonstration.

---

# 4. Root-cause analysis

Not every incident had a confirmed root cause. The following classification separates confirmed observations from likely contributing factors.

| Problem area | Confirmed observation | Root cause status |
|---|---|---|
| Environment template | Database driver and frontend-origin defaults did not match the actual stack | Configuration mismatch confirmed |
| React Hooks lint | Direct initial load triggered the lint rule | Trigger confirmed; long-term architectural choice remains open |
| MCP client tests | Several API names/return shapes differed from assumptions in the test harness | Compatibility mismatch confirmed |
| Anthropic onboarding | Error explicitly stated use-case details were missing | Initial blocker confirmed; submission alone did not prove access |
| Marketplace authorization | Runtime returned an explicit Marketplace `AccessDeniedException` | Denial confirmed; full effective-policy cause not conclusively established |
| Global inference profile | Profile status returned `ACTIVE` | Profile availability confirmed, inference capability not confirmed |
| Daily token throttling | Runtime returned `ThrottlingException` on the global profile | Throttling confirmed; exact quota or enforcement cause not identified |
| Quota inspection | Service Quotas API denied `ListServiceQuotas` | Missing effective permission confirmed |
| End-to-end AI chat | Service source compiled, but no successful Claude response was obtained | Completion not verified |

---

# 5. What we would do differently

## 5.1 Run an AI-provider preflight before building the full integration

Before investing significant time in the chat UI, verify:
- Model availability in the intended region.
- Provider use-case prerequisites.
- Marketplace or model access requirements.
- Effective IAM permissions.
- Relevant quotas and current usage.
- A single successful minimal inference request.

This would have exposed the daily-token limitation earlier and made it easier to decide whether to continue with Bedrock or prepare an alternate demonstration path.

## 5.2 Separate application development from external-service readiness

The task-management API, frontend, and MCP tools should remain testable without a live AI provider. Use mocks for unit tests and controlled dependency failures for integration tests.

A provider being unavailable should degrade the assistant feature gracefully rather than make task management unusable.

## 5.3 Make the test harness reproducible

Pin the relevant SDK versions and add a minimal tested MCP client example. This would reduce time spent on import-name, return-value, and response-shape mismatches.

## 5.4 Automate successful manual checks

The REST and MCP checks were valuable, but repeatable automated tests would provide better regression protection. At minimum, add tests for:
- Task CRUD and not-found behavior.
- Database readiness.
- MCP tool discovery and task operations.
- Chat input validation.
- Bedrock success and failure handling with a mocked client.
- Frontend API error states.

## 5.5 Improve observability without exposing sensitive data

Use structured logs with request IDs, operation names, latency, and sanitized error categories. Avoid printing secrets, request bodies, or raw internal details to API clients.

## 5.6 Establish explicit acceptance criteria

A feature should be marked complete only when its relevant acceptance test passes. For the AI assistant, the acceptance criterion should be a successful response through the actual backend route and frontend—not merely successful compilation or an active inference profile.

---

# 6. Final status and outstanding actions

## Verified or reported as passing

- [x] Backend health endpoint returned HTTP 200.
- [x] Database readiness endpoint returned HTTP 200.
- [x] REST task CRUD was manually exercised.
- [x] Temporary tasks 5 and 8 were verified deleted.
- [x] MCP initialization, tool discovery, and CRUD passed in the test harness.
- [x] Frontend build passed.
- [x] Frontend lint passed.
- [x] `git diff --check` passed.
- [x] Backend source compilation passed after the Bedrock code was added.
- [x] Global Claude Sonnet 4.5 inference profile metadata returned `ACTIVE`.

## Not yet verified or still blocked

- [ ] A successful live Claude Sonnet 4.5 inference request.
- [ ] Successful Claude response through `/api/v1/chat`.
- [ ] Fully integrated frontend AI chat and its loading/error states.
- [ ] Exact cause and reset condition for daily-token throttling.
- [ ] Programmatic Service Quotas access, or equivalent authorized quota confirmation.
- [ ] Direct Alexa+ connectivity.
- [ ] A clean-room installation from documented setup instructions.
- [ ] Comprehensive automated backend tests.
- [ ] Final demo recording and submission-specific evidence.

## Final reflection

The most important friction was not simply “AWS was difficult.” It was that several independent prerequisites—provider onboarding, Marketplace agreement state, IAM authorization, inference-profile selection, and token quotas—had to be distinguished and validated separately. Fixing one stage exposed the next blocker, and an active global inference profile still did not guarantee that a request could succeed.

The project nevertheless produced meaningful progress in its core application: the task-management API, persistence, frontend workflow, and MCP tools were implemented and manually validated. The next engineering priority is to close the live inference gap, integrate the verified provider path into the UI, and automate the checks that were previously performed manually.

The central lesson is to **verify each integration boundary independently, record the exact evidence, and never equate configuration success with end-to-end functionality**.
