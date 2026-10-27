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

## Second PACE-S/MAPE-K bounded correction (2026-10-27)

Followed the exact open draft source and its original BCF customer hold.
Original source reading: PR #1, main and repair branches, current issue/PR list,
GitHub Actions run inventory (no runs), PR review threads (none), and BCF PR #595.
Original RN verification recovered the packed CLI, which the earlier ZIP evidence
bundle omitted. Restored original blob b5f1825c8e5dc37dc1ca0e857c603806b3578dca,
then independently re-ran `npm run verify` on Node 22.16.0: **9/9 pass**.

New independently authored negative tests were executed **before changing the
factory**: **0/5 pass, five observed failures**. None of these new tests simply
asserts the generator's existing behavior.

| Requirement | Independent falsifier and corrected boundary |
| --- | --- |
| CF-PNPM-007 | A literal workspace path such as `packages/*` changes PNPM membership; refuse selectors, shell-like negation and glob metacharacters rather than writing a misleading explicit package list |
| CF-PNPM-008 | An output under an existing parent symlink wrote into an unrelated empty directory; inspect every existing ancestor before and after creating the output path |
| CF-PNPM-009 | Equivalent requirement JSON with reversed key orders produced different artifact bytes and digests; stable sorted key/codomain admission rejects non-finite, accessor-backed and non-JSON values, and explicit empty `packages: []` |
| CF-PNPM-010 | The projected `Map` could be mutated after the digest was issued despite `Object.freeze` on the projection; replace it with a read-only Map-style view, deeply freeze package identities and receipt file names |
| CF-PNPM-011 | Independent digest recomputation on actual output files disagreed with the receipt because locale-aware sorting differs from byte-stable path ordering; use one deterministic code-unit order |
| CF-PNPM-012 | A native Node suite cannot establish PNPM 12 policy enforcement or script denial; add a separate real PNPM 12.9.1 consumer using the npm-packed CLI, offline local fixture tarball, exact eight-name BCF denial map, internal workspace linking, frozen replay and a deliberately unreviewed postinstall script refusal |

**Observed local evidence:** on Node 22.16.0, `npm run verify` now returns **16/16
passed**, no failed assertions. Syntax checks, npm package archive inspection,
real packed-CLI consumer and independent disk receipt recomputation pass.
`node --check` accepts the PNPM-specific external receiving script, and the
GitHub Actions YAML parses; neither executes the real PNPM gate on this offline
host. `pnpm` is absent and network installation is unavailable locally.

**Remaining hold:** GitHub-hosted workflow admission and the real PNPM
12.9.1 install/denial test are unobserved until the original runner receives
and executes this branch. This PR does **not** close BCF PR #595 or its source
release, its physical WSL storage shortfall, the unresolved Go/No-Go for eight
native packages, or production application boot. A failed independent assay
must remain a release hold, never be papered over with `--ignore-scripts` or
an implicit `allowBuilds: true`.

**Risk scope:** symlink tests close static redirection, not a malicious
concurrent rename race. Genuine untrusted caller filesystem confinement is an
OS-host duty. No existing PNPM dependency graph or original lockfile was changed.
