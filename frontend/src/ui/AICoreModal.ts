import type { AgenticDecisionPacket } from '../network/HoloSocketClient';
import { ICONS } from './HoloIcons';

export interface LLMConfig {
  provider: 'openai' | 'groq' | 'openrouter' | 'gemini' | 'ollama' | 'mock';
  baseUrl: string;
  apiKey: string;
  model: string;
  decisionModel: string;
  temperature: number;
  systemPrompt: string;
}

export interface TTSConfig {
  engine: 'edge_tts' | 'browser_tts' | 'elevenlabs' | 'kokoro';
  voice: string;
  rate: string;
  pitch: string;
}

export interface AICoreModalCallbacks {
  onSaveLLMConfig?: (config: LLMConfig) => void;
  onSaveTTSConfig?: (config: TTSConfig) => void;
  onSendTestPrompt?: (prompt: string) => void;
  onTestVoiceSample?: (text: string, voice: string) => void;
}

export class AICoreModal {
  public container: HTMLElement | null = null;
  private isOpen: boolean = false;
  private currentTab: 'llm' | 'tts' | 'test' = 'llm';
  private callbacks: AICoreModalCallbacks;

  private llmConfig: LLMConfig = {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    decisionModel: 'vllm-sr/d3-flash',
    temperature: 0.7,
    systemPrompt: "You are XeroKratos, an ultra-advanced 3D Holographic AI Agent. You communicate with concise, sharp, spoken responses with rich body language."
  };

  private ttsConfig: TTSConfig = {
    engine: 'edge_tts',
    voice: 'en-US-ChristopherNeural',
    rate: '+0%',
    pitch: '+0Hz'
  };

  constructor(callbacks: AICoreModalCallbacks = {}) {
    this.callbacks = callbacks;
    this.loadPersistedConfig();
    if (typeof document !== 'undefined') {
      this.buildDOM();
    }
  }

  private loadPersistedConfig(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const savedLLM = localStorage.getItem('xeroholo_llm_config');
      if (savedLLM) this.llmConfig = { ...this.llmConfig, ...JSON.parse(savedLLM) };
      const savedTTS = localStorage.getItem('xeroholo_tts_config');
      if (savedTTS) this.ttsConfig = { ...this.ttsConfig, ...JSON.parse(savedTTS) };
    } catch {
      // Ignore storage errors
    }
  }

  private persistConfig(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('xeroholo_llm_config', JSON.stringify(this.llmConfig));
      localStorage.setItem('xeroholo_tts_config', JSON.stringify(this.ttsConfig));
    } catch {
      // Ignore storage errors
    }
  }

  private buildDOM(): void {
    const el = document.createElement('div');
    el.id = 'ai-core-modal';
    el.className = 'holo-drawer rig-studio-closed';
    el.style.left = '14px';
    el.style.right = 'auto';
    el.style.zIndex = '210';
    el.innerHTML = `
      <div class="holo-drawer-header">
        <h3>${ICONS.cpu} AI CORE & KINEMATIC DECISION HARNESS</h3>
        <button id="btn-close-ai-core" class="holo-btn-icon" title="Close">${ICONS.close}</button>
      </div>

      <div class="holo-tabs">
        <div class="holo-tab active" data-ai-tab="llm">${ICONS.cpu} MODELS</div>
        <div class="holo-tab" data-ai-tab="tts">${ICONS.mic} SPEECH & TTS</div>
        <div class="holo-tab" data-ai-tab="test">${ICONS.activity} TEST HARNESS</div>
      </div>

      <div class="holo-drawer-body">
        <!-- ================= TAB 1: LLM & DECISION CONFIGURATION ================= -->
        <div id="ai-tab-content-llm" class="tab-pane">
          <!-- Decision Model Section (System 1) -->
          <div class="holo-section">
            <div class="holo-section-title">
              <span>SYSTEM 1: VLLM DECISION ENGINE (D3-FLASH)</span>
              <span class="holo-badge holo-badge-connected">52 KEYS ACTIVE</span>
            </div>
            
            <div class="holo-field">
              <label>Decision Model Architecture:</label>
              <select id="select-decision-model" class="holo-select">
                <option value="vllm-sr/d3-flash" selected>vllm-sr/d3-flash (9B - Sub-100ms Forward Pass)</option>
                <option value="vllm-sr/d3-ultra">vllm-sr/d3-ultra (27B - Deep Bounded Reasoning)</option>
                <option value="vllm-sr/d3-mini">vllm-sr/d3-mini (4B - High Speed Lightweight)</option>
                <option value="vllm-sr/d3-edge">vllm-sr/d3-edge (0.6B - Edge Optimized)</option>
              </select>
            </div>

            <div style="font-size:10px; color:#71717a; line-height:1.4; margin-top:6px; font-family:var(--holo-font-mono);">
              Single forward pass calibrated probability router for intent, SO(3) kinematics, and tool triggers. Backed by a 52-key round-robin proxy pool.
            </div>
          </div>

          <!-- Conversational Chat Model Section (System 2) -->
          <div class="holo-section">
            <div class="holo-section-title">
              <span>SYSTEM 2: OPENAI-COMPATIBLE CHAT LLM (VOICE)</span>
              <span class="holo-badge holo-badge-idle" id="badge-llm-provider">OPENAI</span>
            </div>
            
            <div class="holo-field">
              <label>Chat Provider:</label>
              <select id="select-llm-provider" class="holo-select">
                <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                <option value="groq">Groq Ultra-Fast (Llama 3.3 70B, Mixtral)</option>
                <option value="openrouter">OpenRouter (Multi-Provider Aggregator)</option>
                <option value="gemini">Google Gemini (OpenAI Compatible Endpoint)</option>
                <option value="ollama">Ollama (Local Private LLM)</option>
                <option value="mock">Offline Smart Simulator (Zero-API-Key)</option>
              </select>
            </div>

            <div class="holo-field">
              <label>API Base URL:</label>
              <input type="text" id="input-llm-base-url" class="holo-input" value="${this.llmConfig.baseUrl}" />
            </div>

            <div class="holo-field">
              <label>API Key: <span style="color:#71717a;">(Stored locally in browser)</span></label>
              <div style="display:flex; gap:6px;">
                <input type="password" id="input-llm-api-key" class="holo-input" style="flex:1;" placeholder="sk-... / gsk_..." value="${this.llmConfig.apiKey}" />
                <button id="btn-toggle-key-vis" class="holo-btn holo-btn-secondary" style="padding:4px 8px;">${ICONS.eye}</button>
              </div>
            </div>

            <div class="holo-field">
              <label>Model Name:</label>
              <input type="text" id="input-llm-model" class="holo-input" value="${this.llmConfig.model}" />
            </div>

            <div class="holo-slider-group">
              <label>Temperature: <span id="lbl-val-temp">${this.llmConfig.temperature}</span></label>
              <input type="range" id="slider-llm-temp" min="0.0" max="1.5" step="0.05" value="${this.llmConfig.temperature}" class="holo-slider" />
            </div>

            <div class="holo-field">
              <label>System Directive Prompt:</label>
              <textarea id="textarea-system-prompt" class="holo-input" style="height:70px; resize:vertical;">${this.llmConfig.systemPrompt}</textarea>
            </div>

            <button id="btn-save-llm-config" class="holo-btn holo-btn-cyan" style="width:100%; justify-content:center; margin-top:6px;">
              ${ICONS.save} SAVE & SYNC CONFIG
            </button>
          </div>
        </div>

        <!-- ================= TAB 2: TTS & ACOUSTICS ================= -->
        <div id="ai-tab-content-tts" class="tab-pane" style="display:none;">
          <div class="holo-section">
            <div class="holo-section-title">
              <span>STREAMING TTS SYNTHESIS ENGINE</span>
              <span class="holo-badge holo-badge-listening">ZERO-COST</span>
            </div>

            <div class="holo-field">
              <label>Acoustic Engine:</label>
              <select id="select-tts-engine" class="holo-select">
                <option value="edge_tts">Edge-TTS (Neural High-Def - Zero Cost)</option>
                <option value="browser_tts">Browser SpeechSynthesis (Instant Offline Fallback)</option>
                <option value="elevenlabs">ElevenLabs (Ultra-Realistic Streaming)</option>
                <option value="kokoro">Kokoro-82M ONNX (Local Edge Audio)</option>
              </select>
            </div>

            <div class="holo-field">
              <label>Voice Selection:</label>
              <select id="select-tts-voice" class="holo-select">
                <option value="en-US-ChristopherNeural">en-US-ChristopherNeural (Authoritative Male)</option>
                <option value="en-US-JennyNeural">en-US-JennyNeural (Expressive Female)</option>
                <option value="en-US-GuyNeural">en-US-GuyNeural (Casual Conversational)</option>
                <option value="en-GB-RyanNeural">en-GB-RyanNeural (British Sophisticated)</option>
                <option value="en-GB-SoniaNeural">en-GB-SoniaNeural (British Crystal Female)</option>
                <option value="en-AU-NatashaNeural">en-AU-NatashaNeural (Australian Clear)</option>
              </select>
            </div>

            <div class="holo-field">
              <label>Speech Pacing / Rate:</label>
              <select id="select-tts-rate" class="holo-select">
                <option value="+0%">Normal (1.0x)</option>
                <option value="+10%">Energetic (+10%)</option>
                <option value="+20%">Fast Paced (+20%)</option>
                <option value="-10%">Deliberate (-10%)</option>
              </select>
            </div>

            <div style="display:flex; gap:6px; margin-top:12px;">
              <button id="btn-test-voice-sample" class="holo-btn holo-btn-secondary" style="flex:1; justify-content:center;">
                ${ICONS.play} PREVIEW SAMPLE
              </button>
              <button id="btn-save-tts-config" class="holo-btn holo-btn-cyan" style="flex:1; justify-content:center;">
                ${ICONS.save} APPLY VOICE
              </button>
            </div>
          </div>
        </div>

        <!-- ================= TAB 3: LIVE TEST CONSOLE & REQUEST SENDER ================= -->
        <div id="ai-tab-content-test" class="tab-pane" style="display:none;">
          <div class="holo-section">
            <div class="holo-section-title">
              <span>INTERACTIVE PROMPT TEST HARNESS</span>
              <span class="holo-badge holo-badge-speaking">STREAMING</span>
            </div>

            <div style="display:flex; gap:6px;">
              <input type="text" id="input-test-prompt" class="holo-input" style="flex:1;" placeholder="Ask the hologram anything..." />
              <button id="btn-send-test-prompt" class="holo-btn holo-btn-cyan" style="padding:6px 14px;">
                ${ICONS.send} SEND
              </button>
            </div>

            <div style="margin-top:10px;">
              <span style="font-size:9.5px; color:#71717a; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;">QUICK TEST PRESETS:</span>
              <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:6px;">
                <button class="holo-btn holo-btn-secondary btn-quick-prompt" data-prompt="Explain your system architecture and Pepper's Ghost optics.">${ICONS.layers} OPTICS</button>
                <button class="holo-btn holo-btn-secondary btn-quick-prompt" data-prompt="Summon your holographic wrist terminal and show stdout logs.">${ICONS.terminal} TERMINAL</button>
                <button class="holo-btn holo-btn-secondary btn-quick-prompt" data-prompt="Spawn a sub-agent worker node to compute data.">${ICONS.box} WORKER</button>
                <button class="holo-btn holo-btn-secondary btn-quick-prompt" data-prompt="Run self-diagnostic quantum heal routine.">${ICONS.activity} HEAL</button>
              </div>
            </div>

            <!-- Decision LLM Policy Inspector Card -->
            <div id="decision-policy-card" style="margin-top:12px; background:linear-gradient(180deg, #18181c 0%, #0d0d10 100%); border:1px solid rgba(255,255,255,0.12); border-radius:2px; padding:10px; font-family:var(--holo-font-sans); transition:border-color 0.25s;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:10px; font-weight:700; color:#38bdf8; letter-spacing:0.08em; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
                  ${ICONS.target} DECISION POLICY ENGINE (VLLM-SR/D3-FLASH)
                </span>
                <span id="decision-confidence-badge" class="holo-badge holo-badge-speaking" style="font-size:9px;">STANDBY</span>
              </div>
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px; font-size:10px;">
                <div style="background:#08080a; padding:6px; border-radius:2px; border:1px solid rgba(255,255,255,0.06);">
                  <span style="color:#71717a; font-weight:700; font-size:9px; letter-spacing:0.06em; text-transform:uppercase; display:block;">RESOLVED INTENT</span>
                  <span id="decision-intent-val" style="color:#38bdf8; font-weight:700; font-family:var(--holo-font-mono);">NONE</span>
                </div>
                <div style="background:#08080a; padding:6px; border-radius:2px; border:1px solid rgba(255,255,255,0.06);">
                  <span style="color:#71717a; font-weight:700; font-size:9px; letter-spacing:0.06em; text-transform:uppercase; display:block;">TOOL ACTUATOR</span>
                  <span id="decision-tool-val" style="color:#c084fc; font-weight:700; font-family:var(--holo-font-mono);">NONE</span>
                </div>
                <div style="background:#08080a; padding:6px; border-radius:2px; border:1px solid rgba(255,255,255,0.06);">
                  <span style="color:#71717a; font-weight:700; font-size:9px; letter-spacing:0.06em; text-transform:uppercase; display:block;">EMOTION & SHADER</span>
                  <span id="decision-emotion-val" style="color:#f4f4f5; font-weight:600;">neutral_attentive</span>
                </div>
                <div style="background:#08080a; padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
                  <span style="color:#71717a; font-weight:700; font-size:9px; letter-spacing:0.06em; text-transform:uppercase; display:block;">SO(3) KINEMATIC PLAN</span>
                  <span id="decision-plan-val" style="color:#34d399; font-weight:600;">0 Keyframes</span>
                </div>
              </div>

              <!-- Thought Trace Scratchpad -->
              <div style="background:#08080a; border:1px dashed rgba(255,255,255,0.12); border-radius:2px; padding:6px 8px; margin-bottom:8px;">
                <span style="font-size:8.5px; color:#71717a; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; display:block; margin-bottom:2px;">CHAIN-OF-THOUGHT SCRATCHPAD</span>
                <div id="decision-thought-val" style="font-size:9.5px; color:#a1a1aa; font-family:var(--holo-font-mono); line-height:1.35; max-height:48px; overflow-y:auto;">
                  Waiting for user interaction...
                </div>
              </div>

              <!-- Spoken Speech Payload -->
              <div style="background:#08080a; border:1px solid rgba(56,189,248,0.2); border-radius:2px; padding:6px 8px;">
                <span style="font-size:8.5px; color:#38bdf8; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; display:block; margin-bottom:2px;">STREAMED CHAT SPEECH PAYLOAD</span>
                <div id="decision-speech-val" style="font-size:10px; color:#fafafa; font-weight:500; line-height:1.35;">
                  "Awaiting next conversational turn."
                </div>
              </div>
            </div>

            <!-- Real-Time Activity Log -->
            <div style="margin-top:12px;">
              <div style="font-size:9.5px; color:#71717a; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:6px;">CONVERSATIONAL STREAM LOG</div>
              <div id="ai-stream-log" style="height:120px; overflow-y:auto; background:#08080a; border:1px solid var(--holo-border); border-radius:2px; padding:8px; font-family:var(--holo-font-mono); font-size:10px; color:#a1a1aa;">
                <div style="color:#38bdf8;">[READY] AI Core Test Harness Initialized.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);
    this.container = el;
    this.wireEvents();
  }

  private wireEvents(): void {
    if (!this.container) return;

    // Close button
    const btnClose = this.container.querySelector('#btn-close-ai-core');
    btnClose?.addEventListener('click', () => this.toggle(false));

    // Tab switchers
    const tabs = this.container.querySelectorAll('.holo-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-ai-tab') as 'llm' | 'tts' | 'test';
        this.switchTab(target);
      });
    });

    // Provider select
    const selProvider = this.container.querySelector('#select-llm-provider') as HTMLSelectElement;
    const badgeProvider = this.container.querySelector('#badge-llm-provider') as HTMLElement;
    const inputBaseUrl = this.container.querySelector('#input-llm-base-url') as HTMLInputElement;
    const inputModel = this.container.querySelector('#input-llm-model') as HTMLInputElement;
    const selDecisionModel = this.container.querySelector('#select-decision-model') as HTMLSelectElement;

    selProvider?.addEventListener('change', () => {
      const p = selProvider.value;
      if (badgeProvider) badgeProvider.textContent = p.toUpperCase();
      if (p === 'groq') {
        inputBaseUrl.value = 'https://api.groq.com/openai/v1';
        inputModel.value = 'llama-3.3-70b-versatile';
      } else if (p === 'openrouter') {
        inputBaseUrl.value = 'https://openrouter.ai/api/v1';
        inputModel.value = 'meta-llama/llama-3.3-70b-instruct';
      } else if (p === 'gemini') {
        inputBaseUrl.value = 'https://generativelanguage.googleapis.com/v1beta/openai/';
        inputModel.value = 'gemini-1.5-flash';
      } else if (p === 'ollama') {
        inputBaseUrl.value = 'http://localhost:11434/v1';
        inputModel.value = 'llama3.2';
      } else if (p === 'openai') {
        inputBaseUrl.value = 'https://api.openai.com/v1';
        inputModel.value = 'gpt-4o-mini';
      }
    });

    // Key visibility toggle
    const btnKeyVis = this.container.querySelector('#btn-toggle-key-vis');
    const inputApiKey = this.container.querySelector('#input-llm-api-key') as HTMLInputElement;
    btnKeyVis?.addEventListener('click', () => {
      if (inputApiKey) {
        inputApiKey.type = inputApiKey.type === 'password' ? 'text' : 'password';
      }
    });

    // Temperature slider
    const sliderTemp = this.container.querySelector('#slider-llm-temp') as HTMLInputElement;
    const lblTemp = this.container.querySelector('#lbl-val-temp');
    sliderTemp?.addEventListener('input', () => {
      if (lblTemp) lblTemp.textContent = sliderTemp.value;
    });

    // Save LLM Config
    const btnSaveLLM = this.container.querySelector('#btn-save-llm-config');
    btnSaveLLM?.addEventListener('click', () => {
      this.llmConfig.provider = selProvider?.value as any || 'openai';
      this.llmConfig.baseUrl = inputBaseUrl?.value || 'https://api.openai.com/v1';
      this.llmConfig.apiKey = inputApiKey?.value || '';
      this.llmConfig.model = inputModel?.value || 'gpt-4o-mini';
      this.llmConfig.decisionModel = selDecisionModel?.value || 'vllm-sr/d3-flash';
      this.llmConfig.temperature = parseFloat(sliderTemp?.value || '0.7');
      const textareaPrompt = this.container?.querySelector('#textarea-system-prompt') as HTMLTextAreaElement;
      if (textareaPrompt) this.llmConfig.systemPrompt = textareaPrompt.value;

      this.persistConfig();
      this.callbacks.onSaveLLMConfig?.(this.llmConfig);
      this.log(`[SAVED] LLM Chat Model: ${this.llmConfig.model}, Decision Model: ${this.llmConfig.decisionModel}`);
    });

    // Save TTS Config
    const btnSaveTTS = this.container.querySelector('#btn-save-tts-config');
    const selEngine = this.container.querySelector('#select-tts-engine') as HTMLSelectElement;
    const selVoice = this.container.querySelector('#select-tts-voice') as HTMLSelectElement;
    const selRate = this.container.querySelector('#select-tts-rate') as HTMLSelectElement;

    btnSaveTTS?.addEventListener('click', () => {
      this.ttsConfig.engine = selEngine?.value as any || 'edge_tts';
      this.ttsConfig.voice = selVoice?.value || 'en-US-ChristopherNeural';
      this.ttsConfig.rate = selRate?.value || '+0%';

      this.persistConfig();
      this.callbacks.onSaveTTSConfig?.(this.ttsConfig);
      this.log(`[SAVED] TTS Engine: ${this.ttsConfig.engine}, Voice: ${this.ttsConfig.voice}`);
    });

    // Preview Voice Sample
    const btnTestVoice = this.container.querySelector('#btn-test-voice-sample');
    btnTestVoice?.addEventListener('click', () => {
      const v = selVoice?.value || 'en-US-ChristopherNeural';
      const sample = "The Pepper's Ghost optical stage operates at 45 degrees, projecting a 3D hologram directly above your screen.";
      this.callbacks.onTestVoiceSample?.(sample, v);
    });

    // Test Harness Send
    const inputPrompt = this.container.querySelector('#input-test-prompt') as HTMLInputElement;
    const btnSendPrompt = this.container.querySelector('#btn-send-test-prompt');

    const sendTest = (txt: string) => {
      if (!txt) return;
      this.log(`[YOU]: "${txt}"`);
      this.callbacks.onSendTestPrompt?.(txt);
      if (inputPrompt) inputPrompt.value = '';
    };

    btnSendPrompt?.addEventListener('click', () => {
      if (inputPrompt) sendTest(inputPrompt.value.trim());
    });

    inputPrompt?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendTest(inputPrompt.value.trim());
      }
    });

    // Quick Prompt Buttons
    const quickButtons = this.container.querySelectorAll('.btn-quick-prompt');
    quickButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-prompt') || '';
        sendTest(p);
      });
    });
  }

  private switchTab(k: 'llm' | 'tts' | 'test'): void {
    this.currentTab = k;
    if (!this.container) return;
    ['llm', 'tts', 'test'].forEach(t => {
      const el = this.container?.querySelector(`#ai-tab-content-${t}`) as HTMLElement;
      if (el) el.style.display = t === k ? 'block' : 'none';
    });
  }

  public renderDecisionCard(decision: AgenticDecisionPacket): void {
    if (!this.container) return;

    const card = this.container.querySelector('#decision-policy-card') as HTMLElement;
    const badgeConf = this.container.querySelector('#decision-confidence-badge') as HTMLElement;
    const elIntent = this.container.querySelector('#decision-intent-val') as HTMLElement;
    const elTool = this.container.querySelector('#decision-tool-val') as HTMLElement;
    const elEmotion = this.container.querySelector('#decision-emotion-val') as HTMLElement;
    const elPlan = this.container.querySelector('#decision-plan-val') as HTMLElement;
    const elThought = this.container.querySelector('#decision-thought-val') as HTMLElement;
    const elSpeech = this.container.querySelector('#decision-speech-val') as HTMLElement;

    if (badgeConf) {
      const pct = Math.round((decision.confidence ?? 0.95) * 100);
      badgeConf.textContent = `${pct}% CONFIDENCE`;
      badgeConf.className = pct >= 90 ? 'holo-badge holo-badge-connected' : 'holo-badge holo-badge-speaking';
    }

    if (elIntent) {
      elIntent.textContent = (decision.intent_class || 'CONVERSATIONAL_QA').toUpperCase();
    }

    if (elTool) {
      if (decision.tool_call && decision.tool_call.name) {
        elTool.textContent = decision.tool_call.name;
        elTool.style.color = '#c084fc';
      } else {
        elTool.textContent = 'NONE';
        elTool.style.color = '#71717a';
      }
    }

    if (elEmotion) {
      elEmotion.textContent = `${decision.emotion || 'neutral'} • ${decision.holo_shader_state || 'cyan'}`;
    }

    if (elPlan) {
      const count = decision.gesture_sequence?.length || 0;
      const presets = (decision.gesture_sequence || []).map(g => g.base_preset).join(', ');
      elPlan.textContent = `${count} Ph (${presets || 'neutral'})`;
    }

    if (elThought) {
      elThought.textContent = decision.thought_trace || 'Direct intent-action resolution applied via vllm-sr/d3-flash.';
    }

    if (elSpeech) {
      elSpeech.textContent = `"${decision.speech_response}"`;
    }

    // Flash border on decision pulse
    if (card) {
      card.style.borderColor = '#38bdf8';
      card.style.boxShadow = '0 0 12px rgba(56,189,248,0.3)';
      setTimeout(() => {
        card.style.borderColor = 'rgba(255,255,255,0.12)';
        card.style.boxShadow = 'none';
      }, 700);
    }
  }

  public log(line: string): void {
    if (!this.container) return;
    const logBox = this.container.querySelector('#ai-stream-log');
    if (logBox) {
      const time = new Date().toTimeString().slice(0, 8);
      const row = document.createElement('div');
      row.style.marginBottom = '4px';
      row.innerHTML = `<span style="color:#71717a;">[${time}]</span> ${line}`;
      logBox.appendChild(row);
      logBox.scrollTop = logBox.scrollHeight;
    }
  }

  public toggle(force?: boolean): void {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    if (this.container) {
      this.container.classList.toggle('rig-studio-closed', !this.isOpen);
      this.container.classList.toggle('rig-studio-open', this.isOpen);
    }
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public getLLMConfig(): LLMConfig {
    return { ...this.llmConfig };
  }

  public getTTSConfig(): TTSConfig {
    return { ...this.ttsConfig };
  }
}
