// Initialize app
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var fetch = require('node-fetch');
var app = express();
// Define JSON parsing mode for Events API requests
app.use(bodyParser.json())
// Define URLENCODED parsing mode for Events API requests
app.use(bodyParser.urlencoded({extended:false}));
// Get environment variables
var apiToken = process.env.API_TOKEN;
var channelId = process.env.CHANNEL_ID;
var clientId = process.env.CLIENT_ID;
var clientSecret = process.env.CLIENT_SECRET;
var webhookURL = process.env.WEBHOOK_URL;
var port = process.env.PORT;
var unsplashApiUrl = process.env.UNSPLASH_API_URL;
var unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
var unsplashSecretKey = process.env.UNSPLASH_SECRET_KEY;
// Declare arrays to store the URLs for pictures fetched from Unsplash.
let thumbnailPictures = [];
let regularPictures = [];
// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function(req, res) {
    res.send('Ngrok is working! Path Hit: ' + req.url);
});
// Handle Events API events
app.post('/message', function(req, res){
  if (req.body.challenge) {
    res.send({"challenge":req.body.challenge});
  } else {
    // Return a 200 to the event request
    res.status(200).end();
  }
});
// App gets the search keyword from the user.
app.post('/pic', function(req, res){
  // Return a 200 status back confirming that the command has been received.
  res.status(200).end();
  if (req.body.text) {
    unsplash(req.body.text);
  } else {
    sendResponse("Please specify a search keyword.");
  }
});
function unsplash(searchWord) {
  fetch(
    unsplashApiUrl +
      '/search/photos?&query=' +
      searchWord +
      '&client_id=' +
      unsplashAccessKey,
  )
    .then(function(response) {
      return response.json();
    })
    .then(function(response) {
      successfulResponse(response);
    })
    .catch(function() {
      failedResponse();
    });
}
function successfulResponse(response) {
  response.results.forEach(function(e) {
      thumbnailPictures.push(e.urls.thumb);
      regularPictures.push(e.urls.regular);
  });
  sendResponse(thumbnailPictures);
}
function failedResponse() {
  sendResponse("Your search keyword did not return any results. Please try a different one.");
}
// Post the respone back to the user in the channel
function sendResponse(response) {
  var data = {
    "token": apiToken,
    "channel": channelId,
    "text": JSON.stringify(response),
    "pretty": true
  };
  request.post(
    "https://slack.com/api/chat.postMessage",
    {
      form: data
    },
    function(err, resp, body) {
      if(err) {
        // If there's an HTTP error, log the error message
        console.log(err);
      } else{
        // Otherwise, log Slack API responses
        // console.log(body);
      }
    }
  );
}
// Listen for requests
var listener = app.listen(port, function () {
  console.log('Unsplash2Slack App is listening on port ' + listener.address().port);
});
