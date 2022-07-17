
/**
 *
 */
import _ from 'underscore-bd';
import front from 'front-bd';
import validate from 'validate-bd';

var validation = _.clone(validate);
validation.validateAll = false;
validation.validations = function () { return {}; };

export default validation;