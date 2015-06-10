var nazgul = require('./nazgul'),
    _ = require('lodash'),
    async = nazgul.async,
    await = nazgul.await,
    Config = nazgul.Config,
    Log = nazgul.Log,
    sprintf = nazgul.sprintf,
    MongoClient = nazgul.MongoClient,
    Twitch = nazgul.Twitch;

var twitchId = async(function(user, snapshots) {
  var stream = await(snapshots.findOneAsync({ ch: user }, { ui: 1 }));
  if (stream && stream.ui) {
    id = stream.ui;
  } else {
    var url = sprintf('https://api.twitch.tv/kraken/users/%s', user);
    var response = await(Twitch.request(url));
    id = response._id;
  }

  if (!id) {
    throw new Error(sprintf('Could not find Twitch channel ID for %s.', channel));
  }

  return id;
});

var takeSnapshot = async(function() {
  Log.info('Host snapshot starting.');
  var db = await(MongoClient.connectAsync(Config.mongo));
  var hosts = db.collection('host:snapshots');
  var snapshots = db.collection('stream:snapshots');

  var timestamp = Date.now();

  var channels = Config.channels;
  for (var i = 0; i < channels.length; ++i) {
    var channel = channels[i];
    var targetId = await(twitchId(channel, snapshots));

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
