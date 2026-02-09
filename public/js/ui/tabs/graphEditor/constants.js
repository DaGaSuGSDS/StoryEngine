export const PANEL_WIDTHS = {
  LEFT: "220px",
  RIGHT: "260px",
};

export const DEFAULT_VALUES = {
  ANIMATION_DURATION: 800,
  WAIT_DURATION: 500,
  FADE_DURATION: 0,
  VOLUME: 1,
  NODE_OFFSET_X: 80,
  NODE_OFFSET_Y: 20,
  DUPLICATE_OFFSET_X: 30,
  DUPLICATE_OFFSET_Y: 30,
};

export const ANIMATION_SCOPE = {
  SCENE: "SCENE",
  CHARACTER: "CHARACTER",
  BOTH: "BOTH",
};

export const ANIMATION_TYPES = [
  {
    value: "fadeToBlack",
    label: "Fundido a negro (escena)",
    scope: "SCENE",
  },
  {
    value: "fadeFromBlack",
    label: "Desde negro (escena)",
    scope: "SCENE",
  },
  {
    value: "charMoveLeft",
    label: "Personaje a la izquierda",
    scope: "CHARACTER",
  },
  {
    value: "charMoveCenter",
    label: "Personaje al centro",
    scope: "CHARACTER",
  },
  {
    value: "charMoveRight",
    label: "Personaje a la derecha",
    scope: "CHARACTER",
  },
  {
    value: "charFadeIn",
    label: "Personaje aparece (opacity)",
    scope: "CHARACTER",
  },
  {
    value: "charFadeOut",
    label: "Personaje desaparece (opacity)",
    scope: "CHARACTER",
  },
];
