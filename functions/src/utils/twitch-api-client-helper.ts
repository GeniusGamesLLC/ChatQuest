import {
  getTokenInfo,
  RefreshableAuthProvider,
  StaticAuthProvider,
  AccessToken,
  AccessTokenData,
  TokenInfo
} from "twitch-auth";
import {ApiClient} from "twitch";
import {getClientApiSecret, getClientId} from "./env-helper";
import {getDataFromDatabasePath, setDataToDatabasePath} from "./database-helper";
import {getChannelAccessTokenPath} from "../database/database-structure";
import {getAppAccessTokenFromDatabase, updateAppAccessToken} from "./twitch-auth-app-access-token";
import * as admin from "firebase-admin";


/**
 * This will accept an AccessToken object, and create a refreshable auto provider.
 *
 * @param token
 */
export const getTwitchClient = async (token:AccessToken) =>{
  const authProvider = new RefreshableAuthProvider(
    new StaticAuthProvider(getClientId(), token.accessToken),
    {
      clientSecret:getClientApiSecret(),
      refreshToken: token.refreshToken,
      onRefresh: async (token) => {
        try {
          const tokenInfo:TokenInfo = await getTokenInfo(token.accessToken);
          await setDataToDatabasePath(tokenInfo['_data'],getChannelAccessTokenPath(tokenInfo.userId));
        }
        catch (e) {
          console.log('getTwitchClient:error',e);
        }
      }
    }
  );
  return new ApiClient({ authProvider });
};

/**
 * Will create a new App Access Token Twitch Client, if the access token is invalid, it will create a new one first.
 */
export const getAppTwitchClient = async ():Promise<ApiClient> =>{
  try{
    const appAccessToken:string = await getAppAccessTokenFromDatabase();
    const tokenInfo = await getTokenInfo(appAccessToken,getClientId());
    if(!tokenInfo) {
      try {
        await updateAppAccessToken();
      }
      catch (e) {
        throw new Error(e);
      }
    }
    return new ApiClient({authProvider:new StaticAuthProvider(getClientId(), appAccessToken)});
  }
  catch (e) {
    throw new Error(e);
  }
};

/**
 * Will create a new App Access Token Twitch Client, if the access token is invalid, it will create a new one first.
 */
export const getChannelTwitchClient = async (channelId:string):Promise<ApiClient> =>{
  try{
    const accessTokenData:AccessTokenData = await getDataFromDatabasePath(getChannelAccessTokenPath(channelId));
    const accessToken:AccessToken = new AccessToken(accessTokenData);
    //Create refreshable provider, which will then check if the token is current before being used, and will refresh, and save to DB if it needs to be refreshed.
    const authProvider = new RefreshableAuthProvider(
      new StaticAuthProvider(getClientId(), accessToken.accessToken),
      {
        clientSecret:getClientApiSecret(),
        refreshToken: accessToken.refreshToken,
        onRefresh: async (accessToken)=> {
          await admin.database()
            .ref(getChannelAccessTokenPath(channelId))
            //@ts-ignore
            .set(accessToken._data);
        }
      }
    );
    return new ApiClient({ authProvider });
  }
  catch (e) {
    throw new Error(e);
  }
};
