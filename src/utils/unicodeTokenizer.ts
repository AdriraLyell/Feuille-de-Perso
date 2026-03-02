/**
 * Unicode-aware Tokenizer for expression parsing.
 * Drop-in replacement for safe-expr-eval's Tokenizer that supports
 * accented characters (é, è, ê, ñ, etc.) in identifiers.
 *
 * This eliminates the "Unknown character at position X: 'é'" warnings.
 */

interface Token {
    type: string;
    value: string | number | boolean;
    position: number;
}

/**
 * Normalizes a formula string by removing accents from identifiers,
 * while preserving string literals, operators, and structure.
 * This is needed because safe-expr-eval's internal Parser uses its own
 * ASCII-only Tokenizer that we cannot replace.
 * 
 * Example: "Dextérité + Volonté * 2" → "Dexterite + Volonte * 2"
 */
export const normalizeFormula = (formula: string): string => {
    if (!formula) return '';
    return formula.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export class UnicodeTokenizer {
    private position: number;
    private input: string;
    private currentChar: string | null;

    constructor(input: string) {
        this.position = 0;
        this.input = input.trim();
        this.currentChar = this.input.length > 0 ? this.input[0] : null;
    }

    private advance(): void {
        this.position++;
        this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
    }

    private peek(offset = 1): string | null {
        const peekPos = this.position + offset;
        return peekPos < this.input.length ? this.input[peekPos] : null;
    }

    private skipWhitespace(): void {
        while (this.currentChar !== null && /\s/.test(this.currentChar)) {
            this.advance();
        }
    }

    private number(): Token {
        let numStr = '';
        const startPos = this.position;
        while (this.currentChar !== null && /[0-9.]/.test(this.currentChar)) {
            numStr += this.currentChar;
            this.advance();
        }
        return { type: 'NUMBER', value: parseFloat(numStr), position: startPos };
    }

    private string(): Token {
        const startPos = this.position;
        const quote = this.currentChar;
        this.advance();
        let strValue = '';
        while (this.currentChar !== null && this.currentChar !== quote) {
            if (this.currentChar === '\\') {
                this.advance();
                if (this.currentChar !== null) {
                    strValue += this.currentChar;
                    this.advance();
                }
            } else {
                strValue += this.currentChar;
                this.advance();
            }
        }
        if (this.currentChar === quote) {
            this.advance();
        }
        return { type: 'STRING', value: strValue, position: startPos };
    }

    /**
     * Parse an identifier — Unicode-aware.
     * Accepts any Unicode letter (\p{L}), digits, underscores, and dots.
     */
    private identifier(): Token {
        let idStr = '';
        const startPos = this.position;
        while (this.currentChar !== null && /[\p{L}\p{N}_.]/u.test(this.currentChar)) {
            idStr += this.currentChar;
            this.advance();
        }
        if (idStr === 'true' || idStr === 'false') {
            return { type: 'BOOLEAN', value: idStr === 'true', position: startPos };
        }
        return { type: 'IDENTIFIER', value: idStr, position: startPos };
    }

    private operator(): Token {
        const startPos = this.position;
        let opStr = this.currentChar!;
        const nextChar = this.peek();
        if (
            nextChar !== null &&
            ((opStr === '=' && nextChar === '=') ||
                (opStr === '!' && nextChar === '=') ||
                (opStr === '>' && nextChar === '=') ||
                (opStr === '<' && nextChar === '='))
        ) {
            opStr += nextChar;
            this.advance();
            this.advance();
        } else {
            this.advance();
        }
        return { type: 'OPERATOR', value: opStr, position: startPos };
    }

    /**
     * Tokenize the entire input string — Unicode-aware.
     * Identifier detection uses \p{L} (any Unicode letter) instead of [a-zA-Z].
     */
    tokenize(): Token[] {
        const tokens: Token[] = [];

        while (this.currentChar !== null) {
            this.skipWhitespace();
            if (this.currentChar === null) break;

            // Numbers
            if (/[0-9]/.test(this.currentChar)) {
                tokens.push(this.number());
                continue;
            }

            // Negative numbers
            if (
                this.currentChar === '-' &&
                this.peek() !== null &&
                /[0-9]/.test(this.peek()!) &&
                (tokens.length === 0 ||
                    tokens[tokens.length - 1].type === 'PAREN_OPEN' ||
                    tokens[tokens.length - 1].type === 'OPERATOR' ||
                    tokens[tokens.length - 1].type === 'COMMA')
            ) {
                this.advance();
                const numToken = this.number();
                numToken.value = -(numToken.value as number);
                tokens.push(numToken);
                continue;
            }

            // Strings
            if (this.currentChar === '"' || this.currentChar === "'") {
                tokens.push(this.string());
                continue;
            }

            // Identifiers: Unicode-aware (accepts é, è, ê, ñ, ü, etc.)
            if (/[\p{L}_]/u.test(this.currentChar)) {
                tokens.push(this.identifier());
                continue;
            }

            // Parentheses
            if (this.currentChar === '(') {
                tokens.push({ type: 'PAREN_OPEN', value: '(', position: this.position });
                this.advance();
                continue;
            }
            if (this.currentChar === ')') {
                tokens.push({ type: 'PAREN_CLOSE', value: ')', position: this.position });
                this.advance();
                continue;
            }

            // Comma
            if (this.currentChar === ',') {
                tokens.push({ type: 'COMMA', value: ',', position: this.position });
                this.advance();
                continue;
            }

            // Operators
            if (/[+\-*/%<>=!]/.test(this.currentChar)) {
                tokens.push(this.operator());
                continue;
            }

            // Unknown character — silently skip (no console.warn spam)
            this.advance();
        }

        tokens.push({ type: 'EOF', value: '', position: this.position });
        return tokens;
    }
}
