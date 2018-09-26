// Initialize app
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();

// Define JSON parsing mode for Events API requests
app.use(bodyParser.json())

// Get environment variables
var apiToken = process.env.API_TOKEN;
var channelId = process.env.CHANNEL_ID;
var clientId = process.env.CLIENT_ID;
var clientSecret = process.env.CLIENT_SECRET;
var webhookURL = process.env.WEBHOOK_URL;
const port = process.env.PORT;

// Handle Events API events

app.post('/message', function(req, res){
  if (req.body.challenge) {
    res.send({"challenge":req.body.challenge});
  } else {
    // Store details about the user
    var evt = req.body.event;
    var user_id = evt.user.id;
    var user_name = evt.user.profile.real_name_normalized;
    var status_text = evt.user.profile.status_text;
    var status_emoji = evt.user.profile.status_emoji;

    // If no full name set, use the username instead
    if(user_name == "") {
      user_name = evt.user.name;
    }

    // Return a 200 to the event request
    res.status(200).end();

    // Build the message payload
    buildMessage(user_id, user_name, status_text, status_emoji);
  }
});

// Build the message payload
function buildMessage(user_id, user_name, status_text, status_emoji) {

  if(status_text.length > 0) {
    // If their status contains some text
    var message = [
      {
        "pretext": user_name + " updated their status:",
        "text": status_emoji + " *" + status_text + "*"
      }
    ];
  } else {
    // If their status is empty
    var message = [
      {
        "pretext": user_name + " cleared their status"
      }
    ];
  }

  postUpdate(message);
}

// Post the actual message to a channel
function postUpdate(attachments) {
  var data = {
    "token": apiToken,
    "channel": channelId,
    "attachments": JSON.stringify(attachments),
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
        console.log(body);
      }
    }
  );
}

// Listen for requests
var listener = app.listen(port, function () {
  console.log('Unsplash2Slack App is listening on port ' + listener.address().port);
});
