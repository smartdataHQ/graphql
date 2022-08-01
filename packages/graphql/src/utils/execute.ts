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

import type { SessionMode, QueryResult, Session, Transaction } from "neo4j-driver";
import { Neo4jError } from "neo4j-driver";
import Debug from "debug";
import {
    Neo4jGraphQLForbiddenError,
    Neo4jGraphQLAuthenticationError,
    Neo4jGraphQLConstraintValidationError,
    Neo4jGraphQLRelationshipValidationError,
} from "../classes";
import {
    AUTH_FORBIDDEN_ERROR,
    AUTH_UNAUTHENTICATED_ERROR,
    DEBUG_EXECUTE,
    RELATIONSHIP_REQUIREMENT_PREFIX,
} from "../constants";
import createAuthParam from "../translate/create-auth-param";
import type { Context, DriverConfig } from "../types";
import environment from "../environment";

const debug = Debug(DEBUG_EXECUTE);

export interface ExecuteResult {
    bookmark: string | null;
    result: QueryResult;
    statistics: Record<string, number>;
    records: Record<PropertyKey, any>[];
}

async function execute({
    cypher,
    params,
    defaultAccessMode,
    context,
}: {
    cypher: string;
    params: any;
    defaultAccessMode: SessionMode;
    context: Context;
}): Promise<ExecuteResult> {
    let modifiedCypher =
        context.queryOptions && Object.keys(context.queryOptions).length
            ? `CYPHER ${Object.entries(context.queryOptions)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(" ")}\n${cypher}`
            : cypher;

    if (modifiedCypher.indexOf("##") > -1) {
        for (let key in params) {
            modifiedCypher = modifiedCypher.split(`##${key}`).join(params[key]);
        }
    }

    const result = await context.executor.execute(modifiedCypher, params, defaultAccessMode);

    if (!result) {
        throw new Error("Unable to execute query against Neo4j database");
    }

    const records = result.records.map((r) => r.toObject());

    debug(`Execute successful, received ${records.length} records`);

    return {
        bookmark: context.executor.lastBookmark,
        result,
        statistics: result.summary.counters.updates(),
        records,
    };
}

export default execute;
