const { execute } = require('../commands/link');

module.exports = {
  data: { customId: 'link' },
  async execute(interaction, command) {
    await execute(interaction);
  },
};
