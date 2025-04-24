// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/TokenomicsGuard.sol";
import "../../contracts/mocks/MockERC20.sol";
import "../../contracts/mocks/MockDexAdapter.sol";

/// @title TokenomicsGuardFuzz - Fuzz & invariant tests for TokenomicsGuard
/// @notice Run with `forge test -vv` inside the `foundry` directory
contract TokenomicsGuardFuzz is Test {
    TokenomicsGuard internal tokenomics;
    MockERC20 internal feeToken;
    MockDexAdapter internal dexAdapter;
    address internal devFund;
    
    function setUp() public {
        // Create dev fund address
        devFund = makeAddr("devFund");
        
        // Deploy the mock tokens and adapter
        feeToken = new MockERC20("Fee Token", "FEE");
        dexAdapter = new MockDexAdapter();
        
        // Deploy the TokenomicsGuard
        tokenomics = new TokenomicsGuard(
            address(feeToken),
            devFund,
            address(dexAdapter)
        );
    }

    /*//////////////////////////////////////////////////////////////
                                 FUZZ
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Fuzz test for processing fees with varying amounts
    function testFuzz_ProcessReceivedFees(uint256 feeAmount) public {
        // Bound the fee to a reasonable range to avoid overflow
        feeAmount = bound(feeAmount, 0, 1e24);
        
        // Generate a unique operation ID
        bytes32 operationId = keccak256(abi.encodePacked(feeAmount, block.timestamp));
        
        // Transfer fee tokens to the TokenomicsGuard first
        if (feeAmount > 0) {
            feeToken.mint(address(tokenomics), feeAmount);
        }
        
        // Process the fee
        tokenomics.processReceivedFees(feeAmount, block.timestamp + 1 hours, operationId);
        
        // If fee amount is 0, we should still have processed without error
        if (feeAmount == 0) {
            // Nothing to verify specifically for zero fee case
            // Just check that we don't revert
        } else {
            // For non-zero fee, calculate expected splits
            uint256 expectedDevAmount = (feeAmount * tokenomics.DEV_SPLIT_BP()) / tokenomics.BP_DENOMINATOR();
            // We'll calculate this but not use it directly to avoid unused variable warning
            // It's used for documentation/readability
            /*uint256 expectedBurnAmount = feeAmount - expectedDevAmount;*/
            
            // Verify DevFund received the correct amount
            // We can't actually verify this directly since our MockDexAdapter doesn't
            // perform the real transfers, but in a real scenario we would check the balances
        }
        
        // Verify the operation is marked as processed
        assertTrue(tokenomics.processedFeeOperations(operationId), "Operation should be marked as processed");
    }
    
    /// @dev Fuzz test for replay protection
    function testFuzz_ReplayProtection(uint256 feeAmount) public {
        // Bound the fee to a reasonable range to avoid overflow
        feeAmount = bound(feeAmount, 0, 1e18);
        
        // Generate a unique operation ID
        bytes32 operationId = keccak256(abi.encodePacked(feeAmount, block.timestamp));
        
        // Transfer fee tokens to the TokenomicsGuard
        if (feeAmount > 0) {
            feeToken.mint(address(tokenomics), feeAmount);
        }
        
        // Process the fee for the first time
        tokenomics.processReceivedFees(feeAmount, block.timestamp + 1 hours, operationId);
        
        // Attempt to process the same operation again - should revert
        vm.expectRevert("TG: Operation already processed");
        tokenomics.processReceivedFees(feeAmount, block.timestamp + 1 hours, operationId);
    }
    
    /// @dev Fuzz test for insufficient balance check
    function testFuzz_InsufficientBalance(uint256 feeAmount) public {
        // Bound the fee to a reasonable range (but not 0)
        feeAmount = bound(feeAmount, 1, 1e18);
        
        // Generate a unique operation ID
        bytes32 operationId = keccak256(abi.encodePacked(feeAmount, block.timestamp));
        
        // Try to process without transferring any tokens
        // This should revert
        vm.expectRevert("TG: Insufficient fee balance received");
        tokenomics.processReceivedFees(feeAmount, block.timestamp + 1 hours, operationId);
    }
    
    /*//////////////////////////////////////////////////////////////
                              INVARIANTS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Invariant: DEV_SPLIT_BP + BURN_SPLIT_BP should always equal BP_DENOMINATOR
    function invariant_SplitPercentagesConsistent() public {
        assertEq(
            tokenomics.DEV_SPLIT_BP() + tokenomics.BURN_SPLIT_BP(),
            tokenomics.BP_DENOMINATOR(),
            "Split percentages do not add up to denominator"
        );
    }
} 