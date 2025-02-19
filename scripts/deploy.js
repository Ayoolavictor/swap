const { ethers } = require('hardhat');
require('dotenv').config();

const main = async () => {
  const TokenA = await ethers.getContractFactory('TokenA');
  const tokena = await TokenA.deploy(
    '0xf04990915C006A35092493094B4367F6d93f9ff0',
    '0xf04990915C006A35092493094B4367F6d93f9ff0'
  );
  await tokena.waitForDeployment();
  console.log('tokena deployed to:', await tokena.getAddress());

  const TokenB = await ethers.getContractFactory('TokenB');
  const tokenb = await TokenB.deploy(
    '0xf04990915C006A35092493094B4367F6d93f9ff0',
    '0xf04990915C006A35092493094B4367F6d93f9ff0'
  );
  await tokenb.waitForDeployment();
  console.log('tokenb deployed to:', await tokenb.getAddress());

  const ReverseDutchAuctionSwap = await ethers.getContractFactory(
    'ReverseDutchAuctionSwap'
  );
  const reverseDutchAuctionSwap = await ReverseDutchAuctionSwap.deploy();
  await reverseDutchAuctionSwap.waitForDeployment();
  console.log(
    'reverseDutchAuctionSwap deployed to:',
    await reverseDutchAuctionSwap.getAddress()
  );
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
runMain();
