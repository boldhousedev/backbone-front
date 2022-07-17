/**
 *
 */
import _ from 'underscore-bd';
import front from 'front-bd';
import b64 from 'nodejs-base64';
import crypto from 'backbone-bd/src/formatters/crypt';

var utils = _.extend({}, front.utils);

utils.showView = async function (view, id = null, callback = null) {
    var viewClass = view;
    if (typeof view === 'string') {
        viewClass = await this.getView(view);
    }

    var viewObj = typeof view === 'string' ? new viewClass({ id: id }) : view,
        App = front.locator.getItem('iApp');

    typeof callback === 'function' && (viewObj.callback = callback);
    App.showContent(viewObj);
    return viewObj;
};

utils.getView = async function (v) {
    typeof v === 'string' && (v = { viewPath: v });
    const { viewName = '', viewPath = '' } = v;

    if (!front.locator.getListItem('view', viewPath)) {
        await front.importView(v);
    }
    var viewClass = front.locator.getListItem('view', viewPath);

    return viewClass;
};

utils.encrypt = function (k, v, json = true) {
    return b64.base64encode(crypto(v, 1, true, k));
};

utils.decrypt = function (k, v, json = true) {
    return crypto(b64.base64decode(v), 0, true, k);
};

export default utils;
