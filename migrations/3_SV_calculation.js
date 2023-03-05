const SVCalculation = artifacts.require("SVCalculation");
const bootstrap = require('../contracts.json');

module.exports = function (deployer) {
  deployer.deploy(Score, bootstrap.model, bootstrap.weights);
};
