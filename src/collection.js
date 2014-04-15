(function () {

	var guid = function () {
		var ret = "";
		for (var i=0; i<8; i++) {
			ret += Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return ret;
	};

	var isEqual = function (obj1, obj2) {
		var str1 = JSON.stringify(obj1);
		var str2 = JSON.stringify(obj2);
		return str1 === str2;
	};

	var Collection = function (name, asteroidRef, DbConstructor) {
		this.name = name;
		this.asteroid = asteroidRef;
		this.db = new DbConstructor();
		this._events = {};
	};
	Collection.prototype.constructor = Collection;

	Collection.prototype._localInsert = function (item, fromRemote) {
		var existing = this.db.get(item._id);
		if (fromRemote && isEqual(existing, item)) return;
		if (!fromRemote && existing) throw new Error("Item exists.");
		this.db.set(item._id, item);
		this._emit("change");
	};
	Collection.prototype._remoteInsert = function (item) {
		var self = this;
		var methodName = "/" + self.name + "/insert";
		this.asteroid.ddp.method(methodName, [item], function (err, res) {
			if (err) {
				self._localRemove(item._id);
				throw err;
			}
		});
	};
	Collection.prototype.insert = function (item) {
		if (!item._id) item._id = guid();
		this._localInsert(item, false);
		this._remoteInsert(item);
	};

	var removal_suffix = "__del__";
	Collection.prototype._localRemove = function (id) {
		var existing = this.db.get(id);
		if (!existing) {
			console.warn("Item not present.");
			return;
		}
		this.db.del(id);
		this.db.del(id + removal_suffix);
		this._emit("change");
	};
	Collection.prototype._localRestoreRemoved = function (id) {
		var existing = this.db.get(id + removal_suffix);
		this.db.set(id, existing);
		this.db.del(id + removal_suffix);
		this._emit("change");
	};
	Collection.prototype._localMarkForRemoval = function (id) {
		var existing = this.db.get(id);
		if (!existing) {
			console.warn("Item not present.");
			return;
		}
		this.db.set(id + removal_suffix, existing);
		this.db.del(id);
		this._emit("change");
	};
	Collection.prototype._remoteRemove = function (id) {
		var self = this;
		var methodName = "/" + self.name + "/remove";
		this.asteroid.ddp.method(methodName, [{_id: id}], function (err, res) {
			if (err) {
				self._localRestoreRemoved(id);
				throw err;
			}
		});
	};
	Collection.prototype.remove = function (id) {
		this._localMarkForRemoval(id);
		this._remoteRemove(id);
	};

	var update_suffix = "__upd__";
	Collection.prototype._localUpdate = function (id, fields) {
		var existing = this.db.get(id);
		if (!existing) {
			console.warn("Item not present.");
			return;
		}
		for (var field in fields) {
			existsing[field] = fields[field];
		}
		this.db.set(id, existing);
		this.db.del(id + update_suffix);
		this._emit("change");
	};
	Collection.prototype._localRestoreUpdated = function (id) {
		var existing = this.db.get(id + update_suffix);
		this.db.set(id, existing);
		this.db.del(id + update_suffix);
		this._emit("change");
	};
	Collection.prototype._localMarkForUpdate = function (id, item) {
		var existing = this.db.get(id);
		if (!existing) {
			console.warn("Item not present.");
			return;
		}
		this.db.set(id + update_suffix, existing);
		this.db.set(id, item);
		this._emit("change");
	};
	Collection.prototype._remoteUpdate = function (id, item) {
		var self = this;
		var methodName = "/" + self.name + "/update";
		this.asteroid.ddp.method(methodName, [{_id: id}, {$set: item}], function (err, res) {
			if (err) {
				self._localRestoreUpdated(id);
				throw err;
			}
		});
	};
	Collection.prototype.update = function (id) {
		this._localMarkForUpdate(id);
		this._remoteUpdate(id);
	};

    Collection.prototype.on = function (name, handler) {
        this._events[name] = this._events[name] || [];
        this._events[name].push(handler);
    };
    Collection.prototype.off = function (name, handler) {
        if (!this._events[name]) return;
        this._events[name].splice(this._events[name].indexOf(handler), 1);
    };
    Collection.prototype._emit = function (name /* , arguments */) {
        if (!this._events[name]) return;
        var args = arguments;
        var self = this;
        this._events[name].forEach(function (handler) {
            handler.apply(self, Array.prototype.slice.call(args, 1));
        });
    };

	window.Asteroid.Collection = Collection;

})();