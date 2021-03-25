import * as functions from "firebase-functions";
import {exchangeCode, getTokenInfo} from "twitch-auth";
import {AccessToken} from "twitch-auth/lib/AccessToken";
import {getChannelAccessTokenPath} from "../database/database-structure";
import {createFirebaseAccount, getFirebaseAuthTokenFromTwitchAccessToken} from "../utils/firebase-auth";
import {getBroadcasterRedirectUrl, getClientApiSecret, getClientExtSecret, getClientId} from "../utils/env-helper";
import {setDataToDatabasePath} from "../utils/database-helper";
import {getAppTwitchClient} from "../utils/twitch-api-client-helper";
import {ApiClient} from "twitch";
const cors = require('cors')({origin: true});
const jwt = require('jsonwebtoken');


/**
 * Will return a firebase Auth Token for the Shadow Flip Bot (Desktop Client) to log into Firebase.
 * This will accept either req.query.token from implicit auth flow (legacy bot code) or req.query.code from authorization code flow.
 */
//firebase deploy --only functions:getClientFirebaseAuthToken
export const getClientFirebaseAuthToken = functions.https.onRequest(async (req, res) => {
  cors(req, res,async () => {
    res.header('Content-Type', 'application/json');
    if(req.query && req.query.code) {
      try {
        const accessTokenObj:AccessToken = await exchangeCode(getClientId(),getClientApiSecret(),<string>req.query.code,getBroadcasterRedirectUrl());
        const firebaseAuthToken = await getFirebaseAuthTokenFromTwitchAccessToken(accessTokenObj.accessToken);
        const twitchAccessToken = await getTokenInfo(accessTokenObj.accessToken);
        await setDataToDatabasePath(accessTokenObj['_data'],getChannelAccessTokenPath(twitchAccessToken.userId));
        res.status(200).send(JSON.stringify({auth_token:firebaseAuthToken}));
      }
      catch (e) {
        res.status(500).send(`error:<br><PRE><CODE>${JSON.stringify(e, null, 4)}</CODE></PRE>`);
      }
    }
    else{
      res.status(404).send("No Code Provided");
    }
  });
});

/**
 * Will return a firebase Auth Token for the Shadow Flip Extension (Twitch Website Client) to log into Firebase.
 * This is a separate function because Twitch Extensions provide a JWT not an OAuth token.
 */
export const getExtClientFirebaseAuthToken = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    res.header('Content-Type', 'application/json');
    if(req.query && req.query.token) {
      const SECRET = Buffer.from(getClientExtSecret(), "base64");
      const decoded = jwt.verify(req.query.token, SECRET);
      if(decoded && decoded['user_id']) {
        try {
          const appTwitchClient:ApiClient = await getAppTwitchClient();
          const channel = await appTwitchClient.helix.users.getUserById(decoded['user_id']);
          if(channel) {
            const firebaseAuthToken = await createFirebaseAccount(decoded['user_id'],channel.name,channel.profilePictureUrl);
            res.status(200).send(JSON.stringify({auth_token:firebaseAuthToken}));
          }
          else {
            res.status(500).send("Error Getting Twitch Channel");
          }
        }
        catch (e) {
          res.status(400).send(JSON.stringify(e));
        }
      }
      else{
        res.status(400).send(JSON.stringify(decoded));
      }
    }
    else{
      res.status(404).send("No Token Provided");
    }
  });
});
