import { createPostRequest } from '../redux/actions'
import { getContentType } from '../util/contentTypes'
import { fetch } from '../redux/sagas'
import invariants from '../util/invariants'

/**
 * Find an entity in `entities` with the given `identifier`.
 * @param {Object} entities Entity collection
 * @param {String|Number} identifier Entity ID or slug
 * @returns {Object}
 */
export function findEntity (entities, identifier) {
  if (!entities) {
    return {}
  }

  if (typeof identifier === 'number') {
    return entities[identifier]
  }

  const id = Object.keys(entities).find((key) => {
    return entities[key].slug === identifier
  })

  return id ? entities[id] : null
}

export function makePropsData (state, { contentType, id }) {
  const { plural, name } = getContentType(contentType)
  const entityCollection = state.wordpress.entities[plural]

  return {
    [name]: findEntity(entityCollection, id)
  }
}

export function getIdentifier (id, props) {
  const realId = typeof id === 'function' ? id(props) : id
  invariants.isIdentifierValue(realId)
  return realId
}

export function makePreloader (contentType) {
  return (displayName) => (renderProps) => {
    invariants.isValidContentType(getContentType(contentType), contentType, displayName)

    const action = createPostRequest({
      contentType,
      identifier: getIdentifier(renderProps),
      target: displayName
    })

    return [fetch, action]
  }
}