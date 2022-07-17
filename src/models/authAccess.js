import _ from 'underscore-bd';
import front from 'front-bd';
import bbxf from '../define';

export default bbxf.vmodel
    .extend({
        idAttribute: 'path',
        titleAttribute: 'path',
        urlRoot() {
            if (/^\//.test(this.id)) this.id = this.id.substr(1);
            return front.envUrl('auth/authorize/', true) + this.id + '?_=';
        },
        isAuthorized() {
            return (
                this.isReady() === true && this.get('authorization') === true
            );
        },
    })
    .Mark('authAccess');
