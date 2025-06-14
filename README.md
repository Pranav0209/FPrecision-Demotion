# 🧠 FP16 Demotion Clang Plugin

This Clang plugin analyzes C source code to identify `float` variables that can be **safely demoted to `__fp16`** (half-precision float) for memory optimization. It emits warnings for unsafe demotions caused by range violations, risky arithmetic, or unsafe usage patterns.

---

## 📌 Purpose

In memory-constrained systems (e.g., embedded devices), replacing `float` with `__fp16` can save space. This plugin automates the detection of demotion candidates and highlights unsafe variables to avoid runtime errors or precision loss.

---

## 📁 Project Structure

| File / Folder             | Description |
|---------------------------|-------------|
| `Fp16DemotionPlugin.cpp` | Main plugin logic. |
| `CMakeLists.txt`          | CMake build configuration. |
| `build/`                  | Build output directory (contains `.dylib`). |
| `test/`                   | Test C files for validation. |
| `build.sh` (optional)     | Script to automate build. |

---

## ⚙️ CMake Configuration

This project uses **CMake** to build the Clang plugin. Ensure your system has:
- CMake (3.15+)
- LLVM with Clang (installed via Homebrew)

---

## 🌍 Environment Setup

Set the compiler to the Homebrew-installed version of LLVM/Clang:

```bash
export CC=/opt/homebrew/opt/llvm/bin/clang
export CXX=/opt/homebrew/opt/llvm/bin/clang++

```
```

---

## 🛠️ Build Steps

1. Navigate to your build directory:
```bash
cd "/Users/pranavmotamarri/Documents/CD Project/build"
```

2. Configure and build:
```bash
cmake ..
make
```

✔️ This produces: `../build/libfp16DemotionPlugin.dylib`

---

## 🚀 Running the Plugin

To analyze a test file using the plugin:

```bash
cd "/Users/pranavmotamarri/Documents/CD Project/test" &&
/opt/homebrew/opt/llvm/bin/clang \
  -fplugin="../build/libfp16DemotionPlugin.dylib" \
  complex_test.c \
  -Xclang -plugin-arg-fp16-demotion \
  -Xclang -fprecision-demote=fp16 \
  -c
```

---

## 🧾 What the Flags Do

| Flag | Description |
|------|-------------|
| `-fplugin=...` | Loads the compiled plugin. |
| `-Xclang -plugin-arg-<name>` | Activates the plugin by its ID. |
| `-Xclang -fprecision-demote=fp16` | Custom argument passed to configure logic. |
| `-c` | Compiles the file without linking. |

---

## 🧪 Testing the Plugin

### Example: `test/complex_test.c`
```c
#include <stdio.h>
int main() {
    float safe = 1.5f;
    float too_big = 80000.0f;
    return 0;
}
```

### Expected Output
```
FP16 plugin loaded
FP16 demotion enabled
complex_test.c:4:11: warning: Cannot demote variable too_big to __fp16: initialization value out of __fp16 range
```

---

## 🔁 Typical Workflow

1. Add/edit float test cases in `test/`.
2. Run `cmake .. && make` inside the `build/` folder.
3. Execute Clang with the plugin on your test file.
4. Review warnings printed for unsafe demotions.
5. Modify plugin logic or extend capabilities as needed.

---

## 🛠️ Troubleshooting

| Problem | Cause | Fix |
|--------|-------|-----|
| Plugin not loading | Clang version mismatch | Use the same version for build & run. |
| No warnings printed | Plugin not invoked | Check plugin flags and add debug logs. |
| Build fails | Missing LLVM/Clang | Install via Homebrew and set `CC/CXX`. |
| C file errors | Invalid C syntax | Ensure file contains a valid `main()` function. |

---

## 🌱 Extend the Plugin

You can:
- Handle `float[]` arrays and pointer dereferencing
- Perform automatic rewriting (`float` → `__fp16`)
- Add checks for math operations like divisions
- Emit fix-it suggestions with `FixItHint`

---

## 📚 Resources

- [Clang Plugins Guide](https://clang.llvm.org/docs/ClangPlugins.html)
- [AST Matchers Reference](https://clang.llvm.org/docs/LibASTMatchers.html)
- Explore AST with:
  ```bash
  clang -Xclang -ast-dump -fsyntax-only yourfile.c
  ```

---

## 👨‍🔬 Author

Built by **Pranav Motamarri**  
Project for Compiler Design Lab – Clang Plugin for optimizing floating-point usage.

---
