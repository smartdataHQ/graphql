import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import neo4j from "./neo4j";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("auth", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
    });

    test("should throw Authenticated if no JWT in req", async () => {
        const session = driver.session();

        const typeDefs = `
            type Product @auth(rules: [{
                isAuthenticated: true,
                operations: ["read"]
            }]) {
                id: ID
                name: String
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const query = `
            {
                Products {
                    id
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });

            const req = new IncomingMessage(socket);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Unauthorized");
        } finally {
            await session.close();
        }
    });

    test("should throw Forbidden if JWT is missing a role", async () => {
        await Promise.all(
            ["create", "read", "delete"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Product @auth(rules: [{
                        roles: ["admin"],
                        operations: ["${type}"]
                    }]) {
                        id: ID
                        name: String
                    }
                `;

                const token = jsonwebtoken.sign({ roles: ["not admin"] }, process.env.JWT_SECRET);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                let query: string | undefined;

                if (type === "create") {
                    query = `
                        mutation {
                            createProducts(input: [{id: 123, name: "pringles"}]) {
                                id
                            }
                        }
                    `;
                }

                if (type === "delete") {
                    query = `
                        mutation {
                            deleteProducts {
                                nodesDeleted
                            }
                        }
                    `;
                }

                if (type === "read") {
                    query = `
                        {
                            Products {
                                id
                            }
                        }
                    `;
                }

                try {
                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
                } finally {
                    await session.close();
                }
            })
        );
    });

    test("should throw Forbidden invalid equality on JWT property vs node property using allow", async () => {
        await Promise.all(
            ["read", "delete"].map(async (type) => {
                const session = driver.session();

                const typeDefs = `
                    type Product @auth(rules: [{
                        operations: ["${type}"],
                        allow: { id: "sub" }
                    }]) {
                        id: ID
                        name: String
                    }
                `;

                const token = jsonwebtoken.sign({ sub: "invalid" }, process.env.JWT_SECRET);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                let query: string | undefined;

                if (type === "delete") {
                    query = `
                        mutation {
                            deleteProducts {
                                nodesDeleted
                            }
                        }
                    `;
                }

                if (type === "read") {
                    query = `
                        {
                            Products {
                                id
                            }
                        }
                    `;
                }

                try {
                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
                } finally {
                    await session.close();
                }
            })
        );
    });

    test("should allow equality on JWT property vs node property using allow", async () => {
        await Promise.all(
            ["read", "delete"].map(async (type) => {
                const session = driver.session();

                const id = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type Product @auth(rules: [{
                        operations: ["${type}"],
                        allow: { id: "sub" }
                    }]) {
                        id: ID
                        name: String
                    }
                `;

                const token = jsonwebtoken.sign({ sub: id }, process.env.JWT_SECRET);

                const neoSchema = makeAugmentedSchema({ typeDefs });

                let query: string | undefined;

                if (type === "delete") {
                    query = `
                        mutation {
                            deleteProducts(where: {id: "${id}"}) {
                                nodesDeleted
                            }
                        }
                    `;
                }

                if (type === "read") {
                    query = `
                        {
                            Products(where: {id: "${id}"}) {
                                id
                            }
                        }
                    `;
                }

                try {
                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query as string,
                        contextValue: { driver, req },
                    });

                    expect(gqlResult.errors).toEqual(undefined);

                    if (type === "delete") {
                        expect((gqlResult.data as any).deleteProducts).toEqual({ nodesDeleted: 0 });
                    }

                    if (type === "read") {
                        expect((gqlResult.data as any).Products).toEqual([]);
                    }
                } finally {
                    await session.close();
                }
            })
        );
    });

    test("should throw Forbidden when using roles and nested mutations", async () => {
        const session = driver.session();

        const typeDefs = `
            type Product @auth(rules: [{
                roles: ["admin"],
                operations: ["create"]
            }]) {
                id: ID
                name: String
                colors: [Color] @relationship(type: "OF_COLOR", direction: "OUT")
            }

            type Color @auth(rules: [{
                roles: ["admin"],
                operations: ["read"]
            }]) {
                name: String
            }
        `;

        const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET);

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const query = `
            mutation {
                createProducts(input:[{
                    name: "Pringles", 
                    colors: {
                        create: [{ name: "Red" }]
                    }
                }]){
                    id
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query as string,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should allow users with correct role to nest mutations", async () => {
        const session = driver.session();

        const typeDefs = `
            type Product @auth(rules: [{
                roles: ["admin"],
                operations: ["create"]
            }]) {
                id: ID
                name: String
                colors: [Color] @relationship(type: "OF_COLOR", direction: "OUT")
            }

            type Color @auth(rules: [{
                roles: ["admin"],
                operations: ["create"]
            }]) {
                name: String
            }
        `;

        const token = jsonwebtoken.sign({ roles: ["admin"] }, process.env.JWT_SECRET);

        const neoSchema = makeAugmentedSchema({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                createProducts(input:[{
                    id: "${id}", 
                    colors: {
                        create: [{ name: "Red" }]
                    }
                }]){
                    id
                }
            }
        `;

        try {
            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query as string,
                contextValue: { driver, req },
            });

            expect(gqlResult.errors).toEqual(undefined);

            expect((gqlResult.data as any).createProducts[0].id).toEqual(id);
        } finally {
            await session.close();
        }
    });
});
