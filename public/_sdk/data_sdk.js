(() => {
  const STORAGE_KEY = "crowns.data";

  /** @type {any} */
  let handler = null;

  /** @returns {any[]} */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** @param {any[]} data */
  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /** @param {any[]} data */
  function emit(data) {
    if (handler && typeof handler.onDataChanged === "function") handler.onDataChanged(data);
  }

  function ok(value) {
    return { isOk: true, value };
  }

  function err(error) {
    return { isOk: false, error: error || "Unknown error" };
  }

  window.dataSdk = {
    /**
     * @param {{ onDataChanged: (data:any[]) => void }} h
     */
    async init(h) {
      handler = h;
      const data = load();
      emit(data);
      return ok(true);
    },

    /**
     * @param {any} obj
     */
    async create(obj) {
      try {
        const data = load();
        const __backendId = obj.__backendId || crypto.randomUUID();
        const record = { ...obj, __backendId };
        data.push(record);
        save(data);
        emit(data);
        return ok(record);
      } catch (e) {
        return err(String(e));
      }
    },

    /**
     * @param {any} obj
     */
    async update(obj) {
      try {
        const data = load();
        const id = obj.__backendId;
        if (!id) return err("Missing __backendId for update()");
        const idx = data.findIndex((d) => d && d.__backendId === id);
        if (idx === -1) return err("Record not found");
        data[idx] = { ...data[idx], ...obj, __backendId: id };
        save(data);
        emit(data);
        return ok(data[idx]);
      } catch (e) {
        return err(String(e));
      }
    },

    /**
     * @param {any} obj
     */
    async delete(obj) {
      try {
        const data = load();
        const id = obj.__backendId;
        if (!id) return err("Missing __backendId for delete()");
        const next = data.filter((d) => d && d.__backendId !== id);
        save(next);
        emit(next);
        return ok(true);
      } catch (e) {
        return err(String(e));
      }
    },
  };
})();

