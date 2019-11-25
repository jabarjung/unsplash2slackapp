# A Slack App to send images from Unsplash in Slack.

I have named it 'Pikchar'. You can name it whatever you want when you install it. It works analogously to the ‘Giphy’ app. The user can search for a keyword, shuffle through pictures, and select one to send.

### Setting it up
>1. Set up ngrok. Use the tutorial at this link to set it up: https://api.slack.com/tutorials/tunneling-with-ngrok. Use '4390' as port. After configuring it up you will get a forwarding address which looks something like ' https://....ngrok.io'. Copy that from the terminal to the clipboard. You will need it later while creating a new app at 'https://api.slack.com/apps'.
>2. Clone the repo and add '.env' file under the root directory. '.env' file contains all of the environment variables. Add the following to the '.env' file:

```
API_TOKEN="xoxp-..."
CHANNEL_ID=""
PORT="4390"
UNSPLASH_API_URL="https://api.unsplash.com"
UNSPLASH_ACCESS_KEY=""
```

>>1. You will get the API token from the Slack app you create at 'https://api.slack.com/apps'. It starts with xoxp. When creating the app, following are the basic settings you have to configure:
>>> 1. Turn the interactive components on. For the 'Request URL', use '/select' suffixed to the ngrok forwarding address.
>>> 2. Create a slash command. I have created a slash command called '/pikchar'. You can create whatever you like. For the 'Request URL', use '/pikchar' suffixed to the ngrok forwarding address. You just have to suffix the slash command you create to the request URL.
>>> 3. For the 'Redirect URLs', use '/oauth' suffixed to the ngrok forwarding address.
>>> 4. Set the following scopes: 'channels:history', 'chat:write:bot', and 'commands'.
>>> 5. Enable the events and use '/eventNotifications' suffixed to the ngrok forwarding address as the 'Request URL'. 
>>2. Insert the channel id of the channel where the Slack app is installed.
>>3. I have set the port to '4390'. You can change it to whatever you want. You will use this port while setting up ngrok.
>>4. You will get Unsplash access key when you create an app at Unsplash. You won't need the secret key as you are not requesting any user's private data.
>3. Run 'node app.js' from the app root folder and the app will start listening on the port '4390'.
>4. Go to your channel in Slack and you can run a command e.g. '/pikchar [search term]'.

## Author

* **Jabarjung Sandhu**
