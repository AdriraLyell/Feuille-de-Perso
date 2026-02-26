import { Parser } from 'expr-eval';

const parser = new Parser();
try {
    const expr = parser.parse('Volonté + 10');
    const res = expr.evaluate({ 'Volonté': 5 });
    console.log('Result with accent:', res);
} catch (e) {
    console.error('Error with accent:', e.message);
}

try {
    const expr2 = parser.parse('Constitution + Volonté');
    const res2 = expr2.evaluate({ 'Constitution': 2, 'Volonté': 3 });
    console.log('Result with multiple accents:', res2);
} catch (e) {
    console.error('Error with multiple accents:', e.message);
}
