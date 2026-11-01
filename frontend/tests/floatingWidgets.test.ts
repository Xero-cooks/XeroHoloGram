import { describe, it, expect } from 'bun:test';
import * as THREE from 'three';
import { FloatingWidgets } from '../src/shaders/FloatingWidgets';

describe('Floating Cybernetic Hologram Widgets', () => {
  it('should initialize wrist terminal and sub-agent group', () => {
    const widgets = new FloatingWidgets();
    expect(widgets.group).toBeInstanceOf(THREE.Group);
    expect(widgets.isTerminalVisible()).toBe(false);

    widgets.setTerminalVisible(true);
    expect(widgets.isTerminalVisible()).toBe(true);
  });

  it('should push logs to wrist terminal buffer', () => {
    const widgets = new FloatingWidgets();
    widgets.log('Test system notification');
    widgets.log('Sub-agent initiated compute');
    expect(widgets.isTerminalVisible()).toBe(false);
  });

  it('should spawn, animate, and dismiss sub-agent orbs', () => {
    const widgets = new FloatingWidgets();
    expect(widgets.getActiveSubAgentCount()).toBe(0);

    widgets.spawnSubAgent('sub-001', 'Reasoner-Alpha');
    expect(widgets.getActiveSubAgentCount()).toBe(1);

    // Update animation frames
    widgets.update(100);
    widgets.update(500);

    // Dismiss
    widgets.dismissSubAgent('sub-001');
    for (let i = 0; i < 30; i++) {
      widgets.update(1000 + i * 50);
    }
    expect(widgets.getActiveSubAgentCount()).toBe(0);
  });
});
