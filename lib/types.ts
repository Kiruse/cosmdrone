
export interface OpenAPI {
  swagger: string;
  info?: {
    title?: string;
    name?: string;
    description?: string;
  };
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string;
        operationId: string;
        responses: {
          [code: string]: {
            description?: string;
            schema?: any;
          };
        };
        parameters: {
          name: string;
          description?: string;
          in?: string;
          required: boolean;
          type?: string;
          format?: string;
        }[];
        tags?: string[];
      };
    };
  };
}
