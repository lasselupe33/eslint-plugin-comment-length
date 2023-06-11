export enum MessageIds {
  EXCEEDS_MAX_LENGTH = "exceeds-max-length",
  CAN_COMPACT = "can-compact",
}

export const reportMessages = {
  [MessageIds.EXCEEDS_MAX_LENGTH]:
    "Comments may not exceed {{maxLength}} characters",
  [MessageIds.CAN_COMPACT]:
    "It is possible to make the current comment block more compact",
} as const;
