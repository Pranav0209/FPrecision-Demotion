// This file shows the result of FP16 demotion transformations
// Generated automatically by FP16 Demotion Plugin

// Simple test for demotion output
#include <stdio.h>

int main() {
    // Safe values - should be demoted
    __fp16 safe1 = __fp16(1.00000000);
    __fp16 safe2 = __fp16(2.50000000);
    __fp16 safe3 = __fp16(100.00000000);
    
    // Unsafe values - should NOT be demoted
    float unsafe1 = 70000.0f;
    float unsafe2 = 1e-8f;
    
    printf("Safe: %f, %f, %f\n", safe1, safe2, safe3);
    printf("Unsafe: %f, %f\n", unsafe1, unsafe2);
    
    return 0;
}
