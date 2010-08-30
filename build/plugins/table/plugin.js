/**
 * table edit plugin for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("table", function(editor, undefined) {
    //console.log("table loaded!");
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node,
        DOM = S.DOM,
        Walker = KE.Walker,
        UA = S.UA,
        KEN = KE.NODE,
        TripleButton = KE.TripleButton,
        Overlay = KE.SimpleOverlay,
        IN_SIZE = 8,
        TABLE_HTML = "<table class='ke-table-config'>" +
            "<tr>" +
            "<td>" +
            "<label>行数�?<input value='2' class='ke-table-rows ke-table-create-only' size='" + IN_SIZE + "'/></label>" +
            "</td>" +
            "<td>" +
            "<label>宽度�?<input value='200' class='ke-table-width' size='" + IN_SIZE + "'/></label> " +
            "<select class='ke-table-width-unit'>" +
            "<option value='px'>像素</option>" +
            "<option value='%'>百分�?/option>" +
            "</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +
            "<td>" +
            "<label>列数�?<input class='ke-table-cols ke-table-create-only' value='3' size='" + IN_SIZE + "'/></label>" +
            "</td>" +
            "<td>" +
            "<label>高度�?<input value='' class='ke-table-height' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +

            "<td>" +
            "<label>对齐�?<select class='ke-table-align'>" +
            "<option value=''>�?/option>" +
            "<option value='left'>左对�?/option>" +
            "<option value='right'>右对�?/option>" +
            "<option value='center'>中间对齐</option>" +
            "</select>" +
            "</label>" + "</td>" +


            "<td>" +
            "<label>间距�?<input value='1' class='ke-table-cellspacing' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +


            "<td>" +
            "<label>标题格： <select class='ke-table-head ke-table-create-only'>" +
            "<option value=''>�?/option>" +
            "<option value='1'>�?/option>" +
            "</select>" +
            "</td>" +
            "<td>" +

            "<label>边距�?<input value='1' class='ke-table-cellpadding' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +
            "<td>" +

            "</td>" +
            "<td>" +
            "<label>边框�?<input value='1' class='ke-table-border' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +
            "<td colspan='2'>" +
            "<label>" +
            "标题�?input class='ke-table-caption' style='width:270px'>" +
            "</label>" +
            "</td>" +
            "</tr>" +
            "</table>",
        footHtml = "<button class='ke-table-ok'>确定</button> <button class='ke-table-cancel'>取消</button>",
        ContextMenu = KE.ContextMenu,
        tableRules = ["tr","th","td","tbody","table"],trim = S.trim;

    /**
     * table 编辑模式下显示虚线边框便于编�?
     */
    var showBorderClassName = 'ke_show_border',
        cssStyleText,
        cssTemplate =
            // TODO: For IE6, we don't have child selector support,
            // where nested table cells could be incorrect.
            ( UA.ie === 6 ?
                [
                    'table.%2,',
                    'table.%2 td, table.%2 th,',
                    '{',
                    'border : #d3d3d3 1px dotted',
                    '}'
                ] :
                [
                    ' table.%2,',
                    ' table.%2 > tr > td,  table.%2 > tr > th,',
                    ' table.%2 > tbody > tr > td,  table.%2 > tbody > tr > th,',
                    ' table.%2 > thead > tr > td,  table.%2 > thead > tr > th,',
                    ' table.%2 > tfoot > tr > td,  table.%2 > tfoot > tr > th',
                    '{',
                    'border : #d3d3d3 1px dotted',
                    '}'
                ] ).join('');

    cssStyleText = cssTemplate.replace(/%2/g, showBorderClassName);

    if (!KE.TableUI) {
        (function() {


            var dataProcessor = KE.HtmlDataProcessor,
                dataFilter = dataProcessor && dataProcessor.dataFilter,
                htmlFilter = dataProcessor && dataProcessor.htmlFilter;

            if (dataFilter) {
                dataFilter.addRules({
                    elements :  {
                        'table' : function(element) {
                            var attributes = element.attributes,
                                cssClass = attributes[ 'class' ],
                                border = parseInt(attributes.border, 10);

                            if (!border || border <= 0)
                                attributes[ 'class' ] = ( cssClass || '' ) + ' ' + showBorderClassName;
                        }
                    }
                });
            }

            if (htmlFilter) {
                htmlFilter.addRules({
                    elements :            {
                        'table' : function(table) {
                            var attributes = table.attributes,
                                cssClass = attributes[ 'class' ];

                            if (cssClass) {
                                attributes[ 'class' ] =
                                    S.trim(cssClass.replace(showBorderClassName, "").replace(/\s{2}/, " "));
                            }
                        }

                    }
                });
            }
            function TableUI(editor) {
                var self = this;
                self.editor = editor;
                self.selectedTable = null;
                editor._toolbars = editor._toolbars || {};
                editor._toolbars["table"] = self;
                self._init();
            }


            function valid(str) {
                return trim(str).length != 0;
            }

            S.augment(TableUI, {
                _init:function() {
                    var self = this,
                        editor = self.editor,
                        toolBarDiv = editor.toolBarDiv,
                        myContexts = {};
                    self.el = new TripleButton({
                        //text:"table",
                        contentCls:"ke-toolbar-table",
                        title:"表格",
                        container:toolBarDiv
                    });
                    var el = self.el;
                    el.on("offClick", self._tableShow, self);

                    for (var f in contextMenu) {
                        (function(f) {
                            myContexts[f] = function() {
                                editor.fire("save");
                                editor.focus();
                                contextMenu[f](editor);
                                editor.fire("save");
                            }
                        })(f);
                    }
                    ContextMenu.register(editor.document, {
                        rules:tableRules,
                        width:"120px",
                        funcs:myContexts
                    });

                    KE.Utils.lazyRun(this, "_prepareTableShow", "_realTableShow");

                },
                _tableInit:function() {
                    var self = this,
                        editor = self.editor,
                        d = new Overlay({
                            width:"350px",
                            mask:true,
                            title:"编辑表格"
                        }),
                        body = d.body;
                    d.body.html(TABLE_HTML);
                    d.foot.html(footHtml);
                    d.twidth = d.body.one(".ke-table-width");
                    d.theight = d.body.one(".ke-table-height");
                    d.tcellspacing = d.body.one(".ke-table-cellspacing");
                    d.tcellpadding = d.body.one(".ke-table-cellpadding");
                    d.tborder = d.body.one(".ke-table-border");
                    d.tcaption = d.body.one(".ke-table-caption");
                    d.talign = d.body.one(".ke-table-align");
                    d.trows = d.body.one(".ke-table-rows");
                    d.tcols = d.body.one(".ke-table-cols");
                    d.thead = d.body.one(".ke-table-head");
                    var tok = d.foot.one(".ke-table-ok"),
                        tclose = d.foot.one(".ke-table-cancel");
                    d.twidthunit = d.body.one(".ke-table-width-unit");
                    self.tableDialog = d;
                    tok.on("click", self._tableOk, self);
                    d.on("hide", function() {
                        //清空
                        self.selectedTable = null;
                    });
                    tclose.on("click", function() {
                        d.hide();
                    });
                },
                _tableOk:function() {
                    var self = this;
                    if (!self.selectedTable) {
                        self._genTable();
                    } else {
                        self._modifyTable();
                    }
                },
                _modifyTable:function() {
                    var self = this,
                        d = self.tableDialog,
                        selectedTable = self.selectedTable,
                        caption = selectedTable.one("caption");

                    if (valid(d.talign.val()))
                        selectedTable.attr("align", trim(d.talign.val()));

                    if (valid(d.tcellspacing.val()))
                        selectedTable.attr("cellspacing", trim(d.tcellspacing.val()));

                    if (valid(d.tcellpadding.val()))
                        selectedTable.attr("cellpadding", trim(d.tcellpadding.val()));

                    if (valid(d.tborder.val())) {
                        selectedTable.attr("border", trim(d.tborder.val()));
                    }
                    if (!valid(d.tborder.val()) || d.tborder.val() == "0") {
                        selectedTable.addClass(showBorderClassName);
                    } else {
                        selectedTable.removeClass(showBorderClassName);
                    }

                    if (valid(d.twidth.val()))
                        selectedTable.css("width", trim(d.twidth.val()) + d.twidthunit.val());

                    if (valid(d.theight.val()))
                        selectedTable.css("height", trim(d.theight.val()));

                    if (valid(d.tcaption.val())) {

                        if (caption && caption[0])
                            caption.html(trim(d.tcaption.val()));
                        else
                            new Node("<caption><span>" + trim(d.tcaption.val()) + "</span></caption>")
                                .insertBefore(selectedTable[0].firstChild);
                    } else if (caption) {
                        caption._4e_remove();
                    }
                    d.hide();
                },
                _genTable:function() {
                    var self = this,
                        d = self.tableDialog,
                        html = "<table ",
                        i,
                        cols = parseInt(d.tcols.val()),
                        rows = parseInt(d.trows.val()),
                        cellpad = UA.ie ? "" : "<br/>",
                        editor = self.editor;

                    if (S.trim(d.talign.val()).length != 0)
                        html += "align='" + S.trim(d.talign.val()) + "' ";
                    if (S.trim(d.tcellspacing.val()).length != 0)
                        html += "cellspacing='" + S.trim(d.tcellspacing.val()) + "' ";
                    if (S.trim(d.tcellpadding.val()).length != 0)
                        html += "cellpadding='" + S.trim(d.tcellpadding.val()) + "' ";
                    if (S.trim(d.tborder.val()).length != 0)
                        html += "border='" + S.trim(d.tborder.val()) + "' ";
                    if (S.trim(d.twidth.val()).length != 0 || (S.trim(d.theight.val()).length != 0)) {
                        html += "style='";
                        if (S.trim(d.twidth.val()).length != 0) {
                            html += "width:" + S.trim(d.twidth.val()) + d.twidthunit.val() + ";"
                        }
                        if (S.trim(d.theight.val()).length != 0) {
                            html += "height:" + S.trim(d.theight.val()) + "px;"
                        }
                        html += "' "
                    }
                    if (S.trim(d.tborder.val()).length == 0 || S.trim(d.tborder.val()) == "0") {
                        html += "class='" + showBorderClassName + "' "
                    }

                    html += ">";
                    if (S.trim(d.tcaption.val())) {
                        html += "<caption><span>" + S.trim(d.tcaption.val()) + "</span></caption>";
                    }
                    if (d.thead.val()) {
                        html += "<thead>";
                        html += "<tr>";
                        for (i = 0; i < cols; i++)
                            html += "<th>" + cellpad + "</th>";
                        html += "</tr>";
                        html += "</thead>";
                    }

                    html += "<tbody>";
                    for (var r = 0; r < rows; r++) {
                        html += "<tr>";
                        for (i = 0; i < cols; i++) {
                            html += "<td>" + cellpad + "</td>";
                        }
                        html += "</tr>";
                    }
                    html += "</tbody>";
                    html += "</table>";

                    var table = new Node(html, null, editor.document);
                    editor.insertElement(table);
                    d.hide();

                },
                _fillTableDialog:function() {
                    var self = this,
                        d = self.tableDialog,
                        selectedTable = self.selectedTable,
                        caption = selectedTable.one("caption");


                    d.talign.val(selectedTable.attr("align") || "");


                    d.tcellspacing.val(selectedTable.attr("cellspacing") || "");


                    d.tcellpadding.val(selectedTable.attr("cellpadding") || "");


                    d.tborder.val(selectedTable.attr("border") | "");
                    var w = selectedTable._4e_style("width") || "";

                    d.twidth.val(w.replace(/px|%/i, ""));
                    if (w.indexOf("%") != -1) d.twidthunit.val("%");
                    else d.twidthunit.val("px");

                    d.theight.val((selectedTable._4e_style("height") || "").replace(/px|%/i, ""));
                    var c = "";
                    if (caption) {
                        c = caption.text();
                    }
                    d.tcaption.val(c);

                    d.trows.val(selectedTable.one("tbody").children().length);
                    d.tcols.val(selectedTable.one("tr").children().length);
                    d.thead.val(selectedTable._4e_first(function(n) {
                        return n._4e_name() == "thead";
                    }) ? '1' : '');
                },
                _realTableShow:function() {
                    var self = this;

                    if (self.selectedTable) {
                        self._fillTableDialog();
                        self.tableDialog.body.all(".ke-table-create-only").attr("disabled", "disabled");
                    } else {
                        self.tableDialog.body.all(".ke-table-create-only").removeAttr("disabled");
                    }
                    self.tableDialog.show();
                    //console.log("do!");
                },
                _prepareTableShow:function() {
                    var self = this;
                    self._tableInit();
                    //console.log("prepare!");
                },
                _tableShow:    function() {
                    var self = this;
                    self._prepareTableShow();
                }
            });


            var cellNodeRegex = /^(?:td|th)$/;

            function getSelectedCells(selection) {
                // Walker will try to split text nodes, which will make the current selection
                // invalid. So save bookmarks before doing anything.
                var bookmarks = selection.createBookmarks(),
                    ranges = selection.getRanges(),
                    retval = [],
                    database = {};

                function moveOutOfCellGuard(node) {
                    // Apply to the first cell only.
                    if (retval.length > 0)
                        return;

                    // If we are exiting from the first </td>, then the td should definitely be
                    // included.
                    if (node[0].nodeType == KEN.NODE_ELEMENT && cellNodeRegex.test(node._4e_name())
                        && !node._4e_getData('selected_cell')) {
                        node._4e_setMarker(database, 'selected_cell', true);
                        retval.push(node);
                    }
                }

                for (var i = 0; i < ranges.length; i++) {
                    var range = ranges[ i ];

                    if (range.collapsed) {
                        // Walker does not handle collapsed ranges yet - fall back to old API.
                        var startNode = range.getCommonAncestor(),
                            nearestCell = startNode._4e_ascendant('td', true) || startNode._4e_ascendant('th', true);
                        if (nearestCell)
                            retval.push(nearestCell);
                    } else {
                        var walker = new Walker(range),
                            node;
                        walker.guard = moveOutOfCellGuard;

                        while (( node = walker.next() )) {
                            // If may be possible for us to have a range like this:
                            // <td>^1</td><td>^2</td>
                            // The 2nd td shouldn't be included.
                            //
                            // So we have to take care to include a td we've entered only when we've
                            // walked into its children.

                            var parent = node.parent();
                            if (parent && cellNodeRegex.test(parent._4e_name()) && !parent._4e_getData('selected_cell')) {
                                parent._4e_setMarker(database, 'selected_cell', true);
                                retval.push(parent);
                            }
                        }
                    }
                }

                KE.Utils.clearAllMarkers(database);

                // Restore selection position.
                selection.selectBookmarks(bookmarks);

                return retval;
            }

            function clearRow($tr) {
                // Get the array of row's cells.
                var $cells = $tr.cells;

                // Empty all cells.
                for (var i = 0; i < $cells.length; i++) {
                    $cells[ i ].innerHTML = '';

                    if (!UA.ie)
                        ( new Node($cells[ i ]) )._4e_appendBogus();
                }
            }

            function insertRow(selection, insertBefore) {
                // Get the row where the selection is placed in.
                var row = selection.getStartElement()._4e_ascendant('tr');
                if (!row)
                    return;

                // Create a clone of the row.
                var newRow = row._4e_clone(true);

                // Insert the new row before of it.
                newRow.insertBefore(row);

                // Clean one of the rows to produce the illusion of inserting an empty row
                // before or after.
                clearRow(insertBefore ? newRow[0] : row[0]);
            }

            function deleteRows(selectionOrRow) {
                if (selectionOrRow instanceof KE.Selection) {
                    var cells = getSelectedCells(selectionOrRow),
                        cellsCount = cells.length,
                        rowsToDelete = [],
                        cursorPosition,
                        previousRowIndex,
                        nextRowIndex;

                    // Queue up the rows - it's possible and likely that we have duplicates.
                    for (var i = 0; i < cellsCount; i++) {
                        var row = cells[ i ].parent(),
                            rowIndex = row[0].rowIndex;

                        !i && ( previousRowIndex = rowIndex - 1 );
                        rowsToDelete[ rowIndex ] = row;
                        i == cellsCount - 1 && ( nextRowIndex = rowIndex + 1 );
                    }

                    var table = row._4e_ascendant('table'),
                        rows = table[0].rows,
                        rowCount = rows.length;

                    // Where to put the cursor after rows been deleted?
                    // 1. Into next sibling row if any;
                    // 2. Into previous sibling row if any;
                    // 3. Into table's parent element if it's the very last row.
                    cursorPosition = new Node(
                        nextRowIndex < rowCount && table[0].rows[ nextRowIndex ] ||
                            previousRowIndex > 0 && table[0].rows[ previousRowIndex ] ||
                            table[0].parentNode);

                    for (i = rowsToDelete.length; i >= 0; i--) {
                        if (rowsToDelete[ i ])
                            deleteRows(rowsToDelete[ i ]);
                    }

                    return cursorPosition;
                }
                else if (selectionOrRow instanceof Node) {
                    table = selectionOrRow._4e_ascendant('table');

                    if (table[0].rows.length == 1)
                        table._4e_remove();
                    else
                        selectionOrRow._4e_remove();
                }

                return 0;
            }

            function insertColumn(selection, insertBefore) {
                // Get the cell where the selection is placed in.
                var startElement = selection.getStartElement(),
                    cell = startElement._4e_ascendant('td', true) || startElement._4e_ascendant('th', true);
                if (!cell)
                    return;
                // Get the cell's table.
                var table = cell._4e_ascendant('table'),
                    cellIndex = cell[0].cellIndex;
                // Loop through all rows available in the table.
                for (var i = 0; i < table[0].rows.length; i++) {
                    var $row = table[0].rows[ i ];
                    // If the row doesn't have enough cells, ignore it.
                    if ($row.cells.length < ( cellIndex + 1 ))
                        continue;
                    cell = new Node($row.cells[ cellIndex ].cloneNode(false));

                    if (!UA.ie)
                        cell._4e_appendBogus();
                    // Get back the currently selected cell.
                    var baseCell = new Node($row.cells[ cellIndex ]);
                    if (insertBefore)
                        cell.insertBefore(baseCell);
                    else
                        cell.insertAfter(baseCell);
                }
            }

            function getFocusElementAfterDelCols(cells) {
                var cellIndexList = [],
                    table = cells[ 0 ] && cells[ 0 ]._4e_ascendant('table'),
                    i,length,
                    targetIndex,targetCell;

                // get the cellIndex list of delete cells
                for (i = 0,length = cells.length; i < length; i++)
                    cellIndexList.push(cells[i][0].cellIndex);

                // get the focusable column index
                cellIndexList.sort();
                for (i = 1,length = cellIndexList.length; i < length; i++) {
                    if (cellIndexList[ i ] - cellIndexList[ i - 1 ] > 1) {
                        targetIndex = cellIndexList[ i - 1 ] + 1;
                        break;
                    }
                }

                if (!targetIndex)
                    targetIndex = cellIndexList[ 0 ] > 0 ? ( cellIndexList[ 0 ] - 1 )
                        : ( cellIndexList[ cellIndexList.length - 1 ] + 1 );

                // scan row by row to get the target cell
                var rows = table[0].rows;
                for (i = 0,length = rows.length; i < length; i++) {
                    targetCell = rows[ i ].cells[ targetIndex ];
                    if (targetCell)
                        break;
                }

                return targetCell ? new Node(targetCell) : table.previous();
            }

            function deleteColumns(selectionOrCell) {
                if (selectionOrCell instanceof KE.Selection) {
                    var colsToDelete = getSelectedCells(selectionOrCell),
                        elementToFocus = getFocusElementAfterDelCols(colsToDelete);

                    for (var i = colsToDelete.length - 1; i >= 0; i--) {
                        //某一列已经删除？？这�?��的cell再做�?!table判断处理
                        if (colsToDelete[ i ])
                            deleteColumns(colsToDelete[i]);
                    }

                    return elementToFocus;
                }
                else if (selectionOrCell instanceof Node) {
                    // Get the cell's table.
                    var table = selectionOrCell._4e_ascendant('table');

                    //该单元格�?��的列已经被删除了
                    if (!table)
                        return null;

                    // Get the cell index.
                    var cellIndex = selectionOrCell[0].cellIndex;

                    /*
                     * Loop through all rows from down to up, coz it's possible that some rows
                     * will be deleted.
                     */
                    for (i = table[0].rows.length - 1; i >= 0; i--) {
                        // Get the row.
                        var row = new Node(table[0].rows[ i ]);

                        // If the cell to be removed is the first one and the row has just one cell.
                        if (!cellIndex && row[0].cells.length == 1) {
                            deleteRows(row);
                            continue;
                        }

                        // Else, just delete the cell.
                        if (row[0].cells[ cellIndex ])
                            row[0].removeChild(row[0].cells[ cellIndex ]);
                    }
                }

                return null;
            }

            function placeCursorInCell(cell, placeAtEnd) {
                var range = new KE.Range(cell[0].ownerDocument);
                if (!range['moveToElementEditablePosition'](cell, placeAtEnd ? true : undefined)) {
                    range.selectNodeContents(cell);
                    range.collapse(placeAtEnd ? false : true);
                }
                range.select(true);
            }

            var contextMenu = {
                "表格属�?" : function(editor) {
                    var selection = editor.getSelection(),
                        startElement = selection && selection.getStartElement(),
                        table = startElement && startElement._4e_ascendant('table', true);
                    if (!table)
                        return;
                    var tableUI = editor._toolbars["table"];
                    tableUI.selectedTable = table;
                    tableUI._tableShow();
                },
                "删除表格" : function(editor) {
                    var selection = editor.getSelection(),
                        startElement = selection && selection.getStartElement(),
                        table = startElement && startElement._4e_ascendant('table', true);

                    if (!table)
                        return;

                    // Maintain the selection point at where the table was deleted.
                    selection.selectElement(table);
                    var range = selection.getRanges()[0];
                    range.collapse();
                    selection.selectRanges([ range ]);

                    // If the table's parent has only one child, remove it,except body,as well.( #5416 )
                    var parent = table.parent();
                    if (parent[0].childNodes.length == 1 && parent._4e_name() != 'body')
                        parent._4e_remove();
                    else
                        table._4e_remove();
                },

                '删除�?': function(editor) {
                    var selection = editor.getSelection();
                    placeCursorInCell(deleteRows(selection), undefined);

                },

                '删除�?' : function(editor) {
                    var selection = editor.getSelection(),
                        element = deleteColumns(selection);
                    element && placeCursorInCell(element, true);
                },

                '在上方插入行': function(editor) {
                    var selection = editor.getSelection();
                    insertRow(selection, true);
                },


                '在下方插入行' : function(editor) {
                    var selection = editor.getSelection();
                    insertRow(selection, undefined);
                },




                '在左侧插入列' : function(editor) {
                    var selection = editor.getSelection();
                    insertColumn(selection, true);
                },


                '在右侧插入列' : function(editor) {
                    var selection = editor.getSelection();
                    insertColumn(selection, undefined);
                }};

            KE.TableUI = TableUI;
        })();
    }
    editor.addPlugin(function() {
        var doc = editor.document;

        new KE.TableUI(editor);


        /**
         * 动�?加入显表格border css，便于编�?
         */
        var elem = DOM.create("<style>", null, doc);
        doc.getElementsByTagName("head")[0].appendChild(elem);

        if (elem.styleSheet) { // IE
            elem.styleSheet.cssText = cssStyleText;
        } else { // W3C
            elem.appendChild(doc.createTextNode(cssStyleText));
        }

    });
});
