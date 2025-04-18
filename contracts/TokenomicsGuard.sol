// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDexAdapter {
    function swapAndBurn(uint256 feeAmount) external returns (bool success, uint256 burned);
}

contract TokenomicsGuard is ReentrancyGuard {
    uint256 public constant BASE_FEE_BP = 20;
    uint256 public constant DEV_SPLIT_BP = 2500;
    uint256 public constant BURN_SPLIT_BP = 7500;
    uint256 public constant BP_DENOMINATOR = 10000;

    address public immutable DEV_FUND;
    IERC20 public immutable FEE_TOKEN;
    IDexAdapter public immutable dexAdapter;

    event FeeCharged(address indexed payer, uint256 amount);
    event FeeSplit(uint256 devAmount, uint256 burnAmount);
    event BurnExecuted(uint256 burnedAmount);

    constructor(address _feeToken, address _devFund, address _dexAdapter) {
        FEE_TOKEN = IERC20(_feeToken);
        DEV_FUND = _devFund;
        dexAdapter = IDexAdapter(_dexAdapter);
        require(DEV_SPLIT_BP + BURN_SPLIT_BP == BP_DENOMINATOR, "SPLIT_ERR");
    }

    function preExec(bytes calldata, bytes32) external nonReentrant returns (uint256) {
        uint256 balanceBefore = FEE_TOKEN.balanceOf(address(this));
        uint256 fee = (balanceBefore * BASE_FEE_BP) / BP_DENOMINATOR;
        require(FEE_TOKEN.transferFrom(msg.sender, address(this), fee), "FEE_PULL_FAIL");
        uint256 devAmt = (fee * DEV_SPLIT_BP) / BP_DENOMINATOR;
        uint256 burnAmt = fee - devAmt;
        require(FEE_TOKEN.transfer(DEV_FUND, devAmt), "DEV_XFER_FAIL");
        emit FeeSplit(devAmt, burnAmt);
        FEE_TOKEN.approve(address(dexAdapter), burnAmt);
        (bool success, uint256 burned) = dexAdapter.swapAndBurn(burnAmt);
        require(success && burned > 0, "BURN_FAIL");
        emit BurnExecuted(burned);
        emit FeeCharged(msg.sender, fee);
        return fee;
    }

    function postExec(bytes calldata, bytes32, bool) external pure {}
}
