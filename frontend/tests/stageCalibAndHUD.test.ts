import { describe, it, expect } from 'bun:test';
import { StageCalibPanel } from '../src/ui/StageCalibPanel';
import { TelemetryHUD } from '../src/ui/TelemetryHUD';

describe('Pepper Ghost Stage Calibrator & Telemetry HUD', () => {
  it('should compute exact Pythagorean hypotenuse and 45-degree angle', () => {
    const panel = new StageCalibPanel();
    const settings = panel.getSettings();

    // 345mm base, 345mm height -> sqrt(345^2 + 345^2) = 487.9 mm
    expect(settings.glassAngleDeg).toBe(45.0);
    expect(settings.hypotenuseMm).toBeCloseTo(487.9, 1);
    expect(settings.compensatedFovDeg).toBeLessThan(settings.fovDeg);
  });

  it('should update stage dimensions and recompute geometry', () => {
    let changed = false;
    const panel = new StageCalibPanel({
      onChange: () => {
        changed = true;
      }
    });

    panel.setSettings({ baseWidthMm: 400, baseHeightMm: 300 });
    const updated = panel.getSettings();
    expect(changed).toBe(true);
    expect(updated.hypotenuseMm).toBe(500); // 3-4-5 triangle: 300^2 + 400^2 = 500^2
  });

  it('should update telemetry data cleanly', () => {
    const hud = new TelemetryHUD();
    expect(hud.getData().fps).toBe(60);

    hud.updateData({
      rttMs: 25,
      d3LatencyMs: 110,
      speechState: 'SPEAKING',
      intentClass: 'explain_code'
    });

    const d = hud.getData();
    expect(d.rttMs).toBe(25);
    expect(d.d3LatencyMs).toBe(110);
    expect(d.speechState).toBe('SPEAKING');
    expect(d.intentClass).toBe('explain_code');
  });
});
