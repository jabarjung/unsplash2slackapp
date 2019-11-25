# A Slack App to send images from Unsplash in Slack.

## Getting Started
I have named it 'Pikchar'. You can name it whatever when you install it. It works analogously to ‘Giphy’ app. The user can search for a keyword, shuffle through pictures and send one.

### Setting it up
1. Set up ngrok. Use the tutorial at this link to set it up: https://api.slack.com/tutorials/tunneling-with-ngrok. Use the port '4390' to set it up. After setting it up you will get a forwarding address which looks something like ' https://....ngrok.io'. Copy that from the Terminal to the clipboard. You will need it later while creating a new app at 'https://api.slack.com/apps'.
2. Clone the repo and add '.env' file under the root directory. '.env' file contains all of the environment variables. Add the following to the '.env' file:

```
API_TOKEN="xoxp-..."
CHANNEL_ID=""
PORT="4390"
UNSPLASH_API_URL="https://api.unsplash.com"
UNSPLASH_ACCESS_KEY=""
```

>1. You will get the API token from the Slack app you create at 'https://api.slack.com/apps'. It starts with xoxp. When creating the app, following are the basic settings you have to configure:
>> 1. Turn the interactive components on. For the 'Request URL' use the ngrok forwarding address suffixed by '/select'.
>> 2. Create a slash command. I have created a slash command called '/pikchar'. You can create whatever you like. For the 'Request URL' use the ngrok forwarding address suffixed by '/pikchar'. You just have to suffix it by the name of the slash command you create.
>> 3. For the 'Redirect URLs' use the ngrok forwarding address suffixed by '/oauth'.
>> 4. Set the following scopes: 'channels:history', 'chat:write:bot', and 'commands'.
>> 5. Enable the events and set the 'Request URL' to the ngrok forwarding address suffixed by '/eventNotifications'.
>2. Insert the channel id where the Slack app is installed.
>3. I have set the port to '4390'. You can change it to whatever you want. You will use this port while setting up ngrok.
>4. You will get Unsplash access key when you create an app at Unsplash. We won't need the secret key as we are not requesting any private user data.
3. Run 'node app.js' from the app root folder and the app will start listening on the port '4390'.
4. Go to your channel in Slack and you can run a command like '/pikchar [search term]'.

## Author

* **Jabarjung Sandhu**
