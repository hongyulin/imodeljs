# Change Log - @bentley/hypermodeling-frontend

This log was last generated on Fri, 14 Aug 2020 16:34:09 GMT and should not be manually modified.

## 2.4.2
Fri, 14 Aug 2020 16:34:09 GMT

*Version update only*

## 2.4.1
Fri, 07 Aug 2020 19:57:43 GMT

### Updates

- Add missing assets to published package

## 2.4.0
Tue, 28 Jul 2020 16:26:24 GMT

### Updates

- HyperModeling.isSupportedForIModel returns false if no section drawing locations exist, as advertised.
- Applications can now customize the visibility of section markers.

## 2.3.3
Thu, 23 Jul 2020 12:57:15 GMT

### Updates

- Add missing assets to published package

## 2.3.2
Tue, 14 Jul 2020 23:50:36 GMT

*Version update only*

## 2.3.1
Mon, 13 Jul 2020 18:50:13 GMT

*Version update only*

## 2.3.0
Fri, 10 Jul 2020 17:23:14 GMT

### Updates

- Clean up API; add customization points.
- Reset active section marker when a new view is applied to the viewport; add HyperModeling.isActive() and HyperModelingDecorator.alignToSpatialView(); HyperModelingDecorator.toggleSection() does not apply the spatial view, only its frustum and clip volume.
- Convert hypermodeling extension into hypermodeling-frontend package.

## 2.2.1
Tue, 07 Jul 2020 14:44:52 GMT

*Version update only*

## 2.2.0
Fri, 19 Jun 2020 14:10:03 GMT

### Updates

- Add toolbar option to navigate to view attachment from section marker.

## 2.1.0
Thu, 28 May 2020 22:48:59 GMT

*Version update only*

## 2.0.0
Wed, 06 May 2020 13:17:49 GMT

### Updates

- New hyper modeling marker images.
- react to changes in imodeljs-clients
- Upgrade to Rush 5.23.2
- #301812 #288370 Fix label font specifications. Added max label width option to Marker.
- Rename the hypermodeling-plugin to hypermodeling-extension
- Update to use UiItemManager
- Update to support new iModel.js Extension build system and drop support for the iModel.js module system.

## 1.14.1
Wed, 22 Apr 2020 19:04:00 GMT

*Version update only*

## 1.14.0
Tue, 31 Mar 2020 15:44:19 GMT

*Version update only*

## 1.13.0
Wed, 04 Mar 2020 16:16:31 GMT

*Version update only*

## 1.12.0
Wed, 12 Feb 2020 17:45:50 GMT

*Version update only*

## 1.11.0
Wed, 22 Jan 2020 19:24:12 GMT

### Updates

- Upgrade to TypeScript 3.7.2.

## 1.10.0
Tue, 07 Jan 2020 19:44:01 GMT

*Version update only*

## 1.9.0
Tue, 10 Dec 2019 18:08:56 GMT

### Updates

- Add iModelJs.buildModule.installTo property to package.json

## 1.8.0
Fri, 22 Nov 2019 14:03:34 GMT

### Updates

- Activating a section callout now displays the drawing view aligned with the spatial model.
- Toolbar button to open section location view attachment now works.
- Change SectionLocationProps.clipGeometry type to string. Add get/set ClipVector methods on SectionLocation.

## 1.7.0
Fri, 01 Nov 2019 13:28:37 GMT

### Updates

- Callout clip is now local to placement. Only show marker for active clip.
- Simplify fitView. Hypermodeling plugin cleanup.
- New wip plugin for hypermodeling support.
- Hypermodeling keyins to filter display by type and to ignore category (because MicroStation does).
- Make hypermodeling toolIds more likely to remain unique by including plugin name.
- Added popup toolbar when cursor stops over marker or marker is tapped.

