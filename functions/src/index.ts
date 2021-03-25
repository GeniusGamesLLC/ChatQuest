import * as admin from "firebase-admin";
require("firebase-functions/lib/logger/compat");

admin.initializeApp({
  databaseURL: "https://chat-quest-default-rtdb.firebaseio.com/"
});

exports.webFunctionsAppAccessToken = require("./web-functions/app-access-token");
exports.webFunctionsTwitchLogin = require("./web-functions/twitch-login");
exports.eventSub = require('./event-sub/event-sub');
exports.debug = require('./web-functions/debug');
