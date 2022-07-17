/**
 * @module
 * cascated state implementation
 */
import Bb from 'backbone';
import _ from 'underscore-bd';
import front from 'front-bd';

var state = {
    model: {},
    collection: {},
    view: {},
    model_prototype: {},
    collection_prototype: {},
    view_prototype: {},
};

state.view_prototype.getRelatedList =
    state.model_prototype.getRelatedList =
    state.collection_prototype.getRelatedList =
    function (collectionName) {
        return collectionName in this.relatedLists
            ? this.relatedLists[collectionName]
            : null;
    };

state.model_prototype.setStateReady = state.collection_prototype.setStateReady =
    function () {
        this.morphState = 'ready';
        return this;
    };

state.collection_prototype.setAllStateReady = function () {
    this.setStateReady();
    if (this.models.length) {
        this.each((m) => (m.morphState = 'ready'));
    }
    return this;
};

state.model_prototype.setStates = state.collection_prototype.setStates =
    function () {
        this.morphState = 'initial';
        this.relatedLists = {};
        this.globalLists = {};

        //    this.relatedState = 'initial';
        var listenState = 'sync';
        //    var listenState = this instanceof Bb.Model ? 'change' : 'sync';
        this.on(listenState, () => {
            this.morphState = 'ready';

            //        console.log('ready of '+this.className);
            this.triggerReady();
        });
        this.on('error', () => {
            this.morphState = 'error';
        });

        if (this instanceof Bb.Collection) {
            this.on('add', (model) => {
                model.morphState = 'ready';
            });
        }
        //    this.collections = {};
    };

state.view.pretrigger_initialState = function () {
    this.morphState = 'initial';
    this.relatedLists = {};
    this.globalLists = {};
};

state.view_prototype.pretriggers = [];
state.collection_prototype.pretriggers = [];
state.model_prototype.pretriggers = [];

state.view_prototype.pretriggers.push(state.view.pretrigger_initialState);

state.view.pretrigger_collectionInstantiate = function () {
    if (this.collection) {
        this.collection = new this.collection.constructor();
    }
};
state.view_prototype.pretriggers.push(
    state.view.pretrigger_collectionInstantiate
);

state.model_prototype.pretriggers.push(function () {
    this.setStates();
});
state.collection_prototype.pretriggers.push(function () {
    this.setStates();
});

//state.model_prototype.preinitialize = function () {
//    this.setStates();
//}
//
//state.collection_prototype.preinitialize = function () {
//    this.setStates();
////    this.on('add', (model) => { _.size(model.attributes)>1 && this.id && (this.trigger('sync')) });
//}

state.model_prototype.resetAllData = function () {
    this.morphState = 'initial';
    this.initialize();
    this.fetch({ reset: true });
};

state.model_prototype.isReady = function () {
    var r =
        (!this.id || this.morphState === 'ready') && this.areAllListsReady();
    return r;
};

state.model_prototype.isWrong = function () {
    var r =
        (!this.id && this.morphState === 'error') ||
        this.isAnyListWrong() !== false;
    return r;
};

state.collection_prototype.isReady = function () {
    var r =
        this.morphState === 'ready' &&
        (!this.requireReadyModels || this.isAllModelsReady()) &&
        this.areAllListsReady();
    return r;
};

state.collection_prototype.isWrong = function () {
    var r =
        this.morphState === 'error' ||
        (this.requireReadyModels && this.isAnyModelWrong() !== false) ||
        this.isAnyListWrong() !== false;
    return r;
};

state.view_prototype.isAllRelatedReady =
    state.collection_prototype.isAllRelatedReady =
    state.model_prototype.isAllRelatedReady =
    function () {
        return this.areAllListsReady();
    };

state.view_prototype.areAllListsReady =
    state.collection_prototype.areAllListsReady =
    state.model_prototype.areAllListsReady =
    function () {
        var r = true,
            infoRelatedReady = [];
        if (_.size(this.relatedLists) > 0) {
            for (let x in this.relatedLists) {
                let related = this.relatedLists[x];
                if (!related) continue;
                if (!related.isReady() === true) {
                    infoRelatedReady.push(
                        `related: ${related.className} state ${related.morphState}`
                    );
                    //                console.log(this.className + ' is not ready because of ' + related.className + ' with state '+related.morphState);
                    r = false;
                }
            }
        }
        if (_.size(this.globalLists) > 0) {
            for (let x in this.globalLists) {
                let related = this.globalLists[x];
                if (!related) continue;
                if (!related.isReady() === true) {
                    infoRelatedReady.push(
                        `global: ${related.className} state ${related.morphState}`
                    );
                    //                console.log(this.className + ' is not ready because of ' + related.className + ' with state '+related.morphState);
                    r = false;
                }
            }
        }
        if (!r) {
            this.infoRelatedReady = infoRelatedReady.join(', ');
        } else {
            this.infoRelatedReady = '';
        }
        return r;
    };

state.view_prototype.isAnyListWrong =
    state.collection_prototype.isAnyListWrong =
    state.model_prototype.isAnyListWrong =
    function () {
        var r = false,
            infoRelatedWrong = [];
        if (_.size(this.relatedLists) > 0) {
            for (let x in this.relatedLists) {
                let related = this.relatedLists[x];
                if (!related) continue;
                if (related.isWrong() !== false) {
                    infoRelatedWrong.push(
                        `related: ${related.className} state ${related.morphState}`
                    );
                    //                console.log(this.className + ' is not ready because of ' + related.className + ' with state '+related.morphState);
                    r = true;
                }
            }
        }
        if (_.size(this.globalLists) > 0) {
            for (let x in this.globalLists) {
                let related = this.globalLists[x];
                if (!related) continue;
                if (related.isWrong() !== false) {
                    infoRelatedWrong.push(
                        `global: ${related.className} state ${related.morphState}`
                    );
                    //                console.log(this.className + ' is not ready because of ' + related.className + ' with state '+related.morphState);
                    r = true;
                }
            }
        }
        if (r) {
            this.infoRelatedWrong = infoRelatedWrong.join(', ');
        } else {
            this.infoRelatedWrong = '';
        }
        return r;
    };

state.collection_prototype.isAllModelsReady = function () {
    var r = true,
        infoModelsReady = [];
    if (_.size(this.models) > 0) {
        for (let x in this.models) {
            let model = this.models[x];
            if (!model) continue;
            //            return err.stack;
            if (!model.isReady() === true) {
                //                console.log('---');
                //                console.log(model);
                //                console.log(model.attributes);
                //                console.log(model.isReady()===true);
                //                console.log(this.className + ' is not ready because of ' + related.className + ' with state '+related.morphState);
                infoModelsReady.push(
                    `${related.className} state ${related.morphState}`
                );
                r = false;
            }
        }
        if (!r) {
            this.infoModelsReady = infoModelsReady.join(', ');
        }
    }
    if (r) {
        this.infoModelsReady = '';
    }
    return r;
};

state.collection_prototype.isAnyModelWrong = function () {
    var r = false,
        infoModelsReady = [];
    if (_.size(this.models) > 0) {
        for (let x in this.models) {
            let model = this.models[x];
            if (!model) continue;
            //            return err.stack;
            if (model.isWrong() !== false) {
                //                console.log('---');
                //                console.log(model);
                //                console.log(model.attributes);
                //                console.log(model.isReady()===true);
                //                console.log(this.className + ' is not ready because of ' + related.className + ' with state '+related.morphState);
                infoModelsReady.push(
                    `${related.className} state ${related.morphState}`
                );
                r = true;
            }
        }
        if (!r) {
            this.infoModelsReady = infoModelsReady.join(', ');
        }
    }
    if (r) {
        this.infoModelsReady = '';
    }
    return r;
};

state.view_prototype.triggerReady =
    state.model_prototype.triggerReady =
    state.collection_prototype.triggerReady =
    function () {
        var isReady = _.bind(
            this.isReady ? this.isReady : mnx.utils.isReady,
            this
        );

        if (isReady() === true) {
            //        console.log(this.className+' trigger ready proceed');
            this.trigger('ready');
        } else {
            //        console.log(this.className+' trigger ready **NOT**    '+this.morphState+'    ');
        }
    };

state.view_prototype.addRelatedList =
    state.model_prototype.addRelatedList =
    state.collection_prototype.addRelatedList =
    function (name, obj) {
        // this implementation will avoid application to be reloading the same collections already loaded when loading a view, collection, model and its relatedlists
        state._relatedListTimer =
            !state._relatedListTimer ||
                parseInt(new Date().format('ddHHmmss'), 10) - 5 >
                state._relatedListTimer
                ? parseInt(new Date().format('ddHHmmss'), 10)
                : state._relatedListTimer;
        var nameTimed = [name, state._relatedListTimer].join('-');
        //    console.log(state._relatedListTimer);
        return (this.relatedLists[name] = front.locator.getListItem(
            obj instanceof Bb.Model ? 'iModel' : 'iCollection',
            nameTimed,
            () => obj
        ));
    };

state.view_prototype.storeRelatedList =
    state.model_prototype.storeRelatedList =
    state.collection_prototype.storeRelatedList =
    function (name, obj, replace = false) {
        return (this.relatedLists[name] = front.locator.getListItem(
            obj instanceof Bb.Model ? 'iModel' : 'iCollection',
            name,
            () => obj,
            replace
        ));
    };

state.view_prototype._fetchRelatedFirst =
    state.model_prototype._fetchRelatedFirst =
    state.collection_prototype._fetchRelatedFirst =
    true;

state.view_prototype.fetchAndStateList =
    state.model_prototype.fetchAndStateList =
    state.collection_prototype.fetchAndStateList =
    function (list, name, o = {}) {
        if (!this[list][name]) return;
        if (this[list][name].morphState === 'ready') {
            //        console.log(name + ' triggered ready 1');
            return this.triggerReady();
        }

        if ('listening' in o && !o.listening) {
            this.listenToOnce(this[list][name], 'ready', () => {
                //        console.log(name + ' triggered ready 2 ' + this.isReady()===true);
                this.triggerReady(name);
            });
        } else {
            this[list][name].on('ready', () => {
                //        console.log(name + ' triggered ready 2 ' + this.isReady()===true);
                this.triggerReady(name);
            });
        }

        if (!this[list][name]._fetchRelatedFirst) {
            //        console.log(name + ' triggered ready 3');
            return this.triggerReady();
        }

        this[list][name]._fetchRelatedFirst = false;
        this[list][name].fetch(o);
    };

state.view_prototype.fetchAndStateRelatedList =
    state.model_prototype.fetchAndStateRelatedList =
    state.collection_prototype.fetchAndStateRelatedList =
    function (name, o = {}) {
        return this.fetchAndStateList('relatedLists', name, o);
    };

state.view_prototype.fetchAndStateGlobalList =
    state.model_prototype.fetchAndStateGlobalList =
    state.collection_prototype.fetchAndStateGlobalList =
    function (name, o = {}) {
        o.listening = false;
        return this.fetchAndStateList('globalLists', name, o);
    };

state.view_prototype.fetchRelatedLists =
    state.model_prototype.fetchRelatedLists =
    state.collection_prototype.fetchRelatedLists =
    function (opts = {}) {
        if (_.size(this.relatedLists)) {
            for (name in this.relatedLists) {
                this.fetchAndStateRelatedList(name, opts);
            }
            return true;
        }
        return false;
    };

state.view_prototype.fetchGlobalLists =
    state.model_prototype.fetchGlobalLists =
    state.collection_prototype.fetchGlobalLists =
    function (opts = {}) {
        if (_.size(this.globalLists)) {
            for (name in this.globalLists) {
                this.fetchAndStateGlobalList(name, opts);
            }
            return true;
        }
        return false;
    };

state.view_prototype.fetchAllLists =
    state.model_prototype.fetchAllLists =
    state.collection_prototype.fetchAllLists =
    function (opts = {}) {
        this.fetchGlobalLists();
        this.fetchRelatedLists();
    };

export default state;
