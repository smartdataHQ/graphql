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

import { stringifyObject } from "./stringify-object";
import { escapeQuery } from "./escape-query";

/** Wraps a query inside an apoc call, escaping strings and serializing params */
export function wrapInApocRunFirstColumn(
    query: string,
    params: Record<string, string> = {},
    expectMultipleValues?: boolean
): string {
    const serializedParams = stringifyObject(params);
    const escapedQuery = escapeQuery(query);

    if (expectMultipleValues === false) {
        return `apoc.cypher.runFirstColumnSingle("${escapedQuery}", ${serializedParams})`;
    }

    return `apoc.cypher.runFirstColumnMany("${escapedQuery}", ${serializedParams})`;
}

export function serializeParamsForApocRun(params: Record<string, any>): Record<string, string> {
    return Object.keys(params).reduce((acc, key) => {
        acc[key] = `$${key}`;
        return acc;
    }, {});
}
