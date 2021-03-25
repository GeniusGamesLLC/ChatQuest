import {
  getDataFromDatabasePath,
  incrementNumberAtDatabasePath,
  pushDataToDatabasePath,
  setDataToDatabasePath
} from "../utils/database-helper";
import {
  getCurrentQuestAttackDataPath,
  getCurrentQuestDataPath, getCurrentQuestHPPath, getCurrentQuestUserAttacksDataPath, getLossesDataPath,
  getQuestDataPath, getQuestResultsPath,
  getWinLossDataPath, getWinsDataPath
} from "../database/database-structure";
import {AttackData, CurrentQuestData, QuestData, QuestResult, UserAttackData, WinLossData} from "./game-models";
import {ApiClient, HelixCustomReward} from "twitch";
import {getChannelTwitchClient} from "../utils/twitch-api-client-helper";
import {getBossHP} from "./boss";
import {HelixCreateCustomRewardData} from "twitch/lib/API/Helix/ChannelPoints/HelixChannelPointsApi";
import {EventSubChannelRedemptionAddEventData} from "twitch-eventsub/lib/Events/EventSubChannelRedemptionAddEvent";
import {sendChatMessageFromChatBot} from "../utils/twitch-chat-bot";

/**
 * This will check for a current quest, and attempt to start a new quest and create the start quest reward.
 * @param channelId
 */
export const startQuest = async (channelId:string)=>{
  try{
    const twitchClient:ApiClient = await getChannelTwitchClient(channelId);

    //Check if Current Quest Data exists and Is not started.
    let currentQuestData:CurrentQuestData = await getDataFromDatabasePath(getCurrentQuestDataPath(channelId));
    if(currentQuestData && !currentQuestData.startedAt){
      //Check if the custom reward was already created
      if(currentQuestData.twitchRewardId){
        const currentReward:HelixCustomReward | null = await twitchClient.helix.channelPoints.getCustomRewardById(channelId,currentQuestData.twitchRewardId);
        console.log('Current Reward Lookup',!!currentReward);
        //Check if custom reward was deleted (maybe by broadcaster manually)
        if(!currentReward){
          const reward = await twitchClient.helix.channelPoints.createCustomReward(channelId,createStartQuestCustomRewardData(currentQuestData.currentQuestResult.quest));
          console.log('Created Reward',reward.id);
          currentQuestData.twitchRewardId=reward.id;
        }
      }
      await setDataToDatabasePath(currentQuestData,getCurrentQuestDataPath(channelId));
      sendChatMessageFromChatBot(channelId,['New Quest Waiting! Use Channel Points to start quest!'],true)
        .catch((e)=>{console.log('sendChatMessageFromChatBot error',e);});
    }
    //No current quest created yet
    else if(!currentQuestData){
      //await pushDataToDatabasePath({message:`Creating Quest from Scratch`},'/debug/debugLogs');
      //Pull all quests from the database
      const quests:{ [key:string]:QuestData } = await getDataFromDatabasePath(getQuestDataPath());
      //await pushDataToDatabasePath({message:`Pulled all quests`,data:quests},'/debug/debugLogs');

      //Grab a random quest
      const keys = Object.keys(quests);
      const questData:QuestData = quests[Math.floor(Math.random() * keys.length)];
      //await pushDataToDatabasePath({message:`Chose quest`,data:questData},'/debug/debugLogs');

      //Build out current quest object
      let questResult:QuestResult = {
        quest:questData,
        startingViewerCount:1
      };
      //Check stream for current viewers.
      const stream = await twitchClient.helix.streams.getStreamByUserId(channelId);
      if(stream){
        questResult.startingViewerCount=stream.viewers;
      }

      let winLossRatio:number = 1;


      const winLossData:WinLossData = await getDataFromDatabasePath(getWinLossDataPath(channelId));
      if(winLossData) {
        if (winLossData.wins && winLossData.losses) {
          winLossRatio = winLossData.wins / winLossData.losses;
        } else if (winLossData.wins) {
          winLossRatio = winLossData.wins;
        }
      }

      let bossHP:number = getBossHP(questResult.startingViewerCount,winLossRatio,questData);

      let newQuestData:CurrentQuestData = {
        startingHP: bossHP,
        currentHP: bossHP,
        currentQuestResult: questResult
      };

      //Create custom reward to start game
      const reward = await twitchClient.helix.channelPoints.createCustomReward(channelId,createStartQuestCustomRewardData(newQuestData.currentQuestResult.quest));
      newQuestData.twitchRewardId=reward.id;

      await setDataToDatabasePath(newQuestData,getCurrentQuestDataPath(channelId));
      sendChatMessageFromChatBot(channelId,['New Quest Waiting! Use Channel Points to start quest!'],true)
        .catch((e)=>{console.log('sendChatMessageFromChatBot error',e);});
    }
  }
  catch (e) {
    throw new Error(e);
  }
};

/**
 * Will take the current quest data, look through the attacks, and create the attacks if needed.
 * If created, will save current quest data back to database.
 * @param channelId
 * @param currentQuestData
 */
export const createAttackRewards = async (channelId:string,currentQuestData:CurrentQuestData) => {
  try {
    const twitchClient:ApiClient = await getChannelTwitchClient(channelId);
    let needToSave:boolean = false;
    for(let attack of currentQuestData.currentQuestResult.quest.attacks){
      let currentHPPercent = currentQuestData.currentHP / currentQuestData.startingHP * 100;
      if(!attack.twitchRewardId && attack.hpUnlockPercent>=currentHPPercent){
        const helixCustomReward:HelixCustomReward = await twitchClient.helix.channelPoints.createCustomReward(channelId,createAttackCustomRewardData(attack));
        attack.twitchRewardId = helixCustomReward.id;
        needToSave = true;
      }
    }
    if(needToSave){
      //Save attacks only to the database, as other attacks may have come in and incremented the HP.
      await setDataToDatabasePath(currentQuestData.currentQuestResult.quest.attacks,getCurrentQuestAttackDataPath(channelId));
    }
  }
  catch (e) {
    throw new Error(e);
  }
};

/**
 * Will take the attack data, and return a HelixCreateCustomRewardData.
 * @param attackData
 */
const createAttackCustomRewardData = (attackData:AttackData):HelixCreateCustomRewardData =>{
  return {
    "title":`Chat Quest: ${attackData.name}`,
    "cost": 100,
    "prompt":`${attackData.description} Does ${attackData.damage} damage.`,
    "isEnabled": true,
    "backgroundColor": attackData.color,
    "userInputRequired": false,
    "maxRedemptionsPerStream": null,
    "maxRedemptionsPerUserPerStream": attackData.maxPerQuest,
    "globalCooldown": null,
    "autoFulfill":false
  };
};

/**
 * Will take the currentQuestData
 * @param questData
 */
const createStartQuestCustomRewardData = (questData:QuestData):HelixCreateCustomRewardData =>{
  return {
    "title":`Chat Quest: ${questData.name}`,
    "cost": 100,
    "prompt":questData.shortDescription,
    "isEnabled": true,
    "backgroundColor": questData.color,
    "userInputRequired": false,
    "maxRedemptionsPerStream": 1,
    "maxRedemptionsPerUserPerStream": null,
    "globalCooldown": null,
    "autoFulfill":false
  };
};

/**
 * Processes the data that gets sent from Twitch.
 * @param eventSubChannelRedemptionAddEventData
 */
export const processEventSubRedemption = async (eventSubChannelRedemptionAddEventData:EventSubChannelRedemptionAddEventData) => {
  const twitchClient = await getChannelTwitchClient(eventSubChannelRedemptionAddEventData.broadcaster_user_id);
  let currentQuestData:CurrentQuestData = await getDataFromDatabasePath(getCurrentQuestDataPath(eventSubChannelRedemptionAddEventData.broadcaster_user_id));
  //Check if this is a starting quest redemption
  if(eventSubChannelRedemptionAddEventData.reward.id===currentQuestData.twitchRewardId){
    //Quest already started, cancel and refund redemption
    if(currentQuestData.startedAt){
      await twitchClient.helix.channelPoints.updateRedemptionStatusByIds(
        eventSubChannelRedemptionAddEventData.broadcaster_user_id,
        eventSubChannelRedemptionAddEventData.reward.id,
        [eventSubChannelRedemptionAddEventData.id],
        'CANCELED'
      );
      sendChatMessageFromChatBot(eventSubChannelRedemptionAddEventData.broadcaster_user_id,[`@${eventSubChannelRedemptionAddEventData.user_name} The quest is already starting. Refunding points.`])
        .catch((e)=>{console.log('sendChatMessageFromChatBot error',e);});
    }
    //Quest is not started
    else{
      //Start Quest and save to DB
      currentQuestData.startedAt=new Date().getTime();
      await setDataToDatabasePath(currentQuestData,getCurrentQuestDataPath(eventSubChannelRedemptionAddEventData.broadcaster_user_id));
      //Fulfill Redemption
      await twitchClient.helix.channelPoints.updateRedemptionStatusByIds(
        eventSubChannelRedemptionAddEventData.broadcaster_user_id,
        eventSubChannelRedemptionAddEventData.reward.id,
        [eventSubChannelRedemptionAddEventData.id],
        'FULFILLED'
      );
      //Delete "Start Quest" reward.
      await twitchClient.helix.channelPoints.deleteCustomReward(eventSubChannelRedemptionAddEventData.broadcaster_user_id,eventSubChannelRedemptionAddEventData.reward.id);
      //Create attack rewards
      await createAttackRewards(eventSubChannelRedemptionAddEventData.broadcaster_user_id,currentQuestData);
      //Announce Quest Start in Chat.
      sendStartQuestChatMessage(eventSubChannelRedemptionAddEventData.broadcaster_user_id,currentQuestData)
        .catch((e)=>{
          console.log('sendStartQuestChatMessage error',e);
        });
    }
  }
  //Look through attacks to see if it is an attack reward.
  else{
    for(let attack of currentQuestData.currentQuestResult.quest.attacks){
      if(eventSubChannelRedemptionAddEventData.reward.id===attack.twitchRewardId){
        if(currentQuestData.startedAt && currentQuestData.startedAt + (30 * 60 * 1000) < new Date().getTime()){
          await twitchClient.helix.channelPoints.updateRedemptionStatusByIds(
            eventSubChannelRedemptionAddEventData.broadcaster_user_id,
            eventSubChannelRedemptionAddEventData.reward.id,
            [eventSubChannelRedemptionAddEventData.id],
            'CANCELED'
          );
          await finishQuest(eventSubChannelRedemptionAddEventData.broadcaster_user_id);
        }
        else if(currentQuestData.currentHP > 0){
          let userAttackData:UserAttackData = {
            userId:eventSubChannelRedemptionAddEventData.user_id,
            channelId:eventSubChannelRedemptionAddEventData.broadcaster_user_id,
            attackData:attack,
            twitchRedemption:eventSubChannelRedemptionAddEventData,
          };
          //Increment database and save attack to database
          const transactionResult = await incrementNumberAtDatabasePath(getCurrentQuestHPPath(eventSubChannelRedemptionAddEventData.broadcaster_user_id),userAttackData.attackData.damage * -1);
          const newBossHP = transactionResult.snapshot.val();
          console.log('newBossHP',newBossHP);
          await pushDataToDatabasePath(userAttackData,getCurrentQuestUserAttacksDataPath(eventSubChannelRedemptionAddEventData.broadcaster_user_id));
          await createAttackRewards(eventSubChannelRedemptionAddEventData.broadcaster_user_id,await getDataFromDatabasePath(getCurrentQuestDataPath(eventSubChannelRedemptionAddEventData.broadcaster_user_id)));
          /*
          const originalHPPercent = currentQuestData.currentHP / currentQuestData.startingHP * 100;
          const newHPPercent = newBossHP / currentQuestData.startingHP * 100;
          */
          //Check if that attack killed boss.
          if(newBossHP<=0){
            sendChatMessageFromChatBot(eventSubChannelRedemptionAddEventData.broadcaster_user_id,[`@${eventSubChannelRedemptionAddEventData.user_name} got the killing blow!`])
              .catch((e)=>{console.log('sendChatMessageFromChatBot error',e);});
            await finishQuest(eventSubChannelRedemptionAddEventData.broadcaster_user_id);
          }
          await twitchClient.helix.channelPoints.updateRedemptionStatusByIds(
            eventSubChannelRedemptionAddEventData.broadcaster_user_id,
            eventSubChannelRedemptionAddEventData.reward.id,
            [eventSubChannelRedemptionAddEventData.id],
            'FULFILLED'
          );
        }
        else{
          sendChatMessageFromChatBot(eventSubChannelRedemptionAddEventData.broadcaster_user_id,[`@${eventSubChannelRedemptionAddEventData.user_name} The boss is already slain! Refunding points.`])
            .catch((e)=>{console.log('sendChatMessageFromChatBot error',e);});
          await twitchClient.helix.channelPoints.updateRedemptionStatusByIds(
            eventSubChannelRedemptionAddEventData.broadcaster_user_id,
            eventSubChannelRedemptionAddEventData.reward.id,
            [eventSubChannelRedemptionAddEventData.id],
            'CANCELED'
          );
          await finishQuest(eventSubChannelRedemptionAddEventData.broadcaster_user_id);
        }
        break;
      }
    }
  }
};

/**
 * Will delete all rewards, announce the game is over, and create a new game.
 * @param channelId
 */
const finishQuest = async (channelId:string) => {
  console.log('Starting Finish Quest');
  try {
    let currentQuestData:CurrentQuestData = await getDataFromDatabasePath(getCurrentQuestDataPath(channelId));

    //Announce in chat quest complete
    console.log('sendFinishQuestChatMessage');
    sendFinishQuestChatMessage(channelId,currentQuestData)
      .catch((e)=>{
        console.log('sendFinishQuestChatMessage error',e);
      });

    const twitchClient = await getChannelTwitchClient(channelId);

    console.log('Starting Delete Custom Rewards');
    for(let attack of currentQuestData.currentQuestResult.quest.attacks){
      if(attack.twitchRewardId){
        await twitchClient.helix.channelPoints.deleteCustomReward(channelId,attack.twitchRewardId);
      }
    }
    console.log('Deleted Custom Rewards');
    //Push Current Results to Archive
    await pushDataToDatabasePath(currentQuestData.currentQuestResult,getQuestResultsPath(channelId));
    //Delete out current quest data
    await setDataToDatabasePath({},getCurrentQuestDataPath(channelId));
    if(currentQuestData.currentHP<=0){
      await incrementNumberAtDatabasePath(getWinsDataPath(channelId),1);
    }
    else{
      await incrementNumberAtDatabasePath(getLossesDataPath(channelId),1);
    }
    //Start New Quest
    await startQuest(channelId);
  }
  catch (e) {
   throw new Error(e);
  }
};

/**
 * Will construct the beginning of the quest chat message.
 * @param channelId
 * @param currentQuestData
 */
const sendStartQuestChatMessage = async (channelId:string,currentQuestData:CurrentQuestData) =>{
  sendChatMessageFromChatBot(channelId,[
    `New Quest Started: ${currentQuestData.currentQuestResult.quest.name}`,
    currentQuestData.currentQuestResult.quest.description,
    `Your objective is to kill ${currentQuestData.currentQuestResult.quest.boss.name}! ${currentQuestData.currentQuestResult.quest.boss.description}. Starting HP is ${currentQuestData.startingHP}`
  ],true)
    .catch((e)=>{console.log('sendChatMessageFromChatBot error',e);});
};

/**
 * Will construct the beginning of the quest chat message.
 * @param channelId
 * @param currentQuestData
 */
const sendFinishQuestChatMessage = async (channelId:string,currentQuestData:CurrentQuestData) =>{
  if(currentQuestData.currentHP<=0){
    sendChatMessageFromChatBot(channelId,[`${currentQuestData.currentQuestResult.quest.boss.name} has been slain! GG To all the participants!`],true)
      .catch((e)=>{console.log('sendChatMessageFromChatBot error',e);});
  }
  else{
    sendChatMessageFromChatBot(channelId,[`${currentQuestData.currentQuestResult.quest.boss.name} was victorious again chat! Try again next time!`],true)
      .catch((e)=>{console.log('sendChatMessageFromChatBot error',e);});
  }
};
