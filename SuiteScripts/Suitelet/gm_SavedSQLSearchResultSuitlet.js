/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 */

var file, serverWidget, record, format, context, query, form, SSSEngine, log;


define(['N/file','N/ui/serverWidget','N/record',  'N/format',  'N/query', './../Engine/SSSEngine', 'N/log'],

function(fileModule, serverWidgetModule, recordModule, formatModule, queryModule, SSSEngineModule, logModule) {

    file = fileModule;
    serverWidget = serverWidgetModule;
    record = recordModule;
    format = formatModule;
    query = queryModule;
    SSSEngine = SSSEngineModule;
    log=logModule;


    function onRequest(contextMod) {
        context= contextMod;

        var savedSQLSearchID;
        var displayType;

        if (context.request.method === 'GET') {

            //get searchid
            if ( context.request.parameters.hasOwnProperty( 'sqlid' ) ) {
                savedSQLSearchID = context.request.parameters['sqlid'];
                displayType = context.request.parameters['dt'];
                SSSEngine.showQuery(serverWidget, context, query,savedSQLSearchID, displayType,log);
            };

        }else
        {
            return;
        }

    }

    return {
        onRequest: onRequest
    };

});
