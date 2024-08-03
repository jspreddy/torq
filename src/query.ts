import _ from 'lodash';
import { reserved } from './dynamo_reserved_words';


type DynamoValue = string | number | boolean;
type BetweenValues = {
    start: DynamoValue,
    end: DynamoValue,
};

type Condition = {
    key: string;
    val: DynamoValue | BetweenValues;
    type: string;
    actualName?: string,
};

export class Query {
    static DEFAULT_LIMIT = 25;

    private _tableName: string;
    private _hashKey: string;
    private _rangeKey: string;
    private _selections: string[];
    private _keys: Array<Condition>;
    private _filters: Array<Condition>;
    // TODO: Implement index usage.
    private _index: string | undefined;
    private _limit: number = Query.DEFAULT_LIMIT;

    get state() {
        return {
            tableName: this._tableName,
            hashKey: this._hashKey,
            rangeKey: this._rangeKey,
            selections: this._selections,
            keys: this._keys,
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
        this._selections = [];
    }

    select(cols: string[]) {
        this._selections = cols;
        return this;
    }

    get where() {
        const whereSelectors = {
            hash: {
                eq: (val: string): Query => {
                    this._keys.push({ key: this._hashKey, val: val, type: 'hash-eq' });
                    return this;
                }
            },
            range: {
                eq: (val: DynamoValue): Query => {
                    this._keys.push({ key: this._rangeKey, val: val, type: 'eq' });
                    return this;
                },
                beginsWith: (val: DynamoValue): Query => {
                    this._keys.push({ key: this._rangeKey, val: val, type: 'begins_with' });
                    return this;
                },
                gt: (val: DynamoValue): Query => {
                    this._keys.push({ key: this._rangeKey, val: val, type: 'gt' });
                    return this;
                },
                gtEq: (val: DynamoValue): Query => {
                    this._keys.push({ key: this._rangeKey, val: val, type: 'gtEq' });
                    return this;
                },
                lt: (val: DynamoValue): Query => {
                    this._keys.push({ key: this._rangeKey, val: val, type: 'lt' });
                    return this;
                },
                ltEq: (val: DynamoValue): Query => {
                    this._keys.push({ key: this._rangeKey, val: val, type: 'ltEq' });
                    return this;
                },
                between: (start: DynamoValue, end: DynamoValue): Query => {
                    this._keys.push({
                        key: this._rangeKey,
                        val: {
                            start,
                            end,
                        },
                        type: 'between',
                    });
                    return this;
                },
            },
        };
        return whereSelectors;
    }

    get filter() {
        const filterConditions = {
            eq: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val, type: 'eq' });
                return this;
            },
            beginsWith: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val, type: 'begins_with' });
                return this;
            },
            gt: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val: val, type: 'gt' });
                return this;
            },
            gtEq: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val: val, type: 'gtEq' });
                return this;
            },
            lt: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val: val, type: 'lt' });
                return this;
            },
            ltEq: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val: val, type: 'ltEq' });
                return this;
            },
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
            ...formatProjectionExpression(this._selections),
            ...keyCond,
            ...filterCond,
            ..._.merge(keyAttribNames, filterAttribNames),
            ..._.merge(keyAttribVals, filterAttribVals),
            Limit: this._limit,
        };
    }
}

const isReserved = (name: string): boolean => {
    // Does the upper cased "name" exists in the reserved words list.
    return _.indexOf(reserved, _.toUpper(name)) != -1;
}

const replaceReservedNames = (conditions: Array<Condition>): Array<Condition> => {
    return _.map(conditions, (cond) => {

        if (isReserved(cond.key)) {
            return {
                ...cond,
                key: `#${cond.key}`,
                actualName: cond.key,
            };
        }

        return cond;
    });
};

const formatKeyCondition = (conditions: Array<Condition>) => {
    const updatedConditions = replaceReservedNames(conditions);

    const conditionParts: string[] = [];
    const attribVals = {};
    const attribNames = {};

    _.each(updatedConditions, (cond) => {
        const { key, val, type, actualName } = cond;
        const valRef = `:${_.trim(key, '#')}`;

        switch (type) {
            case "hash-eq":
            case "eq":
                conditionParts.push(`${key} = ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "gt":
                conditionParts.push(`${key} > ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "gtEq":
                conditionParts.push(`${key} >= ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "lt":
                conditionParts.push(`${key} < ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "ltEq":
                conditionParts.push(`${key} <= ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "between": {
                const valRefStart = `${valRef}_start`;
                const valRefEnd = `${valRef}_end`;
                const between = val as BetweenValues;
                conditionParts.push(`${key} BETWEEN ${valRefStart} AND ${valRefEnd}`);
                _.set(attribVals, valRefStart, between.start);
                _.set(attribVals, valRefEnd, between.end);
                break;
            }

            case "begins_with":
                conditionParts.push(`begins_with(${key}, ${valRef})`);
                _.set(attribVals, valRef, val);
                break;
        }

        if (actualName) {
            _.set(attribNames, key, actualName);
        }
    });

    return [
        { KeyConditionExpression: _.join(conditionParts, " and ") },
        { ExpressionAttributeValues: _.isEmpty(attribVals) ? undefined : attribVals },
        { ExpressionAttributeNames: _.isEmpty(attribNames) ? undefined : attribNames },
    ];
};

const formatFilterCondition = (filters: Array<Condition>) => {
    const updatedFilters = replaceReservedNames(filters);

    const filterParts: string[] = [];
    const attribVals = {};
    const attribNames = {};

    _.each(updatedFilters, f => {
        const valRef = `:${_.trim(f.key, '#')}`;

        switch (f.type) {
            case 'eq':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} = ${valRef}`);
                break;

            case 'gt':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} > ${valRef}`);
                break;

            case 'gtEq':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} >= ${valRef}`);
                break;

            case 'lt':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} < ${valRef}`);
                break;

            case 'ltEq':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} <= ${valRef}`);
                break;

            case 'begins_with':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`begins_with(${f.key}, ${valRef})`);
                break;
        }

        if (f.actualName) {
            _.set(attribNames, f.key, f.actualName);
        }
    });

    const filterExp = _.join(filterParts, ' and ');

    return [
        { FilterExpression: _.isEmpty(filterExp) ? undefined : filterExp },
        { ExpressionAttributeValues: _.isEmpty(attribVals) ? undefined : attribVals },
        { ExpressionAttributeNames: _.isEmpty(attribNames) ? undefined : attribNames },
    ];
};

const formatProjectionExpression = (proj: Array<string>) => {
    if (_.isEmpty(proj)) {
        return;
    }

    return {
        ProjectionExpression: _.join(proj, ", ")
    };
};
