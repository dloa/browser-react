import React from 'react';

export default class ArtifactPage extends React.Component {
	render() {
		const hash = this.props.params.id;
		console.log("HERE!!!");
		return (
			<div>
				<h2 className="name">{this.props.params.id}</h2>
			</div>
		);
	}
}
