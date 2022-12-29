module.exports = {
  osuLinkHandler(channel, data, msg, client) {
    let linkDisection = msg.split("/").filter((x) => x != "");
    console.log(linkDisection);
  },
};

function mapLink() {}
