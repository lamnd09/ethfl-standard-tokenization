# A  standard for Blockchain-based Federated Learning: Benchmarking and Tokenization

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

Integrating blockchain technology with federated learning can provide additional benefits such as increased data privacy, security, and transparency. The basic idea is to use the decentralized and distributed nature of blockchain to securely store the training data and model parameters, and to use smart contracts to govern the federated learning process.
In this work, we leverage Ethereum for the implementation of the system and benchmark the performance, then intergrate with FL for tokenization 


## High-level how system works
A standard Ethereum-based FL workflow could be summaried as below: 

1. `Create a blockchain network`: You can create a private or public blockchain network using a platform such as Ethereum, Hyperledger Fabric, or Corda. The blockchain network will be used to store the training data, model parameters, and the transactions that occur during the federated learning process.
2. `Define smart contracts`: Smart contracts are self-executing contracts with the terms of the agreement between the buyer and seller being directly written into lines of code. You can define smart contracts that govern the federated learning process, such as the parameters of the model, the participants in the network, and the rewards for contributing data.
3. `Implement federated learning algorithms`: You can implement federated learning algorithms such as Federated Averaging or Federated Stochastic Gradient Descent that work with the blockchain network to securely train the model. The federated learning algorithm will need to be modified to interact with the blockchain network and smart contracts.
4. `Train the model`: Once the blockchain network, smart contracts, and federated learning algorithm are defined, you can start training the model using the federated learning algorithm.
5.  `Validate the model`: After the model is trained, you can validate its accuracy using a validation dataset.
6. `Deploy the model`: Once the model is validated, it can be deployed for use in production.


## Requirements
- Ethereum test environment: truffle, ganache-cli
- Federated Learning framework - TensorFlow
- Python3
- Solidity ^0.8.0

## Components
* `Contracts`: includes  solidity smart contracts for implementation. 
* `Fed-components`:  includes federated learning, web3 modules 
* `migrations`: includes smart contract migrations for deloying smart contracts on Ethereum Blockchain via truffle. The Ethereum network could be Ganache, testnet or mainchain.
* `Dashboard`: The front-end dashboard for managing the system [In-progress]
* `Automation Pipeline`: the CI/CD of the project  [In-progress]
* `Cloud Deployment`: Using Kubernetes Cluster to deploy the system.   [In-progress]

## Git Notes

Please sign off all your commits. This can be done with

    $ git commit -s -m "your message"


#End