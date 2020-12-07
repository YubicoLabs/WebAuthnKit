'use strict';

exports.handler = async (event) => {
    console.log('RECEIVED Event: ', JSON.stringify(event, null, 2));

    event.response.autoConfirmUser = true;
    
    // add client attributes to the event to pass onto the next Lambda function
    event.request["validationData"] = event.request.validationData;
    
    console.log('RETURNED Event: ', JSON.stringify(event, null, 2));
    return event;
};
