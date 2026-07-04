import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidSemVer, compareSemVer, parseSemVer } from "./semver.js";

test("accepts valid SemVer strings", () => {
  assert.equal(isValidSemVer("1.0.0"), true);
  assert.equal(isValidSemVer("2.13.4"), true);
  assert.equal(isValidSemVer("1.0.0-beta.1"), true);
  assert.equal(isValidSemVer("1.0.0+build.5"), true);
});

test("rejects invalid SemVer strings", () => {
  assert.equal(isValidSemVer("1.0"), false);
  assert.equal(isValidSemVer("v1.0.0"), false);
  assert.equal(isValidSemVer("1.0.0.0"), false);
  assert.equal(isValidSemVer("not-a-version"), false);
  assert.equal(isValidSemVer(""), false);
});

test("compares versions numerically, not lexicographically", () => {
  assert.equal(compareSemVer("1.9.0", "1.10.0") < 0, true);
  assert.equal(compareSemVer("2.0.0", "1.99.99") > 0, true);
  assert.equal(compareSemVer("1.2.3", "1.2.3"), 0);
});

test("treats a prerelease as lower precedence than the plain release", () => {
  assert.equal(compareSemVer("1.0.0-beta.1", "1.0.0") < 0, true);
  assert.equal(compareSemVer("1.0.0", "1.0.0-beta.1") > 0, true);
});

test("parses the prerelease segment separately from the numeric core", () => {
  const parsed = parseSemVer("1.2.3-rc.1");
  assert.deepEqual(parsed, { major: 1, minor: 2, patch: 3, prerelease: "rc.1" });
});
