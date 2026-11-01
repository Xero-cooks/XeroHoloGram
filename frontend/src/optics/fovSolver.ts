/**
 * FOV Perspective Compensation Solver
 * Computes vertical perspective foreshortening correction for angled glass beam splitters.
 */

export class FOVPerspectiveSolver {
  /**
   * Computes compensated vertical FOV (in degrees) for a mirror inclined at glassAngleDeg
   * @param nominalFovDeg Standard camera vertical FOV (typically 35° - 45°)
   * @param glassAngleDeg Glass inclination angle (typically 45°)
   * @param userMultiplier Optional custom user scaling multiplier
   */
  public static computeCompensatedFOV(
    nominalFovDeg: number,
    glassAngleDeg: number,
    userMultiplier: number = 1.0
  ): number {
    if (Math.abs(glassAngleDeg) < 1.0) {
      return nominalFovDeg * userMultiplier;
    }

    const angleRad = (glassAngleDeg * Math.PI) / 180.0;
    // Perspective foreshortening factor kappa = cos(theta)
    const kappa = Math.cos(angleRad);
    if (kappa <= 0.05) return nominalFovDeg;

    const nominalHalfFovRad = (nominalFovDeg * 0.5 * Math.PI) / 180.0;
    // Compensated half-angle: tan(fov_prime / 2) = tan(nominal / 2) / kappa
    const compensatedHalfFovRad = Math.atan(Math.tan(nominalHalfFovRad) / kappa);
    const compensatedFovDeg = (compensatedHalfFovRad * 2.0 * 180.0) / Math.PI;

    return Math.min(Math.max(compensatedFovDeg * userMultiplier, 10.0), 120.0);
  }

  /**
   * Computes vertical aspect ratio adjustment factor
   */
  public static computeAspectCorrection(glassAngleDeg: number): number {
    const angleRad = (glassAngleDeg * Math.PI) / 180.0;
    const kappa = Math.cos(angleRad);
    return kappa > 0.05 ? 1.0 / kappa : 1.0;
  }
}
