/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { I18N } from "@bentley/imodeljs-i18n";
import { UiCore } from "../ui-core/UiCore";

// tslint:disable: completed-docs

export class TestUtils {
  private static _i18n?: I18N;
  private static _uiCoreInitialized = false;

  public static get i18n(): I18N {
    if (!TestUtils._i18n) {
      // const port = process.debugPort;
      // const i18nOptions = { urlTemplate: "http://localhost:" + port + "/locales/{{lng}}/{{ns}}.json" };
      TestUtils._i18n = new I18N();
    }
    return TestUtils._i18n;
  }

  public static async initializeUiCore() {
    if (!TestUtils._uiCoreInitialized) {
      // This is required by our I18n module (specifically the i18next package).
      (global as any).XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest; // tslint:disable-line:no-var-requires

      await UiCore.initialize(TestUtils.i18n);
      TestUtils._uiCoreInitialized = true;
    }
  }

  public static terminateUiCore() {
    UiCore.terminate();
    TestUtils._uiCoreInitialized = false;
  }

  public static createBubbledEvent(type: string, props = {}) {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, props);
    return event;
  }

  /** Waits until all async operations finish */
  public static async flushAsyncOperations() {
    return new Promise((resolve) => setTimeout(resolve));
  }

  /** Sleeps a specified number of milliseconds */
  public static sleep(milliseconds: number) {
    const start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds) {
        break;
      }
    }
  }

  /** Sleeps a specified number of milliseconds then flushes async operations */
  public static async tick(milliseconds: number) {
    TestUtils.sleep(milliseconds);
    await TestUtils.flushAsyncOperations();
  }
}

export const storageMock = () => {
  const storage: { [key: string]: any } = {};
  return {
    setItem: (key: string, value: string) => {
      storage[key] = value || "";
    },
    getItem: (key: string) => {
      return key in storage ? storage[key] : null;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (i: number) => {
      const keys = Object.keys(storage);
      return keys[i] || null;
    },
  };
};

export default TestUtils;   // tslint:disable-line: no-default-export
