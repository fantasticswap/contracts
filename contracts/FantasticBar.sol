// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// FantasticBar is the coolest bar in town. You come in with some Fanta, and leave with more! The longer you stay, the more Fanta you get.
//
// This contract handles swapping to and from xFanta, FantasticSwap's staking token.
contract FantasticBar is ERC20("FantasticBar", "xFANTA") {
    using SafeMath for uint256;
    IERC20 public fanta;

    // Define the Fanta token contract
    constructor(IERC20 _fanta) public {
        fanta = _fanta;
    }

    // Enter the bar. Pay some FANTAs. Earn some shares.
    // Locks Fanta and mints xFanta
    function enter(uint256 _amount) public {
        // Gets the amount of Fanta locked in the contract
        uint256 totalFanta = fanta.balanceOf(address(this));
        // Gets the amount of xFanta in existence
        uint256 totalShares = totalSupply();
        // If no xFanta exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalFanta == 0) {
            _mint(msg.sender, _amount);
        }
        // Calculate and mint the amount of xFanta the Fanta is worth. The ratio will change overtime, as xFanta is burned/minted and Fanta deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalFanta);
            _mint(msg.sender, what);
        }
        // Lock the Fanta in the contract
        fanta.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your FANTAs.
    // Unlocks the staked + gained Fanta and burns xFanta
    function leave(uint256 _share) public {
        // Gets the amount of xFanta in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Fanta the xFanta is worth
        uint256 what = _share.mul(fanta.balanceOf(address(this))).div(
            totalShares
        );
        _burn(msg.sender, _share);
        fanta.transfer(msg.sender, what);
    }
}
