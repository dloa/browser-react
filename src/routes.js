import React from 'react'
import { Route, IndexRoute } from 'react-router'
import Layout from './components/layout';
import BrowsePage from './components/BrowsePage';
import ArtifactPage from './components/ArtifactPage';
//import AthletePage from './components/AthletePage';
import NotFoundPage from './components/NotFoundPage';

const routes = (
	<Route path="/" component={Layout}>
		<IndexRoute component={BrowsePage}/>
		<Route path="media/:hash" component={ArtifactPage}/>
		<Route path="*" component={NotFoundPage}/>
	</Route>
);

export default routes;

//<Route path="#/:id" component={ArtifactPage}/>