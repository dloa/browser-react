// https://scotch.io/tutorials/react-on-the-server-for-beginners-build-a-universal-react-and-node-app

import React from 'react';
import ReactDOM from 'react-dom';
import AppRoutes from './components/AppRoutes';

window.onload = () => {
	ReactDOM.render(<AppRoutes/>, document.getElementById('main'));
};