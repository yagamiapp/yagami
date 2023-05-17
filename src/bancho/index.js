const client = require('./client');
const { recover } = require('./recovery');

module.exports = {
  init() {
    client.init().then(() => {
      recover();
    });
  },
};
