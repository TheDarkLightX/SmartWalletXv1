#!/bin/bash

# Set the number of fuzz runs (default: 1000 runs per test)
FUZZ_RUNS=${1:-1000}

echo "Running fuzz tests with $FUZZ_RUNS runs per test..."

# Run all fuzz tests with detailed output and custom run count
cd "$(dirname "$0")"
forge test --fuzz-runs $FUZZ_RUNS -vvv

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "All fuzz tests passed successfully!"
    exit 0
else
    echo "Some fuzz tests failed. Check the output above for details."
    exit 1
fi 