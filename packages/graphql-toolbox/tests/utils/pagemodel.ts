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

import * as base from "@playwright/test";
import { Editor } from "../pages/Editor";
import { HelpDrawer } from "../pages/HelpDrawer";
import { Login } from "../pages/Login";
import { TopBar } from "../pages/TopBar";
import { SchemaEditor } from "../pages/SchemaEditor";
import { SchemaSettings } from "../pages/SchemaSettings";

type Pages = {
    editorPage: Editor;
    helpDrawerPage: HelpDrawer;
    loginPage: Login;
    schemaEditorPage: SchemaEditor;
    schemaSettingsPage: SchemaSettings;
    topBarPage: TopBar;
};

const pageInitialSetup = async (page: base.Page): Promise<void> => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
};

const test = base.test.extend<Pages>({
    editorPage: async ({ page }, use) => {
        use(new Editor(page));
    },
    helpDrawerPage: async ({ page }, use) => {
        use(new HelpDrawer(page));
    },
    loginPage: async ({ page }, use) => {
        await pageInitialSetup(page);
        const loginPage = await new Login(page);
        await use(loginPage);
        await loginPage.logout();
    },
    schemaEditorPage: async ({ page }, use) => {
        use(new SchemaEditor(page));
    },
    schemaSettingsPage: async ({ page }, use) => {
        use(new SchemaSettings(page));
    },
    topBarPage: async ({ page }, use) => {
        use(new TopBar(page));
    },
});

const { expect } = base;
const { describe, beforeAll, beforeEach, afterAll, afterEach } = base.test;

export { expect, test, describe, beforeAll, beforeEach, afterAll, afterEach };
