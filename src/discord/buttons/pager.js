const modalTemp = require("../modals/pager");

module.exports = {
	data: { customId: "pager" },
	async execute(interaction, command) {
		let { min, max, list } = command.options;
		modalTemp.data.components[0].components[0].setPlaceholder(
			`A number between ${min} and ${max}`
		);
		modalTemp.data.setCustomId(`pager?list=${list}&min=${min}&max=${max}`);

		await interaction.showModal(modalTemp.data);
	},
};
