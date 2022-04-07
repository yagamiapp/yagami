const {
	BanchoClient,
	BanchoMessage,
	BanchoMultiplayerChannel,
	BanchoChannel,
	BanchoLobbyPlayer,
} = require("bancho.js");
/**
 * @class
 * @desc Represents a bancho lobby
 * @prop { BanchoMultiplayerChannel } channel The bancho channel the lobby is being hosted in
 * @public
 */
class Lobby {
	/**
	 * Represents a tournament match
	 * @param { BanchoClient } client The client used for sending messages and grabbing lobbies
	 * @param { string } ircName The name of the tournament match in IRC format
	 * @param { string } mappoolName the mappool ID of the mappool to be used in this tournament
	 */
	constructor(client, ircName, mappoolName) {
		this.client = client;
		this.ircName = ircName;
		this.mappoolName = mappoolName;
		this.messages = [];
		console.log(`Creating a ${mappoolName} match, in lobby ${ircName}.`);
		/**
		 * @type { BanchoMultiplayerChannel }
		 */
		this.channel = client.getChannel(ircName);
		if (this.channel instanceof BanchoChannel) {
			throw "Matches cannot be started in non-multiplayer rooms";
		}

		this.channel.on("message", (msg) => {
			this.msgHandler(msg);
		});

		// Set up listeners
		this.channel.lobby.on("matchFinished", () => {
			console.log(this.channel.lobby.slots);
		});

		this.channel.lobby.on("allPlayersReady", () => {
			this.channel.lobby.startMatch(5);
			this.channel.sendMessage("glhf!");
		});
	}

	/**
	 * @desc Handler for messages sent in the channel
	 * @private
	 * @param {BanchoMessage} msg The message object sent when 'message' event is fired
	 */
	async msgHandler(msg) {
		// Log all messages in an array to display later
		if (msg.user.ircUsername !== "BanchoBot") {
			let data = {
				user: msg.user.ircUsername,
				message: msg.message,
				time: new Date().toISOString(),
			};
			console.log(data);
			this.messages.push(data);
		}
	}

	/**
	 * Joins the channel and assigns it to a class variable
	 * @private
	 * @function
	 */
	async joinChannel() {
		await this.channel.join();
		await this.channel.sendMessage("I've connected!");
	}

	/**
	 * Executes all necessary commands to set up a match, then starts it
	 * @function
	 */
	async initializeMatch() {
		await this.joinChannel();
		console.log(this.mappool);
	}
}

module.exports.Match = Lobby;
