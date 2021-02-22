/* eslint-env jest */
import { Date as DateUtils } from '@nti/lib-commons';

import DefaultStorage, { LocalStorage, SessionStorage } from '../index';

const Storage = DefaultStorage;
const { MockDate } = DateUtils;

afterEach(() => {
	Storage.removeAllListeners();
	Storage.clear();
});

test('LocalStorage should be exported', () => {
	expect(LocalStorage).toBeTruthy();
});

test('SessoinStorage should be exported', () => {
	expect(SessionStorage).toBeTruthy();
});

test('The default export should be LocalStorage', () => {
	expect(DefaultStorage).toBe(LocalStorage);
});

test('Initial State: Length is 0', () => {
	expect(Storage.length).toBe(0);
});

test('Length is accurate', () => {
	expect(Storage.length).toBe(0);
	Storage.setItem('foo', 'bar');
	expect(Storage.length).toBe(1);
});

test('key()', () => {
	expect(Storage.length).toBe(0);
	Storage.setItem('foo', 'bar');
	expect(Storage.length).toBe(1);
	expect(Storage.key(0)).toBe('foo');
});

test('change fires', () => {
	const handler = jest.fn();
	Storage.addListener('change', handler);
	Storage.setItem('foo', 'bar');
	expect(handler.mock.calls.length).toBe(1);

	Storage.setItem('foo', 'baz');
	expect(handler.mock.calls.length).toBe(2);

	Storage.removeItem('foo');
	expect(handler.mock.calls.length).toBe(3);
});

test('Clear clears', () => {
	expect(Storage.length).toBe(0);
	Storage.setItem('foo', 'baz');
	expect(Storage.length).toBe(1);
	Storage.clear();
	expect(Storage.length).toBe(0);
});

test('Adding a value', () => {
	Storage.setItem('foo', 'bar');
	expect(Storage.getItem('foo')).toBe('bar');
});

test('Changing a value', () => {
	Storage.setItem('foo', 'bar');
	expect(Storage.getItem('foo')).toBe('bar');
	Storage.setItem('foo', 'baz');
	expect(Storage.getItem('foo')).toBe('baz');
});

test('Removing a value', () => {
	Storage.setItem('foo', 'bar');
	expect(Storage.getItem('foo')).toBe('bar');
	Storage.removeItem('foo');
	expect(Storage.getItem('foo')).toBeUndefined();
});

describe('expiry values', () => {
	const mockDates = {
		start: 'December 1, 2019 12:00:00',
		expire: 'December 2, 2019 12:00:00',
		after: 'December 3, 2019 12:00:00',
	};

	beforeEach(() => {
		MockDate.install();
	});

	afterEach(() => {
		MockDate.uninstall();
	});

	test('before expiration returns value', () => {
		MockDate.setDestination(mockDates.start).hit88MPH();

		const value = 'value';
		const encoded = Storage.encodeExpiryValue(
			value,
			new Date(mockDates.expire)
		);

		const decoded = Storage.decodeExpiryValue(encoded);

		expect(decoded).toBe(value);
	});

	test('after expiration returns null', () => {
		MockDate.setDestination(mockDates.start).illBeBack();

		const value = 'expired-value';
		const encoded = Storage.encodeExpiryValue(
			value,
			new Date(mockDates.expire)
		);

		MockDate.setDestination(mockDates.after).hit88MPH();

		const decoded = Storage.decodeExpiryValue(encoded);

		expect(decoded).toBeNull();
	});
});

describe('scoped', () => {
	const scoped = Storage.scope('scope');

	let mocks = [];

	beforeEach(() => {
		mocks = [
			jest.spyOn(Storage, 'setItem').mockImplementation(() => {}),
			jest.spyOn(Storage, 'getItem').mockImplementation(() => {}),
			jest.spyOn(Storage, 'removeItem').mockImplementation(() => {}),
		];
	});

	afterEach(() => {
		for (let mock of mocks) {
			mock.mockRestore();
		}
	});

	test('setting', () => {
		scoped.setItem('settingTest', 'bar');

		expect(Storage.setItem).toHaveBeenCalledWith(
			'scope-settingTest',
			'bar'
		);
	});

	test('getting', () => {
		scoped.getItem('gettingTest');

		expect(Storage.getItem).toHaveBeenCalledWith('scope-gettingTest');
	});

	test('removing', () => {
		scoped.removeItem('removingTest');

		expect(Storage.removeItem).toHaveBeenCalledWith('scope-removingTest');
	});

	test('sub-scoping', () => {
		const sub = scoped.scope('sub');

		sub.setItem('subSetting', 'bar');

		expect(Storage.setItem).toHaveBeenCalledWith(
			'sub:scope-subSetting',
			'bar'
		);
	});
});
