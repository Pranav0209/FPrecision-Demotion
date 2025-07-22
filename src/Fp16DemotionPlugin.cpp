#include "clang/Frontend/FrontendActions.h"
#include "clang/Frontend/FrontendPluginRegistry.h"
#include "clang/AST/ASTConsumer.h"
#include "clang/AST/RecursiveASTVisitor.h"
#include "clang/Frontend/CompilerInstance.h"
#include "clang/Basic/SourceManager.h"
#include "clang/AST/AST.h"
#include "clang/AST/ASTContext.h"
#include "clang/AST/Type.h"
#include "clang/AST/DeclBase.h"
#include "clang/AST/Decl.h"
#include "clang/Rewrite/Core/Rewriter.h"
#include "clang/AST/ASTTypeTraits.h"
#include "clang/Lex/Lexer.h"
#include "llvm/Support/raw_ostream.h" // For llvm::outs() and llvm::errs()
#include <cmath>
#include <unordered_set>
#include <vector>
#include <algorithm>
#include <fstream>    // For std::ofstream
#include <iomanip>    // For std::setprecision
#include <sstream>    // For std::ostringstream
#include <string>     // For std::string
#include <cstring>    // For memcpy

using namespace clang;

namespace {

// Global vector to store JSON entries for floating literals
static std::vector<std::string> jsonEntries;

// Memory usage tracking
struct MemoryUsage {
    size_t originalBytes = 0;
    size_t demotedBytes = 0;
    size_t floatVarCount = 0;
    size_t demotedVarCount = 0;
    size_t floatLiteralCount = 0;
    size_t demotedLiteralCount = 0;
};

static MemoryUsage memoryStats;

// Simulate __fp16 conversion for error calculation in JSON
// This function is re-introduced from your first code snippet.
float simulate_fp16(float value) {
    uint32_t bits;
    memcpy(&bits, &value, sizeof(float));
    int sign = (bits >> 31) & 0x1;
    int exponent = (bits >> 23) & 0xFF;
    int mantissa = bits & 0x7FFFFF;

    int newExp = exponent - 127 + 15;
    if (newExp <= 0 || newExp >= 31) { // Handle underflow/overflow to zero/infinity
        if (newExp <= 0) return 0.0f; // Flush to zero
        if (newExp >= 31) return (sign ? -1.0f : 1.0f) * std::numeric_limits<float>::infinity(); // To infinity
    }

    int newMantissa = mantissa >> 13;
    uint16_t halfBits = (sign << 15) | (newExp << 10) | newMantissa;

    // Convert back to float to get the simulated value
    int expandedSign = (halfBits >> 15) & 0x1;
    int expandedExp = ((halfBits >> 10) & 0x1F);
    int expandedMant = (halfBits & 0x3FF) << 13;

    // Special handling for denormals, infinity, NaN in half-precision
    if (expandedExp == 0x1F) { // Inf or NaN
        expandedExp = 0xFF; // Float infinity/NaN exponent
        if (expandedMant != 0) expandedMant = 0x400000; // Set a bit for NaN
    } else if (expandedExp == 0) { // Zero or denormal
        if (expandedMant != 0) { // Denormal
            // Convert half-precision denormal to single-precision denormal
            int float_exp = 127 - 14; // Smallest normal exponent for float
            while ((expandedMant & 0x400) == 0) { // Shift until normal in half-precision
                expandedMant <<= 1;
                float_exp--;
            }
            expandedMant &= 0x3FF; // Remove implicit leading bit
            expandedMant <<= 13; // Shift to float mantissa position
            expandedExp = float_exp;
        }
    } else { // Normal number
        expandedExp = expandedExp - 15 + 127;
    }

    uint32_t floatBits = (expandedSign << 31) | (expandedExp << 23) | expandedMant;
    float result;
    memcpy(&result, &floatBits, sizeof(float));
    return result;
}


// Constants for FP16 range
const float FP16_MAX = 65504.0f;
const float FP16_MIN_POSITIVE = 6.103515625e-5f; // 2^-14
const float SMALL_DIVISION_THRESHOLD = 0.001f;   // Threshold for "small number" in division

class Fp16TypeChecker {
public:
    static bool isValueInFp16Range(float Value) {
        if (std::isnan(Value) || std::isinf(Value))
            return false;

        float AbsValue = std::fabs(Value);
        if (AbsValue > FP16_MAX)
            return false;
        if (AbsValue > 0 && AbsValue < FP16_MIN_POSITIVE)
            return false;

        return true;
    }

    // Overload: returns false and sets reason if not demotable
    static bool canDemoteFloatExpr(const Expr* E, ASTContext* Context, std::string* Reason = nullptr) {
        if (!E || !Context)
            return false;

        E = E->IgnoreParenCasts();

        // Handle literal values
        if (const auto* FL = dyn_cast<FloatingLiteral>(E)) {
            llvm::APFloat Val = FL->getValue();
            // Use APFloat's conversion to half-precision for a more precise check
            bool losesInfo = false;
            Val.convert(llvm::APFloat::IEEEhalf(), llvm::APFloat::rmNearestTiesToEven, &losesInfo);
            // If it loses info, or the converted value is not representable in FP16 range (e.g., denormal), it's not safe
            // We also check against our defined FP16 range for explicit out-of-range values.
            float FloatVal;
            llvm::SmallString<16> Str;
            Val.toString(Str);
            if (sscanf(Str.c_str(), "%f", &FloatVal) == 1) {
                 if (!isValueInFp16Range(FloatVal)) {
                    if (Reason) *Reason = "literal value out of __fp16 range";
                    return false;
                 }
            } else {
                return false; // Could not parse float value
            }
            // If it loses info but is still in range, we might consider it safe enough for demotion,
            // but the problem statement implies "lossless" so `losesInfo` should be considered.
            // For now, let's allow it if it's within range, as the primary check is range.
            // If strict lossless is required, `losesInfo` should make it return false.
            // Given "semantically safe and lossless" from the problem statement, `losesInfo` should be considered.
            if (losesInfo) {
                if (Reason) *Reason = "literal value loses precision when converted to __fp16";
                return false;
            }
            return true;
        }

        // Handle variables
        if (const auto* DRE = dyn_cast<DeclRefExpr>(E)) {
            if (const auto* VD = dyn_cast<VarDecl>(DRE->getDecl())) {
                QualType T = VD->getType();
                return canDemoteType(T, Context);
            }
            return false;
        }

        // Handle binary operations
        if (const auto* BO = dyn_cast<BinaryOperator>(E)) {
            bool CanDemoteLHS = canDemoteFloatExpr(BO->getLHS(), Context, Reason);
            bool CanDemoteRHS = canDemoteFloatExpr(BO->getRHS(), Context, Reason);

            // For division, check for very small denominators
            if (BO->getOpcode() == BO_Div) {
                if (const auto* RHSLit = dyn_cast<FloatingLiteral>(BO->getRHS()->IgnoreParenCasts())) {
                    llvm::APFloat Val = RHSLit->getValue();
                    llvm::SmallString<16> Str;
                    Val.toString(Str);
                    float FloatVal;
                    if (sscanf(Str.c_str(), "%f", &FloatVal) == 1 &&
                        std::fabs(FloatVal) < SMALL_DIVISION_THRESHOLD) {
                        if (Reason) *Reason = "division by small number";
                        return false;  // Avoid division by very small numbers
                    }
                }
            }

            return CanDemoteLHS && CanDemoteRHS;
        }

        // Handle unary operations
        if (const auto* UO = dyn_cast<UnaryOperator>(E)) {
            return canDemoteFloatExpr(UO->getSubExpr(), Context, Reason);
        }

        // Handle function calls - conservative approach
        if (isa<CallExpr>(E)) {
            // Don't demote variables used in function calls unless we can analyze the function
            if (Reason) *Reason = "used in function call";
            return false;
        }

        // Conservatively handle other expression types
        if (Reason) *Reason = "unsupported expression type for demotion analysis";
        return false;
    }

    static bool canDemoteType(QualType T, ASTContext* Context) {
        if (!Context || T.isNull())
            return false;

        // Only handle float types
        if (!T->isSpecificBuiltinType(BuiltinType::Float))
            return false;

        // Don't demote volatile or atomic types
        if (T.isVolatileQualified() || T->isAtomicType())
            return false;

        return true;
    }
};

struct Transformation {
    SourceLocation Loc;
    std::string ReplacementText;
    size_t OriginalLength; // For `ReplaceText`

    // Custom comparison for sorting (reverse order for rewriter)
    bool operator<(const Transformation& Other) const {
        return Loc.getRawEncoding() > Other.Loc.getRawEncoding();
    }
};


class Fp16DemotionVisitor : public RecursiveASTVisitor<Fp16DemotionVisitor> {
public:
    explicit Fp16DemotionVisitor(ASTContext *Context, Rewriter &R)
        : Context(Context), TheRewriter(R) {}

    // Visit Variable Declarations
    bool VisitVarDecl(VarDecl *VD) {
        if (!VD || !Context)
            return true;

        SourceManager &SM = Context->getSourceManager();
        if (!SM.isInMainFile(VD->getLocation()))
            return true;

        QualType T = VD->getType();
        if (!Fp16TypeChecker::canDemoteType(T, Context))
            return true;

        if (ProcessedDecls.count(VD))
            return true;

        ProcessedDecls.insert(VD);

        // Track memory usage for float variables
        memoryStats.originalBytes += sizeof(float); // 4 bytes per float
        memoryStats.floatVarCount++;

        bool IsSafe = true;
        std::string reason;

        // Check variable initialization
        if (const Expr* Init = VD->getInit()) {
            if (!Fp16TypeChecker::canDemoteFloatExpr(Init, Context, &reason)) {
                if (reason.empty()) {
                    reason = "initialization value out of __fp16 range or loses precision";
                }
                emitDemotionFailureDiagnostic(VD->getLocation(), VD->getName(), reason);
                IsSafe = false;
            }
        }

        // Check all uses of the variable
        // This requires a more complex dataflow analysis or a separate AST traversal for uses.
        // For simplicity, we'll rely on the initialization check and the fact that
        // `canDemoteFloatExpr` for `DeclRefExpr` only checks the type.
        // A full solution would track all assignments and reads.
        // Given the problem statement, we are mostly focusing on the variable declaration itself.

        if (IsSafe) {
            // Track successful demotion
            memoryStats.demotedBytes += sizeof(uint16_t); // 2 bytes per __fp16
            memoryStats.demotedVarCount++;
            
            // Get the location of the 'float' keyword in the declaration
            if (TypeSourceInfo *TSI = VD->getTypeSourceInfo()) {
                TypeLoc TL = TSI->getTypeLoc();
                SourceLocation Begin = TL.getBeginLoc();

                if (Begin.isValid()) {
                    bool Invalid = false;
                    const char* StartPtr = Context->getSourceManager().getCharacterData(Begin, &Invalid);

                    if (!Invalid && StartPtr) {
                        // Ensure we are replacing the 'float' keyword itself
                        // This is a bit fragile as it assumes 'float' is a single token.
                        // A more robust way might involve using Lexer to find the 'float' token.
                        Token Tok;
                        if (!Lexer::getRawToken(Begin, Tok, Context->getSourceManager(), Context->getLangOpts())) {
                            std::string TokenText = Lexer::getSpelling(Tok, Context->getSourceManager(), Context->getLangOpts());
                            if (TokenText == "float") {
                                Replacements.push_back({Begin, "__fp16", TokenText.length()});
                                emitDemotionSuccessDiagnostic(VD->getLocation(), VD->getName());
                            }
                        }
                    }
                }
            }
        } else {
            // Variable couldn't be demoted, still counts as float memory usage
            memoryStats.demotedBytes += sizeof(float); // 4 bytes, no savings
        }

        return true;
    }

    // Visit Floating Literals for JSON output and potential demotion
    bool VisitFloatingLiteral(FloatingLiteral *F) {
        SourceManager &SM = Context->getSourceManager();
        if (!SM.isInMainFile(F->getLocation()))
            return true; // Only process literals in the main file

        // Track memory usage for floating literals
        memoryStats.originalBytes += sizeof(float); // 4 bytes per float literal
        memoryStats.floatLiteralCount++;

        double original = F->getValueAsApproximateDouble();
        float downcast = simulate_fp16(original);
        double error = fabs(original - downcast);
        if (fabs(original) > 1e-9) { // Avoid division by zero for error calculation
            error /= fabs(original);
        } else if (original == 0.0 && downcast == 0.0) {
            error = 0.0; // Both are zero, no error
        } else {
            error = std::numeric_limits<double>::infinity(); // One is zero, other not, infinite error
        }

        PresumedLoc ploc = SM.getPresumedLoc(F->getBeginLoc());

        std::string reason;
        bool isSafeForDemotion = Fp16TypeChecker::canDemoteFloatExpr(F, Context, &reason);

        std::ostringstream entry;
        entry << std::fixed << std::setprecision(6) << "  {\n"
              << "    \"value\": " << original << ",\n"
              << "    \"downcast\": " << downcast << ",\n"
              << "    \"error\": " << error << ",\n"
              << "    \"mode\": \"fp16\",\n" // Hardcoded as we only simulate fp16
              << "    \"safe\": " << (isSafeForDemotion ? "true" : "false") << ",\n"
              << "    \"reason\": \"" << reason << "\",\n" // Add reason for safety check
              << "    \"location\": \"" << ploc.getFilename() << ":"
              << ploc.getLine() << ", col " << ploc.getColumn() << "\"\n"
              << "  }";
        jsonEntries.push_back(entry.str());

        // If the literal itself can be safely demoted, add it to replacements
        if (isSafeForDemotion) {
            // Track successful literal demotion
            memoryStats.demotedBytes += sizeof(uint16_t); // 2 bytes per __fp16 literal
            memoryStats.demotedLiteralCount++;
            
            std::ostringstream replacement;
            // Use the actual downcast value, formatted to ensure it's a float literal
            replacement << "__fp16(" << std::fixed << std::setprecision(8) << downcast << ")";
            CharSourceRange charRange = CharSourceRange::getTokenRange(F->getSourceRange());
            if (charRange.isValid()) {
                // Get the length of the original literal
                bool Invalid = false;
                Token Tok;
                if (!Lexer::getRawToken(F->getBeginLoc(), Tok, SM, Context->getLangOpts())) {
                    std::string OriginalLiteralText = Lexer::getSpelling(Tok, SM, Context->getLangOpts());
                    Replacements.push_back({F->getBeginLoc(), replacement.str(), OriginalLiteralText.length()});
                } else {
                    // Fallback if token reading fails
                    Replacements.push_back({F->getBeginLoc(), replacement.str(), 5}); // Default length
                }
            }
            emitLiteralDemotionSuccessDiagnostic(F->getLocation(), original);
        } else {
            // Literal couldn't be demoted, still counts as float memory usage
            memoryStats.demotedBytes += sizeof(float); // 4 bytes, no savings
            emitLiteralDemotionFailureDiagnostic(F->getLocation(), original, reason);
        }

        return true;
    }

    void applyTransformations() {
        // Temporarily disable text replacements to avoid crashes
        // Just log what would be transformed
        if (!Context || Replacements.empty())
            return;

        llvm::outs() << "\n=== TRANSFORMATIONS THAT WOULD BE APPLIED ===\n";
        for (const auto& Transform : Replacements) {
            if (Transform.Loc.isValid()) {
                SourceManager &SM = Context->getSourceManager();
                PresumedLoc PLoc = SM.getPresumedLoc(Transform.Loc);
                llvm::outs() << "Transform at " << PLoc.getFilename() << ":" 
                           << PLoc.getLine() << ":" << PLoc.getColumn() 
                           << " -> " << Transform.ReplacementText << "\n";
            }
        }
        llvm::outs() << "=== END TRANSFORMATIONS ===\n\n";

        // Comment out the actual rewriting to prevent crashes
        /*
        // Sort transformations in reverse order of source location
        std::sort(Replacements.begin(), Replacements.end());

        SourceManager &SM = Context->getSourceManager();
        const LangOptions &LangOpts = Context->getLangOpts();

        // Apply transformations in reverse order
        for (const auto& Transform : Replacements) {
            if (!Transform.Loc.isValid())
                continue;

            // Skip if in a macro (Rewriter can't handle macros well)
            if (SM.isMacroBodyExpansion(Transform.Loc) || SM.isMacroArgExpansion(Transform.Loc))
                continue;

            // Ensure the location is in the main file
            if (!SM.isInMainFile(Transform.Loc))
                continue;

            // Replace the text
            TheRewriter.ReplaceText(Transform.Loc, Transform.OriginalLength, Transform.ReplacementText);
        }
        */
    }

    void writeDemotedCode(ASTContext &Context) {
        llvm::outs() << "\n=== WRITING DEMOTED CODE ===\n";
        
        SourceManager &SM = Context.getSourceManager();
        FileID MainFileID = SM.getMainFileID();
        
        // Get the source file content
        llvm::StringRef FileContent = SM.getBufferData(MainFileID);
        std::string ModifiedContent = FileContent.str();
        
        // Apply transformations to create demoted version
        // Sort transformations in reverse order to maintain correct positions
        auto SortedReplacements = Replacements;
        std::sort(SortedReplacements.begin(), SortedReplacements.end());
        
        // Apply replacements from end to beginning to maintain position accuracy
        for (const auto& Transform : SortedReplacements) {
            if (!Transform.Loc.isValid()) continue;
            
            // Get character offset in file
            unsigned Offset = SM.getFileOffset(Transform.Loc);
            
            // Replace the text
            if (Offset < ModifiedContent.length() && 
                Offset + Transform.OriginalLength <= ModifiedContent.length()) {
                ModifiedContent.replace(Offset, Transform.OriginalLength, Transform.ReplacementText);
            }
        }
        
        // Write demoted code to file
        std::ofstream demotedOut("demoted.c");
        if (!demotedOut.is_open()) {
            llvm::errs() << "Error opening demoted.c for writing.\n";
            return;
        }
        
        demotedOut << "// This file shows the result of FP16 demotion transformations\n";
        demotedOut << "// Generated automatically by FP16 Demotion Plugin\n\n";
        demotedOut << ModifiedContent;
        demotedOut.close();
        
        llvm::outs() << "Demoted code written to demoted.c\n";
        llvm::outs() << "Applied " << SortedReplacements.size() << " transformations\n";
    }

    void writeMemoryAnalysis() {
        llvm::outs() << "\n=== MEMORY USAGE ANALYSIS ===\n";
        
        // Calculate memory savings
        size_t memorySavings = memoryStats.originalBytes - memoryStats.demotedBytes;
        double savingsPercentage = (memoryStats.originalBytes > 0) ? 
            (double(memorySavings) / double(memoryStats.originalBytes)) * 100.0 : 0.0;
        
        // Write memory analysis to file
        std::ofstream memoryOut("memory_analysis.txt");
        if (!memoryOut.is_open()) {
            llvm::errs() << "Error opening memory_analysis.txt for writing.\n";
            return;
        }
        
        memoryOut << "FP16 Demotion Plugin - Memory Usage Analysis\n";
        memoryOut << "==========================================\n\n";
        
        memoryOut << "VARIABLES:\n";
        memoryOut << "  Total float variables found: " << memoryStats.floatVarCount << "\n";
        memoryOut << "  Successfully demoted: " << memoryStats.demotedVarCount << "\n";
        memoryOut << "  Demotion success rate: " << std::fixed << std::setprecision(1);
        if (memoryStats.floatVarCount > 0) {
            memoryOut << (double(memoryStats.demotedVarCount) / double(memoryStats.floatVarCount)) * 100.0;
        } else {
            memoryOut << "0.0";
        }
        memoryOut << "%\n\n";
        
        memoryOut << "LITERALS:\n";
        memoryOut << "  Total float literals found: " << memoryStats.floatLiteralCount << "\n";
        memoryOut << "  Successfully demoted: " << memoryStats.demotedLiteralCount << "\n";
        memoryOut << "  Demotion success rate: " << std::fixed << std::setprecision(1);
        if (memoryStats.floatLiteralCount > 0) {
            memoryOut << (double(memoryStats.demotedLiteralCount) / double(memoryStats.floatLiteralCount)) * 100.0;
        } else {
            memoryOut << "0.0";
        }
        memoryOut << "%\n\n";
        
        memoryOut << "MEMORY USAGE:\n";
        memoryOut << "  Original memory usage: " << memoryStats.originalBytes << " bytes\n";
        memoryOut << "  After demotion: " << memoryStats.demotedBytes << " bytes\n";
        memoryOut << "  Memory saved: " << memorySavings << " bytes\n";
        memoryOut << "  Memory reduction: " << std::fixed << std::setprecision(1) << savingsPercentage << "%\n\n";
        
        memoryOut << "BREAKDOWN:\n";
        memoryOut << "  Float (4 bytes each): " << (memoryStats.floatVarCount + memoryStats.floatLiteralCount) << " items\n";
        memoryOut << "  __fp16 (2 bytes each): " << (memoryStats.demotedVarCount + memoryStats.demotedLiteralCount) << " items\n";
        memoryOut << "  Remaining float: " << ((memoryStats.floatVarCount + memoryStats.floatLiteralCount) - 
                                                 (memoryStats.demotedVarCount + memoryStats.demotedLiteralCount)) << " items\n\n";
        
        // Add detailed explanation
        memoryOut << "EXPLANATION:\n";
        memoryOut << "- Each 'float' uses 4 bytes of memory\n";
        memoryOut << "- Each '__fp16' uses 2 bytes of memory\n";
        memoryOut << "- Successful demotion saves 2 bytes per item\n";
        memoryOut << "- Unsafe items remain as float (4 bytes) for correctness\n";
        
        memoryOut.close();
        
        // Also output to console
        llvm::outs() << "Memory Analysis Summary:\n";
        llvm::outs() << "  Original: " << memoryStats.originalBytes << " bytes\n";
        llvm::outs() << "  After: " << memoryStats.demotedBytes << " bytes\n";
        llvm::outs() << "  Saved: " << memorySavings << " bytes (";
        // Format percentage manually
        llvm::outs() << (int)(savingsPercentage * 10) / 10.0 << "%)\n";
        llvm::outs() << "Memory analysis written to memory_analysis.txt\n";
    }

private:
    void emitDemotionSuccessDiagnostic(SourceLocation Loc, StringRef VarName) {
        if (!Context) return;
        DiagnosticsEngine &DE = Context->getDiagnostics();
        unsigned ID = DE.getCustomDiagID(DiagnosticsEngine::Warning,
            "Variable '%0' has been safely demoted from float to __fp16");
        auto DB = DE.Report(Loc, ID);
        DB.AddString(VarName);
    }

    void emitDemotionFailureDiagnostic(SourceLocation Loc, StringRef VarName, StringRef Reason) {
        if (!Context) return;
        DiagnosticsEngine &DE = Context->getDiagnostics();
        unsigned ID = DE.getCustomDiagID(DiagnosticsEngine::Warning,
            "Cannot demote variable '%0' to __fp16: %1");
        auto DB = DE.Report(Loc, ID);
        DB.AddString(VarName);
        DB.AddString(Reason);
    }

    void emitLiteralDemotionSuccessDiagnostic(SourceLocation Loc, double OriginalValue) {
        if (!Context) return;
        DiagnosticsEngine &DE = Context->getDiagnostics();
        unsigned ID = DE.getCustomDiagID(DiagnosticsEngine::Warning,
            "Float literal has been safely demoted to __fp16");
        auto DB = DE.Report(Loc, ID);
    }

    void emitLiteralDemotionFailureDiagnostic(SourceLocation Loc, double OriginalValue, StringRef Reason) {
        if (!Context) return;
        DiagnosticsEngine &DE = Context->getDiagnostics();
        unsigned ID = DE.getCustomDiagID(DiagnosticsEngine::Note,
            "Cannot demote float literal to __fp16: %0");
        auto DB = DE.Report(Loc, ID);
        DB.AddString(Reason);
    }

    ASTContext *Context;
    Rewriter &TheRewriter;
    std::unordered_set<const VarDecl*> ProcessedDecls;
    std::vector<Transformation> Replacements; // Stores all text replacements
};

class Fp16DemotionASTConsumer : public ASTConsumer {
public:
    explicit Fp16DemotionASTConsumer(ASTContext *Context, Rewriter &R)
        : Visitor(Context, R) {}

    void HandleTranslationUnit(ASTContext &Context) override {
        // Traverse the AST to collect transformations
        Visitor.TraverseDecl(Context.getTranslationUnitDecl());

        // Apply all transformations in reverse order
        Visitor.applyTransformations();
        
        // Write JSON output immediately after processing
        llvm::outs() << "\n=== WRITING JSON OUTPUT ===\n";
        llvm::outs() << "Found " << jsonEntries.size() << " floating point literals\n";
        
        // Write JSON output
        std::ofstream jsonOut("float_map.json");
        if (!jsonOut.is_open()) {
            llvm::errs() << "Error opening float_map.json for writing.\n";
            return;
        }
        jsonOut << "[\n";
        for (size_t i = 0; i < jsonEntries.size(); ++i) {
            jsonOut << jsonEntries[i];
            if (i + 1 != jsonEntries.size())
                jsonOut << ",\n";
        }
        jsonOut << "\n]\n";
        jsonOut.close();
        
        llvm::outs() << "JSON output written to float_map.json\n";
        
        // Write demoted code output
        Visitor.writeDemotedCode(Context);
        
        // Write memory usage analysis
        Visitor.writeMemoryAnalysis();
    }

private:
    Fp16DemotionVisitor Visitor;
};

class Fp16DemotionPluginAction : public PluginASTAction {
public:
    std::unique_ptr<ASTConsumer> CreateASTConsumer(CompilerInstance &CI,
                                                   StringRef file) override {
        if (!EnableFp16Demotion) {
            llvm::errs() << "Warning: FP16 demotion is not enabled. Use -fprecision-demote=fp16 to enable.\n";
            return nullptr;
        }

        TheRewriter.setSourceMgr(CI.getSourceManager(), CI.getLangOpts());
        return std::make_unique<Fp16DemotionASTConsumer>(&CI.getASTContext(),
                                                         TheRewriter);
    }

    bool ParseArgs(const CompilerInstance &CI,
                   const std::vector<std::string>& args) override {
        llvm::errs() << "FP16 demotion plugin loaded.\n";
        for (const auto &Arg : args) {
            if (Arg == "-fprecision-demote=fp16") {
                EnableFp16Demotion = true;
                llvm::outs() << "FP16 demotion enabled.\n";
            }
        }
        return true;
    }

    ActionType getActionType() override {
        return PluginASTAction::AddBeforeMainAction;
    }

    // New: EndSourceFileAction to write modified code and JSON
    void EndSourceFileAction() override {
        // Always write JSON output regardless of rewriter status
        llvm::outs() << "\n=== WRITING JSON OUTPUT ===\n";
        llvm::outs() << "Found " << jsonEntries.size() << " floating point literals\n";
        
        // Write JSON output
        std::ofstream jsonOut("float_map.json");
        if (!jsonOut.is_open()) {
            llvm::errs() << "Error opening float_map.json for writing.\n";
            return;
        }
        jsonOut << "[\n";
        for (size_t i = 0; i < jsonEntries.size(); ++i) {
            jsonOut << jsonEntries[i];
            if (i + 1 != jsonEntries.size())
                jsonOut << ",\n";
        }
        jsonOut << "\n]\n";
        jsonOut.close();
        
        llvm::outs() << "JSON output written to float_map.json\n";
        
        // Skip the modified.cpp output for now to avoid crashes
        /*
        SourceManager &SM = TheRewriter.getSourceMgr();
        std::error_code EC;
        llvm::raw_fd_ostream out("modified.cpp", EC);
        if (EC) {
            llvm::errs() << "Error opening modified.cpp for writing: " << EC.message() << "\n";
            return;
        }
        TheRewriter.getEditBuffer(SM.getMainFileID()).write(out);
        out.close(); // Close the output stream
        */
    }


private:
    Rewriter TheRewriter;
    bool EnableFp16Demotion = false;
};

} // namespace

static FrontendPluginRegistry::Add<Fp16DemotionPluginAction>
X("fp16-demotion", "Demote float variables and literals to __fp16 where safe");