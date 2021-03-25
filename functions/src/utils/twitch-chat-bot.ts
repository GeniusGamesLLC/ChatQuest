import {AccessTokenData, RefreshableAuthProvider, refreshUserToken, StaticAuthProvider, AccessToken} from "twitch-auth";
import {getChatBotChatAccessTokenPath} from "../database/database-structure";
import * as admin from "firebase-admin";
import {ApiClient} from "twitch";
import {getDataFromDatabasePath} from "./database-helper";
import {ChatClient} from "twitch-chat-client";
import {Listener} from "@d-fischer/typed-event-emitter";
import {getChatBotTwitchId, getClientApiSecret, getClientId} from "./env-helper";

/**
 * This will create a twitch chat client, connect to chat, send a message, and disconnect and kill the listener to make sure nothing stays open on the cloud function.
 * @param channelId
 * @param message
 * @param isAction
 */
export const sendChatMessageFromChatBot = async (channelId:string,messages:string[],isAction:boolean=false) =>{
  try {
    //Get access token from Database
    const accessTokenData:AccessTokenData = await getDataFromDatabasePath(getChatBotChatAccessTokenPath(getChatBotTwitchId()));
    const accessToken:AccessToken = new AccessToken(accessTokenData);
    //Create refreshable provider, which will then check if the token is current before being used, and will refresh, and save to DB if it needs to be refreshed.
    const authProvider = new RefreshableAuthProvider(
      new StaticAuthProvider(getClientId(), accessToken.accessToken),
      {
        clientSecret:getClientApiSecret(),
        refreshToken: accessToken.refreshToken,
        onRefresh: async (accessToken)=> {
          await refreshUserToken(getClientId(),getClientApiSecret(),accessToken.refreshToken);
          await admin.database()
            .ref(getChatBotChatAccessTokenPath(getChatBotTwitchId()))
            //@ts-ignore
            .set(accessToken._data);
        }
      }
    );
    const twitchClient = new ApiClient({ authProvider });
    const channel = await twitchClient.helix.users.getUserById(channelId);
    if(channel) {
      const chatClient:ChatClient = new ChatClient(authProvider);
      await chatClient.connect();
      await (() => {return new Promise((resolve) => {
        const x:Listener = chatClient.onRegister(()=>{
          x.unbind();
          resolve(true);
        });
      });
      })();
      for(let message of messages){
        if(isAction){
          await chatClient.action(channel.name,message);
        }
        else{
          await chatClient.say(channel.name,message);
        }
      }
      await chatClient.quit();
    }
  }
  catch (e) {
    console.log('Cloud Chat Error',e);
    throw new Error(e);
  }
};
