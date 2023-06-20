
export getOpenAPISchemas = (api) =>
  switch api.type
    when 'swagger', 'openapi2'
      api.definitions
    when 'openapi3'
      api.components
    else
      throw Error "Unsupported API type: #{api.type}"
