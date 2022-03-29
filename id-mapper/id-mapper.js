let ids = require("./ids.json");
let axios = require("axios").default;
let fs = require("fs");
require("dotenv").config();

let i = 0;
let interval = setInterval(repeat, 1000);
let arr = [];

async function repeat() {
	let obj = ids[i];
	let req_url = `https://osu.ppy.sh/api/get_beatmaps?k=${process.env.banchoAPIKey}&b=${obj.id}`;
	console.log(`Fetching ${obj.name}: (${obj.id})`);
	let response = await axios.get(req_url);
	response = await response.data;
	arr.push({
		identifier: obj.name,
		map: response[0],
	});
	i++;
	if (i >= ids.length) {
		clearInterval(interval);
		fs.writeFileSync("./output.json", JSON.stringify(arr));
	}
}
