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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Node } from "../../classes";
import type { Context, RelationField, GraphQLWhereArg } from "../../types";

import { getRelationshipDirection } from "../../utils/get-relationship-direction";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { createCypherWhereParams } from "../where/create-cypher-where-params";

export function createCountExpression({
    sourceNode,
    relationAggregationField,
    referenceNode,
    context,
    field,
    authCallWhere,
    targetNode,
}: {
    sourceNode: CypherBuilder.Node;
    referenceNode: Node;
    context: Context;
    relationAggregationField: RelationField;
    field: ResolveTree;
    authCallWhere: CypherBuilder.WhereParams | undefined;
    targetNode: CypherBuilder.Node;
}): CypherBuilder.Expr {
    const relationship = new CypherBuilder.Relationship({
        source: sourceNode,
        target: targetNode,
        type: relationAggregationField.type,
    });

    const direction = getRelationshipDirection(relationAggregationField, {
        directed: field.args.directed as boolean | undefined,
    });
    if (direction === "IN") relationship.reverse();

    const relationshipPattern = relationship.pattern({
        directed: !(direction === "undirected"),
    });
    const whereParams = createCypherWhereParams({
        element: referenceNode,
        context,
        whereInput: (field.args.where as GraphQLWhereArg) || {},
        targetElement: targetNode,
    });

    const patternComprehension = new CypherBuilder.PatternComprehension(relationshipPattern, targetNode);

    if (whereParams) {
        patternComprehension.where(whereParams);
    }
    if (authCallWhere) {
        patternComprehension.and(authCallWhere);
    }

    return CypherBuilder.size(patternComprehension);
}
