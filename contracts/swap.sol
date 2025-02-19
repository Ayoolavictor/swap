// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ReverseDutchAuctionSwap is ReentrancyGuard {
    error AuctionNotActive();
    error AuctionAlreadyEnded();
    error PriceTooLow();
    error TransferFailed();
    error InvalidAuctionParameters();

    struct Auction {
        address seller;
        address tokenSell;
        address tokenBuy;
        uint256 amountSell;
        uint256 initialPrice;
        uint256 minPrice;
        uint256 duration;
        uint256 startTime;
        uint256 priceDropPerSecond;
        bool active;
    }

    Auction public auction;

    event AuctionCreated(
        address indexed seller,
        address tokenSell,
        address tokenBuy,
        uint256 amountSell,
        uint256 initialPrice,
        uint256 minPrice,
        uint256 duration
    );

    event AuctionFinalized(address indexed buyer, uint256 finalPrice);

    function createAuction(
        address _tokenSell,
        address _tokenBuy,
        uint256 _amountSell,
        uint256 _initialPrice,
        uint256 _minPrice,
        uint256 _duration
    ) external {
        if (_amountSell == 0 || _initialPrice <= _minPrice || _duration == 0) {
            revert InvalidAuctionParameters();
        }

        IERC20(_tokenSell).transferFrom(msg.sender, address(this), _amountSell);

        auction = Auction({
            seller: msg.sender,
            tokenSell: _tokenSell,
            tokenBuy: _tokenBuy,
            amountSell: _amountSell,
            initialPrice: _initialPrice,
            minPrice: _minPrice,
            duration: _duration,
            startTime: block.timestamp,
            priceDropPerSecond: (_initialPrice - _minPrice) / _duration,
            active: true
        });

        emit AuctionCreated(
            msg.sender,
            _tokenSell,
            _tokenBuy,
            _amountSell,
            _initialPrice,
            _minPrice,
            _duration
        );
    }

    function getCurrentPrice() public view returns (uint256) {
        if (!auction.active) revert AuctionNotActive();

        uint256 elapsedTime = block.timestamp - auction.startTime;
        if (elapsedTime >= auction.duration) {
            return auction.minPrice;
        }

        return
            auction.initialPrice - (elapsedTime * auction.priceDropPerSecond);
    }

    function buy() external nonReentrant {
        if (!auction.active) revert AuctionNotActive();

        uint256 currentPrice = getCurrentPrice();

        // New condition to check if auction has ended
        if (block.timestamp >= auction.startTime + auction.duration) {
            auction.active = false; // Explicitly end the auction
            revert AuctionNotActive();
        }

        if (currentPrice < auction.minPrice) revert PriceTooLow();

        auction.active = false; // End auction
        IERC20(auction.tokenBuy).transferFrom(
            msg.sender,
            auction.seller,
            currentPrice
        );
        IERC20(auction.tokenSell).transfer(msg.sender, auction.amountSell);

        emit AuctionFinalized(msg.sender, currentPrice);
    }
}
