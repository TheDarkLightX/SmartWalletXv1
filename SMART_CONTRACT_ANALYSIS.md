# Smart Contract Analysis Document

This document provides a detailed analysis of each function in the SecureWalletApp smart contracts, examining implementation details, security considerations, and potential edge cases.

## 1. KeyRegistry Contract

The KeyRegistry contract manages session keys by mapping attestation quote hashes to key addresses and tracking key registration status.

### State Variables

- `quoteToKey`: A mapping from quote hash to session key address
- `isKeyRegistered`: A mapping to track if an address is currently registered as a session key

### Events

- `KeyRegistered`: Emitted when a session key is registered
- `KeyDeregistered`: Emitted when a session key is deregistered

### Constructor

```solidity
constructor(address _initialOwner)
```

**Implementation Details:**
- Requires a non-zero address as the initial owner
- Transfers ownership to the provided address using OpenZeppelin's `_transferOwnership`
- Uses OZ v4.x pattern for ownership initialization

**Security Considerations:**
- Properly validates owner address to prevent zero-address ownership
- Uses established OpenZeppelin ownership pattern for secure access control

### Function: registerKey

```solidity
function registerKey(bytes32 quoteHash, address sessionKey) external onlyOwner
```

**Implementation Details:**
- Registers a session key against a quote hash
- Callable only by the contract owner
- If the quote hash was previously associated with a different key, the old key is deregistered
- Updates both `quoteToKey` and `isKeyRegistered` mappings

**Security Considerations:**
- Includes zero-address validation for the session key
- Handles hash collisions by deregistering the previous key
- Properly emits events for both implicit deregistration and new registration
- Uses `onlyOwner` modifier to restrict access

### Function: deregisterKey

```solidity
function deregisterKey(bytes32 quoteHash) external onlyOwner
```

**Implementation Details:**
- Deregisters a session key using its quote hash
- Callable only by the contract owner
- Gracefully handles non-existent keys without reverting (idempotent)
- Clears both the quote-to-key mapping and the key registration status

**Security Considerations:**
- Safely handles the case where no key is associated with the hash
- Checks if the key is registered before setting to false and emitting events (gas optimization)
- Uses `onlyOwner` modifier to restrict access

### Function: getKeyRegistrationStatus

```solidity
function getKeyRegistrationStatus(address sessionKey) external view returns (bool)
```

**Implementation Details:**
- Provides an external view function to check if a key is registered
- Returns a boolean indicating registration status

**Security Considerations:**
- Pure view function with no state changes, so no security risks

### Function: getKeyForQuote

```solidity
function getKeyForQuote(bytes32 quoteHash) external view returns (address)
```

**Implementation Details:**
- Provides an external view function to get the session key associated with a quote hash
- Returns the session key address or address(0) if none exists

**Security Considerations:**
- Pure view function with no state changes, so no security risks

## 2. RecoveryGuard Contract

The RecoveryGuard contract works with a GuardianManager to block actions during recovery timelock periods.

### State Variables

- `gm`: Immutable reference to the GuardianManager contract

### Constructor

```solidity
constructor(address guardianManager)
```

**Implementation Details:**
- Accepts an address for the GuardianManager
- Sets an immutable reference to the GuardianManager

**Security Considerations:**
- Validates the GuardianManager address to prevent zero-address references
- Uses an immutable variable to prevent tampering

### Function: preExec

```solidity
function preExec(bytes calldata /* contextData */, bytes32 /* contextHash */) external view returns (uint256)
```

**Implementation Details:**
- Checks if a recovery process is active and within its timelock period
- If a recovery is proposed, not executed, and within the timelock, the function reverts
- Otherwise, it allows execution by returning 0

**Security Considerations:**
- Critical timelock logic to prevent actions during a recovery process
- Handles boundary conditions correctly (action is blocked when timestamp is within [proposed, proposed + TIMELOCK) range)
- Uses view function for gas optimization
- Fixed comparison logic (use of >= based on audit findings)

### Function: postExec

```solidity
function postExec(bytes calldata /* contextData */, bytes32 /* contextHash */, bool /* success */) external pure
```

**Implementation Details:**
- Post-execution hook that performs no actions
- Included for interface compatibility

**Security Considerations:**
- Pure function with no state changes or actions, so no security risks

## 3. PrivacyAdapter Contract

The PrivacyAdapter bridges tokens to/from privacy solutions (Aztec, ZkSync).

### State Variables

- `aztecBridge`: Immutable reference to the Aztec bridge
- `zksyncBridge`: Immutable reference to the ZkSync bridge

### Events

- `AztecShielded`: Emitted when tokens are shielded through Aztec
- `AztecUnshielded`: Emitted when tokens are unshielded from Aztec
- `ZkSyncDeposited`: Emitted when tokens are deposited to ZkSync
- `ZkSyncWithdrawalClaimed`: Emitted when a ZkSync withdrawal is claimed
- `TokensSwept`: Emitted when ERC20 tokens are swept by the owner
- `ETHSwept`: Emitted when ETH is swept by the owner

### Constructor

```solidity
constructor(address _aztecBridgeAddr, address _zksyncBridgeAddr, address _initialOwner)
```

**Implementation Details:**
- Accepts addresses for the Aztec bridge, ZkSync bridge, and initial owner
- Sets immutable references to the bridges
- Transfers ownership to the provided owner

**Security Considerations:**
- Validates all addresses to prevent zero-address references
- Uses immutable variables to prevent tampering
- Uses OZ v4.x pattern for ownership initialization

### Function: shieldAztec

```solidity
function shieldAztec(address token, uint256 amount, address recipient) external nonReentrant returns (bytes32 noteHash)
```

**Implementation Details:**
- Deposits tokens into the Aztec bridge
- Pulls tokens from the sender to this contract
- Approves the bridge to spend the tokens
- Calls the bridge's deposit function
- Returns the note hash from the bridge

**Security Considerations:**
- Uses `nonReentrant` modifier to prevent reentrancy attacks
- Validates token address, amount, and recipient
- Uses SafeERC20 for token transfers and approvals
- Sets approval to 0 before setting to amount (safer pattern for some tokens)
- Emits events with all relevant information

### Function: unshieldAztec

```solidity
function unshieldAztec(bytes32 noteHash, address recipient) external nonReentrant returns (uint256 withdrawnAmount)
```

**Implementation Details:**
- Withdraws tokens from the Aztec bridge using a note hash
- Calls the bridge's withdraw function
- Returns the withdrawn amount from the bridge

**Security Considerations:**
- Uses `nonReentrant` modifier to prevent reentrancy attacks
- Validates recipient address
- Checks that the withdrawn amount is greater than zero
- Emits events with all relevant information

### Function: depositZkSync

```solidity
function depositZkSync(address token, uint256 amount, address recipient) external payable nonReentrant returns (bytes32 l2TxHash)
```

**Implementation Details:**
- Deposits tokens or ETH into the ZkSync L1 bridge
- Handles both ERC20 tokens and native ETH
- For ERC20, pulls tokens from the sender and approves the bridge
- For ETH, checks that the sent value matches the amount
- Calls the bridge's deposit function
- Returns the L2 transaction hash from the bridge

**Security Considerations:**
- Uses `nonReentrant` modifier to prevent reentrancy attacks
- Validates amount and recipient
- Handles ETH correctly with the payable modifier
- Ensures no ETH is sent with ERC20 deposits
- Uses SafeERC20 for token transfers and approvals
- Sets approval to 0 before setting to amount
- Emits events with all relevant information

### Function: claimZkSyncWithdrawal

```solidity
function claimZkSyncWithdrawal(address l2Token, uint256 amount, bytes calldata proof) external nonReentrant
```

**Implementation Details:**
- Claims a withdrawal from the ZkSync L1 bridge
- Calls the bridge's claimWithdrawal function
- Forwards the received tokens to the caller

**Security Considerations:**
- Uses `nonReentrant` modifier to prevent reentrancy attacks
- Validates token address and amount
- Uses SafeERC20 for token transfers
- Emits events with all relevant information

### Function: sweepERC20

```solidity
function sweepERC20(address token) external onlyOwner nonReentrant
```

**Implementation Details:**
- Allows the owner to withdraw any ERC20 tokens sent to this contract
- Gets the contract's token balance
- Transfers all tokens to the owner

**Security Considerations:**
- Uses `onlyOwner` modifier to restrict access
- Uses `nonReentrant` modifier to prevent reentrancy attacks
- Validates token address
- Checks that there are tokens to sweep
- Uses SafeERC20 for token transfers
- Emits events with all relevant information

### Function: sweepETH

```solidity
function sweepETH() external onlyOwner nonReentrant
```

**Implementation Details:**
- Allows the owner to withdraw any ETH sent to this contract
- Gets the contract's ETH balance
- Transfers all ETH to the owner using call

**Security Considerations:**
- Uses `onlyOwner` modifier to restrict access
- Uses `nonReentrant` modifier to prevent reentrancy attacks
- Checks that there is ETH to sweep
- Uses the safe low-level call pattern with success check
- Emits events with all relevant information

## 4. GovernorModule Contract

The GovernorModule manages session keys and their allowances for executing actions.

### State Variables

- `keyRegistry`: Immutable reference to the KeyRegistry contract
- `allowances`: Mapping of key => dest => token => Allowance
- `isSessionKey`: Mapping of address to boolean indicating if it's an enabled session key
- `keyNonces`: Mapping of key to nonce
- `keyUsedOpHashes`: Mapping of key to used operation hashes for replay protection

### Structs

- `Allowance`: Contains amount, expiry timestamp, and enabled status

### Events

- `SessionKeyEnabled`: Emitted when a session key is enabled
- `SessionKeyRevoked`: Emitted when a session key is revoked
- `AllowanceSet`: Emitted when an allowance is set
- `AllowanceUsed`: Emitted when an allowance is used
- `NonceIncreased`: Emitted when a nonce is increased

### Constructor

```solidity
constructor(address _registry)
```

**Implementation Details:**
- Accepts an address for the KeyRegistry
- Sets an immutable reference to the KeyRegistry

**Security Considerations:**
- Validates the registry address to prevent zero-address references
- Uses an immutable variable to prevent tampering

### Function: enableSessionKey

```solidity
function enableSessionKey(address key) external onlyOwner
```

**Implementation Details:**
- Enables a session key that has been attested in the KeyRegistry
- Sets the key's status to enabled in the `isSessionKey` mapping
- Callable only by the owner

**Security Considerations:**
- Uses `onlyOwner` modifier to restrict access
- Validates key address to prevent zero-address references
- Verifies that the key is attested in the KeyRegistry
- Prevents enabling an already-enabled key to avoid redundant events
- Emits events for off-chain tracking

### Function: revokeSessionKey

```solidity
function revokeSessionKey(address key) external onlyOwner
```

**Implementation Details:**
- Revokes an enabled session key
- Sets the key's status to disabled in the `isSessionKey` mapping
- Callable only by the owner
- Does not clear existing allowances (they'll expire naturally or become unusable)

**Security Considerations:**
- Uses `onlyOwner` modifier to restrict access
- Validates key address to prevent zero-address references
- Checks if the key is actually enabled before revoking
- Emits events only when a change is made
- Properly handles allowances to minimize gas costs

### Function: setAllowance

```solidity
function setAllowance(address key, address dest, address token, uint128 amount, uint48 expiry) external onlyOwner
```

**Implementation Details:**
- Sets or updates an allowance for a specific session key, destination, and token
- Creates an Allowance struct with the provided parameters
- Callable only by the owner

**Security Considerations:**
- Uses `onlyOwner` modifier to restrict access
- Validates key and token addresses
- Requires the key to be enabled
- Validates amount > 0 and expiry in the future
- Emits events for off-chain tracking

### Function: preExec

```solidity
function preExec(bytes calldata opData, bytes32 opHash, bytes calldata signature) external returns (uint256 gasCost)
```

**Implementation Details:**
- Pre-execution hook for session key operations
- Validates EIP-712 signature and allowance
- Decodes operation data for allowance check
- Verifies signature using ECDSA recovery
- Checks allowance constraints (enabled, not expired, sufficient amount)
- Decreases the allowance by the spent amount
- Increments the key's nonce

**Security Considerations:**
- Implements replay protection with the `keyUsedOpHashes` mapping
- Validates that the key is enabled and attested
- Verifies the signature against the operation hash
- Allows signature from either the session key or the owner
- Checks allowance status, expiry, and amount
- Updates allowance before operation execution
- Implements nonce management for replay protection
- Emits events for allowance usage and nonce increase

### Function: getNonce

```solidity
function getNonce(address key) external view returns (uint256)
```

**Implementation Details:**
- Gets the current nonce for a given session key
- Returns the nonce from the `keyNonces` mapping

**Security Considerations:**
- Pure view function with no state changes, so no security risks

### Function: postExec

```solidity
function postExec(bytes calldata, bytes32, bool) external pure
```

**Implementation Details:**
- Post-execution hook that performs no actions
- Included for interface compatibility

**Security Considerations:**
- Pure function with no state changes or actions, so no security risks

## 5. TokenomicsGuard Contract

The TokenomicsGuard handles fee processing and distribution.

### State Variables

- `DEV_SPLIT_BP`: Constant for the percentage of fees going to the development fund (25%)
- `BURN_SPLIT_BP`: Constant for the percentage of fees to be burned (75%)
- `BP_DENOMINATOR`: Constant denominator for basis points calculations (10000)
- `DEV_FUND`: Immutable address for the development fund
- `FEE_TOKEN`: Immutable reference to the ERC20 token used for fees
- `dexAdapter`: Immutable reference to the DEX adapter for burning tokens
- `processedFeeOperations`: Mapping of operation IDs to boolean for replay protection

### Events

- `FeeProcessed`: Emitted when fees are processed
- `BurnExecuted`: Emitted when tokens are burned
- `FeeProcessingSkipped`: Emitted when fee processing is skipped (zero amount)

### Constructor

```solidity
constructor(address _feeToken, address _devFund, address _dexAdapter)
```

**Implementation Details:**
- Accepts addresses for the fee token, development fund, and DEX adapter
- Sets immutable references to these addresses

**Security Considerations:**
- Validates all addresses to prevent zero-address references
- Verifies that split percentages add up to the denominator
- Uses immutable variables to prevent tampering

### Function: processReceivedFees

```solidity
function processReceivedFees(uint256 feeAmount, uint256 deadline, bytes32 operationId) external nonReentrant
```

**Implementation Details:**
- Processes fees that have been transferred to this contract
- Implements replay protection with operation IDs
- Handles zero fee amounts gracefully
- Verifies that sufficient tokens have been received
- Calculates splits based on configured percentages
- Transfers dev share to the development fund
- Approves and calls the DEX adapter for the burn share

**Security Considerations:**
- Uses `nonReentrant` modifier to prevent reentrancy attacks
- Implements replay protection to prevent double-processing
- Handles zero fee amounts gracefully without reverting
- Verifies token balance before processing
- Uses SafeERC20 for token transfers and approvals
- Sets approval to 0 before setting to amount
- Emits events for all operations

### Function: preExec

```solidity
function preExec(bytes calldata, bytes32) external pure returns (uint256)
```

**Implementation Details:**
- Legacy hook that no longer handles fee logic
- Performs no actions
- Returns 0

**Security Considerations:**
- Pure function with no state changes or actions, so no security risks

### Function: postExec

```solidity
function postExec(bytes calldata, bytes32, bool) external pure
```

**Implementation Details:**
- Legacy hook that performs no actions
- Included for interface compatibility

**Security Considerations:**
- Pure function with no state changes or actions, so no security risks

## Overall Security Analysis

### Access Control
- All contracts implement proper access control mechanisms
- Owner-restricted functions use OpenZeppelin's Ownable pattern
- Clear separation between admin functions and user functions

### Input Validation
- Thorough validation of addresses, amounts, and timestamps
- Zero-address checks for critical parameters
- Range checks for numeric values
- Expiry verification for time-sensitive operations

### Reentrancy Protection
- NonReentrant modifier used on all external functions that transfer tokens or ETH
- Checks-Effects-Interactions pattern followed

### Error Handling
- Descriptive error messages for all reverts
- Consistent error message prefixing (e.g., "TG:", "GM:", "PA:")
- Graceful handling of edge cases

### Event Emissions
- Comprehensive events for all state changes
- Indexed parameters for efficient filtering
- Detailed information in event parameters

### Cryptographic Security
- Secure implementation of EIP-712 signatures
- Proper nonce management
- Multiple layers of replay protection

### Integer Arithmetic
- Safe mathematical operations using Solidity 0.8.x built-in overflow/underflow checks
- Proper handling of percentage calculations with basis points

### Gas Optimization
- Efficient storage usage
- Appropriate use of immutable variables
- Optimized function access modifiers (view, pure)
- Avoiding redundant operations

### External Interactions
- Safe token approvals and transfers using SafeERC20
- Validation of return values from external calls
- Checking for success in low-level calls 