#include <math.h>

float test_fp16_conversion() {
    // Should be converted - simple case
    float simple = 1.0f;
    
    // Should be converted - array case
    float arr[3] = {1.0f, 2.0f, 3.0f};
    
    // Should NOT be converted - out of range
    float too_large = 70000.0f;
    
    // Should NOT be converted - too small
    float too_small = 1e-8f;
    
    // Should NOT be converted - used in function call
    float func_arg = 1.0f;
    sinf(func_arg);
    
    // Should be converted - safe arithmetic
    float safe_math = 2.0f * 3.0f;
    
    // Should NOT be converted - division by small number
    float unsafe_div = 1.0f / 0.0001f;
    
    return simple + arr[0];
}
