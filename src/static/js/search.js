// MEDIA + PUBLISHER SEARCH API
window.searchAPI = function(module, searchOn, searchFor) {
	if ( (searchOn == 'type') && (searchFor.length > 1) ) {
		searchFor = '['+searchFor+']';
	} else {
		searchFor = '"'+searchFor+'"';
	}
	queryString = '{"protocol":"'+ module +'","search-on":"'+ searchOn +'","search-for":'+searchFor+',"search-like": true}';
	var mediaData;
	$.ajax({
		type: "POST",
		//url: librarianHost +'/alexandria/v2/search',
		url: librarianHost +'/alexandria/v1/search',
		data: queryString.toString(),
		success: function (e) {
			mediaData = $.parseJSON(e).response;
		},
		async:   false
	});
	//console.info(mediaData);

	// HACK: OstlerDev
	// Hack oip to conform to alexandria-media temporarialy. 
	/* 02/09/2017 disabled hack
	if (mediaData){
		var count = 0;
		for (var i = 0; i < mediaData.length; i++) {
			if(mediaData[i]['oip-041']){
				mediaData[i] = oipDowngrade(mediaData[i]);
				count++;
			}
		}

		console.log("Conformed " + count + " OIP-041 Artifacts to alexandria-media Artifacts");
	}
	*/

	return mediaData;
}

window.artifactHashTest = function(allArtifacts){
	var hashLengthOverlapAmount = [];
	var HASH_LENGTH = 64;

	for (var i = 0; i < HASH_LENGTH; i++) {
		hashLengthOverlapAmount.push(0);
	}

	var matches = [];

	console.log(hashLengthOverlapAmount.length);

	// Calculate overlap for each artifact.
	for (var i = 0; i < allArtifacts.length; i++){
		// Get the artifact we are working with
		var artifact = allArtifacts[i];

		// We want to test all lengths of the hash for overlap.
		for (var k = 1; k <= HASH_LENGTH; k++){
			// Get the shorter hash to check overlap on
			var hashPart = artifact.txid.substring(0,k);

			// Now we go through each artifact to see if it overlaps, if it does, add one to the counter on that index (k)
			for (var j = 0; j < allArtifacts.length; j++){
				// If we are on the same artifact, skip over
				if (i == j)
					continue;

				// Cut the string part
				var compareHashPart = allArtifacts[j].txid.substring(0,k);

				// Check if they are the same
				if (hashPart == compareHashPart){
					var alreadyMatched = false;

					for (var z = 0; z < matches.length; z++){
						if ((artifact.txid == matches[z].a || artifact.txid == matches[z].b) && (allArtifacts[j].txid == matches[z].a || allArtifacts[j].txid == matches[z].b) && matches[z].length == k){
							alreadyMatched = true;
						}
					}
					if (!alreadyMatched){
						// If they are the same, increment that length overlap
						hashLengthOverlapAmount[k-1]++;
						matches.push({length: k, a: artifact.txid, b: allArtifacts[j].txid});
					}
				}
			}
		}
	}

	for (var i = 0; i < hashLengthOverlapAmount.length; i++) {
		console.log((i+1) + ": " + hashLengthOverlapAmount[i]);
	}
	console.log(hashLengthOverlapAmount);
}

// This method downgrades oip-041 objects to alexandria-media objects until the code can be updated to only support oip-041.
window.oipDowngrade = function(oipObject){
	// Pull out of casing
	var oip = oipObject["oip-041"];

	var alexandriaObject = {  
		"media-data":{  
			"alexandria-media":{  
				"torrent": oip.artifact.storage.location,
				"publisher": oip.artifact.publisher,
				"timestamp": oip.artifact.timestamp,
				"type": oip.artifact.type,
				"info":{  
					"title": oip.artifact.info.title,
					"description":oip.artifact.info.description,
					"year": oip.artifact.info.year,
					"extra-info": oip.artifact.info.extraInfo ? oip.artifact.info.extraInfo : oip.artifact.info['extra-info']
				},
				"payment":oip.artifact.payment
			},
			"signature":oip.signature
		},
		"txid": oipObject.txid,
		"block": oipObject.block
	}

	alexandriaObject["media-data"]["alexandria-media"]["info"]["extra-info"]["DHT Hash"] = oip.artifact.storage.location;

	// Add artist name if it exists to the "publisher-name" for now. This is a hack as oip-041 standards do not include a publisher name. This might need to be updated in LibraryD to be included.
	if (oip.artifact.info.extraInfo && oip.artifact.info.extraInfo.artist){
		alexandriaObject['publisher-name'] = oip.artifact.info.extraInfo.artist;
	}

	if(oip.artifact.info['extra-info'] && oip.artifact.info['extra-info'].artist){
		alexandriaObject['publisher-name'] = oip.artifact.info['extra-info'].artist;
	}

	// Conform each file to be fixed.
	// Add files.
	if (oip.artifact.storage.files){
		var files = oip.artifact.storage.files;
		for (var i = 0; i < files.length; i++) {
			if (files[i].filename && !files[i].fname){
				files[i].fname = files[i].filename;
				delete files[i].filename;
			}
			if (files[i].displayname && !files[i].dname){
				files[i].dname = files[i].displayname;
				delete files[i].displayname;
			}
		}

		alexandriaObject["media-data"]["alexandria-media"]["info"]["extra-info"].files = [];
		alexandriaObject["media-data"]["alexandria-media"]["info"]["extra-info"].files = files;
	}

	return alexandriaObject;
}