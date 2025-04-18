// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract DEXAdapter {
    uint256 public constant SLIPPAGE_BP = 100;
    uint256 private constant BP_DENOMINATOR = 10000;
    address public constant BURN_ADDR = 0x000000000000000000000000000000000000dEaD;

    IUniswapV2Router02 public immutable router;
    IERC20 public immutable feeToken;
    IERC20 public immutable burnToken;

    event SwapAndBurn(uint256 amountIn, uint256 amountOut);

    constructor(address _router, address _feeToken, address _burnToken) {
        router = IUniswapV2Router02(_router);
        feeToken = IERC20(_feeToken);
        burnToken = IERC20(_burnToken);
    }

    function swapAndBurn(uint256 amountIn) external returns (bool success, uint256 burned) {
        require(amountIn > 0, "AMOUNT_ZERO");
        feeToken.transferFrom(msg.sender, address(this), amountIn);
        feeToken.approve(address(router), amountIn);
        address[] memory path = new address[](2);
        path[0] = address(feeToken);
        path[1] = address(burnToken);
        uint256 amountOutMin = amountIn - ((amountIn * SLIPPAGE_BP) / BP_DENOMINATOR);
        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            BURN_ADDR,
            block.timestamp + 300
        );
        burned = amounts[amounts.length - 1];
        emit SwapAndBurn(amountIn, burned);
        success = burned > 0;
    }
}
