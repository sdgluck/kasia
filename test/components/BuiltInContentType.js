/* global jest:false */

jest.disableAutomock()

import React, { Component } from 'react'

import { ContentTypes } from '../../src/contentTypes'
import { connectWpPost } from '../../src/connect'

@connectWpPost(ContentTypes.Single, (props) => props.params.id)
export default class BuiltInContentType extends Component {
  render () {
    return <div></div>
  }
}
