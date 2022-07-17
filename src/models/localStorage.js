import _ from 'underscore-bd';
import bbxf from '../define';

export default bbxf.vmodel.extend({
    storedAttributes: [],
    setOnLocalStorage(a, v) {
        if (
            _.isArray(this.storedAttributes) &&
            _.indexOf(this.storedAttributes, a) < 0
        )
            return;
        localStorage.setItem(this.className + '.' + a, v || '');
    },
    getOnLocalStorage(a) {
        return localStorage.getItem(this.className + '.' + a);
    },
    readLocalStorage() {
        if (_.isArray(this.storedAttributes))
            for (var k of this.storedAttributes) {
                var o = {},
                    v = localStorage.getItem(this.className + '.' + k);
                o[k] = v;

                if (v) {
                    this.set(o, { validate: false, silent: true });
                }
            }
    },
    updateLocalStorage() {
        if (_.isArray(this.storedAttributes))
            for (var k of this.storedAttributes) {
                var v = this.get(k);
                this.setOnLocalStorage(
                    k,
                    !!v || (typeof v !== 'undefined' && v.toString() === '0')
                        ? v.toString()
                        : ''
                );
            }
    },
    addInternalVariables() {
        _.indexOf(this.storedAttributes, 'localStorageSet') < 0 &&
            this.storedAttributes.push('localStorageSet');
    },
    initialize(o) {
        this.addInternalVariables();
        this.readLocalStorage();

        if (!this.get('localStorageSet')) {
            this.updateLocalStorage();
            this.setOnLocalStorage('localStorageSet', '1');
        }

        if (!_.result(this, 'urlRoot')) {
            this.on('change', () => this.updateLocalStorage()); // when the model isn't synced
        } else {
            this.on('sync', () => this.updateLocalStorage());
        }

        bbxf.vmodel.prototype.initialize.call(this, o);
    },
});
