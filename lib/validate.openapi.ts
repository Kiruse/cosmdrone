import * as semver from 'semver'
import type { ApiType, OpenAPI } from './types.js'

export function validateOpenAPI(data: any): asserts data is OpenAPI {
  const type = validateVersion(data);
  data.type = type;
  data.openapi = semver.coerce(data.openapi ?? data.swagger);
  delete data.swagger;
  
  switch (type) {
    case 'swagger':
    case 'openapi2':
      validateOpenAPIv2(data);
      break;
    case 'openapi3':
      validateOpenAPIv3(data);
      break;
  }
}

function validateVersion(data: any): ApiType {
  if (data.swagger) {
    if (!semver.satisfies(semver.coerce(data.swagger)!, '^2'))
      throw Error(`Unexpected Swagger version ${data.swagger}`);
    return 'swagger';
  }
  if (data.openapi) {
    const version = semver.coerce(data.openapi);
    if (!version) throw Error(`Invalid OpenAPI version: ${data.openapi}`);
    if (semver.satisfies(version, '^2.0'))
      return 'openapi2';
    if (semver.satisfies(version, '^3.0'))
      return 'openapi3';
    throw Error(`New & unsupported OpenAPI version ${data.openapi}, please open an issue or PR`);
  }
  throw Error('Expected Swagger or OpenAPI documentation');
}

function validateOpenAPIv2(data: any) {
  if (!data.paths || typeof data.paths !== 'object')
    throw Error('Expected paths documentation');
  validatePaths(data.paths);
  
  if (!data.definitions || typeof data.definitions !== 'object')
    throw Error('Expected definitions documentation');
  validateSchemas(data.definitions);
}

function validateOpenAPIv3(data: any) {
  if (!data.paths || typeof data.paths !== 'object')
    throw Error('Expected paths documentation');
  validatePaths(data.paths);
  
  if (!data.components || typeof data.components !== 'object')
    throw Error('Expected components documentation');
  validateComponents(data.components);
}

function validatePaths(paths: any) {
  if (!paths || typeof paths !== 'object')
    throw Error('Expected paths documentation');
  for (const path in paths) {
    if (!path.startsWith('/'))
      throw Error(`Expected path to start with '/': ${path}`);
  }
}

function validateSchemas(definitions: any) {
  if (!definitions || typeof definitions !== 'object')
    throw Error('Expected definitions documentation');
  // TODO: more validations
}

function validateComponents(components: any) {
  if (!components || typeof components !== 'object')
    throw Error('Expected components documentation');
  validateSchemas(components.schemas);
}
