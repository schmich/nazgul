var nazgul = require('./nazgul');
var async = nazgul.async,
    await = nazgul.await,
    Config = nazgul.Config,
    Log = nazgul.Log,
    sprintf = nazgul.sprintf,
    MongoClient = nazgul.MongoClient,
    Twitch = nazgul.Twitch;

var takeSnapshot = async(function() {
  Log.info('Chat viewer snapshot starting.');
  var db = await(MongoClient.connectAsync(Config.mongo));
  var viewers = db.collection('chat:viewers:snapshots');

  var timestamp = Date.now();

  var channels = Config.channels;
  for (var i = 0; i < channels.length; ++i) {
    var channel = channels[i];
    var url = sprintf('https://tmi.twitch.tv/group/user/%s/chatters', channel);

    var response = await(Twitch.request(url, false));
    var chatters = response.chatters;
    
    var doc = {
      ts: timestamp,
      ch: channel,
      mo: chatters.moderators,
      st: chatters.staff,
      ad: chatters.admins,
      gm: chatters.global_mods,
      vi: chatters.viewers
    };

    await(viewers.insertAsync(doc));
  }

  db.close();
  Log.info('Fin.');
});

takeSnapshot().done();
