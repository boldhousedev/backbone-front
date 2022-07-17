/**
 * Router
 *
 * It will serve as a router that uses of bbx.locator to apply a router behavior based on name patterns
 *
 */
import Bb from 'backbone';
import _ from 'underscore-bd';
import front from 'front-bd';
import utils from './utils';

var _shieldData = {};

var checkViewAccess = function (viewName, id, routeData, callback) {
    callback();
};

var baseDir = () => front.baseDir || '';

var router = new (Bb.Router.extend({
    defaultViewName: 'index',
    routePrefixes: {
        public: 'p',
        internal: 'i',
        admin: 'a',
    },
    defaultRouteLoader: 'loadView',
    //    transitionEffect: false,
    //    keepViewsInstance: false,
    routes: {
        '': 'loadView',
    },
    routeViewAlias: {},
    routeViewPathAlias: {},
    checkViewAccessChanged: false,
    authType: {
        public: 0,
        private: 1,
        internal: 2,
    },
    options: {},
    regExpRouteTemplate: '^\\/*{{partial}}{{regexproute}}\\/*(\\?.*)?$',
    regExpRoutes: [
        //        '(?<module>[a-zA-Z\\-]+)',
        //        '(?<module>[a-zA-Z\\-]+)\\\/(?<id>[0-9]+)',
        //        '(?<module>[a-zA-Z\\-]+)\\\/s\\\/(?<suffix>[a-zA-Z\\-]+)',
        '(?<module>[a-zA-Z\\-]+)(\\/s\\/(?<suffix>[a-zA-Z\\-]+))*(\\/(?<id>[0-9]+))*',
        '(?<dir>([a-zA-Z\\-]+\\/){1})?(?<module>[a-zA-Z\\-]+)(\\/s\\/(?<suffix>[a-zA-Z\\-]+))*(\\/(?<id>[0-9]+))*',
        '(?<dir>([a-zA-Z\\-]+\\/){2})?(?<module>[a-zA-Z\\-]+)(\\/s\\/(?<suffix>[a-zA-Z\\-]+))*(\\/(?<id>[0-9]+))*',
        '(?<dir>([a-zA-Z\\-]+\\/){3})?(?<module>[a-zA-Z\\-]+)(\\/s\\/(?<suffix>[a-zA-Z\\-]+))*(\\/(?<id>[0-9]+))*',
    ],
    initialize() {
        this.route(/((file\:\/\/)?.+\.html)?(.*)/, 'parseRoute');
    },
    matchAliases(path) {
        if (path) {
            return _.find(this.routeViewPathAlias, (i, x) => {
                return path.replace(/\/$/, '') === x.replace(/\/$/, '');
            });
        }
    },
    parseRoute() {
        var data = {},
            path = (typeof arguments[2] === 'string' ? arguments[2] : '').split(
                '?'
            )[0];
        !path && (path = null);

        //         var regexp = new RegExp ('(?<module>[a-zA-Z\\-]+)\\\/m\\\/(?<method>[a-zA-Z\\-]+)');
        //         const results = regexp.exec(path);

        const routes = [[true, this.defaultRouteLoader]];

        var alias = this.matchAliases(path);
        if (alias) {
            data = { module: alias, path };
            return this[routes[0][1]](this.setRouteData(data, path));
        }

        for (let [prefix, loader] of routes) {
            var partial = typeof prefix === 'string' ? prefix + '\\/' : '';
            for (let x in this.regExpRoutes) {
                let str = _.template(this.regExpRouteTemplate)({
                    partial: partial,
                    regexproute: this.regExpRoutes[x],
                }),
                    regexp;
                regexp = new RegExp(str);
                let data = regexp.exec(path);
                if (data !== null) {
                    data.groups.path = path;
                    return this[loader](this.setRouteData(data.groups, path));
                }
            }
        }
    },
    viewPath2Name(viewPath) {
        viewPath = this.formatViewPath(viewPath);
        return viewPath.camelize();
    },
    formatViewPath(viewPath) {
        if (_.isArray(viewPath)) {
            viewPath = viewPath.join('-');
        }
        return viewPath;
    },
    setRouteData(data, path) {
        this.routeData = data;
        this.routeData.path = path === null ? '/' : path;

        var viewPath = [
            data.module && data.module !== 'null'
                ? data.module
                : this.defaultViewName,
        ];
        data.suffix && viewPath.push(data.suffix);

        this.routeData.viewName = this.viewPath2Name(viewPath);
        this.routeData.viewPath = `${data.dir || ''}${this.routeData.viewName}`;
        this.routeData.viewAlias = this.routeData.viewName;

        if (this.routeViewPathAlias[this.routeData.viewPath]) {
            this.routeData.viewName =
                this.routeViewPathAlias[this.routeData.viewPath];
        }
        if (this.routeViewAlias[this.routeData.viewName]) {
            this.routeData.viewName =
                this.routeViewAlias[this.routeData.viewName];
        }

        return this.routeData;
    },
    loadView(data) {
        if (!front.locator.getListItem('view', data.viewPath)) {
            front.loadView(data.viewPath, (vn) => this.checkView(vn, data.id));
        } else {
            this.checkView(data.viewPath, data.id);
        }
    },
    setNames(v) {
        var view =
            typeof v === 'string' ? front.locator.getListItem('view', v) : v;
        view.prototype.moduleDir = this.routeData.dir;
        view.prototype.moduleName = this.routeData.module.camelize();
        view.prototype.modulePath = this.routeData.module;
        // view.prototype.viewPath = this.routeData.path;
        view.prototype.viewPath = this.routeData.viewPath;
        view.prototype.viewAlias = this.routeData.viewAlias;

        return view;
    },
    checkView(viewPath, id = null) {
        var view = front.locator.getListItem('view', viewPath);
        if (!view) {
            return console.error(`no view named ${viewPath}`);
        }

        this.setNames(view);
        checkViewAccess(viewPath, id, router.getShield(viewPath) || {}, () => {
            utils.showView(viewPath, id);
        });
    },
    setCheckViewAccess(fn) {
        if (this.checkViewAccessChanged)
            return console.log('cannot set checkViewAccess twice');
        this.checkViewAccessChanged = true;
        checkViewAccess = fn;
    },
    /* Shield */
    setShield(name, data) {
        !(name in _shieldData) && (_shieldData[name] = data);
    },
    getShield(name) {
        return _shieldData[name];
    },
}))();

export default router;
