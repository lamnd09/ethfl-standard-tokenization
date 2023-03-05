const ModelScheduling = artifacts.require("ModelScheduling");
const bootstrap = require('../contracts.json');

module.exports = function (deployer) {
  deployer.deploy(ModelScheduling, bootstrap.model, bootstrap.weights);
};
