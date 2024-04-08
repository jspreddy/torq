export class Table {

    private _name: string;
    private _hashKey: string;
    private _rangeKey: string;
    private _selections: Array<string>;
    private _hashVal: string;
    private _rangeVal: string;
    private _filters: Array<object>;
    private _index: string;
    private _limit: number;

    get state() {
        return {
            name: this._name,
            hashKey: this._hashKey,
            rangeKey: this._rangeKey,
            selections: this._selections,
            hashVal: this._hashVal,
            rangeVal: this._rangeVal,
            filters: this._filters,
            index: this._index,
            limit: this._limit,
        };
    }

    constructor(name: string, hashKey: string, rangeKey: string) {
        this._name = name;
        this._hashKey = hashKey;
        this._rangeKey = rangeKey;

        // initialize here so that each Table obj has its own filter list.
        this._filters = [];
    }

    select(cols: Array<string>) {
        this._selections = cols;
        return this;
    }

    get where() {
        const whereSelectors = {
            hash: {
                eq: (val: string): Table => {
                    this._hashVal = val;
                    return this;
                }
            },
            range: {
                eq: (val: string): Table => {
                    this._rangeVal = val;
                    return this;
                }
            },
        };
        return whereSelectors;
    }

    get filter() {
        const filterConditions = {
            eq: (attrib: string, val: any): Table => {
                this._filters.push({ attrib, val, type: 'eq' });
                return this;
            }
        };
        return filterConditions;
    }

    using(index: string) {
        this._index = index;
    }

    limit(l: number) {
        this._limit = l | 100;
    }

    toDynamoQuery() {
        return this.state;
    }

}
