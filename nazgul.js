var async = require('asyncawait/async');
var await = require('asyncawait/await');
var Config = require('./config');
var Promise = require('bluebird');
var mongodb = require('mongodb');
var Log = require('winston');
var sprintf = require('sprintf');
var moment = require('moment');
var URI = require('URIjs');
var MongoClient = mongodb.MongoClient;
var Collection = mongodb.Collection;
var request = Promise.promisifyAll(require('request'));

Promise.promisifyAll(Collection.prototype);
Promise.promisifyAll(MongoClient);

Log.remove(Log.transports.Console);
Log.add(Log.transports.Console, { timestamp: function() { return moment().format(); } });

function sleep(duration) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, duration);
  });
}

module.exports = {
  async: async,
  await: await,
  Config: Config,
  request: request,
  Log: Log,
  sprintf: sprintf,
  URI: URI,
  MongoClient: MongoClient,
  sleep: sleep
};
