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

import { dedent } from "graphql-compose";
import { Node } from "../classes";
import { AuthOperations, Context, GraphQLWhereArg } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import createWhereAndParams from "./where/create-where-and-params";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { addWhereToStatement } from "./where/add-where-to-statement";

function translateTopLevelMatch({
    node,
    context,
    varName,
    operation,
}: {
    context: Context;
    node: Node;
    varName: string;
    operation: AuthOperations;
}): [string, Record<string, unknown>] {
    const cyphers: string[] = [];
    let cypherParams = {};
    const { resolveTree } = context;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const fulltextInput = (resolveTree.args.fulltext || {}) as Record<string, { phrase: string }>;
    const whereStrs: string[] = [];

    const matchNode = new CypherBuilder.Node({ labels: node.getLabels(context) });
    const matchQuery = new CypherBuilder.Match(matchNode);

    // if (!Object.entries(fulltextInput).length) {
    //     cyphers.push(`MATCH (${varName}${node.getLabelString(context)})`);
    // } else {
    //     // THIS is only for fulltext search
    //     if (Object.entries(fulltextInput).length > 1) {
    //         throw new Error("Can only call one search at any given time");
    //     }
    //
    //     const [indexName, indexInput] = Object.entries(fulltextInput)[0];
    //     const baseParamName = `${varName}_fulltext_${indexName}`;
    //     const paramPhraseName = `${baseParamName}_phrase`;
    //     cypherParams[paramPhraseName] = indexInput.phrase;
    //
    //     cyphers.push(
    //         dedent(`
    //             CALL db.index.fulltext.queryNodes(
    //                 "${indexName}",
    //                 $${paramPhraseName}
    //             ) YIELD node as this
    //         `)
    //     );
    //
    //     if (node.nodeDirective?.additionalLabels?.length) {
    //         node.getLabels(context).forEach((label) => {
    //             whereStrs.push(`"${label}" IN labels(${varName})`);
    //         });
    //     } else {
    //         whereStrs.push(`"${node.getMainLabel()}" IN labels(${varName})`);
    //     }
    // }

    if (whereInput) {
        // const where = createWhereAndParams({
        //     whereInput,
        //     varName,
        //     node,
        //     context,
        //     recursing: true,
        // });
        // if (where[0]) {
        //     whereStrs.push(where[0]);
        //     cypherParams = { ...cypherParams, ...where[1] };
        // }

        const matchWhereQuery = addWhereToStatement({
            whereInput,
            node,
            context,
            matchStatement: matchQuery,
            targetElement: matchNode,
        });
        const result = matchWhereQuery.build();
        cyphers.push(result.cypher);
        cypherParams = { ...cypherParams, ...result.params };
    }

    // const whereAuth = createAuthAndParams({
    //     operations: operation,
    //     entity: node,
    //     context,
    //     where: { varName, node },
    // });
    // if (whereAuth[0]) {
    //     whereStrs.push(whereAuth[0]);
    //     cypherParams = { ...cypherParams, ...whereAuth[1] };
    // }
    //
    // if (whereStrs.length) {
    //     cyphers.push(`WHERE ${whereStrs.join(" AND ")}`);
    // }

    return [cyphers.join("\n"), cypherParams];
}

export default translateTopLevelMatch;
