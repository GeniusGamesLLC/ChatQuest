import * as functions from "firebase-functions";
import {updateAppAccessToken} from "../utils/twitch-auth-app-access-token";

/**
 * Schedules App Access Token update every day at 6am
 */
//firebase deploy --only functions:scheduledUpdateAppAccessToken
export const scheduledUpdateAppAccessToken = functions.pubsub.schedule('5 6 * * *') //This will be run every day at 06:05 AM Eastern
  .timeZone('America/New_York') // Users can choose timezone - default is America/Los_Angeles
  .onRun(async (context) => {
    await updateAppAccessToken();
  });
