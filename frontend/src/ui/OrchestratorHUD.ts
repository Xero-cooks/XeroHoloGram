/**
 * Cybernetic Hologram Orchestrator HUD
 * Glassmorphic HUD overlay for physical optical stage controls and avatar orchestration.
 */

export class OrchestratorHUD {
  private container: HTMLElement;
  public element: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = document.createElement('div');
    this.element.id = 'hologram-orchestrator-hud';
    this.setupStyles();
    this.buildDOM();
    this.container.appendChild(this.element);
  }

  private setupStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #hologram-orchestrator-hud {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #00e5ff;
        pointer-events: none;
      }
      .hud-panel {
        background: rgba(4, 14, 24, 0.78);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 229, 255, 0.28);
        border-radius: 10px;
        padding: 16px;
        pointer-events: auto;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 12px rgba(0, 229, 255, 0.1);
        width: 320px;
      }
      .hud-title {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(0, 229, 255, 0.2);
        padding-bottom: 8px;
      }
      .hud-badge {
        font-size: 10px;
        padding: 2px 6px;
        background: rgba(0, 229, 255, 0.15);
        border-radius: 4px;
        border: 1px solid rgba(0, 229, 255, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  private buildDOM(): void {
    this.element.innerHTML = `
      <div class="hud-panel">
        <div class="hud-title">
          <span>XeroHoloGram</span>
          <span class="hud-badge">60 FPS OPTICAL STAGE</span>
        </div>
        <div id="hud-content-mount"></div>
      </div>
    `;
  }

  public getMountPoint(): HTMLElement {
    return this.element.querySelector('#hud-content-mount') as HTMLElement;
  }
}
