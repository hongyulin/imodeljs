/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

// import { Point3d, Vector3d } from "../PointVector";
// import { Range1d } from "../Range";
// import { Matrix3d, Transform } from "../geometry3d/Transform";

import { expect } from "chai";
import { StrokeOptions } from "../../curve/StrokeOptions";
import { TransitionSpiral3d } from "../../curve/spiral/TransitionSpiral3d";
import { IntegratedSpiral3d } from "../../curve/spiral/IntegratedSpiral3d";
import { TransitionConditionalProperties } from "../../curve/spiral/TransitionConditionalProperties";
import { Geometry } from "../../Geometry";
import { Angle } from "../../geometry3d/Angle";
import { AngleSweep } from "../../geometry3d/AngleSweep";
import { Matrix3d } from "../../geometry3d/Matrix3d";
import { Point3d, Vector3d } from "../../geometry3d/Point3dVector3d";
import { Segment1d } from "../../geometry3d/Segment1d";
import { Transform } from "../../geometry3d/Transform";
import { Checker } from "../Checker";
import { ClothoidSeriesRLEvaluator, CzechSpiralEvaluator, DirectHalfCosineSpiralEvaluator } from "../../curve/spiral/ClothoidSeries";
import { DirectSpiral3d } from "../../curve/spiral/DirectSpiral3d";
import { NormalizedBiQuadraticTransition, NormalizedBlossTransition, NormalizedClothoidTransition, NormalizedCosineTransition, NormalizedSineTransition } from "../../curve/NormalizedTransition";
import { LineString3d } from "../../curve/LineString3d";
import { GeometryCoreTestIO } from "../GeometryCoreTestIO";
import { GeometryQuery } from "../../curve/GeometryQuery";
import { Sample } from "../../serialization/GeometrySamples";
import { LineSegment3d } from "../../curve/LineSegment3d";
import { CurveFactory } from "../../curve/CurveFactory";

/* tslint:disable:no-console */
describe("TransitionSpiral3d", () => {
  it("HelloWorldConditionalProperties", () => {
    const ck = new Checker();
    const b0 = Angle.createDegrees(10);
    const b1 = Angle.createDegrees(25);
    const r0 = 0.0;
    const r1 = 1000.0;
    const dataA = new TransitionConditionalProperties(r0, r1, b0.clone(), b1.clone(), undefined);
    ck.testTrue(dataA.tryResolveAnySingleUnknown(), "resolve length");
    ck.testTrue(dataA.curveLength !== undefined);
    const lengthA = dataA.curveLength as number;
    const dataB = new TransitionConditionalProperties(undefined, r1, b0.clone(), b1.clone(), lengthA);
    const dataC = new TransitionConditionalProperties(r0, undefined, b0.clone(), b1.clone(), lengthA);
    const dataD = new TransitionConditionalProperties(r0, r1, undefined, b1.clone(), lengthA);
    const dataE = new TransitionConditionalProperties(r0, r1, b0.clone(), undefined, lengthA);

    ck.testFalse(dataA.isAlmostEqual(dataB), "A B");
    ck.testFalse(dataA.isAlmostEqual(dataC), "A C");
    ck.testFalse(dataA.isAlmostEqual(dataD), "A D");
    ck.testFalse(dataA.isAlmostEqual(dataE), "A E");
    ck.testFalse(dataD.isAlmostEqual(dataE), "D E");

    ck.testTrue(dataB.tryResolveAnySingleUnknown(), "resolve r0");
    ck.testTrue(dataC.tryResolveAnySingleUnknown(), "resolve r1");
    ck.testTrue(dataD.tryResolveAnySingleUnknown(), "resolve bearing0");
    ck.testTrue(dataE.tryResolveAnySingleUnknown(), "resolve bearing1");

    ck.testTrue(dataA.isAlmostEqual(dataB), "dataB");
    ck.testTrue(dataA.isAlmostEqual(dataC), "dataC");
    ck.testTrue(dataA.isAlmostEqual(dataD), "dataD");
    ck.testTrue(dataA.isAlmostEqual(dataE), "dataE");

  });
  it("CreateAndPokeTransitionProperties", () => {
    const ck = new Checker();
    const spiralA = IntegratedSpiral3d.createRadiusRadiusBearingBearing(Segment1d.create(0, 1000), AngleSweep.createStartEndDegrees(0, 8), Segment1d.create(0, 1), Transform.createIdentity());
    const spiralB = IntegratedSpiral3d.createRadiusRadiusBearingBearing(Segment1d.create(1000, 0), AngleSweep.createStartEndDegrees(10, 3), Segment1d.create(0, 1), Transform.createIdentity());
    if (ck.testType<IntegratedSpiral3d>(spiralA) && ck.testType<IntegratedSpiral3d>(spiralB)) {
      ck.testFalse(spiralB.isAlmostEqual(spiralA));
      ck.testFalse(spiralA.isAlmostEqual(undefined));
      spiralB.setFrom(spiralA);
      ck.testTrue(spiralA.isAlmostEqual(spiralB));
      if (Checker.noisy.spirals)
        console.log(TransitionSpiral3d.radiusRadiusLengthToSweepRadians(0, 10, 50));
    }
    const spiralD = IntegratedSpiral3d.createFrom4OutOf5("badTypeName", 0, 300.0, Angle.createDegrees(0), undefined, 100.0, undefined, Transform.createIdentity())!;
    ck.testUndefined(spiralD);
    // default to clothoid ...
    const spiralD1 = IntegratedSpiral3d.createFrom4OutOf5("clothoid", 0, 300.0, Angle.createDegrees(0), undefined, 100.0, undefined, Transform.createIdentity())!;
    ck.testType<TransitionSpiral3d>(spiralD1);

    const spiralD2 = IntegratedSpiral3d.createFrom4OutOf5("clothoid", 0, undefined, Angle.createDegrees(0), undefined, 100.0, undefined, Transform.createIdentity())!;
    ck.testUndefined(spiralD2);

    expect(ck.getNumErrors()).equals(0);
  });

  it("CreateAndTransform", () => {
    const ck = new Checker();
    // spiral transform is not as easy as you expect -- regenerated data has been wrong at times.
    const spiralA = IntegratedSpiral3d.createRadiusRadiusBearingBearing(Segment1d.create(0, 1000), AngleSweep.createStartEndDegrees(0, 8), Segment1d.create(0, 1), Transform.createIdentity())!;
    for (const transform of [
      Transform.createTranslationXYZ(2, 3, 1),
      Transform.createFixedPointAndMatrix(Point3d.create(3, 2, 5), Matrix3d.createRotationAroundAxisIndex(2, Angle.createDegrees(10))),
      Transform.createFixedPointAndMatrix(Point3d.create(3, 2, 5), Matrix3d.createUniformScale(2.0))]) {
      const spiralB = spiralA.cloneTransformed(transform);
      ck.testTransformedPoint3d(transform, spiralA.startPoint(), spiralB.startPoint(), "spiral.startPoint ()");
      ck.testTransformedPoint3d(transform, spiralA.endPoint(), spiralB.endPoint(), "spiral.endPoint ()");
      for (const f of [0.25, 0.35, 0.98])
        ck.testTransformedPoint3d(transform, spiralA.fractionToPoint(f), spiralB.fractionToPoint(f), "spiral.fractionToPoint ()");
    }

    const options = StrokeOptions.createForCurves();
    options.maxEdgeLength = 3.0;
    const numStroke = spiralA.computeStrokeCountForOptions(options);
    ck.testBetween((numStroke - 1) * options.maxEdgeLength, spiralA.quickLength(), (numStroke + 1) * options.maxEdgeLength);

    expect(ck.getNumErrors()).equals(0);
  });
  it("PartialSpiralPoints", () => {
    const ck = new Checker();
    const spiralA = IntegratedSpiral3d.createRadiusRadiusBearingBearing(Segment1d.create(0, 1000), AngleSweep.createStartEndDegrees(0, 8), Segment1d.create(0, 1), Transform.createIdentity())!;
    const f0 = 0.3;
    const f1 = 0.9;
    const spiralB = IntegratedSpiral3d.createRadiusRadiusBearingBearing(Segment1d.create(0, 1000), AngleSweep.createStartEndDegrees(0, 8), Segment1d.create(f0, f1), Transform.createIdentity())!;
    for (const f of [0.25, 0.35, 0.98]) {
      const pointA = spiralA.fractionToPoint(Geometry.interpolate(f0, f, f1));
      const pointB = spiralB.fractionToPoint(f);
      ck.testPoint3d(pointA, pointB, "spiral.fractionToPoint () in partial spiral at partial fraction" + f);
    }

    const bearingA = spiralA.fractionToBearingRadians(f0);
    const bearingB = spiralB.fractionToBearingRadians(0.0);
    ck.testCoordinate(bearingA, bearingB, "spiral bearing at fraction " + [f0, 0.0]);
    const curvatureA = spiralA.fractionToCurvature(f0);
    const curvatureB = spiralB.fractionToCurvature(0.0);
    ck.testCoordinate(curvatureA, curvatureB, "spiral curvature at fraction " + [f0, 0.0]);

    expect(ck.getNumErrors()).equals(0);
  });
  it("PartialSpiralDerivatives", () => {
    const ck = new Checker();
    const spiralA = IntegratedSpiral3d.createRadiusRadiusBearingBearing(Segment1d.create(0, 1000), AngleSweep.createStartEndDegrees(0, 8), Segment1d.create(0, 1), Transform.createIdentity())!;
    const f0 = 0.3;
    const f1 = 0.9;
    const delta = f1 - f0;
    const spiralB = IntegratedSpiral3d.createRadiusRadiusBearingBearing(Segment1d.create(0, 1000), AngleSweep.createStartEndDegrees(0, 8), Segment1d.create(f0, f1), Transform.createIdentity())!;
    for (const f of [0.25, 0.35, 0.98]) {
      const tangentA = spiralA.fractionToPointAndDerivative(Geometry.interpolate(f0, f, f1));
      const tangentB = spiralB.fractionToPointAndDerivative(f);
      ck.testPoint3d(tangentA.origin, tangentB.origin, "spiral.fractionToPoint () in partial spiral at partial fraction" + f);
      ck.testVector3d(tangentA.direction.scale(delta), tangentB.direction, "spiral.fractionToPointAndDerivatives in partial spiral at partial fraction");

      const planeA = spiralA.fractionToPointAnd2Derivatives(Geometry.interpolate(f0, f, f1))!;
      const planeB = spiralB.fractionToPointAnd2Derivatives(f)!;
      ck.testPoint3d(planeA.origin, planeB.origin, "spiral.fractionToPoint () in partial spiral at partial fraction" + f);
      ck.testVector3d(planeA.vectorU.scale(delta), planeB.vectorU, "spiral.fractionToPointAnd2Derivatives in partial spiral at partial fraction");
      ck.testVector3d(planeA.vectorV.scale(delta * delta), planeB.vectorV, "spiral.fractionToPointAnd2Derivatives in partial spiral at partial fraction");
    }
    expect(ck.getNumErrors()).equals(0);
  });

  it("ClothoidTermInversion", () => {
    const ck = new Checker();
    const distance1 = 100;
    for (const radius1 of [200, -200, 400, 1000]) {
      for (const numTerm of [1, 2, 3]) {
        const spiral3 = DirectSpiral3d.createTruncatedClothoid("ClothoidSeries" + numTerm,
          Transform.createIdentity(), 3, 3, undefined, distance1, radius1, undefined)!;
        for (const fraction0 of [0.0, 0.1, 0.5, 0.8, 0.941234763476189]) {
          const targetX = spiral3.evaluator.fractionToX(fraction0);
          const fraction1 = spiral3.evaluator.xToFraction(targetX);
          if (ck.testIsFinite(fraction1, "Expect newton inversion")) {
            ck.testCoordinate(fraction0, fraction1, "newton distance inversion");
          }
        }
      }
    }
    expect(ck.getNumErrors()).equals(0);
  });

  it("ClothoidTerms", () => {
    const ck = new Checker();
    const allGeometry: GeometryQuery[] = [];
    let x0 = 0;
    const distance1 = 100;
    for (const radius1 of [200, 400, 1000]) {
      const series = [];
      const linestrings = [];
      const fractions = [];
      const distances = [];
      if (Checker.noisy.spirals)
        console.log();
      if (Checker.noisy.spirals)
        console.log(" R/L = " + radius1 / distance1);
      let y0 = 0;
      const spiral = IntegratedSpiral3d.createFrom4OutOf5("clothoid", 0, radius1, Angle.createDegrees(0), undefined, distance1, undefined, Transform.createIdentity())!;
      const linestring0 = LineString3d.create();
      for (const d of [0, 10, 20, 30, 40, 50, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 80, 90, 100]) {
        distances.push(d);
        const f = d / distance1;
        fractions.push(f);
        linestring0.packedPoints.push(spiral.fractionToPoint(f));
      }

      GeometryCoreTestIO.captureCloneGeometry(allGeometry, spiral, x0, y0 += 1);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, linestring0, x0, y0 += 1);
      const div2RL = 1.0 / (2.0 * radius1 * distance1);
      const y1 = 50.0;
      for (const numTerm of [1, 2, 3, 4, 5, 6, 8]) {
        const seriesEvaluator = new ClothoidSeriesRLEvaluator(distance1, div2RL, numTerm, numTerm);
        if (Checker.noisy.spirals)
          console.log(" numTerm " + numTerm);
        series.push(seriesEvaluator);
        const ls = LineString3d.create();
        for (const d of distances) {
          const f = d / distance1;
          ls.packedPoints.pushXYZ(seriesEvaluator.fractionToX(f), seriesEvaluator.fractionToY(f), 0);
          if (d > 90) {
            const ux = seriesEvaluator.fractionToDX(f);
            const uy = seriesEvaluator.fractionToDY(f);
            const vx = seriesEvaluator.fractionToDDX(f);
            const vy = seriesEvaluator.fractionToDDY(f);
            const curvature = Geometry.curvatureMagnitude(ux, uy, 0, vx, vy, 0);
            if (Checker.noisy.spirals)
              console.log(" f " + f, xyString("D,R", d, Geometry.safeDivideFraction(1, curvature, 0)) + xyString("DU", ux, uy) + xyString("DV", vx, vy));
            const beta = d * d / (2.0 * radius1 * distance1);
            const wx = Math.cos(beta);
            const wy = Math.sin(beta);
            if (Checker.noisy.spirals)
              console.log("    true unit " + wx + " , " + wy + "   e(" + (ux - wx) + "," + (uy - wy) + ")");
          }
        }
        linestrings.push(ls);
        GeometryCoreTestIO.captureCloneGeometry(allGeometry, ls, x0, y0 += 1);
        const extendedLineString = LineString3d.create();
        // Extended evaluation ..
        GeometryCoreTestIO.captureCloneGeometry(allGeometry, linestring0, x0, y1);
        for (let d = distance1; d < 4 * distance1; d += distance1 / 10) {
          const f = d / distance1;
          extendedLineString.packedPoints.pushXYZ(seriesEvaluator.fractionToX(f), seriesEvaluator.fractionToY(f), 0);
        }
        GeometryCoreTestIO.captureCloneGeometry(allGeometry, extendedLineString, x0, y1);
      }
      // We expect each series form to get closer to the real thing at each evaluation.
      for (let i = 0; i < distances.length; i++) {
        const d = distances[i];
        const integratedPoint = linestring0.packedPoints.getPoint3dAtUncheckedPointIndex(i);
        let error0 = 1.0;
        if (Checker.noisy.spirals)
          console.log("d = " + d);
        for (let j = 0; j < linestrings.length; j++) {
          const pointJ = linestrings[j].packedPoints.getPoint3dAtUncheckedPointIndex(i);
          const errorJ = pointJ.distance(integratedPoint);
          const xReference = Geometry.maxXY(1, integratedPoint.x);
          if (Checker.noisy.spirals)
            console.log("     E = " + errorJ + "   e = " + errorJ / xReference);
          ck.testLE(errorJ, error0 + 1.0e-15 * xReference, j, d, errorJ - error0);
          error0 = errorJ;
        }
      }
      x0 += 200;
    }
    GeometryCoreTestIO.saveGeometry(allGeometry, "TransitionSpiral3d", "ClothoidTerms");
    expect(ck.getNumErrors()).equals(0);
  });
  it("NamedApproximations", () => {
    const ck = new Checker();
    const allGeometry: GeometryQuery[] = [];
    const nominalL1 = 100;
    const nominalR1 = 400;
    const x0 = 0;
    let y0 = 0;
    const simpleCubic = DirectSpiral3d.createJapaneseCubic(Transform.createIdentity(), nominalL1, nominalR1)!;
    const aremaSpiral = DirectSpiral3d.createArema(Transform.createIdentity(), nominalL1, nominalR1)!;
    const directHalfCosine = DirectSpiral3d.createDirectHalfCosine(Transform.createIdentity(), nominalL1, nominalR1)!;
    const spiral3 = DirectSpiral3d.createTruncatedClothoid("ClothoidSeriesX3Y3",
      Transform.createIdentity(), 3, 3, undefined, nominalL1, nominalR1, undefined)!;
    const westernAustralianSpiral = DirectSpiral3d.createTruncatedClothoid("WesternAustralian",
      Transform.createIdentity(), 2, 1, undefined, nominalL1, nominalR1, undefined)!;
    const spiral4 = DirectSpiral3d.createTruncatedClothoid("ClothoidSeriesX3Y3",
      Transform.createIdentity(), 4, 4, undefined, nominalL1, nominalR1, undefined)!;
    const y4 = spiral4.evaluator.fractionToY(1.0);
    const czechSpiral = DirectSpiral3d.createCzechCubic(Transform.createIdentity(), nominalL1, nominalR1)!;
    console.log("Czech gamma factor " + CzechSpiralEvaluator.gammaConstant(nominalL1, nominalR1));
    for (const spiral of [simpleCubic, czechSpiral, directHalfCosine, westernAustralianSpiral, aremaSpiral, spiral3, spiral4]) {
      const strokes = spiral.activeStrokes!;
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, strokes, x0, y0);
      console.log("  " + spiral.spiralType + "Y1  / Y4 " + spiral.evaluator.fractionToY(1) / y4);
      /* 07/16 THIS TEST FAILS -- need better implementation of curveLengthBetweenFractions.
      if (strokes?.packedUVParams) {
        console.log("d,D", strokes.packedUVParams);
        const splitFraction = 3 / 7;
        const lengthA = spiral.curveLengthBetweenFractions(0.0, splitFraction);
        const lengthB = spiral.curveLengthBetweenFractions(splitFraction, 1.0);
        ck.testCoordinate(lengthA + lengthB, strokes.packedUVParams.back()!.y, splitFraction, lengthA, lengthB);
      }
      */
      y0 += 1;
    }
    const directHalfCosine2L = DirectSpiral3d.createDirectHalfCosine(Transform.createIdentity(), 2 * nominalL1, nominalR1)!;
    const directHalfCosine2R = DirectSpiral3d.createDirectHalfCosine(Transform.createIdentity(), nominalL1, 2 * nominalR1)!;
    ck.testFalse(directHalfCosine.isAlmostEqual(directHalfCosine2L));
    ck.testFalse(directHalfCosine.isAlmostEqual(directHalfCosine2R));
    ck.testTrue(directHalfCosine.isAlmostEqual(directHalfCosine));
    ck.testFalse(directHalfCosine.isAlmostEqual(undefined));

    expect(ck.getNumErrors()).equals(0);
    GeometryCoreTestIO.saveGeometry(allGeometry, "TransitionSpiral3d", "NamedApproximations");
  });
  it("SnapFunctions", () => {
    const ck = new Checker();
    const allGeometry: GeometryQuery[] = [];
    let x0 = 0;
    const unitBox = Sample.createRectangle(0, 0, 1, 1, 0, true);
    const outerLines = [LineSegment3d.createXYXY(-1, 0, 0, 0), LineSegment3d.createXYXY(1, 1, 2, 1)];
    const yDF = 0;
    const yF = 4;
    const yIF = 8;
    const snapFunctions = [
      new NormalizedClothoidTransition(),
      new NormalizedBiQuadraticTransition(),
      new NormalizedBlossTransition(),
      new NormalizedCosineTransition(),
      new NormalizedSineTransition()];
    for (const snap of snapFunctions) {
      if (Checker.noisy.spirals)
        console.log(" Snap Function ", snap);
      const lsF = LineString3d.create();
      const lsDF = LineString3d.create();
      const lsIF = LineString3d.create();
      ck.testCoordinate(0.5, snap.fractionToArea(1.0));
      const e0 = 1.0e-12;
      // verify approach at 0.5
      ck.testCoordinate(snap.fractionToCurvatureFraction(0.5 - e0), snap.fractionToCurvatureFraction(0.5 + e0), "continuous at 0.5");
      ck.testCoordinate(0.5, snap.fractionToArea(1.0));
      const df = 1.0 / 31.0;
      const derivativeTolerance = 1.0e-5;
      const e = 1.0e-3;
      let maxDerivativeError = 0;
      let trueDerivative;
      for (let f = 0.0; f <= 1.0; f += df) {
        lsF.packedPoints.pushXYZ(f, snap.fractionToCurvatureFraction(f), 0);
        lsDF.packedPoints.pushXYZ(f, (trueDerivative = snap.fractionToCurvatureFractionDerivative(f)), 0);
        lsIF.packedPoints.pushXYZ(f, snap.fractionToArea(f), 0);
        // if cleanly inside the interval and NOT bracketing 0.5, do a central-difference derivative check ...
        if (f - e >= 0 && f + e <= 1.0 && (f + e - 0.5) * (f - e - 0.5) > 0) {
          const approximateDerivative = (snap.fractionToCurvatureFraction(f + e) - snap.fractionToCurvatureFraction(f - e)) / (2 * e);
          const derivativeError = Math.abs(approximateDerivative - trueDerivative);
          maxDerivativeError = Math.max(derivativeError, maxDerivativeError);
          ck.testLE(Math.abs(approximateDerivative - trueDerivative), derivativeTolerance, "approximate derivative");
        }
        // verify symmetry ...
        ck.testCoordinate(snap.fractionToCurvatureFraction(f), 1 - snap.fractionToCurvatureFraction(1 - f));
      }
      if (Checker.noisy.spirals)
        console.log("    maxDerivativeError " + maxDerivativeError);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsF, x0, yF);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsDF, x0, yDF);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsIF, x0, yIF);

      // GeometryCoreTestIO.captureCloneGeometry(allGeometry, unitBox, x0, yF);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, outerLines, x0, yF);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, unitBox, x0, yDF);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, unitBox, x0, yIF);
      x0 += 5.0;
    }
    GeometryCoreTestIO.saveGeometry(allGeometry, "TransitionSpiral3d", "SnapFunctions");
    expect(ck.getNumErrors()).equals(0);
  });
  it("ClothoidSeriesCoverage", () => {
    const ck = new Checker();
    const length1 = 100;
    const radius1 = 300;
    const c = 1.0 / (2.0 * length1 * radius1);
    // spiralA and friends are low order ...
    const spiralA = DirectSpiral3d.createTruncatedClothoid("test", Transform.createIdentity(), 0, 0, undefined, 100, 300, undefined);
    if (ck.testType<DirectSpiral3d>(spiralA) && spiralA.evaluator instanceof ClothoidSeriesRLEvaluator) {
      ck.testExactNumber(1, spiralA.evaluator.numXTerms);
      ck.testExactNumber(1, spiralA.evaluator.numYTerms);
      const spiralB = spiralA.cloneTransformed(Transform.createTranslationXYZ(1, 2, 3));
      if (ck.testType<DirectSpiral3d>(spiralA)) {
        // We know the (1,1) approximation is just (s, s^3 / 6RL)
        for (const fraction of [0, 0.24, 0.9]) {
          const x = fraction * length1;
          const y = x * x * x / (6.0 * length1 * radius1);
          const point = spiralA.evaluator.fractionToPoint(fraction);
          ck.testCoordinate(x, point.x);
          ck.testCoordinate(y, point.y);
        }
        const spiralC = spiralB.clone();
        ck.testTrue(spiralB.isAlmostEqual(spiralC));
        ck.testFalse(spiralA.isAlmostEqual(spiralB));
        ck.testString(spiralA.spiralType, spiralB.spiralType);
      }
    }
    // seriesQ is high order -- expect perfect properties
    const seriesQ = new ClothoidSeriesRLEvaluator(length1, c, 5, 5);
    for (const fraction of [0.1, 0.9, 1.0]) {
      const ray = seriesQ.fractionToPointAndDerivative(fraction);
      const plane = seriesQ.fractionToPointAnd2Derivatives(fraction);
      ck.testCoordinate(length1, ray.direction.magnitude(), "unit tangents on series clothoid");
      ck.testPerpendicular(plane.vectorU, plane.vectorV, "perpendicular derivatives on series clothoid");
    }
    expect(ck.getNumErrors()).equals(0);
  });
  it("Types", () => {
    const ck = new Checker();
    const allGeometry: GeometryQuery[] = [];
    const x0 = 0;
    let y0 = 0;
    const dyA = 0.5;
    const bearingChange = Angle.createDegrees(8);
    const r1 = 500;
    const length = bearingChange.radians / Geometry.meanCurvatureOfRadii(0, r1);
    const dxB = length;
    const spirals: TransitionSpiral3d[] = [];
    for (const spiralType of ["clothoid", "bloss", "biquadratic", "sine", "cosine",
      "Czech", "Arema"]) {
      for (const activeInterval of [Segment1d.create(0, 1), Segment1d.create(0.35, 0.75)]) {
        const spiralA = IntegratedSpiral3d.createRadiusRadiusBearingBearing(
          Segment1d.create(0, 500), AngleSweep.createStartEndDegrees(0, 8),
          activeInterval, Transform.createIdentity(), spiralType);
        if (spiralA)
          spirals.push(spiralA);
        else {
          const spiralB = DirectSpiral3d.createFromLengthAndRadius(spiralType, 0, r1,
            undefined, undefined, length,
            activeInterval, Transform.createIdentity());
          if (spiralB)
            spirals.push(spiralB);
        }
      }
    }
    for (const spiral of spirals) {
      let y1 = y0;
      if (ck.testType<TransitionSpiral3d>(spiral)) {
        if (spiral instanceof IntegratedSpiral3d)
          GeometryCoreTestIO.captureCloneGeometry(allGeometry, spiral.activeStrokes, x0, y1);
        else if (spiral instanceof DirectSpiral3d) {
          const linestring = LineString3d.create();
          spiral.emitStrokes(linestring);
          GeometryCoreTestIO.captureGeometry(allGeometry, linestring, x0, y1);
        }
        GeometryCoreTestIO.captureCloneGeometry(allGeometry, spiral, x0 + dxB, y1);
        y1 += dyA;
      }
      y0 += 2;
    }
    expect(ck.getNumErrors()).equals(0);
    GeometryCoreTestIO.saveGeometry(allGeometry, "TransitionSpiral3d", "Types");
  });
  it("DirectSpiralCoverage", () => {
    const ck = new Checker();
    const radius1 = 1000;
    const length1 = 100;
    const radius0 = 0;
    const radiusA = 2000;
    const bearing0 = Angle.createDegrees(0);
    const bearing1 = Angle.createDegrees(10);
    const bearingA = Angle.createDegrees(3);
    const transform = Transform.createIdentity();
    ck.testDefined(DirectSpiral3d.createFromLengthAndRadius("arema", radius0, radius1, bearing0, bearing1, length1, undefined, transform));
    ck.testUndefined(DirectSpiral3d.createFromLengthAndRadius("arema", radiusA, radius1, bearing0, bearing1, length1, undefined, transform));
    ck.testUndefined(DirectSpiral3d.createFromLengthAndRadius("arema", radius0, radius1, bearingA, bearing1, length1, undefined, transform));
    ck.testUndefined(DirectSpiral3d.createFromLengthAndRadius("arema", radius0, radius0, bearing0, bearing1, length1, undefined, transform));
    ck.testUndefined(DirectSpiral3d.createFromLengthAndRadius("arema", radius0, radius1, bearing0, bearing1, undefined, undefined, transform));
    ck.testUndefined(DirectSpiral3d.createFromLengthAndRadius("voodoo", radius0, radius1, bearing0, bearing1, length1, undefined, transform));
    expect(ck.getNumErrors()).equals(0);
  });
  it("DirectHalfCosineSnap", () => {
    const ck = new Checker();
    const allGeometry: GeometryQuery[] = [];
    const length1 = 100;
    const radius1 = 300;
    let x0 = 0;
    let y0 = 0;
    const dxA = 0.1 * length1;
    const dyA = 1.5 * length1;
    for (const evaluator of [
      new DirectHalfCosineSpiralEvaluator(length1, radius1),
      new ClothoidSeriesRLEvaluator(length1, 1.0 / (2.0 * radius1 * length1), 1, 1),
      new ClothoidSeriesRLEvaluator(length1, 1.0 / (2.0 * radius1 * length1), 2, 2),
      new ClothoidSeriesRLEvaluator(length1, 1.0 / (2.0 * radius1 * length1), 3, 3),
      new ClothoidSeriesRLEvaluator(length1, 1.0 / (2.0 * radius1 * length1), 4, 4)]) {
      const lsY = LineString3d.create();
      const lsD1Y = LineString3d.create();
      const lsD2Y = LineString3d.create();
      const lsD3Y = LineString3d.create();
      const lsD1X = LineString3d.create();
      const lsD2X = LineString3d.create();
      const lsD3X = LineString3d.create();

      const xy = Point3d.create();
      const d1xy = Vector3d.create();
      const d2xy = Vector3d.create();
      const d3xy = Vector3d.create();
      const frame = [];
      frame.push(Point3d.create(length1, 0), Point3d.create(0, 0), Point3d.create(0, length1));
      frame.push(Point3d.create(-dxA, length1));
      for (let u = 0; u <= 2.0; u += 0.05) {
        evaluator.fractionToPointAnd3Derivatives(u, xy, d1xy, d2xy, d3xy);
        lsY.packedPoints.pushXYZ(xy.x, xy.y, 0);
        lsD1Y.packedPoints.pushXYZ(xy.x, d1xy.y, 0);
        lsD2Y.packedPoints.pushXYZ(xy.x, d2xy.y, 0);
        lsD3Y.packedPoints.pushXYZ(xy.x, d3xy.y, 0);
        lsD1X.packedPoints.pushXYZ(xy.x, d1xy.x, 0);
        lsD2X.packedPoints.pushXYZ(xy.x, d2xy.x, 0);
        lsD3X.packedPoints.pushXYZ(xy.x, d3xy.x, 0);
        const xA = xy.x;
        const uB = evaluator.xToFraction(xA);
        if (ck.testIsFinite(uB))
          ck.testCoordinate(u, uB, "nominal distance inversion");
      }
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsY, x0, y0);
      GeometryCoreTestIO.captureGeometry(allGeometry, LineSegment3d.createXYZXYZ(0, 0, 0, length1, 0, 0), x0, y0);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsD1Y, x0, y0 += 10);
      GeometryCoreTestIO.captureGeometry(allGeometry, LineSegment3d.createXYZXYZ(0, 0, 0, length1, 0, 0), x0, y0);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsD2Y, x0, y0 += 20);
      GeometryCoreTestIO.captureGeometry(allGeometry, LineSegment3d.createXYZXYZ(0, 0, 0, length1, 0, 0), x0, y0);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsD3Y, x0, y0 += 40);
      GeometryCoreTestIO.captureGeometry(allGeometry, LineSegment3d.createXYZXYZ(0, 0, 0, length1, 0, 0), x0, y0);

      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsD1X, x0, y0 += dyA);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, frame, x0, y0);

      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsD2X, x0, y0 += dyA);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, frame, x0, y0);

      GeometryCoreTestIO.captureCloneGeometry(allGeometry, lsD3X, x0, y0 += dyA);
      GeometryCoreTestIO.captureCloneGeometry(allGeometry, frame, x0, y0);

      x0 += 3 * length1;
      y0 = 0;
    }
    GeometryCoreTestIO.saveGeometry(allGeometry, "TransitionSpiral3d", "DirectHalfCosineSnap");
    expect(ck.getNumErrors()).equals(0);
  });
  it("SampleConstruction", () => {
    const ck = new Checker();
    const allGeometry: GeometryQuery[] = [];
    const x0 = 0;
    let y0 = 0;
    const radius1 = 300;
    const length1 = 100;
    // smooth transition from the line to an arc of radius 300
    const lineIn = LineSegment3d.createXYXY(-length1, 0, 0, 0);
    const spiral = IntegratedSpiral3d.createFrom4OutOf5("clothoid", 0, radius1, Angle.createDegrees(0), undefined, length1, undefined, Transform.createIdentity())!;
    const tangent1 = spiral.fractionToPointAndDerivative(1.0);
    const arcOut = CurveFactory.createArcPointTangentRadius(tangent1.origin, tangent1.direction, radius1, undefined, Angle.createDegrees(90));
    GeometryCoreTestIO.captureCloneGeometry(allGeometry, lineIn, x0, y0);
    GeometryCoreTestIO.captureCloneGeometry(allGeometry, spiral, x0, y0);
    GeometryCoreTestIO.captureCloneGeometry(allGeometry, arcOut, x0, y0);
    // Create an arc departing directly from the end of the line
    const arcOutB = CurveFactory.createArcPointTangentRadius(lineIn.endPoint(), Vector3d.unitX(), radius1, undefined, Angle.createDegrees(90));
    y0 += 20.0;
    GeometryCoreTestIO.captureCloneGeometry(allGeometry, lineIn, x0, y0);
    GeometryCoreTestIO.captureCloneGeometry(allGeometry, arcOutB, x0, y0);
    expect(ck.getNumErrors()).equals(0);
    GeometryCoreTestIO.saveGeometry(allGeometry, "TransitionSpiral3d", "SampleConstruction");
  });
});
function xyString(name: string, x: number, y: number): string {
  return ("  (" + name + "  " + x + "  " + y + ")");
}
