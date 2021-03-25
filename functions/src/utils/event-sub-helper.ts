import {HelixEventSubSubscription} from "twitch";
import {getAppTwitchClient} from "./twitch-api-client-helper";
import {getEventSubRedemptionCallbackUrl} from "./env-helper";

const crypto = require('crypto');
/**
 * Set this between 10 and 100 characters. This will be the eventsubSecret the webhook header uses to create the signed signature.
 */
export const eventSubSecret = '6842397101478520369';

/**
 * Will take req.body and req.headers from the eventsub webhook post request, and verifyWebhookMessage the signature.
 * @param body
 * @param headers
 */
export const verifyEventSubMessage = (body: any, headers: any)=>{
  return headers['Twitch-EventSub-Message-Signature'.toLowerCase()] == createSignature(body,headers);
};

/**
 * Creates the sha256 signature from req.body and req.headers
 * @param body
 * @param headers
 */
const createSignature = (body: any, headers: any)=>{
  let hmacMessage = headers['Twitch-EventSub-Message-Id'.toLowerCase()] + headers['Twitch-EventSub-Message-Timestamp'.toLowerCase()] + JSON.stringify(body);
  let signature = crypto.createHmac('sha256',eventSubSecret).update(hmacMessage).digest('hex');
  return 'sha256=' + signature;
};

/**
 *
 * @param channelID
 * @param eventSubSubscriptionType
 */
export const subscribeBroadcasterToEventSubCustomRedemptionAddTopic = async (channelID:string):Promise<HelixEventSubSubscription> => {
  try {
    const twitchClient = await getAppTwitchClient();
    return await twitchClient.helix.eventSub.createSubscription(
      'channel.channel_points_custom_reward_redemption.add',
      '1',
      {
        "broadcaster_user_id": channelID
      },
      {
        "method": 'webhook',
        "callback": getEventSubRedemptionCallbackUrl(),
        "secret": eventSubSecret
      }
    );
  }
  catch (e) {
    throw new Error(e);
  }
};
