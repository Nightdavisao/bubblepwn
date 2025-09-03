import * as acorn from 'acorn'

export const PARSER_OPTIONS = {
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
}