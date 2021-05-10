import * as functions from "firebase-functions";
import {getAppTwitchClient} from "../utils/twitch-api-client-helper";
import {subscribeToEventSubUserAuthGrant} from "../utils/event-sub-helper";
import {HelixEventSubSubscription} from "twitch/lib/API/Helix/EventSub/HelixEventSubSubscription";

export const getEventSubSubscriptions = functions.https.onRequest(async (req, res) => {
  const appTwitchClient = await getAppTwitchClient();
  const subs = await appTwitchClient.helix.eventSub.getSubscriptionsPaginated().getAll();
  const display:any[] = subs.map((sub: any)=>sub['_data']);
  res.send(
    `Sub count ${display.length}` +
    `<PRE><CODE>${JSON.stringify(display, null, 4)}</CODE></PRE>`
  );
});


export const subscribeToUserAuthGrantEventsub = functions.https.onRequest(async (req, res) => {
  let sub:HelixEventSubSubscription = await subscribeToEventSubUserAuthGrant();
  res.send(
    `<PRE><CODE>${JSON.stringify(sub['_data'], null, 4)}</CODE></PRE>`
  );
});
