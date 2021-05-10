import * as functions from "firebase-functions";
import {EventSubChannelRedemptionAddEventData} from "twitch-eventsub/lib/Events/EventSubChannelRedemptionAddEvent";
import {verifyEventSubMessage} from "../utils/event-sub-helper";
import {processEventSubRedemption} from "../game-engine/game";
import {pushDataToDatabasePath} from "../utils/database-helper";

/**
 * Will accept a callback from Twitch's EventSub system for Custom Reward Redemptions
 */
export const eventSubCustomRedemptionCallback = functions.https.onRequest(async (req, res) => {
  if(req.method==='POST'){
    //webhook_callback_verification
    if(req.body['challenge']){
      if(req.headers['Twitch-EventSub-Message-Type'.toLowerCase()]==='webhook_callback_verification' && verifyEventSubMessage(req.body,req.headers)){
        res.status(200).send(req.body['challenge']);
      }
      else {
        res.status(403).send('You No Should Be Here!');
      }
    }
    //Actual Event Processing
    else{
      try {
        if(verifyEventSubMessage(req.body,req.headers)){
          //Create data object from Body
          const eventSubChannelRedemptionAddEventData:EventSubChannelRedemptionAddEventData = req.body.event;
          processEventSubRedemption(eventSubChannelRedemptionAddEventData).catch((e)=>{
            console.log('processEventSubRedemption Error',e);
          });
          //No matter what, return status 200.
          res.status(200).send('OK');
        }
        else {
          res.status(403).send('forbidden');
        }
      }
      catch (e) {
        //If an API or DB call fails, return 500
        res.status(500).send('Something went wrong. Please try again.');
      }
    }
  }
  else {
    //If a GET request, 404 the webpage.
    res.status(404).send('How did you get here????');
  }
});

/**
 * This will log the authorization grants to the database.
 */
export const eventSubUserAuthorizationGrant = functions.https.onRequest(async (req, res) => {
  if(req.method==='POST'){
    //webhook_callback_verification
    if(req.body['challenge']){
      if(req.headers['Twitch-EventSub-Message-Type'.toLowerCase()]==='webhook_callback_verification' && verifyEventSubMessage(req.body,req.headers)){
        res.status(200).send(req.body['challenge']);
      }
      else {
        res.status(403).send('You No Should Be Here!');
      }
    }
    //Actual Event Processing
    else{
      try {
        if(verifyEventSubMessage(req.body,req.headers)){
          await pushDataToDatabasePath(req.body,`test/UserAuthorizationGrant/`);
          //No matter what, return status 200.
          res.status(200).send('OK');
        }
        else {
          res.status(403).send('forbidden');
        }
      }
      catch (e) {
        //If an API or DB call fails, return 500
        res.status(500).send('Something went wrong. Please try again.');
      }
    }
  }
  else {
    //If a GET request, 404 the webpage.
    res.status(404).send('How did you get here????');
  }
});
