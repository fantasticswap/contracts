// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "../interfaces/IRewarder.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringMath.sol";

contract RewarderMock is IRewarder {
    using BoringMath for uint256;
    using BoringERC20 for IERC20;
    uint256 private immutable rewardMultiplier;
    IERC20 private immutable rewardToken;
    uint256 private constant REWARD_TOKEN_DIVISOR = 1e18;
    address private immutable FANTASTICCHEF;

    constructor(
        uint256 _rewardMultiplier,
        IERC20 _rewardToken,
        address _FANTASTICCHEF
    ) public {
        rewardMultiplier = _rewardMultiplier;
        rewardToken = _rewardToken;
        FANTASTICCHEF = _FANTASTICCHEF;
    }

    function onFantaReward(
        uint256,
        address,
        address to,
        uint256 fantaAmount,
        uint256
    ) external override onlyFC {
        uint256 pendingReward = fantaAmount.mul(rewardMultiplier) /
            REWARD_TOKEN_DIVISOR;
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        if (pendingReward > rewardBal) {
            rewardToken.safeTransfer(to, rewardBal);
        } else {
            rewardToken.safeTransfer(to, pendingReward);
        }
    }

    function pendingTokens(
        uint256,
        address,
        uint256 fantaAmount
    )
        external
        view
        override
        returns (IERC20[] memory rewardTokens, uint256[] memory rewardAmounts)
    {
        IERC20[] memory _rewardTokens = new IERC20[](1);
        _rewardTokens[0] = (rewardToken);
        uint256[] memory _rewardAmounts = new uint256[](1);
        _rewardAmounts[0] =
            fantaAmount.mul(rewardMultiplier) /
            REWARD_TOKEN_DIVISOR;
        return (_rewardTokens, _rewardAmounts);
    }

    modifier onlyFC() {
        require(
            msg.sender == FANTASTICCHEF,
            "Only FantasticChef can call this function."
        );
        _;
    }
}
