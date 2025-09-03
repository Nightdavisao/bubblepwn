import { Patch } from "../instrument";
import * as recast from 'recast';
const n = recast.types.namedTypes;
const b = recast.types.builders;
import * as acorn from 'acorn';
import { PARSER_OPTIONS } from "../../utils";

export class ExposeVariablesPatch implements Patch {
    name: string = "ExposeVariables";
    description: string = "Patch to expose variables to global scope";

    apply(script: string): string {
        const regex = /typeof\s*window\s*>\s*['"]u['"]\s*\|\|\s*window\s*===\s*null\s*\?\s*([A-Za-z_$][\w$]*)\s*=\s*\(\)\s*=>\s*[^:;]+:\s*\1\s*=\s*\(\)\s*=>\s*[^;]+;/s;
        const match = script.match(regex);

        if (match) {
            let modifiedScript = script.replace(match[0], this.patchCode(match[0]));
            return modifiedScript;
        } else {
            throw new Error("Failed to apply ExposeVariables patch");
        }
    }

    private patchCode(body: string): string {
        return body+`window.bubblePWN = {...(window.bubblePWN || {}), lib_default:get_lib_or_undef};`
    }
}