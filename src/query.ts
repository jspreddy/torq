import _ from 'lodash';
import { reserved } from './dynamo_reserved_words';

export class Query {
    static DEFAULT_LIMIT = 25;

    private _tableName: string;
    private _hashKey: string;
    private _rangeKey: string;
    private _selections: string[];
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

    select(cols: string[]) {
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

    toDynamo(): object {
        const [keyCond, keyAttribVals, keyAttribNames] = formatKeyCondition(this._hashKey, this._hashVal, this._rangeKey, this._rangeVal);
        const [filterCond, filterAttribVals, filterAttribNames] = formatFilterCondition(this._filters);
        return {
            TableName: this._tableName,
            Limit: this._limit,
            ...formatProjectionExpression(this._selections),
            ...keyCond,
            ...filterCond,
            ..._.merge(keyAttribVals, filterAttribVals),
            ..._.merge(keyAttribNames, filterAttribNames),
        };
    }
}

const formatKeyCondition = (hashKey: string, hashVal: any, rangeKey: string, rangeVal: any) => {
    const conditionParts: string[] = [];
    const attribVals = {};
    const attribNames = {};
    const kvSetter = (k, v) => {
        if (_.indexOf(reserved, _.toUpper(k)) != -1) {
            _.set(attribNames, `#${k}`, k);
            conditionParts.push(`#${k} = :${k}`);
        }
        else {
            conditionParts.push(`${k} = :${k}`);
        }

        _.set(attribVals, `:${k}`, v);
    };

    if (hashKey && hashVal) {
        kvSetter(hashKey, hashVal);
    }

    if (rangeKey && rangeVal) {
        kvSetter(rangeKey, rangeVal);
    }

    return [
        { KeyConditionExpression: _.join(conditionParts, " and ") },
        { ExpressionAttributeValues: _.isEmpty(attribVals) ? undefined : attribVals },
        { ExpressionAttributeNames: _.isEmpty(attribNames) ? undefined : attribNames },
    ];
};

const formatFilterCondition = (filters) => {
    const filterParts: string[] = [];
    const attribVals = {};
    const attribNames = {};

    _.each(filters, f => {
        if (f.type === 'eq') {
            const key = f.attrib;
            const val = f.val;
            if (_.indexOf(reserved, _.toUpper(f.attrib)) != -1) {
                _.set(attribNames, `#${key}`, key);
                filterParts.push(`#${key} = :${key}`);
            }
            else {
                filterParts.push(`${key} = :${key}`);
            }

            _.set(attribVals, `:${key}`, val);
        }
    });

    const filterExp = _.join(filterParts, ' and ');

    return [
        { FilterExpression: _.isEmpty(filterExp) ? undefined : filterExp },
        { ExpressionAttributeValues: _.isEmpty(attribVals) ? undefined : attribVals },
        { ExpressionAttributeNames: _.isEmpty(attribNames) ? undefined : attribNames },
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
