import { describe, it, expect } from 'bun:test';
import { HoloSocketClient, AgenticDecisionPacket, ToolActionCall } from '../src/network/HoloSocketClient';
import { AICoreModal } from '../src/ui/AICoreModal';

describe('Decision-Based LLM Engine & Inspector', () => {
  it('should dispatch decision_packet to onDecision subscribers', () => {
    const client = new HoloSocketClient('ws://localhost:8765/ws/hologram');
    let receivedDecision: AgenticDecisionPacket | null = null;

    client.onDecision((packet) => {
      receivedDecision = packet;
    });

    const mockPacket: AgenticDecisionPacket = {
      type: 'decision_packet',
      thought_trace: 'Evaluating optical stage geometry against 45-degree reflector.',
      intent_class: 'explain_architecture',
      confidence: 0.98,
      speech_response: "The Pepper's Ghost optical stage relies on an illuminated 180-degree LCD.",
      emotion: 'analytical_focused',
      gaze_vector: [0.0, 0.12, 1.0],
      holo_shader_state: 'cyan_nominative',
      tool_call: {
        name: 'summon_wrist_terminal',
        parameters: { display_mode: 'diagnostics' }
      },
      gesture_sequence: [
        {
          trigger_ms: 0,
          duration_ms: 1100,
          base_preset: 'finger_up_insight',
          blend_weight: 1.0,
          bone_angle_overrides_deg: {}
        }
      ]
    };

    // Simulate raw message arrival
    (client as any).handleTextMessage(JSON.stringify(mockPacket));

    expect(receivedDecision).not.toBeNull();
    expect(receivedDecision?.intent_class).toBe('explain_architecture');
    expect(receivedDecision?.confidence).toBe(0.98);
    expect(receivedDecision?.tool_call?.name).toBe('summon_wrist_terminal');
  });

  it('should dispatch tool_action_trigger to onToolAction subscribers', () => {
    const client = new HoloSocketClient('ws://localhost:8765/ws/hologram');
    let receivedTool: ToolActionCall | null = null;

    client.onToolAction((tool) => {
      receivedTool = tool;
    });

    const mockToolMsg = {
      type: 'tool_action_trigger',
      name: 'spawn_subagent',
      parameters: { worker_id: 'worker-99' }
    };

    (client as any).handleTextMessage(JSON.stringify(mockToolMsg));

    expect(receivedTool).not.toBeNull();
    expect(receivedTool?.name).toBe('spawn_subagent');
    expect(receivedTool?.parameters.worker_id).toBe('worker-99');
  });

  it('should render decision card elements inside AICoreModal', () => {
    const modal = new AICoreModal();
    const elements: Record<string, any> = {};
    modal.container = {
      querySelector: (sel: string) => {
        if (!elements[sel]) {
          elements[sel] = { textContent: '', style: {}, className: '' };
        }
        return elements[sel];
      }
    } as any;

    const packet: AgenticDecisionPacket = {
      thought_trace: 'Testing quantum heal recovery routine.',
      intent_class: 'quantum_heal',
      confidence: 0.99,
      speech_response: 'Initiating quantum self-repair sequence.',
      emotion: 'resolute_confident',
      gaze_vector: [0, 0.2, 1],
      holo_shader_state: 'emerald_healed',
      tool_call: {
        name: 'execute_quantum_heal',
        parameters: { reset_springs: true }
      },
      gesture_sequence: [
        {
          trigger_ms: 0,
          duration_ms: 1500,
          base_preset: 'self_heal',
          blend_weight: 1.0,
          bone_angle_overrides_deg: {}
        }
      ]
    };

    modal.renderDecisionCard(packet);

    const intentEl = modal.container?.querySelector('#decision-intent-val');
    const toolEl = modal.container?.querySelector('#decision-tool-val');
    const confBadge = modal.container?.querySelector('#decision-confidence-badge');
    const speechEl = modal.container?.querySelector('#decision-speech-val');

    expect(intentEl?.textContent).toBe('QUANTUM_HEAL');
    expect(toolEl?.textContent).toBe('execute_quantum_heal');
    expect(confBadge?.textContent).toContain('99% CONFIDENCE');
    expect(speechEl?.textContent).toContain('Initiating quantum self-repair');
  });

  it('should dispatch chat_response to onChatResponse subscribers', () => {
    const client = new HoloSocketClient('ws://localhost:8765/ws/hologram');
    let receivedChatText = '';

    client.onChatResponse((text) => {
      receivedChatText = text;
    });

    const mockChatMsg = {
      type: 'chat_response',
      text: 'The holographic harness is operating at 60 frames per second.',
      role: 'assistant'
    };

    (client as any).handleTextMessage(JSON.stringify(mockChatMsg));

    expect(receivedChatText).toBe('The holographic harness is operating at 60 frames per second.');
  });

  it('should synchronize model and TTS settings from disk config', () => {
    const modal = new AICoreModal();
    const diskConfig = {
      provider: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: 'gsk_testkey123',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      decisionModel: 'vllm-sr/d3-ultra',
      ttsEngine: 'edge_tts',
      ttsVoice: 'en-US-ChristopherNeural',
      ttsRate: '+10%'
    };

    modal.applyDiskConfig(diskConfig);

    const llm = modal.getLLMConfig();
    expect(llm.provider).toBe('groq');
    expect(llm.baseUrl).toBe('https://api.groq.com/openai/v1');
    expect(llm.apiKey).toBe('gsk_testkey123');
    expect(llm.model).toBe('llama-3.3-70b-versatile');
    expect(llm.temperature).toBe(0.8);
    expect(llm.decisionModel).toBe('vllm-sr/d3-ultra');

    const tts = modal.getTTSConfig();
    expect(tts.voice).toBe('en-US-ChristopherNeural');
    expect(tts.rate).toBe('+10%');
  });
});
