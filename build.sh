#!/bin/bash

# Set absolute paths
WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${WORKSPACE_DIR}/build"
TEST_DIR="${WORKSPACE_DIR}/test"

# Create build directory if it doesn't exist
mkdir -p "${BUILD_DIR}"

# Configure with CMake
cd "${BUILD_DIR}"
export CC=/opt/homebrew/opt/llvm/bin/clang
export CXX=/opt/homebrew/opt/llvm/bin/clang++
cmake -DCMAKE_CXX_FLAGS="-std=c++17" "${WORKSPACE_DIR}"

# Build the plugin
make VERBOSE=1

# Run a test if the build succeeds
if [ $? -eq 0 ]; then
    cd "${TEST_DIR}"
    /opt/homebrew/opt/llvm/bin/clang -v -fplugin="${BUILD_DIR}/libfp16DemotionPlugin.dylib" test.c
fi
