// Test file for FP16 demotion web interface
#include <stdio.h>

int main() {
    // These values should be safely demoted to __fp16
    float small1 = 3.14f;
    float small2 = 42.0f;
    float array[3] = {1.0f, 2.0f, 3.0f};
    
    // These values are too large and should NOT be demoted
    float large1 = 100000.0f;  // Out of fp16 range
    float tiny = 1e-10f;       // Loses precision
    
    printf("Small values: %f, %f\n", small1, small2);
    printf("Array: %f, %f, %f\n", array[0], array[1], array[2]);
    printf("Large/tiny: %f, %f\n", large1, tiny);
    
    return 0;
}
