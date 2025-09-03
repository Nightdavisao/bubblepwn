import { Patch } from "../instrument";
import * as recast from 'recast';
const n = recast.types.namedTypes;
const b = recast.types.builders;
import * as acorn from 'acorn'

export class DatabasePatch implements Patch {
    name: string = "Database"
    description: string = "Patch for Database"

    apply(script: string): string {
        const regex = /init_shared2\s*=\s*__esm\(\{\s*['"]lib-browser\/db\/client_db\/shared\.js['"]\(\)\s*\{\s*[\s\S]*?\}\s*\}\s*\)\s*;/s
        const match = script.match(regex)

        if (match) {
            let modifiedScript = script.replace(match[0], this.patchElasticsearch(match[0]))
            return modifiedScript
        } else {
            throw new Error("Failed to apply Database patch")
        }
    }

    patchElasticsearch(body: string): string {
        const ast = recast.parse(body, {
            parser: {
                parse(code: string) {
                    const tokens: any[] = []
                    const parsed = acorn.parse(code, {
                        ecmaVersion: 'latest',
                        onToken: tokens,
                        locations: true
                    }) as any;

                    if (!parsed.tokens) {
                        Object.assign(parsed, { tokens })
                    }
                    return parsed
                }
            }
        });

        recast.visit(ast, {
            visitMethodDefinition(path) {
                if (path.node.key.type === 'Identifier' && path.node.key.name === 'elasticsearch') {
                    const params = path.node.value.params.map(param => {
                        if (n.Identifier.check(param)) return param.name
                    }).filter((name): name is string => name !== undefined);

                    if (n.BlockStatement.check(path.node.value.body)) {
                        const esBody = path.node.value.body.body;

                        esBody.unshift(
                            b.expressionStatement(
                                b.callExpression(
                                    b.identifier('bubblePWN.event.emit'),
                                    [b.literal('db_query'), b.arrayExpression(
                                        params.map(p => b.identifier(p))
                                    )]
                                )
                            )
                        );
                    }
                }
                return false
            }
        })

        return recast.print(ast).code
    }
}
