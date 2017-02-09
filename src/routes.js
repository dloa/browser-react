import React from 'react'
import { Route, IndexRoute } from 'react-router'
import Layout from './components/Layout';
import BrowsePage from './components/BrowsePage';
//import AthletePage from './components/AthletePage';
import NotFoundPage from './components/NotFoundPage';

const routes = (
	<Route path="/" component={Layout}>
		<IndexRoute component={BrowsePage}/>
 	
		<Route path="*" component={NotFoundPage}/>
	</Route>
);

export default routes;

//<Route path="athlete/:id" component={AthletePage}/>