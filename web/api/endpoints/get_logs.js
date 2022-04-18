let fs = require("fs");
let homedir = require("os").homedir();

module.exports = {
	endpoint: "get_logs",
	async execute(req, res) {
		console.log(req.query);
		let logs = fs.readFileSync(homedir + "/.pm2/logs/yagami-out.log");
		logs = logs.toString();
		if (req.query.type == "text") {
			res.writeHead(200);
			res.write(logs);
			res.end();
			return;
		}
		logs = logs.split("\n");
		let logList = {};
		logs.forEach((line) => {
			let lineRegex = line.match(/(?:(?:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}))/);
			let time = lineRegex?.[0];
			if (time) {
				let log = line.replace(time + ": ", "");

				if (logList[time] == null) {
					logList[time] = [log];
				} else {
					logList[time].push(log);
				}
			}
		});

		res.write(JSON.stringify(logList));
		res.end();
	},
};
