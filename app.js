// Initialize app
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();
const pageNo = '1';
const itemsPerPage = '10';

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
    var reply = "Please specify a search term.";
    sendResponse(reply);
  }
});

function unsplash(searchWord) {
  
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
