const utf8 = require('utf8');

const getLoggedUser = (user) => {
    const eppn = utf8.decode(user.eppn.split('@')[0]);
    //const eduPersonAffiliation = (utf8.decode(user.eduPersonAffiliation));
    const hyGroupCn = concatenateArray(utf8.decode(user.hyGroupCn).split(';'));
    const preferredLanguage = utf8.decode(user.preferredLanguage);
    const displayName = utf8.decode(user.displayName);
    return {
        eppn: eppn, //eduPersonAffiliation,
        //eduPersonAffiliation: eduPersonAffiliation,
        hyGroupCn: hyGroupCn,
        preferredLanguage: preferredLanguage,
        displayName: displayName,
        //roles : user.roles
    };
};

const concatenateArray = (data) => Array.prototype.concat.apply([], data);

module.exports = {
    getLoggedUser: getLoggedUser,
};
