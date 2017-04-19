import path from 'path';
import { Server } from 'http';
import Express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import routes from './routes';
import NotFoundPage from './components/NotFoundPage';
import LDD from 'libraryd-data';
import seo from 'oip-seo';

// initialize the server and configure support for ejs templates
const app = new Express();
const server = new Server(app);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// define the folder that will be used for static assets
app.use('/static', Express.static(path.join(__dirname, 'static')));

// universal routing and rendering
app.get('*', function(req, res) {
//	console.log(req.params);
	match({ routes, location: req.url }, function (err, redirectLocation, renderProps) {
		// in case of error display the error message
		if (err) {
			return res.status(500).send(err.message);
		}

		// in case of redirect propagate the redirect to the browser
		if (redirectLocation) {
			return res.redirect(302, redirectLocation.pathname + redirectLocation.search);
		}

		// generate the React markup for the current route
		let markup;
		if (renderProps) {
			// if the current route matched we have renderProps
			markup = renderToString(<RouterContext {...renderProps}/>);
		} else {
			// otherwise we can render a 404 page
			markup = renderToString(<NotFoundPage/>);
			res.status(404);
		}

		var metaseo;

		var splits = req.params[0].split('/');
		var urlHash = splits[splits.length-1];
		if ((urlHash.length == 6 || urlHash.length == 64) && urlHash.split('.').length == 1){
			console.log(urlHash);
			if (req.params[0].includes('/player/')){
				urlHash = req.params[0].replace('/player/', '');
				console.log("Player: " + urlHash);
				LDD.getArtifact(urlHash, function(data){
					var artifact = '';

					// alexandria-media
					if (data[0]['media-data']) {
						artifact = data[0]['media-data']['alexandria-media'];
					} else {
						var artifactOIP = conformOIP(data[0]);
						artifact = artifactOIP['media-data']['alexandria-media'];
						artifact.info['extra-info'].filename = artifact.info['extra-info'].files[0].fname;
					}

					var playerEmbed = '';
					if (artifact.type == 'music') {
						var coverArt = getObjects(artifact.info['extra-info']['files'], 'type', 'coverArt');
						playerEmbed += '<img src="https://ipfs.alexandria.io/ipfs/' + artifact.torrent + '/'+coverArt[0].fname+'" style="float:left; margin: 4px;" width=150 height=150 />';
						playerEmbed += '<div style="padding: 4px; line-height: 1.4">';
						if (artifact.info['extra-info'].files[0]['dname'] != '') {
							playerEmbed += '<h1 style="font-size:20px;margin: 0;">'+artifact.info['extra-info'].files[0]['dname']+'</h1><h2 style="font-size:18px; font-weight: normal; margin: 0;">'+artifact.info['title']+'</h2>';
						} else {
							playerEmbed += '<h1 style="font-size:20px;margin: 0;">'+artifact.info['title']+'</h1>';
						}
						playerEmbed += '<p style="margin:0; font-size:18px">'+artifact.info['extra-info']['artist']+'</p>';
						playerEmbed += '</div>';
						playerEmbed += '<audio class="audio" width="100%" controls><source src="https://ipfs.alexandria.io/ipfs/' + artifact.torrent + '/' + artifact.info['extra-info'].filename + '" type="audio/mpeg">Your browser does not support audio</audio>'
					} else {
						playerEmbed += '<video class="video" width="100%" controls><source src="https://ipfs.alexandria.io/ipfs/' + artifact.torrent + '/' + artifact.info['extra-info'].filename + '" type="video/mp4">Your browser does not support video</video>'
					}
					var container = '<!DOCTYPE html><html><body style="margin: 0px; font-family: Arial,Helvetica Neue,Helvetica,sans-serif;"><style type="text/css"> audio, video { width:100%; height:auto; padding: 0 4px 0; box-sizing: border-box; }</style><div class="'+artifact.type+'">'+playerEmbed+'</div></body></html>';
					
					return res.send(container);
				});
			} else {

				LDD.getArtifact(urlHash, function(data){
					if (!data[0]){
						return res.render('index', { metaseo: '', markup: markup });
					}

					var artifact = '';

					// alexandria-media
					if (data[0]['media-data'])
						artifact = data[0]['media-data']['alexandria-media'];
					else //OIP
						artifact = data[0]['oip-041'].artifact;

					// Check for multiple txns with matching search string
					if ( (data.length > 1) && (urlHash.length === 6)) {
						for (var tx = 0; tx < data.length; tx++) {
							if (data[tx].txid.slice(0,6) != data.slice(1,-1)) {
								data.splice(data[tx], 1);
							}
						}
					}

					metaseo = seo.generateTags(data[0], 'http://' + req.headers.host + req.url, req.headers.host);

					return res.render('index', { metaseo: metaseo, markup: markup });
				});
			}
		} else {			
			metaseo = '';

			// render the index template with the embedded React markup
			return res.render('index', { metaseo: '', markup: markup });
		}
	});
});

function conformOIP(oipObject){
	// Pull out of casing
	var oip = oipObject["oip-041"];

	var alexandriaObject = {  
		"media-data":{  
			"alexandria-media":{  
				"torrent": oip.artifact.storage.location,
				"publisher": oip.artifact.publisher,
				"timestamp": oip.artifact.timestamp*1000,
				"type": oip.artifact.type,
				"info": {  
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

// Find key:value in JSON Obj
function getObjects(obj, key, val) {
    var objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], key, val));
        } else if (i == key && obj[key] == val) {
            objects.push(obj);
        }
    }
    return objects;
}

// start the server
const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'production';
server.listen(port, err => {
	if (err) {
		return console.error(err);
	}
	console.info(`Server running on http://localhost:${port} [${env}]`);
});