export const PATCHES_MAP = {
    "Database": import("../modding/patches/database").then(m => m.DatabasePatch),
    "Debug Mode": import("../modding/patches/debugMode").then(m => m.DebugPatch),
    "Expose Variables": import("../modding/patches/exposeVariables").then(m => m.ExposeVariablesPatch),
}