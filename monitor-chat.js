var nazgul = require('./nazgul');
var irc = require('irc');
var async = nazgul.async,
    await = nazgul.await,
    Config = nazgul.Config,
    mongodb = nazgul.mongodb,
    Log = nazgul.Log,
    sprintf = nazgul.sprintf,
    MongoClient = nazgul.MongoClient,
    Twitch = nazgul.Twitch;

var monitor = async(function() {
  Log.info('Chat monitoring starting.');

  var db = await(MongoClient.connectAsync(Config.mongo));
  var messages = db.collection('chat:messages');
  var joins = db.collection('chat:joins');
  var parts = db.collection('chat:parts');

  var twitchIds = {};
  for (var i = 0; i < Config.channels.length; ++i) {
    var channel = Config.channels[i].toLowerCase();
    var url = sprintf('https://api.twitch.tv/kraken/users/%s', channel);

    var response = await(Twitch.request(url));
    var id = response._id;

    if (!id) {
      throw new Error(sprintf('Could not find Twitch channel ID for %s.', channel));
    }

    twitchIds[channel] = id;
  }

  var bot = new irc.Client('irc.twitch.tv', Config.twitch.username, {
    port: 6667,
    showErrors: true,
    password: 'oauth:' + Config.twitch.oauth,
    userName: Config.twitch.username,
    realName: Config.twitch.username,
    autoConnect: false,
    showErrors: true,
    stripColors: true,
    secure: false
  });

  bot.on('error', function(message) {
    Log.error('IRC error: ' + message);
  });

  Log.info('Connecting to Twitch IRC servers.');
  bot.connect(5, function() {
    Log.info('Connected to Twitch IRC servers.');

    for (var i = 0; i < Config.channels.length; ++i) {
      var channel = Config.channels[i];
      Log.info(sprintf('Joining #%s.', channel));

      bot.join('#' + channel, function() {
        Log.info(sprintf('Joined #%s.', channel));
      });
    }
  });

  bot.on('message#', async(function(from, channel, message) {
    from = from.toLowerCase();
    if (from == 'jtv') {
      return;
    }

    channel = channel.substr(1).toLowerCase();

    Log.info(sprintf('[%s] %s: %s', channel, from, message));

    var doc = { i: twitchIds[channel], u: from, m: message, t: +Date.now() };
    await(messages.insertAsync(doc));
  }));

  bot.on('join', async(function(channel, nick) {
    nick = nick.toLowerCase();
    if (nick == 'jtv') {
      return;
    }

    channel = channel.substr(1).toLowerCase();

    Log.info(sprintf('[%s] >>> %s', channel, nick));

    var doc = { i: twitchIds[channel], u: nick, t: +Date.now() };
    await(joins.insertAsync(doc));
  }));

  bot.on('part', async(function(channel, nick) {
    nick = nick.toLowerCase();
    if (nick == 'jtv') {
      return;
    }

    channel = channel.substr(1).toLowerCase();

    Log.info(sprintf('[%s] <<< %s', channel, nick));

    var doc = { i: twitchIds[channel], u: nick, t: +(new Date()) };
    await(parts.insertAsync(doc));
  }));
});

monitor(Config.channels);
