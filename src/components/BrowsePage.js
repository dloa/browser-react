// src/components/IndexPage.js
import React from 'react';
//import AthletePreview from './AthletePreview';
//import athletes from '../data/athletes';

export default class BrowsePage extends React.Component {
	render() {
		return (
			<div>
				<div className="module-links mod-filter">
					<ul className="noList"> 
						<li>						
							<a onclick="setMediaTypeFilter();">
								<div className="imgwrap">
													
								</div>
								<div>All</div>
							</a>
						</li>
						<li>
							<a onclick="setMediaTypeFilter(this)" value="movie">
								<div className="imgwrap">
									
								</div>
								<div>Movies</div>
							</a>
						</li>
						<li>
							<a onclick="setMediaTypeFilter(this)" value="video">
								<div className="imgwrap">
									
								</div>
								<div>Videos</div>
							</a>
						</li>
						<li>
							<a onclick="setMediaTypeFilter(this)" value="music">
								<div className="imgwrap">
									
								</div>
								<div>Music</div>
							</a>
						</li>
						<li>
							<a onclick="setMediaTypeFilter(this)" value="podcast">
								<div className="imgwrap">
									
								</div>
								<div>Podcasts</div>
							</a>
						</li>
						<li>
							<a onclick="setMediaTypeFilter(this)" value="book">
								<div className="imgwrap">
									
								</div>
								<div>Books</div>
							</a>
						</li>
						<li>
							<a onclick="setMediaTypeFilter(this)" value="recipe">
								<div className="imgwrap">
									
								</div>
								<div>Recipes</div>
							</a>
						</li>
						<li>
							<a onclick="setMediaTypeFilter(this)" value="thing">
								<div className="imgwrap">
									
								</div>
								<div>Things</div>
							</a>
						</li>
					</ul>
				</div>	
				<div className="clearfix" />
				<div id="browse-media-wrap" className="wrapper">
					<div id="media-results-wrap" className="container" />
					<div id="publisher-results-wrap" className="container" />
					<div id="results-count-wrap" className="container">Total Results: <span /></div>
				</div>
			</div>
		);
	}
}

//{athletes.map(athleteData => <AthletePreview key={athleteData.id} {...athleteData} />)}	