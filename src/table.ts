export class Table {
    name: string;
    hashKey: string;
    rangeKey: string;

    constructor(name: string, hashKey: string, rangeKey: string) {
        this.name = name;
        this.hashKey = hashKey;
        this.rangeKey = rangeKey;
    }


}