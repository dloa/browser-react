// Check for # in URL and make old format work
if (location.hash) {
	hashRedirect();
}

function hashRedirect() {
	var locationHash = location.hash.split('/').slice(1);
	console.log(locationHash);
	var newPath = '';
	for (var hashInt = 0; hashInt < locationHash.length; hashInt ++){
		newPath += locationHash[hashInt] + '/';
	}
	location.href = location.href.split('#')[0] + newPath.slice(0,-1);
	return false;
}


// The route registering function:
var routes = {};

function route (path, templateId, controller) {  
  routes[path] = {templateId: templateId, controller: controller};
}
route('/', 'front', function () {  });  
route('/media', 'media', function () {  });
route('/publishers', 'publishers', function () {  });
route('/publisher', 'publisher', function () {  });
route('/add-media', 'add-media', function () {  });
route('/add-publisher', 'add-publisher', function () {  });
route('/search', 'search', function () {  });
route('/about', 'about', function () {  });
route('/wallet', 'wallet', function () { });

var el = null;  

function router (event, goUrl) {    
    // Current URL
    var url = location.pathname || '/';
	var paths = url.split('/');

	var removeInd = -1;
	for (var i = 0; i < paths.length; i++){
		if (paths[i] == "browser")
			removeInd = i;
	}

	if (removeInd != -1){
		paths.splice(removeInd, 1);
	}
	
	var module = paths[1] ? paths[1] : '/';

	if (!module)
		module = 'front';

	console.log(module);

    // Get route by url:
    var route = routes[module];

    // if we need to modify the paths (aka, if we are trying to go directly to the media) then we set this to true.
    var fixPaths = false;

    if (!route){
    	var route = routes['/' + module];
    	if (!route){
    		// No route (aka, they have likely attempted to go directly to an artifact)
    		if (module.length == 6 || module.length == 64){
    			route = routes['/media'];
    			// We are fixing the paths, so change this
    			fixPaths = true;
    			// create the "path" like it would be normally created.
    			paths = ["", "media", module];

    			console.log(paths);
    		} else {
    			// Since we cannot figure out where they want to go, send them to the media route.
    			console.log(location.pathname);
		    	route = routes['/media'];
    		}
    	}

    }

    // Route the URL
    if ( (route) && (route.controller) ) {
    	currentView = route.templateId;
    	if (route.templateId == 'front') {
    		resetAlexandria();
    		return false;
    	}
		resetInterface();
    	if (route.templateId == 'media') {
			if (!paths[2]) {
				// There seems to be no second path
				filterMediaByType();
			} else if (paths[2] == 'type') {
				var parseTypes = location.pathname.split('type/')[1].split('-');
				console.info(parseTypes);
				var filterTypes = [];
				for (var i = 0; i < parseTypes.length; i++) {
					filterTypes.push(parseTypes[i]);
				}
				var filterTypesStr = (filterTypes.length < 2) ? (filterTypes) : ('');
				if (filterTypes.length > 1) {
					for (var i = 0; i < filterTypes.length; i++) {
						if (filterTypesStr == '') {
							filterTypesStr = '"'+ filterTypes[i]+'"';
						} else {
							filterTypesStr = filterTypesStr+',"'+ filterTypes[i]+'"';
						}
					}
				}
				var searchResults = searchAPI('media', 'type', filterTypesStr);
				var stateObj = {
					currentView: 'media',
					searchResults: false,
					mediaTypes: filterTypes,
					isFront: true
				}
				var titleStr = '';
				if (stateObj.mediaTypes[0]) {
					for (var i = 0; i < stateObj.mediaTypes.length; i++) {
						titleStr = (titleStr == '') ? (stateObj.mediaTypes[i].charAt(0).toUpperCase() + stateObj.mediaTypes[i].slice(1) + 's') : (titleStr + ' + ' + stateObj.mediaTypes[i].charAt(0).toUpperCase() + stateObj.mediaTypes[i].slice(1) + 's');
					}
					titleStr = ' > ' + titleStr;	
				}
				makeHistory(stateObj, 'ΛLΞXΛNDRIΛ > Media' + titleStr);
				for (var i = 0; i < filterTypes.length; i++) {
					$('#browse-media .module-links a[value="'+ filterTypes[i] +'"]').addClass('active');
				}
				populateSearchResults(searchResults, 'media');
			} else {
				if (paths[2] == 'search') {
					console.info(paths);
					var searchTerm = paths[paths.length-1].toString().replace(/\s/g , "-").split('?')[0];
					if (paths[4]) {
						var searchOn = paths[3];
					}
					var searchResults = (searchOn) ? (searchAPI(route.templateId, searchOn, searchTerm)) : (searchAPI(route.templateId, '*', searchTerm));
					if (location.pathname.indexOf('types') != -1) {
						var parseTypes = location.pathname.split('types=')[1].split('-');
						for (var i = 0; i < parseTypes.length; i++) {
							filterTypes.push(parseTypes[i]);
						}
					}
					var stateObj = {
						currentView: 'search',
						searchResults: true,
						searchOn: searchOn,
						searchTerm: searchTerm,
						module: 'media',
						isFront: true
					}
					if (searchOn) {
						stateObj.searchOn = searchOn;
						var titleStr = 'ΛLΞXΛNDRIΛ > Media > Search > ' + searchOn + ' > ' + searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
					} else {
						var titleStr = 'ΛLΞXΛNDRIΛ > Media > Search > '+ searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
					}
					makeHistory(stateObj, titleStr);
					populateSearchResults(searchResults, route.templateId);
				} else {
					var searchOn = paths[2].replace("-","_");
					if (searchOn.length == 6 || searchOn.length == 64) {

		    			var moduleSlice = module.length -1;
		    			if ( module.slice(0, -moduleSlice) == 'F') {
							searchResults = searchAPI('publisher', 'address', searchOn);
							searchOn = searchResults[0]['publisher-data']['alexandria-publisher']['address'];
							loadPublisherView(searchOn);
						} else {
							// We can just pass in the txid and it will look it up from there.
							loadArtifactView2(searchOn);
						}
					} else {
						console.info(paths);
						if ( (paths[2] == 'type') && (paths[3]) ) {
							var parseTypes = location.pathname.split('type/')[1];
							var parseTypeLen = parseTypes.split('-');						
							if (parseTypeLen.length > 1) {
								var searchForStr = '';
								for (var i = 0; i < parseTypeLen.length; i++) {
									if (searchForStr == '') {
										searchForStr = '"'+ parseTypeLen[i]+'"';
									} else {
										searchForStr = searchForStr +',"'+ parseTypeLen[i]+'"';
									}
								}
								var searchFor = searchForStr;
							} else {
								var searchFor = [paths[3]];
							}
						} else if ((paths[2] != 'type') && (paths[3])) {
							var searchFor = paths[3].replace(/-/g, ' ');
						} else {
							var searchFor = '';
						}
						var searchResults = searchAPI(route.templateId, searchOn, searchFor);
						var stateObj = {
							currentView: 'media',
							searchResults: false,
							isFront: true							
						}
						makeHistory(stateObj, 'ΛLΞXΛNDRIΛ > Media');
						populateSearchResults(searchResults, route.templateId);
					}
				}
			}
    	} else if ( (route.templateId == 'publishers') || (route.templateId == 'publisher') ) {
			console.info(paths[2]);
			if (!paths[2]) {
				getAllPublishers();
			} else {
				var searchResults;
				if (paths[2].length == 34)  {
					searchResults = searchAPI('publisher', 'address', paths[2]);
					loadPublisherView();
				} else if (paths[2].length == 64)  {
					searchResults = searchAPI('publisher', 'txid', paths[2]);
					loadPublisherView();
				} else {
					var searchTerm = paths[paths.length - 1].replace(/-/g, ' ');
					searchResults = searchAPI('publisher', 'name', searchTerm);
					populateSearchResults(searchResults, route.templateId);
					var stateObj = {
						currentView: 'publishers',
						searchResults: true,
						searchTerm: searchTerm
					}
					makeHistory(stateObj, 'ΛLΞXΛNDRIΛ > Publishers > Search > ' + searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1));
				}
			}
    	} else if (route.templateId == 'add-media') {
			loadShareMod();
    	} else if (route.templateId == 'add-publisher') {
			loadCreatePublisherMod();
    	} else if (route.templateId == 'search') {
			var stateObj = {
				currentView: 'search',
				searchResults: true
			}
			stateObj.searchTerm = (paths[2]) ? (paths[2].toString().replace(/-/g, ' ').split('?')[0]) : ('');
			$('#search-main').val(paths[2].toString().replace(/-/g, ' '));
				
			if(paths.length == 4){
				loadArtifactView2();
			} else {
				fullSearch(stateObj.searchTerm);
			}
    	} else if (route.templateId == 'about') {
    		loadAboutView();
    	} else if (route.templateId == 'wallet') {
    		loadWalletView();
    	}
    } else {
    	// ROUTE DOESN'T EXIST - IF ADDRESS LOAD PUBLISHER
    	console.info(paths[1]);
    	if (!paths[1]) {
			loadArtifactView(location.pathname);
			return;
    	}
    	if (paths[1].length == 34) {
//			var searchResults = searchAPI('publisher', 'address', paths[1]);
			loadPublisherView(paths[1]);
    	} else if (paths[1].length == 64) {
			var searchResults = searchAPI('publisher', 'txid', paths[1]);
			if (!searchResults) {
				var thisMediaData = searchAPI('media', 'txid', paths[1]);
				var mediaType = thisMediaData[0]['media-data']['alexandria-media']['type'];
				var pubTime = thisMediaData[0]['media-data']['alexandria-media']['timestamp'];
				if (pubTime.toString().length === 10) {
					pubTime = pubTime * 1000;
				}	
				if ( (mediaType != 'music') && (mediaType != 'movie') && (mediaType != 'video') && (pubTime < 1476249400000) ) {
					loadArtifactView(paths[1]);
				} else {
					loadArtifactView2(paths[1]);
				}
			} else {
				loadPublisherView(paths[1]);
			}
    	}
    }

}

// Check if this is an embedded artifact
var isEmbed = false;
if ($('body').hasClass('embedded')) {
	isEmbed = true;
    // Embed what
    var url = location.pathname || '/';
	var paths = url.split('/');
	var searchOn = paths[2].replace("-","_");
	var module = paths[1] ? paths[1] : '/';

	var moduleSlice = module.length -1;
	if ( module.slice(0, -moduleSlice) == 'F') {
		searchResults = searchAPI('publisher', 'address', searchOn);
		searchOn = searchResults[0]['publisher-data']['alexandria-publisher']['address'];
		loadPublisherView(searchOn);
	} else {
		// We can just pass in the txid and it will look it up from there.
		loadArtifactView2(searchOn);
	}
} else {
	// Listen on hash change:
	window.addEventListener('onpopstate', router);  

	window.onpopstate = function(event) {
		console.log(event);
		router(event)
	};

	// Listen on page load:
	window.addEventListener('load', router);
}