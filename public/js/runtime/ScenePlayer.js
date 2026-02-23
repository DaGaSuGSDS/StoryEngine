import { NODE_TYPES } from "../models/nodes/nodeTypes.js";
/**
 * ScenePlayer.js
 * Core engine component responsible for rendering and playing a single scene.
 */
import { DialogueHistory } from "./DialogueHistory.js";

export class ScenePlayer {
  /**
   * @param {Object} options
   * @param {Object} options.project
   * @param {Object} options.scene
   * @param {HTMLElement} options.container
   * @param {string} options.imageBaseUrl
   * @param {string} options.audioBaseUrl
   * @param {Function} options.onSceneChange
   * @param {Function} options.onNodeVisited
   * @param {Set} options.sharedFlags
   * @param {Map} options.sharedVariables
   * @param {string} options.startNodeId
   * @param {string} options.backgroundImageId
   * @param {Map} options.characterVisuals
   * @param {Object} options.dialogueHistory
   */
  constructor({
    project,
    scene,
    container,
    imageBaseUrl,
    audioBaseUrl,
    onSceneChange,
    onNodeVisited,
    sharedFlags,
    sharedVariables,
    startNodeId,
    backgroundImageId,
    characterVisuals,
    dialogueHistory,
  }) {
    this.project = project;
    this.scene = scene;
    this.container = container;
    this.imageBaseUrl = imageBaseUrl;
    this.audioBaseUrl = audioBaseUrl;
    this.onSceneChange = onSceneChange || null;
    this.onNodeVisited = onNodeVisited || null;

    // Configuración del proyecto (estilos, opciones)
    this.settings = project.settings || null;

    this.stageCanvas = null;
    this.stageCtx = null;
    this.stageWidth = 0;
    this.stageHeight = 0;
    this.pixelRatio = 1;
    this.isResizing = false;
    this.ui = null;

    this.flags = sharedFlags || new Set();
    this.characterState = new Map();
    this.characterVariables = sharedVariables || new Map();
    this.currentNodeId = startNodeId || scene.graph.startNodeId;
    this.stopped = false;
    this.backgroundImageId = backgroundImageId || scene.backgroundImageId;

    this.charactersById = new Map();
    this.stateByCharacterId = new Map();
    this.project.characters.forEach((char) => {
      this.charactersById.set(char.id, char);
      const statesMap = new Map();
      (char.states || []).forEach((state) => {
        if (state?.name) {
          statesMap.set(state.name, state);
        }
      });
      this.stateByCharacterId.set(char.id, statesMap);
    });

    this.imageCache = new Map();
    this.imageAssetsById = new Map();
    this.project.images.forEach((asset) => {
      this.imageAssetsById.set(asset.id, asset);
    });
    this.audioAssetsById = new Map();
    (this.project.audio || []).forEach((asset) => {
      this.audioAssetsById.set(asset.id, asset);
    });
    this.backgroundImage = null;
    this.characterVisuals = new Map();

    // Restaurar characterVisuals desde un guardado si se proporciona
    if (characterVisuals) {
      Object.keys(characterVisuals).forEach((charId) => {
        const rawVis = characterVisuals[charId] || {};
        this.characterVisuals.set(charId, {
          img: null,
          x: rawVis.x,
          alpha: rawVis.alpha,
          imageId: rawVis.imageId,
          heightPercent: this.normalizeHeightPercent(rawVis.heightPercent),
        });
      });
    }

    this.fadeAlpha = 0;
    this.resizeObserver = null;
    this.activeAudio = new Map();

    // Feature: Backlog (Historial de Diálogos)
    this.dialogueHistory = dialogueHistory || new DialogueHistory();
    this.pauseMenuOpen = false;
    this.pauseMenu = null;
  }

  /**
   * Stops the scene player.
   */
  stop() {
    this.stopped = true;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.stopAllAudio();

    // Limpiar event listeners
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
    }

    // Cerrar backlog si está abierto
    if (this.dialogueHistory) {
      this.dialogueHistory.hide();
    }
  }

  /**
   * Starts the scene player.
   */
  start() {
    this.initView();
    this.initCharacterState();
    this.setupKeyboardShortcuts();
    this.runLoop();
  }

  /**
   * Initializes the view (canvas and UI).
   */
  initView() {
    this.container.innerHTML = "";
    const stage = document.createElement("div");
    stage.className = "play-stage";
    const canvas = document.createElement("canvas");
    const ui = document.createElement("div");
    ui.className = "play-ui";

    stage.appendChild(canvas);
    stage.appendChild(ui);

    this.container.appendChild(stage);

    this.stageCanvas = canvas;
    this.stageCtx = canvas.getContext("2d");
    this.applyCanvasSizeFromContainer();
    this.ui = ui;
    this.setUIPositionClass();
    this.setupResizeObserver();

    // Cargar imagen de fondo (desde guardado o desde escena)
    const bgImageId = this.backgroundImageId || this.scene.backgroundImageId;
    if (bgImageId) {
      this.loadImageById(bgImageId).then((img) => {
        this.backgroundImage = img;
        this.drawStage();
      });
    } else {
      this.drawStage();
    }

    // Cargar imágenes de personajes restaurados
    this.characterVisuals.forEach((vis, charId) => {
      if (vis.imageId) {
        this.loadImageById(vis.imageId).then((img) => {
          vis.img = img;
          this.characterVisuals.set(charId, vis);
          this.drawStage();
        });
      }
    });
  }

  /**
   * Sets up the resize observer.
   */
  setupResizeObserver() {
    if (this.resizeObserver || !this.container) return;
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }

  /**
   * Handles resize events.
   */
  handleResize() {
    if (this.isResizing) return;
    this.isResizing = true;

    requestAnimationFrame(() => {
      const changed = this.applyCanvasSizeFromContainer();
      if (changed) {
        this.drawStage();
      }
      this.isResizing = false;
    });
  }

  /**
   * Applies canvas size based on container.
   * @returns {boolean}
   */
  applyCanvasSizeFromContainer() {
    if (!this.stageCanvas || !this.stageCtx || !this.container) return false;
    const dpr = window.devicePixelRatio || 1;
    const width = this.container.clientWidth || 800;
    const containerHeight =
      this.container.clientHeight || window.innerHeight || 400;
    const height = Math.max(260, Math.floor(containerHeight));

    const threshold = 2;
    const hasChange =
      Math.abs(width - (this.stageWidth || 0)) > threshold ||
      Math.abs(height - (this.stageHeight || 0)) > threshold ||
      dpr !== this.pixelRatio;

    if (!hasChange) return false;

    this.pixelRatio = dpr;
    this.stageWidth = width;
    this.stageHeight = height;

    this.stageCanvas.style.width = `${width}px`;
    this.stageCanvas.style.height = `${height}px`;
    this.stageCanvas.width = Math.max(1, Math.floor(width * dpr));
    this.stageCanvas.height = Math.max(1, Math.floor(height * dpr));
    this.stageCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  /**
   * Initializes character state from variables.
   */
  initCharacterState() {
    this.project.characters.forEach((c) => {
      let vars = this.characterVariables.get(c.id);
      if (!vars || typeof vars !== "object") {
        vars = {};
      }
      c.variables.forEach((v) => {
        if (vars[v.name] === undefined) {
          vars[v.name] = v.value;
        }
      });
      this.characterVariables.set(c.id, vars);
    });
  }

  /**
   * Loads an image by ID.
   * @param {string} imageId
   * @returns {Promise<HTMLImageElement>}
   */
  async loadImageById(imageId) {
    if (!imageId) return null;
    if (this.imageCache.has(imageId)) {
      const cached = this.imageCache.get(imageId);
      if (cached.loaded) return cached.img;
      return cached.promise;
    }
    const asset = this.imageAssetsById.get(imageId);
    if (!asset) return null;
    const img = new Image();
    const promise = new Promise((resolve, reject) => {
      const clearCache = () => {
        const current = this.imageCache.get(imageId);
        if (current && current.promise === promise) {
          this.imageCache.delete(imageId);
        }
      };
      img.onload = () => {
        const finalize = () => {
          this.imageCache.set(imageId, { img, loaded: true });
          resolve(img);
        };
        if (img.decode) {
          img
            .decode()
            .then(finalize)
            .catch(() => finalize());
        } else {
          finalize();
        }
      };
      img.onerror = (err) => {
        clearCache();
        reject(err);
      };
    });
    this.imageCache.set(imageId, { img, loaded: false, promise });
    img.src = this.imageBaseUrl + encodeURIComponent(asset.fileName);
    return promise;
  }

  /**
   * Draws the stage (background and characters).
   */
  drawStage() {
    if (!this.stageCtx || !this.stageCanvas) return;
    const ctx = this.stageCtx;
    const w = this.stageWidth || this.stageCanvas.width / this.pixelRatio;
    const h = this.stageHeight || this.stageCanvas.height / this.pixelRatio;
    ctx.clearRect(0, 0, w, h);

    if (this.backgroundImage) {
      const bg = this.backgroundImage;
      const scale = Math.max(w / bg.width, h / bg.height);
      const bw = bg.width * scale;
      const bh = bg.height * scale;
      const bx = (w - bw) / 2;
      const by = (h - bh) / 2;
      ctx.drawImage(bg, bx, by, bw, bh);
    } else {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
    }

    this.characterVisuals.forEach((vis) => {
      if (!vis.img || !vis.img.width || !vis.img.height) return;
      const img = vis.img;
      const targetPercent = this.normalizeHeightPercent(vis.heightPercent);
      const targetHeight = Math.max(1, (targetPercent / 100) * h);
      const maxWidth = w * 0.9;
      const scaleByHeight = targetHeight / img.height;
      const scaleByWidth = maxWidth / img.width;
      const scale = Math.min(scaleByHeight, scaleByWidth);
      const cw = img.width * scale;
      const ch = img.height * scale;
      const cx = (vis.x != null ? vis.x : 0.5) * w;
      const cy = h - ch;
      ctx.save();
      ctx.globalAlpha = vis.alpha != null ? vis.alpha : 1;
      ctx.drawImage(img, cx - cw / 2, cy, cw, ch);
      ctx.restore();
    });

    if (this.fadeAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  /**
   * Runs the game loop.
   */
  async runLoop() {
    while (!this.stopped && this.currentNodeId) {
      const node = this.scene.graph.getNode(this.currentNodeId);
      if (!node) break;

      // Notificar que se visitó este nodo
      if (this.onNodeVisited) {
        this.onNodeVisited(this.currentNodeId);
      }
      switch (node.type) {
        case NODE_TYPES.DIALOGUE:
          await this.handleDialogue(node);
          break;
        case NODE_TYPES.PLAYER_OPTIONS:
          await this.handleOptions(node);
          break;
        case NODE_TYPES.ANIMATION:
          await this.handleAnimation(node);
          break;
        case NODE_TYPES.AUDIO:
          this.handleAudio(node);
          break;
        case NODE_TYPES.WAIT:
          await this.handleWait(node);
          break;
        case NODE_TYPES.BACKGROUND_CHANGE:
          await this.handleBackgroundChange(node);
          break;
        case NODE_TYPES.SET_CHARACTER_STATE:
          await this.handleSetCharacterState(node);
          break;
        case NODE_TYPES.RANDOM:
          this.handleRandom(node);
          break;
        case NODE_TYPES.SET_FLAG:
          this.handleSetFlag(node);
          break;
        case NODE_TYPES.OPERATION:
          this.handleOperation(node);
          break;
        case NODE_TYPES.CONDITIONAL:
          this.handleConditional(node);
          break;
        case NODE_TYPES.FLAG_TEST:
          this.handleFlagTest(node);
          break;
        case NODE_TYPES.SCENE_CHANGE:
          this.handleSceneChange(node);
          break;
        default:
          this.currentNodeId = node.nextNodeIds[0] || null;
      }
    }
  }

  /**
   * Gets the dialogue position from node or default.
   * @param {Object} node
   * @returns {string}
   */
  getDialoguePosition(node = null) {
    const pos = node?.dialoguePosition;
    if (
      pos === "top" ||
      pos === "center" ||
      pos === "bottom"
    ) {
      return pos;
    }
    return "bottom";
  }

  /**
   * Sets the UI position class.
   * @param {string} position
   */
  setUIPositionClass(position) {
    if (!this.ui) return;
    const pos = position || this.getDialoguePosition();
    this.ui.className = `play-ui play-ui-${pos}`;
  }

  /**
   * Applies styles to the dialogue box.
   * @param {HTMLElement} element
   * @param {string} position
   */
  applyDialogueBoxStyle(element, position) {
    const pos = position || this.getDialoguePosition();
    element.classList.add("play-dialogue");
    if (pos === "full") {
      element.classList.add("play-dialogue-full");
    }
    element.style.pointerEvents = "auto";

    const settings = this.settings;
    if (!settings) {
      return;
    }

    element.style.backgroundColor = settings.dialogueBoxColor || "#1e1e1e";
    element.style.color = settings.dialogueTextColor || "#ffffff";
    element.style.fontSize = `${settings.dialogueFontSize || 18}px`;

    if (settings.dialogueStyle === "bubble") {
      element.style.borderRadius = "16px";
      element.style.padding = "16px";
      element.style.maxWidth = pos === "full" ? "none" : "600px";
      element.style.margin = "auto";
    } else if (settings.dialogueStyle === "minimal") {
      element.style.borderRadius = "0";
      element.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
      element.style.padding = "12px 0";
    } else {
      element.style.borderRadius = "4px";
      element.style.padding = "16px";
      element.style.border = "1px solid rgba(255,255,255,0.1)";
    }

    if (pos === "full") {
      element.style.maxWidth = "none";
      element.style.width = "100%";
    } else if (!element.style.maxWidth) {
      element.style.maxWidth = "1100px";
    }
  }

  clearUI() {
    if (this.ui) {
      this.ui.innerHTML = "";
    }
  }

  /**
   * Adds a continue button (for testing/fallback).
   * @returns {Promise}
   */
  addContinueButton() {
    return new Promise((resolve) => {
      const btn = document.createElement("button");
      btn.className = "btn small";
      btn.textContent = "Continuar";
      const handler = () => {
        btn.disabled = true;
        btn.removeEventListener("click", handler);
        resolve();
        if (btn.parentNode) {
          btn.parentNode.removeChild(btn);
        }
      };
      btn.addEventListener("click", handler, { once: true });
      this.ui.appendChild(btn);
    });
  }

  /**
   * Handles a dialogue node.
   * @param {Object} node
   */
  async handleDialogue(node) {
    const char = node.characterId
      ? this.charactersById.get(node.characterId) || null
      : null;
    if (char && node.characterState) {
      const byName = this.stateByCharacterId.get(char.id);
      const state =
        byName && node.characterState
          ? byName.get(node.characterState) || null
          : null;
      if (state && state.imageId) {
        const img = await this.loadImageById(state.imageId);
        const currentVis = this.characterVisuals.get(char.id);
        const heightPercent =
          state.heightPercent !== undefined
            ? this.normalizeHeightPercent(state.heightPercent)
            : this.normalizeHeightPercent(currentVis?.heightPercent);
        let vis = currentVis
          ? { ...currentVis }
          : { img: null, x: 0.5, alpha: 1 };
        vis.img = img;
        vis.imageId = state.imageId;
        vis.heightPercent = heightPercent;
        this.characterVisuals.set(char.id, vis);
        this.drawStage();
      }
    }

    this.clearUI();
    const position = this.getDialoguePosition(node);
    this.setUIPositionClass(position);
    const div = document.createElement("div");
    this.applyDialogueBoxStyle(div, position);

    const characterName = char ? char.name : node.characterId || "Narrador";
    const nameColor = this.settings?.dialogueNameColor || "#4fc3f7";

    div.innerHTML = `
      <div style="font-weight:600;color:${nameColor};">
        ${characterName}
      </div>
      <div id="dialogue-text" style="margin-top:8px;"></div>
    `;
    this.ui.appendChild(div);

    // Añadir al historial si está habilitado
    const fullText = node.text || "";
    if (this.settings?.enableBacklog) {
      this.dialogueHistory.addEntry(characterName, fullText);
    }

    // Efecto typewriter (texto letra por letra)
    const textSpeed = this.settings?.textSpeed ?? 50;
    const textElement = div.querySelector("#dialogue-text");

    if (textSpeed > 0) {
      await this.typewriterEffect(textElement, fullText, textSpeed);
    } else {
      textElement.textContent = fullText;
    }

    // Esperar clic o Enter para continuar
    await this.waitForAdvance(div);
    this.currentNodeId = node.nextNodeIds[0] || null;
  }

  /**
   * Waits for user interaction to advance.
   * @param {HTMLElement} element
   * @returns {Promise}
   */
  async waitForAdvance(element) {
    return new Promise((resolve) => {
      // Handler para clic
      const clickHandler = () => {
        cleanup();
        resolve();
      };

      // Handler para Enter
      const keyHandler = (e) => {
        if (e.key === "Enter") {
          cleanup();
          resolve();
        }
      };

      const cleanup = () => {
        element.removeEventListener("click", clickHandler);
        document.removeEventListener("keydown", keyHandler);
      };

      element.addEventListener("click", clickHandler);
      document.addEventListener("keydown", keyHandler);
      element.style.cursor = "pointer";
    });
  }

  /**
   * Runs typewriter effect on text.
   * @param {HTMLElement} element
   * @param {string} text
   * @param {number} speed
   * @returns {Promise}
   */
  async typewriterEffect(element, text, speed) {
    return new Promise((resolve) => {
      let index = 0;
      let skipTypewriter = false;
      let completed = false;

      // Permitir hacer clic para completar el texto instantáneamente
      const skipHandler = (e) => {
        e.stopPropagation(); // Evitar que active el avance
        if (!completed) {
          skipTypewriter = true;
        }
      };

      const keyHandler = (e) => {
        if (e.key === "Enter" && !completed) {
          e.stopPropagation();
          skipTypewriter = true;
        }
      };

      element.addEventListener("click", skipHandler);
      document.addEventListener("keydown", keyHandler);

      const interval = setInterval(() => {
        if (skipTypewriter || index >= text.length) {
          element.textContent = text;
          clearInterval(interval);
          element.removeEventListener("click", skipHandler);
          document.removeEventListener("keydown", keyHandler);
          completed = true;
          resolve();
          return;
        }

        element.textContent = text.substring(0, index + 1);
        index++;
      }, speed);
    });
  }

  /**
   * Handles player options node.
   * @param {Object} node
   */
  async handleOptions(node) {
    this.clearUI();
    const position = this.getDialoguePosition();
    this.setUIPositionClass(position);
    const wrapper = document.createElement("div");
    this.applyDialogueBoxStyle(wrapper, position);
    const list = document.createElement("div");
    list.className = "play-choices";
    let resolved = false;
    let resolveChoice;
    const choicePromise = new Promise((resolve) => {
      resolveChoice = resolve;
    });
    node.options.forEach((opt, index) => {
      const btn = document.createElement("button");
      btn.className = "btn small";
      btn.textContent = opt;
      btn.addEventListener(
        "click",
        () => {
          if (resolved) return;
          resolved = true;
          list.querySelectorAll("button").forEach((b) => {
            b.disabled = true;
          });
          const targetId =
            node.nextNodeIds[index] || node.nextNodeIds[0] || null;
          this.currentNodeId = targetId;
          resolveChoice();
        },
        { once: true }
      );
      list.appendChild(btn);
    });
    wrapper.appendChild(list);
    this.ui.appendChild(wrapper);
    await choicePromise;
  }

  async handleAnimation(node) {
    let steps = Array.isArray(node.animations) ? node.animations : null;

    if ((!steps || steps.length === 0) && node.animationType) {
      const effect =
        node.effect && typeof node.effect === "object" ? node.effect : {};
      const duration =
        effect.duration === undefined || effect.duration === null
          ? 800
          : effect.duration;
      steps = [
        {
          type: node.animationType,
          characterId: node.characterId || null,
          duration,
        },
      ];
    }

    if (steps && steps.length > 0) {
      const promises = steps.map((step) => {
        const type = step.type;
        const duration =
          step.duration === undefined || step.duration === null
            ? 800
            : step.duration;
        if (type === "fadeToBlack") {
          if (duration <= 0) {
            this.fadeAlpha = 1;
            this.drawStage();
            return Promise.resolve();
          }
          return this.playFade(0, 1, duration);
        }
        if (type === "fadeFromBlack") {
          if (duration <= 0) {
            this.fadeAlpha = 0;
            this.drawStage();
            return Promise.resolve();
          }
          return this.playFade(1, 0, duration);
        }
        if (
          type === "charMoveLeft" ||
          type === "charMoveCenter" ||
          type === "charMoveRight"
        ) {
          const charId = step.characterId;
          if (!charId) return Promise.resolve();
          let vis = this.characterVisuals.get(charId);
          if (!vis) {
            vis = { img: null, x: 0.5, alpha: 1 };
            this.characterVisuals.set(charId, vis);
          }
          const fromX = vis.x != null ? vis.x : 0.5;
          let toX = 0.5;
          if (type === "charMoveLeft") toX = 0.2;
          if (type === "charMoveCenter") toX = 0.5;
          if (type === "charMoveRight") toX = 0.8;
          if (duration <= 0) {
            vis.x = toX;
            this.characterVisuals.set(charId, vis);
            this.drawStage();
            return Promise.resolve();
          }
          return this.playMoveCharacter(charId, fromX, toX, duration);
        }
        if (type === "charFadeIn" || type === "charFadeOut") {
          const charId = step.characterId;
          if (!charId) return Promise.resolve();
          return (async () => {
            let vis = this.characterVisuals.get(charId);
            if (!vis || !vis.img) {
              const char = this.charactersById.get(charId) || null;
              let state = null;
              if (char) {
                const byName = this.stateByCharacterId.get(charId);
                const desiredName =
                  typeof step.stateName === "string" && step.stateName.length
                    ? step.stateName
                    : null;
                if (byName && desiredName) {
                  state = byName.get(desiredName) || null;
                }
                if (!state && char.states && char.states.length > 0) {
                  state = char.states[0];
                }
              }
              if (state && state.imageId) {
                const img = await this.loadImageById(state.imageId);
                vis = vis || {
                  img,
                  x: 0.5,
                  alpha: type === "charFadeIn" ? 0 : 1,
                };
                vis.img = img;
                vis.heightPercent =
                  state.heightPercent !== undefined
                    ? this.normalizeHeightPercent(state.heightPercent)
                    : this.normalizeHeightPercent(vis.heightPercent);
                this.characterVisuals.set(charId, vis);
              } else if (!vis) {
                vis = {
                  img: null,
                  x: 0.5,
                  alpha: type === "charFadeIn" ? 0 : 1,
                };
                this.characterVisuals.set(charId, vis);
              }
            }
            const currentVis = this.characterVisuals.get(charId);
            if (!currentVis) return;
            const fromA = type === "charFadeIn" ? 0 : currentVis.alpha ?? 1;
            const toA = type === "charFadeIn" ? 1 : 0;
            if (duration <= 0) {
              currentVis.alpha = toA;
              this.characterVisuals.set(charId, currentVis);
              this.drawStage();
              return;
            }
            return this.playCharacterAlpha(charId, fromA, toA, duration);
          })();
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    } else {
      const effect =
        node.effect && typeof node.effect === "object" ? node.effect : {};
      const duration =
        effect.duration === undefined || effect.duration === null
          ? 800
          : effect.duration;
      if (node.animationType === "fadeToBlack") {
        await this.playFade(0, 1, duration);
      } else if (node.animationType === "fadeFromBlack") {
        await this.playFade(1, 0, duration);
      } else if (
        node.animationType === "charMoveLeft" ||
        node.animationType === "charMoveCenter" ||
        node.animationType === "charMoveRight"
      ) {
        const charId = node.characterId;
        if (charId) {
          let vis = this.characterVisuals.get(charId);
          if (!vis) {
            vis = { img: null, x: 0.5, alpha: 1 };
            this.characterVisuals.set(charId, vis);
          }
          const fromX = vis.x != null ? vis.x : 0.5;
          let toX = 0.5;
          if (node.animationType === "charMoveLeft") toX = 0.2;
          if (node.animationType === "charMoveCenter") toX = 0.5;
          if (node.animationType === "charMoveRight") toX = 0.8;
          await this.playMoveCharacter(charId, fromX, toX, duration);
        }
      }
    }
    this.currentNodeId = node.nextNodeIds[0] || null;
  }

  handleAudio(node) {
    const action =
      node.action === "stop" || node.action === "stopAll"
        ? node.action
        : "play";

    if (action === "stopAll") {
      this.stopAllAudio();
    } else if (action === "stop") {
      if (node.audioId && this.activeAudio.has(node.audioId)) {
        const audio = this.activeAudio.get(node.audioId);
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch { }
        this.activeAudio.delete(node.audioId);
      }
    } else if (action === "play") {
      if (node.audioId && this.audioBaseUrl) {
        const asset = this.audioAssetsById.get(node.audioId);
        if (asset) {
          const url = this.audioBaseUrl + encodeURIComponent(asset.fileName);
          let audio = this.activeAudio.get(node.audioId);
          if (!audio) {
            audio = new Audio(url);
            this.activeAudio.set(node.audioId, audio);
          } else if (audio.src !== url) {
            audio.src = url;
          }
          audio.loop = !!node.loop;
          const vol =
            typeof node.volume === "number" && !Number.isNaN(node.volume)
              ? node.volume
              : 1;
          audio.volume = Math.max(0, Math.min(1, vol));
          try {
            audio.currentTime = 0;
          } catch { }
          audio.play().catch(() => { });
        }
      }
    }

    this.currentNodeId = node.nextNodeIds[0] || null;
  }

  async playFade(from, to, duration) {
    if (duration <= 0) {
      this.fadeAlpha = to;
      this.drawStage();
      return;
    }
    this.fadeAlpha = from;
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        if (this.stopped) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        this.fadeAlpha = from + (to - from) * t;
        this.drawStage();
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  async playMoveCharacter(charId, fromX, toX, duration) {
    const vis = this.characterVisuals.get(charId);
    if (!vis) return;
    if (duration <= 0) {
      vis.x = toX;
      this.characterVisuals.set(charId, vis);
      this.drawStage();
      return;
    }
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        if (this.stopped) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        const x = fromX + (toX - fromX) * t;
        const v = this.characterVisuals.get(charId);
        if (v) {
          v.x = x;
          this.characterVisuals.set(charId, v);
        }
        this.drawStage();
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  async playCharacterAlpha(charId, fromA, toA, duration) {
    const vis = this.characterVisuals.get(charId);
    if (!vis) return;
    if (duration <= 0) {
      vis.alpha = toA;
      this.characterVisuals.set(charId, vis);
      this.drawStage();
      return;
    }
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (now) => {
        if (this.stopped) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        const a = fromA + (toA - fromA) * t;
        const v = this.characterVisuals.get(charId);
        if (v) {
          v.alpha = a;
          this.characterVisuals.set(charId, v);
        }
        this.drawStage();
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  /**
   * Normalizes height percent.
   * @param {string|number} rawValue
   * @returns {number}
   */
  normalizeHeightPercent(rawValue) {
    const parsed = Number.parseFloat(rawValue);
    if (Number.isNaN(parsed)) {
      return 80;
    }
    return Math.min(100, Math.max(0, parsed));
  }

  /**
   * Stops all active audio.
   */
  stopAllAudio() {
    if (!this.activeAudio) return;
    this.activeAudio.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch { }
    });
    this.activeAudio.clear();
  }

  handleSetFlag(node) {
    if (node.flagId) {
      this.flags.add(node.flagId);
    }
    this.currentNodeId = node.nextNodeIds[0] || null;
  }

  handleOperation(node) {
    const vars = this.characterVariables.get(node.characterId);
    if (vars && node.variableName) {
      const current = vars[node.variableName] || 0;
      const v = node.value || 0;
      let result = current;
      switch (node.operation) {
        case "+":
          result = current + v;
          break;
        case "-":
          result = current - v;
          break;
        case "*":
          result = current * v;
          break;
        case "/":
          result = v !== 0 ? current / v : current;
          break;
        default:
          break;
      }
      vars[node.variableName] = result;
    }
    this.currentNodeId = node.nextNodeIds[0] || null;
  }

  handleConditional(node) {
    const c1Vars = this.characterVariables.get(node.characterIds[0]);
    let left = c1Vars ? c1Vars[node.character1Variable] : undefined;
    let right;
    if (node.compareType === "variable") {
      const c2Vars = this.characterVariables.get(node.characterIds[1]);
      right = c2Vars ? c2Vars[node.character2Variable] : undefined;
    } else {
      right = node.value;
    }
    let result = false;
    if (left !== undefined && right !== undefined) {
      switch (node.condition) {
        case "==":
          result = left === right;
          break;
        case ">=":
          result = left >= right;
          break;
        case "<=":
          result = left <= right;
          break;
        case ">":
          result = left > right;
          break;
        case "<":
          result = left < right;
          break;
        default:
          break;
      }
    }
    this.currentNodeId = result
      ? node.nextNodeIds[0] || null
      : node.nextNodeIds[1] || null;
  }

  handleFlagTest(node) {
    const has = node.flagId && this.flags.has(node.flagId);
    this.currentNodeId = has
      ? node.nextNodeIds[0] || null
      : node.nextNodeIds[1] || null;
  }

  handleSceneChange(node) {
    const targetId = node.targetSceneId;
    if (targetId && this.onSceneChange) {
      this.stopped = true;
      this.onSceneChange(targetId);
    }
    this.currentNodeId = null;
  }

  async handleWait(node) {
    const duration =
      typeof node.duration === "number" && !Number.isNaN(node.duration)
        ? node.duration
        : 0;
    if (duration > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, duration);
      });
    }
    this.currentNodeId = node.nextNodeIds[0] || null;
  }

  async handleBackgroundChange(node) {
    const imageId = node.imageId || null;
    const fadeDuration =
      typeof node.fadeDuration === "number" && !Number.isNaN(node.fadeDuration)
        ? node.fadeDuration
        : 0;

    if (fadeDuration > 0) {
      const half = Math.max(1, Math.floor(fadeDuration / 2));
      await this.playFade(this.fadeAlpha, 1, half);
      if (imageId) {
        const img = await this.loadImageById(imageId);
        this.backgroundImage = img;
      } else {
        this.backgroundImage = null;
      }
      this.drawStage();
      await this.playFade(1, 0, half);
    } else {
      if (imageId) {
        const img = await this.loadImageById(imageId);
        this.backgroundImage = img;
      } else {
        this.backgroundImage = null;
      }
      this.drawStage();
    }

    this.currentNodeId = node.nextNodeIds[0] || null;
  }

  async handleSetCharacterState(node) {
    const changes = Array.isArray(node.changes) ? node.changes : [];
    if (changes.length === 0) {
      this.currentNodeId = node.nextNodeIds[0] || null;
      return;
    }

    const tasks = changes.map(async (change) => {
      const charId = change.characterId;
      const stateName = change.stateName;
      if (!charId || !stateName) return;
      const statesMap = this.stateByCharacterId.get(charId);
      const state = statesMap ? statesMap.get(stateName) : null;
      if (!state || !state.imageId) return;
      const img = await this.loadImageById(state.imageId);
      const currentVis = this.characterVisuals.get(charId);
      const heightPercent =
        state.heightPercent !== undefined
          ? this.normalizeHeightPercent(state.heightPercent)
          : this.normalizeHeightPercent(currentVis?.heightPercent);
      let vis = currentVis
        ? { ...currentVis }
        : { img: null, x: 0.5, alpha: 1 };
      vis.img = img;
      vis.imageId = state.imageId;
      vis.heightPercent = heightPercent;
      this.characterVisuals.set(charId, vis);
    });

    await Promise.all(tasks);
    this.drawStage();
    this.currentNodeId = node.nextNodeIds[0] || null;
  }

  handleRandom(node) {
    const ids = (node.nextNodeIds || []).filter((id) => !!id);
    if (ids.length === 0) {
      this.currentNodeId = null;
      return;
    }
    const idx = Math.floor(Math.random() * ids.length);
    this.currentNodeId = ids[idx] || null;
  }

  /**
   * Configura atajos de teclado
   */
  setupKeyboardShortcuts() {
    this.keydownHandler = (e) => {
      // ESC para Menú de Pausa
      if (e.key === "Escape") {
        if (this.pauseMenuOpen) {
          this.closePauseMenu();
        } else {
          this.showPauseMenu();
        }
      }
    };

    document.addEventListener("keydown", this.keydownHandler);
  }

  /**
   * Muestra el menú de pausa
   */
  showPauseMenu() {
    if (this.pauseMenuOpen) return;

    this.pauseMenuOpen = true;

    const pauseSettings = this.settings || {};
    const overlayBg = this.toRgba(
      pauseSettings.pauseOverlayColor || "#000000",
      pauseSettings.pauseOverlayOpacity ?? 0.85
    );
    const menuBg = pauseSettings.pauseMenuBgColor || "#1e1e1e";
    const menuBorder = this.toRgba(
      pauseSettings.pauseMenuBorderColor || "#ffffff",
      pauseSettings.pauseMenuBorderOpacity ?? 0.1
    );
    const menuRadius = pauseSettings.pauseMenuRadius ?? 8;
    const titleColor = pauseSettings.pauseTitleColor || "#ffffff";

    const buttonBg = pauseSettings.pauseButtonBgColor || "#2a2a2a";
    const buttonHoverBg = pauseSettings.pauseButtonHoverBgColor || "#3a3a3a";
    const buttonTextColor = pauseSettings.pauseButtonTextColor || "#e0e0e0";
    const buttonBorder = this.toRgba(
      pauseSettings.pauseButtonBorderColor || "#9e9e9e",
      pauseSettings.pauseButtonBorderOpacity ?? 0.45
    );
    const buttonRadius = pauseSettings.pauseButtonRadius ?? 4;

    // Crear overlay
    const overlay = document.createElement("div");
    overlay.className = "pause-menu-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${overlayBg};
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Crear menú
    const menu = document.createElement("div");
    menu.className = "pause-menu";
    menu.style.cssText = `
      background: ${menuBg};
      border: 1px solid ${menuBorder};
      border-radius: ${menuRadius}px;
      padding: 32px;
      min-width: 300px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    // Título
    const title = document.createElement("h2");
    title.textContent = "Pausa";
    title.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 24px;
      color: ${titleColor};
      text-align: center;
    `;
    menu.appendChild(title);

    // Botón: Continuar
    const continueBtn = this.createMenuButton(
      "Continuar",
      () => {
        this.closePauseMenu();
      },
      {
        bgColor: buttonBg,
        hoverBgColor: buttonHoverBg,
        textColor: buttonTextColor,
        borderColor: buttonBorder,
        radius: buttonRadius,
      }
    );
    menu.appendChild(continueBtn);

    // Botón: Historial de Diálogos (si está habilitado)
    if (this.settings?.enableBacklog) {
      const backlogBtn = this.createMenuButton(
        "Historial de Diálogos",
        () => {
          this.closePauseMenu();
          this.showBacklog();
        },
        {
          bgColor: buttonBg,
          hoverBgColor: buttonHoverBg,
          textColor: buttonTextColor,
          borderColor: buttonBorder,
          radius: buttonRadius,
        }
      );
      menu.appendChild(backlogBtn);
    }

    overlay.appendChild(menu);

    // Event listener para cerrar con click fuera
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.closePauseMenu();
      }
    });

    this.pauseMenu = overlay;
    document.body.appendChild(overlay);
  }

  /**
   * Cierra el menú de pausa
   */
  closePauseMenu() {
    if (!this.pauseMenuOpen || !this.pauseMenu) return;

    this.pauseMenu.remove();
    this.pauseMenu = null;
    this.pauseMenuOpen = false;
  }

  /**
   * Crea un botón del menú de pausa
   */
  createMenuButton(text, onClick, styleOverrides = {}) {
    const btn = document.createElement("button");
    btn.textContent = text;
    const bg =
      styleOverrides.bgColor !== undefined ? styleOverrides.bgColor : "#2a2a2a";
    const hoverBg =
      styleOverrides.hoverBgColor !== undefined
        ? styleOverrides.hoverBgColor
        : "#3a3a3a";
    const textColor = styleOverrides.textColor || "#e0e0e0";
    const borderColor =
      styleOverrides.borderColor || "rgba(158, 158, 158, 0.45)";
    const radius =
      styleOverrides.radius !== undefined ? styleOverrides.radius : 4;
    btn.style.cssText = `
      width: 100%;
      background: ${bg};
      border: 1px solid ${borderColor};
      color: ${textColor};
      padding: 12px 20px;
      border-radius: ${radius}px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.2s;
      margin-bottom: 12px;
    `;
    btn.onmouseover = () => {
      btn.style.background = hoverBg;
      btn.style.borderColor = textColor;
    };
    btn.onmouseout = () => {
      btn.style.background = bg;
      btn.style.borderColor = borderColor;
    };
    btn.onclick = onClick;
    return btn;
  }

  toRgba(color, opacity = 1) {
    if (!color) return `rgba(0,0,0,${opacity})`;
    if (color.startsWith("rgb")) return color;
    let hex = color.replace("#", "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const int = parseInt(hex, 16);
    if (Number.isNaN(int)) {
      return `rgba(0,0,0,${opacity})`;
    }
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Muestra el historial de diálogos
   */
  showBacklog() {
    const nameColor = this.settings?.dialogueNameColor || "#4fc3f7";
    this.dialogueHistory.show(nameColor);
  }
}
