import _ from 'lodash';

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

    using(index: string): Query {
        this._index = index;
        return this;
    }

    limit(l: number): Query {
        this._limit = l ?? Query.DEFAULT_LIMIT;
        return this;
    }

    toDynamo(): Object {
        const [keyCond, keyAttribVals] = formatKeyCondition(this._hashKey, this._hashVal, this._rangeKey, this._rangeVal);
        const [filterCond, filterAttribVals] = formatFilterCondition(this._filters);
        return {
            TableName: this._tableName,
            Limit: this._limit,
            ...formatProjectionExpression(this._selections),
            ...keyCond,
            ...filterCond,
            ...joinAttrbVals(keyAttribVals, filterAttribVals),
        };
    }
}

const joinAttrbVals = (a, b) => {
    return _.merge(a, b);
};

const formatKeyCondition = (hashKey: string, hashVal: any, rangeKey: string, rangeVal: any) => {
    const conditionParts: string[] = [];
    const attribVals = {};

    if (hashKey && hashVal) {
        conditionParts.push(`${hashKey} = :${hashKey}`);
        _.set(attribVals, `:${hashKey}`, hashVal);
    }

    if (rangeKey && rangeVal) {
        conditionParts.push(`${rangeKey} = :${rangeKey}`);
        _.set(attribVals, `:${rangeKey}`, rangeVal);
    }

    return [
        { KeyConditionExpression: _.join(conditionParts, " and ") },
        { ExpressionAttributeValues: attribVals },
    ];
};

const formatFilterCondition = (filters) => {
    const f = "";
    const attribs = {};

    const filterExp = _.reduce(filters, (acc, f) => {
        if (f.type === 'eq') {
            _.set(attribs, `:${f.attrib}`, f.val);
            const queryPart = `${f.attrib} = :${f.attrib}`;

            return _.join(_.compact([acc, queryPart]), " and ")
        }
        return acc;
    }, "");

    return [
        { FilterExpression: _.isEmpty(filterExp) ? undefined : filterExp },
        { ExpressionAttributeValues: attribs },
    ];
};

const formatProjectionExpression = (proj) => {
    if (_.isEmpty(proj)) {
        return;
    }

    return {
        ProjectionExpression: _.join(proj, ", ")
    };
};
