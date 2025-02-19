const { ethers } = require('ethers');
require('dotenv').config();
const { contractABI, contractAddress } = require('../utils/contractConstants');
const {
  tokenaABI,
  tokenaContractAddress,
} = require('../utils/tokenAConstants');
const {
  tokenbABI,
  tokenbContractAddress,
} = require('../utils/tokenBconstants');
async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.API_KEY);
  const wallet = new ethers.Wallet(process.env.SECRET_KEY, provider);

  const auctionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    wallet
  );
  const tokenSell = new ethers.Contract(
    tokenaContractAddress,
    tokenaABI,
    wallet
  );
  const tokenBuy = new ethers.Contract(
    tokenbContractAddress,
    tokenbABI,
    wallet
  );

  console.log('Connected to ReverseDutchAuctionSwap at:', contractAddress);

  console.log('\nApproving tokenSell for auction contract...');
  const approveSellTx = await tokenSell.approve(
    contractAddress,
    ethers.parseEther('100')
  );
  await approveSellTx.wait();
  console.log('Approval successful!');

  console.log('\nApproving tokenBuy for auction contract...');
  const approveBuyTx = await tokenBuy.approve(
    contractAddress,
    ethers.parseEther('100')
  );
  await approveBuyTx.wait();
  console.log('Approval successful!');

  console.log('\nCreating an auction...');
  const createAuctionTx = await auctionContract.createAuction(
    tokenaContractAddress,
    tokenbContractAddress,
    ethers.parseEther('100'),
    ethers.parseEther('10'),
    ethers.parseEther('5'),
    3600
  );
  await createAuctionTx.wait();
  console.log('Auction created!');

  console.log('\nChecking current price...');
  const currentPrice = await auctionContract.getCurrentPrice();
  console.log(
    'Current Price:',
    ethers.formatEther(currentPrice),
    'tokenBuy per tokenSell'
  );

  console.log('\nAttempting to buy tokens...');
  const buyTx = await auctionContract.buy();
  await buyTx.wait();
  console.log('Purchase successful!');
}

main().catch((error) => {
  console.error('Error:', error);
});
