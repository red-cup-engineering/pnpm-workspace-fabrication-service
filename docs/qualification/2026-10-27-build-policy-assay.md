# PNPM workspace fabrication: source-to-receiving qualification (2026-10-27)

Original source: red-cup-engineering/pnpm-workspace-fabrication-service.
Customer dependency context: 561-group/561-group-bare-cedar-fog-services-section#595
has independently observed PNPM 12.9.1 ERR_PNPM_IGNORED_BUILDS for eight
packages; this qualification does not close that customer's release work.

External specification: pnpm build-policy documentation at
https://pnpm.io/settings#allowbuilds and https://pnpm.io/cli/approve-builds.
allowBuilds was introduced in pnpm 10.26.0. The historical factory test supplied
pnpm 10.15.0 with allowBuilds false, making its policy appearance misleading.

| ID | Requirement | Executable acceptance |
| --- | --- | --- |
| CF-PNPM-001 | Never emit enforceability claims for pnpm releases without allowBuilds | Reject policy-bearing 9.x, 10.15 and 10.25; accept 10.26, 11 and 12; emit strictDepBuilds true |
| CF-PNPM-002 | Preserve explicit true/false decisions, never coerce malformed values | Reject null, numeric, string, array, object, missing/whitespace matchers |
| CF-PNPM-003 | Paths stay canonical and cannot collide with generated workspace manifests | Reject blank, dot, parent, double separator, absolute drive and reserved manifest paths |
| CF-PNPM-004 | Pure admission precedes filesystem effects | Invalid policy must not create the named output directory |
| CF-PNPM-005 | Output territory must not be a symlink alias | Reject a symlink-to-empty-directory without creating files in its target |
| CF-PNPM-006 | Qualify the distributable CLI, not just an in-process projector | npm-pack artifact executes from extracted package, materializes consumer/provider manifests with pinned PNPM 12 and exact denies, rejects 10.15 before writing |

2026-10-27 source witness: GitHub baseline blobs
64935ca283e604b6be8085035b9821ada5e40f3a (generator),
077451f7da3299d7166caf450673f9ba09cb29fb (original tests),
and 7315978285f7998928b32b44fcb7d1203addfa22 (manifest)
were reconstructed byte-for-byte locally before the changes.
Baseline 3/3 passed. Added acceptance tests first: 3 passed and 5 failed
before code repair. After code repair: native Node 22.16.0 tests 8/8 passed;
with the packed CLI receiver 9/9 passed (no network install).

Limits: no actual pinned PNPM 10.26/12 dependency install or original Bare
Cedar Fog customer build was run here; no private release runner, deployment,
SLSA attestation, signed artifact, or independent revenue/customer acceptance
was observed. The CLI consumer's test source is distinct from the projection
logic, but it is not a separate organization or production receiving office.
Do not merge as a production-release qualification without original owning
runner and consumer validation.
