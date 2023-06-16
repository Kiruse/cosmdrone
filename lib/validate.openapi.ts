import type { OpenAPI } from './types.js'

export function validateOpenAPI(data: any): asserts data is OpenAPI {
  if (data.swagger !== '2.0')
    throw Error('Expected swagger version 2.0');
  if (!data.paths || typeof data.paths !== 'object')
    throw Error('Expected paths documentation');
  if (!data.definitions || typeof data.definitions !== 'object')
    throw Error('Expected definitions documentation');
  
  validateOpenAPIPaths(data.paths);
  validateOpenAPIDefinitions(data.definitions);
}

function validateOpenAPIPaths(paths: any) {
  if (!paths || typeof paths !== 'object')
    throw Error('Expected paths documentation');
  for (const path in paths) {
    if (!path.startsWith('/'))
      throw Error(`Expected path to start with '/': ${path}`);
    validateOpenAPIPaths(paths[path]);
  }
}

function validateOpenAPIDefinitions(definitions: any) {
  if (!definitions || typeof definitions !== 'object')
    throw Error('Expected definitions documentation');
  // TODO: more validations
}
