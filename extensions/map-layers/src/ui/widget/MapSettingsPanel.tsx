/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
// cSpell:ignore droppable Sublayer Basemap

import * as React from "react";
import { ExpandableBlock, NumericInput, Select, Slider, Toggle } from "@bentley/ui-core";
import { IModelApp, NotifyMessageDetails, OutputMessagePriority, ViewState3d } from "@bentley/imodeljs-frontend";
import { BackgroundMapProps, TerrainHeightOriginMode, TerrainProps } from "@bentley/imodeljs-common";
import { useSourceMapContext } from "./MapLayerManager";
import "./MapSettingsPanel.scss";
import { MapLayersUiItemsProvider } from "../MapLayersUiItemsProvider";

function getHeightOriginModeKey(mode: TerrainHeightOriginMode): string {
  if (TerrainHeightOriginMode.Geodetic === mode)
    return "geodetic";
  if (TerrainHeightOriginMode.Geoid === mode)
    return "geoid";
  return "ground";
}

function getHeightOriginModeFromKey(mode: string): TerrainHeightOriginMode {
  if ("geodetic" === mode)
    return TerrainHeightOriginMode.Geodetic;
  if ("geoid" === mode)
    return TerrainHeightOriginMode.Geoid;
  return TerrainHeightOriginMode.Ground;
}

function displayElevationError(): void {
  IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Error,
    MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.InvalidElevationError"),
    MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.InvalidElevationDetails")));
}

export function MapSettingsPanel() {
  const { activeViewport } = useSourceMapContext();

  const [basemapVisible, setBasemapVisible] = React.useState(() => {
    if (activeViewport) {
      return activeViewport.viewFlags.backgroundMap;
    }
    return false;
  });

  const handleVisibilityChange = React.useCallback(() => {
    if (activeViewport) {
      const newState = !basemapVisible;
      const vf = activeViewport.viewFlags.clone();
      vf.backgroundMap = newState; // Or any other modifications
      activeViewport.viewFlags = vf;
      activeViewport.invalidateRenderPlan();
      setBasemapVisible(newState);
    }
  }, [basemapVisible, activeViewport]);

  const [showSettings, setShowSettings] = React.useState(false);
  const toggleShowSettings = React.useCallback(() => {
    setShowSettings(!showSettings);
  }, [setShowSettings, showSettings]);

  const backgroundMapSettings = (activeViewport!.view as ViewState3d).getDisplayStyle3d().settings.backgroundMap;

  const [transparency, setTransparency] = React.useState(() =>
    typeof backgroundMapSettings.transparency === "boolean"
      ? 0
      : Math.round((backgroundMapSettings.transparency as number) * 100) / 100);

  const terrainSettings = backgroundMapSettings.terrainSettings;
  const [groundBias, setGroundBias] = React.useState(() => backgroundMapSettings.groundBias);

  const terrainHeightOptions = React.useRef({
    geodetic: MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.ElevationTypeGeodetic"),
    geoid: MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.ElevationTypeGeoid"),
    ground: MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.ElevationTypeGround"),
  });

  const updateTerrainSettings = React.useCallback((props: TerrainProps) => {
    activeViewport!.changeBackgroundMapProps({ terrainSettings: props });
    activeViewport!.invalidateRenderPlan();
  }, [activeViewport]);

  const updateBackgroundMap = React.useCallback((props: BackgroundMapProps) => {
    activeViewport!.changeBackgroundMapProps(props);
    activeViewport!.invalidateRenderPlan();
  }, [activeViewport]);

  const [heightOriginMode, setHeightOriginMode] = React.useState(() => getHeightOriginModeKey(terrainSettings.heightOriginMode));
  const handleElevationTypeSelected = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>): void => {
    if (event.target.value) {
      const newHeightOriginMode = getHeightOriginModeFromKey(event.target.value);
      updateTerrainSettings({ heightOriginMode: newHeightOriginMode });
      setHeightOriginMode(event.target.value);
    }
  }, [updateTerrainSettings]);

  const handleElevationChange = React.useCallback((value: number | null) => {
    if (value === null) {
      displayElevationError();
    } else {
      if (value) {
        updateBackgroundMap({ groundBias: value });
        setGroundBias(value);
      }
    }
  }, [updateBackgroundMap]);

  const handleAlphaChange = React.useCallback((values: readonly number[]) => {
    const newTransparency = values[0] / 100;
    activeViewport!.changeBackgroundMapProps({ transparency: newTransparency });
    activeViewport!.invalidateRenderPlan();
    setTransparency(newTransparency);
  }, [activeViewport]);

  const [applyTerrain, setApplyTerrain] = React.useState(() => backgroundMapSettings.applyTerrain);

  const onToggleTerrain = React.useCallback((checked: boolean) => {
    updateBackgroundMap({ applyTerrain: checked });
    setApplyTerrain(checked);
  }, [updateBackgroundMap]);

  const [exaggeration, setExaggeration] = React.useState(() => terrainSettings.exaggeration);

  const handleExaggerationChange = React.useCallback((value: number | null) => {
    if (null !== value) {
      updateTerrainSettings({ exaggeration: value });
      setExaggeration(value);
    }
  }, [updateTerrainSettings]);

  const [terrainOrigin, setTerrainOrigin] = React.useState(() => terrainSettings.heightOrigin);
  const handleHeightOriginChange = React.useCallback((value: number | null) => {
    if (null !== value) {
      updateTerrainSettings({ heightOrigin: value });
      setTerrainOrigin(value);
    }
  }, [updateTerrainSettings]);

  const [useDepthBuffer, setUseDepthBuffer] = React.useState(() => backgroundMapSettings.useDepthBuffer);
  const onToggleUseDepthBuffer = React.useCallback((checked: boolean) => {
    updateBackgroundMap({ useDepthBuffer: checked });
    setUseDepthBuffer(checked);
  }, [updateBackgroundMap]);

  /** Disable commas and letters */
  const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 188 || (event.keyCode >= 65 && event.keyCode <= 90))
      event.preventDefault();
  }, []);

  const [showMapLayersLabel] = React.useState(MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.ShowMapLayers"));
  const [settingsLabel] = React.useState(MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.Settings"));
  const [transparencyLabel] = React.useState(MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.Transparency"));
  const [terrainLabel] = React.useState(MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.Terrain"));
  const [elevationOffsetLabel] = React.useState(MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.ElevationOffset"));
  const [useDepthBufferLabel] = React.useState(MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.UseDepthBuffer"));
  const [modelHeightLabel] = React.useState(MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.ModelHeight"));
  const [heightOriginLabel] = React.useState(MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.HeightOrigin"));
  const [exaggerationLabel] = React.useState(MapLayersUiItemsProvider.i18n.translate("mapLayers:Settings.Exaggeration"));

  return (
    <>
      <div className="map-manager-settings-header">
        <ExpandableBlock title={settingsLabel} className="map-expandable-blocks-block" isExpanded={showSettings} onClick={toggleShowSettings}>
          <div className="map-manager-settings-panel">
            <span className="map-manager-settings-label">{showMapLayersLabel}</span>
            <Toggle onChange={handleVisibilityChange} isOn={basemapVisible} className="map-manager-base-settings-toggle" />

            <span className="map-manager-settings-label">{transparencyLabel}</span>
            <Slider min={0} max={100} showMinMax showTooltip values={[transparency * 100]} onChange={handleAlphaChange} step={1} />

            <span className="map-manager-settings-label">{terrainLabel}</span>
            <Toggle onChange={onToggleTerrain} isOn={applyTerrain} />

            {!applyTerrain && (
              <>
                <span className="map-manager-settings-label">{elevationOffsetLabel}</span>
                <NumericInput strict={false} value={groundBias} onChange={handleElevationChange} onKeyDown={onKeyDown} />

                <span className="map-manager-settings-label">{useDepthBufferLabel}</span>
                <Toggle onChange={onToggleUseDepthBuffer} isOn={useDepthBuffer} />
              </>
            )}
            {applyTerrain && (
              <>
                <span className="map-manager-settings-label">{modelHeightLabel}</span>
                <NumericInput strict={false} value={terrainOrigin} onChange={handleHeightOriginChange} onKeyDown={onKeyDown} />

                <span className="map-manager-settings-label">{heightOriginLabel}</span>
                <Select options={terrainHeightOptions.current} value={heightOriginMode} onChange={handleElevationTypeSelected} />

                <span className="map-manager-settings-label">{exaggerationLabel}</span>
                <NumericInput strict={false} value={exaggeration} onChange={handleExaggerationChange} onKeyDown={onKeyDown} />
              </>
            )}
          </div>
        </ExpandableBlock>
      </div>
    </>
  );
}
