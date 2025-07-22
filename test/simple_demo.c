// Simple test for demotion output
#include <stdio.h>

int main() {
    // Safe values - should be demoted
    float safe1 = 1.0f;
    float safe2 = 2.5f;
    float safe3 = 100.0f;
    
    // Unsafe values - should NOT be demoted
    float unsafe1 = 70000.0f;
    float unsafe2 = 1e-8f;
    
    printf("Safe: %f, %f, %f\n", safe1, safe2, safe3);
    printf("Unsafe: %f, %f\n", unsafe1, unsafe2);
    
    return 0;
}
