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

import React, { Dispatch, useState, SetStateAction, useEffect } from "react";
import { LOCAL_STATE_CONSTRAINT, LOCAL_STATE_SHOW_LINT_MARKERS } from "src/constants";
import { ConstraintState } from "src/types";
import { Storage } from "../utils/storage";

export interface State {
    showLintMarkers: boolean;
    setShowLintMarkers: (v: boolean) => void;
}

export const AppSettingsContext = React.createContext({} as State);

export function AppSettingsProvider(props: React.PropsWithChildren<any>) {
    let value: State | undefined;
    let setValue: Dispatch<SetStateAction<State>>;

    [value, setValue] = useState<State>({
        showLintMarkers: Storage.retrieve(LOCAL_STATE_SHOW_LINT_MARKERS) === "true",
        setShowLintMarkers: (nextState: boolean) => {
            setValue((values) => ({ ...values, showLintMarkers: nextState }));
        },
    });

    useEffect(() => {
        const constraintState = Storage.retrieve(LOCAL_STATE_CONSTRAINT);
        if (!constraintState) {
            Storage.store(LOCAL_STATE_CONSTRAINT, ConstraintState.ignore.toString());
        }
    }, []);

    return <AppSettingsContext.Provider value={value as State}>{props.children}</AppSettingsContext.Provider>;
}
