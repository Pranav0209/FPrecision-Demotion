#include <stdio.h>

// Simple array operations using floats
void process_array(float *arr, int size) {
    float sum = 0.0f;
    float avg = 0.0f;
    
    for(int i = 0; i < size; i++) {
        sum += arr[i];
    }
    
    avg = sum / (float)size;
    printf("Sum: %f, Average: %f\n", sum, avg);
}

int main() {
    float values[4] = {1.5f, 2.5f, 3.5f, 4.5f};
    float result = 0.0f;
    
    process_array(values, 4);
    
    // Test arithmetic operations
    result = values[0] + values[1];
    printf("Addition: %f\n", result);
    
    result = values[2] * values[3];
    printf("Multiplication: %f\n", result);
    
    return 0;
}
