import { Patch } from "../instrument";
import * as recast from 'recast';
const n = recast.types.namedTypes;
const b = recast.types.builders;
import * as acorn from 'acorn'
import { PARSER_OPTIONS } from "../../utils";

export class DebugPatch implements Patch {
    name: string = "Debug"
    description: string = "Patch for debug mode"

    apply(script: string): string {
        const regex = /init_bundle\s*=\s*__esm\([\s\S]*?(?=var\s+require_esnext_iterator_for_each\b)/s
        const match = script.match(regex);
        if (match) {
            const obj = match[0]
            if (obj) {
                // Modify the object as needed
                const ast = recast.parse(obj, PARSER_OPTIONS);

                recast.visit(ast, {
                    visitObjectExpression(path) {
                        console.log(path.node)
                        return this.traverse(path);
                    },
                    visitFunctionDeclaration(path) {
                        console.log(path.node)
                        if (n.Identifier.check(path.node.id) && path.node.id.name === 'is_debug_mode') {
                            console.log('patching')
                            path.node.body = b.blockStatement([b.returnStatement(b.literal(true))]);
                        } else {
                            return this.traverse(path);
                        }
                        return false
                    }
                })
                let modified = script.replace(match[0], recast.print(ast).code);

                // now apply the can_view patch
                const canViewRegex = /lib_default\(\)\.location\.get\(\s*["']server:\/\/api\/1\.1\/u\/can_view["']\s*\)\.callback\(\s*\(\s*(?<err>\w+)\s*,\s*(?<res>\w+)\s*\)\s*=>\s*\{\s*(?<body>[\s\S]*?)\s*\}/s;

                // get the body
                const canViewMatch = modified.match(canViewRegex);
                if (canViewMatch && canViewMatch.groups) {
                    const body = canViewMatch.groups['body'];
                    // replace with cb(true)
                    modified = modified.replace(body, 'cb(true)');
                    console.log('can_view body:', body);
                }

                return modified
            }
        }
        console.warn("Failed to apply Debug patch");
        return script
    }
}