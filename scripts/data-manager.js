// DATA MANAGER (landmarks). Same job as before, but the data lives in MySQL via api/landmarks/*.php.
// A small in-memory cache keeps the UI fast; the server is the source of truth.

const DataManager = {
    cache: [],
    loaded: false,

    reset() {
        this.cache = [];
        this.loaded = false;
    },

    async load() {
        const res = await API.get('landmarks/list.php');
        this.cache = res.landmarks;
        this.loaded = true;
        return this.cache;
    },

        getLandmarks() {
        return this.cache;
    },

    getLandmark(id) {
        return this.cache.find(lm => Number(lm.id) === Number(id)) || null;
    },

    async searchLandmarks(query, limit = 8) {
        if (!this.loaded) {
            await this.load();
        }

        const normalized = query.trim().toLowerCase();
        if (!normalized) return [];

        return this.cache
            .map(lm => {
                const name = String(lm.name || '');
                const lowerName = name.toLowerCase();

                let score = 0;

                if (lowerName === normalized) score = 100;
                else if (lowerName.startsWith(normalized)) score = 80;
                else if (lowerName.split(/\s+/).some(word => word.startsWith(normalized))) score = 60;
                else if (lowerName.includes(normalized)) score = 40;

                return { lm, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score || a.lm.name.localeCompare(b.lm.name))
            .slice(0, limit)
            .map(item => ({
                id: item.lm.id,
                name: item.lm.name,
                lat: Number(item.lm.lat),
                lng: Number(item.lm.lng),
                category: item.lm.category || 'other',
                isPublic: item.lm.isPublic
            }))
            .filter(lm => Number.isFinite(lm.lat) && Number.isFinite(lm.lng));
    },

    async addLandmark(name, category, description, lat, lng, isPublic = false) {
        const res = await API.post('landmarks/add.php', { name, category, description, lat, lng, public: isPublic });
        const lm = res.landmark;
        this.cache.unshift(lm);
        return lm;
    },

    async updateLandmark(id, name, category, description) {
        const res = await API.post('landmarks/update.php', { id: Number(id), name, category, description });
        const lm = this.getLandmark(id);
        if (lm) Object.assign(lm, res.landmark);
        return lm;
    },

    async deleteLandmark(id) {
        await API.post('landmarks/delete.php', { id: Number(id) });
        this.cache = this.cache.filter(l => l.id !== Number(id));
        return true;
    }
};
