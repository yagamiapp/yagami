const fs = require("fs");
const data = require("./rawpools.json");

// Request URL: https://script.google.com/macros/s/AKfycbx1cuzkiNDl3zDZ4aFx6bwgVSCety5M99UQvjDFvmaPnI72IrFdPlU9gh3FHPQ0Rq-FnQ/exec

let columnNames = [
	"tournament",
	"iteration",
	"round",
	"map",
	"id",
	"set_id",
	"artist",
	"mapper",
	"title",
	"difficulty",
	"bpm",
	"cs",
	"ar",
	"od",
];

let out = {};
let filters = [];
for (const row of data) {
	// console.log(row);
	let tournamentName = row[0];
	if (row[0] == "") {
		tournamentName = row[1];
	}

	if (!out[tournamentName]) {
		out[tournamentName] = {};
	}

	let tournament = out[tournamentName];
	let iterationName = row[1];
	if (!tournament[iterationName]) {
		tournament[iterationName] = {};
	}

	let iteration = tournament[iterationName];
	let roundName = row[2];
	if (!iteration[roundName]) {
		iteration[roundName] = [];
	}
	round = iteration[roundName];
	let map = {};
	for (let i = 3; i < row.length; i++) {
		let prop = row[i];
		if (prop === "") {
			filters[`${tournamentName}-${iterationName}-${roundName}`] = {
				tournament: tournamentName,
				iteration: iterationName,
				round: roundName,
			};
		}
		let key = columnNames[i];

		map[key] = prop;
	}
	round.push(map);
}

for (const pool in filters) {
	let filter = filters[pool];
	delete out[filter.tournament][filter.iteration][filter.round];
}

let finalArray = [];
for (const tournamentName in out) {
	for (const iterationName in out[tournamentName]) {
		for (const roundName in out[tournamentName][iterationName]) {
			finalArray.push({
				tournament: tournamentName,
				iteration: iterationName,
				round: roundName,
				maps: out[tournamentName][iterationName][roundName],
			});
		}
	}
}
fs.writeFileSync("./bancho/pools.json", JSON.stringify(finalArray));
fs.rmSync("./misc/pool-parser/rawpools.json");
