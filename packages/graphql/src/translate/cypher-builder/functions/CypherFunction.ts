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

import { CypherASTNode } from "../CypherASTNode";
import type { CypherEnvironment } from "../Environment";
import type { Expr } from "../types";
import type { NodeRef } from "../variables/NodeRef";

type FunctionType = "coalesce" | "point" | "distance" | "datetime" | "labels" | "size" | "count" | "min" | "max";

export class CypherFunction extends CypherASTNode {
    protected name: FunctionType;
    private params: Array<Expr>;

    constructor(name: FunctionType, params: Array<Expr> = []) {
        super();
        this.name = name;
        this.params = params;
        for (const param of params) {
            if (param instanceof CypherASTNode) {
                this.addChildren(param);
            }
        }
    }

    public getCypher(env: CypherEnvironment): string {
        const argsStr = this.params.map((expr) => expr.getCypher(env)).join(", ");

        return `${this.name}(${argsStr})`;
    }
}

export function coalesce(expr: Expr, ...optionalExpr: Expr[]): CypherFunction {
    return new CypherFunction("coalesce", [expr, ...optionalExpr]);
}

export function point(variable: Expr): CypherFunction {
    return new CypherFunction("point", [variable]);
}

export function distance(lexpr: Expr, rexpr: Expr): CypherFunction {
    return new CypherFunction("distance", [lexpr, rexpr]);
}

export function labels(nodeRef: NodeRef): CypherFunction {
    return new CypherFunction("labels", [nodeRef]);
}

export function cypherDatetime(): CypherFunction {
    return new CypherFunction("datetime");
}

export function size(expr: Expr): CypherFunction {
    return new CypherFunction("size", [expr]);
}

export function count(expr: Expr): CypherFunction {
    return new CypherFunction("count", [expr]);
}
export function min(expr: Expr): CypherFunction {
    return new CypherFunction("min", [expr]);
}
export function max(expr: Expr): CypherFunction {
    return new CypherFunction("max", [expr]);
}
