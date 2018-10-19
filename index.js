const _ = require("lodash");
const fs = require("fs");
const schedule = require("node-schedule");
const notifier = require("node-notifier");
const opn = require("opn");
const fetchFeed = require("./fetch-feed");

const FILE_NAME = "./saved_feed.json";

process.setMaxListeners(0);

// every hour
schedule.scheduleJob("* * * * * *", () => {
  processFeed().catch(e => {
    console.error("error: ", { message: e.message, stack: e.stack });
  });
});

function processFeed() {
  return fetchFeed().then(newFeed => {
    let currentFeed;
    try {
      currentFeed = fs.readFileSync(FILE_NAME, "utf-8");
    } catch (e) {
      currentFeed = null;
    }

    // first time running, just save
    if (!currentFeed) {
      return fs.writeFileSync(FILE_NAME, JSON.stringify(newFeed));
    }

    currentFeed = JSON.parse(currentFeed);
    // filter out items that are older than 1 month - feed results not stable enough (can be partial) to filter out items not present in new results
    currentFeed = currentFeed.filter(item => !isOlderThanMonth(item.date));

    const merged = _.uniqBy([...newFeed, ...currentFeed], i => i.title);
    // check for new items in updated feed
    const newItems = merged.filter(
      item => !_.find(currentFeed, { title: item.title })
    );

    // notify if new items found
    if (newItems.length) {
      newItems.forEach(item => notify(item));
    }

    // save new feed to file
    fs.writeFileSync(FILE_NAME, JSON.stringify(merged));

    return newItems.length;
  });
}

function isOlderThanMonth(dateString) {
  let then = new Date(dateString);
  let now = new Date();
  return +now - +then > 1000 * 60 * 24 * 30;
}

function notify({ title, url }) {
  notifier.notify({
    title: "New game on Rutracker!",
    message: title,
    wait: true
  });
  notifier.on("click", () => opn(url));
}
