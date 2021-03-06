/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import * as sinon from "sinon";
import { render } from "@testing-library/react";
import { WidgetMenu } from "../../ui-ninezone";
import { createDOMRect } from "../Utils";

describe("WidgetMenu ", () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it("should render", () => {
    render(
      <WidgetMenu
        open
      >
        <div>A</div>
        <div>B</div>
      </WidgetMenu>,
    );
    const menu = document.getElementsByClassName("nz-widget-menu")[0];
    menu.should.matchSnapshot();
  });

  it("should render to right", () => {
    sandbox.stub(Element.prototype, "getBoundingClientRect").returns({
      ...createDOMRect(),
      left: 49,
    });
    sandbox.stub(document.body, "clientWidth").get(() => 100);
    render(
      <WidgetMenu
        open
      >
        <div>A</div>
        <div>B</div>
      </WidgetMenu>,
    );
    const menu = document.getElementsByClassName("nz-widget-menu")[0];
    menu.should.matchSnapshot();
  });

  it("should render to bottom", () => {
    sandbox.stub(Element.prototype, "getBoundingClientRect").returns({
      ...createDOMRect(),
      top: 49,
    });
    sandbox.stub(document.body, "clientHeight").get(() => 100);
    render(
      <WidgetMenu
        open
      >
        <div>A</div>
        <div>B</div>
      </WidgetMenu>,
    );
    const menu = document.getElementsByClassName("nz-widget-menu")[0];
    menu.should.matchSnapshot();
  });
});
