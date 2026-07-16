import assert from "node:assert/strict";
import test from "node:test";
import { computeGridArrangement, parseStl } from "./index.js";

test("parse un STL ASCII minimal", () => {
  const source = `solid triangle
facet normal 0 0 1
outer loop
vertex 0 0 0
vertex 10 0 0
vertex 0 10 0
endloop
endfacet
endsolid triangle`;
  const geometry = parseStl(new TextEncoder().encode(source));
  assert.deepEqual(geometry.positions, [0, 0, 0, 10, 0, 0, 0, 10, 0]);
});

test("centre et limite une grille multi-objets au plateau", () => {
  const bed = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  const result = computeGridArrangement(10, 40, 40, bed, 10);
  assert.equal(result.maxFit, 4);
  assert.equal(result.positions.length, 4);
  assert.equal(result.fits, false);
  assert.deepEqual(result.positions[0], { x: 25, y: 25 });
  assert.deepEqual(result.positions[3], { x: 75, y: 75 });
});
