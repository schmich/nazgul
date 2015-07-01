var nazgul = require('./nazgul');
var irc = require('irc');
var async = nazgul.async,
    await = nazgul.await,
    Config = nazgul.Config,
    Log = nazgul.Log,
    sprintf = nazgul.sprintf,
    sleep = nazgul.sleep,
    MongoClient = nazgul.MongoClient,
    Twitch = nazgul.Twitch,
    TwitchId = require('./twitch-id');

var monitor = async(function(channels) {
  Log.info('Chat monitoring starting.');

  var db = await(MongoClient.connectAsync(Config.mongo));
  var messages = db.collection('chat:messages');
  var joins = db.collection('chat:joins');
  var parts = db.collection('chat:parts');
  var snapshots = db.collection('stream:snapshots');

  var twitchId = await(new TwitchId(db, channels));

  var joinChannels = [];
  for (var i = 0; i < channels.length; ++i) {
    joinChannels.push('#' + channels[i]);
  }

  var bot = new irc.Client('irc.twitch.tv', Config.twitch.username, {
    channels: joinChannels,
    port: 6667,
    showErrors: true,
    password: 'oauth:' + Config.twitch.oauth,
    userName: Config.twitch.username,
    realName: Config.twitch.username,
    autoConnect: false,
    autoRejoin: true,
    showErrors: true,
    stripColors: true,
    secure: false
  });

  bot.on('error', function(message) {
    Log.error(sprintf('IRC error: %s', message));
  });

  Log.info('Connecting to Twitch IRC servers.');
  bot.connect(5, async(function() {
    Log.info('Connected to Twitch IRC servers.');
  }));

  bot.on('message#', async(function(from, channel, message) {
    from = from.toLowerCase();
    if (from == 'jtv') {
      return;
    }

    channel = channel.substr(1).toLowerCase();

    Log.info(sprintf('[%s] %s: %s', channel, from, message));

    var doc = { i: twitchId.find(channel), u: from, m: message, t: +Date.now() };
    await(messages.insertAsync(doc));
  }));

  bot.on('join', async(function(channel, nick) {
    nick = nick.toLowerCase();
    if (nick == 'jtv') {
      return;
    }

    channel = channel.substr(1).toLowerCase();

    Log.info(sprintf('[%s] >>> %s', channel, nick));

    var doc = { i: twitchId.find(channel), u: nick, t: +Date.now() };
    await(joins.insertAsync(doc));
  }));

  bot.on('part', async(function(channel, nick) {
    nick = nick.toLowerCase();
    if (nick == 'jtv') {
      return;
    }

    channel = channel.substr(1).toLowerCase();

    Log.info(sprintf('[%s] <<< %s', channel, nick));

    var doc = { i: twitchId.find(channel), u: nick, t: +(new Date()) };
    await(parts.insertAsync(doc));
  }));
});

if (process.argv.length < 4) {
  Log.error('Usage: monitor-chat <group count> <0-based group ID>');
  process.exit(1);
}

var groupCount = process.argv[2];
var groupId = process.argv[3];

var channelsSeen = {};
var channels = [];
for (var i = 0; i < Config.channels.length; ++i) {
  var channel = Config.channels[i];
  if (channelsSeen[channel]) {
    Log.error(sprintf('Duplicate channel: %s', channel));
    process.exit(1);
  }

  channelsSeen[channel] = true;

  if ((i % groupCount) == groupId) {
    channels.push(Config.channels[i]);
  }
}

monitor(channels).done();
