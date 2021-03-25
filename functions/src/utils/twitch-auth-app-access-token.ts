import * as admin from "firebase-admin";
import {AccessTokenData, getAppToken} from "twitch-auth";
import {getAppAccessTokenPath} from "../database/database-structure";
import {getClientApiSecret, getClientId} from "./env-helper";

/**
 * This will get a new App Access Token ans store it to the Database.
 */
export const updateAppAccessToken = async ()=>{
  try{
    const appAccessToken:AccessTokenData = (await getAppToken(getClientId(),getClientApiSecret()))['_data'];
    await updateAppAccessTokenDatabaseEntry(appAccessToken);
  }
  catch (e) {
    console.log('Update App Access Token Error',e);
    throw new Error(e);
  }
};

/**
 * Will update the database with a new App Access Token.
 */
function updateAppAccessTokenDatabaseEntry(accessTokenData:any) {
  accessTokenData['refreshed_on'] = new Date().getTime();
  return admin.database().ref(getAppAccessTokenPath()).set(accessTokenData);
}

/**
 * Will get the App Access Token from the database.
 */
export const getAppAccessTokenFromDatabase = async ()=>{
  try {
    const snapshot = await admin.database().ref(getAppAccessTokenPath()).once('value');
    return snapshot.val()['access_token'];
  }
  catch (error) {
    throw new Error(error);
  }
};
