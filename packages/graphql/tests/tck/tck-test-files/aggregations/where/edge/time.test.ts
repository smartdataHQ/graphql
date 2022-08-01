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

import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../../src";
import { createJwtRequest } from "../../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";

describe("Cypher Aggregations where edge with Time", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                name: String
            }

            type Post {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
                someTime: Time
                someTimeAlias: Time @alias(property: "_someTimeAlias")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_EQUAL: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someTime = $aggr_edge_someTime_EQUAL
            \\", { this: this, aggr_edge_someTime_EQUAL: $aggr_edge_someTime_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_EQUAL\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("EQUAL with alias", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTimeAlias_EQUAL: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge._someTimeAlias = $aggr_edge_someTimeAlias_EQUAL
            \\", { this: this, aggr_edge_someTimeAlias_EQUAL: $aggr_edge_someTimeAlias_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTimeAlias_EQUAL\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_GT: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someTime > $aggr_edge_someTime_GT
            \\", { this: this, aggr_edge_someTime_GT: $aggr_edge_someTime_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_GT\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_GTE: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someTime >= $aggr_edge_someTime_GTE
            \\", { this: this, aggr_edge_someTime_GTE: $aggr_edge_someTime_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_GTE\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_LT: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someTime < $aggr_edge_someTime_LT
            \\", { this: this, aggr_edge_someTime_LT: $aggr_edge_someTime_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_LT\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_LTE: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someTime <= $aggr_edge_someTime_LTE
            \\", { this: this, aggr_edge_someTime_LTE: $aggr_edge_someTime_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_LTE\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MIN_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MIN_EQUAL: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someTime) = $aggr_edge_someTime_MIN_EQUAL
            \\", { this: this, aggr_edge_someTime_MIN_EQUAL: $aggr_edge_someTime_MIN_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MIN_EQUAL\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MIN_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MIN_GT: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someTime) > $aggr_edge_someTime_MIN_GT
            \\", { this: this, aggr_edge_someTime_MIN_GT: $aggr_edge_someTime_MIN_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MIN_GT\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MIN_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MIN_GTE: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someTime) >= $aggr_edge_someTime_MIN_GTE
            \\", { this: this, aggr_edge_someTime_MIN_GTE: $aggr_edge_someTime_MIN_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MIN_GTE\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MIN_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MIN_LT: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someTime) < $aggr_edge_someTime_MIN_LT
            \\", { this: this, aggr_edge_someTime_MIN_LT: $aggr_edge_someTime_MIN_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MIN_LT\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MIN_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MIN_LTE: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  min(aggr_edge.someTime) <= $aggr_edge_someTime_MIN_LTE
            \\", { this: this, aggr_edge_someTime_MIN_LTE: $aggr_edge_someTime_MIN_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MIN_LTE\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MAX_EQUAL: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someTime) = $aggr_edge_someTime_MAX_EQUAL
            \\", { this: this, aggr_edge_someTime_MAX_EQUAL: $aggr_edge_someTime_MAX_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MAX_EQUAL\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MAX_GT: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someTime) > $aggr_edge_someTime_MAX_GT
            \\", { this: this, aggr_edge_someTime_MAX_GT: $aggr_edge_someTime_MAX_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MAX_GT\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MAX_GTE: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someTime) >= $aggr_edge_someTime_MAX_GTE
            \\", { this: this, aggr_edge_someTime_MAX_GTE: $aggr_edge_someTime_MAX_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MAX_GTE\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MAX_LT: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someTime) < $aggr_edge_someTime_MAX_LT
            \\", { this: this, aggr_edge_someTime_MAX_LT: $aggr_edge_someTime_MAX_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MAX_LT\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someTime_MAX_LTE: "12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN  max(aggr_edge.someTime) <= $aggr_edge_someTime_MAX_LTE
            \\", { this: this, aggr_edge_someTime_MAX_LTE: $aggr_edge_someTime_MAX_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someTime_MAX_LTE\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });
});
