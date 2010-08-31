/**
 * modified from ckeditor,process malform html for kissyeditor
 * @modifier: yiminghe@gmail.com
 */
KISSY.Editor.add("htmldataprocessor", function(
    //editor
    ) {
    var KE = KISSY.Editor;
    if (KE.HtmlDataProcessor) return;
    var
        S = KISSY,
        UA = S.UA,
        HtmlParser = KE.HtmlParser,
        htmlFilter = new HtmlParser.Filter(),
        dataFilter = new HtmlParser.Filter(),
        defaultDataFilterRules = {
            elementNames : [
                // Remove script,iframe style,link,meta
                [  /^script$/ , '' ],
                [  /^iframe$/ , '' ],
                [  /^style$/ , '' ],
                [  /^link$/ , '' ],
                [  /^meta$/ , '' ],
                [/^namespace$/,''],
                [  /^.+?:(.+)/,'$1' ]
            ],
            elements : {
                table:function(el) {
                    var border = el.attributes.border;
                    if (!border || border == "0") {
                        el.attributes['class']="ke_show_border";
                    }
                }
            },
            attributes :  {
                //防止word的垃圾class，全部杀掉算了，除了以ke_开头的编辑器内置class
                'class' : function(value
                    // , element
                    ) {
                    if (/^ke_/.test(value)) return value;
                    return false;
                },
                'style':function(value) {
                    if (S.trim(value))
                    //去除<i style="mso-bidi-font-style: normal">微软垃圾
                        return S.trim(value).replace(/mso-.+?(;|$)/ig, "$1")
                            //qc 3701，去除行高，防止乱掉
                            .replace(/line-height.+?(;|$)/ig, "")
                            //qc 3711，word pt 完全去掉
                            .replace(/font-size:.+?pt(;|$)/ig, "")
                            .replace(/font-family:.+?(;|$)/ig, "");
                    return false;
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
        //外部html进入编辑器
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
