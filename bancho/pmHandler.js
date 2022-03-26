module.exports.pmHandler = async (msg) => {
	if (msg.message.startsWith("!join")) {
		let command = msg.message.split(" ");
		let channelName = command[1];
		let mappoolName = command[2];
		try {
			let match = new Match(client, channelName, mappoolName);
			await match.initializeMatch();
			matches.push(match);
		} catch (e) {
			console.log(e);
			msg.user.sendMessage("We encountered an error: " + e);
		}
	}
};
