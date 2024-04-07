export class Table {
    name: string;
    hashKey: string;
    rangeKey: string;
    something: string;

    constructor(name: string, hashKey: string, rangeKey: string) {
        this.name = name;
        this.hashKey = hashKey;
        this.rangeKey = rangeKey;
        // this.something = "blah";
    }


}
