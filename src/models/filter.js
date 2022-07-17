import _ from 'underscore-bd';
import bbxf from '../define';

export default bbxf.vmodel.extend({
    idAttribute: '_filterId',
    format: {},
    defaults: {},
    sendEmptyFilter: {},
    setCols(o) {
        if (!o) return;
        this.attributes = {};
        this.cols = o;
        _.each(o, (col) => {
            if (col.default && !this.get(col.name)) {
                this.set(col.name, col.default);
                this.defaults[col.name] = col.default;
            }
            col.format && (this.format[col.name] = col.format);
            this.sendEmptyFilter[col.name] = col.sendEmpty || false;
        });
    },
    isAvailable(col) {
        return !('available' in col) || col.available;
    },
    isDisplayed(col) {
        return this.isAvailable(col) && (!('display' in col) || col.display);
    },
    availableCols() {
        return _.filter(this.cols, (col) => {
            return this.isAvailable(col);
        });
    },
    displayedCols() {
        return _.filter(this.cols, (col) => {
            return this.isDisplayed(col);
        });
    },
    filledValuesOnDisplayedCols() {
        var cols = _.pluck(this.displayedCols(), 'name'),
            attrs = {};

        for (var x in this.attributes) {
            _.indexOf(cols, x) !== -1 && (attrs[x] = this.attributes[x]);
        }
        return attrs;
    },
    validations() {
        var v = {};
        _.each(this.cols, (col) => {
            col.validate && (v[col.name] = col.validate);
        });

        return v;
    },
});
