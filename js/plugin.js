(function quickRenamePlugin() {
  "use strict";

  const MAX_PREVIEW_ITEMS = 80;
  const state = {
    items: [],
    isLoading: false,
    isRenaming: false,
    didFinish: false,
    resultPlan: null,
    requestId: 0,
  };

  const elements = {
    baseName: document.querySelector("#base-name"),
    start: document.querySelector("#start-number"),
    digits: document.querySelector("#digit-count"),
    separator: document.querySelector("#separator"),
    refresh: document.querySelector("#refresh-button"),
    rename: document.querySelector("#rename-button"),
    renameClose: document.querySelector("#rename-close-button"),
    buttonLabel: document.querySelector("#rename-button .button-label"),
    closeButtonLabel: document.querySelector("#rename-close-button .button-label"),
    count: document.querySelector("#selection-count"),
    list: document.querySelector("#preview-list"),
    overflow: document.querySelector("#preview-overflow"),
    empty: document.querySelector("#empty-state"),
    loading: document.querySelector("#loading-state"),
    status: document.querySelector("#status"),
  };

  function getOptions(commit = false) {
    const normalized = QuickRename.normalizeOptions({
      baseName: elements.baseName.value,
      start: elements.start.value,
      digits: elements.digits.value,
      separator: elements.separator.value,
    });

    if (commit) {
      elements.baseName.value = normalized.baseName;
      elements.start.value = String(normalized.start);
      elements.digits.value = String(normalized.digits);
    }
    return normalized;
  }

  function fileName(name, extension) {
    const cleanExtension = String(extension ?? "").replace(/^\./, "");
    return cleanExtension ? `${name}.${cleanExtension}` : name;
  }

  function setStatus(message, tone) {
    elements.status.textContent = message;
    elements.status.dataset.tone = tone;
    elements.status.hidden = !message;
  }

  function setControlsDisabled(disabled) {
    elements.baseName.disabled = disabled;
    elements.start.disabled = disabled;
    elements.digits.disabled = disabled;
    elements.separator.disabled = disabled;
    elements.refresh.disabled = disabled;
  }

  function appendPreviewRow(entry) {
    const row = document.createElement("li");
    row.className = "preview-row";

    const before = document.createElement("span");
    before.className = "preview-name preview-name--before";
    before.textContent = fileName(entry.oldName, entry.item.ext);
    before.title = before.textContent;

    const arrow = document.createElement("span");
    arrow.className = "preview-arrow";
    arrow.textContent = "→";
    arrow.setAttribute("aria-hidden", "true");

    const after = document.createElement("span");
    after.className = "preview-name preview-name--after";
    after.textContent = fileName(entry.newName, entry.item.ext);
    after.title = after.textContent;

    row.append(before, arrow, after);
    elements.list.append(row);
  }

  function renderPreview() {
    const hasItems = state.items.length > 0;
    const isIdle = !state.isLoading;

    elements.loading.hidden = isIdle;
    elements.empty.hidden = !isIdle || hasItems;
    elements.list.replaceChildren();
    elements.list.hidden = !isIdle || !hasItems;
    elements.overflow.hidden = true;
    elements.count.textContent = state.isLoading ? "读取中…" : `${state.items.length} 个条目`;
    const options = getOptions();
    elements.separator.disabled = state.isLoading || state.isRenaming || Boolean(options.baseName);
    elements.separator.title = options.baseName ? "统一名称模式固定使用空格分隔编号" : "";

    if (!isIdle || !hasItems) {
      elements.rename.disabled = true;
      elements.renameClose.disabled = true;
      elements.buttonLabel.textContent = state.isLoading ? "正在读取…" : "确认重命名";
      elements.closeButtonLabel.textContent = state.isLoading ? "正在读取…" : "重命名并关闭";
      return;
    }

    let plan = state.resultPlan || QuickRename.buildRenamePlan(state.items, options);
    const alreadyNumbered =
      !state.resultPlan && Boolean(options.baseName) && plan.every((entry) => entry.oldName === entry.newName);

    if (alreadyNumbered) {
      plan = plan.map((entry) => ({ ...entry, newName: entry.oldName }));
    }
    plan.slice(0, MAX_PREVIEW_ITEMS).forEach(appendPreviewRow);

    if (plan.length > MAX_PREVIEW_ITEMS) {
      elements.overflow.textContent = `仅预览前 ${MAX_PREVIEW_ITEMS} 个，执行时会处理全部 ${plan.length} 个条目。`;
      elements.overflow.hidden = false;
    }

    const actionsDisabled = state.isRenaming || state.didFinish || alreadyNumbered;
    elements.rename.disabled = actionsDisabled;
    elements.renameClose.disabled = actionsDisabled;
    elements.buttonLabel.textContent = state.didFinish
      ? "已完成"
      : state.isRenaming
        ? "正在重命名…"
        : alreadyNumbered
          ? "已是当前编号"
          : `重命名 ${state.items.length} 个条目`;
    elements.closeButtonLabel.textContent = state.didFinish
      ? "已完成"
      : state.isRenaming
        ? "正在重命名…"
        : alreadyNumbered
          ? "已是当前编号"
          : "重命名并关闭";
    elements.rename.classList.toggle("is-busy", state.isRenaming);
    elements.renameClose.classList.toggle("is-busy", state.isRenaming);
  }

  async function loadSelection() {
    const requestId = ++state.requestId;
    state.isLoading = true;
    state.didFinish = false;
    state.resultPlan = null;
    setStatus("", "success");
    setControlsDisabled(true);
    renderPreview();

    try {
      if (typeof eagle === "undefined" || !eagle.item?.getSelected) {
        throw new Error("未检测到 Eagle Plugin API，请在 Eagle 中运行此插件。");
      }

      const items = await eagle.item.getSelected();
      if (requestId !== state.requestId) return;
      state.items = Array.isArray(items) ? items : [];
    } catch (error) {
      if (requestId !== state.requestId) return;
      state.items = [];
      setStatus(error?.message || "读取选中条目失败。", "error");
    } finally {
      if (requestId !== state.requestId) return;
      state.isLoading = false;
      setControlsDisabled(false);
      renderPreview();
    }
  }

  async function showNotification(message) {
    if (typeof eagle === "undefined" || !eagle.notification?.show) return;

    try {
      await eagle.notification.show({
        title: "eagle-quick-rename",
        body: message,
        mute: true,
        duration: 3000,
      });
    } catch (error) {
      console.warn("无法显示 Eagle 通知：", error);
    }
  }

  async function hidePluginWindow() {
    if (typeof eagle === "undefined" || !eagle.window?.hide) return false;

    try {
      await eagle.window.hide();
      return true;
    } catch (error) {
      console.warn("无法隐藏插件窗口：", error);
      return false;
    }
  }

  async function renameSelected({ closeAfterSuccess = false } = {}) {
    if (state.isRenaming || state.didFinish || state.items.length === 0) return;

    const plan = QuickRename.buildRenamePlan(state.items, getOptions(true));
    const failures = [];
    let successCount = 0;

    state.isRenaming = true;
    setControlsDisabled(true);
    setStatus("", "success");
    renderPreview();

    for (const entry of plan) {
      entry.item.name = entry.newName;

      try {
        await entry.item.save();
        successCount += 1;
      } catch (error) {
        entry.item.name = entry.oldName;
        failures.push({ entry, error });
      }
    }

    state.isRenaming = false;
    state.didFinish = true;
    state.resultPlan = plan;
    setControlsDisabled(false);

    if (failures.length === 0) {
      const customName = getOptions().baseName;
      const message = customName
        ? `已将 ${successCount} 个条目统一重命名并编号。`
        : `已为 ${successCount} 个条目追加编号。`;
      setStatus(`${message} 如需再次处理，请刷新当前选择。`, "success");
      await showNotification(message);
    } else {
      const firstFailure = failures[0].entry.oldName || "未命名条目";
      const message = `已完成 ${successCount} 个，${failures.length} 个失败；第一个失败项：${firstFailure}。`;
      setStatus(message, "error");
      await showNotification(message);
    }

    renderPreview();

    if (failures.length === 0 && closeAfterSuccess) {
      const didHide = await hidePluginWindow();
      if (!didHide) {
        setStatus("重命名已完成，但窗口未能自动关闭，请手动关闭。", "error");
      }
    }
  }

  function syncTheme(themeName) {
    const normalized = String(themeName || "").toUpperCase();
    const darkThemes = new Set(["DARK", "GRAY", "BLUE", "PURPLE"]);
    document.documentElement.dataset.theme = darkThemes.has(normalized) ? "dark" : "light";
  }

  function bindEvents() {
    [elements.baseName, elements.start, elements.digits, elements.separator].forEach((control) => {
      control.addEventListener("input", () => {
        if (!state.isRenaming && !state.didFinish) renderPreview();
      });
      control.addEventListener("change", () => {
        if (!state.isRenaming && !state.didFinish) {
          getOptions(true);
          renderPreview();
        }
      });
    });

    elements.refresh.addEventListener("click", loadSelection);
    elements.rename.addEventListener("click", () => {
      renameSelected();
    });
    elements.renameClose.addEventListener("click", () => {
      renameSelected({ closeAfterSuccess: true });
    });

    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !elements.rename.disabled) {
        event.preventDefault();
        renameSelected();
      }
    });
  }

  bindEvents();

  if (typeof eagle !== "undefined") {
    syncTheme(eagle.app?.theme);
    eagle.onPluginCreate(loadSelection);
    eagle.onPluginRun(loadSelection);
    eagle.onPluginShow(loadSelection);
    if (typeof eagle.onThemeChanged === "function") {
      eagle.onThemeChanged(syncTheme);
    }
  } else {
    state.isLoading = false;
    setControlsDisabled(false);
    setStatus("未检测到 Eagle Plugin API，请在 Eagle 中运行此插件。", "error");
    renderPreview();
  }
})();
