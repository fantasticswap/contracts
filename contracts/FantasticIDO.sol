// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "./uniswapv2/interfaces/IUniswapV2Pair.sol";

contract FantasticIDO is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public FANTA;
    address public OTHER; // Stable Coin
    address public otherFANTALP;

    uint256 public totalAmount;
    uint256 public salePrice;
    uint256 public totalWhiteListed;
    uint256 public startOfSale;
    uint256 public endOfSale;

    bool public initialized;
    bool public whiteListEnabled;
    bool public cancelled;
    bool public finalized;
    
    mapping(address => bool) public boughtFANTA;
    mapping(address => bool) public whiteListed;

    address[] buyers;
    mapping(address => uint256) public purchasedAmounts;

    constructor(
        address _FANTA,
        address _OTHER,
        address _otherFANTALP
    ) public {
        require(_FANTA != address(0));
        require(_OTHER != address(0));
        require(_otherFANTALP != address(0));

        FANTA = _FANTA;
        OTHER = _OTHER;
        otherFANTALP = _otherFANTALP;
        cancelled = false;
        finalized = false;
    }

    function saleStarted() public view returns (bool) {
        return initialized && startOfSale <= block.timestamp;
    }

    function whiteListBuyers(address[] memory _buyers)
        external
        onlyOwner
        returns (bool)
    {
        require(saleStarted() == false, "Already started");

        totalWhiteListed = totalWhiteListed.add(_buyers.length);

        for (uint256 i; i < _buyers.length; i++) {
            whiteListed[_buyers[i]] = true;
        }

        return true;
    }

    function initialize(
        uint256 _totalAmount,
        uint256 _salePrice,
        uint256 _saleLength,
        uint256 _startOfSale
    ) external onlyOwner returns (bool) {
        require(initialized == false, "Already initialized");
        initialized = true;
        whiteListEnabled = true;
        totalAmount = _totalAmount;
        salePrice = _salePrice;
        startOfSale = _startOfSale;
        endOfSale = _startOfSale.add(_saleLength);
        return true;
    }

    function getAllotmentPerBuyer() public view returns (uint256) {
        if (whiteListEnabled) {
            return totalAmount.div(totalWhiteListed);
        } else {
            return Math.min(10000 * 1e18, totalAmount);
        }
    }

    function purchaseFANTA(uint256 _amountOTHER) external returns (bool) {
        require(saleStarted() == true, "Not started");
        require(
            !whiteListEnabled || whiteListed[msg.sender] == true,
            "Not whitelisted"
        );
        require(boughtFANTA[msg.sender] == false, "Already participated");

        boughtFANTA[msg.sender] = true;

        uint256 _purchaseAmount = _calculateSaleQuote(_amountOTHER);

        require(_purchaseAmount <= getAllotmentPerBuyer(), "More than allowed");
        if (whiteListEnabled) {
            totalWhiteListed = totalWhiteListed.sub(1);
        }

        totalAmount = totalAmount.sub(_purchaseAmount);

        purchasedAmounts[msg.sender] = _purchaseAmount;
        buyers.push(msg.sender);

        IERC20(OTHER).safeTransferFrom(msg.sender, address(this), _amountOTHER);

        return true;
    }

    function disableWhiteList() external onlyOwner {
        whiteListEnabled = false;
    }

    function _calculateSaleQuote(uint256 paymentAmount_)
        internal
        view
        returns (uint256)
    {
        return uint256(1e18).mul(paymentAmount_).div(salePrice);
    }

    function calculateSaleQuote(uint256 paymentAmount_)
        external
        view
        returns (uint256)
    {
        return _calculateSaleQuote(paymentAmount_);
    }

    /// @dev Only Emergency Use
    /// cancel the IDO and return the funds to all buyer
    function cancel() external onlyOwner {
        cancelled = true;
        startOfSale = 99999999999;
    }

    function withdraw() external {
        require(cancelled, "ido is not cancelled");
        uint256 amount = purchasedAmounts[msg.sender];
        IERC20(OTHER).transfer(msg.sender, (amount / 1e18) * salePrice);
    }

    function claim(address _recipient) external {
        require(finalized, "only can claim after finalized");
        require(purchasedAmounts[_recipient] > 0, "not purchased");

        uint256 amount = purchasedAmounts[_recipient];
        purchasedAmounts[_recipient] = 0;

        IERC20(FANTA).transfer(_recipient, amount);
    }

    function finalize() external onlyOwner {
        require(totalAmount <= 15_000_000 * 1e18, "at least ten fantas to be sold");

        finalized = true;

        uint256 totalPurchasedAmount = 20_000_000 * 1e18 - totalAmount;
        uint256 otherAmount = IERC20(OTHER).balanceOf(address(this));
        IERC20(FANTA).transfer(otherFANTALP, totalPurchasedAmount / 2);
        IERC20(OTHER).transfer(otherFANTALP, otherAmount);
        IUniswapV2Pair(otherFANTALP).mint(address(this));
    }
}
