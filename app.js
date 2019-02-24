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
// User shuffles or sends picture to post
app.post('/select', function(req, res){
  // Return a 200 status back confirming that the command has been received.
  res.status(200).end();
  parsedObject = JSON.parse(req.body.payload);
  if (parsedObject.actions[0].value === "send") {
    postPicture(parsedObject.message.blocks[1].image_url);
  } 
  else if (parsedObject.actions[0].value === "shuffle") {
    // Do something here
  }
  else {
    // Only option left for 'req.body.actions.value' is 'cancel' so just cancel the conversation
    // Otherwise just cancel the request
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
  // If response is successful then store all of the required pictures and let the user pick one.
  response.results.forEach(function(e) {
      thumbnailPictures.push(e.urls.thumb);
      regularPictures.push(e.urls.regular);
  });
  pickAPicture();
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
// Let user pick a picture
function pickAPicture() {
  var response = [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Please shuffle through pictures and select one to send:*"
      }
    },
      {
      "type": "image",
      "title": {
        "type": "plain_text",
        "text": "This is what I have found.",
        "emoji": true
      },
      "image_url": thumbnailPictures[0],
      "alt_text": "This is what I have found."
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Send",
            "emoji": true
          },
          "value": "send"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Shuffle",
            "emoji": true
          },
          "value": "shuffle"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": true
          },
          "value": "cancel"
        }
      ]
    }
  ];
  var data = {
    "token": apiToken,
    "channel": channelId,
    // Mentioning "content-type" is optional
    // "content-type": 'application/json',
    "blocks": JSON.stringify(response),
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
      }
    }
  );
}
// Post the selected picture in the channel
function postPicture(selectedPictureURL) {
  var response = [
      {
      "type": "image",
      "title": {
        "type": "plain_text",
        "text": "This is the picture you selected.",
        "emoji": true
      },
      "image_url": selectedPictureURL,
      "alt_text": "This is the picture you selected."
    }
  ];
  var data = {
    "token": apiToken,
    "channel": channelId,
    // Mentioning "content-type" is optional
    // "content-type": 'application/json',
    "blocks": JSON.stringify(response),
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
      }
    }
  );
}
// Listen for requests
var listener = app.listen(port, function () {
  console.log('Unsplash2Slack App is listening on port ' + listener.address().port);
});
