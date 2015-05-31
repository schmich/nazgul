var nazgul = require('./nazgul');
var async = nazgul.async,
    await = nazgul.await,
    Log = nazgul.Log,
    sprintf = nazgul.sprintf,
    URI = nazgul.URI,
    Twitch = nazgul.Twitch,
    MongoClient = nazgul.MongoClient,
    Config = nazgul.Config;

var showUserId = async(function(username) {
  var url = URI(sprintf('https://api.twitch.tv/kraken/users/%s', username)).toString();
  var response = await(Twitch.request(url));
  Log.info(sprintf('ID: %d', response._id));
});

var showUserName = async(function(id) {
  var db = await(MongoClient.connectAsync(Config.mongo));
  var snapshots = db.collection('stream:snapshots');

  Log.info(sprintf('Finding user #%d', id));
  var doc = await(snapshots.findOneAsync({ ui: id }, { ch: 1 }));
  if (doc && doc.ch) {
    Log.info(sprintf('User: %s', doc.ch));
  } else {
    Log.error('User not found.');
  }

  db.close();
});

if (process.argv.length < 3) {
  Log.error('Username or ID expected.');
  process.exit(1);
} else {
  var arg = process.argv[2];
  if (+arg == arg) {
    showUserName(+arg).done();  
  } else {
    showUserId(arg).done();
  } 
}
