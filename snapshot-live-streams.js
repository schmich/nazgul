var nazgul = require('./nazgul');
var async = nazgul.async,
    await = nazgul.await,
    Config = nazgul.Config,
    Log = nazgul.Log,
    sprintf = nazgul.sprintf,
    URI = nazgul.URI,
    MongoClient = nazgul.MongoClient,
    Twitch = nazgul.Twitch;

var takeSnapshot = async(function() {
  Log.info('Viewer snapshot starting.');
  var db = await(MongoClient.connectAsync(Config.mongo));

  var offset = 0;
  var timestamp = +Date.now();
  var snapshots = db.collection('stream:snapshots');

  while (true) {
    var url = URI('https://api.twitch.tv/kraken/streams')
      .query({ limit: 100, offset: offset })
      .toString();

    var result = await(Twitch.request(url));
    var streams = result.streams;

    if (!streams || (streams.length == 0)) {
      break;
    }

    for (var i = 0; i < streams.length; ++i) {
      var stream = streams[i];

      var doc = {
        ts: timestamp,
        ui: stream.channel._id,
        ch: stream.channel.name,
        ga: stream.game,
        si: stream._id,
        vi: stream.viewers,
        la: stream.channel.language,
        fo: stream.channel.followers,
        cv: stream.channel.views,
        pa: stream.channel.partner,
        ma: stream.channel.mature,
        st: stream.channel.status
      };

      await(snapshots.insertAsync(doc));
    }

    offset += 90;
  }

  db.close();
  Log.info('Fin.');
});

takeSnapshot();
