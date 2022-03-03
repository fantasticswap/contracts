// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "../interfaces/IRewarder.sol";

contract RewarderBrokenMock is IRewarder {
    function onFantaReward(
        uint256,
        address,
        address,
        uint256,
        uint256
    ) external override {
        revert();
    }

    function pendingTokens(
        uint256,
        address,
        uint256
    ) external view override returns (IERC20[] memory, uint256[] memory) {
        revert();
    }
}
