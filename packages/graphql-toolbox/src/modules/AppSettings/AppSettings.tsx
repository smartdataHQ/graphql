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

import { useContext } from "react";
import { Checkbox, Radio } from "@neo4j-ndl/react";
import { Theme, ThemeContext } from "../../contexts/theme";
import { LOCAL_STATE_SHOW_LINT_MARKERS } from "../../constants";
import { Storage } from "../../utils/storage";
import { AppSettingsContext } from "../..//contexts/appsettings";

interface Props {
    onClickClose: () => void;
}

export const AppSettings = ({ onClickClose }: Props) => {
    const theme = useContext(ThemeContext);
    const appSettings = useContext(AppSettingsContext);

    const handleOnChangeEditorTheme = (event: any) => {
        const next = event?.target?.id === Theme.LIGHT.toString() ? Theme.LIGHT : Theme.DARK;
        theme.setTheme(next);
    };

    const onChangeShowLintMarkersCheckbox = (): void => {
        appSettings.setShowLintMarkers(!appSettings.showLintMarkers);
        Storage.store(LOCAL_STATE_SHOW_LINT_MARKERS, Boolean(!appSettings.showLintMarkers).toString());
    };

    return (
        <div className="p-6 w-full">
            <div className="pb-6 flex justify-between items-center">
                <span className="h5">Settings</span>
                <span className="text-lg cursor-pointer" onClick={onClickClose}>
                    {"\u2715"}
                </span>
            </div>
            <div>
                <span className="h6">Editors</span>
                <div className="pt-3">
                    <Radio
                        id={Theme.LIGHT.toString()}
                        className="cursor-pointer"
                        label="Light theme"
                        checked={theme.theme === Theme.LIGHT}
                        onChange={handleOnChangeEditorTheme}
                    />
                    <Radio
                        id={Theme.DARK.toString()}
                        className="cursor-pointer"
                        label="Dark theme"
                        checked={theme.theme === Theme.DARK}
                        onChange={handleOnChangeEditorTheme}
                    />
                    <div className="mt-4">
                        <Checkbox
                            data-test-show-lint-markers-checkbox
                            className="m-0"
                            label="Show lint markers"
                            checked={appSettings.showLintMarkers}
                            onChange={onChangeShowLintMarkersCheckbox}
                        />
                    </div>
                </div>
            </div>
            <div className="absolute bottom-2 right-28 font-bold text-xs flex flex-col">
                <span>Made by Neo4j, Inc</span>
                <span>Copyright &copy; 2002-2022</span>
                <div className="flex">
                    <span>App version:</span>&nbsp;
                    <pre>{process.env.VERSION}</pre>
                </div>
                <div className="flex">
                    <span>Neo4j GraphQL version:</span>&nbsp;
                    <pre>{(process.env.NEO4J_GRAPHQL_VERSION || "").replace(/\^|~/g, "")}</pre>
                </div>
            </div>
        </div>
    );
};
