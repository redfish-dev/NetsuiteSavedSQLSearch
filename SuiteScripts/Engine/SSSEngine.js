/** *
 * 
 * Saved Sql Search Engine
 * 
 */

define(function () {

    var log;
    var feildDefRec;
    var columnsRec;

    function showQuery(serverWidget, context, query, sqlSearchID, displayType, logMod){

        var SqlQuery;
        log = logMod;

        SqlQuery = loadBaseQuery(query, sqlSearchID)

        //get rid of carriage returns
        SqlQuery = SqlQuery.replace(/(\n)/gm, " ");
        SqlQuery = SqlQuery.replace(/(\r)/gm, " ");
        SqlQuery = SqlQuery.replace(/(\t)/gm, " ");

        // Run the query.
        var queryResults = query.runSuiteQL( { query: SqlQuery } );
        // Get the mapped results.
        var beginTime = new Date().getTime();
        var records = queryResults.asMappedResults();
        var endTime = new Date().getTime();
        var elapsedTime = endTime - beginTime ;



        if(displayType ==='htmlgrid') {
            showHTMLGrid(context, query, sqlSearchID, SqlQuery, records, elapsedTime);

        }else if(displayType ==='list'){
            showListView(serverWidget, context, query, sqlSearchID, SqlQuery, records, elapsedTime);
        }


    }

    function showListView(serverWidget,context, query, sqlSearchID, SqlQuery, records, elapsedTime) {

        feildDefRec = loadFieldDefinitions(query, sqlSearchID);
        //log.debug('fieldRecs', feildDefRec);
        var form = serverWidget.createForm(
            {
                title: 'Search Results',
                hideNavBar: false
            }
        );

        var timetorunField = form.addField({
            id : 'custpage_resultslength',
            type : serverWidget.FieldType.TEXT,
            label : 'results',
        });
        timetorunField.defaultValue=records.length + ' records retrieved in ' + elapsedTime + 'ms';
        timetorunField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        var lstResults = form.addSublist({
            id: 'custpage_lstresults',
            type: serverWidget.SublistType.LIST,
            label: 'Search Results'
        });


            // If records were returned...
            if (records.length > 0) {

                // Get the column names.
                var columnNames = Object.keys(records[0]);
                columnsRec = Object.keys(records[0]);
                for (i = 0; i < columnNames.length; i++) {



                    if(shouldShowColumn(getColumnName(i))){
                        var fldTyp =getFieldType(getColumnName(i));
                        if (fldTyp == serverWidget.FieldType.INLINEHTML ){
                            fldTyp = serverWidget.FieldType.TEXT

                        }

                        var newFld =lstResults.addField({
                            id : columnNames[i] ,
                            type : fldTyp,
                            label : columnNames[i] ,
                            align : serverWidget.LayoutJustification.LEFT

                        });
                        if (fldTyp ==serverWidget.FieldType.INLINEHTML ){
                            newFld.updateDisplayType({
                                displayType : serverWidget.FieldDisplayType.INLINE
                            });

                        }

                        if (buildLink(sqlSearchID, columnNames[i] != '')) {

                        }
                    }
                }

                // Add the records to the sublist...
                for (r = 0; r < records.length; r++) {
                    var record = records[r];

                    // Loop over the columns...
                    for (c = 0; c < columnNames.length; c++) {
                        var column = columnNames[c];
                        var value = record[column];
                        if (value != null) {
                            value = formatFieldByType(column,value.toString(), r,record) ;
                            log.debug('parsed' +column, value)
                        } else {
                            value = ' ';
                        }

                        var a=Number(r);
                        if(shouldShowColumn(getColumnName(c))) {
                            lstResults.setSublistValue({
                                id: columnNames[c],
                                value: value,
                                line: a
                            })
                        }


                    }

                }

            }


        // Display the form.
        context.response.writePage( form );

        return;
    }

    function getFieldType(name){
        var fldTyp = serverWidget.FieldType.TEXT;
        var fieldDef =getFieldDef(name);
        if (fieldDef != null){
            if(fieldDef["fldtyp"].toUpperCase() == 'URL')
            {
                fldTyp = serverWidget.FieldType.INLINEHTML;
            }else if(fieldDef["fldtyp"].toUpperCase() == 'DECIMAL')
            {
                fldTyp = serverWidget.FieldType.DECIMAL;
            }

        }
        return fldTyp;
    }
    function formatFieldByType(name, val, row, record){
        var fieldDef=getFieldDef(name);
        if (fieldDef != null){
            if(fieldDef["fldtyp"].toUpperCase() == 'NUMBER')
            {
                log.debug(name,parseInt(val) );
                val= parseInt(val);
            }
            if(fieldDef["fldtyp"].toUpperCase() == 'URL')
            {
                var url = fieldDef["custrecordsql_url"];
                var linkFld = fieldDef["custrecordsss_linkfield"];
                if(linkFld == null)
                {
                    val = '<a href=\"' + url.replace('{1}', val) + '\" target=\"_blank\">' + val + '</a>';
                }
                else{
                    //get linkedfield value
                    log.debug(row, linkFld)
                    log.debug('record', record)
                    var idFRomFld = getFeildRawValue(linkFld, record);

                    val = '<a href=\"' + url.replace('{1}', idFRomFld) + '\" target=\"_blank\">' + val + '</a>';

                }
            }
            log.debug(fieldDef["fldtyp"], val);
        }

        return val;
    }
    function getColumnName(index)
    {
        return columnsRec[index]
    }

    function getFeildRawValue(name, record)
    {
        try{
            return record[name];
        }catch (e) {
            throw {
                'name:': 'Config Error',
                'message': 'cant find value may be capitalization, looking for ' + name + ' in ' +  JSON.stringify(record)
            }
        }

    }
    function getFieldDef(name){
        var fieldDef = null;

        feildDefRec.forEach(function(element) {
            //log.debug('isEqual ' + name , element['custrecordsql_fieldname']);
            //log.debug('element', element);
            if(element['custrecordsql_fieldname'].toUpperCase() == name.toUpperCase())
                fieldDef = element;
        })
        return fieldDef;

    }
    function shouldShowColumn(name)
    {

        var fieldDef=getFieldDef(name);
        //log.debug('shouldShowColumn ' + name , fieldDef)
        if (fieldDef == null){
            return true;}
        else
        {
           if(fieldDef["custrecordssshiden"] == 'T') return false;
        }
        return true;
    }

    function showHTMLGrid(context, query, sqlSearchID, SqlQuery, records, elapsedTime) {
        //get base html for TUI grid
        var gridBaseHTML = file.load({id: gridBaseHTMLFile}).getContents();


        var columnDefinition = "[";
        var gridDefinition = "";

        try {

            // If records were returned...
            if (records.length > 0) {

                // Get the column names.
                var columnNames = Object.keys(records[0]);
                for (i = 0; i < columnNames.length; i++) {
                    columnDefinition = columnDefinition + ' \'' + columnNames[i] + '\','
                    if (buildLink(sqlSearchID, columnNames[i] != '')) {

                    }
                }

                // Add the records to the sublist...
                for (r = 0; r < records.length; r++) {
                    var record = records[r];
                    var recordData = '[';
                    // Loop over the columns...
                    for (c = 0; c < columnNames.length; c++) {
                        var column = columnNames[c];
                        var value = record[column];
                        if (value != null) {
                            value = value.toString();
                        } else {
                            value = '';
                        }
                        recordData = recordData + ' ' + stripChars(value) + ',';
                    }
                    recordData = recordData + '],';
                    gridDefinition = gridDefinition + recordData;
                }

            }


        } catch (e) {
            context.response.write(JSON.stringify(e));
        }

        columnDefinition = columnDefinition + ']';


        gridBaseHTML = gridBaseHTML.replace('replacecolumns', columnDefinition);
        gridBaseHTML = gridBaseHTML.replace('replaceGridData', gridDefinition);
        gridBaseHTML = gridBaseHTML.replace('Total Results', records.length + ' records retrieved in ' + elapsedTime + 'ms');
        gridBaseHTML = gridBaseHTML.replace('myQuery', SqlQuery);


        context.response.write(gridBaseHTML);

        return;
    }

    function loadBaseQuery(query, sqlSearchID){

        var resultQ;

        //load query
        var getQuerySQL = 'SELECT custrecordsql_query FROM customrecordsql_search WHERE ID = \'' + sqlSearchID + '\'';
        var QuerySQLresults = query.runSuiteQL( { query: getQuerySQL } );
        var SQLrecords = QuerySQLresults.asMappedResults();
        if ( SQLrecords.length > 0 ) {
            var SQLrecord = SQLrecords[0];
            resultQ = SQLrecord['custrecordsql_query'];
        }else {
            throw {
                'name:': 'Query Not Found',
                'message': 'This Saved SQLSearch Doesnt Exist'
            }

        }
        return resultQ;

    }
    function loadFieldDefinitions(query, sqlSearchID){

        var resultQ;

        //load query
        var getQuerySQL = 'SELECT *, BUILTIN.DF(custrecordsql_fieldtype) as fldtyp FROM customrecordsql_searchfield WHERE custrecordsql_search = \'' + sqlSearchID + '\'';
        var QuerySQLresults = query.runSuiteQL( { query: getQuerySQL } );
        return fieldRecs = QuerySQLresults.asMappedResults();

    }


    function stripChars(strToStrip) {

        var temp2 = JSON.stringify(strToStrip);
        return temp2;
    }

    function buildLink(dashletID, ColumnName) {


    };


    return {showQuery: showQuery}
});
