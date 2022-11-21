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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Node -> Points", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                currentLocation: Point!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("DISTANCE", async () => {
        let verifyTCK;

        if (process.env.VERIFY_TCK) {
            verifyTCK = process.env.VERIFY_TCK;
            delete process.env.VERIFY_TCK;
        }

        const query = gql`
            query {
                movies {
                    title
                    actorsConnection(
                        where: {
                            node: {
                                currentLocation_DISTANCE: { point: { longitude: 1.0, latitude: 2.0 }, distance: 3.0 }
                            }
                        }
                    ) {
                        edges {
                            screenTime
                            node {
                                name
                                currentLocation {
                                    latitude
                                    longitude
                                }
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WHERE distance(this_Actor.currentLocation, point($this_connection_actorsConnectionparam0.point)) = $this_connection_actorsConnectionparam0.distance
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name, currentLocation: (CASE
                    WHEN this_Actor.currentLocation IS NOT NULL THEN { point: this_Actor.currentLocation }
                    ELSE NULL
                END) } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connection_actorsConnectionparam0\\": {
                    \\"point\\": {
                        \\"longitude\\": 1,
                        \\"latitude\\": 2
                    },
                    \\"distance\\": 3
                }
            }"
        `);

        if (verifyTCK) {
            process.env.VERIFY_TCK = verifyTCK;
        }
    });
});
