import bbxf from '../backbone';

import model from '../models/authAccess';

export default bbxf.collection.extend({
    initialize(models=[], items=[]) {
        window.aamodel = model;
        if(typeof items === 'object')
            for(var i in items) { let item = items[i];
                if(/^null\//.test(item.path)) continue;
//                console.log(i);
//                console.log(item);
                let imodel = new model(item);
                this.addRelatedList(item.path, imodel, true);
            }
    },
    fetch() {
        this.fetchRelatedLists();
//        this.fetchRelatedLists({reset: true});
        this.trigger('sync');
    },
}).Mark('authAccess');