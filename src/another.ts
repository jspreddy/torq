export function another_add(a: number, b: number) {
    const obj = { a, b, add: a + b };
    console.log(obj);
    return JSON.stringify(obj);
}