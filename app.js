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
// Declare array to store response received from Unsplash
let unsplashResponse = [];
// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function(req, res) {
    res.send('Ngrok is working! Path Hit: ' + req.url);
});
// Handle Events API events
app.post('/eventNotifications', function(req, res){
  if (req.body.challenge) {
    res.send({"challenge":req.body.challenge});
  } else {
    // Return a 200 to the event request
    res.status(200).end();
  }
});
// User shuffles or sends picture to post
app.post('/select', function(req, res){
  // Return a 200 status back confirming that the command has been received
  res.status(200).end();
  parsedObject = JSON.parse(req.body.payload);
  if (parsedObject.actions[0].name === "send") {
    // If the user has made the selection then cancel the 'selection window' first
    cancelCommand(parsedObject.response_url);
    // And then post the selected picture
    postPicture(unsplashResponse[parseInt(parsedObject.actions[0].value)].urls.thumb);
  } 
  else if (parsedObject.actions[0].name === "shuffle") {
    pickAPicture(parsedObject.user.id, parseInt(parsedObject.actions[0].value));
  }
  else if (parsedObject.actions[0].name === "cancel") {
    // Only option left for 'req.body.actions.value' is 'cancel' so just cancel the conversation
    // Otherwise just cancel the request
    cancelCommand(parsedObject.response_url);
  }
});
// App gets the search keyword from the user
app.post('/pic', function(req, res){
  // Return a 200 status back confirming that the command has been received
  res.status(200).end();
  if (req.body.text) {
    unsplash(req.body.user_id, req.body.text);
  } else {
    sendResponse(req.body.user_id, "Oops! You didn't provide any text!");
  }
});
function unsplash(whoSendIt, searchWord) {
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
      if (response.results.length === 0) {
        // Array is empty
        failedResponse(whoSendIt);
      } else {
        // Array is filled
        successfulResponse(whoSendIt, response);
      }
    })
    .catch(function(error) {
      failedResponse(whoSendIt);
    });
}
function successfulResponse(whoSendIt, response) {
  // If the response is successful then empty the array just in case it is filled
  unsplashResponse.length = 0;
  // If response is successful then store the response from Unsplash and let user pick a picture
  unsplashResponse = response.results;
  pickAPicture(whoSendIt, 0);
}
function failedResponse(whoSendIt) {
  sendResponse(whoSendIt, "Oops! We couldn't find anything. You can use your imagination.");
}
// Post the respone back to the user in the channel
function sendResponse(whoSendIt, responseString) {
  responseString = responseString.concat(' ', ":simple_smile:");
  var response = [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": responseString
      }
    }
  ];
  var data = {
    "token": apiToken,
    "channel": channelId,
    "user": whoSendIt,
    "blocks": JSON.stringify(response),
    "pretty": true
  };
  request.post(
    "https://slack.com/api/chat.postEphemeral",
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
function pickAPicture(whoSendIt, index) {
  var response = [{
        "callback_id": "picturesFromUnsplash",
        "pretext": "This is what I have found.",
        "author_name": "JabarJung Sandhu",
        "author_link": "https://jabarjungsandhu.com",
        "title": "Courtsey of Unsplash",
        "title_link": "https://unsplash.com",
        "text": "*Please shuffle through pictures and select one to send:*",
        "image_url": unsplashResponse[index].urls.thumb,
        "fallback": "This is what I have found.",
        "actions": [
            {
              "name": "send",
              "value": String(index),
              "type": "button",
              "text": "Send",
              "style": "primary"
            },
            {
              "name": "shuffle",
              "value": String(index+1),
              "type": "button",
              "text": "Shuffle",
              "style": "default"
            },
            {
              "name": "cancel",
              "value": "cancel",
              "type": "button",
              "text": "Cancel",
              "style": "danger"
            }
        ]
      }];
  var data = {
    "token": apiToken,
    "channel": channelId,
    // Mentioning "content-type" is optional
    // "content-type": 'application/json',
    "user": whoSendIt,
    "attachments": JSON.stringify(response),
    "pretty": true
  };
  request.post(
    "https://slack.com/api/chat.postEphemeral",
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
    "as_user": true,
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
// Cancel the command
function cancelCommand(responseURL) {
  var response = {
    "text": null,
    "response_type": "ephemeral",
    "replace_original": true,
    "delete_original": true
  };
  var data = JSON.stringify(response);
  request.post(
    responseURL,
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
