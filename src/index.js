import EventEmitter from 'events';

import Logger from '@nti/util-logger';

const logger = Logger.get('nti:storage');

const TEST_KEY = '__nti_test';

const readOnly = value => ({ configurable: false, enumerable: false, writable: false, value });

class MemoryStore {
	constructor () {
		Object.defineProperties(this, {
			data: readOnly([])
		});
	}

	get length () {
		return this.data.length;
	}

	key (index) {
		return (this.data[index] || {}).key;
	}

	index (key) {
		return this.data.findIndex(x => x.key === key);
	}

	getItem (key) {
		return (this.data[this.index(key)] || {}).value;
	}

	setItem (key, value) {
		const i = this.index(key);
		const r = this.data;
		if (i >= 0) {
			r[i].value = value;
		} else {
			r.push({key, value});
		}
	}

	removeItem (key) {
		const i = this.index(key);
		if (i >= 0) {
			this.data.splice(i, 1);
		}
	}

	clear () {
		this.data.splice(0);
	}
}


class Storage extends EventEmitter {

	constructor (type) {
		super();
		let backer;
		try {
			let store = global[type];

			//Some browsers expose the interfaces, but throw when accessed... snif them out.
			store.setItem(TEST_KEY, 1);
			store.getItem(TEST_KEY);
			store.removeItem(TEST_KEY);

			//all good
			global.addEventListener('storage', this.onStorageChanged);
			backer = store;
		} catch (e) {
			logger.debug('Using a fake in-memory store because the host does not support storage.');
			backer = new MemoryStore ();
		}

		Object.defineProperty(this, 'backer', readOnly(backer));
	}

	onStorageChanged = (e) => {
		if (e.storageArea === this.backer) {
			this.emit('change', e);
		}
	}

	onChange (key = null, newValue = null, oldValue = null) {
		//Browsers don't fire the storage event on the the local-window who modified the storage...
		//only if it came from an other window. :| This makes it fire an event for local modifications.
		//We can easily check if it came from this or the browser by looking at the "target" of the event:
		//		it won't be defined if this fired the event.

		this.onStorageChanged({ type: 'storage', key, oldValue, newValue, storageArea: this.backer });
	}

	get length () {
		return this.backer.length;
	}

	key (index) {
		return this.backer.key(index);
	}

	getItem (key) {
		return this.backer.getItem(key);
	}

	setItem (key, value) {
		const old = this.getItem(key);
		this.backer.setItem(key, value);
		this.onChange(key, value, old);
	}

	removeItem (key) {
		const old = this.getItem(key);
		this.backer.removeItem(key);
		this.onChange(key, void 0, old);
	}

	clear () {
		this.backer.clear();
		this.onChange();
	}


	scope (scopedKey) {
		const storage = this;
		const getKey = key => `${scopedKey}-${key}`;

		return {
			getItem: (key) => storage.getItem(getKey(key)),
			setItem: (key, value) => storage.setItem(getKey(key), value),
			removeItem: (key) => storage.removeItem(getKey(key)),
			scope: (key) => storage.scope(`${key}:${scopedKey}`)
		};
	}
}

export const LocalStorage = new Storage('localStorage');
export const SessionStorage = new Storage('sessionStorage');

export default LocalStorage;
