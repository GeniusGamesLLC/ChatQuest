import * as admin from "firebase-admin";
import {getTokenInfo, StaticAuthProvider} from "twitch-auth";
import {getClientId} from "./env-helper";
import {ApiClient} from "twitch";
import {getIsAdminPath} from "../database/database-structure";

/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 * Also saves the twitchAccessToken to the datastore at /twitchAccessToken/$uid
 *
 * @param userID
 * @param displayName
 * @param photoURL
 * @param email
 *
 * @return {Promise<string>} The Firebase custom auth token in a promise.
 */
export async function createFirebaseAccount(userID:string, displayName:string, photoURL:string, email?:string):Promise<string> {
    // The UID we'll assign to the user.
    const uid = `${userID}`;
    // Create or update the user account.
    try {
      //Try and update user, if it exists.
      await admin.auth().updateUser(uid, {
        displayName: displayName,
        photoURL: photoURL,
        email: email,
        emailVerified: !!(email)
      });
      //Check if user is an admin
      try{
        await updateAdmin(uid);
      }
      catch (e) {
        //Do Nothing, we don't care ATM.
      }
      return await admin.auth().createCustomToken(uid);
    } catch (error) {
      //If the user doesn't exist from the update, create a new user in auth.
      if (error.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid: uid,
          displayName: displayName,
          photoURL: photoURL,
          email: email,
          emailVerified: !!(email)
        });
        //Check if user is an admin
        try{
          await updateAdmin(uid);
        }
        catch (e) {
          //Do Nothing, we don't care ATM.
        }
        try {
          return await admin.auth().createCustomToken(uid);
        } catch (error) {
          throw new Error(error);
        }
      }
      else {
        //Some other error besides user didn't exist, so reject that error.
        throw new Error(error);
      }
    }
}

/**
 * Check the database for list of admins.
 * @param uid
 */
async function updateAdmin(uid:string) {
  try{
    const snapshot = await admin.database().ref(getIsAdminPath(uid)).once('value');
    const isAdmin = !!snapshot.val();
    if(isAdmin) {
      const user = await admin.auth().getUser(uid);
      let customClaims = user.customClaims || {};
      customClaims.admin = true;
      await admin.auth().setCustomUserClaims(uid,customClaims);
    }
    else{
      let user = await admin.auth().getUser(uid);
      let customClaims = user.customClaims || {};
      if(!!customClaims.admin) {
        customClaims.admin = false;
        await admin.auth().setCustomUserClaims(uid,customClaims);
      }
    }
  }
  catch (e) {
    throw new Error(e);
  }
}

/**
 * This will get a firebase auth token based on the twitchAccessToken provides.
 * Will throw an error if the access token is not valid.
 *
 * @param accessToken
 */
export const getFirebaseAuthTokenFromTwitchAccessToken = async (accessToken:string)=>{
  try{
    await getTokenInfo(accessToken);
    const twitchClient:ApiClient = new ApiClient({authProvider:new StaticAuthProvider(getClientId(), accessToken)});
    const user = await twitchClient.helix.users.getMe();
    return await createFirebaseAccount(user.id, user.name, user.profilePictureUrl);
  }
  catch (e) {
    throw new Error(e);
  }
};
