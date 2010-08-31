/**
 * modified from ckeditor,process malform html for kissyeditor
 * @modifier: yiminghe@gmail.com
 */
KISSY.Editor.add("htmldataprocessor", function(
    //editor
    ) {
    var KE = KISSY.Editor;
    if (KE.HtmlDataProcessor) return;

    function filterStyle(value) {
        //自有类名去除
        var re = value.replace(/mso-[^;]+(;|$)/ig, "")
            //qc 3701，去除行高，防止乱掉
            .replace(/line-height[^;]+(;|$)/ig, "")
            //qc 3711，word pt 完全去掉
            .replace(/font-size[^;]+pt(;|$)/ig, "")
            .replace(/font-family[^;]+(;|$)/ig, "")
            .replace(/display\s*:\s*none\s*(;|$)/ig, "");
        return S.trim(re);
    }

    var
        S = KISSY,
        UA = S.UA,
        KEN = KE.NODE,
        HtmlParser = KE.HtmlParser,
        htmlFilter = new HtmlParser.Filter(),
        dataFilter = new HtmlParser.Filter(),
        defaultDataFilterRules = {
            elementNames : [
                // Remove script,iframe style,link,meta
                [  /^script$/i , '' ],
                [  /^iframe$/i , '' ],
                [  /^style$/i , '' ],
                [  /^link$/i , '' ],
                [  /^meta$/i , '' ],
                [/^\?xml.*$/i,''],
                [/^.*namespace.*$/i,'']
            ],
            elements : {
                font:function(el) {
                    delete el.name;
                },
                $:function(el) {
                    var tagName = el.name || "";
                    //ms world <o:p> 保留内容
                    if (tagName.indexOf(':') != -1) {
                        //先处理子孙节点，防止delete el.name后，子孙得不到处�?
                        //el.filterChildren();
                        delete el.name;
                    }
                },
                table:function(el) {
                    var border = el.attributes.border;
                    if (!border || border == "0") {
                        el.attributes['class'] = "ke_show_border";
                    }
                },
                //没有属�?的span去掉了了
                span:function(el) {
                    var style = el.attributes.style;
                    //console.log(style);
                    if (!style || !filterStyle(style)) {
                        //console.log("target");
                        el.filterChildren();
                        delete el.name;
                    }
                    //console.log("untarget");
                }
            },
            attributes :  {
                //防止word的垃圾class，全部杀掉算了，除了以ke_�?��的编辑器内置class
                'class' : function(value
                    // , element
                    ) {
                    if (/^ke_/.test(value)) return value;
                    return false;
                },
                'style':function(value) {
                    //去除<i style="mso-bidi-font-style: normal">微软垃圾
                    var re = filterStyle(value);
                    if (!re) return false;
                    return re;
                }
            },
            attributeNames :  [
                // Event attributes (onXYZ) must not be directly set. They can become
                // active in the editing area (IE|WebKit).
                [ ( /^on/ ), 'ck_on' ],
                [/^lang$/,'']
            ]
        },
        defaultHtmlFilterRules = {
            elementNames : [
                // Remove the "ke:" namespace prefix.
                [ ( /^ke:/ ), '' ],
                // Ignore <?xml:namespace> tags.
                [ ( /^\?xml:namespace$/ ), '' ]
            ],
            elements : {
                embed : function(element) {
                    var parent = element.parent;
                    // If the <embed> is child of a <object>, copy the width
                    // and height attributes from it.
                    if (parent && parent.name == 'object') {
                        var parentWidth = parent.attributes.width,
                            parentHeight = parent.attributes.height;
                        parentWidth && ( element.attributes.width = parentWidth );
                        parentHeight && ( element.attributes.height = parentHeight );
                    }
                },
                // Restore param elements into self-closing.
                param : function(param) {
                    param.children = [];
                    param.isEmpty = true;
                    return param;
                },
                // Remove empty link but not empty anchor.(#3829)
                a : function(element) {
                    if (!( element.children.length ||
                        element.attributes.name )) {
                        return false;
                    }
                },
                span:function(element) {
                    if (! element.children.length)return false;
                }
            },
            attributes :  {
            },
            attributeNames :  [
                [ ( /^ck_on/ ), 'on' ]
            ]
        }, protectElementNamesRegex = /(<\/?)((?:object|embed|param|html|body|head|title)[^>]*>)/gi;
    if (UA.ie) {
        // IE outputs style attribute in capital letters. We should convert
        // them back to lower case.
        defaultHtmlFilterRules.attributes.style = function(value
            // , element
            ) {
            return value.toLowerCase();
        };
    }

    htmlFilter.addRules(defaultHtmlFilterRules);
    dataFilter.addRules(defaultDataFilterRules);
    /*
     (function() {
     // Regex to scan for &nbsp; at the end of blocks, which are actually placeholders.
     // Safari transforms the &nbsp; to \xa0. (#4172)
     var tailNbspRegex = /^[\t\r\n ]*(?:&nbsp;|\xa0)$/;

     // Return the last non-space child node of the block (#4344).
     function lastNoneSpaceChild(block) {
     var lastIndex = block.children.length,
     last = block.children[ lastIndex - 1 ];
     while (last && last.type == KEN.NODE_TEXT && !S.trim(last.value))
     last = block.children[ --lastIndex ];
     return last;
     }

     function blockNeedsExtension(block) {
     var lastChild = lastNoneSpaceChild(block);

     return !lastChild
     || lastChild.type == KEN.NODE_ELEMENT && lastChild.name == 'br'
     // Some of the controls in form needs extension too,
     // to move cursor at the end of the form. (#4791)
     || block.name == 'form' && lastChild.name == 'input';
     }

     function trimFillers(block, fromSource) {
     // If the current node is a block, and if we're converting from source or
     // we're not in IE then search for and remove any tailing BR node.
     //
     // Also, any &nbsp; at the end of blocks are fillers, remove them as well.
     // (#2886)
     var children = block.children, lastChild = lastNoneSpaceChild(block);
     if (lastChild) {
     if (( fromSource || !UA.ie ) && lastChild.type == KEN.NODE_ELEMENT && lastChild.name == 'br')
     children.pop();
     if (lastChild.type == KEN.NODE_TEXT && tailNbspRegex.test(lastChild.value))
     children.pop();
     }
     }

     function extendBlockForDisplay(block) {
     trimFillers(block, true);

     if (blockNeedsExtension(block)) {
     if (UA.ie)
     block.add(new KE.HtmlParser.text('\xa0'));
     else
     block.add(new KE.HtmlParser.element('br', {}));
     }
     }

     // Find out the list of block-like tags that can contain <br>.
     var dtd = KE.XHTML_DTD;
     var blockLikeTags = KE.Utils.mix({}, dtd.$block, dtd.$listItem, dtd.$tableContent);
     for (var i in blockLikeTags) {
     if (! ( 'br' in dtd[i] ))
     delete blockLikeTags[i];
     }
     // We just avoid filler in <pre> right now.
     // TODO: Support filler for <pre>, line break is also occupy line height.
     delete blockLikeTags.pre;
     var defaultDataBlockFilterRules = { elements : {} };
     for (var i in blockLikeTags)
     defaultDataBlockFilterRules.elements[ i ] = extendBlockForDisplay;
     dataFilter.addRules(defaultDataBlockFilterRules);
     })();
     */

    KE.HtmlDataProcessor = {
        htmlFilter:htmlFilter,
        dataFilter:dataFilter,
        //编辑器html到外部html
        toHtml:function(html, fixForBody) {
            //fixForBody = fixForBody || "p";
            // Now use our parser to make further fixes to the structure, as
            // well as apply the filter.
            var writer = new HtmlParser.HtmlWriter(),
                fragment = HtmlParser.Fragment.FromHtml(html, fixForBody);
            fragment.writeHtml(writer, htmlFilter);
            return writer.getHtml(true);
        },
        //外部html进入编辑�?
        toDataFormat : function(html, fixForBody) {
            // Certain elements has problem to go through DOM operation, protect
            // them by prefixing 'ke' namespace. (#3591)
            //html = html.replace(protectElementNamesRegex, '$1ke:$2');
            //fixForBody = fixForBody || "p";
            var writer = new HtmlParser.HtmlWriter(),
                fragment = HtmlParser.Fragment.FromHtml(html, fixForBody);
            writer.reset();
            fragment.writeHtml(writer, dataFilter);
            return writer.getHtml(true);
        }
    };
});
