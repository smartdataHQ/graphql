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

import { request } from "graphql-request";
import type * as neo4j from "neo4j-driver";
import { Storage } from "../utils/storage";
import type { LoginPayload, Neo4jDatabase } from "../types";
import {
    CONNECT_URL_PARAM_NAME,
    DATABASE_PARAM_NAME,
    DEFAULT_DATABASE_NAME,
    LOCAL_STATE_SELECTED_DATABASE_NAME,
} from "../constants";

const GET_DATABASES_QUERY = `
    query {
        workspace {
            projects {
            name
                graphs {
                    name
                    status
                    connection {
                        info {
                            version
                            edition
                        }
                        principals {
                            protocols {
                                bolt {
                                    tlsLevel
                                    url
                                    username
                                    password
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

const isMultiDbUnsupportedError = (e: Error) => {
    if (
        e.message.includes("This is an administration command and it should be executed against the system database") ||
        e.message.includes("Neo4jError: Unsupported administration command") ||
        e.message.includes("Neo4jError: Unable to route write operation to leader for database 'system'") ||
        e.message.includes("Invalid input 'H': expected 't/T' or 'e/E'") // Neo4j 3.5 or older
    ) {
        return true;
    }
    return false;
};

export const resolveNeo4jDesktopLoginPayload = async (): Promise<LoginPayload | null> => {
    const url = new URL(window.location.href);
    const apiEndpoint = url.searchParams.get("neo4jDesktopApiUrl");
    const clientId = url.searchParams.get("neo4jDesktopGraphAppClientId");

    if (!apiEndpoint && !clientId) {
        return null;
    }
    try {
        const data = await request({
            url: apiEndpoint || "",
            document: GET_DATABASES_QUERY,
            requestHeaders: {
                clientId: clientId || "",
            },
        });
        if (!data) {
            return null;
        }

        const graphsData = data?.workspace?.projects
            .map((project) => ({
                graphs: project.graphs.filter((graph) => graph.status === "ACTIVE"),
            }))
            .reduce((acc, { graphs }) => acc.concat(graphs), []);

        if (!graphsData.length) {
            return null;
        }

        const { url: boltUrl, username, password } = graphsData[0].connection.principals.protocols.bolt;

        // INFO: to get the current database name and all available databases use cypher "SHOW databases"

        return {
            url: boltUrl,
            username,
            password,
        };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log("Error while fetching and processing Neo4jDesktop GraphQL API, e: ", error);
        return null;
    }
};

export const getDatabases = async (driver: neo4j.Driver): Promise<Neo4jDatabase[] | undefined> => {
    const session = driver.session();

    try {
        const result = await session.run("SHOW DATABASES");
        if (!result || !result.records) return undefined;

        const cleanedDatabases: Neo4jDatabase[] = result.records
            .map((rec) => rec.toObject())
            .filter(
                (rec) =>
                    rec.access === "read-write" &&
                    rec.currentStatus === "online" &&
                    (rec.name || "").toLowerCase() !== "system"
            ) as Neo4jDatabase[];

        await session.close();
        return cleanedDatabases;
    } catch (error) {
        await session.close();
        if (error instanceof Error && !isMultiDbUnsupportedError(error)) {
            // Only log error if it's not a multi-db unsupported error.
            // eslint-disable-next-line no-console
            console.error("Error while fetching databases information, e: ", error);
        }
        return undefined;
    }
};

export const getUrlSearchParam = (paramName: string): string | null => {
    const queryString = window.location.search;
    if (!queryString) return null;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(paramName);
};

export const getConnectUrlSearchParamValue = (): {
    url: string;
    username: string | null;
    protocol: string;
} | null => {
    const dbmsParam = getUrlSearchParam(CONNECT_URL_PARAM_NAME as string);
    if (!dbmsParam) return null;

    const [protocol, host] = dbmsParam.split(/:\/\//);
    if (!protocol || !host) return null;

    const [username, href] = host.split(/@/);
    if (!username || !href) {
        return { protocol, username: null, url: `${protocol}://${host}` };
    }
    return { protocol, username, url: `${protocol}://${href}` };
};

export const resolveSelectedDatabaseName = (databases: Neo4jDatabase[]): string => {
    let usedDatabaseName: string | null = null;

    const searchParam = getUrlSearchParam(DATABASE_PARAM_NAME as string);
    if (searchParam) {
        Storage.store(LOCAL_STATE_SELECTED_DATABASE_NAME, searchParam);
        usedDatabaseName = searchParam;
    } else {
        usedDatabaseName = Storage.retrieve(LOCAL_STATE_SELECTED_DATABASE_NAME);
    }

    const isSelectedDatabaseAvailable = databases?.find((database) => database.name === usedDatabaseName);
    if (isSelectedDatabaseAvailable && usedDatabaseName) {
        return usedDatabaseName;
    }

    const defaultDatabase = databases?.find((database) => database.default) || undefined;
    return defaultDatabase?.name || DEFAULT_DATABASE_NAME;
};
