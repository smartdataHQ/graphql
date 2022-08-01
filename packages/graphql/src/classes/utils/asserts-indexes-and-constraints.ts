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

import type { Driver, Session } from "neo4j-driver";
import Debug from "debug";
import type Node from "../Node";
import type { DriverConfig } from "../..";
import { DEBUG_EXECUTE } from "../../constants";

const debug = Debug(DEBUG_EXECUTE);

export interface AssertIndexesAndConstraintsOptions {
    create?: boolean;
}

async function createConstraints({ nodes, session }: { nodes: Node[]; session: Session }) {
    const constraintsToCreate: { constraintName: string; label: string; property: string }[] = [];
    const indexesToCreate: { indexName: string; label: string; properties: string[] }[] = [];

    const existingIndexes: Record<string, { labelsOrTypes: string; properties: string[] }> = {};
    const indexErrors: string[] = [];
    const indexesCypher = "CALL db.indexes";

    debug(`About to execute Cypher: ${indexesCypher}`);
    const indexesResult = await session.run(indexesCypher);

    indexesResult.records.forEach((record) => {
        const index = record.toObject();

        if (index.type !== "FULLTEXT" || index.entityType !== "NODE") {
            return;
        }

        if (existingIndexes[index.name]) {
            return;
        }

        existingIndexes[index.name] = {
            labelsOrTypes: index.labelsOrTypes,
            properties: index.properties,
        };
    });

    nodes.forEach((node) => {
        node.uniqueFields.forEach((field) => {
            constraintsToCreate.push({
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                constraintName: field.unique!.constraintName,
                label: node.getMainLabel(),
                property: field.dbPropertyName || field.fieldName,
            });
        });

        if (node.fulltextDirective) {
            node.fulltextDirective.indexes.forEach((index) => {
                const existingIndex = existingIndexes[index.name];
                if (!existingIndex) {
                    const properties = index.fields.map((field) => {
                        const stringField = node.primitiveFields.find((f) => f.fieldName === field);

                        return stringField?.dbPropertyName || field;
                    });

                    indexesToCreate.push({
                        indexName: index.name,
                        label: node.getMainLabel(),
                        properties,
                    });
                } else {
                    index.fields.forEach((field) => {
                        const stringField = node.primitiveFields.find((f) => f.fieldName === field);
                        const fieldName = stringField?.dbPropertyName || field;

                        const property = existingIndex.properties.find((p) => p === fieldName);
                        if (!property) {
                            const aliasError = stringField?.dbPropertyName ? ` aliased to field '${fieldName}''` : "";

                            indexErrors.push(
                                `@fulltext index '${index.name}' on Node '${node.name}' already exists, but is missing field '${field}'${aliasError}`
                            );
                        }
                    });
                }
            });
        }
    });

    if (indexErrors.length) {
        throw new Error(indexErrors.join("\n"));
    }

    for (const constraintToCreate of constraintsToCreate) {
        const cypher = [
            `CREATE CONSTRAINT ${constraintToCreate.constraintName}`,
            `IF NOT EXISTS ON (n:${constraintToCreate.label})`,
            `ASSERT n.${constraintToCreate.property} IS UNIQUE`,
        ].join(" ");

        debug(`About to execute Cypher: ${cypher}`);

        // eslint-disable-next-line no-await-in-loop
        const result = await session.run(cypher);

        const { constraintsAdded } = result.summary.counters.updates();

        debug(`Created ${constraintsAdded} new constraint${constraintsAdded ? "" : "s"}`);
    }

    for (const indexToCreate of indexesToCreate) {
        const cypher = [
            `CALL db.index.fulltext.createNodeIndex(`,
            `"${indexToCreate.indexName}",`,
            `["${indexToCreate.label}"],`,
            `[${indexToCreate.properties.map((p) => `"${p}"`).join(", ")}]`,
            `)`,
        ].join(" ");

        debug(`About to execute Cypher: ${cypher}`);

        // eslint-disable-next-line no-await-in-loop
        await session.run(cypher);

        debug(`Created @fulltext index ${indexToCreate.indexName}`);
    }
}

async function checkConstraints({ nodes, session }: { nodes: Node[]; session: Session }) {
    const constraintsCypher = "SHOW UNIQUE CONSTRAINTS";

    const existingConstraints: Record<string, string[]> = {};
    const missingConstraints: string[] = [];

    debug(`About to execute Cypher: ${constraintsCypher}`);
    const constraintsResult = await session.run(constraintsCypher);

    constraintsResult.records
        .map((record) => {
            return record.toObject();
        })
        .forEach((constraint) => {
            const label = constraint.labelsOrTypes[0];
            const property = constraint.properties[0];

            if (existingConstraints[label]) {
                existingConstraints[label].push(property as string);
            } else {
                existingConstraints[label] = [property];
            }
        });

    nodes.forEach((node) => {
        node.uniqueFields.forEach((field) => {
            const property = field.dbPropertyName || field.fieldName;
            if (!existingConstraints[node.getMainLabel()]?.includes(property)) {
                missingConstraints.push(`Missing constraint for ${node.name}.${property}`);
            }
        });
    });

    if (missingConstraints.length) {
        throw new Error(missingConstraints.join("\n"));
    }

    debug("Successfully checked for the existence of all necessary constraints");

    const existingIndexes: Record<string, { labelsOrTypes: string; properties: string[] }> = {};
    const indexErrors: string[] = [];
    const indexesCypher = "CALL db.indexes";

    debug(`About to execute Cypher: ${indexesCypher}`);
    const indexesResult = await session.run(indexesCypher);

    indexesResult.records.forEach((record) => {
        const index = record.toObject();

        if (index.type !== "FULLTEXT" || index.entityType !== "NODE") {
            return;
        }

        if (existingIndexes[index.name]) {
            return;
        }

        existingIndexes[index.name] = {
            labelsOrTypes: index.labelsOrTypes,
            properties: index.properties,
        };
    });

    nodes.forEach((node) => {
        if (node.fulltextDirective) {
            node.fulltextDirective.indexes.forEach((index) => {
                const existingIndex = existingIndexes[index.name];
                if (!existingIndex) {
                    indexErrors.push(`Missing @fulltext index '${index.name}' on Node '${node.name}'`);

                    return;
                }

                index.fields.forEach((field) => {
                    const stringField = node.primitiveFields.find((f) => f.fieldName === field);
                    const fieldName = stringField?.dbPropertyName || field;

                    const property = existingIndex.properties.find((p) => p === fieldName);
                    if (!property) {
                        const aliasError = stringField?.dbPropertyName ? ` aliased to field '${fieldName}''` : "";

                        indexErrors.push(
                            `@fulltext index '${index.name}' on Node '${node.name}' is missing field '${field}'${aliasError}`
                        );
                    }
                });
            });
        }
    });

    if (indexErrors.length) {
        throw new Error(indexErrors.join("\n"));
    }

    debug("Successfully checked for the existence of all necessary indexes");
}

async function assertIndexesAndConstraints({
    driver,
    driverConfig,
    nodes,
    options,
}: {
    driver: Driver;
    driverConfig?: DriverConfig;
    nodes: Node[];
    options?: AssertIndexesAndConstraintsOptions;
}) {
    await driver.verifyConnectivity();

    const sessionParams: {
        bookmarks?: string | string[];
        database?: string;
    } = {};

    if (driverConfig) {
        if (driverConfig.database) {
            sessionParams.database = driverConfig.database;
        }

        if (driverConfig.bookmarks) {
            sessionParams.bookmarks = driverConfig.bookmarks;
        }
    }

    const session = driver.session(sessionParams);

    try {
        if (options?.create) {
            await createConstraints({ nodes, session });
        } else {
            await checkConstraints({ nodes, session });
        }
    } finally {
        await session.close();
    }
}

export default assertIndexesAndConstraints;
