/**
 * nodeFieldRenderers.js
 * Renders input fields for different node types in the inspector.
 */
import { NODE_TYPES } from "../../../models/nodes/nodeTypes.js";
import { createLabeledInput, createSelectField } from "../../uiHelpers.js";
import { createCharacterStateSelector } from "./graphEditorHelpers.js";
import {
  DEFAULT_VALUES,
  ANIMATION_SCOPE,
  ANIMATION_TYPES,
} from "./constants.js";
import { escapeHtml } from "../../../utils/sanitize.js";

/**
 * Renders specific fields based on node type.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
export function renderNodeTypeFields(node, container, projectStore) {
  switch (node.type) {
    case NODE_TYPES.DIALOGUE:
      renderDialogueFields(node, container, projectStore);
      break;
    case NODE_TYPES.ANIMATION:
      renderAnimationFields(node, container, projectStore);
      break;
    case NODE_TYPES.PLAYER_OPTIONS:
      renderPlayerOptionsInfo(container);
      break;
    case NODE_TYPES.SET_FLAG:
      renderSetFlagFields(node, container, projectStore);
      break;
    case NODE_TYPES.OPERATION:
      renderOperationFields(node, container, projectStore);
      break;
    case NODE_TYPES.CONDITIONAL:
      renderConditionalFields(node, container, projectStore);
      break;
    case NODE_TYPES.FLAG_TEST:
      renderFlagTestFields(node, container, projectStore);
      break;
    case NODE_TYPES.SCENE_CHANGE:
      renderSceneChangeFields(node, container, projectStore);
      break;
    case NODE_TYPES.AUDIO:
      renderAudioFields(node, container, projectStore);
      break;
    case NODE_TYPES.WAIT:
      renderWaitFields(node, container, projectStore);
      break;
    case NODE_TYPES.BACKGROUND_CHANGE:
      renderBackgroundChangeFields(node, container, projectStore);
      break;
    case NODE_TYPES.SET_CHARACTER_STATE:
      renderSetCharacterStateFields(node, container, projectStore);
      break;
    case NODE_TYPES.RANDOM:
      renderRandomInfo(container);
      break;
    default:
      container.innerHTML =
        '<div class="muted">Nodo genérico sin propiedades específicas.</div>';
  }
}

/**
 * Renders fields for Dialogue node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderDialogueFields(node, container, projectStore) {
  if (!node.dialoguePosition) {
    node.dialoguePosition = "bottom";
  }
  const { charSelect, stateSelect, fillStateOptions } =
    createCharacterStateSelector(
      container,
      node,
      projectStore,
      "characterId",
      "characterState",
      "Personaje"
    );

  const div = document.createElement("div");
  div.className = "panel-section";
  const textLabel = document.createElement("label");
  textLabel.textContent = "Texto";
  const textArea = document.createElement("textarea");
  textArea.id = "dialogue-text";
  textArea.rows = 4;
  textArea.value = node.text || "";
  div.appendChild(textLabel);
  div.appendChild(textArea);
  container.appendChild(div);

  const positionDiv = document.createElement("div");
  positionDiv.className = "panel-section";
  const positionLabel = document.createElement("label");
  positionLabel.textContent = "Posición del diálogo";
  const positionSelect = document.createElement("select");
  [
    { value: "bottom", label: "Abajo" },
    { value: "center", label: "Centro" },
    { value: "top", label: "Arriba" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    positionSelect.appendChild(o);
  });
  positionSelect.value = node.dialoguePosition || "bottom";
  positionDiv.appendChild(positionLabel);
  positionDiv.appendChild(positionSelect);
  container.appendChild(positionDiv);

  charSelect.addEventListener("change", () => {
    node.characterId = charSelect.value || null;
    node.characterState = "";
    fillStateOptions();
    projectStore.notify();
  });
  stateSelect.addEventListener("change", () => {
    node.characterState = stateSelect.value || "";
    projectStore.notify();
  });
  textArea.addEventListener("change", () => {
    node.text = textArea.value || "";
    projectStore.notify();
  });
  positionSelect.addEventListener("change", () => {
    node.dialoguePosition = positionSelect.value || "bottom";
    projectStore.notify();
  });
}

/**
 * Renders fields for Animation node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderAnimationFields(node, container, projectStore) {
  if (!Array.isArray(node.animations)) {
    node.animations = [];
    if (node.animationType) {
      node.animations.push({
        type: node.animationType,
        characterId: node.characterId || null,
        duration:
          (node.effect && node.effect.duration) ||
          DEFAULT_VALUES.ANIMATION_DURATION,
      });
    }
  }

  const charOptions = projectStore.characters.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const list = document.createElement("div");
  container.appendChild(list);

  const buildRow = (idx) => {
    const anim = node.animations[idx];
    const row = document.createElement("div");
    row.className = "panel-section";

    const labelEl = document.createElement("label");
    labelEl.textContent = `Animación ${idx + 1}`;
    row.appendChild(labelEl);

    const typeSelect = document.createElement("select");
    ANIMATION_TYPES.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      typeSelect.appendChild(o);
    });
    typeSelect.value = anim.type || "fadeToBlack";
    row.appendChild(typeSelect);

    const durationInput = document.createElement("input");
    durationInput.type = "number";
    durationInput.value =
      anim.duration !== undefined && anim.duration !== null
        ? anim.duration
        : DEFAULT_VALUES.ANIMATION_DURATION;
    durationInput.style.width = "80px";
    durationInput.style.marginLeft = "4px";
    durationInput.addEventListener("change", () => {
      const v = parseInt(durationInput.value || "0", 10);
      anim.duration = isNaN(v) ? DEFAULT_VALUES.ANIMATION_DURATION : v;
      projectStore.notify();
    });
    row.appendChild(durationInput);

    const charSelect = document.createElement("select");
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "(sin personaje)";
    charSelect.appendChild(empty);
    charOptions.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      charSelect.appendChild(o);
    });
    charSelect.value = anim.characterId || "";
    charSelect.style.marginLeft = "4px";
    charSelect.addEventListener("change", () => {
      anim.characterId = charSelect.value || null;
      fillStateOptions();
      projectStore.notify();
    });
    row.appendChild(charSelect);

    const stateDiv = document.createElement("div");
    stateDiv.className = "panel-section";
    stateDiv.style.marginTop = "4px";
    const stateLabel = document.createElement("label");
    stateLabel.textContent = "Estado personaje";
    const stateSelect = document.createElement("select");
    stateDiv.appendChild(stateLabel);
    stateDiv.appendChild(stateSelect);
    row.appendChild(stateDiv);

    const fillStateOptions = () => {
      const selectedCharId = charSelect.value || anim.characterId;
      const character = projectStore.characters.find(
        (c) => c.id === selectedCharId
      );
      stateSelect.innerHTML = "";
      const emptyOpt = document.createElement("option");
      emptyOpt.value = "";
      emptyOpt.textContent = "(ninguno)";
      stateSelect.appendChild(emptyOpt);
      if (character && Array.isArray(character.states)) {
        character.states.forEach((s) => {
          const opt = document.createElement("option");
          opt.value = s.name;
          opt.textContent = s.name;
          stateSelect.appendChild(opt);
        });
      }
      stateSelect.value = anim.stateName || "";
    };

    fillStateOptions();

    stateSelect.addEventListener("change", () => {
      anim.stateName = stateSelect.value || "";
      projectStore.notify();
    });

    const getAnimScope = (type) => {
      const meta = ANIMATION_TYPES.find((a) => a.value === type);
      return meta ? meta.scope : ANIMATION_SCOPE.BOTH;
    };

    const updateCharacterControlsVisibility = () => {
      const scope = getAnimScope(anim.type || "fadeToBlack");
      const isSceneAnim = scope === ANIMATION_SCOPE.SCENE;
      if (isSceneAnim) {
        charSelect.style.display = "none";
        stateDiv.style.display = "none";
      } else {
        charSelect.style.display = "";
        stateDiv.style.display = "";
      }
    };

    typeSelect.addEventListener("change", () => {
      anim.type = typeSelect.value;
      const scope = getAnimScope(anim.type || "fadeToBlack");
      const isSceneAnim = scope === ANIMATION_SCOPE.SCENE;
      if (isSceneAnim) {
        anim.characterId = null;
        anim.stateName = "";
      }
      updateCharacterControlsVisibility();
      projectStore.notify();
    });

    updateCharacterControlsVisibility();

    const delBtn = document.createElement("button");
    delBtn.className = "btn small";
    delBtn.textContent = "X";
    delBtn.style.marginLeft = "4px";
    delBtn.addEventListener("click", () => {
      node.animations.splice(idx, 1);
      projectStore.notify();
    });
    row.appendChild(delBtn);

    list.appendChild(row);
  };

  node.animations.forEach((_, idx) => buildRow(idx));

  const addDiv = document.createElement("div");
  addDiv.className = "panel-section";
  const addBtn = document.createElement("button");
  addBtn.className = "btn small";
  addBtn.style.width = "100%";
  addBtn.textContent = "Añadir animación";
  addBtn.addEventListener("click", () => {
    node.animations.push({
      type: "fadeToBlack",
      characterId: null,
      duration: DEFAULT_VALUES.ANIMATION_DURATION,
    });
    projectStore.notify();
  });
  addDiv.appendChild(addBtn);
  container.appendChild(addDiv);
}

/**
 * Renders info for PlayerOptions node.
 * @param {HTMLElement} container
 */
function renderPlayerOptionsInfo(container) {
  const info = document.createElement("div");
  info.className = "panel-section muted";
  info.textContent =
    "Añade las opciones y sus nodos destino en la sección inferior.";
  container.appendChild(info);
}

/**
 * Renders fields for SetFlag node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderSetFlagFields(node, container, projectStore) {
  const flagOptions = projectStore.flags.map((f) => ({
    value: f.id,
    label: f.name,
  }));
  const flagSelect = createSelectField({
    container,
    label: "Flag",
    id: "flag-id",
    options: flagOptions,
    value: node.flagId,
    allowEmpty: true,
  });
  flagSelect.addEventListener("change", () => {
    node.flagId = flagSelect.value || null;
    projectStore.notify();
  });
}

/**
 * Renders fields for Operation node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderOperationFields(node, container, projectStore) {
  const charOptions = projectStore.characters.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const charSelect = createSelectField({
    container,
    label: "Personaje",
    id: "op-character",
    options: charOptions,
    value: node.characterId,
    allowEmpty: true,
  });

  const varDiv = document.createElement("div");
  varDiv.className = "panel-section";
  const varLabel = document.createElement("label");
  varLabel.textContent = "Variable";
  const varSelect = document.createElement("select");
  varSelect.id = "op-variable";
  varDiv.appendChild(varLabel);
  varDiv.appendChild(varSelect);
  container.appendChild(varDiv);

  const updateVarOptions = () => {
    const selectedCharId = charSelect.value || node.characterId;
    const character = projectStore.characters.find(
      (c) => c.id === selectedCharId
    );
    const current = node.variableName || "";

    varSelect.innerHTML = "";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "(ninguna)";
    varSelect.appendChild(emptyOpt);

    let hasCurrent = current === "";
    if (character && Array.isArray(character.variables)) {
      character.variables.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = v.name;
        if (v.name === current) {
          hasCurrent = true;
        }
        varSelect.appendChild(opt);
      });
    }

    if (!hasCurrent && current) {
      const opt = document.createElement("option");
      opt.value = current;
      opt.textContent = `${escapeHtml(current)} (no definida en personaje)`;
      varSelect.appendChild(opt);
    }

    varSelect.value = current;
  };

  updateVarOptions();

  varSelect.addEventListener("change", () => {
    node.variableName = varSelect.value || "";
    projectStore.notify();
  });

  const opDiv = document.createElement("div");
  opDiv.className = "panel-section";
  const opLabel = document.createElement("label");
  opLabel.textContent = "Operación";
  const opSelect = document.createElement("select");
  opSelect.id = "op-op";
  [
    { value: "+", label: "+ (sumar)" },
    { value: "-", label: "- (restar)" },
    { value: "*", label: "* (multiplicar)" },
    { value: "/", label: "/ (dividir)" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    opSelect.appendChild(o);
  });
  opSelect.value = node.operation || "+";
  opDiv.appendChild(opLabel);
  opDiv.appendChild(opSelect);
  container.appendChild(opDiv);

  const valInput = createLabeledInput({
    container,
    label: "Valor",
    id: "op-value",
    value: node.value,
    type: "number",
  });
  charSelect.addEventListener("change", () => {
    node.characterId = charSelect.value || null;
    if (!node.characterId) {
      node.variableName = "";
    }
    updateVarOptions();
    projectStore.notify();
  });
  opSelect.addEventListener("change", () => {
    node.operation = opSelect.value || "+";
    projectStore.notify();
  });
  valInput.addEventListener("change", () => {
    node.value = parseFloat(valInput.value || "0");
    projectStore.notify();
  });
}

/**
 * Renders fields for Conditional node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderConditionalFields(node, container, projectStore) {
  const charOptions = projectStore.characters.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const compareTypeDiv = document.createElement("div");
  compareTypeDiv.className = "panel-section";
  const compareTypeLabel = document.createElement("label");
  compareTypeLabel.textContent = "Comparar con";
  const compareTypeSelect = document.createElement("select");
  compareTypeSelect.id = "cond-type";
  [
    { value: "value", label: "Valor fijo" },
    { value: "variable", label: "Variable de personaje" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    compareTypeSelect.appendChild(o);
  });
  const currentType = node.compareType === "variable" ? "variable" : "value";
  compareTypeSelect.value = currentType;
  compareTypeDiv.appendChild(compareTypeLabel);
  compareTypeDiv.appendChild(compareTypeSelect);
  container.appendChild(compareTypeDiv);

  const conditionalBody = document.createElement("div");
  container.appendChild(conditionalBody);

  const renderConditionalBody = () => {
    conditionalBody.innerHTML = "";
    const compareType =
      compareTypeSelect.value === "variable" ? "variable" : "value";
    node.compareType = compareType;

    const ids = Array.isArray(node.characterIds)
      ? node.characterIds
      : [null, null];

    const c1Select = createSelectField({
      container: conditionalBody,
      label: "Personaje 1",
      id: "cond-c1",
      options: charOptions,
      value: ids[0],
      allowEmpty: true,
    });

    const var1Div = document.createElement("div");
    var1Div.className = "panel-section";
    const var1Label = document.createElement("label");
    var1Label.textContent = "Variable personaje 1";
    const var1Select = document.createElement("select");
    var1Select.id = "cond-var1";
    var1Div.appendChild(var1Label);
    var1Div.appendChild(var1Select);
    conditionalBody.appendChild(var1Div);

    const updateVar1Options = () => {
      const cid = c1Select.value || ids[0] || null;
      const character = projectStore.characters.find((c) => c.id === cid);
      const current = node.character1Variable || "";

      var1Select.innerHTML = "";
      const emptyOpt = document.createElement("option");
      emptyOpt.value = "";
      emptyOpt.textContent = "(ninguna)";
      var1Select.appendChild(emptyOpt);

      let hasCurrent = current === "";
      if (character && Array.isArray(character.variables)) {
        character.variables.forEach((v) => {
          const opt = document.createElement("option");
          opt.value = v.name;
          opt.textContent = v.name;
          if (v.name === current) {
            hasCurrent = true;
          }
          var1Select.appendChild(opt);
        });
      }

      if (!hasCurrent && current) {
        const opt = document.createElement("option");
        opt.value = current;
        opt.textContent = `${escapeHtml(current)} (no definida en personaje)`;
        var1Select.appendChild(opt);
      }

      var1Select.value = current;
    };

    updateVar1Options();

    const condDiv = document.createElement("div");
    condDiv.className = "panel-section";
    const condLabel = document.createElement("label");
    condLabel.textContent = "Condición";
    const condSelect = document.createElement("select");
    condSelect.id = "cond-op";
    const condOptions = [
      { value: "==", label: "== (igual)" },
      { value: ">=", label: ">= (mayor o igual)" },
      { value: "<=", label: "<= (menor o igual)" },
      { value: ">", label: "> (mayor)" },
      { value: "<", label: "< (menor)" },
    ];
    condOptions.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      condSelect.appendChild(o);
    });
    let currentCond = node.condition || "==";
    if (!condOptions.some((opt) => opt.value === currentCond)) {
      currentCond = "==";
    }
    condSelect.value = currentCond;
    condDiv.appendChild(condLabel);
    condDiv.appendChild(condSelect);
    conditionalBody.appendChild(condDiv);

    if (compareType === "variable") {
      const c2Select = createSelectField({
        container: conditionalBody,
        label: "Personaje 2",
        id: "cond-c2",
        options: charOptions,
        value: ids[1],
        allowEmpty: true,
      });

      const var2Div = document.createElement("div");
      var2Div.className = "panel-section";
      const var2Label = document.createElement("label");
      var2Label.textContent = "Variable personaje 2";
      const var2Select = document.createElement("select");
      var2Select.id = "cond-var2";
      var2Div.appendChild(var2Label);
      var2Div.appendChild(var2Select);
      conditionalBody.appendChild(var2Div);

      const updateVar2Options = () => {
        const cid = c2Select.value || ids[1] || null;
        const character = projectStore.characters.find((c) => c.id === cid);
        const current = node.character2Variable || "";

        var2Select.innerHTML = "";
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "(ninguna)";
        var2Select.appendChild(emptyOpt);

        let hasCurrent = current === "";
        if (character && Array.isArray(character.variables)) {
          character.variables.forEach((v) => {
            const opt = document.createElement("option");
            opt.value = v.name;
            opt.textContent = v.name;
            if (v.name === current) {
              hasCurrent = true;
            }
            var2Select.appendChild(opt);
          });
        }

        if (!hasCurrent && current) {
          const opt = document.createElement("option");
          opt.value = current;
          opt.textContent = `${escapeHtml(current)} (no definida en personaje)`;
          var2Select.appendChild(opt);
        }

        var2Select.value = current;
      };

      updateVar2Options();

      c2Select.addEventListener("change", () => {
        const idsArr = Array.isArray(node.characterIds)
          ? node.characterIds
          : [null, null];
        idsArr[1] = c2Select.value || null;
        node.characterIds = idsArr;
        if (!node.characterIds[1]) {
          node.character2Variable = "";
        }
        updateVar2Options();
        projectStore.notify();
      });

      var2Select.addEventListener("change", () => {
        node.character2Variable = var2Select.value || "";
        projectStore.notify();
      });
    } else {
      const valInput = createLabeledInput({
        container: conditionalBody,
        label: "Valor fijo",
        id: "cond-value",
        value: node.value,
        type: "number",
      });
      valInput.addEventListener("change", () => {
        node.value = parseFloat(valInput.value || "0");
        projectStore.notify();
      });
    }

    c1Select.addEventListener("change", () => {
      const idsArr = Array.isArray(node.characterIds)
        ? node.characterIds
        : [null, null];
      idsArr[0] = c1Select.value || null;
      node.characterIds = idsArr;
      if (!node.characterIds[0]) {
        node.character1Variable = "";
      }
      updateVar1Options();
      projectStore.notify();
    });

    var1Select.addEventListener("change", () => {
      node.character1Variable = var1Select.value || "";
      projectStore.notify();
    });

    condSelect.addEventListener("change", () => {
      node.condition = condSelect.value || "==";
      projectStore.notify();
    });
  };

  renderConditionalBody();

  compareTypeSelect.addEventListener("change", () => {
    node.compareType =
      compareTypeSelect.value === "variable" ? "variable" : "value";
    renderConditionalBody();
    projectStore.notify();
  });
}

/**
 * Renders fields for FlagTest node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderFlagTestFields(node, container, projectStore) {
  const flagOptions = projectStore.flags.map((f) => ({
    value: f.id,
    label: f.name,
  }));
  const flagSelect = createSelectField({
    container,
    label: "Flag",
    id: "flag-test-id",
    options: flagOptions,
    value: node.flagId,
    allowEmpty: true,
  });
  flagSelect.addEventListener("change", () => {
    node.flagId = flagSelect.value || null;
    projectStore.notify();
  });
}

/**
 * Renders fields for SceneChange node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderSceneChangeFields(node, container, projectStore) {
  const sceneOptions = projectStore.scenes.map((s) => ({
    value: s.id,
    label: s.name,
  }));
  const sceneSelect = createSelectField({
    container,
    label: "Escena destino",
    id: "scene-target-id",
    options: sceneOptions,
    value: node.targetSceneId,
    allowEmpty: true,
  });
  sceneSelect.addEventListener("change", () => {
    node.targetSceneId = sceneSelect.value || null;
    projectStore.notify();
  });
}

/**
 * Renders fields for Audio node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderAudioFields(node, container, projectStore) {
  const audioOptions = projectStore.audio.map((a) => ({
    value: a.id,
    label: a.name,
  }));
  const audioSelect = createSelectField({
    container,
    label: "Clip de audio",
    id: "audio-id",
    options: audioOptions,
    value: node.audioId,
    allowEmpty: true,
  });
  audioSelect.addEventListener("change", () => {
    node.audioId = audioSelect.value || null;
    projectStore.notify();
  });

  const actionDiv = document.createElement("div");
  actionDiv.className = "panel-section";
  const actionLabel = document.createElement("label");
  actionLabel.textContent = "Acción";
  const actionSelect = document.createElement("select");
  [
    ["play", "Reproducir"],
    ["stop", "Detener clip"],
    ["stopAll", "Detener todo"],
  ].forEach(([value, label]) => {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = label;
    actionSelect.appendChild(o);
  });
  actionSelect.value =
    node.action === "stop" || node.action === "stopAll" ? node.action : "play";
  actionDiv.appendChild(actionLabel);
  actionDiv.appendChild(actionSelect);
  container.appendChild(actionDiv);

  const loopDiv = document.createElement("div");
  loopDiv.className = "panel-section";
  const loopLabel = document.createElement("label");
  loopLabel.textContent = "Repetir en bucle";
  const loopInput = document.createElement("input");
  loopInput.type = "checkbox";
  loopInput.checked = !!node.loop;
  loopDiv.appendChild(loopLabel);
  loopDiv.appendChild(loopInput);
  container.appendChild(loopDiv);

  const volDiv = document.createElement("div");
  volDiv.className = "panel-section";
  const volLabel = document.createElement("label");
  volLabel.textContent = "Volumen";
  const volWrapper = document.createElement("div");
  volWrapper.style.display = "flex";
  volWrapper.style.alignItems = "center";

  const volRange = document.createElement("input");
  volRange.type = "range";
  volRange.min = "0";
  volRange.max = "100";
  volRange.step = "1";
  const currentVolume =
    typeof node.volume === "number" && !Number.isNaN(node.volume)
      ? Math.round(node.volume * 100)
      : 100;
  volRange.value = String(currentVolume);

  const volValue = document.createElement("span");
  volValue.style.marginLeft = "8px";
  volValue.textContent = `${currentVolume}%`;

  const updateVolumeFromRange = () => {
    const raw = parseInt(volRange.value || "100", 10);
    const clamped = Number.isNaN(raw) ? 100 : Math.max(0, Math.min(100, raw));
    node.volume = clamped / 100;
    volValue.textContent = `${clamped}%`;
  };

  volRange.addEventListener("input", () => {
    updateVolumeFromRange();
  });
  volRange.addEventListener("change", () => {
    updateVolumeFromRange();
    projectStore.notify();
  });

  volWrapper.appendChild(volRange);
  volWrapper.appendChild(volValue);
  volDiv.appendChild(volLabel);
  volDiv.appendChild(volWrapper);
  container.appendChild(volDiv);

  actionSelect.addEventListener("change", () => {
    node.action = actionSelect.value || "play";
    projectStore.notify();
  });
  loopInput.addEventListener("change", () => {
    node.loop = !!loopInput.checked;
    projectStore.notify();
  });
}

/**
 * Renders fields for Wait node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderWaitFields(node, container, projectStore) {
  const durInput = createLabeledInput({
    container,
    label: "Duración (ms)",
    id: "wait-duration",
    value: node.duration != null ? node.duration : DEFAULT_VALUES.WAIT_DURATION,
    type: "number",
  });
  durInput.addEventListener("change", () => {
    const v = parseInt(durInput.value || "0", 10);
    node.duration = Number.isNaN(v) ? 0 : v;
    projectStore.notify();
  });
}

/**
 * Renders fields for BackgroundChange node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderBackgroundChangeFields(node, container, projectStore) {
  const imgOptions = projectStore.images.map((img) => ({
    value: img.id,
    label: img.name,
  }));
  const imgSelect = createSelectField({
    container,
    label: "Nuevo fondo",
    id: "bg-image-id",
    options: imgOptions,
    value: node.imageId,
    allowEmpty: true,
  });
  imgSelect.addEventListener("change", () => {
    node.imageId = imgSelect.value || null;
    projectStore.notify();
  });

  const durInput = createLabeledInput({
    container,
    label: "Duración fundido (ms, 0=instantáneo)",
    id: "bg-fade-duration",
    value:
      node.fadeDuration != null
        ? node.fadeDuration
        : DEFAULT_VALUES.FADE_DURATION,
    type: "number",
  });
  durInput.addEventListener("change", () => {
    const v = parseInt(durInput.value || "0", 10);
    node.fadeDuration = Number.isNaN(v) ? 0 : v;
    projectStore.notify();
  });
}

/**
 * Renders fields for SetCharacterState node.
 * @param {Object} node
 * @param {HTMLElement} container
 * @param {Object} projectStore
 */
function renderSetCharacterStateFields(node, container, projectStore) {
  if (!Array.isArray(node.changes)) {
    node.changes = [];
  }

  const list = document.createElement("div");
  container.appendChild(list);

  const rebuild = () => {
    list.innerHTML = "";
    node.changes.forEach((change, idx) => {
      const row = document.createElement("div");
      row.className = "panel-section";

      const charOptions = projectStore.characters.map((c) => ({
        value: c.id,
        label: c.name,
      }));
      const charSelect = createSelectField({
        container: row,
        label: `Personaje ${idx + 1}`,
        id: `char-state-char-${idx}`,
        options: charOptions,
        value: change.characterId,
        allowEmpty: true,
      });

      const stateDiv = document.createElement("div");
      stateDiv.className = "panel-section";
      const stateLabel = document.createElement("label");
      stateLabel.textContent = "Estado";
      const stateSelect = document.createElement("select");
      stateDiv.appendChild(stateLabel);
      stateDiv.appendChild(stateSelect);
      row.appendChild(stateDiv);

      const fillStates = () => {
        const cid = charSelect.value || change.characterId;
        const character = projectStore.characters.find((c) => c.id === cid);
        stateSelect.innerHTML = "";
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = "(ninguno)";
        stateSelect.appendChild(empty);
        if (character && Array.isArray(character.states)) {
          character.states.forEach((s) => {
            const o = document.createElement("option");
            o.value = s.name;
            o.textContent = s.name;
            stateSelect.appendChild(o);
          });
        }
        stateSelect.value = change.stateName || "";
      };

      fillStates();

      charSelect.addEventListener("change", () => {
        change.characterId = charSelect.value || null;
        change.stateName = "";
        fillStates();
        projectStore.notify();
      });

      stateSelect.addEventListener("change", () => {
        change.stateName = stateSelect.value || "";
        projectStore.notify();
      });

      const delBtn = document.createElement("button");
      delBtn.className = "btn small";
      delBtn.textContent = "Eliminar";
      delBtn.style.marginLeft = "4px";
      delBtn.addEventListener("click", () => {
        node.changes.splice(idx, 1);
        projectStore.notify();
        rebuild();
      });
      row.appendChild(delBtn);

      list.appendChild(row);
    });
  };

  rebuild();

  const addDiv = document.createElement("div");
  addDiv.className = "panel-section";
  const addBtn = document.createElement("button");
  addBtn.className = "btn small";
  addBtn.style.width = "100%";
  addBtn.textContent = "Añadir personaje";
  addBtn.addEventListener("click", () => {
    node.changes.push({ characterId: null, stateName: "" });
    projectStore.notify();
    rebuild();
  });
  addDiv.appendChild(addBtn);
  container.appendChild(addDiv);
}

/**
 * Renders info for Random node.
 * @param {HTMLElement} container
 */
function renderRandomInfo(container) {
  const info = document.createElement("div");
  info.className = "panel-section muted";
  info.textContent = "Este nodo elige aleatoriamente una de sus ramas.";
  container.appendChild(info);
}
