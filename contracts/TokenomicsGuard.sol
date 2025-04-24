// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// Correct Import Path for OpenZeppelin Contracts v4.x
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Use SafeERC20 from OZ v4.x
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interface for the DEX Adapter used for burning
interface IDexAdapter {
    // Assumes swapAndBurn takes amountIn and deadline
    // Ensure this matches the actual DEXAdapter interface used
    function swapAndBurn(uint256 feeAmount, uint256 deadline) external returns (bool success, uint256 burned);
}

/**
 * @title TokenomicsGuard (Final V4 - For Cursor)
 * @dev Receives fees directly transferred from another contract (e.g., SmartAccount),
 * then processes them (splits fee, triggers swap/burn via DEX adapter).
 * Includes replay protection, deadline input, improved event logging, handles zero fees gracefully,
 * and emits an event when zero-fee processing is skipped. Uses OZv4 compatible patterns.
 */
contract TokenomicsGuard is ReentrancyGuard { // Inherits ReentrancyGuard
    // Use SafeERC20 for safeTransfer / safeApprove (safeApprove exists in v4)
    using SafeERC20 for IERC20;

    // Fee/Split constants
    uint256 public constant DEV_SPLIT_BP = 2500; // 25%
    uint256 public constant BURN_SPLIT_BP = 7500; // 75%
    uint256 public constant BP_DENOMINATOR = 10000;

    // Immutable addresses
    address public immutable DEV_FUND;
    IERC20 public immutable FEE_TOKEN;
    IDexAdapter public immutable dexAdapter;

    // Replay protection state
    mapping(bytes32 => bool) public processedFeeOperations;

    // Events
    event FeeProcessed(address indexed caller, bytes32 indexed operationId, uint256 feeAmount, uint256 devAmount, uint256 burnAmount);
    event BurnExecuted(uint256 burnedAmount);
    event FeeProcessingSkipped(address indexed caller, bytes32 indexed operationId); // Added Event

    constructor(address _feeToken, address _devFund, address _dexAdapter) {
        require(_feeToken != address(0), "TG: Invalid fee token address"); // Using TG: prefix
        require(_devFund != address(0), "TG: Invalid dev fund address");
        require(_dexAdapter != address(0), "TG: Invalid dex adapter address");
        require(DEV_SPLIT_BP + BURN_SPLIT_BP == BP_DENOMINATOR, "TG: Split percentages mismatch");

        FEE_TOKEN = IERC20(_feeToken);
        DEV_FUND = _devFund;
        dexAdapter = IDexAdapter(_dexAdapter);
    }

    /**
     * @notice Processes a fee amount that should have been transferred to this contract beforehand.
     * @dev Handles feeAmount == 0 gracefully by returning early. Includes replay protection.
     * The caller (e.g., SmartAccount) is responsible for transferring the feeAmount to this contract
     * *before* calling this function, and for providing a unique operationId.
     * @param feeAmount The amount of FEE_TOKEN that was (or should have been) transferred.
     * @param deadline The timestamp after which the DEX swap should fail.
     * @param operationId A unique identifier for this specific fee payment operation, provided
     * by the caller to prevent replay attacks (e.g., keccak256(abi.encodePacked(smartAccountNonce))).
     */
    function processReceivedFees(uint256 feeAmount, uint256 deadline, bytes32 operationId) external nonReentrant {
        // Replay Protection
        require(!processedFeeOperations[operationId], "TG: Operation already processed");
        processedFeeOperations[operationId] = true; // Mark as processed immediately

        // Zero-Fee Handling (Audit #2 Finding - Fixed)
        if (feeAmount == 0) {
            emit FeeProcessingSkipped(msg.sender, operationId); // Emit event for skipped case
            return;
        }

        // --- Fee Processing Logic (for feeAmount > 0) ---

        // Verify this contract has received sufficient funds BEFORE processing.
        uint256 currentBalance = FEE_TOKEN.balanceOf(address(this));
        require(currentBalance >= feeAmount, "TG: Insufficient fee balance received");

        // Calculate splits based on the fee amount intended for processing
        uint256 devAmt = (feeAmount * DEV_SPLIT_BP) / BP_DENOMINATOR;
        uint256 burnAmt = feeAmount - devAmt;

        // Transfer dev share
        if (devAmt > 0) {
            FEE_TOKEN.safeTransfer(DEV_FUND, devAmt);
        }

        // Approve and call DEX Adapter for burn share
        if (burnAmt > 0) {
            // Use safeApprove (available in OZ v4.x)
            FEE_TOKEN.safeApprove(address(dexAdapter), 0);
            FEE_TOKEN.safeApprove(address(dexAdapter), burnAmt);

            // Call swap and burn, passing deadline
            (bool success, uint256 burned) = dexAdapter.swapAndBurn(burnAmt, deadline);
            require(success, "TG: DEX adapter swap/burn failed");

            emit BurnExecuted(burned);
        }

        // Emit processing details including caller and operationId
        emit FeeProcessed(msg.sender, operationId, feeAmount, devAmt, burnAmt);
    }


    /**
     * @notice Original preExec hook. No longer handles fee logic in the redesigned flow.
     * @dev Kept for potential interface compatibility, performs no actions. Made pure.
     */
    // Removed unused parameter names
    function preExec(bytes calldata /* contextData */, bytes32 /* contextHash */) external pure returns (uint256) {
        return 0;
    }

    /**
     * @notice Original postExec hook. Performs no actions.
     */
    // Removed unused parameter names
    function postExec(bytes calldata /* contextData */, bytes32 /* contextHash */, bool /* success */) external pure {}
}

