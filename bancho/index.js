const client = require("./client");
const MatchManager = require("./MatchManager");

module.exports = {
	init() {
		client.init();
		MatchManager.recoverMatches();
	},
};
