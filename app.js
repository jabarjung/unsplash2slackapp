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
require('dotenv').config();
var apiToken = process.env.API_TOKEN;
var channelId = process.env.CHANNEL_ID;
var port = parseInt(process.env.PORT);
var unsplashApiUrl = process.env.UNSPLASH_API_URL;
var unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
// Declaring global variables
// Declare array to store response received from Unsplash
let unsplashResponse = [];
// Variable 'e' is declared so that the selection cycles through array if needed
var e = "";
// Variable to store index which was visible during last iteration (while shuffling)
// var visibleIndex = 0; // Setting a arbitrary value of 0
// Number of pictures to fetch
var itemsPerPage = '20';
// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', function(req, res) {
    res.send('Ngrok is working! Path Hit: ' + req.url);
});
// Redirect URL (Don't know if it's required but let's setup for now)
app.post('/oauth', function(req, res){
  res.status(200).end();
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
    // User selects thumbnail and small size is posted for now
    postPicture(parseInt(parsedObject.actions[0].value), parsedObject.callback_id);
  } 
  else if (parsedObject.actions[0].name === "shuffle") {
    /*
    // Turning off the randomness for shuffle index as I want to iterate through all of the result array
    if(parseInt(parsedObject.actions[0].value) === 0) {
      visibleIndex = unsplashResponse.length-1;
    } else {
      visibleIndex = parseInt(parsedObject.actions[0].value)-1;
    }
    // Generating the shuffle array index randomally to have the shuffle selection randomized
    var shuffleIndex = Math.floor(Math.random() * Math.floor(unsplashResponse.length-1));
    while (shuffleIndex === visibleIndex) {
      shuffleIndex = Math.floor(Math.random() * Math.floor(unsplashResponse.length-1));
    }
    */
    shuffleAPicture(parseInt(parsedObject.actions[0].value), parsedObject.response_url, parsedObject.callback_id);
  }
  else if (parsedObject.actions[0].name === "cancel") {
    // Only option left for 'req.body.actions.value' is 'cancel' so just cancel the conversation
    // Otherwise just cancel the request
    cancelCommand(parsedObject.response_url);
  }
});
// App gets the search keyword from the user
app.post('/pikchar', function(req, res){
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
      '&per_page=' +
      itemsPerPage +
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
        successfulResponse(whoSendIt, response, searchWord);
      }
    })
    .catch(function(error) {
      failedResponse(whoSendIt);
    });
}
function successfulResponse(whoSendIt, response, searchWord) {
  // If the response is successful then empty the array just in case it is filled
  unsplashResponse.length = 0;
  // If response is successful then store the response from Unsplash and let user pick a picture
  unsplashResponse = response.results;
  // Generating the first array index randomally to have the initial selection randomized
  pickAPicture(whoSendIt, Math.floor(Math.random() * Math.floor(unsplashResponse.length-1)), searchWord);
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
      } else {
        // console.log(resp);
        // console.log(body);
      }
    }
  );
}
// Let user pick a picture
function pickAPicture(whoSendIt, index, searchWord) {
  // To make sure that the selection doesn't fall out of array length
  if(index === (unsplashResponse.length-1)) {
    e = 0;
  } else {
    e = index+1;
  }
  var response = [{
        // Using 'callback_id' to store data
        "callback_id": "Posted using /pic " + searchWord,
        "author_name": "Photo by " + unsplashResponse[index].user.name + " on Unsplash",
        "author_link": unsplashResponse[index].user.links.html,
        "title": unsplashResponse[index].description,
        "title_link": unsplashResponse[index].links.download,
        "image_url": unsplashResponse[index].urls.thumb,
        "fallback": "https://unsplash.com",
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
              "value": String(e),
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
    "user": whoSendIt,
    "attachments": JSON.stringify(response),
    "pretty": true
  };
  request.post(
    "https://slack.com/api/chat.postEphemeral",
    {
      form: data
    },
    function(err) {
      if(err) {
        // If there's an HTTP error, log the error message
        console.log(err);
      }
    }
  );
}
// Let user shuffle a picture
function shuffleAPicture(index, responseURL, postedUsing) {
  // To make sure that the selection doesn't fall out of array length
  if(index === (unsplashResponse.length-1)) {
    e = 0;
  } else {
    e = index+1;
  }
  var response = {
        "attachments": [
          {
            // Using 'callback_id' to store data
            "callback_id": postedUsing,
            "author_name": "Photo by " + unsplashResponse[index].user.name + " on Unsplash",
            "author_link": unsplashResponse[index].user.links.html,
            "title": unsplashResponse[index].description,
            "title_link": unsplashResponse[index].links.download,
            "image_url": unsplashResponse[index].urls.thumb,
            "fallback": "https://unsplash.com",
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
                  "value": String(e),
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
          }
        ],
        "response_type": "ephemeral",
        "replace_original": true,
        "pretty": true
      };
  var data = JSON.stringify(response);
  request.post(
    responseURL,
    {
      form: data
    },
    function(err) {
      if(err) {
        // If there's an HTTP error, log the error message
        console.log(err);
      }
    }
  );
}
// Post the selected picture in the channel
function postPicture(index, postedUsing) {
  var response = [
      {
        "fallback": "https://unsplash.com",
        "author_name": "Photo by " + unsplashResponse[index].user.name + " on Unsplash",
        "author_link": unsplashResponse[index].user.links.html,
        "title": unsplashResponse[index].description,
        "title_link": unsplashResponse[index].links.download,
        "text": postedUsing,
        "image_url": unsplashResponse[index].urls.small,
        "alt_text": postedUsing
    }
  ];
  var data = {
    "token": apiToken,
    "channel": channelId,
    "as_user": true,
    "attachments": JSON.stringify(response),
    "pretty": true
  };
  request.post(
    "https://slack.com/api/chat.postMessage",
    {
      form: data
    },
    function(err) {
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
    function(err) {
      if(err) {
        // If there's an HTTP error, log the error message
        console.log(err);
      }
    }
  );
}
// Listen for requests
var listener = app.listen(port, function () {
  console.log('Pikchar App is listening on port ' + listener.address().port);
});
