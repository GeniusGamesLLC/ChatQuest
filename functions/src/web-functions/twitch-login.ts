import * as functions from "firebase-functions";
import {exchangeCode, getTokenInfo} from "twitch-auth";
import {getBroadcasterRedirectUrl, getChatBotRedirectUrl, getClientApiSecret, getClientId} from "../utils/env-helper";
import {setDataToDatabasePath} from "../utils/database-helper";
import {getChannelAccessTokenPath, getChatBotChatAccessTokenPath} from "../database/database-structure";
import {startQuest} from "../game-engine/game";
import {subscribeBroadcasterToEventSubCustomRedemptionAddTopic} from "../utils/event-sub-helper";

const BroadcasterScopes = "channel:read:redemptions channel:manage:redemptions";
const ChatBotScopes = "chat:read chat:edit";

/**
 * This will forward broadcaster to twitch to login, or process code= if present.
 */
export const broadcasterLogin = functions.https.onRequest(async (req, res) => {
  if(req.query.code) {
    try {
      const token = await exchangeCode(getClientId(),getClientApiSecret(),<string>req.query.code,getBroadcasterRedirectUrl());
      try {
        const tokenInfo = await getTokenInfo(token.accessToken);
        const channelId = tokenInfo.userId;
        await setDataToDatabasePath(token["_data"],getChannelAccessTokenPath(channelId));
        try{
          await subscribeBroadcasterToEventSubCustomRedemptionAddTopic(channelId);
        }
        catch (e) {
          console.log('subscribeBroadcasterToEventSubCustomRedemptionAddTopic error',e);
        }
        await startQuest(channelId);
        res.status(200).send('Login Complete! Future updates will allow you to change settings!');
      }
      catch (e) {
       res.status(500).send('Something went wrong with Login. Please try again later.');
      }
    }
    catch (e) {
      const twitchAuthURL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${getClientId()}&redirect_uri=${encodeURIComponent(getBroadcasterRedirectUrl())}&scope=${encodeURIComponent(BroadcasterScopes)}&force_verify=true`;
      res.redirect(twitchAuthURL);
    }
  }
  else{
    const twitchAuthURL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${getClientId()}&redirect_uri=${encodeURIComponent(getBroadcasterRedirectUrl())}&scope=${encodeURIComponent(BroadcasterScopes)}&force_verify=true`;
    res.redirect(twitchAuthURL);
  }
});

/**
 * This will be used to login with the chatbot to setup chatbot permissions.
 */
export const chatBotLogin = functions.https.onRequest(async (req, res) => {
  if(req.query.code) {
    try {
      const token = await exchangeCode(getClientId(),getClientApiSecret(),<string>req.query.code,getChatBotRedirectUrl());
      const tokenInfo = await getTokenInfo(token.accessToken);
      const channelId = tokenInfo.userId;
      await setDataToDatabasePath(token["_data"],getChatBotChatAccessTokenPath(channelId));
      res.status(200).send('Login Complete! ChatBot Setup!');
    }
    catch (e) {
      res.status(200).send(`Error Setting Up ${e.toString()}`);
    }
  }
  else{
    const twitchAuthURL = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${getClientId()}&redirect_uri=${encodeURIComponent(getChatBotRedirectUrl())}&scope=${encodeURIComponent(ChatBotScopes)}&force_verify=true`;
    res.redirect(twitchAuthURL);
  }
});
