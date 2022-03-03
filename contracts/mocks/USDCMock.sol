// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Just for test
contract USDCMock is ERC20 {
    constructor(uint256 supply) public ERC20("USD Coin", "USDC") {
        _setupDecimals(6);
        _mint(msg.sender, supply);
    }
}
