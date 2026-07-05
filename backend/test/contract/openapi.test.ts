import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import request from 'supertest';
import { Express } from 'express';
import { buildApp, completeFirstRun } from '../fixtures/seed';

interface OpenApiDoc {
  paths: Record<string, Record<string, unknown>>;
}

const HTTP_METHODS = ['get', 'post', 'put', 'delete'];

function toExpressPath(openApiPath: string): string {
  return openApiPath.replace('{id}', '1').replace('{jobId}', 'unknown');
}

/**
 * Smoke test: every path+method declared in contracts/openapi.yaml (the API's source of truth,
 * PRD.md / SYSTEM_DESIGN.md §8) must be wired up to a real route, not a 404 from Express's default
 * "no route matched" handler. This doesn't validate schemas — it catches routes that were
 * documented but never implemented (or implemented at the wrong path).
 */
describe('OpenAPI contract coverage', () => {
  let app: Express;
  let doc: OpenApiDoc;

  beforeAll(async () => {
    app = buildApp();
    await completeFirstRun(app);
    const raw = fs.readFileSync(path.resolve(__dirname, '../../../contracts/openapi.yaml'), 'utf-8');
    doc = yaml.load(raw) as OpenApiDoc;
  });

  it('has a matching route for every documented path and method', async () => {
    const unmatched: string[] = [];

    for (const [openApiPath, methods] of Object.entries(doc.paths)) {
      const expressPath = toExpressPath(openApiPath);
      for (const method of HTTP_METHODS) {
        if (!(method in methods)) continue;
        const res = await (request(app) as unknown as Record<string, (url: string) => request.Test>)[method](
          expressPath,
        );
        const isExpressNotFoundFallthrough = res.status === 404 && !res.type.includes('json');
        if (isExpressNotFoundFallthrough) {
          unmatched.push(`${method.toUpperCase()} ${openApiPath}`);
        }
      }
    }

    expect(unmatched).toEqual([]);
  });
});
