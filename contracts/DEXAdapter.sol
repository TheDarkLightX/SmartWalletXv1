// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // Standardized Pragma

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Use SafeERC20 from OZ v4.x
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// Use ReentrancyGuard from OZ v4.x security path
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// Use Ownable from OZ v4.x
import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for Uniswap V2 Router (or compatible)
interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path)
        external
        view
        returns (uint[] memory amounts);
}

/**
 * @title DEXAdapter (Final V4 - For Cursor)
 * @dev Swaps a specified fee token for a burn token and sends it to a burn address.
 * Incorporates fixes based on audit findings, including robust slippage calculation,
 * configurable slippage tolerance, and deadline parameter. Uses OZv4 compatible patterns.
 */
contract DEXAdapter is ReentrancyGuard, Ownable { // Inherit Ownable for config
    // Use SafeERC20 for safeTransferFrom / safeApprove (safeApprove exists in v4)
    using SafeERC20 for IERC20;

    // Slippage tolerance in basis points (e.g., 100 = 1%). Now configurable.
    uint256 public slippageBps;
    uint256 private constant BP_DENOMINATOR = 10000;
    // Standard burn address
    address public constant BURN_ADDR = 0x000000000000000000000000000000000000dEaD;

    // Immutable addresses set at deployment
    IUniswapV2Router02 public immutable router;
    IERC20 public immutable feeToken;
    IERC20 public immutable burnToken;
    // Owner state managed by Ownable

    // Events
    event SwapAndBurn(address indexed caller, uint256 amountIn, uint256 amountBurned, uint256 amountOutMin);
    event SlippageUpdated(uint256 newSlippageBps);

    /**
     * @param _router Address of the Uniswap V2 compatible router.
     * @param _feeToken Address of the token being swapped FROM.
     * @param _burnToken Address of the token being swapped TO (and burned).
     * @param _initialOwner Owner address for configuration functions (e.g., setSlippage).
     * @param _initialSlippageBps Initial slippage tolerance (e.g., 100 for 1%).
     */
    constructor(
        address _router,
        address _feeToken,
        address _burnToken,
        address _initialOwner, // Renamed parameter
        uint256 _initialSlippageBps
    ) { // OZv4 Ownable constructor is implicit
        require(_router != address(0), "DEX: Invalid router address"); // Using DEX: prefix
        require(_feeToken != address(0), "DEX: Invalid fee token address");
        require(_burnToken != address(0), "DEX: Invalid burn token address");
        require(_initialOwner != address(0), "DEX: Invalid initial owner");
        require(_initialSlippageBps > 0 && _initialSlippageBps < BP_DENOMINATOR, "DEX: Invalid initial slippage");

        router = IUniswapV2Router02(_router);
        feeToken = IERC20(_feeToken);
        burnToken = IERC20(_burnToken);
        _transferOwnership(_initialOwner); // Set initial owner using OZ v4 pattern
        slippageBps = _initialSlippageBps; // Set initial slippage
        emit SlippageUpdated(_initialSlippageBps);
    }

    /**
     * @notice Updates the slippage tolerance.
     * @dev Callable only by the owner. Max reasonable slippage often < 10% (1000 bps).
     * @param _newSlippageBps New slippage in basis points (e.g., 50 for 0.5%).
     */
    function setSlippage(uint256 _newSlippageBps) external onlyOwner {
        require(_newSlippageBps > 0 && _newSlippageBps < BP_DENOMINATOR, "DEX: Invalid slippage"); // Basic bounds check
        slippageBps = _newSlippageBps;
        emit SlippageUpdated(_newSlippageBps);
    }

    /**
     * @notice Swaps `amountIn` of `feeToken` for `burnToken` and sends to `BURN_ADDR`.
     * @param amountIn The amount of `feeToken` to swap.
     * @param deadline The deadline for the swap transaction.
     * @return success True if the swap resulted in burning at least `amountOutMin` tokens.
     * @return burned The actual amount of `burnToken` sent to the burn address.
     */
    function swapAndBurn(uint256 amountIn, uint256 deadline) // Added deadline parameter
        external
        nonReentrant // Prevent reentrancy
        returns (bool success, uint256 burned)
    {
        require(amountIn > 0, "DEX: Input amount must be > 0");
        require(deadline >= block.timestamp, "DEX: Deadline passed"); // Check deadline

        // Pull feeToken from caller
        feeToken.safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router using safeApprove (available in OZ v4.x)
        // @dev Consider permit pattern (EIP-2612) for gas savings if feeToken supports it.
        feeToken.safeApprove(address(router), 0); // Reset approval first
        feeToken.safeApprove(address(router), amountIn);

        // Prepare swap path
        address[] memory path = new address[](2);
        path[0] = address(feeToken);
        path[1] = address(burnToken);

        // --- Improved Slippage Calculation (Audit #2 Finding - Fixed) ---
        uint[] memory amountsOut = router.getAmountsOut(amountIn, path);
        uint expectedAmountOut = amountsOut[amountsOut.length - 1];
        uint256 slippageAmount = (expectedAmountOut * slippageBps) / BP_DENOMINATOR; // Use configurable state variable
        // Prevent underflow if slippage amount is greater than expected amount
        uint256 amountOutMin = (slippageAmount >= expectedAmountOut) ? 0 : expectedAmountOut - slippageAmount;
        require(amountOutMin > 0, "DEX: amountOutMin calculation resulted in zero or less");
        // --- End Improved Slippage Calculation ---

        // Execute swap using the calculated amountOutMin and provided deadline
        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            amountOutMin, // Use the calculated min amount
            path,
            BURN_ADDR, // Send directly to burn address
            deadline // Use provided deadline
        );

        // Get actual amount burned (last amount in the path)
        burned = amounts[amounts.length - 1];

        // Check success condition
        success = burned >= amountOutMin; // Correct success check

        emit SwapAndBurn(msg.sender, amountIn, burned, amountOutMin);
    }
}

