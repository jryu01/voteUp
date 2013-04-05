var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var querystring = require('querystring');

var PORT = 8080;

var MIME_TYPES = {
	'.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.txt': 'text/plain'
}; 
//storage for topics and replies
var topics = [];
var replies = [];
var tid = 0;
var rid = 0;

function serveFile(filePath, response) {
	var fileExtention = path.extname(filePath);
	fs.exists(filePath, function(exists) {
		if (!exists) {
			response.writeHead(404, {'Content-Type': MIME_TYPES.html});
			response.end('<html><head><title>404 - Page Not Fuond</title></head><body><h1>Page Not Found.</h1></body></html>');
			console.log(filePath + ' not exists.');
			return;
		}
		fs.readFile(filePath, function(err, data){
			if (err){
				response.writeHead(500, {'Content-Type': MIME_TYPES.html});
				response.end('<html><head><title>500 - File Error</title></head><body><h1>File Error.</h1></body></html>');
				console.log(filePath + ' with file error.');
				return;
			}
			response.writeHead(200, {'Content-Type': MIME_TYPES[fileExtention]});
			response.end(data, 'utf-8');
			console.log(filePath + ' served.');
		});

	});
}
var requestListener = function(request, response){
	//parse the request.url
	var urlParsed = url.parse(request.url);
	switch(request.method){
		case 'GET':
			console.log("[200] " + request.method + " to " + request.url);
			switch(urlParsed.pathname){
				case '/':
					//serve index.html
					serveFile('./index.html', response);
				break;
				case '/loadTopics':
          var topicList = [];
          for (var i = 0, l = topics.length; i < l; i ++) {
            topicList.push(topics[i]);
          }
          //sort topicList by votes
          topicList.sort(function(a,b){
            return b.votes - a.votes;
          });
					response.writeHead(200, {'Content-Type': MIME_TYPES.txt});
					response.end(JSON.stringify(topicList));
					console.log(JSON.stringify(topicList));
				break;
				case '/loadReplies':
					var parent_id = querystring.parse(urlParsed.query).pid;
					var replyList = [];
					for (var i = 0; i<replies.length; i++) {
						if(replies[i].pid === parent_id) {
							replyList.push(replies[i]);
						}
					}
          //sort replyList by votes
          replyList.sort(function(a,b) {
            return b.votes - a.votes;
          });
					response.writeHead(200, {'Content-Type': MIME_TYPES.txt});
					response.end(JSON.stringify(replyList));
					console.log(JSON.stringify(replyList));
				break;	
				default:
					serveFile('.' + request.url, response);
				break;
			}
		break;
		case 'POST':
			console.log("[200] " + request.method + " to " + request.url);
			switch(urlParsed.pathname){
				case '/vote':
					var data = '';
					request.on('data', function(chunk) {
						data += chunk.toString();
					});
					request.on('end', function(){
						var contents = querystring.parse(data);
						var votes = {"tvotes": 0, "rvotes": 0};
						for (var i = 0; i < topics.length; i++){
							if(('tid_'+ topics[i].tid) == contents.tid){
								topics[i].votes += 1;
								votes.tvotes = topics[i].votes;
								break;
							}
						}
						for (var i = 0; i < replies.length; i++){
							if(('rid_'+ replies[i].rid) == contents.rid){
								replies[i].votes += 1;
								votes.rvotes = replies[i].votes;
								break;
							}
						}
						response.writeHead(200, {'Content-Type': MIME_TYPES.txt});
						response.end(JSON.stringify(votes));
					});
				break;
			}
		break;
		case 'PUT':
			console.log("[200] " + request.method + " to " + request.url);

			switch(urlParsed.pathname){
				case '/newTopic':
					var data = '';
					request.on('data', function(chunk) {
						data += chunk.toString();
					});
					request.on('end', function(){
						var contents = querystring.parse(data);
						var topic = {'tid': tid, 'link': contents.link, 'text': contents.text, 'votes': 0};
						topics.push(topic);
						tid += 1;
						response.writeHead(200, {'Content-Type': MIME_TYPES.txt});
						response.end(JSON.stringify(topic));
						console.log(JSON.stringify(topic));
					});
				break;
				case '/newReply':
					var data = '';
					request.on('data', function(chunk) {
						data += chunk.toString();
					});
					request.on('end', function(){
						var contents = querystring.parse(data);
						var reply = {'pid': contents.pid, 'rid': rid, 'text': contents.text, 'votes': 0}; 
						replies.push(reply);
						rid +=1;
						response.writeHead(200, {'Content-Type': MIME_TYPES.txt});
						response.end(JSON.stringify(reply));
						console.log(JSON.stringify(reply));
					});
				break;
			}
		break;
		default:
			console.log("[405] " + request.method + " to " + request.url);
			response.writeHead(405, {'Content-Type': MIME_TYPES.html});
			response.end('<html><head><title>405 - Method not supported</title></head><body><h1>Method not supported.</h1></body></html>');
		break;
	}
}

http.createServer(requestListener).listen(PORT);
console.log('Server running at http://127.0.0.1:' + PORT + '/');
