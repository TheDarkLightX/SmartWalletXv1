// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23; // Standardized Pragma

// Correct Import Path for OpenZeppelin Contracts v4.x
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Use SafeERC20 from OZ v4.x
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// Use Ownable from OZ v4.x
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PrivacyAdapter (Final V4 - For Cursor)
 * @dev Bridges tokens to/from specific L1/L2 bridges (Aztec, ZkSync examples).
 * Includes SafeERC20, ReentrancyGuard, input validation, specific events,
 * and an owner-controlled emergency sweep function for stuck ERC20/ETH tokens.
 * Assumes external bridge calls revert on failure. Uses OZv4 compatible patterns.
 */

// Interface matching original Aztec interaction (example)
interface IAztecBridge {
    function deposit(address token, uint256 amount, address recipient) external returns (bytes32 noteHash);
    function withdraw(bytes32 noteHash, address recipient) external returns (uint256 amount);
}

// Interface matching original ZkSync L1 interaction (example)
interface IZkSyncL1Bridge {
    function deposit(address l2Receiver, address l1Token, uint256 amount) external payable returns (bytes32 l2TxHash);
    function claimWithdrawal(address l2Token, uint256 amount, bytes calldata proof) external;
}

// Inherit Ownable for sweep function access control
contract PrivacyAdapter is ReentrancyGuard, Ownable { // Inherits OZv4 Ownable
    // Use SafeERC20 for safeTransferFrom / safeTransfer / safeApprove (safeApprove exists in v4)
    using SafeERC20 for IERC20;

    // --- State ---
    IAztecBridge public immutable aztecBridge;
    IZkSyncL1Bridge public immutable zksyncBridge;

    // --- Events ---
    event AztecShielded(address indexed sender, address indexed token, uint256 amount, address indexed recipient, bytes32 noteHash);
    event AztecUnshielded(address indexed caller, bytes32 indexed noteHash, address indexed recipient, uint256 amount);
    event ZkSyncDeposited(address indexed sender, address indexed token, uint256 amount, address indexed recipient, bytes32 l2TxHash);
    event ZkSyncWithdrawalClaimed(address indexed caller, address indexed token, uint256 amount, address indexed recipient);
    event TokensSwept(address indexed token, address indexed recipient, uint256 amount);
    event ETHSwept(address indexed recipient, uint256 amount); // Added ETH Event

    // --- Constructor ---
    // Accepts bridge addresses and initial owner for Ownable functions
    // Uses _transferOwnership for OZ v4.x compatibility
    constructor(
        address _aztecBridgeAddr,
        address _zksyncBridgeAddr,
        address _initialOwner // Renamed parameter
    ) { // OZv4 Ownable constructor is implicit
        require(_aztecBridgeAddr != address(0), "PA: Invalid Aztec bridge address"); // Using PA prefix
        require(_zksyncBridgeAddr != address(0), "PA: Invalid ZkSync bridge address");
        require(_initialOwner != address(0), "PA: Invalid initial owner");
        aztecBridge = IAztecBridge(_aztecBridgeAddr);
        zksyncBridge = IZkSyncL1Bridge(_zksyncBridgeAddr);
        _transferOwnership(_initialOwner); // Set initial owner using OZ v4 pattern
    }

    // --- Aztec Functions ---

    /**
     * @notice Deposits tokens into the Aztec bridge.
     */
    function shieldAztec(address token, uint256 amount, address recipient)
        external
        nonReentrant
        returns (bytes32 noteHash)
    {
        require(token != address(0), "PA: Invalid token address");
        require(amount > 0, "PA: Amount must be > 0");
        require(recipient != address(0), "PA: Invalid recipient address");

        // Pull tokens from sender
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Approve bridge using safeApprove (available in OZ v4.x)
        IERC20(token).safeApprove(address(aztecBridge), 0);
        IERC20(token).safeApprove(address(aztecBridge), amount);

        // Call bridge deposit - relies on revert on failure
        // @dev Assumes aztecBridge.deposit reverts on internal errors.
        noteHash = aztecBridge.deposit(token, amount, recipient);

        emit AztecShielded(msg.sender, token, amount, recipient, noteHash);
    }

    /**
     * @notice Withdraws tokens from the Aztec bridge using a note hash.
     * @dev Assumes the bridge sends tokens directly to the recipient.
     */
    function unshieldAztec(bytes32 noteHash, address recipient)
        external
        nonReentrant
        returns (uint256 withdrawnAmount)
    {
        require(recipient != address(0), "PA: Invalid recipient address");
        // noteHash validation might depend on Aztec specifics

        // Call bridge withdraw - relies on revert on failure
        // @dev Assumes aztecBridge.withdraw reverts on internal errors.
        withdrawnAmount = aztecBridge.withdraw(noteHash, recipient);
        require(withdrawnAmount > 0, "PA: Withdraw amount was zero"); // Basic sanity check

        emit AztecUnshielded(msg.sender, noteHash, recipient, withdrawnAmount);
    }

    // --- ZkSync Functions ---

    /**
     * @notice Deposits tokens or ETH into the ZkSync L1 bridge.
     */
    function depositZkSync(address token, uint256 amount, address recipient)
        external
        payable // Make payable in case native ETH is deposited
        nonReentrant
        returns (bytes32 l2TxHash)
    {
        require(amount > 0, "PA: Amount must be > 0");
        require(recipient != address(0), "PA: Invalid recipient address");

        uint256 ethValue = 0;
        // Handle ERC20 deposit
        if (token != address(0)) { // Assuming address(0) is NOT used for native ETH sentinel
             require(msg.value == 0, "PA: ETH sent with ERC20 deposit"); // Ensure no ETH sent for ERC20
             IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
             // Approve bridge using safeApprove (available in OZ v4.x)
             IERC20(token).safeApprove(address(zksyncBridge), 0);
             IERC20(token).safeApprove(address(zksyncBridge), amount);
        } else {
        // Handle Native ETH deposit
             require(msg.value == amount, "PA: Incorrect ETH value sent");
             ethValue = amount;
             // No transferFrom/approve needed for ETH
        }

        // Call bridge deposit - relies on revert on failure
        // @dev Assumes zksyncBridge.deposit reverts on internal errors.
        l2TxHash = zksyncBridge.deposit{value: ethValue}(recipient, token, amount);

        emit ZkSyncDeposited(msg.sender, token, amount, recipient, l2TxHash);
    }

     /**
     * @notice Claims a withdrawal from the ZkSync L1 bridge.
     * @dev Assumes the bridge holds withdrawn funds until claimed via proof.
     * Sends claimed tokens to the caller (`msg.sender`).
     */
    function claimZkSyncWithdrawal(address l2Token, uint256 amount, bytes calldata proof)
        external
        nonReentrant
    {
        require(l2Token != address(0), "PA: Invalid token address");
        require(amount > 0, "PA: Amount must be > 0");
        // Proof validation happens within the bridge

        // Call bridge claimWithdrawal - relies on revert on failure
        // This call should trigger the bridge to send `amount` of `l2Token` to this contract.
        // @dev Assumes zksyncBridge.claimWithdrawal reverts on internal errors.
        zksyncBridge.claimWithdrawal(l2Token, amount, proof);

        // Forward the received tokens to the caller
        IERC20(l2Token).safeTransfer(msg.sender, amount);

        emit ZkSyncWithdrawalClaimed(msg.sender, l2Token, amount, msg.sender);
    }

    // --- Owner Functions ---

    /**
     * @notice Allows the owner to withdraw any ERC20 tokens mistakenly sent or stuck in this contract.
     * @dev Added based on Audit #2 recommendation for emergency recovery.
     */
    function sweepERC20(address token) external onlyOwner nonReentrant {
        require(token != address(0), "PA: Invalid token address");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "PA: No tokens to sweep");

        address recipient = owner(); // Cache owner address
        IERC20(token).safeTransfer(recipient, balance);

        emit TokensSwept(token, recipient, balance);
    }

     /**
     * @notice Allows the owner to withdraw any native ETH mistakenly sent to this contract.
     * @dev Added for completeness alongside sweepERC20.
     */
    function sweepETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "PA: No ETH to sweep");

        address recipient = owner(); // Cache owner address
        // Use call to send ETH, check success
        (bool success, ) = recipient.call{value: balance}("");
        require(success, "PA: ETH sweep failed");

        emit ETHSwept(recipient, balance); // Added ETHSwept event
    }
}

