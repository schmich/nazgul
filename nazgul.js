var async = require('asyncawait/async');
var await = require('asyncawait/await');
var Config = require('./config');
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
var Log = require('winston');
var sprintf = require('sprintf');
var moment = require('moment');
var URI = require('URIjs');
var MongoClient = mongodb.MongoClient;
var Collection = mongodb.Collection;
var request = Promise.promisifyAll(require('request'));

Log.remove(Log.transports.Console);
Log.add(Log.transports.Console, { timestamp: function() { return moment().format(); } });

function sleep(duration) {
  return new Promise(function(resolve, reject) {
    if (duration <= 0) {
      resolve();
    } else {
      setTimeout(resolve, duration);
    }
  });
}

function Twitch() {
}

Twitch.lastRequestTime = 0;

Twitch.request = async(function(url, headers) {
  var tries = 0;
  var maxTries = 5;

  var options = {
    url: url,
    timeout: 10 * 1000
  };

  if (headers !== false) {
    options.headers = {
      Accept: 'application/vnd.twitchtv.v3+json',
      'Client-ID': 'nazgul (https://github.com/schmich/nazgul)'
    };
  }

  var delay = 1000 - ((Date.now() - this.lastRequestTime) / 1000);
  await(sleep(delay));

  while (true) {
    ++tries;

    Log.info(sprintf('Requesting %s.', options.url));

    var success = false;
    try {
      var response = await(request.getAsync(options));
      this.lastRequestTime = Date.now();

      var body = response[0].body;

      var statusCode = response[0].statusCode;
      Log.info(sprintf('Response status: %d.', statusCode));
      success = (statusCode == 200);
    } catch (e) {
      Log.error('Error during request.');
      Log.error(e.toString());
    }

    if (!success) {
      Log.error('Request failed.');
      if (tries == maxTries) {
        throw new Error(sprintf('Max tries exceeded for %s.', options.url));
      }

      Log.info(sprintf('Try %d of %d, waiting for 5s.', tries, maxTries));
      await(sleep(5000));
      continue;
    }
    
    return JSON.parse(body);
  }
});

module.exports = {
  async: async,
  await: await,
  Config: Config,
  request: request,
  Log: Log,
  sprintf: sprintf,
  URI: URI,
  MongoClient: MongoClient,
  Twitch: Twitch,
  sleep: sleep
};
