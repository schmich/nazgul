var nazgul = require('./nazgul');
var async = nazgul.async,
    await = nazgul.await,
    Config = nazgul.Config,
    mongodb = nazgul.mongodb,
    Log = nazgul.Log,
    sprintf = nazgul.sprintf,
    URI = nazgul.URI,
    MongoClient = nazgul.MongoClient,
    request = nazgul.request,
    sleep = nazgul.sleep;

var twitchRequest = async(function(options) {
  var tries = 0;
  var maxTries = 5;

  while (true) {
    ++tries;

    Log.info(sprintf('Requesting %s.', options.url));

    var response = await(request.getAsync(options));
    var body = response[0].body;

    var statusCode = response[0].statusCode;
    if (statusCode != 200) {
      Log.error(sprintf('Unexpected status code: %d\nResponse: %s', statusCode, body));
      if (tries == maxTries) {
        throw new Exception(sprintf('Max tries exceeded for %s.', options.url));
      }

      Log.info(sprintf('Try %d of %d, waiting for 5s.', tries, maxTries));
      await(sleep(5000));
      continue;
    }
    
    return JSON.parse(body);
  }
});

var takeSnapshot = async(function() {
  Log.info('Viewer snapshot starting.');
  var db = await(MongoClient.connectAsync(Config.mongo));

  var offset = 0;
  var timestamp = +Date.now();
  var samples = db.collection('samples');

  while (true) {
    var uri = URI('https://api.twitch.tv/kraken/streams')
      .query({ limit: 100, offset: offset })
      .toString();

    var options = {
      'url': uri,
      'headers': {
        'Accept': 'application/vnd.twitchtv.v3+json',
        'Client-ID': 'nazgul (https://github.com/schmich/nazgul)'
      }
    };

    var result = await(twitchRequest(options));
    var streams = result.streams;

    if (!streams || (streams.length == 0)) {
      break;
    }

    for (var i = 0; i < streams.length; ++i) {
      var stream = streams[i];

      var doc = {
        tst: timestamp,
        uid: stream.channel._id,
        nam: stream.channel.name,
        gam: stream.game,
        sid: stream._id,
        vwr: stream.viewers,
        lng: stream.channel.language,
        fol: stream.channel.followers,
        cvw: stream.channel.views,
        prt: stream.channel.partner,
        mtr: stream.channel.mature,
        sta: stream.channel.status
      };

      await(samples.insertAsync(doc));
    }

    offset += 90;

    await(sleep(1000));
  }

  db.close();
  Log.info('Fin.');
});

takeSnapshot();
