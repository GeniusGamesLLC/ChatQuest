import * as functions from "firebase-functions";

export const getClientId = () =>{
  return functions.config().config.twitchextclientid;
};

export const getClientApiSecret = () =>{
  return functions.config().config.twitchextapisecret;
};

export const getClientExtSecret = () =>{
  return functions.config().config.twitchextsecret;
};

export const getBroadcasterRedirectUrl = () =>{
  return functions.config().config.broadcasterredirecturl;
};

export const getChatBotRedirectUrl = () =>{
  return functions.config().config.chatbotredirecturl;
};

export const getChatBotTwitchId = () =>{
  return functions.config().config.chatbottwitchid;
};

export const getEventSubRedemptionCallbackUrl = () =>{
  return functions.config().config.eventsubredemptioncallbackurl;
};

export const getEventSubUserAuthGrantCallbackUrl = () =>{
  return functions.config().config.eventsubuserauthgrantcallbackurl;
};
