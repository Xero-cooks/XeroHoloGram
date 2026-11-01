export interface LLMConfig {
  provider: 'openai' | 'groq' | 'openrouter' | 'gemini' | 'ollama' | 'mock';
  baseUrl: string;
  apiKey: string;
  model: string;
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
        <h3>🧠 AI CORE & VOICE (LLM & TTS)</h3>
        <button id="btn-close-ai-core" class="holo-btn-icon">✕</button>
      </div>

      <div class="holo-tabs">
        <div class="holo-tab active" data-ai-tab="llm">🤖 LLM MODEL</div>
        <div class="holo-tab" data-ai-tab="tts">🎙 TTS & VOICE</div>
        <div class="holo-tab" data-ai-tab="test">⚡ TEST HARNESS</div>
      </div>

      <div class="holo-drawer-body">
        <!-- ================= TAB 1: LLM CONFIGURATION ================= -->
        <div id="ai-tab-content-llm" class="tab-pane">
          <div class="holo-section">
            <div class="holo-section-title">
              <span>LLM PROVIDER SELECTION</span>
              <span class="holo-badge holo-badge-cyan" id="badge-llm-provider">OPENAI</span>
            </div>
            
            <div class="holo-slider-group">
              <label>Provider:</label>
              <select id="select-llm-provider" class="holo-select" style="width:100%; max-width:none; padding:8px;">
                <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                <option value="groq">Groq Ultra-Fast (Llama 3.3 70B, Mixtral)</option>
                <option value="openrouter">OpenRouter (Multi-Provider Aggregator)</option>
                <option value="gemini">Google Gemini (OpenAI Endpoint)</option>
                <option value="ollama">Ollama (Local Private LLM)</option>
                <option value="mock">Offline Smart Simulator (Zero-API-Key)</option>
              </select>
            </div>

            <div class="holo-slider-group" style="margin-top:10px;">
              <label>API Base URL:</label>
              <input type="text" id="input-llm-base-url" class="holo-select" style="width:100%; max-width:none; padding:8px;" value="${this.llmConfig.baseUrl}" />
            </div>

            <div class="holo-slider-group" style="margin-top:10px;">
              <label>API Key: <span style="font-size:10px; color:#94a3b8;">(Stored locally in browser)</span></label>
              <div style="display:flex; gap:6px;">
                <input type="password" id="input-llm-api-key" class="holo-select" style="flex:1; max-width:none; padding:8px;" placeholder="sk-... / gsk_..." value="${this.llmConfig.apiKey}" />
                <button id="btn-toggle-key-vis" class="holo-btn holo-btn-secondary" style="padding:4px 8px;">👁</button>
              </div>
            </div>

            <div class="holo-slider-group" style="margin-top:10px;">
              <label>Model Name:</label>
              <input type="text" id="input-llm-model" class="holo-select" style="width:100%; max-width:none; padding:8px;" value="${this.llmConfig.model}" />
            </div>

            <div class="holo-slider-group" style="margin-top:10px;">
              <label>Temperature: <span id="lbl-val-temp">${this.llmConfig.temperature}</span></label>
              <input type="range" id="slider-llm-temp" min="0.0" max="1.5" step="0.05" value="${this.llmConfig.temperature}" class="holo-slider" />
            </div>

            <div class="holo-slider-group" style="margin-top:10px;">
              <label>System Directive Prompt:</label>
              <textarea id="textarea-system-prompt" class="holo-select" style="width:100%; max-width:none; height:80px; padding:8px; resize:vertical;">${this.llmConfig.systemPrompt}</textarea>
            </div>

            <button id="btn-save-llm-config" class="holo-btn holo-btn-cyan" style="width:100%; justify-content:center; margin-top:10px;">
              💾 SAVE & SYNC LLM CONFIG
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

            <div class="holo-slider-group">
              <label>Acoustic Engine:</label>
              <select id="select-tts-engine" class="holo-select" style="width:100%; max-width:none; padding:8px;">
                <option value="edge_tts">Edge-TTS (Neural High-Def - Zero Cost)</option>
                <option value="browser_tts">Browser SpeechSynthesis (Instant Offline Fallback)</option>
                <option value="elevenlabs">ElevenLabs (Ultra-Realistic Streaming)</option>
                <option value="kokoro">Kokoro-82M ONNX (Local Edge Audio)</option>
              </select>
            </div>

            <div class="holo-slider-group" style="margin-top:10px;">
              <label>Voice Selection:</label>
              <select id="select-tts-voice" class="holo-select" style="width:100%; max-width:none; padding:8px;">
                <option value="en-US-ChristopherNeural">en-US-ChristopherNeural (Authoritative Male)</option>
                <option value="en-US-JennyNeural">en-US-JennyNeural (Expressive Female)</option>
                <option value="en-US-GuyNeural">en-US-GuyNeural (Casual Conversational)</option>
                <option value="en-GB-RyanNeural">en-GB-RyanNeural (British Sophisticated)</option>
                <option value="en-GB-SoniaNeural">en-GB-SoniaNeural (British Crystal Female)</option>
                <option value="en-AU-NatashaNeural">en-AU-NatashaNeural (Australian Clear)</option>
              </select>
            </div>

            <div class="holo-slider-group" style="margin-top:10px;">
              <label>Speech Pacing / Rate:</label>
              <select id="select-tts-rate" class="holo-select" style="width:100%; max-width:none; padding:8px;">
                <option value="+0%">Normal (1.0x)</option>
                <option value="+10%">Energetic (+10%)</option>
                <option value="+20%">Fast Paced (+20%)</option>
                <option value="-10%">Deliberate (-10%)</option>
              </select>
            </div>

            <div style="display:flex; gap:8px; margin-top:14px;">
              <button id="btn-test-voice-sample" class="holo-btn holo-btn-secondary" style="flex:1; justify-content:center;">
                ▶ PREVIEW VOICE SAMPLE
              </button>
              <button id="btn-save-tts-config" class="holo-btn holo-btn-cyan" style="flex:1; justify-content:center;">
                💾 APPLY VOICE
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

            <div style="display:flex; gap:8px;">
              <input type="text" id="input-test-prompt" class="holo-select" style="flex:1; max-width:none; padding:10px;" placeholder="Ask the hologram anything..." />
              <button id="btn-send-test-prompt" class="holo-btn holo-btn-cyan" style="padding:8px 16px;">
                ⚡ SEND
              </button>
            </div>

            <div style="margin-top:10px;">
              <span style="font-size:10px; color:#94a3b8; font-weight:600;">QUICK TEST PRESETS:</span>
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                <button class="holo-btn holo-btn-secondary btn-quick-prompt" data-prompt="Explain your system architecture and Pepper's Ghost optics.">📐 Explain Optics</button>
                <button class="holo-btn holo-btn-secondary btn-quick-prompt" data-prompt="Summon your holographic wrist terminal and show stdout logs.">💻 Summon Terminal</button>
                <button class="holo-btn holo-btn-secondary btn-quick-prompt" data-prompt="Spawn a sub-agent worker node to compute data.">✨ Spawn Worker</button>
                <button class="holo-btn holo-btn-secondary btn-quick-prompt" data-prompt="Run self-diagnostic quantum heal routine.">❤️ Self Heal</button>
              </div>
            </div>

            <!-- Real-Time Activity Log -->
            <div style="margin-top:14px;">
              <div style="font-size:10.5px; color:#7dd3fc; font-weight:700; margin-bottom:6px;">CONVERSATIONAL STREAM LOG</div>
              <div id="ai-stream-log" style="height:160px; overflow-y:auto; background:rgba(0,0,0,0.45); border:1px solid rgba(0,240,255,0.15); border-radius:8px; padding:8px; font-family:var(--holo-font-mono); font-size:10px; color:#94a3b8;">
                <div style="color:#00f0ff;">[READY] AI Core Test Harness Initialized.</div>
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

    // Tab switcher
    const tabs = this.container.querySelectorAll('[data-ai-tab]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const k = tab.getAttribute('data-ai-tab') as 'llm' | 'tts' | 'test';
        this.switchTab(k);
      });
    });

    // Provider preset switcher
    const selectProvider = this.container.querySelector('#select-llm-provider') as HTMLSelectElement;
    const inputBaseUrl = this.container.querySelector('#input-llm-base-url') as HTMLInputElement;
    const inputModel = this.container.querySelector('#input-llm-model') as HTMLInputElement;
    const badgeProvider = this.container.querySelector('#badge-llm-provider');

    selectProvider?.addEventListener('change', () => {
      const p = selectProvider.value as LLMConfig['provider'];
      this.llmConfig.provider = p;
      if (badgeProvider) badgeProvider.textContent = p.toUpperCase();

      if (p === 'openai') {
        inputBaseUrl.value = 'https://api.openai.com/v1';
        inputModel.value = 'gpt-4o-mini';
      } else if (p === 'groq') {
        inputBaseUrl.value = 'https://api.groq.com/openai/v1';
        inputModel.value = 'llama-3.3-70b-versatile';
      } else if (p === 'openrouter') {
        inputBaseUrl.value = 'https://openrouter.ai/api/v1';
        inputModel.value = 'meta-llama/llama-3.3-70b-instruct';
      } else if (p === 'gemini') {
        inputBaseUrl.value = 'https://generativelanguage.googleapis.com/v1beta/openai/';
        inputModel.value = 'gemini-2.0-flash';
      } else if (p === 'ollama') {
        inputBaseUrl.value = 'http://localhost:11434/v1';
        inputModel.value = 'qwen2.5:7b';
      } else if (p === 'mock') {
        inputBaseUrl.value = 'http://localhost:8765/api';
        inputModel.value = 'xerokratos-simulator-v2';
      }
    });

    // Toggle API Key visibility
    const inputApiKey = this.container.querySelector('#input-llm-api-key') as HTMLInputElement;
    const btnToggleVis = this.container.querySelector('#btn-toggle-key-vis');
    btnToggleVis?.addEventListener('click', () => {
      if (inputApiKey) {
        inputApiKey.type = inputApiKey.type === 'password' ? 'text' : 'password';
      }
    });

    // Temperature slider
    const sliderTemp = this.container.querySelector('#slider-llm-temp') as HTMLInputElement;
    const lblTemp = this.container.querySelector('#lbl-val-temp');
    sliderTemp?.addEventListener('input', () => {
      if (lblTemp) lblTemp.textContent = sliderTemp.value;
      this.llmConfig.temperature = parseFloat(sliderTemp.value);
    });

    // Save LLM Config
    const btnSaveLLM = this.container.querySelector('#btn-save-llm-config');
    btnSaveLLM?.addEventListener('click', () => {
      this.llmConfig.baseUrl = inputBaseUrl.value.trim();
      this.llmConfig.apiKey = inputApiKey.value.trim();
      this.llmConfig.model = inputModel.value.trim();
      const taPrompt = this.container?.querySelector('#textarea-system-prompt') as HTMLTextAreaElement;
      if (taPrompt) this.llmConfig.systemPrompt = taPrompt.value.trim();

      this.persistConfig();
      this.callbacks.onSaveLLMConfig?.(this.llmConfig);
      this.log(`[LLM] Config saved: ${this.llmConfig.model} @ ${this.llmConfig.baseUrl}`);
      alert('LLM configuration saved and synced to hologram daemon!');
    });

    // Save TTS Config
    const selectEngine = this.container.querySelector('#select-tts-engine') as HTMLSelectElement;
    const selectVoice = this.container.querySelector('#select-tts-voice') as HTMLSelectElement;
    const selectRate = this.container.querySelector('#select-tts-rate') as HTMLSelectElement;
    const btnSaveTTS = this.container.querySelector('#btn-save-tts-config');

    btnSaveTTS?.addEventListener('click', () => {
      this.ttsConfig.engine = selectEngine.value as any;
      this.ttsConfig.voice = selectVoice.value;
      this.ttsConfig.rate = selectRate.value;
      this.persistConfig();
      this.callbacks.onSaveTTSConfig?.(this.ttsConfig);
      this.log(`[TTS] Voice profile updated: ${this.ttsConfig.voice} (${this.ttsConfig.engine})`);
      alert(`Applied TTS Voice: ${this.ttsConfig.voice}`);
    });

    // Test Voice Sample
    const btnPreviewVoice = this.container.querySelector('#btn-test-voice-sample');
    btnPreviewVoice?.addEventListener('click', () => {
      const v = selectVoice.value;
      const sampleText = "XeroKratos holographic voice synthesis locked and calibrated for Pepper's Ghost optical stage.";
      this.callbacks.onTestVoiceSample?.(sampleText, v);
    });

    // Prompt Test Sender
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

  public log(line: string): void {
    if (!this.container) return;
    const logBox = this.container.querySelector('#ai-stream-log');
    if (logBox) {
      const time = new Date().toTimeString().slice(0, 8);
      const row = document.createElement('div');
      row.style.marginBottom = '4px';
      row.innerHTML = `<span style="color:#64748b;">[${time}]</span> ${line}`;
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
