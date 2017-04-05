// MAKE HISTORY AND LOCATION
function makeHistory(stateObj, newTitle) {
	navCounter++;
	if (location.protocol == 'app:') {		
		if ( ( (document.getElementById('browser-nav')) && (history.state) && (history.state.isFront) ) || (navCounter == 1) ) {
			$('#browser-nav').remove();
		} else {
			resetInterface();
			if (!document.getElementById('browser-nav')) {
				$('#logo').after('<div id="browser-nav" class="nodrag"><a onclick="goBack()">Back</a></div>');
			}
		}
	}
	$('#viewlabel').children().hide();
	console.log('Make History!');
	var newUrl = document.location.origin + document.location.pathname ? document.location.pathname : '';
	console.log(stateObj);

	// Default newUrl start.
	if (document.location.origin == 'https://alexandria.io')
			newUrl = document.location.origin + '/dev-browser/';
		else
			newUrl = document.location.origin + '/';

	console.log("1" + newUrl);

	var newBreadcrumbs = '';

	// If we are not the front page and we are not adding
	if ( (stateObj.currentView != 'front') && (stateObj.currentView.slice(0,3) != 'add') ) {
		// If the module is defined
		if (stateObj.module) {
			var callFunction = (stateObj.module == 'media') ? ('filterMediaByType(&apos;&apos;, true)') : ('getAllPublishers()') ;
			newBreadcrumbs = (stateObj.module == 'publisher') ? (newBreadcrumbs + ' / <a onclick="'+ callFunction +';" class="currentView-breadcrumb">'+stateObj.module.charAt(0).toUpperCase() + stateObj.module.slice(1) + 's'+'</a>') : (newBreadcrumbs + ' / <a onclick="'+ callFunction +';" class="currentView-breadcrumb">'+stateObj.module.charAt(0).toUpperCase() + stateObj.module.slice(1)+'</a>');
			newUrl = (stateObj.module == 'publisher') ? (newUrl + '/'+stateObj.module + 's') : (newUrl + stateObj.module);
			console.log("2" + newUrl);
		}
		// if there is not a subView
		if (!stateObj.subView) {
			// if we are "media"
			if (stateObj.currentView == 'media') {
				newBreadcrumbs = newBreadcrumbs + ' / <a onclick="setMediaTypeFilter(&apos;&apos;,true);" class="currentView-breadcrumb">'+ stateObj.currentView +'</a>';
			} else if (stateObj.currentView == 'search') { // if we are a search
				newBreadcrumbs = (stateObj.searchOn) ? (newBreadcrumbs + ' / <a onclick="searchByField(&apos;media&apos;, &apos;*&apos;,&apos;'+stateObj.searchTerm+'&apos;);" class="currentView-breadcrumb">'+ stateObj.currentView +'</a>') : (newBreadcrumbs + ' / <a onclick="setMediaTypeFilter(&apos;&apos;,true);" class="currentView-breadcrumb">'+ stateObj.currentView +'</a>');
			} else {
				newBreadcrumbs = newBreadcrumbs + ' / <a onclick="setMediaTypeFilter(&apos;&apos;,true);" class="currentView-breadcrumb">'+ stateObj.currentView +'</a>';
			}

			if (!stateObj.directToMedia)
				newUrl = newUrl + stateObj.currentView;

			console.log("3" + newUrl);
		}
	}
	if ( (stateObj.mediaTypes) && (stateObj.mediaTypes[0]) && (stateObj.mediaTypes.length > 0) ) {
		var breadString = '';
		var urlString = '';
		for (var i = 0; i < stateObj.mediaTypes.length; i++) {
			var mediaTypeStr = (stateObj.mediaTypes[i] != 'music') ? (stateObj.mediaTypes[i].charAt(0).toUpperCase() + stateObj.mediaTypes[i].slice(1) + 's') : (stateObj.mediaTypes[i].charAt(0).toUpperCase() + stateObj.mediaTypes[i].slice(1));
			breadString = (breadString == '') ? (mediaTypeStr) : (breadString + ' + ' + mediaTypeStr);
			urlString = (urlString == '') ? ('type/'+stateObj.mediaTypes[i]) : (urlString + '-' + stateObj.mediaTypes[i]);
		}
		newBreadcrumbs = newBreadcrumbs + ' / ' + breadString;
		newUrl = newUrl + '/' + urlString;
		console.log("4" + newUrl);
	}

	// If there is a search term
	if (stateObj.searchTerm) {
		if (!stateObj.searchOn || stateObj.searchOn == '*'){
			// There is no search term
			newBreadcrumbs = newBreadcrumbs + ' / ' + stateObj.searchTerm;
		} else {
			newBreadcrumbs + ' / <span id="breadcrumbs-searchOn">' + stateObj.searchOn + '</span> / ' + stateObj.searchTerm;
		}


		if ((!stateObj.searchOn) || (stateObj.searchOn == '*')) {
			// We are searching everything.
			newUrl = newUrl + '/' + stateObj.searchTerm.toString().toLowerCase().replace(/\s/g , "-");
		} else {
			newUrl + '/' + stateObj.searchOn + '/' + stateObj.searchTerm.toString().toLowerCase().replace(/\s/g , "-");
		}
	} else if (stateObj.subView) {
		if (stateObj.artifactTitle) {
			newBreadcrumbs = newBreadcrumbs + ' / <a onclick="setMediaTypeFilter(&apos;&apos;,true);" class="currentView-breadcrumb">Media</a> / <a onclick="loadPublisherEntity(this)" id="publisher-'+ stateObj.publisherId +'">'+ stateObj.artifactPublisher +'</a> / <a onclick="filterMediaByType(&apos;'+stateObj.mediaType+'&apos;)">' + stateObj.mediaType.charAt(0).toUpperCase() + stateObj.mediaType.slice(1) + '</a> / ' + stateObj.artifactTitle;
		} else {
			newBreadcrumbs = newBreadcrumbs + ' / <a onclick="getAllPublishers()" class="currentView-breadcrumb">Publishers</a> / ' + stateObj.subView;
		}
		if (!newUrl.includes(stateObj.subView) && !newUrl.includes(stateObj.subView.substring(0,6))){
			// Check if we already have an ending '/'
			if (newUrl.substr(newUrl.length - 1) == "/")
				newUrl = newUrl + stateObj.subView.substring(0,6);
			else // there is a trailing /
				newUrl = newUrl + '/' + stateObj.subView.substring(0,6);

			console.log("5" + newUrl);
		}
	} else if (stateObj.currentView.slice(0,3) == 'add') {		
		newBreadcrumbArray = stateObj.currentView.split('-');
		var breadString = '';
		for (var i = 0; i < newBreadcrumbArray.length; i++) {
			breadString = (breadString == '') ? (newBreadcrumbArray[i].charAt(0).toUpperCase() + newBreadcrumbArray[i].slice(1)) : (breadString + ' ' + newBreadcrumbArray[i].charAt(0).toUpperCase() + newBreadcrumbArray[i].slice(1))
		}
		newBreadcrumbs = newBreadcrumbs + ' / ' + breadString;
		newUrl = newUrl + '/' + stateObj.currentView;
		console.log("6" + newUrl);		
	}
	if (stateObj.directToMedia){
		var last6 = document.location.pathname.substring(document.location.pathname.length-6, document.location.pathname.length);
		if (!newUrl.includes(last6)){
			if (newUrl.substr(newUrl.length - 1) == "/")
				newUrl = newUrl + last6;
			else // there is a trailing /
				newUrl = newUrl + '/' + last6;
		}
	}

	if (stateObj.front){
		newBreadcrumbs = '/';

		newUrl = document.location.origin;
		if (document.location.origin == 'https://alexandria.io')
			newUrl += '/dev-browser/media';
		else
			newUrl += '/media';
		
		newTitle = "Alexandria"
	}
	if ( (newBreadcrumbs == '') && (stateObj.currentView != 'front') ) {
		newBreadcrumbs = newBreadcrumbs + ' / ' + stateObj.currentView.charAt(0).toUpperCase() + stateObj.currentView.slice(1);
		console.log(newBreadcrumbs);
	}
	if (!isEmbed) {
		document.getElementById('alexandria-breadcrumbs').innerHTML = newBreadcrumbs;
		document.getElementById('alexandria-breadcrumbs').style.display = 'inline-block';
		document.getElementById('viewlabel').style.display = 'inline-block';
	}
	document.title = newTitle;
	console.log("7" + newUrl);
	console.info(stateObj);
	history.pushState(stateObj, newTitle, newUrl);
}
