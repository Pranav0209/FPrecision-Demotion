#include <stdio.h>
#include <math.h>

// Test case 1: Safe conversions - these should be demoted to __fp16
void test_safe_conversions() {
    printf("=== Testing Safe Conversions ===\n");
    
    // Simple literals within FP16 range
    float small_positive = 1.0f;        // Should convert
    float small_negative = -1.0f;       // Should convert
    float medium_value = 100.0f;        // Should convert
    float fractional = 0.5f;           // Should convert
    
    // Safe arithmetic operations
    float add_result = 1.0f + 2.0f;     // Should convert
    float sub_result = 5.0f - 3.0f;     // Should convert
    float mul_result = 2.0f * 3.0f;     // Should convert
    
    // Arrays with safe values
    float safe_array[3] = {1.0f, 2.0f, 3.0f}; // Should convert
    
    printf("Safe values: %f, %f, %f\n", small_positive, medium_value, fractional);
}

// Test case 2: Unsafe conversions - these should NOT be demoted
void test_unsafe_conversions() {
    printf("=== Testing Unsafe Conversions ===\n");
    
    // Values outside FP16 range
    float too_large = 70000.0f;         // Too large for FP16
    float too_small = 1e-8f;            // Too small for FP16
    float negative_large = -70000.0f;   // Too large negative
    
    // Division by very small numbers
    float risky_division = 1.0f / 0.0001f; // Division by small number
    
    // Function calls - conservative approach
    float func_input = 1.0f;
    float func_result = sinf(func_input); // Used in function call
    
    printf("Unsafe values processed\n");
}

// Test case 3: Edge cases around FP16 limits
void test_edge_cases() {
    printf("=== Testing Edge Cases ===\n");
    
    // Values near FP16 limits
    float near_max = 65000.0f;          // Close to but under FP16_MAX
    float at_min_positive = 6.104e-5f;  // Close to FP16_MIN_POSITIVE
    float zero_value = 0.0f;            // Zero should be safe
    
    // Complex expressions
    float complex_expr = (1.0f + 2.0f) * 3.0f - 1.0f; // Should be analyzable
    
    printf("Edge cases: %f, %f, %f\n", near_max, at_min_positive, zero_value);
}

// Test case 4: Variable usage patterns
void test_variable_usage() {
    printf("=== Testing Variable Usage Patterns ===\n");
    
    // Uninitialized variables (should be safe to convert)
    float uninitialized;
    
    // Variables with safe assignments
    float safe_var = 1.0f;
    safe_var = 2.0f;                    // Reassignment with safe value
    
    // Variables in expressions
    float expr_var = 1.0f;
    float result = expr_var + 2.0f;     // Used in safe expression
    
    printf("Variable usage test completed\n");
}

// Test case 5: Type qualifiers
void test_type_qualifiers() {
    printf("=== Testing Type Qualifiers ===\n");
    
    // Volatile variables (should NOT be converted)
    volatile float volatile_var = 1.0f;
    
    // Regular variables (should be converted if safe)
    float regular_var = 1.0f;
    
    printf("Type qualifier test completed\n");
}

int main() {
    printf("Starting FP16 Demotion Plugin Tests\n");
    printf("====================================\n");
    
    test_safe_conversions();
    test_unsafe_conversions();
    test_edge_cases();
    test_variable_usage();
    test_type_qualifiers();
    
    printf("\nAll tests completed!\n");
    return 0;
}
