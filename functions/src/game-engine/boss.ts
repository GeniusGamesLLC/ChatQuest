import {AttackData, QuestData} from "./game-models";

/**
 * This will determine the starting HP for a boss based on the current viewer count when the quest starts,
 * the overall win/losses ratio for the channel, and the currently started quest.
 * @param startingViewerCount
 * @param winLossRatio
 * @param questData
 */
export const getBossHP = (startingViewerCount:number,winLossRatio:number,questData:QuestData) =>{
  if(startingViewerCount===0){
    startingViewerCount=1;
  }
  return startingViewerCount * getHPPerUser(winLossRatio,questData) * getBossMaxMultiplier(questData);
};

/**
 * Will return the HP Per User for a boss but will be limited to a min/max deduction around the base (50/50 win/losses ratio).
 * @param winLossRatio
 * @param questData
 */
const getHPPerUser = (winLossRatio:number,questData:QuestData)=>{
  //Avoid divide by 0 error if this is the first battle.
  if(winLossRatio===0) {
    winLossRatio=1;
  }
  let hp = getBaseHPPerUser(questData,winLossRatio);
  let baseHp = getBaseHPPerUser(questData,1); //Hard code to a 50/50 win/losses ratio for a baseline to determine min/max values.
  if(hp < baseHp * questData.boss.minHPMultipler) {
    hp = baseHp * questData.boss.minHPMultipler;
  }
  if(hp > baseHp * questData.boss.maxHPMultipler) {
    hp = baseHp * questData.boss.maxHPMultipler;
  }
  return hp;
};

/**
 * This is a base HP Per User based on the supplied win/losses ratio.
 * @param questData
 * @param winLossRatio
 */
const getBaseHPPerUser = (questData:QuestData,winLossRatio:number)=>{
  return getBossMaxMultiplier(questData) * getMaxDamagePerUser(questData) * winLossRatio / 2;
};

/**
 * This will return a multipler used for calculation of the Boss's HP.
 * This is to make sure boss will never be at 100% HP based on attacks, because not every user will hit 100% of attacks.
 * @param questData
 */
const getBossMaxMultiplier = (questData:QuestData)=>{
  return (1 - (questData.boss.incrementAdjustment/100));
};

/**
 *  Will just sum of the max damage per attack for all attacks that are in this quest.
 * @param questData
 */
const getMaxDamagePerUser = (questData:QuestData)=>{
  let maxDamage = 0;
  for(let attack of questData.attacks) {
    maxDamage += getMaximumDamagePerAttack(attack);
  }
  return maxDamage;
};

/**
 * Will calculate maximum damage per quest for the specified attack.
 * This determines a perfect redemption rate for cooldowns, which may be basically impossible.
 * @param attack
 */
const getMaximumDamagePerAttack = (attack:AttackData)=>{
  return attack.maxPerQuest * attack.damage;
};
