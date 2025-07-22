#!/bin/bash

# FP16 Demotion Plugin Test Script
echo "========================================"
echo "FP16 Demotion Plugin Test Suite"
echo "========================================"

# Configuration
PLUGIN_PATH="../build/libfp16DemotionPlugin.dylib"
CLANG_PATH="/opt/homebrew/opt/llvm/bin/clang"
TEST_DIR="/Users/pranavmotamarri/Documents/CDProject/test"

# Check if plugin exists
if [ ! -f "$PLUGIN_PATH" ]; then
    echo "Error: Plugin not found at $PLUGIN_PATH"
    echo "Please build the plugin first using: cmake --build ../build"
    exit 1
fi

# Function to run a test
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo ""
    echo "----------------------------------------"
    echo "Testing: $test_name"
    echo "File: $test_file"
    echo "----------------------------------------"
    
    if [ ! -f "$test_file" ]; then
        echo "Test file not found: $test_file"
        return 1
    fi
    
    # Run the plugin
    $CLANG_PATH -fplugin="$PLUGIN_PATH" "$test_file" \
        -Xclang -plugin-arg-fp16-demotion \
        -Xclang -fprecision-demote=fp16 \
        -c -o "${test_file%.c}.o" 2>&1
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ Test completed successfully"
    else
        echo "❌ Test failed with exit code: $exit_code"
    fi
    
    return $exit_code
}

# Function to test plugin loading without arguments
test_plugin_loading() {
    echo ""
    echo "----------------------------------------"
    echo "Testing: Plugin Loading (without args)"
    echo "----------------------------------------"
    
    $CLANG_PATH -fplugin="$PLUGIN_PATH" comprehensive_test.c -c 2>&1
    echo "Note: Should show warning about FP16 demotion not enabled"
}

# Change to test directory
cd "$TEST_DIR" || exit 1

# Run individual tests
run_test "test.c" "Basic Float Operations"
run_test "complex_test.c" "Complex Test Cases"
run_test "comprehensive_test.c" "Comprehensive Test Suite"

# Test plugin loading without proper arguments
test_plugin_loading

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "All tests completed. Check the output above for:"
echo "1. ✅ Successful demotions (variables safely converted to __fp16)"
echo "2. ⚠️  Warnings for unsafe conversions"
echo "3. ❌ Any compilation errors"
echo ""
echo "Expected behavior:"
echo "- Safe float variables should be demoted to __fp16"
echo "- Unsafe variables should show warnings explaining why they can't be demoted"
echo "- The plugin should load and process files without crashing"
