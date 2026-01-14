(() => {
  const STORAGE_KEY = "crowns.config";

  /** @type {any} */
  let defaultConfig = {};
  /** @type {any} */
  let onConfigChange = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function save(cfg) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  }

  function merge(base, patch) {
    return { ...(base || {}), ...(patch || {}) };
  }

  window.elementSdk = {
    /** @type {any} */
    config: {},

    /**
     * @param {{
     *   defaultConfig: any,
     *   onConfigChange: (cfg:any) => void,
     *   mapToCapabilities?: (cfg:any) => any,
     *   mapToEditPanelValues?: (cfg:any) => any
     * }} opts
     */
    async init(opts) {
      defaultConfig = opts?.defaultConfig || {};
      onConfigChange = typeof opts?.onConfigChange === "function" ? opts.onConfigChange : null;
      this.config = merge(defaultConfig, load());
      save(this.config);
      if (onConfigChange) await onConfigChange(this.config);
      return { isOk: true, value: true };
    },

    /**
     * @param {any} patch
     */
    async setConfig(patch) {
      this.config = merge(this.config, patch);
      save(this.config);
      if (onConfigChange) await onConfigChange(this.config);
      return { isOk: true, value: this.config };
    },
  };
})();

