// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/PrivacyAdapter.sol";
import "../../contracts/mocks/MockERC20.sol";

// Mock Aztec Bridge for testing
contract MockAztecBridge {
    function deposit(address token, uint256 amount, address recipient) external returns (bytes32 noteHash) {
        // Check that we have enough allowance
        require(IERC20(token).allowance(msg.sender, address(this)) >= amount, "MockAztec: Insufficient allowance");
        
        // Pull tokens from PrivacyAdapter
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Return a deterministic note hash for testing
        return keccak256(abi.encodePacked(token, amount, recipient, block.timestamp));
    }
    
    function withdraw(bytes32 noteHash, address recipient) external returns (uint256 amount) {
        // For testing, we'll just use a fixed amount and transfer it from this mock
        uint256 withdrawAmount = 100 ether;
        
        // We assume the mock has tokens to transfer
        // In a real test, you would mint tokens to this mock first
        
        // Return the amount (this mock doesn't actually transfer)
        return withdrawAmount;
    }
}

// Mock ZkSync Bridge for testing
contract MockZkSyncL1Bridge {
    function deposit(address l2Receiver, address l1Token, uint256 amount) external payable returns (bytes32 l2TxHash) {
        if (l1Token != address(0)) {
            // ERC20 deposit
            require(IERC20(l1Token).allowance(msg.sender, address(this)) >= amount, "MockZkSync: Insufficient allowance");
            IERC20(l1Token).transferFrom(msg.sender, address(this), amount);
        } else {
            // ETH deposit
            require(msg.value == amount, "MockZkSync: Incorrect ETH value");
        }
        
        // Return a deterministic tx hash for testing
        return keccak256(abi.encodePacked(l2Receiver, l1Token, amount, block.timestamp));
    }
    
    function claimWithdrawal(address l2Token, uint256 amount, bytes calldata proof) external {
        // For testing, we'll just transfer tokens to the caller
        // We assume the mock has tokens to transfer
        // In a real test, you would mint tokens to this mock first
        
        // Verify proof format is acceptable (not really used in mock)
        require(proof.length > 0, "MockZkSync: Invalid proof");
        
        // Transfer tokens to the caller (PrivacyAdapter)
        IERC20(l2Token).transfer(msg.sender, amount);
    }
}

/// @title PrivacyAdapterTest - Comprehensive tests for PrivacyAdapter contract
/// @notice Run with `forge test -vv --match-contract PrivacyAdapterTest` inside the `foundry` directory
contract PrivacyAdapterTest is Test {
    // Test contracts
    PrivacyAdapter internal privacyAdapter;
    MockAztecBridge internal mockAztecBridge;
    MockZkSyncL1Bridge internal mockZkSyncBridge;
    MockERC20 internal token;
    
    // Test addresses
    address internal owner;
    address internal user;
    address internal recipient;
    
    function setUp() public {
        owner = makeAddr("owner");
        user = makeAddr("user");
        recipient = makeAddr("recipient");
        
        // Deploy mock bridges
        mockAztecBridge = new MockAztecBridge();
        mockZkSyncBridge = new MockZkSyncL1Bridge();
        
        // Deploy test token
        token = new MockERC20("Test Token", "TEST");
        
        // Deploy PrivacyAdapter with mock bridges and owner
        vm.prank(owner);
        privacyAdapter = new PrivacyAdapter(
            address(mockAztecBridge), 
            address(mockZkSyncBridge),
            owner
        );
        
        // Mint tokens to user for testing
        token.mint(user, 1000 ether);
        
        // Mint tokens to mock bridges for testing withdrawals
        token.mint(address(mockAztecBridge), 1000 ether);
        token.mint(address(mockZkSyncBridge), 1000 ether);
    }
    
    /*//////////////////////////////////////////////////////////////
                           STANDARD TESTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Test constructor parameters
    function test_Constructor() public {
        assertEq(address(privacyAdapter.aztecBridge()), address(mockAztecBridge), "Aztec bridge address incorrect");
        assertEq(address(privacyAdapter.zksyncBridge()), address(mockZkSyncBridge), "ZkSync bridge address incorrect");
        assertEq(privacyAdapter.owner(), owner, "Owner not set correctly");
    }
    
    /// @notice Test constructor reverts with zero addresses
    function test_Constructor_ZeroAddresses() public {
        vm.expectRevert("PA: Invalid Aztec bridge address");
        new PrivacyAdapter(address(0), address(mockZkSyncBridge), owner);
        
        vm.expectRevert("PA: Invalid ZkSync bridge address");
        new PrivacyAdapter(address(mockAztecBridge), address(0), owner);
        
        vm.expectRevert("PA: Invalid initial owner");
        new PrivacyAdapter(address(mockAztecBridge), address(mockZkSyncBridge), address(0));
    }
    
    /// @notice Test shielding tokens to Aztec
    function test_ShieldAztec() public {
        uint256 amount = 10 ether;
        
        // Approve tokens for PrivacyAdapter
        vm.startPrank(user);
        token.approve(address(privacyAdapter), amount);
        
        // Shield tokens
        bytes32 noteHash = privacyAdapter.shieldAztec(address(token), amount, recipient);
        vm.stopPrank();
        
        // Verify balances
        assertEq(token.balanceOf(user), 990 ether, "User balance should be reduced");
        assertEq(token.balanceOf(address(mockAztecBridge)), 1010 ether, "Bridge should receive tokens");
        
        // Verify noteHash is not zero (actual value is deterministic from mock)
        assertTrue(noteHash != bytes32(0), "Note hash should not be zero");
    }
    
    /// @notice Test shieldAztec reverts with invalid parameters
    function test_ShieldAztec_RevertInvalidParams() public {
        uint256 amount = 10 ether;
        
        vm.startPrank(user);
        token.approve(address(privacyAdapter), amount);
        
        // Test invalid token
        vm.expectRevert("PA: Invalid token address");
        privacyAdapter.shieldAztec(address(0), amount, recipient);
        
        // Test zero amount
        vm.expectRevert("PA: Amount must be > 0");
        privacyAdapter.shieldAztec(address(token), 0, recipient);
        
        // Test invalid recipient
        vm.expectRevert("PA: Invalid recipient address");
        privacyAdapter.shieldAztec(address(token), amount, address(0));
        
        vm.stopPrank();
    }
    
    /// @notice Test unshielding tokens from Aztec
    function test_UnshieldAztec() public {
        bytes32 noteHash = keccak256(abi.encodePacked("test note hash"));
        
        vm.prank(user);
        uint256 withdrawnAmount = privacyAdapter.unshieldAztec(noteHash, recipient);
        
        // Our mock always returns 100 ether
        assertEq(withdrawnAmount, 100 ether, "Withdrawn amount incorrect");
    }
    
    /// @notice Test unshieldAztec reverts with invalid recipient
    function test_UnshieldAztec_RevertInvalidRecipient() public {
        bytes32 noteHash = keccak256(abi.encodePacked("test note hash"));
        
        vm.prank(user);
        vm.expectRevert("PA: Invalid recipient address");
        privacyAdapter.unshieldAztec(noteHash, address(0));
    }
    
    /// @notice Test depositing ERC20 tokens to ZkSync
    function test_DepositZkSync_ERC20() public {
        uint256 amount = 10 ether;
        
        // Approve tokens for PrivacyAdapter
        vm.startPrank(user);
        token.approve(address(privacyAdapter), amount);
        
        // Deposit tokens
        bytes32 l2TxHash = privacyAdapter.depositZkSync(address(token), amount, recipient);
        vm.stopPrank();
        
        // Verify balances
        assertEq(token.balanceOf(user), 990 ether, "User balance should be reduced");
        assertEq(token.balanceOf(address(mockZkSyncBridge)), 1010 ether, "Bridge should receive tokens");
        
        // Verify l2TxHash is not zero (actual value is deterministic from mock)
        assertTrue(l2TxHash != bytes32(0), "L2 tx hash should not be zero");
    }
    
    /// @notice Test depositing ETH to ZkSync
    function test_DepositZkSync_ETH() public {
        uint256 amount = 1 ether;
        
        // Give user some ETH
        vm.deal(user, amount);
        
        // Deposit ETH
        vm.prank(user);
        bytes32 l2TxHash = privacyAdapter.depositZkSync{value: amount}(address(0), amount, recipient);
        
        // Verify ETH balances
        assertEq(user.balance, 0, "User ETH balance should be reduced");
        assertEq(address(mockZkSyncBridge).balance, amount, "Bridge should receive ETH");
        
        // Verify l2TxHash is not zero
        assertTrue(l2TxHash != bytes32(0), "L2 tx hash should not be zero");
    }
    
    /// @notice Test depositZkSync reverts with invalid parameters
    function test_DepositZkSync_RevertInvalidParams() public {
        uint256 amount = 10 ether;
        
        vm.startPrank(user);
        token.approve(address(privacyAdapter), amount);
        
        // Test zero amount
        vm.expectRevert("PA: Amount must be > 0");
        privacyAdapter.depositZkSync(address(token), 0, recipient);
        
        // Test invalid recipient
        vm.expectRevert("PA: Invalid recipient address");
        privacyAdapter.depositZkSync(address(token), amount, address(0));
        
        // Test sending ETH with ERC20 deposit
        vm.expectRevert("PA: ETH sent with ERC20 deposit");
        privacyAdapter.depositZkSync{value: 1 ether}(address(token), amount, recipient);
        
        // Test sending incorrect ETH amount
        vm.deal(user, 2 ether);
        vm.expectRevert("PA: Incorrect ETH value sent");
        privacyAdapter.depositZkSync{value: 1 ether}(address(0), 2 ether, recipient);
        
        vm.stopPrank();
    }
    
    /// @notice Test claiming ZkSync withdrawal
    function test_ClaimZkSyncWithdrawal() public {
        uint256 amount = 10 ether;
        bytes memory proof = abi.encodePacked("proof data");
        
        vm.prank(user);
        privacyAdapter.claimZkSyncWithdrawal(address(token), amount, proof);
        
        // Verify user received tokens
        assertEq(token.balanceOf(user), 1010 ether, "User should receive claimed tokens");
    }
    
    /// @notice Test claimZkSyncWithdrawal reverts with invalid parameters
    function test_ClaimZkSyncWithdrawal_RevertInvalidParams() public {
        uint256 amount = 10 ether;
        bytes memory proof = abi.encodePacked("proof data");
        
        vm.startPrank(user);
        
        // Test invalid token
        vm.expectRevert("PA: Invalid token address");
        privacyAdapter.claimZkSyncWithdrawal(address(0), amount, proof);
        
        // Test zero amount
        vm.expectRevert("PA: Amount must be > 0");
        privacyAdapter.claimZkSyncWithdrawal(address(token), 0, proof);
        
        vm.stopPrank();
    }
    
    /// @notice Test sweeping ERC20 tokens
    function test_SweepERC20() public {
        uint256 amount = 10 ether;
        
        // Send tokens directly to PrivacyAdapter
        token.mint(address(privacyAdapter), amount);
        
        // Sweep tokens
        vm.prank(owner);
        privacyAdapter.sweepERC20(address(token));
        
        // Verify owner received tokens
        assertEq(token.balanceOf(owner), amount, "Owner should receive swept tokens");
        assertEq(token.balanceOf(address(privacyAdapter)), 0, "PrivacyAdapter should have no tokens left");
    }
    
    /// @notice Test sweepERC20 reverts for non-owner
    function test_SweepERC20_RevertNotOwner() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        privacyAdapter.sweepERC20(address(token));
    }
    
    /// @notice Test sweepERC20 reverts with invalid parameters
    function test_SweepERC20_RevertInvalidParams() public {
        // Test invalid token
        vm.prank(owner);
        vm.expectRevert("PA: Invalid token address");
        privacyAdapter.sweepERC20(address(0));
        
        // Test no tokens to sweep
        vm.prank(owner);
        vm.expectRevert("PA: No tokens to sweep");
        privacyAdapter.sweepERC20(address(token));
    }
    
    /// @notice Test sweeping ETH
    function test_SweepETH() public {
        uint256 amount = 1 ether;
        
        // Send ETH directly to PrivacyAdapter
        vm.deal(address(privacyAdapter), amount);
        
        // Sweep ETH
        vm.prank(owner);
        privacyAdapter.sweepETH();
        
        // Verify owner received ETH
        assertEq(owner.balance, amount, "Owner should receive swept ETH");
        assertEq(address(privacyAdapter).balance, 0, "PrivacyAdapter should have no ETH left");
    }
    
    /// @notice Test sweepETH reverts for non-owner
    function test_SweepETH_RevertNotOwner() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        privacyAdapter.sweepETH();
    }
    
    /// @notice Test sweepETH reverts with no ETH to sweep
    function test_SweepETH_RevertNoETH() public {
        vm.prank(owner);
        vm.expectRevert("PA: No ETH to sweep");
        privacyAdapter.sweepETH();
    }
    
    /*//////////////////////////////////////////////////////////////
                              FUZZ TESTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Fuzz test for shielding tokens to Aztec
    function testFuzz_ShieldAztec(uint256 amount) public {
        // Bound amount to reasonable values
        amount = bound(amount, 1, 500 ether);
        
        // Mint sufficient tokens to user
        token.mint(user, amount);
        
        // Approve tokens for PrivacyAdapter
        vm.startPrank(user);
        token.approve(address(privacyAdapter), amount);
        
        // Shield tokens
        bytes32 noteHash = privacyAdapter.shieldAztec(address(token), amount, recipient);
        vm.stopPrank();
        
        // Verify balances
        assertEq(token.balanceOf(address(mockAztecBridge)), 1000 ether + amount, "Bridge should receive tokens");
        
        // Verify noteHash is not zero
        assertTrue(noteHash != bytes32(0), "Note hash should not be zero");
    }
    
    /// @notice Fuzz test for depositing tokens to ZkSync
    function testFuzz_DepositZkSync_ERC20(uint256 amount) public {
        // Bound amount to reasonable values
        amount = bound(amount, 1, 500 ether);
        
        // Mint sufficient tokens to user
        token.mint(user, amount);
        
        // Approve tokens for PrivacyAdapter
        vm.startPrank(user);
        token.approve(address(privacyAdapter), amount);
        
        // Deposit tokens
        bytes32 l2TxHash = privacyAdapter.depositZkSync(address(token), amount, recipient);
        vm.stopPrank();
        
        // Verify balances
        assertEq(token.balanceOf(address(mockZkSyncBridge)), 1000 ether + amount, "Bridge should receive tokens");
        
        // Verify l2TxHash is not zero
        assertTrue(l2TxHash != bytes32(0), "L2 tx hash should not be zero");
    }
    
    /// @notice Fuzz test for depositing ETH to ZkSync
    function testFuzz_DepositZkSync_ETH(uint256 amount) public {
        // Bound amount to reasonable values
        amount = bound(amount, 1, 10 ether);
        
        // Give user some ETH
        vm.deal(user, amount);
        
        // Deposit ETH
        vm.prank(user);
        bytes32 l2TxHash = privacyAdapter.depositZkSync{value: amount}(address(0), amount, recipient);
        
        // Verify ETH balances
        assertEq(user.balance, 0, "User ETH balance should be reduced");
        assertEq(address(mockZkSyncBridge).balance, amount, "Bridge should receive ETH");
        
        // Verify l2TxHash is not zero
        assertTrue(l2TxHash != bytes32(0), "L2 tx hash should not be zero");
    }
    
    /// @notice Fuzz test for claiming ZkSync withdrawal
    function testFuzz_ClaimZkSyncWithdrawal(uint256 amount) public {
        // Bound amount to reasonable values
        amount = bound(amount, 1, 500 ether);
        
        // Ensure mock bridge has sufficient tokens
        token.mint(address(mockZkSyncBridge), amount);
        
        // Generate random proof data
        bytes memory proof = abi.encodePacked("proof data", amount);
        
        vm.prank(user);
        privacyAdapter.claimZkSyncWithdrawal(address(token), amount, proof);
        
        // Verify user received tokens
        assertEq(token.balanceOf(user), 1000 ether + amount, "User should receive claimed tokens");
    }
    
    /// @notice Fuzz test for sweeping ERC20 tokens
    function testFuzz_SweepERC20(uint256 amount) public {
        // Bound amount to reasonable values
        amount = bound(amount, 1, 1000 ether);
        
        // Send tokens directly to PrivacyAdapter
        token.mint(address(privacyAdapter), amount);
        
        // Sweep tokens
        vm.prank(owner);
        privacyAdapter.sweepERC20(address(token));
        
        // Verify owner received tokens
        assertEq(token.balanceOf(owner), amount, "Owner should receive swept tokens");
        assertEq(token.balanceOf(address(privacyAdapter)), 0, "PrivacyAdapter should have no tokens left");
    }
} 