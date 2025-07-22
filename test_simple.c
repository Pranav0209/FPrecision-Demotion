// Simple test file for FP16 demotion
#include <stdio.h>

int main() {
    // Safe values that should be demoted
    float safe1 = 1.0f;
    float safe2 = 100.0f;
    float safe3 = 0.5f;
    
    // Unsafe values that should NOT be demoted
    float unsafe1 = 70000.0f;    // Too large
    float unsafe2 = 1e-8f;       // Too small
    float unsafe3 = 1.0f / 0.0001f; // Division by small number
    
    // Print results
    printf("Safe: %f, %f, %f\n", safe1, safe2, safe3);
    printf("Unsafe: %f, %f, %f\n", unsafe1, unsafe2, unsafe3);
    
    return 0;
}
