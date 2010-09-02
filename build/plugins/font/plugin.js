/**
 * font formatting for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("font", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        KEStyle = KE.Style,
        TripleButton = KE.TripleButton,
        Node = S.Node;
    var
        FONT_SIZES = editor.cfg.pluginConfig["font-size"] ||
            ["8px","10px","12px",
                "14px","18px","24px","36px","48px","60px","72px","84px","96px","108px"],
        FONT_SIZE_STYLES = {},
        FONT_SIZE_ITEMS = [

        ],
        fontSize_style = {
            element        : 'span',
            styles        : { 'font-size' : '#(size)' },
            overrides    : [
                { element : 'font', attributes : { 'size' : null } }
            ]
        },
        FONT_FAMILIES = editor.cfg.pluginConfig["font-family"] || ["宋体","黑体","隶书",
            "楷体_GB2312","微软雅黑","Georgia","Times New Roman",
            "Impact","Courier New","Arial","Verdana","Tahoma"],
        FONT_FAMILY_STYLES = {},
        FONT_FAMILY_ITEMS = [],
        fontFamily_style = {
            element        : 'span',
            styles        : { 'font-family' : '#(family)' },
            overrides    : [
                { element : 'font', attributes : { 'face' : null } }
            ]
        },i;

    editor.cfg.pluginConfig["font-size"] = FONT_SIZES;
    editor.cfg.pluginConfig["font-family"] = FONT_FAMILIES;

    for (i = 0; i < FONT_SIZES.length; i++) {
        var size = FONT_SIZES[i];
        FONT_SIZE_STYLES[size] = new KEStyle(fontSize_style, {
            size:size
        });
        FONT_SIZE_ITEMS.push({
            name:size,
            value:size
        })
    }

    for (i = 0; i < FONT_FAMILIES.length; i++) {
        var family = FONT_FAMILIES[i];
        FONT_FAMILY_STYLES[family] = new KEStyle(fontFamily_style, {
            family:family
        });
        FONT_FAMILY_ITEMS.push({
            name:family,
            value:family,
            attrs:{
                style:"font-family:" + family
            }
        })
    }

    if (!KE.Font) {
        (function() {


            function Font(cfg) {
                var self = this;
                Font.superclass.constructor.call(self, cfg);
                self._init();
            }

            Font.ATTRS = {
                title:{},
                html:{},
                styles:{},
                editor:{}
            };

            S.extend(Font, S.Base, {

                _init:function() {
                    var self = this,
                        editor = self.get("editor"),
                        toolBarDiv = editor.toolBarDiv,
                        html = self.get("html");
                    self.el = new KE.Select({
                        container: toolBarDiv,
                        doc:editor.document,
                        width:self.get("width"),
                        popUpWidth:self.get("popUpWidth"),
                        title:self.get("title"),
                        items:self.get("html")
                    });

                    self.el.on("click", self._vChange, self);
                    editor.on("selectionChange", self._selectionChange, self);
                },

                _vChange:function(ev) {
                    var self = this,
                        editor = self.get("editor"),
                        v = ev.newVal,
                        pre = ev.preVal,
                        styles = self.get("styles");
                    editor.focus();
                    editor.fire("save");
                    if (v == pre) {
                        styles[v].remove(editor.document);
                        self.el.set("value", "");
                    } else {
                        styles[v].apply(editor.document);
                    }
                    editor.fire("save");
                },

                _selectionChange:function(ev) {
                    var self = this,
                        editor = self.get("editor"),
                        elementPath = ev.path,
                        elements = elementPath.elements,
                        styles = self.get("styles");
                    // For each element into the elements path.
                    for (var i = 0, element; i < elements.length; i++) {
                        element = elements[i];
                        // Check if the element is removable by any of
                        // the styles.
                        for (var value in styles) {
                            if (styles[ value ].checkElementRemovable(element, true)) {
                                self.el.set("value", value);
                                return;
                            }
                        }
                    }
                    this.el.reset("value");
                }
            });

            function SingleFont(cfg) {
                var self = this;
                SingleFont.superclass.constructor.call(self, cfg);
                self._init();
            }

            SingleFont.ATTRS = {
                editor:{},
                text:{},
                contentCls:{},
                title:{},
                style:{}
            };

            S.extend(SingleFont, S.Base, {
                _init:function() {
                    var self = this,
                        editor = self.get("editor"),
                        text = self.get("text"),
                        style = self.get("style"),
                        title = self.get("title");
                    self.el = new TripleButton({
                        text:text,
                        title:title,
                        contentCls:self.get("contentCls"),
                        container:editor.toolBarDiv
                    });
                    self.el.on("offClick", self._on, self);
                    self.el.on("onClick", self._off, self);
                    editor.on("selectionChange", self._selectionChange, self);
                },
                _on:function() {
                    var self = this,
                        editor = self.get("editor"),
                        text = self.get("text"),
                        style = self.get("style"),
                        title = self.get("title");
                    editor.fire("save");
                    style.apply(editor.document);
                    editor.fire("save");
                    editor.notifySelectionChange();
                    editor.focus();
                },
                _off:function() {
                    var self = this,
                        editor = self.get("editor"),
                        text = self.get("text"),
                        style = self.get("style"),
                        title = self.get("title");
                    editor.fire("save");
                    style.remove(editor.document);
                    editor.fire("save");
                    editor.notifySelectionChange();
                    editor.focus();
                },
                _selectionChange:function(ev) {
                    var self = this,
                        editor = self.get("editor"),
                        text = self.get("text"),
                        style = self.get("style"),
                        title = self.get("title"),
                        elementPath = ev.path;
                    if (style.checkActive(elementPath)) {
                        self.el.set("state", TripleButton.ON);
                    } else {
                        self.el.set("state", TripleButton.OFF);
                    }

                }
            });
            Font.SingleFont = SingleFont;
            KE.Font = Font;
        })();
    }
    editor.addPlugin(function() {
        new KE.Font({
            editor:editor,
            title:"大小",
            width:"30px",
            popUpWidth:"55px",
            styles:FONT_SIZE_STYLES,
            html:FONT_SIZE_ITEMS
        });

        new KE.Font({
            editor:editor,
            title:"字体",
            width:"110px",
            popUpWidth:"130px",
            styles:FONT_FAMILY_STYLES,
            html:FONT_FAMILY_ITEMS
        });

        new KE.Font.SingleFont({
            contentCls:"ke-toolbar-bold",
            title:"粗体 ",
            editor:editor,
            style:new KEStyle({
                element        : 'strong',
                overrides    : [
                    { element : 'b' },
                    {element        : 'span',
                        attributes         : { style:'font-weight: bold;' }}
                ]
            })
        });

        new KE.Font.SingleFont({
            contentCls:"ke-toolbar-italic",
            title:"斜体 ",
            editor:editor,
            style:new KEStyle({
                element        : 'em',
                overrides    : [
                    { element : 'i' },
                    {element        : 'span',
                        attributes         : { style:'font-style: italic;' }}
                ]
            })
        });

        new KE.Font.SingleFont({
            contentCls:"ke-toolbar-underline",
            title:"下划�?",
            editor:editor,
            style:new KEStyle({
                element        : 'u',
                overrides    : [
                    {element        : 'span',
                        attributes         : { style:'text-decoration: underline;' }}
                ]
            })
        });

        new KE.Font.SingleFont({
            contentCls:"ke-toolbar-strikeThrough",
            title:"删除�?",
            editor:editor,
            style:new KEStyle({
                element        : 'del',
                overrides    : [
                    {element        : 'span',
                        attributes         : { style:'text-decoration: line-through;' }},
                    { element : 's' }
                ]
            })
        });

    });

})
    ;
