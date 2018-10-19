const Promise = require("bluebird");
const request = require("request");
const FeedParser = require("feedparser");

module.exports = function() {
  return new Promise((resolve, reject) => {
    const res = [];
    const req = request("http://feed.rutracker.org/atom/f/635.atom");
    const feedparser = new FeedParser();

    req.on("error", function(error) {
      reject(error);
    });

    req.on("response", function(res) {
      var stream = this;

      if (res.statusCode !== 200) {
        reject(new Error("Bad status code"));
      } else {
        stream.pipe(feedparser);
      }
    });

    feedparser.on("error", function(error) {
      reject(error);
    });

    feedparser.on("readable", function() {
      var stream = this;
      var meta = this.meta;
      var item;

      while ((item = stream.read())) {
        res.push({
          title: item.title,
          url: item.link,
          date: new Date()
        });
      }

      resolve(res);
    });
  });
};
