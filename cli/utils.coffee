import { fromBase64, fromUtf8, toBase64, toUtf8 } from '@cosmjs/encoding'

export getOpenAPISchemas = (api) =>
  switch api.type
    when 'swagger', 'openapi2'
      api.definitions
    when 'openapi3'
      api.components
    else
      throw Error "Unsupported API type: #{api.type}"

export toBinaryFields = (data, paths) =>
  unless typeof data is 'object'
    throw Error "Expected message to be an object"
  unless Array.isArray paths
    throw Error "Expected array of field paths"
  
  # sort by longest paths first, as those are presumably deeper and could be overwritten by shorter paths
  paths.sort (a, b) => -(a.length - b.length)
  
  for path in paths
    deepset data, path, (value) => toBase64 toUtf8 JSON.stringify value
  return

export parseFields = (fields) => fields.map parseField
export parseField = (field) =>
  path = []
  curr = ''
  inBracket = false
  pushCurr = =>
    if curr
      path.push curr
      curr = ''
  for c in field
    if inBracket
      switch c
        when '['
          throw Error "Nested brackets not supported"
        when ']'
          inBracket = false
          pushCurr()
        else
          curr += c
    else
      switch c
        when '.'
          pushCurr()
        when '['
          inBracket = true
          pushCurr()
        when ']'
          throw Error "Unexpected closing bracket"
        else
          curr += c
  pushCurr()
  path

export deepset = (data, path, setter) =>
  unless Array.isArray(path) and path.length > 0
    throw Error "Expected array of field names"
  prevField = ''
  obj = data
  
  assertField = (field) =>
    unless field of obj
      if prevField
        throw Error "No such field: #{prevField}[#{field}]"
      else
        throw Error "No such root field: #{field}"
  
  for field in path.slice(0, -1)
    assertField field
    prevField = field
    obj = obj[field]
  
  field = path[path.length-1]
  assertField field
  obj[field] = setter(obj[field])
  obj
