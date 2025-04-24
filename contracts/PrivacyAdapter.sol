// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // Standardized Pragma

// Correct Import Path for OpenZeppelin Contracts v4.x
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Use SafeERC20 from OZ v4.x
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// Use Ownable from OZ v4.x
import "@openzeppelin/contracts/access/Ownable.sol";

// --- Interfaces ---
/**
 * @title IAztecBridge
 * @notice Interface for interacting with the Aztec privacy bridge
 * @dev This interface defines the methods needed to deposit and withdraw tokens from Aztec
 */
interface IAztecBridge {
    /**
     * @notice Deposits tokens into the Aztec network
     * @param token The address of the ERC20 token to deposit
     * @param amount The amount of tokens to deposit
     * @param recipient The recipient address on Aztec
     * @return noteHash A unique identifier for this shielded transfer
     */
    function deposit(address token, uint256 amount, address recipient) external returns (bytes32 noteHash);
    
    /**
     * @notice Withdraws tokens from the Aztec network
     * @param noteHash The note hash identifying the shielded tokens
     * @param recipient The recipient address to receive the unshielded tokens
     * @return amount The amount of tokens withdrawn
     */
    function withdraw(bytes32 noteHash, address recipient) external returns (uint256 amount);
}

/**
 * @title IZkSyncL1Bridge
 * @notice Interface for interacting with the ZkSync L1 bridge
 * @dev This interface defines the methods needed to deposit and claim withdrawals from ZkSync
 */
interface IZkSyncL1Bridge {
    /**
     * @notice Deposits tokens or ETH to the ZkSync network
     * @param l2Receiver The recipient address on ZkSync L2
     * @param l1Token The L1 token address (address(0) for ETH)
     * @param amount The amount to deposit
     * @return l2TxHash The transaction hash on L2
     */
    function deposit(address l2Receiver, address l1Token, uint256 amount) external payable returns (bytes32 l2TxHash);
    
    /**
     * @notice Claims a withdrawal from ZkSync to L1
     * @param l2Token The L2 token address
     * @param amount The amount to withdraw
     * @param proof The proof of withdrawal
     */
    function claimWithdrawal(address l2Token, uint256 amount, bytes calldata proof) external;
}

/**
 * @title PrivacyAdapter
 * @notice A bridge for transferring tokens to and from privacy-focused Layer 2 solutions.
 * This contract enables users to easily move assets between Ethereum and privacy networks
 * like Aztec and ZkSync, providing an abstraction layer over the underlying bridge protocols.
 * @dev Implements safe token handling with ReentrancyGuard and SafeERC20. Provides functions
 * for shielding/unshielding tokens via Aztec and depositing/withdrawing via ZkSync.
 * Includes emergency recovery functions for stuck tokens. Assumes external bridge calls
 * will revert on failure. Uses OZv4 compatible patterns.
 */
contract PrivacyAdapter is ReentrancyGuard, Ownable { // Inherits OZv4 Ownable
    // Use SafeERC20 for safeTransferFrom / safeTransfer / safeApprove (safeApprove exists in v4)
    using SafeERC20 for IERC20;

    // --- State ---
    /** @notice Immutable reference to the Aztec bridge contract */
    IAztecBridge public immutable aztecBridge;
    
    /** @notice Immutable reference to the ZkSync L1 bridge contract */
    IZkSyncL1Bridge public immutable zksyncBridge;

    // --- Events ---
    /** @dev Emitted when tokens are shielded through the Aztec bridge */
    event AztecShielded(address indexed sender, address indexed token, uint256 amount, address indexed recipient, bytes32 noteHash);
    
    /** @dev Emitted when tokens are unshielded from the Aztec bridge */
    event AztecUnshielded(address indexed caller, bytes32 indexed noteHash, address indexed recipient, uint256 amount);
    
    /** @dev Emitted when tokens are deposited to the ZkSync bridge */
    event ZkSyncDeposited(address indexed sender, address indexed token, uint256 amount, address indexed recipient, bytes32 l2TxHash);
    
    /** @dev Emitted when a ZkSync withdrawal is claimed */
    event ZkSyncWithdrawalClaimed(address indexed caller, address indexed token, uint256 amount, address indexed recipient);
    
    /** @dev Emitted when stuck ERC20 tokens are swept by the owner */
    event TokensSwept(address indexed token, address indexed recipient, uint256 amount);
    
    /** @dev Emitted when stuck ETH is swept by the owner */
    event ETHSwept(address indexed recipient, uint256 amount);

    // --- Constructor ---
    /**
     * @notice Deploys the PrivacyAdapter with references to the required bridges.
     * @dev Sets immutable references to the bridge contracts and transfers ownership
     * to the provided initial owner. Uses OZv4 ownership pattern.
     * @param _aztecBridgeAddr The address of the Aztec bridge contract
     * @param _zksyncBridgeAddr The address of the ZkSync L1 bridge contract
     * @param _initialOwner The address that will own this adapter and control sweep functions
     */
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
     * @notice Deposits tokens into the Aztec network for privacy.
     * @dev Pulls tokens from the sender to this contract, approves the bridge to spend them,
     * then calls the bridge's deposit function. Implements reentrancy protection and emits
     * an event with all relevant information, including the returned note hash.
     * @param token The address of the ERC20 token to shield
     * @param amount The amount of tokens to shield
     * @param recipient The recipient address on Aztec
     * @return noteHash A unique identifier for this shielded transfer, returned by the bridge
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
     * @notice Withdraws tokens from the Aztec network back to Ethereum.
     * @dev Calls the bridge's withdraw function and assumes the bridge sends tokens directly
     * to the specified recipient. Implements reentrancy protection and validates that the
     * withdrawn amount is greater than zero as a basic sanity check.
     * @param noteHash The note hash identifying the shielded tokens
     * @param recipient The address to receive the unshielded tokens
     * @return withdrawnAmount The amount of tokens withdrawn, as reported by the bridge
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
     * @dev Handles both ERC20 tokens and native ETH deposits. For ERC20 tokens, pulls 
     * them from the sender and approves the bridge to spend them. For ETH, verifies the 
     * sent value matches the specified amount. Implements reentrancy protection and 
     * emits an event with all details including the L2 transaction hash.
     * @param token The token address (address(0) for native ETH)
     * @param amount The amount of tokens or ETH to deposit
     * @param recipient The recipient address on ZkSync L2
     * @return l2TxHash The transaction hash on L2, returned by the bridge
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
     * @dev Calls the bridge's claimWithdrawal function which should trigger the bridge to 
     * send tokens to this contract. Then forwards the received tokens to the caller.
     * Implements reentrancy protection and emits an event with all relevant details.
     * @param l2Token The L2 token address to withdraw
     * @param amount The amount to withdraw
     * @param proof The proof of withdrawal required by the bridge
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
     * @dev Emergency recovery function callable only by the owner. Gets the contract's token 
     * balance and transfers all tokens to the owner. Implements reentrancy protection and
     * emits an event with the details of the sweep operation.
     * @param token The address of the ERC20 token to sweep
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
     * @dev Emergency recovery function callable only by the owner. Gets the contract's ETH
     * balance and transfers all ETH to the owner using a low-level call. Implements reentrancy
     * protection and checks the success of the ETH transfer, emitting an event with the details.
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

