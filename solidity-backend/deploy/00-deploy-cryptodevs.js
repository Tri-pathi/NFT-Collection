const { network } = require("hardhat");
const { whitelistContractAddress, METADATA_URL } = require("../constant");

module.exports = async ({deployments,getNamedAccounts}) => {
  const{deploy,log}= deployments;
  const {deployer}=await getNamedAccounts();

  const chainId=network.config.chainId;

  const args=[METADATA_URL,whitelistContractAddress];

  const cryptodevs=await deploy("CryptoDevs",{
    from:deployer,
    log:true,
    args:args,
    waitConfirmations:network.config.waitConfirmations||1
  })

  log(`CryptoDevs contract deployed at ${cryptodevs.address}`);

};

//for deploying in hardhat/localhost use.. (yarn hardhat deploy)
// and for deploying in testnet i.e goerli.. (yarn hardhat deploy --network goerli)


//deployed contract address in goerli=0x6e46712Bc85bc00f3B5E74E2ED980E2cf953c71B