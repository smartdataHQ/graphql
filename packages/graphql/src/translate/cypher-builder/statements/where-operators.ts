/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CypherContext } from "../CypherContext";
import { MatchableElement } from "../MatchPattern";
import { Param } from "../references/Param";

type Params = Record<string, Param<any>>;
type WhereInput = Array<[MatchableElement, Params] | WhereOperator>;

type Operation = "OR" | "AND";

export class WhereOperator {
    private whereInput: WhereInput;
    private operation: Operation;

    constructor(operation: Operation, input: WhereInput) {
        this.whereInput = input;
        this.operation = operation;
    }

    public getCypher(context: CypherContext): string {
        const nestedOperationsCypher = this.whereInput.map((input) => {
            if (input instanceof WhereOperator) return input.getCypher(context);
            return this.composeWhere(context, input);
        });

        const operationStr = `\n${this.operation} `;
        const operationsStr = nestedOperationsCypher.join(operationStr);

        if (nestedOperationsCypher.length > 1) {
            return `(${operationsStr})`;
        }

        return `${operationsStr}`;
    }

    private composeWhere(context: CypherContext, input: [MatchableElement, Params]): string {
        const [matchableElement, params] = input;
        const nodeAlias = context.getVariableId(matchableElement);

        const paramsStrs = Object.entries(params).map(([key, value]) => {
            return `${nodeAlias}.${key} = ${value instanceof Param ? value.getCypher(context) : value}`;
        });

        return `${paramsStrs.join("\nAND ")}`;
    }
}

export function and(...items: WhereInput): WhereOperator {
    return new WhereOperator("AND", items);
}

export function or(...items: WhereInput): WhereOperator {
    return new WhereOperator("OR", items);
}
