const FLalgorithm = artifacts.require("FLalgorithm");
const bootstrap = require('../contracts.json');

module.exports = function (deployer) {
  deployer.deploy(Vertical, bootstrap.model, bootstrap.bottomModel, bootstrap.weights);
};
