/* global jest:false */

jest.disableAutomock()

import React, { Component } from 'react'

import { connectWpPost } from '../../src/connect'

@connectWpPost('Bad', (props) => props.params.id)
export default class BadContentType extends Component {
  render () {
    return <div></div>
  }
}
