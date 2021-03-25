import {EventSubChannelRedemptionAddEventData} from "twitch-eventsub/lib/Events/EventSubChannelRedemptionAddEvent";

/**
 * Describes the Quest itself
 */
export interface QuestData {
  name:string; //Public Name. Limit 45 characters
  description:string; //Public Description to be put into chat when it starts. Limit 500 characters.
  shortDescription:string; //Description for Reward. Limit 200 characters.
  duration:number; //in milliseconds
  color:string; //Hex Color code for background on Twitch's dashboard.
  boss:BossData;
  attacks:AttackData[]; //The available attacks in a quest
}

/**
 * This will describe the boss of a quest.
 */
export interface BossData {
  name:string; //Public Name
  description:string; //Public Description
  incrementAdjustment:number; //How much the boss changes per win/losses
  minHPMultipler:number; //Minimum multiplier used for determining HP. Will be multiplied on the win/losses Ratio.
  maxHPMultipler:number; //Maximum multiplier used for determining HP. Will be multiplied on the win/losses Ratio.
}

/**
 * Describes an Attack
 */
export interface AttackData {
  name:string; //Public Name
  description:string; //Public Description
  type:'Physical' | 'Magical' | 'Spirit'; //Can be used for logic for bosses weaknesses.
  damage:number; //Amount that will be deducted from Boss's HP per attack.
  color:string; //Hex Color code for background on Twitch's dashboard.
  maxPerQuest:number; //Time between uses in seconds.
  hpUnlockPercent:number; //The HP% that this attack is unlocked during a quest.
  twitchRewardId?:string; //Once a reward is created, this will store the ID.
}

/**
 * Describes a user's attack
 */
export interface UserAttackData {
  userId:string; //Twitch's User's ID
  channelId:string //Channel's Twitch ID
  attackData:AttackData;
  twitchRedemption:EventSubChannelRedemptionAddEventData
}

/**
 * This is what will be stored in the database after a quest is completed.
 */
export interface QuestResult {
  quest:QuestData;
  startingViewerCount:number;
  participants?:number;
  userAttacks?: { [key:string]:UserAttackData };
  win?:boolean;
}

/**
 * This will be in the database when a quest starts.
 */
export interface CurrentQuestData {
  startingHP:number;
  currentHP:number;
  currentQuestResult:QuestResult;
  twitchRewardId?:string; //This will be saved once the start quest reward is created.
  startedAt?:number; //Will be populated once someone starts quest. If reward is deleted before quest started, then don't regen quest, instead just start current quest again.
}

export interface WinLossData {
  wins:number;
  losses:number;
}
