// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/DEXAdapter.sol";
import "../../contracts/mocks/MockERC20.sol";

/// @dev Mock for Uniswap V2 Router
contract MockUniswapV2Router {
    address public constant BURN_ADDR = 0x000000000000000000000000000000000000dEaD;
    MockERC20 public feeToken;
    MockERC20 public burnToken;
    
    constructor(address _feeToken, address _burnToken) {
        feeToken = MockERC20(_feeToken);
        burnToken = MockERC20(_burnToken);
    }
    
    // Helper function to get the burn address
    function getBurnAddress() external pure returns (address) {
        return BURN_ADDR;
    }
    
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(deadline >= block.timestamp, "MockRouter: EXPIRED");
        require(path.length == 2, "MockRouter: INVALID_PATH");
        require(path[0] == address(feeToken), "MockRouter: INVALID_INPUT_TOKEN");
        require(path[1] == address(burnToken), "MockRouter: INVALID_OUTPUT_TOKEN");
        
        // Simple 1:1 swap with fee token check
        feeToken.transferFrom(msg.sender, address(this), amountIn);
        
        // Mint the output amount to the destination
        uint256 outputAmount = amountIn; // 1:1 rate for simplicity
        require(outputAmount >= amountOutMin, "MockRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        
        burnToken.mint(to, outputAmount);
        
        // Return the swap amounts
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = outputAmount;
        
        return amounts;
    }
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external
        view
        returns (uint[] memory amounts)
    {
        require(path.length == 2, "MockRouter: INVALID_PATH");
        require(path[0] == address(feeToken), "MockRouter: INVALID_INPUT_TOKEN");
        require(path[1] == address(burnToken), "MockRouter: INVALID_OUTPUT_TOKEN");
        
        // Simple 1:1 rate for testing
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn;
        
        return amounts;
    }
}

/// @title DEXAdapterFuzz - Fuzz & invariant tests for DEXAdapter
/// @notice Run with `forge test -vv` inside the `foundry` directory
contract DEXAdapterFuzz is Test {
    DEXAdapter internal dexAdapter;
    MockERC20 internal feeToken;
    MockERC20 internal burnToken;
    MockUniswapV2Router internal router;
    address internal owner;
    
    function setUp() public {
        // Create owner address
        owner = makeAddr("owner");
        
        // Deploy the mock tokens
        feeToken = new MockERC20("Fee Token", "FEE");
        burnToken = new MockERC20("Burn Token", "BURN");
        
        // Deploy the mock router
        router = new MockUniswapV2Router(address(feeToken), address(burnToken));
        
        // Deploy the DEXAdapter
        dexAdapter = new DEXAdapter(
            address(router),
            address(feeToken),
            address(burnToken),
            owner,
            100 // 1% slippage
        );
    }

    /*//////////////////////////////////////////////////////////////
                                 FUZZ
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Fuzz test for swapping tokens with varying amounts
    function testFuzz_SwapAndBurn(uint256 amountIn) public {
        // Bound the input amount to a reasonable range to avoid overflow
        amountIn = bound(amountIn, 1, 1e24);
        
        // Mint tokens to this contract and approve the DEXAdapter
        feeToken.mint(address(this), amountIn);
        feeToken.approve(address(dexAdapter), amountIn);
        
        // Set a deadline in the future
        uint256 deadline = block.timestamp + 1 hours;
        
        // Perform the swap and burn
        (bool success, uint256 burned) = dexAdapter.swapAndBurn(amountIn, deadline);
        
        // Verify the success flag
        assertTrue(success, "Swap should succeed");
        
        // Verify the burned amount matches our input (1:1 in our mock)
        assertEq(burned, amountIn, "Burned amount should match input");
        
        // Verify burn token balance at burn address
        address burnAddr = router.getBurnAddress();
        assertEq(burnToken.balanceOf(burnAddr), amountIn, "Burn address should receive tokens");
    }
    
    /// @dev Fuzz test for expired deadline
    function testFuzz_ExpiredDeadline(uint256 amountIn) public {
        // Bound the input amount
        amountIn = bound(amountIn, 1, 1e18);
        
        // Mint tokens to this contract and approve
        feeToken.mint(address(this), amountIn);
        feeToken.approve(address(dexAdapter), amountIn);
        
        // Set a deadline in the past
        uint256 pastDeadline = block.timestamp - 1;
        
        // Attempt swap with expired deadline - should revert
        vm.expectRevert("DEX: Deadline passed");
        dexAdapter.swapAndBurn(amountIn, pastDeadline);
    }
    
    /// @dev Fuzz test for changing slippage
    function testFuzz_SetSlippage(uint256 newSlippage) public {
        // Bound the slippage to a reasonable range
        newSlippage = bound(newSlippage, 1, 9999); // 0.01% to 99.99%
        
        // Only owner can change slippage
        vm.prank(owner);
        dexAdapter.setSlippage(newSlippage);
        
        // Verify slippage was changed
        assertEq(dexAdapter.slippageBps(), newSlippage, "Slippage should be updated");
        
        // Try an invalid slippage (0 or ≥ 10000)
        vm.startPrank(owner);
        
        // Try slippage of 0 - should revert
        vm.expectRevert("DEX: Invalid slippage");
        dexAdapter.setSlippage(0);
        
        // Try slippage of 10000 (100%) - should revert
        vm.expectRevert("DEX: Invalid slippage");
        dexAdapter.setSlippage(10000);
        
        vm.stopPrank();
    }
    
    /// @dev Fuzz test for non-owner attempting to set slippage
    function testFuzz_NonOwnerSetSlippage(address nonOwner, uint256 newSlippage) public {
        // Ensure nonOwner is not the actual owner
        vm.assume(nonOwner != owner);
        
        // Bound the slippage
        newSlippage = bound(newSlippage, 1, 9999);
        
        // Non-owner attempting to set slippage - should revert
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        dexAdapter.setSlippage(newSlippage);
    }
    
    /*//////////////////////////////////////////////////////////////
                              INVARIANTS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Invariant: slippage should always be within bounds (0 < slippage < 10000)
    function invariant_SlippageWithinBounds() public {
        uint256 slippage = dexAdapter.slippageBps();
        assertTrue(slippage > 0, "Slippage should be positive");
        assertTrue(slippage < 10000, "Slippage should be less than 100%");
    }
} 