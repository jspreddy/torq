export { another_add } from './another';

export function add(a: number, b: number) {
    return a + b;
}

export function subtract(a: number, b: number) {
    return a - b;
}

export function divide(a: number, b: number) {
    if (a === 0 || b === 0) return 0;
    return a / b;
}

export { Table } from './table';