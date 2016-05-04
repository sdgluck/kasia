import { normalize, arrayOf } from 'normalizr'
import modifyResponse from 'wp-api-response-modify'
import merge from 'lodash.merge'

import schemasManager from './schemasManager'
import contentTypesManager from './contentTypesManager'

/**
 * Split a response from the WP-API into its constituent entities.
 * @param {Array|Object} response The WP API response
 * @param {String} idAttribute The property name of an entity's identifier
 * @returns {Object}
 */
export default function normalise (response, idAttribute) {
  let schemas = schemasManager.getSchemas()

  if (!schemas) {
    schemas = schemasManager.init(idAttribute)
  }

  return [].concat(response).reduce((entities, rawEntity) => {
    const entity = modifyResponse(rawEntity)
    const type = contentTypesManager.derive(entity)

    const contentTypeSchema = schemas[type]
      // Built-in content type or previously registered custom content type
      ? schemas[type]
      // Custom content type, will only get here once for each type
      : schemasManager.createSchema(type, idAttribute)

    const schema = Array.isArray(entity)
      ? arrayOf(contentTypeSchema)
      : contentTypeSchema

    const normalised = normalize(entity, schema)

    return merge(entities, normalised.entities)
  }, {})
}