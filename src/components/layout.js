// src/components/Layout.js
import React from 'react';
import { Link } from 'react-router';

export default class Layout extends React.Component {
	render() {
		return (
			<div className="app-container">
				<div className="app-content">Test Test Test{this.props.children}</div>
			</div>
		);
	}
}