var nazgul = require('./nazgul'),
    async = nazgul.async,
    await = nazgul.await,
    sprintf = nazgul.sprintf,
    Twitch = nazgul.Twitch;

var TwitchId = async(function(db, users) {
  this.ids = [];

  this.find = function(user) {
    return this.ids[user.toLowerCase()];
  };

  for (var i = 0; i < users.length; ++i) {
    var user = users[i];

    var snapshots = db.collection('stream:snapshots');
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

    this.ids[user.toLowerCase()] = id;
  }

  return this;
});

module.exports = TwitchId;
