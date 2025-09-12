export const MessageIds = {
  EXCEEDS_MAX_LENGTH: "exceeds-max-length",
  CAN_COMPACT: "can-compact",
} as const;

export type MessageIds = typeof MessageIds[keyof typeof MessageIds];

export const reportMessages = {
  [MessageIds.EXCEEDS_MAX_LENGTH]:
    "Comments may not exceed {{maxLength}} characters",
  [MessageIds.CAN_COMPACT]:
    "It is possible to make the current comment block more compact",
} as const;
