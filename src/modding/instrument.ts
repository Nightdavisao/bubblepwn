export interface Patch {
    name: string
    description: string
    apply(script: string): string
}

export class PatchInstrumentation {
    private script: string;
    private patches: Patch[] = [];

    constructor(script: string) {
        this.script = script;
    }

    addPatch(patch: Patch) {
        this.patches.push(patch);
    }

    removePatch(patch: Patch) {
        this.patches = this.patches.filter(p => p !== patch);
    }

    applyPatches() {
        let modifiedScript = this.script;
        for (const patch of this.patches) {
            modifiedScript = patch.apply(modifiedScript);
        }
        return modifiedScript;
    }
}