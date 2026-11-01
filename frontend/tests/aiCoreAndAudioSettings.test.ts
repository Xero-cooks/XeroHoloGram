import { describe, it, expect } from 'bun:test';
import { AICoreModal } from '../src/ui/AICoreModal';
import { AudioSettingsDrawer } from '../src/ui/AudioSettingsDrawer';

describe('AI Core Modal & Audio Settings Drawer', () => {
  it('should initialize AICoreModal with default LLM and TTS configs', () => {
    let savedPrompt = '';
    const modal = new AICoreModal({
      onSendTestPrompt: (p) => {
        savedPrompt = p;
      }
    });

    expect(modal.getIsOpen()).toBe(false);
    modal.toggle(true);
    expect(modal.getIsOpen()).toBe(true);

    const llm = modal.getLLMConfig();
    expect(llm.model).toBe('gpt-4o-mini');
    expect(llm.temperature).toBe(0.7);

    const tts = modal.getTTSConfig();
    expect(tts.engine).toBe('edge_tts');
    expect(tts.voice).toContain('Neural');
  });

  it('should log messages in AICoreModal', () => {
    const modal = new AICoreModal();
    modal.log('Test LLM streaming packet');
    modal.log('D3 Kinematics received');
    expect(modal.getIsOpen()).toBe(false);
  });

  it('should initialize AudioSettingsDrawer with default VAD and DSP parameters', () => {
    const drawer = new AudioSettingsDrawer();
    expect(drawer.getIsOpen()).toBe(false);

    const s = drawer.getSettings();
    expect(s.energyThreshold).toBe(0.03);
    expect(s.echoCancellation).toBe(true);
    expect(s.language).toBe('en-US');

    drawer.toggle(true);
    expect(drawer.getIsOpen()).toBe(true);
  });
});
