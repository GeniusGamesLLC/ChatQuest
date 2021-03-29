# ChatQuest

To use our cloud setup, login to the following link to get this setup on your own twitch page. You will need to be live as the requirements for the rewards have a 
"Max Per Stream" limit.
https://us-central1-chat-quest.cloudfunctions.net/webFunctionsTwitchLogin-broadcasterLogin 

Once you login, the app will automatically create the first "Start Quest" reward. 
As a broadcater you have unlimited points to test with, but since it's based on viewer you may or may not be actually able to beat the boss by yourself.

If you delete the "start quest" reward manually, re-loggin in will re-setup the quest, but there is no current recovery if the rewards for actions are deleted, so please don't delete actions.
 
## Development Notes
This is a completely serverless cloud based game and chat bot. 

The OAuth login cloud function sets up the quest and database entries and subscribes to EventSub for that broadcaster.

All logic is handled on each EventSub event that comes into the app.
- This will start the game with the "Start Quest" Reward
- Attack and deduct HP from the boss with the action rewards
- Determine if the boss was killed, and "Complete" the quest in the database.
- Refund points because of async nature if the boss's HP is already at or below zero.
- Clear out the current quest from the database, and then start a new quest.

If a chat message needs to be sent to Twitch, it spins up a chat client, send the message, then disconnects from the chat server.
- This reduces costs because we don't need a server running 24/7 just to handle chat messages.
- The downfall to this process is there is a few second delay for each message because of the nature of serverless.
 - The upside, it is actually slows the game down a bit, and during testing it worked out really well because it didn't spam chat as fast as a natively running chatbot would.

## Future Enhancements

- Create an Overlay that will tie into OBS to show the current HP, game stats, etc.
  - Overlays will allow quicker processing of events as well, as they can do countdown timers, call APIs, and get real time feedback that serverless can't.
  - This will also keep costs down as the broadcaster's browser source on OBS will be doing the leg work, not our servers.
- Create an extension that shows similar information, and also allow more advanced actions/attacks by using bits.
- More feedback to users in chat if only using chat like HP progress every 10 or so percent.
- Customizable options for broadcasters for channel points. Currently defaulted to a static 100 just for demonstration purposes.
  - Some channels have been building up points for years and not being used. Some channels are used constantly.
  - Since we don't know the economy per channel, and there isn't any analytics APIs to do analysis on, we will have to just allow the broadcasters to set the cost.
- More error handling, and ability to manually reset games.
  - If the broadcaster deletes the action rewards mid game, there is no current recovery without manual database intervention.
  - If the broadcaster deletes the start game reward, simply logging back in will reset the game, so if they want to turn it off, they simply need to delete the reward before someone starts it again.

## Setting Env Variables
Rename env.sample.json to env.json
```
{
    "config": {
        "twitchextclientid": "", //Get this from the Twitch Developer Console
        "twitchextsecret": "", //Get this from the Twitch Developer Console
        "twitchextapisecret": "", //Get this from the Twitch Developer Console
        "broadcasterredirecturl": "", //This gets generated when you deploy your project to firebase
        "chatbotredirecturl": "", //This gets generated when you deploy your project to firebase
        "chatbottwitchid": "", //Put a Twitch ID here that will be used for the chatbot.
        "eventsubredemptioncallbackurl": "" //This gets generated when you deploy your project to firebase
    }
}
```
**Note** This was created as a Twitch Extension for future enhancements, but the core app doesn't require an extension. If you just run as  a normal OAuth application, the `twitchextsecret` can be left blank.

Navigate to `/functions` folder and run `npm run update:env`

The `update:env` uses a custom javascript file to convert a JSON to a command line script. 
Env variables on Firebase Functions are not stored in a `.env` file like normal `node.js` apps, they are pushed to the cloud via command line, and then accessed by the Firebase Functions helper js package.

## Firebase Setup

- Create a project on Firebase.
- Billing has to be turned and on the Blaze plan, since serverless can't call external APIs without billing enabled.
- **Note** You may need to run `firebase target` or `firebase init` to link to your own project, as it will be a different name than the original since you can't have projects globally with the same name on Firebase.
- run `firebase deploy` to push to Firebase
- On the firebase console, open the `Realtime Database` and navigate to `/gameConsts/questData`. Click the 3 dots and `Import JSON`. Import the file `QuestData.json` from the `GameData` folder to populate the quests in the database. 

## Login to Chatbot
Open the link generated after deploying to firebase for the function `chatBotLogin`.
This will ask you to login to Twitch, then save the token to Firebase's database to use as a cloud bot.
This will be automatically refreshed each time the send chat message function is called if it needs to be refreshed.

## Login to Twitch Broadcaster Account
Open the link generated by the function `broadcasterLogin`.
This will ask you to login to Twitch, then save the token to Firebase's database. 
This is used to create/delete Channel Point Rewards, and Fulfill or Cancel Reward Redemptions on the Twitch API.
