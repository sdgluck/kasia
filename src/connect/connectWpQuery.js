import React, { Component } from 'react'
import { connect } from 'react-redux'
import isEqual from 'lodash.isequal'
import merge from 'lodash.merge'

import idGen from './idGen'
import invariants from '../invariants'
import { createQueryRequest } from '../actions'
import { makeWpQueryPreloaderFn } from './preloaders'

/**
 * Filter `entities` to contain only those whose ID is in `identifiers`.
 * @param {Object} entities Entities by type, e.g. { posts: {}, ... }
 * @param {Array} identifiers IDs of the entities to pick
 * @returns {Object}
 */
function pickEntities (entities, identifiers) {
  identifiers = identifiers.map(String)

  return Object.keys(entities).reduce((reduced, entityTypeName) => {
    Object.keys(entities[entityTypeName]).forEach((entityId) => {
      const obj = entities[entityTypeName][entityId]

      if (identifiers.indexOf(entityId) !== -1) {
        reduced[entityTypeName] = reduced[entityTypeName] || {}
        reduced[entityTypeName][entityId] = obj
      }
    })

    return reduced
  }, {})
}

/**
 * Connect a component to arbitrary data from a WP-API query.
 *
 * Example, get all posts by an author:
 * ```js
 * connectWpQuery((wp) => wp.posts().embed().author('David Bowie').get())
 * ```
 *
 * Example, get all pages:
 * ```js
 * connectWpQuery((wp) => wp.pages().embed().get())
 * ```
 *
 * Example, get custom content type by slug (content type registered at init):
 * ```js
 * connectWpQuery((wp) => {
 *   return wp.news()
 *     .slug('gullible-removed-from-the-dictionary')
 *     .embed()
 *     .get()
 * })
 * ```
 *
 * @params {Function} queryFn Function that returns a wpapi query
 * @returns {Function}
 */
export default function connectWpQuery (queryFn) {
  invariants.isFunction('queryFn', queryFn)

  const queryIds = []

  return (target) => {
    const targetName = target.displayName || target.name

    invariants.isNotWrapped(target, targetName)

    const mapStateToProps = (state) => ({
      wordpress: state.wordpress
    })

    class KasiaIntermediateComponent extends Component {
      static __kasia = true

      static makePreloader = () => {
        const id = idGen()
        queryIds.push(id)
        return makeWpQueryPreloaderFn(id, queryFn)
      }

      render () {
        const props = merge({}, this.props, this.reconcileKasiaData())
        return React.createElement(target, props)
      }

      /**
       * Build an object of properties containing entity and query data maintained by Kasia.
       * @returns {Object} Props object
       */
      reconcileKasiaData () {
        const { queries, entities: _entities } = this.props.wordpress
        const query = queries[this.queryId]

        if (!query) {
          return {
            kasia: {
              query: { complete: false },
              entities: {}
            }
          }
        }

        const entities = pickEntities(_entities, query.entities)

        return { kasia: { query, entities } }
      }

      // Dispatch a new data request action to fetch data according to the props
      dispatch (props) {
        const wrappedQueryFn = (wpapi) => queryFn(wpapi, props)
        const action = createQueryRequest(this.queryId, { queryFn: wrappedQueryFn })
        this.props.dispatch(action)
      }

      componentWillMount () {
        this.queryId = queryIds.length ? queryIds.shift() : idGen()
        this.dispatch(this.props)
      }

      componentWillReceiveProps (_nextProps) {
        const thisProps = merge({}, this.props)
        const nextProps = merge({}, _nextProps)

        // Nullify `wordpress` on props objects so that they aren't compared otherwise
        // the addition of a new query object each time will cause infinite dispatches
        nextProps.wordpress = null
        thisProps.wordpress = null

        // Make a request for new data if the current props and next props are different
        if (!isEqual(nextProps, thisProps)) {
          this.queryId = queryIds.length ? queryIds.shift() : idGen()
          this.dispatch(nextProps)
        }
      }
    }

    return connect(mapStateToProps)(KasiaIntermediateComponent)
  }
}
