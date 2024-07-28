import _ from 'lodash';
import { reserved } from './dynamo_reserved_words';

export class Query {
    static DEFAULT_LIMIT = 25;

    private _tableName: string;
    private _hashKey: string;
    private _rangeKey: string;
    private _selections: string[] | undefined;
    private _hashVal: string | undefined;
    private _rangeVal: string | object | undefined;
    private _keys: Array<object>;
    private _filters: Array<object>;
    // TODO: Implement index usage.
    private _index: string | undefined;
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
        this._keys = [];
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
                    this._keys.push({ key: this._hashKey, val: val, type: 'hash-eq' });
                    return this;
                }
            },
            range: {
                eq: (val: string): Query => {
                    this._rangeVal = val;
                    this._keys.push({ key: this._rangeKey, val: val, type: 'eq' });
                    return this;
                },
                beginsWith: (val: string): Query => {
                    this._rangeVal = { type: "begins_with", val };
                    this._keys.push({ key: this._rangeKey, val: val, type: 'begins_with' });
                    return this;
                },
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

    // TODO: Implement using an index.
    // using(index: string): Query {
    //     this._index = index;
    //     return this;
    // }

    limit(l: number): Query {
        this._limit = l ?? Query.DEFAULT_LIMIT;
        return this;
    }

    toDynamo(): object {
        const [keyCond, keyAttribVals, keyAttribNames] = formatKeyCondition(this._keys);
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

const isReserved = (name: string): boolean => {
    // Does the upper cased "name" exists in the reserved words list.
    return _.indexOf(reserved, _.toUpper(name)) != -1;
}

const replaceReservedNames = (conditions: Array<object>): Array<object> => {
    return _.map(conditions, (cond) => {

        if(isReserved(cond.key)){
            return {
                ...cond,
                key: `#${cond.key}`,
                actualName: cond.key,
            };
        }

        return cond;
    });
};

const formatKeyCondition = (conditions) => {
    const updatedConditions = replaceReservedNames(conditions);

    const conditionParts: string[] = [];
    const attribVals = {};
    const attribNames = {};

    _.each(updatedConditions, (cond) => {
        const {key, val, type, actualName} = cond;
        const valRef = `:${_.trim(key, '#')}`;

        switch(type) {
            case "hash-eq":
            case "eq":
                conditionParts.push(`${key} = ${valRef}`);
                _.set(attribVals, valRef, val);
                break;
            case "begins_with":
                conditionParts.push(`begins_with(${key}, ${valRef})`);
                _.set(attribVals, valRef, val);
                break;
        }

        if(actualName) {
            _.set(attribNames, key, actualName);
        }
    });

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
