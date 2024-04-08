export class Query {
    static DEFAULT_LIMIT: number = 25;

    private _tableName: string;
    private _hashKey: string;
    private _rangeKey: string;
    private _selections: Array<string>;
    private _hashVal: string;
    private _rangeVal: string;
    private _filters: Array<object>;
    private _index: string;
    private _limit: number = Query.DEFAULT_LIMIT;

    get state() {
        return {
            tableName: this._tableName,
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

    constructor(tableName: string, hashKey: string, rangeKey: string) {
        this._tableName = tableName;
        this._hashKey = hashKey;
        this._rangeKey = rangeKey;

        // initialize here so that each query obj has its own filter list.
        this._filters = [];
    }

    select(cols: Array<string>) {
        this._selections = cols;
        return this;
    }

    get where() {
        const whereSelectors = {
            hash: {
                eq: (val: string): Query => {
                    this._hashVal = val;
                    return this;
                }
            },
            range: {
                eq: (val: string): Query => {
                    this._rangeVal = val;
                    return this;
                }
            },
        };
        return whereSelectors;
    }

    get filter() {
        const filterConditions = {
            eq: (attrib: string, val: any): Query => {
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
        this._limit = l ?? Query.DEFAULT_LIMIT;
    }

    toDynamo() {
        throw new Error("TODO: to be implemented");
    }

}
