var nazgul = require('./nazgul');
var async = nazgul.async,
    await = nazgul.await,
    Log = nazgul.Log,
    sprintf = nazgul.sprintf,
    URI = nazgul.URI,
    Twitch = nazgul.Twitch;

var showUserId = async(function(username) {
  var url = URI(sprintf('https://api.twitch.tv/kraken/users/%s', username)).toString();
  var response = await(Twitch.request(url));
  Log.info(sprintf('ID: %d', response._id));
});

if (process.argv.length < 3) {
  Log.error('Username expected.');
  process.exit(1);
} else {
  showUserId(process.argv[2]);
}
