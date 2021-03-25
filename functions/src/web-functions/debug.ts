import * as functions from "firebase-functions";
import {getAppTwitchClient} from "../utils/twitch-api-client-helper";

export const getEventSubSubscriptions = functions.https.onRequest(async (req, res) => {
  const appTwitchClient = await getAppTwitchClient();
  const subs = await appTwitchClient.helix.eventSub.getSubscriptionsPaginated().getAll();
  const display:any[] = subs.map((sub: any)=>sub['_data']);
  res.send(
    `Sub count ${display.length}` +
    `<PRE><CODE>${JSON.stringify(display, null, 4)}</CODE></PRE>`
  );
});
