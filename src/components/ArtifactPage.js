import React from 'react';

export default class ArtifactPage extends React.Component {
	render() {
		const hash = this.props.params.id;
		return (
			<div>
				<h2 className="name">{this.props.params.id}</h2>
			</div>
		);
	}
}
