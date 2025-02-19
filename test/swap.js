const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-toolbox/network-helpers');

describe('ReverseDutchAuctionSwap', function () {
  let tokenSell, tokenBuy, auction, owner, seller, buyer;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    const TokenA = await ethers.getContractFactory('TokenA');
    tokenBuy = await TokenA.deploy(owner.address, owner.address);
    await tokenBuy.waitForDeployment();
    console.log('Token Buy deployed at:', tokenBuy.target);

    const TokenB = await ethers.getContractFactory('TokenB');
    tokenSell = await TokenB.deploy(owner.address, owner.address);
    await tokenSell.waitForDeployment();
    console.log('Token Sell deployed at:', tokenSell.target);

    const ReverseDutchAuctionSwap = await ethers.getContractFactory(
      'ReverseDutchAuctionSwap'
    );
    auction = await ReverseDutchAuctionSwap.deploy();
    await auction.waitForDeployment();

    await tokenSell.transfer(seller.address, ethers.parseEther('100'));
    await tokenBuy.transfer(buyer.address, ethers.parseEther('100'));

    await tokenSell
      .connect(seller)
      .approve(auction.target, ethers.parseEther('100'));
    await tokenBuy
      .connect(buyer)
      .approve(auction.target, ethers.parseEther('100'));
  });

  it('should create an auction with correct parameters', async function () {
    await auction
      .connect(seller)
      .createAuction(
        tokenSell.target,
        tokenBuy.target,
        ethers.parseEther('100'),
        ethers.parseEther('10'),
        ethers.parseEther('5'),
        3600
      );

    const auctionDetails = await auction.auction();
    expect(auctionDetails.seller).to.equal(seller.address);
    expect(auctionDetails.tokenSell).to.equal(tokenSell.target);
    expect(auctionDetails.amountSell).to.equal(ethers.parseEther('100'));
  });

  it('should return the correct current price', async function () {
    await auction
      .connect(seller)
      .createAuction(
        tokenSell.target,
        tokenBuy.target,
        ethers.parseEther('100'),
        ethers.parseEther('10'),
        ethers.parseEther('5'),
        3600
      );

    const latestTimestamp = await time.latest();
    await time.increaseTo(latestTimestamp + 1800); // Fast-forward 30 minutes

    const currentPrice = await auction.getCurrentPrice();
    expect(currentPrice).to.be.closeTo(
      ethers.parseEther('7.5'),
      ethers.parseEther('0.1')
    );
  });

  it('should allow a buyer to purchase at the current price', async function () {
    await auction
      .connect(seller)
      .createAuction(
        tokenSell.target,
        tokenBuy.target,
        ethers.parseEther('100'),
        ethers.parseEther('10'),
        ethers.parseEther('5'),
        3600
      );

    const latestTimestamp = await time.latest();
    await time.increaseTo(latestTimestamp + 1800); // Fast-forward 30 minutes

    const currentPrice = await auction.getCurrentPrice();

    await expect(() => auction.connect(buyer).buy()).to.changeTokenBalances(
      tokenSell,
      [buyer, auction],
      [ethers.parseEther('100'), -ethers.parseEther('100')]
    );
  });

  it('should not allow purchase if auction has ended', async function () {
    await auction.connect(seller).createAuction(
      tokenSell.target,
      tokenBuy.target,
      ethers.parseEther('100'),
      ethers.parseEther('10'),
      ethers.parseEther('5'),
      3600
    );

    // Compute auction end time
    const auctionDetails = await auction.auction();
    const startTime = auctionDetails.startTime;
    const duration = auctionDetails.duration;
    const auctionEndTime = Number(startTime) + Number(duration);

    console.log("Auction End Time:", auctionEndTime);
    console.log("Current Time Before Increase:", await time.latest());

    // Move past auction duration correctly
    await time.increaseTo(auctionEndTime + 1);

    console.log("Current Time After Increase:", await time.latest());

    await expect(auction.connect(buyer).buy()).to.be.revertedWithCustomError(auction, 'AuctionNotActive');
});

});
