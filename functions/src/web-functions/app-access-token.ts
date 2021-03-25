import * as functions from "firebase-functions";
import {updateAppAccessToken} from "../utils/twitch-auth-app-access-token";

/**
 * Web Access to force an App Access Token refresh
 * https://us-central1-shadowflipext.cloudfunctions.net/webUpdateAppAccessToken
 */
export const webUpdateAppAccessToken = functions.https.onRequest(async (req, res) => {
  try{
    await updateAppAccessToken();
    res.status(200).send(`Successfully Updated App Access Token`);
  }
  catch (error) {
    res.status(400).send(`<PRE><CODE>${JSON.stringify(error, null, 4)}</CODE></PRE>`);
  }
  res.send('How did I get here?');
});
