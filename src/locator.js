/**
 *
 */
import _ from 'underscore-bd';
import front from 'front-bd';

var obj = { model: {}, collection: {}, model_prototype: {}, collection_prototype: {} };

obj.model.Mark = function (name, replace = false) {
    this.prototype.className = name;
    return front.locator.addListItem('model', name, this, replace);
}

obj.model_prototype.Mark = function (name, replace = false) {
    return front.locator.addListItem('iModel', name, this, replace);
}

obj.collection.Mark = function (name, replace = false) {
    this.prototype.className = name;
    return front.locator.addListItem('collection', name, this, replace);
}

obj.collection_prototype.Mark = function (name, replace = false) {
    return front.locator.addListItem('iCollection', name, this, replace);
}

export default obj;