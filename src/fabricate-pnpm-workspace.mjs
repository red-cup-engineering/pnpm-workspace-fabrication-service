import { createHash } from "node:crypto";
import { lstat, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

function text(value, name) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${name} must be non-empty text`);
  return value.trim();
}

function relativePath(value) {
  const path = text(value, "package path").replaceAll("\\", "/");
  // Canonical package roots cannot alias the root manifest, workspace policy,
  // another manifest file, or any file outside the output territory.
  const segments = path.split("/");
  if (path.startsWith("/") || /^[A-Za-z]:/u.test(path) || path.includes("\0") ||
      segments.some(segment => !segment || segment === "." || segment === ".." ||
        segment === "package.json" || segment === "pnpm-workspace.yaml"))
    throw new TypeError(`package path escapes or aliases customer territory: ${value}`);
  return path;
}

function exactVersion(value, name) {
  const version = text(value, `${name} version`);
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(version)) throw new TypeError(`${name} version must be exact semver`);
  return version;
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function admitBuildPolicy(policy, pnpmVersion) {
  if (policy === null || policy === undefined) return [];
  if (!policy || typeof policy !== "object" || Array.isArray(policy) ||
      Object.getPrototypeOf(policy) !== Object.prototype)
    throw new TypeError("build policy must be an explicit matcher-to-boolean object");
  const entries = Object.entries(policy);
  for (const [matcher, allowed] of entries) {
    if (!matcher.trim() || matcher !== matcher.trim() || typeof allowed !== "boolean")
      throw new TypeError("build policy entries require non-empty exact matchers and boolean decisions");
  }
  // PNPM introduced allowBuilds in v10.26.0. Earlier versions can silently
  // ignore a policy that this fabricator would otherwise appear to attest.
  const [major, minor] = pnpmVersion.split(".").map(Number);
  if (entries.length && (major < 10 || (major === 10 && minor < 26)))
    throw new TypeError("build policy requires pnpm 10.26.0 or later");
  return entries.sort(([left], [right]) => left.localeCompare(right))
    .map(([matcher, allowed]) => `  ${JSON.stringify(matcher)}: ${allowed}`);
}

export function projectPnpmWorkspace(specification) {
  if (!specification || typeof specification !== "object" || Array.isArray(specification)) throw new TypeError("workspace specification must be an object");
  const packages = (specification.packages ?? []).map((item) => ({
    path: relativePath(item.path),
    manifest: { ...item.manifest, name: text(item.manifest?.name, "package name"), version: exactVersion(item.manifest?.version, item.manifest?.name ?? "package") },
  })).sort((left, right) => left.path.localeCompare(right.path));
  const duplicatePaths = Object.entries(Object.groupBy(packages, ({ path }) => path)).filter(([, rows]) => rows.length > 1);
  const duplicateNames = Object.entries(Object.groupBy(packages, ({ manifest }) => manifest.name)).filter(([, rows]) => rows.length > 1);
  if (duplicatePaths.length || duplicateNames.length) throw new TypeError("workspace package paths and identities must be unique");
  const internal = new Map(packages.map(({ manifest }) => [manifest.name, manifest.version]));
  const files = new Map();
  const pnpmVersion = exactVersion(specification.pnpmVersion, "pnpm");
  const policyLines = admitBuildPolicy(specification.buildPolicy, pnpmVersion);
  const root = {
    name: text(specification.root?.name, "root name"),
    version: exactVersion(specification.root?.version, "root"),
    private: true,
    packageManager: `pnpm@${pnpmVersion}`,
  };
  files.set("package.json", json(root));
  files.set("pnpm-workspace.yaml", `packages:\n${packages.map(({ path }) => `  - ${JSON.stringify(path)}`).join("\n")}\n${policyLines.length ? `strictDepBuilds: true\nallowBuilds:\n${policyLines.join("\n")}\n` : ""}`);
  for (const item of packages) {
    const manifest = structuredClone(item.manifest);
    for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
      if (!manifest[field]) continue;
      manifest[field] = Object.fromEntries(Object.entries(manifest[field]).map(([name, version]) => internal.has(name) ? [name, `workspace:${internal.get(name)}`] : [name, version]));
    }
    files.set(`${item.path}/package.json`, json(manifest));
  }
  const digest = createHash("sha256");
  for (const [path, body] of [...files].sort(([left], [right]) => left.localeCompare(right))) digest.update(path).update("\0").update(body).update("\0");
  return Object.freeze({ type: "PnpmWorkspaceProjection", version: 1, files, digest: digest.digest("hex"), packages: packages.map(({ path, manifest }) => ({ path, name: manifest.name, version: manifest.version })) });
}

export async function fabricatePnpmWorkspace({ specification, outputDirectory }) {
  // Complete all pure admission before creating even an empty output directory.
  const projection = projectPnpmWorkspace(specification);
  const output = resolve(outputDirectory);
  await mkdir(output, { recursive: true });
  if ((await lstat(output)).isSymbolicLink())
    throw new Error("customer workspace output territory may not be a symbolic link");
  if ((await readdir(output)).length) throw new Error("customer workspace output territory must be empty");
  for (const [path, body] of projection.files) {
    const target = resolve(output, path);
    const rel = relative(output, target);
    if (!rel || rel.startsWith(`..${sep}`) || rel === "..") throw new Error(`projected path escapes output territory: ${path}`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body, { flag: "wx" });
  }
  return Object.freeze({ type: "PnpmWorkspaceFabricationReceipt", version: 1, outputDirectory: output, digest: projection.digest, packages: projection.packages, files: [...projection.files.keys()].sort() });
}
