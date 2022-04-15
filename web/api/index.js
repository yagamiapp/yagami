// let test = require("./get_user");
exports.execute = async (endpoint, req, res) => {
	// Get file based on endpoint and call execute function
	try {
		let command = require("./" + endpoint);
		await command.execute(req, res);
	} catch (e) {
		res.writeHead(500);
		res.write(e.toString());
		res.end();
		return;
	}
};
