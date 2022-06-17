const { createCanvas, registerFont } = require("canvas");
const { prisma } = require("../prisma");
const fs = require("fs");

let colors = {
	NM: "#3d85c6",
	HD: "#bf9000",
	HR: "#cc0000",
	DT: "#9263d2",
	FM: "#6aa84f",
	TB: "#aaaaaa",
	background: "#051d22",
	text: "#ffffff",
	header: "#bbbbbb",
};
let fonts = {
	main: {
		file: "./fonts/Comfortaa.ttf",
		size: 14,
	},
	header: {
		file: "./fonts/Comfortaa.ttf",
		size: 12,
	},
};

let headerLabels = [
	"ID",
	"Artist - Title [Difficulty]",
	"Stars",
	"Length",
	"BPM",
	"CS",
	"OD",
	"AR",
];

let margin = 10;

let columnWidths = [40, 500, 40, 50, 40, 30, 30, 30];
let rowHeight = 30;
let headerHeight = 15;

module.exports.generateImage = async (id) => {
	let maps = await prisma.mapInPool.findMany({
		where: {
			mappoolId: id,
		},
		orderBy: {
			modPriority: "asc",
		},
	});
	let mappool = [];
	for (const map of maps) {
		let mapData = await prisma.map.findUnique({
			where: {
				beatmap_id: map.mapId,
			},
		});

		mappool.push({
			identifier: map.identifier,
			string: `${mapData.artist} - ${mapData.title} [${mapData.version}]`,
			sr: mapData.difficultyrating,
			length: mapData.total_length,
			bpm: mapData.bpm,
			cs: mapData.diff_size,
			od: mapData.diff_overall,
			ar: mapData.diff_approach,
		});
	}

	// Sum columnWidths to get total width
	let width = columnWidths.reduce((a, b) => a + b, 0) + margin * 2;

	let height = mappool.length * rowHeight + margin * 2 + headerHeight;

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = colors.background;
	ctx.fillRect(0, 0, width, height);
	registerFont(fonts.main.file, { family: fonts.main.file });
	registerFont(fonts.header.file, { family: fonts.header.file });

	// Draw header
	ctx.font = `${fonts.header.size}px ${fonts.header.file}`;
	ctx.fillStyle = colors.header;

	let position = margin;
	for (let i = 0; i < headerLabels.length; i++) {
		ctx.fillText(headerLabels[i], position, margin + headerHeight);
		position += columnWidths[i];
	}

	// Draw rows
	ctx.font = `${fonts.main.size}px ${fonts.main.file}`;
	ctx.fillStyle = colors.text;
	for (let i = 0; i < mappool.length; i++) {
		let { identifier, string, sr, length, bpm, cs, od, ar } = mappool[i];

		// Fix String Length
		let stringSize = ctx.measureText(string).width;
		if (stringSize > columnWidths[1]) {
			let smallEnough = false;
			while (!smallEnough) {
				string = string.substring(0, string.length - 1);
				stringSize = ctx.measureText(string).width;
				if (stringSize <= columnWidths[1]) {
					string = string.substring(0, string.length - 3);
					string += "...";
					smallEnough = true;
				}
			}
		}

		let color = colors[identifier.substring(0, 2)];
		color = color || colors.text;

		let bpmInt = parseInt(bpm).toFixed(0);
		let csInt = parseInt(cs).toFixed(1);
		let odInt = parseInt(od).toFixed(1);
		let arInt = parseInt(ar).toFixed(1);
		let srInt = parseInt(sr).toFixed(2);
		// Length in seconds to time string
		let lengthString = `${Math.floor(length / 60)}:${
			Math.floor(length % 60) < 10 ? "0" : ""
		}${Math.floor(length % 60)}`;
		let row = [
			identifier,
			string,
			srInt,
			lengthString,
			bpmInt,
			csInt,
			odInt,
			arInt,
		];
		let position = margin;
		ctx.fillStyle = color;
		ctx.fillText(
			row[0],
			position,
			i * rowHeight + margin + rowHeight / 2 + headerHeight
		);
		position += columnWidths[0];
		ctx.fillStyle = colors.text;
		position += 2;
		for (let j = 1; j < row.length; j++) {
			ctx.fillText(
				row[j],
				position,
				i * rowHeight + margin + rowHeight / 2 + headerHeight
			);
			position += columnWidths[j];
		}
	}

	return canvas;
};
