//**************APP PATHS**************
export const getAppAccessTokenPath = ()=>{
  return `/admin/appAccessToken`;
};

export const getChatBotChatAccessTokenPath = (channelId:string):string=>{
  return `/chatBotAccessToken/${channelId}/`;
};

export const getUserTransactionsPath = (userId:string,channelId:string):string => {
  return `/transactions/channel/${channelId}/user/${userId}`;
};

export const getChannelSettingsEventsubSubscriptonIdsPath = (channelId:string):string => {
  return `/channelSettings/${channelId}/settings/eventsubSubscriptonIds/`;
};

export const getChannelOnlinePath = (channelId:string):string => {
  return `/channelSettings/${channelId}/online`;
};

export const getChannelAccessTokenPath = (channelId:string):string =>{
  return `/twitchAccessToken/${channelId}`;
};

export const getIsAdminPath = (channelId:string):string =>{
  return `/admins/${channelId}/isAdmin`;
};


//**************GAME PATHS**************
export const getQuestDataPath = ():string =>{
  return `/gameConsts/questData/`;
};

export const getCurrentQuestDataPath = (channelId:string):string =>{
  return `/game/currentQuestData/${channelId}`;
};

export const getCurrentQuestAttackDataPath = (channelId:string):string =>{
  return `/game/currentQuestData/${channelId}/currentQuestResult/quest/attacks`;
};

export const getCurrentQuestUserAttacksDataPath = (channelId:string):string =>{
  return `/game/currentQuestData/${channelId}/currentQuestResult/userAttacks`;
};

export const getCurrentQuestHPPath = (channelId:string):string =>{
  return `/game/currentQuestData/${channelId}/currentHP`;
};

export const getWinLossDataPath = (channelId:string):string =>{
  return `/game/winLossData/${channelId}`;
};

export const getWinsDataPath = (channelId:string):string =>{
  return `/game/winLossData/${channelId}/wins`;
};

export const getLossesDataPath = (channelId:string):string =>{
  return `/game/winLossData/${channelId}/losses`;
};

export const getQuestResultsPath = (channelId:string):string =>{
  return `/game/questResults/${channelId}`;
};


