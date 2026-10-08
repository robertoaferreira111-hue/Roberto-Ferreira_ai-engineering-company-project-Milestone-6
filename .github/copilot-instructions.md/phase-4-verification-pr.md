# PHASE 4: Verification, Structure Compliance, and PR Readiness

## Expected outcome
An evidence-backed confirmation that every README task and evaluation criterion is met, that the repository follows the required submission structure, and that a PR description is ready. Fixes are limited to defects found during verification.

## Authoritative sources
- Requirements: the full README, including "What We Will Evaluate" and "How to Submit This Project", as supplied with this prompt; and CONTEXT-company.md.
- Context: reports from Phases 0 to 3 and repository instructions.
- Technical facts: the code, tests, and observed runtime behavior of the seed script, backend, and frontend.

## Expected results
- Each item under Model and seed, Backend, Frontend, and Cross-cutting evaluation criteria is verified as met, with evidence (command output, HTTP responses, or code location). Items that fail are corrected, or reported with the reason they could not be.
- Repository layout matches the submission structure: scripts/seed_incidents.py, packages/shared/, services/<api-service-name>/, and uis/<ui-name>/.
- Shared validation exists once in packages/shared/ and is used by both the seed script and the API.
- The end-to-end flow works from a clean state: migrate, seed (twice), start the backend, start the UI, register an incident, filter the list, change a status, and view the summary.
- Existing functionality from earlier milestones is confirmed not to have regressed.

## Deliverables (final report)
1. Criteria checklist with status (met, fixed, not met, uncertain) and evidence for every criterion.
2. List of defects found and the fixes applied, with files touched.
3. Final run instructions from a clean clone.
4. A ready-to-paste PR description covering scope, structure, how to run, how each requirement was verified, and the three required screenshots (form with visible validation error, incident list with data, summary panel with metrics) with a note on where each was captured.
5. Remaining risks or uncertainties.

## Constraints
- Claims of completion are supported by verification, not assumption.
- Changes are limited to correcting failures found against the README and CONTEXT-company.md.

## Out of scope
- New features, refactors, or style changes unrelated to a failed criterion.
- The optional embeddings enhancements.
- Opening or merging the PR itself.
