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

import type { InputValueDefinitionNode, DirectiveNode } from "graphql";
import type { DirectiveArgs, ObjectTypeComposerFieldConfigAsObjectDefinition, Directive } from "graphql-compose";
import getFieldTypeMeta from "./get-field-type-meta";
import parseValueNode from "./parse-value-node";
import type { BaseField, InputField, PrimitiveField, TemporalField } from "../types";
import { numericalResolver } from "./resolvers/field/numerical";
import { idResolver } from "./resolvers/field/id";

export function graphqlArgsToCompose(args: InputValueDefinitionNode[]) {
    return args.reduce((res, arg) => {
        const meta = getFieldTypeMeta(arg.type);

        return {
            ...res,
            [arg.name.value]: {
                type: meta.pretty,
                description: arg.description,
                ...(arg.defaultValue ? { defaultValue: parseValueNode(arg.defaultValue) } : {}),
            },
        };
    }, {});
}

export function graphqlDirectivesToCompose(directives: DirectiveNode[]): Directive[] {
    return directives.map((directive) => ({
        args: (directive.arguments || [])?.reduce(
            (r: DirectiveArgs, d) => ({ ...r, [d.name.value]: parseValueNode(d.value) }),
            {}
        ) as DirectiveArgs,
        name: directive.name.value,
    }));
}

export function objectFieldsToComposeFields(fields: BaseField[]): {
    [k: string]: ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>;
} {
    return fields.reduce((res, field) => {
        if (field.writeonly) {
            return res;
        }

        const newField = {
            type: field.typeMeta.pretty,
            args: {},
            description: field.description,
        } as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>;

        if (field.otherDirectives.length) {
            newField.directives = graphqlDirectivesToCompose(field.otherDirectives);
        }

        if (["Int", "Float"].includes(field.typeMeta.name)) {
            newField.resolve = numericalResolver;
        }

        if (field.typeMeta.name === "ID") {
            newField.resolve = idResolver;
        }

        if (field.arguments) {
            newField.args = graphqlArgsToCompose(field.arguments);
        }

        return { ...res, [field.fieldName]: newField };
    }, {});
}

export function objectFieldsToCreateInputFields(fields: BaseField[]): Record<string, InputField> {
    return fields
        .filter((f) => !(f as PrimitiveField)?.autogenerate && !(f as TemporalField)?.timestamps)
        .reduce((res, f) => {
            const fieldType = f.typeMeta.input.create.pretty;
            const defaultValue = (f as PrimitiveField)?.defaultValue;

            if (defaultValue !== undefined) {
                res[f.fieldName] = {
                    type: fieldType,
                    defaultValue,
                };
            } else {
                res[f.fieldName] = fieldType;
            }

            return res;
        }, {} as Record<string, InputField>);
}

export function objectFieldsToSubscriptionsWhereInputFields(fields: BaseField[]): Record<string, InputField> {
    return fields.reduce((res, f) => {
        const fieldType = f.typeMeta.input.update.pretty;

        res[f.fieldName] = fieldType;

        return res;
    }, {});
}

export function objectFieldsToUpdateInputFields(fields: BaseField[]): Record<string, InputField> {
    return fields.reduce((res, f) => {
        const staticField = f.readonly || (f as PrimitiveField)?.autogenerate;
        if (staticField) {
            return res;
        }

        const fieldType = f.typeMeta.input.update.pretty;

        res[f.fieldName] = fieldType;

        return res;
    }, {});
}
