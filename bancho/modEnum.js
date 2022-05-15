let modEnumAcro = {
	NM: 0,
	NF: 1,
	EZ: 2,
	TD: 4,
	HD: 8,
	HR: 16,
	SD: 32,
	DT: 64,
	RX: 128,
	HT: 256,
	NC: 512, //Only set along with DoubleTime .i.e: NC only gives 576
	FL: 1024,
	AT: 2048,
	SO: 4096,
	AP: 8192, // Autopilot
	PF: 16384, // Only set along withSuddenDeath .i.e: PF only gives 16416
	K4: 32768,
	K5: 65536,
	K6: 131072,
	K7: 262144,
	K8: 524288,
	FI: 1048576,
	RD: 2097152,
	CN: 4194304,
	TP: 8388608,
	K9: 16777216,
	KC: 33554432,
	K1: 67108864,
	K3: 134217728,
	K2: 268435456,
	SV2: 536870912,
	MI: 1073741824,
};

// let modEnumName = {
// 	None: 0,
// 	NoFail: 1,
// 	Easy: 2,
// 	TouchDevice: 4,
// 	Hidden: 8,
// 	HardRock: 16,
// 	SuddenDeath: 32,
// 	DoubleTime: 64,
// 	Relax: 128,
// 	HalfTime: 256,
// 	Nightcore: 512, //OnlysetalongwithDoubleTime.i.e:NConlygives576
// 	Flashlight: 1024,
// 	Autoplay: 2048,
// 	SpunOut: 4096,
// 	Relax2: 8192, //Autopilot
// 	Perfect: 16384, //OnlysetalongwithSuddenDeath.i.e:PFonlygives16416
// 	Key4: 32768,
// 	Key5: 65536,
// 	Key6: 131072,
// 	Key7: 262144,
// 	Key8: 524288,
// 	FadeIn: 1048576,
// 	Random: 2097152,
// 	Cinema: 4194304,
// 	Target: 8388608,
// 	Key9: 16777216,
// 	KeyCoop: 33554432,
// 	Key1: 67108864,
// 	Key3: 134217728,
// 	Key2: 268435456,
// 	ScoreV2: 536870912,
// 	Mirror: 1073741824,
// };

module.exports = {
	convertAcronymToEnum(mods) {
		let modArr = mods.match(/\w{2}/g);
		let modEnum = 0;
		modArr.forEach((mod) => {
			modEnum += modEnumAcro[mod];
		});
		return modEnum;
	},
};
