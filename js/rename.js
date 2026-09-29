(function attachQuickRename(root) {
  "use strict";

  const DEFAULT_OPTIONS = Object.freeze({
    start: 1,
    digits: 3,
    separator: "",
    baseName: "",
  });

  function toInteger(value, fallback) {
    if (value === "" || value === null || typeof value === "undefined") {
      return fallback;
    }
    const number = Number(value);
    return Number.isFinite(number) ? Math.trunc(number) : fallback;
  }

  function normalizeOptions(options = {}) {
    return {
      start: Math.max(0, toInteger(options.start, DEFAULT_OPTIONS.start)),
      digits: Math.min(8, Math.max(1, toInteger(options.digits, DEFAULT_OPTIONS.digits))),
      separator: typeof options.separator === "string" ? options.separator : DEFAULT_OPTIONS.separator,
      baseName: typeof options.baseName === "string" ? options.baseName.trim() : DEFAULT_OPTIONS.baseName,
    };
  }

  function formatSequenceNumber(index, options) {
    const normalized = normalizeOptions(options);
    return String(normalized.start + index).padStart(normalized.digits, "0");
  }

  function buildNewName(originalName, index, options) {
    const normalized = normalizeOptions(options);
    const baseName = normalized.baseName || String(originalName ?? "");
    const separator = normalized.baseName ? " " : normalized.separator;
    return `${baseName}${separator}${formatSequenceNumber(index, normalized)}`;
  }

  function buildRenamePlan(items, options) {
    if (!Array.isArray(items)) {
      throw new TypeError("items 必须是数组");
    }

    return items.map((item, index) => ({
      item,
      oldName: String(item?.name ?? ""),
      newName: buildNewName(item?.name, index, options),
    }));
  }

  const api = {
    DEFAULT_OPTIONS,
    normalizeOptions,
    formatSequenceNumber,
    buildNewName,
    buildRenamePlan,
  };

  root.QuickRename = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
