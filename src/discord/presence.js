const { ActivityType } = require("discord.js");
const { prisma } = require("../lib/prisma");

let presences = [
	{ name: "%m matches", type: ActivityType.Watching },
	{ name: "%q qualifiers", type: ActivityType.Watching },
	{ name: "%s servers", type: ActivityType.Listening },
	{ name: "Your new favorite tournament", type: ActivityType.Competing },
];

let index = 0;
let presenceUpdateTime = 30000;

/**
 *
 * @param {import("discord.js").Client} bot
 * @param {number} number
 */
async function updatePresence(bot) {
	let presence = presences[index];
	presence.name = await parseArgs(presence.name, bot);
	bot.user.setActivity(presence);
	index = (index + 1) % presences.length;
}

/**
 *
 * @param {string} name
 * @param {import("discord.js").Client} bot
 */
async function parseArgs(name, bot) {
	let currentMatches = (
		await prisma.match.findMany({
			where: { state: { lte: 8, not: -1 } },
		})
	).length;
	// TODO: implement code to sort qualifier matches into only active ones
	let currentQuals = (await prisma.qualifierMatch.findMany({})).length;
	let servers = bot.guilds.cache.size;

	name = name.replaceAll("%m", currentMatches);
	name = name.replaceAll("%q", currentQuals);
	name = name.replaceAll("%s", servers);

	return name;
}

module.exports.startPresenceUpdatetimer = async (bot) => {
	setInterval(async () => {
		await updatePresence(bot);
	}, presenceUpdateTime);
};
