var nazgul = require('./nazgul'),
    _ = require('lodash'),
    async = nazgul.async,
    await = nazgul.await,
    Config = nazgul.Config,
    Log = nazgul.Log,
    sprintf = nazgul.sprintf,
    MongoClient = nazgul.MongoClient,
    Twitch = nazgul.Twitch,
    TwitchId = require('./twitch-id');

var takeSnapshot = async(function() {
  Log.info('Host snapshot starting.');
  var db = await(MongoClient.connectAsync(Config.mongo));
  var hosts = db.collection('host:snapshots');
  var snapshots = db.collection('stream:snapshots');

  var timestamp = Date.now();

  var channels = Config.channels;

  var twitchId = await(new TwitchId(db, channels));

  for (var i = 0; i < channels.length; ++i) {
    var channel = channels[i];
    var targetId = twitchId.find(channel);

    var url = sprintf('http://tmi.twitch.tv/hosts?include_logins=1&target=%s', targetId);

    var response = await(Twitch.request(url, false));
    if (response && response.hosts) {
      var doc = {
        c: channel,
        t: timestamp,
        h: _(response.hosts).map('host_login').value()
      };

      await(hosts.insertAsync(doc));
    }
  }

  db.close();
  Log.info('Fin.');
});

takeSnapshot().done();
