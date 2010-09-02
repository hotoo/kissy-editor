/**
 * triple state button for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("button", function(editor) {
    var KE=KISSY.Editor,
        S = KISSY,
        ON = "on",
        OFF = "off",
        DISABLED = "disabled",
        Node = S.Node;
    var BUTTON_CLASS = "ke-triplebutton",
        ON_CLASS = "ke-triplebutton-on",
        OFF_CLASS = "ke-triplebutton-off",
        DISABLED_CLASS = "ke-triplebutton-disabled",
        BUTTON_HTML = "<a class='" +
            [BUTTON_CLASS,OFF_CLASS].join(" ")
            + "' href='#'" +
            "" +
            //' tabindex="-1"' +
            //' hidefocus="true"' +
            ' role="button"' +
            //' onblur="this.style.cssText = this.style.cssText;"' +
            //' onfocus="event&&event.preventBubble();return false;"' +
            "></a>";

    function TripleButton(cfg) {
        TripleButton.superclass.constructor.call(this, cfg);
        this._init();
    }

    TripleButton.ON = ON;
    TripleButton.OFF = OFF;
    TripleButton.DISABLED = DISABLED;

    TripleButton.ON_CLASS = ON_CLASS;
    TripleButton.OFF_CLASS = OFF_CLASS;
    TripleButton.DISABLED_CLASS = DISABLED_CLASS;

    TripleButton.ATTRS = {
        state: {value:OFF},
        container:{},
        text:{},
        contentCls:{},
        cls:{}
    };


    S.extend(TripleButton, S.Base, {
        _init:function() {
            var self = this,container = self.get("container")[0] || self.get("container");
            self.el = new Node(BUTTON_HTML);
            self.el._4e_unselectable();
            self._attachCls();
            if (this.get("text"))
                self.el.html(this.get("text"));
            else if (this.get("contentCls")) {
                self.el.html("<span class='ke-toolbar-item " + this.get("contentCls") + "'></span>");
                self.el.one("span")._4e_unselectable();
            }
            if (self.get("title")) self.el.attr("title", self.get("title"));
            container.appendChild(self.el[0]);
            self.el.on("click", self._action, self);
            self.on("afterStateChange", self._stateChange, self);
        },
        _attachCls:function() {
            var cls = this.get("cls");
            if (cls) this.el.addClass(cls);
        },

        _stateChange:function(ev) {
            var n = ev.newVal;
            this["_" + n]();
            this._attachCls();
        },

        _action:function(ev) {
            this.fire(this.get("state") + "Click", ev);
            this.fire("click", ev);
            ev.preventDefault();
        },
        _on:function() {
            this.el[0].className = [BUTTON_CLASS,ON_CLASS].join(" ");
        },
        _off:function() {
            this.el[0].className = [BUTTON_CLASS,OFF_CLASS].join(" ");
        },
        _disabled:function() {
            this.el[0].className = [BUTTON_CLASS,DISABLED_CLASS].join(" ");
        }
    });
    KE.TripleButton = TripleButton;
});
/**
 * contextmenu for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("contextmenu", function() {
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node,
        DOM = S.DOM,
        Event = S.Event;
    var HTML = "<div class='ke-menu' onmousedown='return false;'></div>";


    function ContextMenu(config) {
        this.cfg = S.clone(config);
        KE.Utils.lazyRun(this, "_prepareShow", "_realShow");
    }

    var global_rules = [];
    /**
     * 多菜单管理
     */
    ContextMenu.register = function(doc, cfg) {

        var cm = new ContextMenu(cfg);

        global_rules.push({
            doc:doc,
            rules:cfg.rules,
            instance:cm
        });

        if (!doc.ke_contextmenu) {
            doc.ke_contextmenu = 1;
            Event.on(doc, "mousedown", ContextMenu.hide);
            Event.on(doc, "contextmenu", function(ev) {
                ContextMenu.hide.call(this);
                var t = new Node(ev.target);
                while (t) {
                    var name = t._4e_name(),stop = false;
                    if (name == "body")break;
                    for (var i = 0; i < global_rules.length; i++) {
                        var instance = global_rules[i].instance,
                            rules = global_rules[i].rules,
                            doc2 = global_rules[i].doc;
                        if (doc === doc2 && applyRules(t[0], rules)) {


                            ev.preventDefault();
                            stop = true;
                            //ie 右键作用中，不会发生焦点转移，光标移动
                            //只能右键作用完后才能，才会发生光标移动,range变化
                            //异步右键操作
                            //qc #3764,#3767
                            setTimeout(function() {
                                instance.show(KE.Utils.getXY(ev.pageX, ev.pageY, doc, document));
                            }, 30);

                            break;
                        }
                    }
                    if (stop) break;
                    t = t.parent();
                }
            });
        }
        return cm;
    };

    function applyRules(elem, rules) {
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            if (DOM.test(elem, rule))return true;
        }
        return false;
    }

    ContextMenu.hide = function() {
        var doc = this;
        for (var i = 0; i < global_rules.length; i++) {
            var instance = global_rules[i].instance,doc2 = global_rules[i].doc;
            if (doc === doc2)
                instance.hide();
        }
    };

    var Overlay = KE.SimpleOverlay;
    S.augment(ContextMenu, {
        /**
         * 根据配置构造右键菜单内容
         */
        _init:function() {
            var self = this,cfg = self.cfg,funcs = cfg.funcs;
            self.elDom = new Node(HTML);
            var el = self.elDom;
            el.css("width", cfg.width);
            document.body.appendChild(el[0]);
            //使它具备 overlay 的能力，其实这里并不是实体化
            self.el = new Overlay({el:el});

            for (var f in funcs) {
                var a = new Node("<a href='#'>" + f + "</a>");
                el[0].appendChild(a[0]);
                (function(a, func) {
                    a._4e_unselectable();
                    a.on("click", function(ev) {
                        //先 hide 还原编辑器内焦点
                        self.hide();
                        //console.log("contextmenu hide");
                        ev.halt();
                        //给 ie 一点 hide() 中的事件触发 handler 运行机会，原编辑器获得焦点后再进行下步操作
                        setTimeout(func, 30);
                    });
                })(a, funcs[f]);
            }

        },

        hide : function() {
            this.el && this.el.hide();
        },
        _realShow:function(offset) {
            this.el.show(offset);
        },
        _prepareShow:function() {
            this._init();
        },
        show:function(offset) {
            this._prepareShow(offset);
        }
    });

    KE.ContextMenu = ContextMenu;
});
/**
 * simple overlay for kissy editor using lazyRun
 * @author yiminghe@gmail.com
 * @refer http://yiminghe.javaeye.com/blog/734867
 */
KISSY.Editor.add("overlay", function() {

    var KE = KISSY.Editor,
        S = KISSY,
        UA = S.UA,
        focusManager = KE.focusManager,
        Node = S.Node,
        //Event = S.Event,
        DOM = S.DOM;

    function Overlay() {
        var self = this;
        Overlay.superclass.constructor.apply(self, arguments);
        self._init();

        if (S.UA.ie === 6) {

            self.on("show", function() {
                var el = self.get("el");
                var bw = parseInt(el.css("width")),
                    bh = el[0].offsetHeight;
                d_iframe && d_iframe.css({
                    width: bw + "px",
                    height: bh + "px"
                });
                d_iframe && d_iframe.offset(self.get("el").offset());

            });
            self.on("hide", function() {
                d_iframe && d_iframe.offset({
                    left:-999,
                    top:-999
                });
            });
        }
        if (self.get("mask")) {
            self.on("show", function() {
                mask && mask.css({"left":"0px","top":"0px"});
                mask_iframe && mask_iframe.css({"left":"0px","top":"0px"});
            });
            self.on("hide", function() {
                mask && mask.css({"left":"-9999px",top:"-9999px"});
                mask_iframe && mask_iframe.css({"left":"-9999px",top:"-9999px"});
            });
        }
        self.hide();
    }

    var mask ,
        //loading,
        mask_iframe,d_iframe;

    Overlay.init = function() {

        var body = document.body;
        mask = new Node("<div class=\"ke-mask\">&nbsp;</div>");
        mask.css({"left":"-9999px",top:"-9999px"});
        mask.css({
            "width": "100%",
            "height": DOM.docHeight() + "px",
            "opacity": 0.4
        });
        mask.appendTo(body);

        if (S.UA.ie == 6) {
            d_iframe = new Node("<" + "iframe class='ke-dialog-iframe'></iframe>");
            body.appendChild(d_iframe[0]);
            mask_iframe = new Node("<" + "iframe class='ke-mask'></iframe>");
            mask_iframe.css({"left":"-9999px",top:"-9999px"});
            mask_iframe.css({
                "width": "100%",
                "height": DOM.docHeight() + "px",
                "opacity": 0.4
            });
            mask_iframe.appendTo(body);
        }
        /*
         build全部文件，不动态加载
         loading = new Node("<div class='ke-loading'>" +
         "loading ...." +
         "</div>");
         loading.appendTo(document.body);*/
        Overlay.init = null;
        // Overlay.loading = new Overlay({el:loading,mask:true});
    };


    Overlay.ATTRS = {
        title:{value:""},
        width:{value:"450px"},
        visible:{value:false},
        //帮你管理焦点
        focusMgr:{value:true},
        mask:{value:false}
    };

    S.extend(Overlay, S.Base, {
        _init:function() {
            //just manage container
            var self = this,el = self.get("el");

            self.on("afterVisibleChange", function(ev) {
                var v = ev.newVal;
                if (v) {
                    if (typeof v == "boolean") {
                        self.center();
                    } else el.offset(v);
                    self.fire("show");
                } else {
                    el.css({"left":"-9999px",top:"-9999px"});
                    self.fire("hide");
                }
            });
            if (self.get("focusMgr"))
                self.on("beforeVisibleChange", self._editorFocusMg, self);

            if (el) {
                //焦点管理，显示时用a获得焦点
                el[0].appendChild(new Node("<a href='#' class='ke-focus' " +
                    "style='" +
                    "width:0;" +
                    "height:0;" +
                    "margin:0;" +
                    "padding:0;" +
                    "overflow:hidden;" +
                    "outline:none;" +
                    "font-size:0;'" +
                    "></a>")[0]);
                self.el = el;

            } else {

                //also gen html
                el = new Node("<div class='ke-dialog' style='width:" +
                    self.get("width") +
                    "'><div class='ke-hd'>" +
                    "<span class='ke-hd-title'>" +
                    self.get("title") +
                    "</span>"
                    + "<span class='ke-hd-x'><a class='ke-close' href='#'>X</a></span>"
                    + "</div>" +
                    "<div class='ke-bd'></div>" +
                    "<div class='ke-ft'>" +
                    "</div>" +
                    "<a href='#' tabindex='-1' class='ke-focus'></a>" +
                    "</div>");
                document.body.appendChild(el[0]);
                self.set("el", el);
                self.el = el;
                self.body = el.one(".ke-bd");
                self.foot = el.one(".ke-ft");
                self._close = el.one(".ke-close");
                self._title = el.one(".ke-hd-title").one("h1");

                self._close.on("click", function(ev) {
                    ev.preventDefault();
                    self.hide();
                });
            }
            //初始状态隐藏
            el.css({"left":"-9999px",top:"-9999px"});
        },
        center:function() {
            var el = this.get("el"),
                bw = parseInt(el.css("width")),
                bh = el[0].offsetHeight,
                vw = DOM.viewportWidth(),
                vh = DOM.viewportHeight(),
                bl = (vw - bw) / 2 + DOM.scrollLeft(),
                bt = (vh - bh) / 2 + DOM.scrollTop();
            if ((bt - DOM.scrollTop()) > 200) bt -= 150;
            el.css({
                left: bl + "px",
                top: bt + "px"
            });
        },
        _prepareShow:function() {
            Overlay.init();
        },
        _getFocusEl:function() {
            var self = this;
            if (self._focusEl) {
                return self._focusEl;
            }
            return (self._focusEl = self.el.one(".ke-focus")[0]);
        },
        /**
         * 焦点管理，弹出前记住当前的焦点所在editor
         * 隐藏好重新focus当前的editor
         */
        _editorFocusMg:function(ev) {
            var self = this,editor = self._focusEditor, v = ev.newVal;
            //将要出现
            if (v) {

                //保存当前焦点editor
                self._focusEditor = focusManager.currentInstance();
                editor = self._focusEditor;
                //console.log("give up focus : " + editor);
                //聚焦到当前窗口
                self._getFocusEl().focus();
                var input = self.el.one("input");
                if (input) {
                    setTimeout(function() {
                        //ie 不可聚焦会错哦 disabled ?
                        try {
                            input[0].focus();
                            input[0].select();
                        } catch(e) {
                        }
                        //必须延迟！选中第一个input
                    }, 0);
                } else {
                    /*
                     * IE BUG: If the initial focus went into a non-text element (e.g. button),
                     * then IE would still leave the caret inside the editing area.
                     */
                    if (UA.ie && editor) {
                        var $selection = editor.document.selection,
                            $range = $selection.createRange();
                        if ($range) {
                            if (
                            //修改ckeditor，如果单纯选择文字就不用管了
                            //$range.parentElement && $range.parentElement().ownerDocument == editor.document
                            //||
                            //缩放图片那个框在ie下会突出浮动层来
                                $range.item && $range.item(0).ownerDocument == editor.document) {
                                var $myRange = document.body.createTextRange();
                                $myRange.moveToElementText(self.el._4e_first()[0]);
                                $myRange.collapse(true);
                                $myRange.select();
                            }
                        }
                    }
                }
            }
            //将要隐藏
            else {
                editor && editor.focus();
            }
        },
        _realShow : function(v) {
            var el = this.get("el");
            this.set("visible", v || true);
        } ,
        show:function(v) {
            this._prepareShow(v);
        }  ,
        hide:function() {
            var el = this.get("el");
            this.set("visible", false);
        }});
    KE.Utils.lazyRun(Overlay.prototype, "_prepareShow", "_realShow");

    KE.SimpleOverlay = Overlay;

});
/**
 * monitor user's paste key ,clear user input,modified from ckeditor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("clipboard", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node,
        UA = S.UA,
        KERange = KE.Range,
        KER = KE.RANGE,
        Event = S.Event;
    if (!KE.Paste) {
        (function() {
            function Paste(editor) {
                this.editor = editor;
                this._init();
            }

            S.augment(Paste, {
                _init:function() {
                    var self = this,editor = self.editor;
                    if (UA.ie)
                        Event.on(editor.document, "keydown", self._paste, self);
                    else  Event.on(editor.document, "paste", self._paste, self);
                },
                _paste:function(ev) {
                    if (ev.type === 'keydown' &&
                        !(ev.keyCode === 86 && (ev.ctrlKey || ev.metaKey))) {
                        return;
                    }

                    var self = this,editor = self.editor,doc = editor.document;
                    var sel = editor.getSelection(),
                        range = new KERange(doc);

                    // Create container to paste into
                    var pastebin = new Node(UA.webkit ? '<body></body>' : '<div></div>', null, doc);
                    // Safari requires a filler node inside the div to have the content pasted into it. (#4882)
                    UA.webkit && pastebin[0].appendChild(doc.createTextNode('\xa0'));
                    doc.body.appendChild(pastebin[0]);

                    pastebin.css({
                        position : 'absolute',
                        // Position the bin exactly at the position of the selected element
                        // to avoid any subsequent document scroll.
                        top : sel.getStartElement().offset().top + 'px',
                        width : '1px',
                        height : '1px',
                        overflow : 'hidden'
                    });

                    // It's definitely a better user experience if we make the paste-bin pretty unnoticed
                    // by pulling it off the screen.
                    pastebin.css('left', '-1000px');

                    var bms = sel.createBookmarks();

                    // Turn off design mode temporarily before give focus to the paste bin.

                    range.setStartAt(pastebin, KER.POSITION_AFTER_START);
                    range.setEndAt(pastebin, KER.POSITION_BEFORE_END);
                    range.select(true);

                    // Wait a while and grab the pasted contents
                    setTimeout(function() {
                        pastebin._4e_remove();

                        // Grab the HTML contents.
                        // We need to look for a apple style wrapper on webkit it also adds
                        // a div wrapper if you copy/paste the body of the editor.
                        // Remove hidden div and restore selection.
                        var bogusSpan;

                        pastebin = ( UA.webkit
                            && ( bogusSpan = pastebin._4e_first() )
                            && ( bogusSpan[0] && bogusSpan.hasClass('Apple-style-span') ) ?
                            bogusSpan : pastebin );
                        sel.selectBookmarks(bms);
                        //console.log(pastebin.html());
                        editor.insertHtml(pastebin.html());
                    }, 0);
                }
            });
            KE.Paste = Paste;
        })();
    }
    editor.addPlugin(function() {
        new KE.Paste(editor);
    });
});
/**
 * forecolor and background-color support for kissy editor
 * @author : yiminghe@gmail.com
 */
KISSY.Editor.add("color", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node,
        Event = S.Event,
        Overlay = KE.SimpleOverlay,
        KEStyle = KE.Style,
        DOM = S.DOM;

    function padding2(str) {
        return ("0" + str).slice(str.length - 1, str.length + 1);
    }

    var rgbColorReg = /^rgb\((\d+),(\d+),(\d+)\)$/i;
    //simpleColorReg = /^[0-9a-f]{3,3}$/i;

    function normalColor(color) {
        color = S.trim(color);
        if (color.charAt(0) == "#") color = color.substring(1);
        //console.log(color);
        color = color.replace(/\s+/g, "");
        var str = "",simpleColorReg = /^[0-9a-f]{3,3}$/i;

        if (simpleColorReg.test(color)) {
            str = color.replace(/[0-9a-f]/ig, function(m) {
                return m + m;
            });
        } else {
            var m = color.match(rgbColorReg);
            if (m && m[0]) {
                for (var i = 1; i < 4; i++) {
                    str += padding2(parseInt(m[i]).toString(16));
                }
            } else {
                str = color;
            }
        }


        return "#" + str.toLowerCase();
    }

    var colorButton_colors =
        ('000,800000,8B4513,2F4F4F,008080,000080,4B0082,696969,' +
            'B22222,A52A2A,DAA520,006400,40E0D0,0000CD,800080,808080,' +
            'F00,FF8C00,FFD700,008000,0FF,00F,EE82EE,A9A9A9,' +
            'FFA07A,FFA500,FFFF00,00FF00,AFEEEE,ADD8E6,DDA0DD,D3D3D3,' +
            'FFF0F5,FAEBD7,FFFFE0,F0FFF0,F0FFFF,F0F8FF,E6E6FA,FFF').split(/,/);
    var colorButton_foreStyle = {
        element        : 'span',
        styles        : { 'color' : '#(color)' },
        overrides    : [
            { element : 'font', attributes : { 'color' : null } }
        ]
    };

    var colorButton_backStyle = {
        element        : 'span',
        styles        : { 'background-color' : '#(color)' }
    };

    var html = "<div class='ke-popup-wrap ke-color-wrap'>" +
        "<a class='ke-color-remove' href=\"javascript:void('清除');\"><span>清除</span></a>" +
        "<table>";
    var BACK_STYLES = {},FORE_STYLES = {};
    for (var i = 0; i < 5; i++) {
        html += "<tr>";
        for (var j = 0; j < 8; j++) {
            var currentColor = normalColor(colorButton_colors[8 * i + j]);
            html += "<td>";
            html += "<a href='javascript:void(0);' class='ke-color-a'><span style='background-color:"
                + currentColor
                + "'></span></a>";
            html += "</td>";

            BACK_STYLES[currentColor] = new KEStyle(colorButton_backStyle, {
                color:currentColor
            });
            FORE_STYLES[currentColor] = new KEStyle(colorButton_foreStyle, {
                color:currentColor
            });
        }
        html += "</tr>";
    }
    // Value 'inherit'  is treated as a wildcard,
    // which will match any value.
    //清除已设格式
    BACK_STYLES["inherit"] = new KEStyle(colorButton_backStyle, {
        color:"inherit"
    });
    FORE_STYLES["inherit"] = new KEStyle(colorButton_foreStyle, {
        color:"inherit"
    });
    html += "</table></div>";

    if (!KE.ColorSupport) {
        (function() {


            var TripleButton = KE.TripleButton;

            function ColorSupport(cfg) {
                ColorSupport.superclass.constructor.call(this, cfg);
                this._init();
            }

            ColorSupport.ATTRS = {
                editor:{},
                styles:{},
                contentCls:{},
                text:{}
            };

            S.extend(ColorSupport, S.Base, {
                _init:function() {
                    var self = this,
                        editor = this.get("editor"),
                        toolBarDiv = editor.toolBarDiv,
                        el = new TripleButton({
                            container:toolBarDiv,
                            title:this.get("title"),
                            contentCls:this.get("contentCls")
                            //text:this.get("text")
                        });

                    el.on("offClick", this._showColors, this);
                    this.el = el;
                    KE.Utils.lazyRun(this, "_prepare", "_real");
                },
                _hidePanel:function(ev) {
                    var self = this;
                    //多窗口管理
                    if (DOM._4e_ascendant(ev.target, function(node) {
                        return node[0] === self.el.el[0];
                    }, true))return;
                    this.colorWin.hide();
                },
                _selectColor:function(ev) {
                    ev.halt();
                    var editor = this.get("editor");
                    var t = ev.target;
                    if (DOM._4e_name(t) == "span" || DOM._4e_name(t) == "a") {
                        t = new Node(t);
                        if (t._4e_name() == "a")
                            t = t.one("span");
                        var styles = this.get("styles");
                        editor.fire("save");
                        if (t._4e_style("background-color")) {
                            styles[normalColor(t._4e_style("background-color"))].apply(editor.document);
                        }
                        else {
                            styles["inherit"].remove(editor.document);
                        }
                        editor.fire("save");
                        editor.focus();
                        this.colorWin.hide();
                    }
                },
                _prepare:function() {
                    var self = this;
                    self.colorPanel = new Node(html);
                    self.colorWin = new Overlay({
                        el:this.colorPanel,
                        mask:false,
                        focusMgr:false
                    });
                    document.body.appendChild(self.colorPanel[0]);
                    self.colorPanel.on("click", self._selectColor, self);
                    Event.on(document, "click", self._hidePanel, self);
                    Event.on(editor.document, "click", self._hidePanel, self);
                },
                _real:function() {
                    var xy = this.el.el.offset();
                    xy.top += this.el.el.height() + 5;
                    if (xy.left + this.colorPanel.width() > DOM.viewportWidth() - 60) {
                        xy.left = DOM.viewportWidth() - this.colorPanel.width() - 60;
                    }
                    this.colorWin.show(xy);
                },
                _showColors:function(ev) {
                    var self = this;
                    self._prepare(ev);
                }
            });
            KE.ColorSupport = ColorSupport;
        })();
    }
    editor.addPlugin(function() {
        new KE.ColorSupport({
            editor:editor,
            styles:BACK_STYLES,
            title:"背景颜色",
            contentCls:"ke-toolbar-bgcolor",
            text:"bgcolor"
        });

        new KE.ColorSupport({
            editor:editor,
            styles:FORE_STYLES,
            title:"文本颜色",
            contentCls:"ke-toolbar-color",
            text:"color"
        });
    });
});
/**
 * element path shown in status bar,modified from ckeditor
 * @modifier: yiminghe@gmail.com
 */
KISSY.Editor.add("elementpaths", function(editor) {
    var KE = KISSY.Editor,S = KISSY,Node = S.Node,DOM = S.DOM;
    if (!KE.ElementPaths) {

        (function() {
            function ElementPaths(cfg) {
                this.cfg = cfg;
                this._cache = [];
                this._init();
            }

            S.augment(ElementPaths, {
                _init:function() {
                    var self = this,cfg = self.cfg,
                        editor = cfg.editor,
                        textarea = editor.textarea[0];
                    self.holder = new Node("<div>");
                    self.holder.appendTo(editor.statusDiv);
                    editor.on("selectionChange", self._selectionChange, self);
                },
                _selectionChange:function(ev) {
                    //console.log(ev);
                    var self = this,
                        cfg = self.cfg,
                        editor = cfg.editor,
                        holder = self.holder,
                        statusDom = holder[0] || holder;
                    var elementPath = ev.path,
                        elements = elementPath.elements,
                        element,i,
                        cache = self._cache;

                    for (i = 0; i < cache.length; i++) {
                        cache[i].detach("click");
                        cache[i]._4e_remove();
                    }
                    self._cache = [];
                    // For each element into the elements path.
                    for (i = 0; i < elements.length; i++) {
                        element = elements[i];

                        var a = new Node("<a href='#' class='elementpath'>" +
                            //考虑 fake objects
                            (element.attr("_ke_real_element_type") || element._4e_name())
                            + "</a>");
                        self._cache.push(a);
                        (function(element) {
                            a.on("click", function(ev2) {
                                ev2.halt();
                                editor.focus();
                                setTimeout(function() {
                                    editor.getSelection().selectElement(element);
                                }, 50);
                            });
                        })(element);
                        if (statusDom.firstChild) {
                            DOM.insertBefore(a[0], statusDom.firstChild);
                        }
                        else {
                            statusDom.appendChild(a[0]);
                        }
                    }

                }
            });
            KE.ElementPaths = ElementPaths;
        })();
    }

    editor.addPlugin(function() {
        new KE.ElementPaths({
            editor:editor
        });
    });
});
/**
 * monitor user's enter and shift enter keydown,modified from ckeditor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("enterkey", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        //DOM = S.DOM,
        UA = S.UA,
        headerTagRegex = /^h[1-6]$/,
        dtd = KE.XHTML_DTD,
        Node = S.Node,
        Event = S.Event,
        Walker = KE.Walker,
        ElementPath = KE.ElementPath;
    if (!KE.enterBlock) {

        (function() {

            function getRange(editor) {
                // Get the selection ranges.
                var ranges = editor.getSelection().getRanges();
                // Delete the contents of all ranges except the first one.
                for (var i = ranges.length - 1; i > 0; i--) {
                    ranges[ i ].deleteContents();
                }
                // Return the first range.
                return ranges[ 0 ];
            }

            function enterBlock(editor) {
                //debugger;
                // Get the range for the current selection.
                var range = getRange(editor);
                var doc = range.document;
                // Exit the list when we're inside an empty list item block. (#5376)
                if (range.checkStartOfBlock() && range.checkEndOfBlock()) {
                    var path = new ElementPath(range.startContainer),
                        block = path.block;
                    //只有两层？
                    if (block && ( block._4e_name() == 'li' || block.parent()._4e_name() == 'li' )) {
                        editor.execCommand('outdent');
                        return;
                    }
                }

                // Determine the block element to be used.
                var blockTag = "p";

                // Split the range.
                var splitInfo = range.splitBlock(blockTag);

                if (!splitInfo)
                    return;

                // Get the current blocks.
                var previousBlock = splitInfo.previousBlock,
                    nextBlock = splitInfo.nextBlock;

                var isStartOfBlock = splitInfo.wasStartOfBlock,
                    isEndOfBlock = splitInfo.wasEndOfBlock;

                var node;

                // If this is a block under a list item, split it as well. (#1647)
                if (nextBlock) {
                    node = nextBlock.parent();
                    if (node._4e_name() == 'li') {
                        nextBlock._4e_breakParent(node);
                        nextBlock._4e_move(nextBlock._4e_next(), true);
                    }
                }
                else if (previousBlock && ( node = previousBlock.parent() ) && node._4e_name() == 'li') {
                    previousBlock._4e_breakParent(node);
                    range.moveToElementEditablePosition(previousBlock._4e_next());
                    previousBlock._4e_move(previousBlock._4e_previous());
                }

                // If we have both the previous and next blocks, it means that the
                // boundaries were on separated blocks, or none of them where on the
                // block limits (start/end).
                if (!isStartOfBlock && !isEndOfBlock) {
                    // If the next block is an <li> with another list tree as the first
                    // child, we'll need to append a filler (<br>/NBSP) or the list item
                    // wouldn't be editable. (#1420)
                    if (nextBlock._4e_name() == 'li'
                        &&
                        ( node = nextBlock._4e_first(Walker.invisible(true)) )
                        && S.inArray(node._4e_name(), ['ul', 'ol']))
                        (UA.ie ? new Node(doc.createTextNode('\xa0')) : new Node(doc.createElement('br'))).insertBefore(node);

                    // Move the selection to the end block.
                    if (nextBlock)
                        range.moveToElementEditablePosition(nextBlock);
                }
                else {
                    var newBlock;

                    if (previousBlock) {
                        // Do not enter this block if it's a header tag, or we are in
                        // a Shift+Enter (#77). Create a new block element instead
                        // (later in the code).
                        if (previousBlock._4e_name() == 'li' || !headerTagRegex.test(previousBlock._4e_name())) {
                            // Otherwise, duplicate the previous block.
                            newBlock = previousBlock._4e_clone();
                        }
                    }
                    else if (nextBlock)
                        newBlock = nextBlock._4e_clone();

                    if (!newBlock)
                        newBlock = new Node(blockTag, null, doc);

                    // Recreate the inline elements tree, which was available
                    // before hitting enter, so the same styles will be available in
                    // the new block.
                    var elementPath = splitInfo.elementPath;
                    if (elementPath) {
                        for (var i = 0, len = elementPath.elements.length; i < len; i++) {
                            var element = elementPath.elements[ i ];

                            if (element._4e_equals(elementPath.block) || element._4e_equals(elementPath.blockLimit))
                                break;
                            //<li><strong>^</strong></li>
                            if (dtd.$removeEmpty[ element._4e_name() ]) {
                                element = element._4e_clone();
                                newBlock._4e_moveChildren(element);
                                newBlock.append(element);
                            }
                        }
                    }

                    if (!UA.ie)
                        newBlock._4e_appendBogus();

                    range.insertNode(newBlock);

                    // This is tricky, but to make the new block visible correctly
                    // we must select it.
                    // The previousBlock check has been included because it may be
                    // empty if we have fixed a block-less space (like ENTER into an
                    // empty table cell).
                    if (UA.ie && isStartOfBlock && ( !isEndOfBlock || !previousBlock[0].childNodes.length )) {
                        // Move the selection to the new block.
                        range.moveToElementEditablePosition(isEndOfBlock ? previousBlock : newBlock);
                        range.select();
                    }

                    // Move the selection to the new block.
                    range.moveToElementEditablePosition(isStartOfBlock && !isEndOfBlock ? nextBlock : newBlock);
                }

                if (!UA.ie) {
                    if (nextBlock) {
                        // If we have split the block, adds a temporary span at the
                        // range position and scroll relatively to it.
                        var tmpNode = new Node(doc.createElement('span'));

                        // We need some content for Safari.
                        tmpNode.html('&nbsp;');

                        range.insertNode(tmpNode);
                        tmpNode._4e_scrollIntoView();
                        range.deleteContents();
                    }
                    else {
                        // We may use the above scroll logic for the new block case
                        // too, but it gives some weird result with Opera.
                        newBlock._4e_scrollIntoView();
                    }
                }
                range.select();
            }


            function EnterKey(editor) {
                var doc = editor.document;
                Event.on(doc, "keydown", function(ev) {
                    var keyCode = ev.keyCode;
                    if (keyCode === 13) {
                        if (ev.shiftKey) {
                        } else {
                            editor.execCommand("enterBlock");
                            ev.preventDefault();
                        }

                    }
                });
            }

            EnterKey.enterBlock = enterBlock;
            KE.EnterKey = EnterKey;
        })();
    }
    editor.addPlugin(function() {
        editor.addCommand("enterBlock", {
            exec:KE.EnterKey.enterBlock
        });
        KE.EnterKey(editor);
    });


});
/**
 * fakeobjects for music ,video,flash
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("fakeobjects", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node,
        KEN = KE.NODE,
        HtmlParser = KE.HtmlParser,
        Editor = S.Editor,
        dataProcessor = editor.htmlDataProcessor,
        htmlFilter = dataProcessor && dataProcessor.htmlFilter,
        dataFilter = dataProcessor && dataProcessor.dataFilter;

    var htmlFilterRules = {
        elements : {
            /**
             * 生成最终html时，从编辑器html转化把fake替换为真实，并将style的width,height搞到属性上去
             * @param element
             */
            $ : function(element) {
                var attributes = element.attributes,
                    realHtml = attributes && attributes._ke_realelement,
                    realFragment = realHtml && new HtmlParser.Fragment.FromHtml(decodeURIComponent(realHtml)),
                    realElement = realFragment && realFragment.children[ 0 ];

                // If we have width/height in the element, we must move it into
                // the real element.
                if (realElement && element.attributes._ke_resizable) {
                    var style = element.attributes.style;
                    if (style) {
                        // Get the width from the style.
                        var match = /(?:^|\s)width\s*:\s*(\d+)/i.exec(style),
                            width = match && match[1];
                        // Get the height from the style.
                        match = /(?:^|\s)height\s*:\s*(\d+)/i.exec(style);
                        var height = match && match[1];

                        if (width)
                            realElement.attributes.width = width;

                        if (height)
                            realElement.attributes.height = height;
                    }
                }
                return realElement;
            }
        }
    };


    if (htmlFilter)
        htmlFilter.addRules(htmlFilterRules);


    if (dataProcessor) {
        S.mix(dataProcessor, {

            /**
             * 从外边真实的html，转为为编辑器代码支持的替换元素
             * @param realElement
             * @param className
             * @param realElementType
             * @param isResizable
             */
            createFakeParserElement:function(realElement, className, realElementType, isResizable) {
                var html;

                var writer = new HtmlParser.BasicWriter();
                realElement.writeHtml(writer);
                html = writer.getHtml();
                var style = realElement.attributes.style;
                if (realElement.attributes.width) {
                    style = "width:" + realElement.attributes.width + "px;" + style;
                }
                if (realElement.attributes.height) {
                    style = "height:" + realElement.attributes.height + "px;" + style;
                }
                var attributes = {
                    'class' : className,
                    src : KE.Config.base + 'assets/spacer.gif',
                    _ke_realelement : encodeURIComponent(html),
                    _ke_real_node_type : realElement.type,
                    style:style,
                    align : realElement.attributes.align || ''
                };

                if (realElementType)
                    attributes._ke_real_element_type = realElementType;

                if (isResizable)
                    attributes._ke_resizable = isResizable;

                return new HtmlParser.Element('img', attributes);
            }
        });
    }

    S.augment(Editor, {
        //ie6 ,object outHTML error
        createFakeElement:function(realElement, className, realElementType, isResizable, outerHTML) {
            var style = realElement.attr("style") || '';
            if (realElement.attr("width")) {
                style = "width:" + realElement.attr("width") + "px;" + style;
            }
            if (realElement.attr("height")) {
                style = "height:" + realElement.attr("height") + "px;" + style;
            }
            var self = this,attributes = {
                'class' : className,
                src : KE.Config.base + 'assets/spacer.gif',
                _ke_realelement : encodeURIComponent(outerHTML || realElement._4e_outerHtml()),
                _ke_real_node_type : realElement[0].nodeType,
                align : realElement.attr("align") || '',
                style:style
            };


            if (realElementType)
                attributes._ke_real_element_type = realElementType;

            if (isResizable)
                attributes._ke_resizable = isResizable;
            return new Node("<img/>", attributes, self.document);
        },

        restoreRealElement:function(fakeElement) {
            if (fakeElement.attr('_ke_real_node_type') != KEN.NODE_ELEMENT)
                return null;
            var html = (decodeURIComponent(fakeElement.attr('_ke_realelement')));

            var temp = new Node('<div>', null, this.document);
            temp.html(html);
            // When returning the node, remove it from its parent to detach it.
            var n = temp._4e_first(function(n) {
                return n[0].nodeType == KEN.NODE_ELEMENT;
            })._4e_remove();
            return n;
        }
    });

});
KISSY.Editor.add("flash", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        DOM = S.DOM,
        Event = S.Event,
        ContextMenu = KE.ContextMenu,
        Node = S.Node,
        KEN = KE.NODE,
        TripleButton = KE.TripleButton,
        Overlay = KE.SimpleOverlay,
        flashFilenameRegex = /\.swf(?:$|\?)/i,
        dataProcessor = editor.htmlDataProcessor,
        MUSIC_PLAYER = "niftyplayer.swf",
        CLS_FLASH = 'ke_flash',
        CLS_MUSIC = 'ke_music',
        TYPE_FLASH = 'flash',
        TYPE_MUSIC = 'music',
        getFlashUrl = KE.Utils.getFlashUrl,
        //htmlFilter = dataProcessor && dataProcessor.htmlFilter,
        dataFilter = dataProcessor && dataProcessor.dataFilter,
        flashRules = ["img." + CLS_FLASH];

    function isFlashEmbed(element) {
        var attributes = element.attributes;
        return (
            attributes.type == 'application/x-shockwave-flash'
                ||
                flashFilenameRegex.test(attributes.src || '')
            );
    }

    function music(src) {
        return src.indexOf(MUSIC_PLAYER) != -1;
    }

    dataFilter && dataFilter.addRules({
        elements : {
            'object' : function(element) {
                var attributes = element.attributes,i,
                    classId = attributes.classid && String(attributes.classid).toLowerCase(),
                    cls = CLS_FLASH,type = TYPE_FLASH;
                if (!classId) {
                    // Look for the inner <embed>
                    for (i = 0; i < element.children.length; i++) {
                        if (element.children[ i ].name == 'embed') {
                            if (!isFlashEmbed(element.children[ i ]))
                                return null;
                            if (music(element.children[ i ].attributes.src)) {
                                cls = CLS_MUSIC;
                                type = TYPE_MUSIC;
                            }
                            return dataProcessor.createFakeParserElement(element, cls, type, true);
                        }
                    }
                    return null;
                }

                for (i = 0; i < element.children.length; i++) {
                    var c = element.children[ i ];
                    if (c.name == 'param' && c.attributes.name == "movie") {
                        if (music(c.attributes.value)) {
                            cls = CLS_MUSIC;
                            type = TYPE_MUSIC;
                            break;
                        }
                    }
                }
                return dataProcessor.createFakeParserElement(element, cls, type, true);
            },

            'embed' : function(element) {
                if (!isFlashEmbed(element))
                    return null;
                var cls = CLS_FLASH,type = TYPE_FLASH;
                if (music(element.attributes.src)) {
                    cls = CLS_MUSIC;
                    type = TYPE_MUSIC;
                }
                return dataProcessor.createFakeParserElement(element, cls, type, true);
            }
        }}, 5);

    if (!KE.Flash) {

        (function() {


            var bodyHtml = "<div><p><label>地址： " +
                "<input class='ke-flash-url' style='width:280px' /></label></p>" +
                "<p style='margin:5px 0'><label>宽度： " +
                "<input class='ke-flash-width' style='width:110px' /></label>" +
                "&nbsp;&nbsp;<label>高度：<input class='ke-flash-height' " +
                "style='width:110px' /></label></p>" ,

                footHtml = "<button class='ke-flash-ok'>确定</button> " +
                    "<button class='ke-flash-cancel'>取消</button></div>";

            function Flash(editor) {
                var self = this;
                self.editor = editor;
                editor._toolbars = editor._toolbars || {};
                editor._toolbars["flash"] = self;
                self._init();
            }

            S.augment(Flash, {
                _init:function() {
                    var self = this,
                        editor = self.editor,
                        myContexts = {};
                    self.el = new TripleButton({
                        container:editor.toolBarDiv,
                        contentCls:"ke-toolbar-flash",
                        //text:"flash",
                        title:"Flash"
                    });
                    self.el.on("click", self._showConfig, this);
                    Event.on(editor.document, "dblclick", self._dbclick, self);
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
                        rules:flashRules,
                        width:"120px",
                        funcs:myContexts
                    });
                    KE.Utils.lazyRun(this, "_prepareShow", "_realShow");
                    editor.on("selectionChange", self._selectionChange, self);
                },
                _selectionChange:function(ev) {
                    var elementPath = ev.path,
                        //editor = this.editor,
                        elements = elementPath.elements;

                    if (elementPath && elements) {
                        var lastElement = elementPath.lastElement;
                        if (!lastElement) return;

                        var a = lastElement._4e_ascendant(function(node) {
                            return node._4e_name() === 'img' && (!!node.hasClass(CLS_FLASH));
                        }, true);

                        if (a) {
                            this._showTip(a);
                        } else {
                            this._hideTip();
                        }
                    }
                },
                _showTip:function(a) {
                    this._prepareTip(a);
                },
                _hideTip:function() {
                    Flash.tipwin && Flash.tipwin.hide();
                },
                _prepareTip:function() {
                    Flash.tip && Flash.tip();
                },
                _realTip:function(a) {
                    var self = this,
                        editor = self.editor,
                        xy = a._4e_getOffset(document);
                    xy.top += a.height() + 5;
                    Flash.tipwin.show(xy);
                    this.selectedFlash = a;
                    var r = editor.restoreRealElement(self.selectedFlash);
                    Flash.tipwin.flash = this;
                    Flash.tipurl.html(getFlashUrl(r));
                    Flash.tipurl.attr("href", getFlashUrl(r));
                },
                _dbclick:function(ev) {
                    var self = this,t = new Node(ev.target);
                    if (t._4e_name() === "img" && t.hasClass(CLS_FLASH)) {
                        self.selectedFlash = t;
                        self._showConfig();
                        ev.halt();
                    }

                },
                _prepareShow:function() {
                    var self = this;
                    self.d = new Overlay({
                        title:"编辑flash",
                        width:"350px",
                        mask:true
                    });
                    self.d.on("hide", function() {
                        //清空
                        self.selectedFlash = null;
                    });
                    self.d.body.html(bodyHtml);
                    self.d.foot.html(footHtml);
                    self._initD();
                },
                _realShow:function() {
                    this.d.show();
                },
                _showConfig:function() {
                    var self = this,editor = self.editor,d = self.d,f = self.selectedFlash;
                    self._prepareShow();

                    if (f) {
                        var r = editor.restoreRealElement(f);
                        if (r.attr("width")) {
                            self.dWidth.val(parseInt(r.attr("width")));
                        }
                        if (r.attr("height")) {
                            self.dHeight.val(parseInt(r.attr("height")));
                        }
                        if (r._4e_name() == "object") {
                            var params = r[0].childNodes;
                            for (var i = 0; i < params.length; i++) {
                                if (params[i].nodeType != KEN.NODE_ELEMENT)continue;
                                if ((DOM.attr(params[i], "name") || "").toLowerCase() == "movie") {
                                    self.dUrl.val(DOM.attr(params[i], "value"));
                                } else if (DOM._4e_name(params[i]) == "embed") {
                                    self.dUrl.val(DOM.attr(params[i], "src"));
                                } else if (DOM._4e_name(params[i]) == "object") {
                                    self.dUrl.val(DOM.attr(params[i], "data"));
                                }
                            }
                        } else if (r._4e_name() == "embed") {
                            self.dUrl.val(r.attr("src"));
                        }
                    } else {
                        self.dUrl.val("");
                        self.dWidth.val("");
                        self.dHeight.val("");
                    }
                },
                _initD:function() {
                    var self = this,editor = self.editor,d = self.d;
                    self.dHeight = d.el.one(".ke-flash-height");
                    self.dWidth = d.el.one(".ke-flash-width");
                    self.dUrl = d.el.one(".ke-flash-url");
                    var action = d.el.one(".ke-flash-ok"),
                        cancel = d.el.one(".ke-flash-cancel");
                    action.on("click", self._gen, self);
                    cancel.on("click", function() {
                        self.d.hide();
                    });
                },

                _gen: function() {
                    var self = this,editor = self.editor,
                        url = self.dUrl.val();
                    if (!url)return;
                    var outerHTML = '<object ' +
                        (parseInt(self.dWidth.val()) ? " width='" + parseInt(self.dWidth.val()) + "' " : ' ') +
                        (parseInt(self.dHeight.val()) ? " height='" + parseInt(self.dHeight.val()) + "' " : ' ') +
                        ' classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ' +
                        ' codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0">' +
                        '<param name="quality" value="high" />' +
                        '<param name="movie" value="' + url + '" />' +
                        '<embed ' +
                        (parseInt(self.dWidth.val()) ? " width='" + parseInt(self.dWidth.val()) + "' " : ' ') +
                        (parseInt(self.dHeight.val()) ? " height='" + parseInt(self.dHeight.val()) + "' " : ' ') +
                        'pluginspage="http://www.macromedia.com/go/getflashplayer" ' +
                        'quality="high" ' +
                        ' src="' + url + '" ' +
                        ' type="application/x-shockwave-flash"/>' +
                        '</object>',real = new Node(outerHTML, null, editor.document);
                    var substitute = editor.createFakeElement ? editor.createFakeElement(real, CLS_FLASH, TYPE_FLASH, true, outerHTML) : real;
                    editor.insertElement(substitute);
                    //如果是修改，就再选中
                    if (self.selectedFlash) {
                        editor.getSelection().selectElement(substitute);
                    }
                    self.d.hide();
                }
            });
            KE.Utils.lazyRun(Flash.prototype, "_prepareTip", "_realTip");
            KE.Flash = Flash;

            /**
             * tip初始化，所有共享一个tip
             */
            var tipHtml = '<div class="ke-bubbleview-bubble" onmousedown="return false;">Flash 网址： '
                + ' <a class="ke-bubbleview-url" target="_blank" href="#"></a> - '
                + '    <span class="ke-bubbleview-link ke-bubbleview-change">编辑</span> - '
                + '    <span class="ke-bubbleview-link ke-bubbleview-remove">删除</span>'
                + '</div>';
            Flash.tip = function() {
                var self = this,el = new Node(tipHtml),
                    tipchange = el.one(".ke-bubbleview-change"),
                    tipremove = el.one(".ke-bubbleview-remove");

                el._4e_unselectable();
                self.tipwin = new Overlay({el:el,focusMgr:false});
                document.body.appendChild(el[0]);
                //KE.Tips["flash"]=self.tipwin;
                self.tipurl = el.one(".ke-bubbleview-url");
                self.tipwin.on("hide", function() {
                    var flash = self.tipwin.flash;
                    flash && (flash.selectedFlash = null);
                });
                //点击source要关闭
                Event.on(document, "click", function() {
                    self.tipwin.hide();
                });
                tipchange.on("click", function(ev) {
                    self.tipwin.flash._showConfig();
                    ev.halt();
                });
                tipremove.on("click", function(ev) {
                    var flash = self.tipwin.flash;
                    flash.selectedFlash._4e_remove();
                    flash.editor.notifySelectionChange();
                    flash.selectedFlash = null;
                    ev.halt();
                });
                self.tip = null;
            };
            var contextMenu = {
                "编辑Flash":function(editor) {
                    var selection = editor.getSelection(),
                        startElement = selection && selection.getStartElement(),
                        flash = startElement && startElement._4e_ascendant('img', true);
                    if (!flash)
                        return;
                    if (!flash.hasClass(CLS_FLASH)) return;
                    var flashUI = editor._toolbars["flash"];
                    flashUI.selectedFlash = flash;
                    flashUI._showConfig();
                }
            };
        })();
    }


    editor.addPlugin(function() {
        new KE.Flash(editor);
        var win = DOM._4e_getWin(editor.document);
        Event.on(win, "scroll", function() {
            KE.Flash.tipwin && KE.Flash.tipwin.hide();
        });
    });

});
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
        FONT_SIZE_SELECTION_HTML = "<select title='大小' style='width:110px;height:21px;'><option value=''>大小 / 清除</option>",
        fontSize_style = {
            element        : 'span',
            styles        : { 'font-size' : '#(size)' },
            overrides    : [
                { element : 'font', attributes : { 'size' : null } }
            ]
        },
        FONT_FAMILIES = editor.cfg.pluginConfig["font-family"]||["宋体","黑体","隶书",
            "楷体_GB2312","微软雅黑","Georgia","Times New Roman",
            "Impact","Courier New","Arial","Verdana","Tahoma"],
        FONT_FAMILY_STYLES = {},
        FONT_FAMILY_SELECTION_HTML = "<select title='字体' >" +
            "<option value=''>字体 / 清除</option>",
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
        FONT_SIZE_SELECTION_HTML += "<option value='" + size + "'>" + size + "</option>"
    }
    FONT_SIZE_SELECTION_HTML += "</select>";

    for (i = 0; i < FONT_FAMILIES.length; i++) {
        var family = FONT_FAMILIES[i];
        FONT_FAMILY_STYLES[family] = new KEStyle(fontFamily_style, {
            family:family
        });
        FONT_FAMILY_SELECTION_HTML += "<option style='font-family:"
            + family + "'  value='" + family + "'>" + family + "</option>"
    }
    FONT_FAMILY_SELECTION_HTML += "</select>";

    if (!KE.Font) {
        (function() {


            function Font(cfg) {
                Font.superclass.constructor.call(this, cfg);
                var self = this;
                self._init();
            }

            Font.ATTRS = {
                v:{
                    value:""
                },
                html:{},
                styles:{},
                editor:{}
            };

            S.extend(Font, S.Base, {

                _init:function() {
                    var editor = this.get("editor"),
                        toolBarDiv = editor.toolBarDiv,
                        html = this.get("html");
                    var self = this;
                    self.el = new Node(html);
                    toolBarDiv[0].appendChild(this.el[0]);
                    self.el.on("change", this._change, this);
                    editor.on("selectionChange", this._selectionChange, this);
                    this.on("afterVChange", this._vChange, this);
                },

                _vChange:function(ev) {
                    var editor = this.get("editor"),
                        v = ev.newVal,
                        pre = ev.preVal,
                        styles = this.get("styles");
                    editor.focus();
                    editor.fire("save");
                    if (!v) {
                        v = pre;
                        styles[v].remove(editor.document);
                    } else {
                        styles[v].apply(editor.document);
                    }
                    editor.fire("save");
                    editor.notifySelectionChange();
                },

                _change:function() {
                    var el = this.el;
                    this.set("v", el.val());
                },

                _selectionChange:function(ev) {
                    var editor = this.get("editor");
                    var currentValue = this.get("v");
                    var elementPath = ev.path,
                        elements = elementPath.elements,
                        styles = this.get("styles");
                    // For each element into the elements path.
                    for (var i = 0, element; i < elements.length; i++) {
                        element = elements[i];
                        // Check if the element is removable by any of
                        // the styles.
                        for (var value in styles) {
                            if (styles[ value ].checkElementRemovable(element, true)) {
                                if (value != currentValue) {
                                    this._set("v", value);
                                    this.el.val(value);
                                }
                                return;
                            }
                        }
                    }

                    // If no styles match, just empty it.
                    if (currentValue != '') {
                        this._set("v", '');
                        this.el.val("");
                    }

                }
            });

            function SingleFont(cfg) {
                SingleFont.superclass.constructor.call(this, cfg);
                var self = this;
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
                        contentCls:this.get("contentCls"),
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
            styles:FONT_SIZE_STYLES,
            html:FONT_SIZE_SELECTION_HTML
        });

        new KE.Font({
            editor:editor,
            styles:FONT_FAMILY_STYLES,
            html:FONT_FAMILY_SELECTION_HTML
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
            title:"下划线 ",
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
            title:"删除线 ",
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

});
/**
 * format formatting,modified from ckeditor
 * @modifier: yiminghe@gmail.com
 */
KISSY.Editor.add("format", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node;

    if (!KE.Format) {
        (function() {
            var
                FORMAT_SELECTION_HTML = "<select style='height:21px' title='格式'>",
                FORMATS = {
                    "标题 / 清除":"p",
                    "标题1":"h1",
                    "标题2":"h2",
                    "标题3":"h3",
                    "标题4":"h4",
                    "标题5":"h5",
                    "标题6":"h6"
                },
                FORMAT_SIZES = {
                    h1:"2em",
                    h2:"1.5em",
                    h3:"1.17em",
                    h4:"1em",
                    h5:"0.83em",
                    h6:"0.67em"
                },
                FORMAT_STYLES = {},
                KEStyle = KE.Style;

            for (var p in FORMATS) {
                if (FORMATS[p]) {
                    FORMAT_STYLES[FORMATS[p]] = new KEStyle({
                        element:FORMATS[p]
                    });
                    FORMAT_SELECTION_HTML += "<option " +
                        "style='font-size:" + FORMAT_SIZES[FORMATS[p]] + "'" +
                        "value='" + FORMATS[p] + "'>" + p + "</option>"
                }
            }
            FORMAT_SELECTION_HTML += "</select>";
            function Format(cfg) {
                Format.superclass.constructor.call(this, cfg);
                var self = this;
                self.el = new Node(FORMAT_SELECTION_HTML);
                this._init();
            }

            Format.ATTRS = {
                v:{
                    value:"p"
                },
                editor:{}
            };

            S.extend(Format, S.Base, {

                _init:function() {
                    var editor = this.get("editor"),toolBarDiv = editor.toolBarDiv,
                        el = this.el;
                    var self = this;
                    toolBarDiv[0].appendChild(this.el[0]);
                    el.on("change", this._change, this);
                    editor.on("selectionChange", this._selectionChange, this);
                    this.on("afterVChange", this._vChange, this);
                },

                _vChange:function(ev) {
                    var editor = this.get("editor"),v = ev.newVal;//,pre = ev.preVal;
                    editor.focus();
                    editor.fire("save");
                    FORMAT_STYLES[v].apply(editor.document);
                    editor.fire("save");
                    editor.fire("formatChange", this.get("v"));
                },
                _change:function() {
                    var el = this.el;
                    this.set("v", el.val());
                },

                _selectionChange:function(ev) {
                    var editor = this.get("editor");
                    var currentValue = this.get("v");
                    var elementPath = ev.path;
                    // For each element into the elements path.

                    // Check if the element is removable by any of
                    // the styles.
                    for (var value in FORMAT_STYLES) {
                        if (FORMAT_STYLES[ value ].checkActive(elementPath)) {
                            if (value != currentValue) {
                                this._set("v", value);
                                this.el.val(value);
                            }
                            return;
                        }
                    }

                    //默认为普通！
                    this._set("v", "p");
                    this.el.val("p");

                }
            });
            KE.Format = Format;
        })();
    }

    editor.addPlugin(function() {
        new KE.Format({
            editor:editor
        });
    });

});
/**
 * modified from ckeditor,html generator for kissy editor
 * @modifier: yiminghe@gmail.com
 */
KISSY.Editor.add("htmlparser-basicwriter", function(editor) {
    var KE = KISSY.Editor,S = KISSY,Utils = KE.Utils;
    if (KE.HtmlParser.BasicWriter)return;
    function BasicWriter() {
        this._ = {
            output : []
        };
    }

    S.augment(BasicWriter, {
        /**
         * Writes the tag opening part for a opener tag.
         * @param {String} tagName The element name for this tag.
         * @param {Object} attributes The attributes defined for this tag. The
         *        attributes could be used to inspect the tag.
         * @example
         * // Writes "&lt;p".
         * writer.openTag( 'p', { class : 'MyClass', id : 'MyId' } );
         */
        openTag : function(tagName, attributes) {
            this._.output.push('<', tagName);
        },

        /**
         * Writes the tag closing part for a opener tag.
         * @param {String} tagName The element name for this tag.
         * @param {Boolean} isSelfClose Indicates that this is a self-closing tag,
         *        like "br" or "img".
         * @example
         * // Writes "&gt;".
         * writer.openTagClose( 'p', false );
         * @example
         * // Writes " /&gt;".
         * writer.openTagClose( 'br', true );
         */
        openTagClose : function(tagName, isSelfClose) {
            if (isSelfClose)
                this._.output.push(' />');
            else
                this._.output.push('>');
        },

        /**
         * Writes an attribute. This function should be called after opening the
         * tag with {@link #openTagClose}.
         * @param {String} attName The attribute name.
         * @param {String} attValue The attribute value.
         * @example
         * // Writes ' class="MyClass"'.
         * writer.attribute( 'class', 'MyClass' );
         */
        attribute : function(attName, attValue) {
            // Browsers don't always escape special character in attribute values. (#4683, #4719).
            if (typeof attValue == 'string')
                attValue = Utils.htmlEncodeAttr(attValue);

            this._.output.push(' ', attName, '="', attValue, '"');
        },

        /**
         * Writes a closer tag.
         * @param {String} tagName The element name for this tag.
         * @example
         * // Writes "&lt;/p&gt;".
         * writer.closeTag( 'p' );
         */
        closeTag : function(tagName) {
            this._.output.push('</', tagName, '>');
        },

        /**
         * Writes text.
         * @param {String} text The text value
         * @example
         * // Writes "Hello Word".
         * writer.text( 'Hello Word' );
         */
        text : function(text) {
            this._.output.push(text);
        },

        /**
         * Writes a comment.
         * @param {String} comment The comment text.
         * @example
         * // Writes "&lt;!-- My comment --&gt;".
         * writer.comment( ' My comment ' );
         */
        comment : function(comment) {
            this._.output.push('<!--', comment, '-->');
        },

        /**
         * Writes any kind of data to the ouput.
         * @example
         * writer.write( 'This is an &lt;b&gt;example&lt;/b&gt;.' );
         */
        write : function(data) {
            this._.output.push(data);
        },

        /**
         * Empties the current output buffer.
         * @example
         * writer.reset();
         */
        reset : function() {
            this._.output = [];
            this._.indent = false;
        },

        /**
         * Empties the current output buffer.
         * @param {Boolean} reset Indicates that the {@link reset} function is to
         *        be automatically called after retrieving the HTML.
         * @returns {String} The HTML written to the writer so far.
         * @example
         * var html = writer.getHtml();
         */
        getHtml : function(reset) {
            var html = this._.output.join('');

            if (reset)
                this.reset();

            return html;
        }
    });

    KE.HtmlParser.BasicWriter = BasicWriter;
});
KISSY.Editor.add("htmlparser-comment", function(editor) {
    var KE = KISSY.Editor,KEN = KE.NODE;
    if (KE.HtmlParser.Comment) return;

    function Comment(value) {
        /**
         * The comment text.
         * @type String
         * @example
         */
        this.value = value;

        /** @private */
        this._ =
        {
            isBlockLike : false
        };
    }

    KE.HtmlParser.Comment = Comment;

    Comment.prototype = {
        constructor:Comment,
        /**
         * The node type. This is a constant value set to  NODE_COMMENT.
         * @type Number
         * @example
         */
        type : KEN.NODE_COMMENT,

        /**
         * Writes the HTML representation of this comment to a CKEDITOR.htmlWriter.
         * @param  writer The writer to which write the HTML.
         * @example
         */
        writeHtml : function(writer, filter) {
            var comment = this.value;

            if (filter) {
                if (!( comment = filter.onComment(comment, this) ))
                    return;

                if (typeof comment != 'string') {
                    comment.parent = this.parent;
                    comment.writeHtml(writer, filter);
                    return;
                }
            }

            writer.comment(comment);
        }
    };
});
KISSY.Editor.add("htmlparser-element", function(editor) {
    var KE = KISSY.Editor;
    if (KE.HtmlParser.Element)return;
    /**
     * A lightweight representation of an HTML element.
     * @param {String} name The element name.
     * @param {Object} attributes And object holding all attributes defined for
     *        this element.
     * @constructor
     * @example
     */
    function Element(name, attributes) {
        /**
         * The element name.
         * @type String
         * @example
         */
        this.name = name;

        /**
         * Holds the attributes defined for this element.
         * @type Object
         * @example
         */
        this.attributes = attributes || ( attributes = {} );

        /**
         * The nodes that are direct children of this element.
         * @type Array
         * @example
         */
        this.children = [];

        var tagName = attributes._ke_real_element_type || name;

        var dtd = KE.XHTML_DTD,
            isBlockLike = !!( dtd.$nonBodyContent[ tagName ] || dtd.$block[ tagName ] || dtd.$listItem[ tagName ] || dtd.$tableContent[ tagName ] || dtd.$nonEditable[ tagName ] || tagName == 'br' ),
            isEmpty = !!dtd.$empty[ name ];

        this.isEmpty = isEmpty;
        this.isUnknown = !dtd[ name ];

        /** @private */
        this._ =
        {
            isBlockLike : isBlockLike,
            hasInlineStarted : isEmpty || !isBlockLike
        };
    }

    // Used to sort attribute entries in an array, where the first element of
    // each object is the attribute name.
    var S = KISSY,
        KEN = KE.NODE,
        sortAttribs = function(a, b) {
            a = a[0];
            b = b[0];
            return a < b ? -1 : a > b ? 1 : 0;
        };
    S.augment(Element, {
        /**
         * The node type. This is a constant value set to {@link KEN.NODE_ELEMENT}.
         * @type Number
         * @example
         */
        type : KEN.NODE_ELEMENT,

        /**
         * Adds a node to the element children list.
         * @param {Object} node The node to be added.
         * @function
         * @example
         */
        add : KE.HtmlParser.Fragment.prototype.add,

        /**
         * Clone this element.
         * @returns {Element} The element clone.
         * @example
         */
        clone : function() {
            return new Element(this.name, this.attributes);
        },

        /**
         * Writes the element HTML to a CKEDITOR.htmlWriter.
         * @param  writer The writer to which write the HTML.
         * @example
         */
        writeHtml : function(writer, filter) {
            var attributes = this.attributes;

            // Ignore cke: prefixes when writing HTML.
            var element = this,
                writeName = element.name,
                a, newAttrName, value;

            var isChildrenFiltered;

            /**
             * Providing an option for bottom-up filtering order ( element
             * children to be pre-filtered before the element itself ).
             */
            element.filterChildren = function() {
                if (!isChildrenFiltered) {
                    var writer = new KE.HtmlParser.BasicWriter();
                    KE.HtmlParser.Fragment.prototype.writeChildrenHtml.call(element, writer, filter);
                    element.children = new KE.HtmlParser.Fragment.FromHtml(writer.getHtml()).children;
                    isChildrenFiltered = 1;
                }
            };

            if (filter) {
                while (true) {
                    if (!( writeName = filter.onElementName(writeName) ))
                        return;

                    element.name = writeName;

                    if (!( element = filter.onElement(element) ))
                        return;

                    element.parent = this.parent;

                    if (element.name == writeName)
                        break;

                    // If the element has been replaced with something of a
                    // different type, then make the replacement write itself.
                    if (element.type != KEN.NODE_ELEMENT) {
                        element.writeHtml(writer, filter);
                        return;
                    }

                    writeName = element.name;

                    // This indicate that the element has been dropped by
                    // filter but not the children.
                    if (!writeName) {
                        this.writeChildrenHtml.call(element, writer, isChildrenFiltered ? null : filter);
                        return;
                    }
                }

                // The element may have been changed, so update the local
                // references.
                attributes = element.attributes;
            }

            // Open element tag.
            writer.openTag(writeName, attributes);

            // Copy all attributes to an array.
            var attribsArray = [];
            // Iterate over the attributes twice since filters may alter
            // other attributes.
            for (var i = 0; i < 2; i++) {
                for (a in attributes) {
                    newAttrName = a;
                    value = attributes[ a ];
                    if (i == 1)
                        attribsArray.push([ a, value ]);
                    else if (filter) {
                        while (true) {
                            if (!( newAttrName = filter.onAttributeName(a) )) {
                                delete attributes[ a ];
                                break;
                            }
                            else if (newAttrName != a) {
                                delete attributes[ a ];
                                a = newAttrName;
                                continue;
                            }
                            else
                                break;
                        }
                        if (newAttrName) {
                            if (( value = filter.onAttribute(element, newAttrName, value) ) === false)
                                delete attributes[ newAttrName ];
                            else
                                attributes [ newAttrName ] = value;
                        }
                    }
                }
            }
            // Sort the attributes by name.
            if (writer.sortAttributes)
                attribsArray.sort(sortAttribs);

            // Send the attributes.
            var len = attribsArray.length;
            for (i = 0; i < len; i++) {
                var attrib = attribsArray[ i ];
                writer.attribute(attrib[0], attrib[1]);
            }

            // Close the tag.
            writer.openTagClose(writeName, element.isEmpty);

            if (!element.isEmpty) {
                this.writeChildrenHtml.call(element, writer, isChildrenFiltered ? null : filter);
                // Close the element.
                writer.closeTag(writeName);
            }
        },

        writeChildrenHtml : function(writer, filter) {
            // Send children.
            KE.HtmlParser.Fragment.prototype.writeChildrenHtml.apply(this, arguments);
        }
    });

    KE.HtmlParser.Element = Element;
});
KISSY.Editor.add("htmlparser-filter", function(
    //editor
    ) {
    var KE = KISSY.Editor,S = KISSY,KEN = KE.NODE;
    if (KE.HtmlParser.Filter)return;
    function Filter(rules) {
        this._ = {
            elementNames : [],
            attributeNames : [],
            elements : { $length : 0 },
            attributes : { $length : 0 }
        };

        if (rules)
            this.addRules(rules, 10);
    }

    S.augment(Filter, {
        addRules : function(rules, priority) {
            if (typeof priority != 'number')
                priority = 10;

            // Add the elementNames.
            addItemsToList(this._.elementNames, rules.elementNames, priority);

            // Add the attributeNames.
            addItemsToList(this._.attributeNames, rules.attributeNames, priority);

            // Add the elements.
            addNamedItems(this._.elements, rules.elements, priority);

            // Add the attributes.
            addNamedItems(this._.attributes, rules.attributes, priority);

            // Add the text.
            this._.text = transformNamedItem(this._.text, rules.text, priority) || this._.text;

            // Add the comment.
            this._.comment = transformNamedItem(this._.comment, rules.comment, priority) || this._.comment;

            // Add root fragment.
            this._.root = transformNamedItem(this._.root, rules.root, priority) || this._.root;
        },

        onElementName : function(name) {
            return filterName(name, this._.elementNames);
        },

        onAttributeName : function(name) {
            return filterName(name, this._.attributeNames);
        },

        onText : function(text) {
            var textFilter = this._.text;
            return textFilter ? textFilter.filter(text) : text;
        },

        onComment : function(commentText, comment) {
            var textFilter = this._.comment;
            return textFilter ? textFilter.filter(commentText, comment) : commentText;
        },

        onFragment : function(element) {
            var rootFilter = this._.root;
            return rootFilter ? rootFilter.filter(element) : element;
        },

        onElement : function(element) {
            // We must apply filters set to the specific element name as
            // well as those set to the generic $ name. So, add both to an
            // array and process them in a small loop.
            var filters = [ this._.elements[ '^' ], this._.elements[ element.name ], this._.elements.$ ],
                filter, ret;

            for (var i = 0; i < 3; i++) {
                filter = filters[ i ];
                if (filter) {
                    ret = filter.filter(element, this);

                    if (ret === false)
                        return null;

                    if (ret && ret != element)
                        return this.onNode(ret);

                    // The non-root element has been dismissed by one of the filters.
                    if (element.parent && !element.name)
                        break;
                }
            }

            return element;
        },

        onNode : function(node) {
            var type = node.type;

            return type == KEN.NODE_ELEMENT ? this.onElement(node) :
                type == KEN.NODE_TEXT ? new KE.HtmlParser.Text(this.onText(node.value)) :
                    null;
        },

        onAttribute : function(element, name, value) {
            var filter = this._.attributes[ name ];

            if (filter) {
                var ret = filter.filter(value, element, this);

                if (ret === false)
                    return false;

                if (typeof ret != 'undefined')
                    return ret;
            }

            return value;
        }
    });
    function filterName(name, filters) {
        for (var i = 0; name && i < filters.length; i++) {
            var filter = filters[ i ];
            name = name.replace(filter[ 0 ], filter[ 1 ]);
        }
        return name;
    }

    function addItemsToList(list, items, priority) {
        if (typeof items == 'function')
            items = [ items ];

        var i, j,
            listLength = list.length,
            itemsLength = items && items.length;

        if (itemsLength) {
            // Find the index to insert the items at.
            for (i = 0; i < listLength && list[ i ].pri < priority; i++) { /*jsl:pass*/
            }

            // Add all new items to the list at the specific index.
            for (j = itemsLength - 1; j >= 0; j--) {
                var item = items[ j ];
                if (item) {
                    item.pri = priority;
                    list.splice(i, 0, item);
                }
            }
        }
    }

    function addNamedItems(hashTable, items, priority) {
        if (items) {
            for (var name in items) {
                var current = hashTable[ name ];

                hashTable[ name ] =
                    transformNamedItem(
                        current,
                        items[ name ],
                        priority);

                if (!current)
                    hashTable.$length++;
            }
        }
    }

    function transformNamedItem(current, item, priority) {
        if (item) {
            item.pri = priority;

            if (current) {
                // If the current item is not an Array, transform it.
                if (!current.splice) {
                    if (current.pri > priority)
                        current = [ item, current ];
                    else
                        current = [ current, item ];

                    current.filter = callItems;
                }
                else
                    addItemsToList(current, item, priority);

                return current;
            }
            else {
                item.filter = item;
                return item;
            }
        }
        return undefined;
    }

    // Invoke filters sequentially on the array, break the iteration
    // when it doesn't make sense to continue anymore.
    function callItems(currentEntry) {
        var isNode = currentEntry.type
            || currentEntry instanceof KE.HtmlParser.Fragment;

        for (var i = 0; i < this.length; i++) {
            // Backup the node info before filtering.
            if (isNode) {
                var orgType = currentEntry.type,
                    orgName = currentEntry.name;
            }

            var item = this[ i ],
                ret = item.apply(window, arguments);

            if (ret === false)
                return ret;

            // We're filtering node (element/fragment).
            if (isNode) {
                // No further filtering if it's not anymore
                // fitable for the subsequent filters.
                if (ret && ( ret.name != orgName
                    || ret.type != orgType )) {
                    return ret;
                }
            }
            // Filtering value (nodeName/textValue/attrValue).
            else {
                // No further filtering if it's not
                // any more values.
                if (typeof ret != 'string')
                    return ret;
            }

            ret != undefined && ( currentEntry = ret );
        }
        return currentEntry;
    }

    KE.HtmlParser.Filter = Filter;
});
KISSY.Editor.add("htmlparser-fragment", function(
    //editor
    ) {
    var KE = KISSY.Editor;
    if (KE.HtmlParser.Fragment) return;
    /**
     * A lightweight representation of an HTML DOM structure.
     * @constructor
     * @example
     */
    function Fragment() {
        /**
         * The nodes contained in the root of this fragment.
         * @type Array
         * @example
         * var fragment = Fragment.fromHtml( '<b>Sample</b> Text' );
         * alert( fragment.children.length );  "2"
         */
        this.children = [];

        /**
         * Get the fragment parent. Should always be null.
         * @type Object
         * @default null
         * @example
         */
        this.parent = null;

        /** @private */
        this._ = {
            isBlockLike : true,
            hasInlineStarted : false
        };
    }

    // Elements which the end tag is marked as optional in the HTML 4.01 DTD
    // (expect empty elements).
    var optionalClose = {colgroup:1,dd:1,dt:1,li:1,option:1,p:1,td:1,tfoot:1,th:1,thead:1,tr:1};

    // Block-level elements whose internal structure should be respected during
    // parser fixing.
    var S = KISSY,
        Utils = KE.Utils,
        KEN = KE.NODE,
        XHTML_DTD = KE.XHTML_DTD,
        nonBreakingBlocks = Utils.mix({table:1,ul:1,ol:1,dl:1},
            XHTML_DTD.table, XHTML_DTD.ul, XHTML_DTD.ol, XHTML_DTD.dl),
        listBlocks = XHTML_DTD.$list,
        listItems = XHTML_DTD.$listItem;

    /**
     * Creates a  Fragment from an HTML string.
     * @param {String} fragmentHtml The HTML to be parsed, filling the fragment.
     * @param {Number} [fixForBody=false] Wrap body with specified element if needed.
     * @returns Fragment The fragment created.
     * @example
     * var fragment = Fragment.fromHtml( '<b>Sample</b> Text' );
     * alert( fragment.children[0].name );  "b"
     * alert( fragment.children[1].value );  " Text"
     * 特例：
     * 自动加p，自动处理标签嵌套规则
     * "<img src='xx'><span>5<div>6</div>7</span>"
     * ="<p><img><span>5</span></p><div><span>6</span></div><p><span>7</span></p>"
     * 自动处理ul嵌套，以及li ie不闭合
     * "<ul><ul><li>xxx</ul><li>1<li>2<ul>");
     */
    Fragment.FromHtml = function(fragmentHtml, fixForBody) {
        var parser = new KE.HtmlParser(),
            //html = [],
            fragment = new Fragment(),
            pendingInline = [],
            pendingBRs = [],
            currentNode = fragment,
            // Indicate we're inside a <pre> element, spaces should be touched differently.
            inPre = false,
            returnPoint;

        function checkPending(newTagName) {
            var pendingBRsSent;

            if (pendingInline.length > 0) {
                for (var i = 0; i < pendingInline.length; i++) {
                    var pendingElement = pendingInline[ i ],
                        pendingName = pendingElement.name,
                        pendingDtd = XHTML_DTD[ pendingName ],
                        currentDtd = currentNode.name && XHTML_DTD[ currentNode.name ];

                    if (( !currentDtd || currentDtd[ pendingName ] ) && ( !newTagName || !pendingDtd || pendingDtd[ newTagName ] || !XHTML_DTD[ newTagName ] )) {
                        if (!pendingBRsSent) {
                            sendPendingBRs();
                            pendingBRsSent = 1;
                        }

                        // Get a clone for the pending element.
                        pendingElement = pendingElement.clone();

                        // Add it to the current node and make it the current,
                        // so the new element will be added inside of it.
                        pendingElement.parent = currentNode;
                        currentNode = pendingElement;

                        // Remove the pending element (back the index by one
                        // to properly process the next entry).
                        pendingInline.splice(i, 1);
                        i--;
                    }
                }
            }
        }

        function sendPendingBRs() {
            while (pendingBRs.length)
                currentNode.add(pendingBRs.shift());
        }

        function addElement(element, target, enforceCurrent) {
            target = target || currentNode || fragment;

            // If the target is the fragment and this element can't go inside
            // body (if fixForBody).
            if (fixForBody && !target.type) {
                var elementName, realElementName;
                if (element.attributes
                    && ( realElementName =
                    element.attributes[ '_ke_real_element_type' ] ))
                    elementName = realElementName;
                else
                    elementName = element.name;
                if (elementName
                    && !( elementName in XHTML_DTD.$body )
                    && !( elementName in XHTML_DTD.$nonBodyContent )) {
                    var savedCurrent = currentNode;

                    // Create a <p> in the fragment.
                    currentNode = target;
                    parser.onTagOpen(fixForBody, {});

                    // The new target now is the <p>.
                    target = currentNode;

                    if (enforceCurrent)
                        currentNode = savedCurrent;
                }
            }

            // Rtrim empty spaces on block end boundary. (#3585)
            if (element._.isBlockLike
                && element.name != 'pre') {

                var length = element.children.length,
                    lastChild = element.children[ length - 1 ],
                    text;
                if (lastChild && lastChild.type == KEN.NODE_TEXT) {
                    if (!( text = Utils.rtrim(lastChild.value) ))
                        element.children.length = length - 1;
                    else
                        lastChild.value = text;
                }
            }

            target.add(element);

            //<ul><ul></ul></ul> -> <ul><li><ul></ul></li></ul>
            //跳过隐形添加的li直接到ul
            if (element.returnPoint) {
                currentNode = element.returnPoint;
                delete element.returnPoint;
            }
        }

        /**
         * 遇到标签开始建立节点和父亲关联 ==  node.parent=parent
         * @param tagName
         * @param attributes
         * @param selfClosing
         */
        parser.onTagOpen = function(tagName, attributes, selfClosing) {
            var element = new KE.HtmlParser.Element(tagName, attributes);

            // "isEmpty" will be always "false" for unknown elements, so we
            // must force it if the parser has identified it as a selfClosing tag.
            if (element.isUnknown && selfClosing)
                element.isEmpty = true;

            // This is a tag to be removed if empty, so do not add it immediately.
            if (XHTML_DTD.$removeEmpty[ tagName ]) {
                pendingInline.push(element);
                return;
            }
            else if (tagName == 'pre')
                inPre = true;
            else if (tagName == 'br' && inPre) {
                currentNode.add(new KE.HtmlParser.Text('\n'));
                return;
            }

            if (tagName == 'br') {
                pendingBRs.push(element);
                return;
            }

            var currentName = currentNode.name;

            var currentDtd = currentName
                && ( XHTML_DTD[ currentName ]
                || ( currentNode._.isBlockLike ? XHTML_DTD.div : XHTML_DTD.span ) );

            // If the element cannot be child of the current element.
            if (currentDtd   // Fragment could receive any elements.
                && !element.isUnknown && !currentNode.isUnknown && !currentDtd[ tagName ]) {

                var reApply = false,
                    addPoint;   // New position to start adding nodes.

                // Fixing malformed nested lists by moving it into a previous list item. (#3828)
                if (tagName in listBlocks
                    && currentName in listBlocks) {
                    var children = currentNode.children,
                        lastChild = children[ children.length - 1 ];

                    // Establish the list item if it's not existed.
                    if (!( lastChild && lastChild.name in listItems ))
                    //直接添加到父亲
                        addElement(( lastChild = new KE.HtmlParser.Element('li') ), currentNode);
                    //以后直接跳到父亲不用再向父亲添加
                    returnPoint = currentNode,addPoint = lastChild;
                }
                // If the element name is the same as the current element name,
                // then just close the current one and append the new one to the
                // parent. This situation usually happens with <p>, <li>, <dt> and
                // <dd>, specially in IE. Do not enter in this if block in this case.
                else if (tagName == currentName) {
                    //直接把上一个<p>,<li>结束掉，不要再等待</p>,</li>执行此项操作了
                    addElement(currentNode, currentNode.parent);
                }
                else {
                    if (nonBreakingBlocks[ currentName ]) {
                        if (!returnPoint)
                            returnPoint = currentNode;
                    }
                    else {
                        //拆分，闭合掉
                        addElement(currentNode, currentNode.parent, true);
                        //li,p等现在就闭合，以后都不用再管了
                        if (!optionalClose[ currentName ]) {
                            // The current element is an inline element, which
                            // cannot hold the new one. Put it in the pending list,
                            // and try adding the new one after it.
                            pendingInline.unshift(currentNode);
                        }
                    }

                    reApply = true;
                }

                if (addPoint)
                    currentNode = addPoint;
                // Try adding it to the return point, or the parent element.
                else
                //前面都调用 addElement 将当前节点闭合了，只能往 parent 添加了
                    currentNode = currentNode.returnPoint || currentNode.parent;

                if (reApply) {
                    parser.onTagOpen.apply(this, arguments);
                    return;
                }
            }

            checkPending(tagName);
            sendPendingBRs();

            element.parent = currentNode;
            element.returnPoint = returnPoint;
            returnPoint = 0;

            //自闭合的，不等结束标签，立即加到父亲
            if (element.isEmpty)
                addElement(element);
            else
                currentNode = element;
        };

        /**
         * 遇到标签结束，将open生成的节点添加到dom树中 == 父亲接纳自己 node.parent.add(node)
         * @param tagName
         */
        parser.onTagClose = function(tagName) {
            // Check if there is any pending tag to be closed.
            for (var i = pendingInline.length - 1; i >= 0; i--) {
                // If found, just remove it from the list.
                if (tagName == pendingInline[ i ].name) {
                    pendingInline.splice(i, 1);
                    return;
                }
            }

            var pendingAdd = [],
                newPendingInline = [],
                candidate = currentNode;

            while (candidate.type && candidate.name != tagName) {
                // If this is an inline element, add it to the pending list, if we're
                // really closing one of the parents element later, they will continue
                // after it.
                if (!candidate._.isBlockLike)
                    newPendingInline.unshift(candidate);

                // This node should be added to it's parent at this point. But,
                // it should happen only if the closing tag is really closing
                // one of the nodes. So, for now, we just cache it.
                pendingAdd.push(candidate);

                candidate = candidate.parent;
            }

            if (candidate.type) {
                // Add all elements that have been found in the above loop.
                for (i = 0; i < pendingAdd.length; i++) {
                    var node = pendingAdd[ i ];
                    addElement(node, node.parent);
                }

                currentNode = candidate;

                if (currentNode.name == 'pre')
                    inPre = false;

                if (candidate._.isBlockLike)
                    sendPendingBRs();

                addElement(candidate, candidate.parent);

                // The parent should start receiving new nodes now, except if
                // addElement changed the currentNode.
                if (candidate == currentNode)
                    currentNode = currentNode.parent;

                pendingInline = pendingInline.concat(newPendingInline);
            }

            if (tagName == 'body')
                fixForBody = false;
        };

        parser.onText = function(text) {
            // Trim empty spaces at beginning of element contents except <pre>.
            if (!currentNode._.hasInlineStarted && !inPre) {
                text = Utils.ltrim(text);

                if (text.length === 0)
                    return;
            }

            sendPendingBRs();
            checkPending();

            if (fixForBody
                && ( !currentNode.type || currentNode.name == 'body' )
                && Utils.trim(text)) {
                this.onTagOpen(fixForBody, {});
            }

            // Shrinking consequential spaces into one single for all elements
            // text contents.
            if (!inPre)
                text = text.replace(/[\t\r\n ]{2,}|[\t\r\n]/g, ' ');

            currentNode.add(new KE.HtmlParser.Text(text));
        };

        parser.onCDATA = function(
            //cdata
            ) {
            //不做
            //currentNode.add(new KE.HtmlParser.cdata(cdata));
        };

        parser.onComment = function(comment) {
            currentNode.add(new KE.HtmlParser.Comment(comment));
        };

        // Parse it.
        parser.parse(fragmentHtml);

        sendPendingBRs();

        // Close all pending nodes.
        //<p>xxxxxxxxxxxxx
        //到最后也灭有结束标签
        while (currentNode.type) {
            var parent = currentNode.parent,
                node = currentNode;

            if (fixForBody
                && ( !parent.type || parent.name == 'body' )
                && !XHTML_DTD.$body[ node.name ]) {
                currentNode = parent;
                parser.onTagOpen(fixForBody, {});
                parent = currentNode;
            }

            parent.add(node);
            currentNode = parent;
        }

        return fragment;
    };

    S.augment(Fragment, {
        /**
         * Adds a node to this fragment.
         * @param {Object} node The node to be added. It can be any of of the
         *        following types: {@link Element},
         *        {@link Text}
         * @example
         */
        add : function(node) {
            var len = this.children.length,
                previous = len > 0 && this.children[ len - 1 ] || null;

            if (previous) {
                // If the block to be appended is following text, trim spaces at
                // the right of it.
                if (node._.isBlockLike && previous.type == KEN.NODE_TEXT) {
                    previous.value = Utils.rtrim(previous.value);
                    // If we have completely cleared the previous node.
                    if (previous.value.length === 0) {
                        // Remove it from the list and add the node again.
                        this.children.pop();
                        this.add(node);
                        return;
                    }
                }

                previous.next = node;
            }

            node.previous = previous;
            node.parent = this;

            this.children.push(node);
            this._.hasInlineStarted = node.type == KEN.NODE_TEXT || ( node.type == KEN.NODE_ELEMENT && !node._.isBlockLike );
        },

        /**
         * Writes the fragment HTML to a CKEDITOR.htmlWriter.
         * @param writer The writer to which write the HTML.
         * @example
         * var writer = new HtmlWriter();
         * var fragment = Fragment.fromHtml( '&lt;P&gt;&lt;B&gt;Example' );
         * fragment.writeHtml( writer )
         * alert( writer.getHtml() );  "&lt;p&gt;&lt;b&gt;Example&lt;/b&gt;&lt;/p&gt;"
         */
        writeHtml : function(writer, filter) {
            var isChildrenFiltered;
            this.filterChildren = function() {
                var writer = new KE.HtmlParser.BasicWriter();
                this.writeChildrenHtml.call(this, writer, filter, true);
                var html = writer.getHtml();
                this.children = new Fragment.FromHtml(html).children;
                isChildrenFiltered = 1;
            };

            // Filtering the root fragment before anything else.
            !this.name && filter && filter.onFragment(this);

            this.writeChildrenHtml(writer, isChildrenFiltered ? null : filter);
        },

        writeChildrenHtml : function(writer, filter) {
            for (var i = 0; i < this.children.length; i++)
                this.children[i].writeHtml(writer, filter);
        }
    });

    KE.HtmlParser.Fragment = Fragment;

});
/**
 * modified from ckeditor,htmlparser for malform html string
 * @modifier: yiminghe@gmail.com
 */
KISSY.Editor.add("htmlparser", function(
    // editor
    ) {

    var KE = KISSY.Editor;
    if (KE.HtmlParser) return;
    var
        S = KISSY,attribsRegex = /([\w\-:.]+)(?:(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^\s>]+)))|(?=\s|$))/g,
        emptyAttribs = {
            checked:1,compact:1,declare:1,defer:1,disabled:1,
            ismap:1,multiple:1,nohref:1,noresize:1,noshade:1,nowrap:1,readonly:1,selected:1},
        XHTML_DTD = KE.XHTML_DTD;


    function HtmlParser() {
        this._ = {
            htmlPartsRegex : new RegExp('<(?:(?:\\/([^>]+)>)|(?:!--([\\S|\\s]*?)-->)|(?:([^\\s>]+)\\s*((?:(?:[^"\'>]+)|(?:"[^"]*")|(?:\'[^\']*\'))*)\\/?>))', 'g')
        };
    }


    S.augment(HtmlParser, {
        /**
         * Function to be fired when a tag opener is found. This function
         * should be overriden when using this class.
         *  {String} tagName The tag name. The name is guarantted to be
         *        lowercased.
         *  {Object} attributes An object containing all tag attributes. Each
         *        property in this object represent and attribute name and its
         *        value is the attribute value.
         * {Boolean} selfClosing true if the tag closes itself, false if the
         *         tag doesn't.
         * @example
         * var parser = new CKEDITOR.htmlParser();
         * parser.onTagOpen = function( tagName, attributes, selfClosing )
         *     {
         *         alert( tagName );  // e.g. "b"
         *     });
         * parser.parse( "&lt;!-- Example --&gt;&lt;b&gt;Hello&lt;/b&gt;" );
         */
        onTagOpen    : function() {
        },

        /**
         * Function to be fired when a tag closer is found. This function
         * should be overriden when using this class.

         * @example
         * var parser = new CKEDITOR.htmlParser();
         * parser.onTagClose = function( tagName )
         *     {
         *         alert( tagName );  // e.g. "b"
         *     });
         * parser.parse( "&lt;!-- Example --&gt;&lt;b&gt;Hello&lt;/b&gt;" );
         */
        onTagClose    : function(
            //tagName
            ) {
        },

        /**
         * Function to be fired when text is found. This function
         * should be overriden when using this class.

         * @example
         * var parser = new CKEDITOR.htmlParser();
         * parser.onText = function( text )
         *     {
         *         alert( text );  // e.g. "Hello"
         *     });
         * parser.parse( "&lt;!-- Example --&gt;&lt;b&gt;Hello&lt;/b&gt;" );
         */
        onText        : function(
            //text
            ) {
        },

        /**
         * Function to be fired when CDATA section is found. This function
         * should be overriden when using this class.

         */
        onCDATA        : function(
            //cdata
            ) {
        },

        /**
         * Function to be fired when a commend is found. This function
         * should be overriden when using this class.


         */
        onComment : function(
            //comment
            ) {
        },

        /**
         * Parses text, looking for HTML tokens, like tag openers or closers,
         * or comments. This function fires the onTagOpen, onTagClose, onText
         * and onComment function during its execution.
         * @param {String} html The HTML to be parsed.

         */
        parse : function(html) {
            var parts,
                tagName,

                nextIndex = 0,
                cdata;	// The collected data inside a CDATA section.

            while (( parts = this._.htmlPartsRegex.exec(html) )) {
                var tagIndex = parts.index;
                if (tagIndex > nextIndex) {
                    var text = html.substring(nextIndex, tagIndex);

                    if (cdata)
                        cdata.push(text);
                    else
                        this.onText(text);
                }

                nextIndex = this._.htmlPartsRegex.lastIndex;

                /*
                 "parts" is an array with the following items:
                 0 : The entire match for opening/closing tags and comments.
                 1 : Group filled with the tag name for closing tags.
                 2 : Group filled with the comment text.
                 3 : Group filled with the tag name for opening tags.
                 4 : Group filled with the attributes part of opening tags.
                 */

                // Closing tag
                if (( tagName = parts[ 1 ] )) {
                    tagName = tagName.toLowerCase();

                    if (cdata && XHTML_DTD.$cdata[ tagName ]) {
                        // Send the CDATA data.
                        this.onCDATA(cdata.join(''));
                        cdata = null;
                    }

                    if (!cdata) {
                        this.onTagClose(tagName);
                        continue;
                    }
                }

                // If CDATA is enabled, just save the raw match.
                if (cdata) {
                    cdata.push(parts[ 0 ]);
                    continue;
                }

                // Opening tag
                if (( tagName = parts[ 3 ] )) {
                    tagName = tagName.toLowerCase();
                    var attribs = {},
                        attribMatch,
                        attribsPart = parts[ 4 ],
                        selfClosing = !!( attribsPart && attribsPart.charAt(attribsPart.length - 1) == '/' );

                    if (attribsPart) {
                        while (( attribMatch = attribsRegex.exec(attribsPart) )) {
                            var attName = attribMatch[1].toLowerCase(),
                                attValue = attribMatch[2] || attribMatch[3] || attribMatch[4] || '';

                            if (!attValue && emptyAttribs[ attName ])
                                attribs[ attName ] = attName;
                            else
                                attribs[ attName ] = attValue;
                        }
                    }

                    this.onTagOpen(tagName, attribs, selfClosing);

                    // Open CDATA mode when finding the appropriate tags.
                    if (!cdata && XHTML_DTD.$cdata[ tagName ])
                        cdata = [];

                    continue;
                }

                // Comment
                if (( tagName = parts[ 2 ] ))
                    this.onComment(tagName);
            }

            if (html.length > nextIndex)
                this.onText(html.substring(nextIndex, html.length));
        }
    });

    KE.HtmlParser = HtmlParser;
});
KISSY.Editor.add("htmlparser-htmlwriter", function(
    //editor
    ) {
    var KE = KISSY.Editor,
        S = KISSY,Utils = KE.Utils;
    if (KE.HtmlParser.HtmlWriter) return;
    function HtmlWriter() {
        // Call the base contructor.

        HtmlWriter.superclass.constructor.call(this);

        /**
         * The characters to be used for each identation step.
         * @type String
         * @default "\t" (tab)
         * @example
         * // Use two spaces for indentation.
         * editorInstance.dataProcessor.writer.indentationChars = '  ';
         */
        this.indentationChars = '\t';

        /**
         * The characters to be used to close "self-closing" elements, like "br" or
         * "img".
         * @type String
         * @default " /&gt;"
         * @example
         * // Use HTML4 notation for self-closing elements.
         * editorInstance.dataProcessor.writer.selfClosingEnd = '>';
         */
        this.selfClosingEnd = ' />';

        /**
         * The characters to be used for line breaks.
         * @type String
         * @default "\n" (LF)
         * @example
         * // Use CRLF for line breaks.
         * editorInstance.dataProcessor.writer.lineBreakChars = '\r\n';
         */
        this.lineBreakChars = '\n';

        this.forceSimpleAmpersand = false;

        this.sortAttributes = true;

        this._.indent = false;
        this._.indentation = '';
        this._.rules = {};

        var dtd = KE.XHTML_DTD;

        for (var e in Utils.mix({}, dtd.$nonBodyContent, dtd.$block, dtd.$listItem, dtd.$tableContent)) {
            this.setRules(e,
            {
                indent : true,
                breakBeforeOpen : true,
                breakAfterOpen : true,
                breakBeforeClose : !dtd[ e ][ '#' ],
                breakAfterClose : true
            });
        }

        this.setRules('br',
        {
            breakAfterOpen : true
        });

        this.setRules('title',
        {
            indent : false,
            breakAfterOpen : false
        });

        this.setRules('style',
        {
            indent : false,
            breakBeforeClose : true
        });

        // Disable indentation on <pre>.
        this.setRules('pre',
        {
            indent: false
        });
    }

    S.extend(HtmlWriter, KE.HtmlParser.BasicWriter, {
        /**
         * Writes the tag opening part for a opener tag.
         * @param {String} tagName The element name for this tag.
         *  {Object} attributes The attributes defined for this tag. The
         *        attributes could be used to inspect the tag.
         * @example
         * // Writes "&lt;p".
         * writer.openTag( 'p', { class : 'MyClass', id : 'MyId' } );
         */
        openTag : function(tagName
            //, attributes
            ) {
            var rules = this._.rules[ tagName ];

            if (this._.indent)
                this.indentation();
            // Do not break if indenting.
            else if (rules && rules.breakBeforeOpen) {
                this.lineBreak();
                this.indentation();
            }

            this._.output.push('<', tagName);
        },

        /**
         * Writes the tag closing part for a opener tag.
         * @param {String} tagName The element name for this tag.
         * @param {Boolean} isSelfClose Indicates that this is a self-closing tag,
         *        like "br" or "img".
         * @example
         * // Writes "&gt;".
         * writer.openTagClose( 'p', false );
         * @example
         * // Writes " /&gt;".
         * writer.openTagClose( 'br', true );
         */
        openTagClose : function(tagName, isSelfClose) {
            var rules = this._.rules[ tagName ];

            if (isSelfClose)
                this._.output.push(this.selfClosingEnd);
            else {
                this._.output.push('>');
                if (rules && rules.indent)
                    this._.indentation += this.indentationChars;
            }

            if (rules && rules.breakAfterOpen)
                this.lineBreak();
        },

        /**
         * Writes an attribute. This function should be called after opening the
         * tag with {@link #openTagClose}.
         * @param {String} attName The attribute name.
         * @param {String} attValue The attribute value.
         * @example
         * // Writes ' class="MyClass"'.
         * writer.attribute( 'class', 'MyClass' );
         */
        attribute : function(attName, attValue) {

            if (typeof attValue == 'string') {
                this.forceSimpleAmpersand && ( attValue = attValue.replace(/&amp;/g, '&') );
                // Browsers don't always escape special character in attribute values. (#4683, #4719).
                attValue = Utils.htmlEncodeAttr(attValue);
            }

            this._.output.push(' ', attName, '="', attValue, '"');
        },

        /**
         * Writes a closer tag.
         * @param {String} tagName The element name for this tag.
         * @example
         * // Writes "&lt;/p&gt;".
         * writer.closeTag( 'p' );
         */
        closeTag : function(tagName) {
            var rules = this._.rules[ tagName ];

            if (rules && rules.indent)
                this._.indentation = this._.indentation.substr(this.indentationChars.length);

            if (this._.indent)
                this.indentation();
            // Do not break if indenting.
            else if (rules && rules.breakBeforeClose) {
                this.lineBreak();
                this.indentation();
            }

            this._.output.push('</', tagName, '>');

            if (rules && rules.breakAfterClose)
                this.lineBreak();
        },

        /**
         * Writes text.
         * @param {String} text The text value
         * @example
         * // Writes "Hello Word".
         * writer.text( 'Hello Word' );
         */
        text : function(text) {
            if (this._.indent) {
                this.indentation();
                text = Utils.ltrim(text);
            }

            this._.output.push(text);
        },

        /**
         * Writes a comment.
         * @param {String} comment The comment text.
         * @example
         * // Writes "&lt;!-- My comment --&gt;".
         * writer.comment( ' My comment ' );
         */
        comment : function(comment) {
            if (this._.indent)
                this.indentation();

            this._.output.push('<!--', comment, '-->');
        },

        /**
         * Writes a line break. It uses the { #lineBreakChars} property for it.
         * @example
         * // Writes "\n" (e.g.).
         * writer.lineBreak();
         */
        lineBreak : function() {
            if (this._.output.length > 0)
                this._.output.push(this.lineBreakChars);
            this._.indent = true;
        },

        /**
         * Writes the current indentation chars. It uses the
         * { #indentationChars} property, repeating it for the current
         * indentation steps.
         * @example
         * // Writes "\t" (e.g.).
         * writer.indentation();
         */
        indentation : function() {
            this._.output.push(this._.indentation);
            this._.indent = false;
        },

        /**
         * Sets formatting rules for a give element. The possible rules are:
         * <ul>
         *    <li><b>indent</b>: indent the element contents.</li>
         *    <li><b>breakBeforeOpen</b>: break line before the opener tag for this element.</li>
         *    <li><b>breakAfterOpen</b>: break line after the opener tag for this element.</li>
         *    <li><b>breakBeforeClose</b>: break line before the closer tag for this element.</li>
         *    <li><b>breakAfterClose</b>: break line after the closer tag for this element.</li>
         * </ul>
         *
         * All rules default to "false". Each call to the function overrides
         * already present rules, leaving the undefined untouched.
         *
         * By default, all elements available in the { XHTML_DTD.$block),
         * { XHTML_DTD.$listItem} and { XHTML_DTD.$tableContent}
         * lists have all the above rules set to "true". Additionaly, the "br"
         * element has the "breakAfterOpen" set to "true".
         * @param {String} tagName The element name to which set the rules.
         * @param {Object} rules An object containing the element rules.
         * @example
         * // Break line before and after "img" tags.
         * writer.setRules( 'img',
         *     {
         *         breakBeforeOpen : true
         *         breakAfterOpen : true
         *     });
         * @example
         * // Reset the rules for the "h1" tag.
         * writer.setRules( 'h1', {} );
         */
        setRules : function(tagName, rules) {
            var currentRules = this._.rules[ tagName ];

            if (currentRules)
                currentRules = Utils.mix(currentRules, rules);
            else
                this._.rules[ tagName ] = rules;
        }
    });

    KE.HtmlParser.HtmlWriter = HtmlWriter;
});
KISSY.Editor.add("htmlparser-text", function(
    //editor
    ) {
    var KE = KISSY.Editor,
        S = KISSY,
        KEN = KE.NODE;
    if (KE.HtmlParser.Text) return;
    /**
     * A lightweight representation of HTML text.
     * @constructor
     * @example
     */

    function Text(value) {
        /**
         * The text value.
         * @type String
         * @example
         */
        this.value = value;

        /** @private */
        this._ = {
            isBlockLike : false
        };
    }

    S.augment(Text, {
        /**
         * The node type. This is a constant value set to { KEN.NODE_TEXT}.
         * @type Number
         * @example
         */
        type : KEN.NODE_TEXT,

        /**
         * Writes the HTML representation of this text to a HtmlWriter.
         *  {HtmlWriter} writer The writer to which write the HTML.
         * @example
         */
        writeHtml : function(writer, filter) {
            var text = this.value;

            if (filter && !( text = filter.onText(text, this) ))
                return;

            writer.text(text);
        }
    });

    KE.HtmlParser.Text = Text;
});
/**
 * modified from ckeditor,process malform html and ms-word copy for kissyeditor
 * @modifier: yiminghe@gmail.com
 */
KISSY.Editor.add("htmldataprocessor", function(editor) {
    var undefined = undefined,
        KE = KISSY.Editor,
        S = KISSY,
        UA = S.UA,
        //KEN = KE.NODE,
        HtmlParser = KE.HtmlParser,
        htmlFilter = new HtmlParser.Filter(),
        dataFilter = new HtmlParser.Filter(),
        dtd = KE.XHTML_DTD;
    //每个编辑器的规则独立
    if (editor.htmlDataProcessor) return;

    (function() {

        var fragmentPrototype = KE.HtmlParser.Fragment.prototype,
            elementPrototype = KE.HtmlParser.Element.prototype;

        fragmentPrototype.onlyChild = elementPrototype.onlyChild = function() {
            var children = this.children,
                count = children.length,
                firstChild = ( count == 1 ) && children[ 0 ];
            return firstChild || null;
        };

        elementPrototype.removeAnyChildWithName = function(tagName) {
            var children = this.children,
                childs = [],
                child;

            for (var i = 0; i < children.length; i++) {
                child = children[ i ];
                if (!child.name)
                    continue;

                if (child.name == tagName) {
                    childs.push(child);
                    children.splice(i--, 1);
                }
                childs = childs.concat(child.removeAnyChildWithName(tagName));
            }
            return childs;
        };

        elementPrototype.getAncestor = function(tagNameRegex) {
            var parent = this.parent;
            while (parent && !( parent.name && parent.name.match(tagNameRegex) ))
                parent = parent.parent;
            return parent;
        };

        fragmentPrototype.firstChild = elementPrototype.firstChild = function(evaluator) {
            var child;

            for (var i = 0; i < this.children.length; i++) {
                child = this.children[ i ];
                if (evaluator(child))
                    return child;
                else if (child.name) {
                    child = child.firstChild(evaluator);
                    if (child)
                        return child;
                }
            }

            return null;
        };

        // Adding a (set) of styles to the element's 'style' attributes.
        elementPrototype.addStyle = function(name, value, isPrepend) {
            var styleText, addingStyleText = '';
            // name/value pair.
            if (typeof value == 'string')
                addingStyleText += name + ':' + value + ';';
            else {
                // style literal.
                if (typeof name == 'object') {
                    for (var style in name) {
                        if (name.hasOwnProperty(style))
                            addingStyleText += style + ':' + name[ style ] + ';';
                    }
                }
                // raw style text form.
                else
                    addingStyleText += name;

                isPrepend = value;
            }

            if (!this.attributes)
                this.attributes = {};

            styleText = this.attributes.style || '';

            styleText = ( isPrepend ?
                [ addingStyleText, styleText ]
                : [ styleText, addingStyleText ] ).join(';');

            this.attributes.style = styleText.replace(/^;|;(?=;)/, '');
        };

        /**
         * Return the DTD-valid parent tag names of the specified one.
         * @param tagName
         */
        dtd.parentOf = function(tagName) {
            var result = {};
            for (var tag in this) {
                if (tag.indexOf('$') == -1 && this[ tag ][ tagName ])
                    result[ tag ] = 1;
            }
            return result;
        };
    })();


    var filterStyle = stylesFilter([
        //word 自有类名去除
        [/mso/i],
        //qc 3711，只能出现我们规定的字体
        [ /font-size/i,'',function(v) {
            var fontSizes = editor.cfg.pluginConfig["font-size"];
            for (var i = 0; i < fontSizes.length; i++) {
                if (v.toLowerCase() == fontSizes[i]) return v;
            }
            return false;
        },'font-size'],
        //限制字体
        [ /font-family/i,'',function(v) {
            var fontFamilies = editor.cfg.pluginConfig["font-family"];
            for (var i = 0; i < fontFamilies.length; i++) {
                if (v.toLowerCase() == fontFamilies[i].toLowerCase()) return v;
            }
            return false;
        } ,'font-family'        ],
        //qc 3701，去除行高，防止乱掉
        [/line-height/i],

        [/display/i,/none/i]
    ], undefined);

    function isListBulletIndicator(element) {
        var styleText = element.attributes && element.attributes.style;
        if (/mso-list\s*:\s*Ignore/i.test(styleText))
            return true;
        return undefined;
    }

    // Create a <ke:listbullet> which indicate an list item type.
    function createListBulletMarker(bulletStyle, bulletText) {
        var marker = new KE.HtmlParser.Element('ke:listbullet'),
            listType;

        // TODO: Support more list style type from MS-Word.
        if (!bulletStyle) {
            bulletStyle = 'decimal';
            listType = 'ol';
        }
        else if (bulletStyle[ 2 ]) {
            if (!isNaN(bulletStyle[ 1 ]))
                bulletStyle = 'decimal';
            // No way to distinguish between Roman numerals and Alphas,
            // detect them as a whole.
            else if (/^[a-z]+$/.test(bulletStyle[ 1 ]))
                bulletStyle = 'lower-alpha';
            else if (/^[A-Z]+$/.test(bulletStyle[ 1 ]))
                bulletStyle = 'upper-alpha';
            // Simply use decimal for the rest forms of unrepresentable
            // numerals, e.g. Chinese...
            else
                bulletStyle = 'decimal';

            listType = 'ol';
        }
        else {
            if (/[l\u00B7\u2002]/.test(bulletStyle[ 1 ]))
                bulletStyle = 'disc';
            else if (/[\u006F\u00D8]/.test(bulletStyle[ 1 ]))
                bulletStyle = 'circle';
            else if (/[\u006E\u25C6]/.test(bulletStyle[ 1 ]))
                bulletStyle = 'square';
            else
                bulletStyle = 'disc';

            listType = 'ul';
        }

        // Represent list type as CSS style.
        marker.attributes = {
            'ke:listtype' : listType,
            'style' : 'list-style-type:' + bulletStyle + ';'
        };
        marker.add(new KE.HtmlParser.Text(bulletText));
        return marker;
    }

    function resolveList(element) {
        // <ke:listbullet> indicate a list item.
        var attrs = element.attributes,
            listMarker;

        if (( listMarker = element.removeAnyChildWithName('ke:listbullet') )
            && listMarker.length
            && ( listMarker = listMarker[ 0 ] )) {
            element.name = 'ke:li';

            if (attrs.style) {
                attrs.style = stylesFilter(
                    [
                        // Text-indent is not representing list item level any more.
                        [ 'text-indent' ],
                        [ 'line-height' ],
                        // Resolve indent level from 'margin-left' value.
                        [ ( /^margin(:?-left)?$/ ), null, function(margin) {
                            // Be able to deal with component/short-hand form style.
                            var values = margin.split(' ');
                            margin = values[ 3 ] || values[ 1 ] || values [ 0 ];
                            margin = parseInt(margin, 10);

                            // Figure out the indent unit by looking at the first increament.
                            if (!listBaseIndent && previousListItemMargin && margin > previousListItemMargin)
                                listBaseIndent = margin - previousListItemMargin;

                            attrs[ 'ke:margin' ] = previousListItemMargin = margin;
                        } ]
                    ], undefined)(attrs.style, element) || '';
            }

            // Inherit list-type-style from bullet.
            var listBulletAttrs = listMarker.attributes,
                listBulletStyle = listBulletAttrs.style;
            element.addStyle(listBulletStyle);
            S.mix(attrs, listBulletAttrs);
            return true;
        }

        return false;
    }

    function stylesFilter(styles, whitelist) {
        return function(styleText, element) {
            var rules = [];
            // html-encoded quote might be introduced by 'font-family'
            // from MS-Word which confused the following regexp. e.g.
            //'font-family: &quot;Lucida, Console&quot;'
            styleText
                .replace(/&quot;/g, '"')
                .replace(/\s*([^ :;]+)\s*:\s*([^;]+)\s*(?=;|$)/g,
                function(match, name, value) {
                    name = name.toLowerCase();
                    name == 'font-family' && ( value = value.replace(/["']/g, '') );

                    var namePattern,
                        valuePattern,
                        newValue,
                        newName;
                    for (var i = 0; i < styles.length; i++) {
                        if (styles[ i ]) {
                            namePattern = styles[ i ][ 0 ];
                            valuePattern = styles[ i ][ 1 ];
                            newValue = styles[ i ][ 2 ];
                            newName = styles[ i ][ 3 ];

                            if (name.match(namePattern)
                                && ( !valuePattern || value.match(valuePattern) )) {
                                name = newName || name;
                                whitelist && ( newValue = newValue || value );

                                if (typeof newValue == 'function')
                                    newValue = newValue(value, element, name);

                                // Return an couple indicate both name and value
                                // changed.
                                if (newValue && newValue.push)
                                    name = newValue[ 0 ],newValue = newValue[ 1 ];

                                if (typeof newValue == 'string')
                                    rules.push([ name, newValue ]);
                                return;
                            }
                        }
                    }

                    !whitelist && rules.push([ name, value ]);

                });

            for (var i = 0; i < rules.length; i++)
                rules[ i ] = rules[ i ].join(':');
            return rules.length ?
                ( rules.join(';') + ';' ) : false;
        };
    }

    function assembleList(element) {
        var children = element.children, child,
            listItem,   // The current processing ke:li element.
            listItemAttrs,
            listType,   // Determine the root type of the list.
            listItemIndent, // Indent level of current list item.
            lastListItem, // The previous one just been added to the list.
            list,
            //parentList, // Current staging list and it's parent list if any.
            indent;

        for (var i = 0; i < children.length; i++) {
            child = children[ i ];

            if ('ke:li' == child.name) {
                child.name = 'li';
                listItem = child;
                listItemAttrs = listItem.attributes;
                listType = listItem.attributes[ 'ke:listtype' ];

                // List item indent level might come from a real list indentation or
                // been resolved from a pseudo list item's margin value, even get
                // no indentation at all.
                listItemIndent = parseInt(listItemAttrs[ 'ke:indent' ], 10)
                    || listBaseIndent && ( Math.ceil(listItemAttrs[ 'ke:margin' ] / listBaseIndent) )
                    || 1;

                // Ignore the 'list-style-type' attribute if it's matched with
                // the list root element's default style type.
                listItemAttrs.style && ( listItemAttrs.style =
                    stylesFilter([
                        [ 'list-style-type', listType == 'ol' ? 'decimal' : 'disc' ]
                    ], undefined)(listItemAttrs.style)
                        || '' );

                if (!list) {
                    list = new KE.HtmlParser.Element(listType);
                    list.add(listItem);
                    children[ i ] = list;
                }
                else {
                    if (listItemIndent > indent) {
                        list = new KE.HtmlParser.Element(listType);
                        list.add(listItem);
                        lastListItem.add(list);
                    }
                    else if (listItemIndent < indent) {
                        // There might be a negative gap between two list levels. (#4944)
                        var diff = indent - listItemIndent,
                            parent;
                        while (diff-- && ( parent = list.parent ))
                            list = parent.parent;

                        list.add(listItem);
                    }
                    else
                        list.add(listItem);

                    children.splice(i--, 1);
                }

                lastListItem = listItem;
                indent = listItemIndent;
            }
            else
                list = null;
        }

        listBaseIndent = 0;
    }

    var listBaseIndent,
        previousListItemMargin = 0,
        listDtdParents = dtd.parentOf('ol'),
        //过滤外边来的 html
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
            //根节点伪列表进行处理
            root : function(element) {
                element.filterChildren();
                assembleList(element);
            },
            elements : {

                font:function(el) {
                    delete el.name;
                },
                p:function(element) {
                    element.filterChildren();
                    // Is the paragraph actually a list item?
                    if (resolveList(element))
                        return undefined;
                },
                $:function(el) {
                    var tagName = el.name || "";
                    //ms world <o:p> 保留内容
                    if (tagName.indexOf(':') != -1 && tagName.indexOf("ke") == -1) {
                        //先处理子孙节点，防止delete el.name后，子孙得不到处理?
                        //el.filterChildren();
                        delete el.name;
                    }

                    /*
                     太激进，只做span*/
                    var style = el.attributes.style;
                    //没有属性的inline去掉了
                    if (//tagName in dtd.$inline 
                        tagName == "span"
                            && (!style || !filterStyle(style))
                    //&&tagName!=="a"
                        ) {
                        //el.filterChildren();
                        delete el.name;
                    }

                    // Assembling list items into a whole list.
                    if (tagName in listDtdParents) {
                        el.filterChildren();
                        assembleList(el);
                    }
                }
                ,
                table:function(el) {
                    var border = el.attributes.border;
                    if (!border || border == "0") {
                        el.attributes['class'] = "ke_show_border";
                    }
                },
                /**
                 * ul,li 从 ms word 重建
                 * @param element
                 */
                span:function(element) {
                    // IE/Safari: remove the span if it comes from list bullet text.
                    if (!UA.gecko && isListBulletIndicator(element.parent))
                        return false;

                    // For IE/Safari: List item bullet type is supposed to be indicated by
                    // the text of a span with style 'mso-list : Ignore' or an image.
                    if (!UA.gecko && isListBulletIndicator(element)) {
                        var listSymbolNode = element.firstChild(function(node) {
                            return node.value || node.name == 'img';
                        });
                        var listSymbol = listSymbolNode && ( listSymbolNode.value || 'l.' ),
                            listType = listSymbol.match(/^([^\s]+?)([.)]?)$/);
                        return createListBulletMarker(listType, listSymbol);
                    }
                }
            },
            comment : !UA.ie ?
                function(value, node) {
                    var imageInfo = value.match(/<img.*?>/),
                        listInfo = value.match(/^\[if !supportLists\]([\s\S]*?)\[endif\]$/);
                    // Seek for list bullet indicator.
                    if (listInfo) {
                        // Bullet symbol could be either text or an image.
                        var listSymbol = listInfo[ 1 ] || ( imageInfo && 'l.' ),
                            listType = listSymbol && listSymbol.match(/>([^\s]+?)([.)]?)</);
                        return createListBulletMarker(listType, listSymbol);
                    }

                    // Reveal the <img> element in conditional comments for Firefox.
                    if (UA.gecko && imageInfo) {
                        var img = KE.HtmlParser.Fragment.FromHtml(imageInfo[0]).children[ 0 ],
                            previousComment = node.previous,
                            // Try to dig the real image link from vml markup from previous comment text.
                            imgSrcInfo = previousComment && previousComment.value.match(/<v:imagedata[^>]*o:href=['"](.*?)['"]/),
                            imgSrc = imgSrcInfo && imgSrcInfo[ 1 ];
                        // Is there a real 'src' url to be used?
                        imgSrc && ( img.attributes.src = imgSrc );
                        return img;
                    }
                    return false;
                }
                : function() {
                return false;
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
        //将编辑区生成html最终化
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
                //清除空style
                style:function(v) {
                    if (!S.trim(v)) return false;
                }
            },
            attributeNames :  [
                [ ( /^ck_on/ ), 'on' ],
                [ ( /^ke:.*$/ ), '' ]
            ]
        }//,
        //protectElementNamesRegex = /(<\/?)((?:object|embed|param|html|body|head|title)[^>]*>)/gi
        ;
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

    editor.htmlDataProcessor = {
        htmlFilter:htmlFilter,
        dataFilter:dataFilter,
        //编辑器html到外部html
        toHtml:function(html, fixForBody) {
            //fixForBody = fixForBody || "p";
            // Now use our parser to make further fixes to the structure, as
            // well as apply the filter.
            //使用htmlwriter界面美观，加入额外文字节点\n,\t空白等
            var writer = new HtmlParser.HtmlWriter(),
                fragment = HtmlParser.Fragment.FromHtml(html, fixForBody);
            fragment.writeHtml(writer, htmlFilter);
            return writer.getHtml(true);
        },
        //外部html进入编辑器
        toDataFormat : function(html, fixForBody) {

            // Firefox will be confused by those downlevel-revealed IE conditional
            // comments, fixing them first( convert it to upperlevel-revealed one ).
            // e.g. <![if !vml]>...<![endif]>
            //<!--[if !supportLists]-->
            // <span style=\"font-family: Wingdings;\" lang=\"EN-US\">
            // <span style=\"\">l<span style=\"font: 7pt &quot;Times New Roman&quot;;\">&nbsp;
            // </span></span></span>
            // <!--[endif]-->

            //变成：

            //<!--[if !supportLists]
            // <span style=\"font-family: Wingdings;\" lang=\"EN-US\">
            // <span style=\"\">l<span style=\"font: 7pt &quot;Times New Roman&quot;;\">&nbsp;
            // </span></span></span>
            // [endif]-->
            if (UA.gecko)
                html = html.replace(/(<!--\[if[^<]*?\])-->([\S\s]*?)<!--(\[endif\]-->)/gi, '$1$2$3');


            // Certain elements has problem to go through DOM operation, protect
            // them by prefixing 'ke' namespace. (#3591)
            //html = html.replace(protectElementNamesRegex, '$1ke:$2');
            //fixForBody = fixForBody || "p";
            //bug:qc #3710:使用basicwriter，去除无用的文字节点，标签间连续\n空白等
            var writer = new HtmlParser.BasicWriter(),fragment = HtmlParser.Fragment.FromHtml(html, fixForBody);

            writer.reset();
            fragment.writeHtml(writer, dataFilter);

            return writer.getHtml(true);
        }
    };
});
/**
 * insert image for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("image", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node,
        DOM = S.DOM,
        Event = S.Event,
        Overlay = KE.SimpleOverlay;
    if (!KE.ImageInserter) {
        (function() {
            function ImageInserter(cfg) {
                ImageInserter.superclass.constructor.call(this, cfg);
                this._init();
            }

            var TripleButton = KE.TripleButton,
                bodyHtml = "<div>" +
                    "<p>" +
                    "<label><span style='color:#0066CC;font-weight:bold;'>图片网址：" +
                    "</span><input class='ke-img-url' style='width:230px' value='http://'/></label>" +
                    "</p>" +
                    "</div>",
                footHtml = "<button class='ke-img-insert'>插入</button> <button class='ke-img-cancel'>取消</button>";

            ImageInserter.ATTRS = {
                editor:{}
            };

            S.extend(ImageInserter, S.Base, {
                _init:function() {
                    var editor = this.get("editor"),toolBarDiv = editor.toolBarDiv;
                    this.el = new TripleButton({
                        contentCls:"ke-toolbar-image",
                        //text:"img",
                        title:"图像",
                        container:toolBarDiv
                    });
                    this.el.on("offClick", this.show, this);
                    KE.Utils.lazyRun(this, "_prepare", "_real");
                },
                _prepare:function() {
                    var self = this,editor = self.get("editor");
                    self.d = new Overlay({
                        title:"插入图片",
                        mask:true,
                        width:"350px"
                    });
                    var d = self.d;
                    d.body.html(bodyHtml);
                    d.foot.html(footHtml);
                    self.content = d.el;
                    var content = self.content;
                    var cancel = content.one(".ke-img-cancel"),ok = content.one(".ke-img-insert");
                    self.imgUrl = content.one(".ke-img-url");
                    cancel.on("click", function(ev) {
                        self.d.hide();
                        ev.halt();
                    });
                    Event.on(document, "click", self.hide, self);
                    Event.on(editor.document, "click", self.hide, self);
                    ok.on("click", function() {
                        self._insert();
                    });
                },
                hide:function(ev) {
                    var self = this;
                    if (DOM._4e_ascendant(ev.target, function(node) {
                        return node[0] === self.content[0] || node[0] === self.el.el[0];
                    }, true))return;
                    this.d.hide();
                },
                _real:function() {
                    this.d.show();
                },
                _insert:function() {
                    var editor = this.get("editor");
                    var url = this.imgUrl.val();
                    if (!url) return;
                    var img = new Node("<img src='" + url + "'/>", null, editor.document);
                    editor.insertElement(img);
                    this.d.hide();
                },
                show:function() {
                    this._prepare();
                }
            });
            KE.ImageInserter = ImageInserter;
        })();
    }

    editor.addPlugin(function() {
        new KE.ImageInserter({
            editor:editor
        });

    });

});
/**
 * indent formatting,modified from ckeditor
 * @modifier: yiminghe@gmail.com
 */
KISSY.Editor.add("indent", function(editor) {
    var KE = KISSY.Editor,
        listNodeNames = {ol:1,ul:1},
        S = KISSY,
        Walker = KE.Walker,
        DOM = S.DOM,
        Node = S.Node,
        UA = S.UA,
        KEN = KE.NODE;
    if (!KE.Indent) {
        (function() {
            var isNotWhitespaces = Walker.whitespaces(true),
                isNotBookmark = Walker.bookmark(false, true);

            function IndentCommand(type) {
                this.type = type;
                this.indentCssProperty = "margin-left";
                this.indentOffset = 40;
                this.indentUnit = "px";
            }

            function isListItem(node) {
                return node.type = CKEDITOR.NODE_ELEMENT && node.is('li');
            }

            function indentList(editor, range, listNode) {
                // Our starting and ending points of the range might be inside some blocks under a list item...
                // So before playing with the iterator, we need to expand the block to include the list items.
                var startContainer = range.startContainer,
                    endContainer = range.endContainer;
                while (startContainer && startContainer.parent()[0] !== listNode[0])
                    startContainer = startContainer.parent();
                while (endContainer && endContainer.parent()[0] !== listNode[0])
                    endContainer = endContainer.parent();

                if (!startContainer || !endContainer)
                    return;

                // Now we can iterate over the individual items on the same tree depth.
                var block = startContainer,
                    itemsToMove = [],
                    stopFlag = false;
                while (!stopFlag) {
                    if (block[0] === endContainer[0])
                        stopFlag = true;
                    itemsToMove.push(block);
                    block = block.next();
                }
                if (itemsToMove.length < 1)
                    return;

                // Do indent or outdent operations on the array model of the list, not the
                // list's DOM tree itself. The array model demands that it knows as much as
                // possible about the surrounding lists, we need to feed it the further
                // ancestor node that is still a list.
                var listParents = listNode._4e_parents(true);
                for (var i = 0; i < listParents.length; i++) {
                    if (listNodeNames[ listParents[i]._4e_name() ]) {
                        listNode = listParents[i];
                        break;
                    }
                }
                var indentOffset = this.type == 'indent' ? 1 : -1,
                    startItem = itemsToMove[0],
                    lastItem = itemsToMove[ itemsToMove.length - 1 ],
                    database = {};

                // Convert the list DOM tree into a one dimensional array.
                var listArray = KE.ListUtils.listToArray(listNode, database);

                // Apply indenting or outdenting on the array.
                var baseIndent = listArray[ lastItem._4e_getData('listarray_index') ].indent;
                for (i = startItem._4e_getData('listarray_index'); i <= lastItem._4e_getData('listarray_index'); i++) {
                    listArray[ i ].indent += indentOffset;
                    // Make sure the newly created sublist get a brand-new element of the same type. (#5372)
                    var listRoot = listArray[ i ].parent;
                    listArray[ i ].parent = new Node(listRoot[0].ownerDocument.createElement(listRoot._4e_name()));
                }

                for (i = lastItem._4e_getData('listarray_index') + 1;
                     i < listArray.length && listArray[i].indent > baseIndent; i++)
                    listArray[i].indent += indentOffset;

                // Convert the array back to a DOM forest (yes we might have a few subtrees now).
                // And replace the old list with the new forest.
                var newList = KE.ListUtils.arrayToList(listArray, database, null, "p", 0);

                // Avoid nested <li> after outdent even they're visually same,
                // recording them for later refactoring.(#3982)
                var pendingList = [];
                if (this.type == 'outdent') {
                    var parentLiElement;
                    if (( parentLiElement = listNode.parent() ) && parentLiElement._4e_name() == ('li')) {
                        var children = newList.listNode.childNodes
                            ,count = children.length,
                            child;

                        for (i = count - 1; i >= 0; i--) {
                            if (( child = new Node(children[i]) ) && child._4e_name() == 'li')
                                pendingList.push(child);
                        }
                    }
                }

                if (newList) {
                    DOM.insertBefore(newList.listNode, listNode[0]);
                    listNode._4e_remove();
                }
                // Move the nested <li> to be appeared after the parent.
                if (pendingList && pendingList.length) {
                    for (i = 0; i < pendingList.length; i++) {
                        var li = pendingList[ i ],
                            followingList = li;

                        // Nest preceding <ul>/<ol> inside current <li> if any.
                        while (( followingList = followingList.next() ) &&

                            followingList._4e_name() in listNodeNames) {
                            // IE requires a filler NBSP for nested list inside empty list item,
                            // otherwise the list item will be inaccessiable. (#4476)
                            if (UA.ie && !li._4e_first(function(node) {
                                return isNotWhitespaces(node) && isNotBookmark(node);
                            }))
                                li[0].appendChild(range.document.createTextNode('\u00a0'));

                            li[0].appendChild(followingList[0]);
                        }
                        DOM.insertAfter(li[0], parentLiElement[0]);
                    }
                }

                // Clean up the markers.
                for (var i in database)
                    database[i]._4e_clearMarkers(database, true);
            }

            function indentBlock(editor, range) {
                var iterator = range.createIterator(),
                    enterMode = "p";
                iterator.enforceRealBlocks = true;
                iterator.enlargeBr = true;
                var block;
                while (( block = iterator.getNextParagraph() ))
                    indentElement.call(this, editor, block);
            }

            function indentElement(editor, element) {

                var currentOffset = parseInt(element._4e_style(this.indentCssProperty), 10);
                if (isNaN(currentOffset))
                    currentOffset = 0;
                currentOffset += ( this.type == 'indent' ? 1 : -1 ) * this.indentOffset;

                if (currentOffset < 0)
                    return false;

                currentOffset = Math.max(currentOffset, 0);
                currentOffset = Math.ceil(currentOffset / this.indentOffset) * this.indentOffset;
                element.css(this.indentCssProperty, currentOffset ? currentOffset + this.indentUnit : '');
                if (element[0].style.cssText === '')
                    element[0].removeAttribute('style');

                return true;
            }

            S.augment(IndentCommand, {
                exec:function(editor) {
                    editor.focus();
                    var selection = editor.getSelection(),
                        range = selection && selection.getRanges()[0];
                    var startContainer = range.startContainer,
                        endContainer = range.endContainer,
                        rangeRoot = range.getCommonAncestor(),
                        nearestListBlock = rangeRoot;

                    while (nearestListBlock && !( nearestListBlock[0].nodeType == KEN.NODE_ELEMENT &&
                        listNodeNames[ nearestListBlock._4e_name() ] ))
                        nearestListBlock = nearestListBlock.parent();

                    // Avoid selection anchors under list root.
                    // <ul>[<li>...</li>]</ul> =>	<ul><li>[...]</li></ul>
                    if (nearestListBlock && startContainer[0].nodeType == KEN.NODE_ELEMENT
                        && startContainer._4e_name() in listNodeNames) {
                        var walker = new Walker(range);
                        walker.evaluator = isListItem;
                        range.startContainer = walker.next();
                    }

                    if (nearestListBlock && endContainer[0].nodeType == KEN.NODE_ELEMENT
                        && endContainer._4e_name() in listNodeNames) {
                        walker = new Walker(range);
                        walker.evaluator = isListItem;
                        range.endContainer = walker.previous();
                    }

                    var bookmarks = selection.createBookmarks(true);

                    if (nearestListBlock) {
                        var firstListItem = nearestListBlock._4e_first();
                        while (firstListItem && firstListItem[0] && firstListItem._4e_name() != "li") {
                            firstListItem = firstListItem.next();
                        }
                        var rangeStart = range.startContainer,
                            indentWholeList = firstListItem[0] == rangeStart[0] || firstListItem._4e_contains(rangeStart);

                        // Indent the entire list if  cursor is inside the first list item. (#3893)
                        if (!( indentWholeList && indentElement.call(this, editor, nearestListBlock) ))
                            indentList.call(this, editor, range, nearestListBlock);
                    }
                    else
                        indentBlock.call(this, editor, range);

                    editor.focus();
                    selection.selectBookmarks(bookmarks);
                }
            });


            var TripleButton = KE.TripleButton;

            /**
             * 用到了按钮三状态的两个状态：off可点击，disabled:不可点击
             * @param cfg
             */
            function Indent(cfg) {
                Indent.superclass.constructor.call(this, cfg);

                var editor = this.get("editor"),toolBarDiv = editor.toolBarDiv,
                    el = this.el;

                var self = this;
                self.el = new TripleButton({
                    container:toolBarDiv,
                    contentCls:this.get("contentCls"),
                    //text:this.get("type"),
                    title:this.get("title")
                });
                this.indentCommand = new IndentCommand(this.get("type"));
                this._init();
            }

            Indent.ATTRS = {
                type:{},
                contentCls:{},
                editor:{}
            };

            S.extend(Indent, S.Base, {

                _init:function() {
                    var editor = this.get("editor"),toolBarDiv = editor.toolBarDiv,
                        el = this.el;
                    var self = this;
                    //off状态下触发捕获，注意没有on状态
                    el.on("offClick", this.exec, this);
                    if (this.get("type") == "outdent")
                        editor.on("selectionChange", this._selectionChange, this);
                    else
                        el.set("state", TripleButton.OFF);
                },


                exec:function() {
                    var editor = this.get("editor"),
                        el = this.el,
                        self = this;
                    editor.focus();
                    //ie要等会才能获得焦点窗口的选择区域
                    editor.fire("save");
                    setTimeout(function() {
                        self.indentCommand.exec(editor);
                        editor.fire("save");
                        editor.notifySelectionChange();
                    }, 10);
                },

                _selectionChange:function(ev) {
                    var editor = this.get("editor"),type = this.get("type")
                        , elementPath = ev.path,
                        blockLimit = elementPath.blockLimit,
                        el = this.el;

                    if (elementPath.contains(listNodeNames)) {
                        el.set("state", TripleButton.OFF);
                    } else {
                        var block = elementPath.block || blockLimit;
                        if (block && block._4e_style(this.indentCommand.indentCssProperty)) {
                            el.set("state", TripleButton.OFF);
                        } else {
                            el.set("state", TripleButton.DISABLED);
                        }
                    }
                }
            });
            KE.Indent = Indent;
        })();
    }
    editor.addPlugin(function() {
        editor.addCommand("outdent", new KE.Indent({
            editor:editor,
            title:"减少缩进量",
            contentCls:"ke-toolbar-outdent",
            type:"outdent"
        }));
        editor.addCommand("indent", new KE.Indent({
            editor:editor,
            title:"增加缩进量",
            contentCls:"ke-toolbar-indent",
            type:"indent"
        }));
    });
});
/**
 * align support for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("justify", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,TripleButton = KE.TripleButton;

    if (!KE.Justify) {
        (function() {
            function Justify(editor, v, title, contentCls) {
                var self = this;
                self.editor = editor;
                self.v = v;
                self.contentCls = contentCls;
                self.title = title;
                self._init();
            }

            var alignRemoveRegex = /(-moz-|-webkit-|start|auto)/i,
                default_align = "left";
            S.augment(Justify, {
                _init:function() {
                    var self = this,editor = self.editor,toolBarDiv = editor.toolBarDiv;
                    self.el = new TripleButton({
                        contentCls:self.contentCls,
                        //text:self.v,
                        title:self.title,
                        container:toolBarDiv
                    });
                    editor.on("selectionChange", self._selectionChange, self);
                    self.el.on("click", self._effect, self);
                },
                _effect:function() {
                    var self = this,editor = self.editor,
                        selection = editor.getSelection(),
                        enterMode = "p",state = self.el.get("state");

                    if (!selection)
                        return;

                    var bookmarks = selection.createBookmarks(),
                        ranges = selection.getRanges(),
                        iterator,
                        block;
                    editor.fire("save");
                    for (var i = ranges.length - 1; i >= 0; i--) {
                        iterator = ranges[ i ].createIterator();
                        iterator.enlargeBr = true;
                        while (( block = iterator.getNextParagraph() )) {
                            block.removeAttr('align');
                            if (state == TripleButton.OFF)
                                block.css('text-align', self.v);
                            else
                                block.css('text-align', '');
                        }
                    }

                    editor.focus();
                    editor.notifySelectionChange();
                    selection.selectBookmarks(bookmarks);
                    editor.fire("save");
                },
                _selectionChange:function(ev) {
                    var self = this,
                        el = self.el,
                        path = ev.path,elements = path.elements,block = path.block || path.blockLimit;
                    if (!block)return;
                    var align = block.css("text-align").replace(alignRemoveRegex, "");
                    if (align == self.v || (!align && self.v == default_align)) {
                        el.set("state", TripleButton.ON);
                    } else {
                        el.set("state", TripleButton.OFF);
                    }
                }
            });
            KE.Justify = Justify;
        })();
    }
    editor.addPlugin(function() {
        new KE.Justify(editor, "left", "左对齐", "ke-toolbar-alignleft");
        new KE.Justify(editor, "center", "居中对齐", "ke-toolbar-aligncenter");
        new KE.Justify(editor, "right", "右对齐", "ke-toolbar-alignright");
        //new Justify(editor, "justify", "两端对齐");
    });
});
/**
 * link editor support for kissy editor ,innovation from google doc and ckeditor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("link", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        DOM = S.DOM,
        Event = S.Event,
        TripleButton = KE.TripleButton,
        KEStyle = KE.Style,
        Node = S.Node,
        KERange = KE.Range,
        Overlay = KE.SimpleOverlay ,
        dataProcessor = editor.htmlDataProcessor,
        //htmlFilter = dataProcessor && dataProcessor.htmlFilter,
        dataFilter = dataProcessor && dataProcessor.dataFilter;


    if (!KE.Link) {
        (function() {

            var link_Style = {
                element : 'a',
                attributes:{
                    "href":"#(href)",
                    target:"#(target)"
                }
            };


            function Link(editor) {
                this.editor = editor;
                this._init();
            }


            /**
             * 所有编辑器实例共享同一功能窗口
             */
            Link.init = function() {
                var self = this;
                self.d = new Overlay({
                    title:"修改链接",
                    mask:true,
                    width:"300px"
                });

                self.d.body.html(bodyHtml);
                self.d.foot.html(footHtml);
                self.urlEl = self.d.body.one(".ke-link-url");
                self.targetEl = self.d.body.one(".ke-link-blank");
                var cancel = self.d.foot.one(".ke-link-cancel");
                self.ok = self.d.foot.one(".ke-link-ok");
                Link.ok.on("click", function(ev) {
                    var link = Link.d.link;
                    link._link();
                    ev.halt();
                }, this);
                cancel.on("click", function(ev) {
                    self.d.hide();
                    ev.halt();
                }, self);
                Link.init = null;
            };
            /**
             * tip初始化，所有共享一个tip
             */
            var tipHtml = '<div class="ke-bubbleview-bubble" onmousedown="return false;">前往链接： '
                + ' <a href="" '
                + ' target="_blank" class="ke-bubbleview-url"></a> - '
                + '    <span class="ke-bubbleview-link ke-bubbleview-change">编辑</span> - '
                + '    <span class="ke-bubbleview-link ke-bubbleview-remove">去除</span>'
                + '</div>';
            Link.tip = function() {
                var self = this,el = new Node(tipHtml);
                el._4e_unselectable();
                self.tipwin = new Overlay({el:el,focusMgr:false});
                //KE.Tips["link"] = self.tipwin;
                document.body.appendChild(el[0]);
                self.tipurl = el.one(".ke-bubbleview-url");
                var tipchange = el.one(".ke-bubbleview-change");
                var tipremove = el.one(".ke-bubbleview-remove");
                tipchange.on("click", function(ev) {
                    Link.tipwin.link.show();
                    ev.halt();
                });
                Event.on(document, "click", function() {
                    self.tipwin.hide();
                });
                tipremove.on("click", function(ev) {
                    var link = Link.tipwin.link;
                    link._removeLink();
                    ev.halt();
                });
                Link.tip = null;
            };

            var bodyHtml = "<div>" +
                "<p>" +
                "<label><span style='color:#0066CC;font-weight:bold;'>网址：</span><input class='ke-link-url' style='width:230px' value='http://'/></label>" +
                "</p>" +
                "<p style='margin-top: 5px;padding-left:45px'>" +
                "<label><input class='ke-link-blank' type='checkbox'/> &nbsp; 在新窗口打开链接</label>" +
                "</p>" +

                "</div>",
                footHtml = "<button class='ke-link-ok'>确定</button> " +
                    "<button class='ke-link-cancel'>取消</button>";
            S.augment(Link, {
                _init:function() {
                    var self = this,editor = self.editor;
                    self.el = new TripleButton({
                        container:editor.toolBarDiv,
                        contentCls:"ke-toolbar-link",
                        title:"编辑超链接 "
                        //"编辑超链接"
                        //text:'link',
                    });
                    self.el.on("click", self.show, self);
                    editor.on("selectionChange", self._selectionChange, self);

                },
                _prepareTip:function() {
                    Link.tip && Link.tip();
                },
                _realTip:function(a) {
                    var xy = a._4e_getOffset(document);
                    xy.top += a.height() + 5;
                    Link.tipwin.show(xy);
                    this._a = a;
                    Link.tipwin.link = this;
                    Link.tipurl.html(a.attr("href"));
                    Link.tipurl.attr("href", a.attr("href"));
                },
                _showTip:function(a) {
                    this._prepareTip(a);
                },
                _hideTip:function() {
                    Link.tipwin && Link.tipwin.hide();
                },

                _removeLink:function() {
                    var a = this._a,editor = this.editor;
                    //ie6先要focus
                    editor.focus();
                    var attr = {
                        href:a.attr("href")
                    };
                    if (a._4e_hasAttribute("target")) {
                        attr.target = a.attr("target");
                    }
                    var linkStyle = new KEStyle(link_Style, attr);
                    editor.fire("save");
                    linkStyle.remove(editor.document);
                    editor.fire("save");
                    editor.focus();
                    editor.notifySelectionChange();
                },
                //借鉴google doc tip提示显示
                _selectionChange:function(ev) {
                    var elementPath = ev.path,
                        //editor = this.editor,
                        elements = elementPath.elements;

                    if (elementPath && elements) {
                        var lastElement = elementPath.lastElement;
                        if (!lastElement) return;
                        var a = lastElement._4e_ascendant(function(node) {
                            return node._4e_name() === 'a' && (!!node.attr("href"));
                        }, true);

                        if (a) {
                            this._showTip(a);
                        } else {
                            this._hideTip();
                        }
                    }
                },
                hide:function() {
                    Link.d.hide();
                },

                //得到当前选中的 link a
                _getSelectedLink:function() {
                    var self = this;
                    var editor = this.editor;
                    if (Link.tipwin && Link.tipwin.get("visible")) {
                        var range = editor.getSelection().getRanges()[0];
                        var common = range.getCommonAncestor();
                        common && (common = common._4e_ascendant(function(node) {
                            return node._4e_name() == 'a' && (!!node.attr("href"));
                        }, true));
                        if (common && common[0] == Link.tipwin.link._a[0]) {
                            return common;
                        }
                    }
                },

                _link:function() {
                    var self = this,range;
                    var editor = this.editor,url = Link.urlEl.val();
                    //ie6 先要focus
                    editor.focus();
                    if (!S.trim(url)) {
                        return;
                    }
                    var link = self._getSelectedLink();
                    //是修改行为
                    if (link) {
                        range = new KERange(editor.document);
                        range.selectNodeContents(link);
                        editor.getSelection().selectRanges([range]);
                        self._removeLink();
                    }
                    var attr = {
                        href:url
                    };
                    if (Link.targetEl[0].checked) {
                        attr.target = "_blank";
                    } else {
                        attr.target = "_self";
                    }

                    range = editor.getSelection().getRanges()[0];
                    //没有选择区域时直接插入链接地址
                    if (range.collapsed) {
                        var a = new Node("<a href='" + url +
                            "' target='" + attr.target + "'>" + url + "</a>", null, editor.document);
                        editor.insertElement(a);
                    } else {
                        editor.fire("save");
                        var linkStyle = new KEStyle(link_Style, attr);
                        linkStyle.apply(editor.document);
                        editor.fire("save");
                    }
                    self.hide();
                    editor.focus();
                    editor.notifySelectionChange();
                },
                _prepare:function() {
                    var self = this;
                    Link.init && Link.init();
                },
                _real:function() {
                    var self = this;
                    Link.d.link = this;

                    var link = self._getSelectedLink();
                    //是修改行为

                    if (link) {
                        Link.urlEl.val(link.attr("href"));
                        Link.targetEl[0].checked = link.attr("target") == "_blank";
                    }
                    Link.d.show();
                },
                show:function() {
                    var self = this;
                    self._prepare();
                }
            });
            KE.Utils.lazyRun(Link.prototype, "_prepare", "_real");
            KE.Utils.lazyRun(Link.prototype, "_prepareTip", "_realTip");
            KE.Link = Link;
        })();
    }
    editor.addPlugin(function() {
        new KE.Link(editor);
        var win = DOM._4e_getWin(editor.document);
        Event.on(win, "scroll", function() {
            KE.Link.tipwin && KE.Link.tipwin.hide();
        });
    });
});/**
 * list formatting,modified from ckeditor
 * @modifier: yiminghe@gmail.com
 */
KISSY.Editor.add("list", function(editor) {
    var KE = KISSY.Editor,
        listNodeNames = {"ol":1,"ul":1},
        listNodeNames_arr = ["ol","ul"],
        S = KISSY,
        KER = KE.RANGE,
        KEP = KE.POSITION,
        ElementPath = KE.ElementPath,
        Walker = KE.Walker,
        KEN = KE.NODE,
        UA = S.UA,
        Node = S.Node,
        DOM = S.DOM;
    if (!KE.List) {
        (function() {


            var list = {
                /*
                 * Convert a DOM list tree into a data structure that is easier to
                 * manipulate. This operation should be non-intrusive in the sense that it
                 * does not change the DOM tree, with the exception that it may add some
                 * markers to the list item nodes when database is specified.
                 * 扁平化处理，深度遍历，利用 indent 和顺序来表示一棵树
                 */
                listToArray : function(listNode, database, baseArray, baseIndentLevel, grandparentNode) {
                    if (!listNodeNames[ listNode._4e_name() ])
                        return [];

                    if (!baseIndentLevel)
                        baseIndentLevel = 0;
                    if (!baseArray)
                        baseArray = [];

                    // Iterate over all list items to and look for inner lists.
                    for (var i = 0, count = listNode[0].childNodes.length; i < count; i++) {
                        var listItem = new Node(listNode[0].childNodes[i]);

                        // It may be a text node or some funny stuff.
                        if (listItem._4e_name() != 'li')
                            continue;

                        var itemObj = { 'parent' : listNode, indent : baseIndentLevel, element : listItem, contents : [] };
                        if (!grandparentNode) {
                            itemObj.grandparent = listNode.parent();
                            if (itemObj.grandparent && itemObj.grandparent._4e_name() == 'li')
                                itemObj.grandparent = itemObj.grandparent.parent();
                        }
                        else
                            itemObj.grandparent = grandparentNode;

                        if (database)
                            listItem._4e_setMarker(database, 'listarray_index', baseArray.length);
                        baseArray.push(itemObj);

                        for (var j = 0, itemChildCount = listItem[0].childNodes.length, child; j < itemChildCount; j++) {
                            child = new Node(listItem[0].childNodes[j]);
                            if (child[0].nodeType == KEN.NODE_ELEMENT && listNodeNames[ child._4e_name() ])
                            // Note the recursion here, it pushes inner list items with
                            // +1 indentation in the correct order.
                                list.listToArray(child, database, baseArray, baseIndentLevel + 1, itemObj.grandparent);
                            else
                                itemObj.contents.push(child);
                        }
                    }
                    return baseArray;
                },

                // Convert our internal representation of a list back to a DOM forest.
                //根据包含indent属性的元素数组来生成树
                arrayToList : function(listArray, database, baseIndex, paragraphMode) {
                    if (!baseIndex)
                        baseIndex = 0;
                    if (!listArray || listArray.length < baseIndex + 1)
                        return null;
                    var doc = listArray[ baseIndex ].parent[0].ownerDocument,
                        retval = doc.createDocumentFragment(),
                        rootNode = null,
                        currentIndex = baseIndex,
                        indentLevel = Math.max(listArray[ baseIndex ].indent, 0),
                        currentListItem = null,
                        paragraphName = paragraphMode;
                    while (true) {
                        var item = listArray[ currentIndex ];
                        if (item.indent == indentLevel) {
                            if (!rootNode
                                ||
                                //用于替换标签,ul->ol ,ol->ul
                                listArray[ currentIndex ].parent._4e_name() != rootNode._4e_name()) {

                                rootNode = listArray[ currentIndex ].parent._4e_clone(false, true);
                                retval.appendChild(rootNode[0]);
                            }
                            currentListItem = rootNode[0].appendChild(item.element._4e_clone(false, true)[0]);
                            for (var i = 0; i < item.contents.length; i++)
                                currentListItem.appendChild(item.contents[i]._4e_clone(true, true)[0]);
                            currentIndex++;
                        } else if (item.indent == Math.max(indentLevel, 0) + 1) {
                            //进入一个li里面，里面的嵌套li递归构造父亲ul/ol
                            var listData = list.arrayToList(listArray, null, currentIndex, paragraphMode);
                            currentListItem.appendChild(listData.listNode);
                            currentIndex = listData.nextIndex;
                        } else if (item.indent == -1 && !baseIndex && item.grandparent) {
                            currentListItem;
                            if (listNodeNames[ item.grandparent._4e_name() ])
                                currentListItem = item.element._4e_clone(false, true)[0];
                            else {
                                // Create completely new blocks here, attributes are dropped.
                                if (item.grandparent._4e_name() != 'td')
                                    currentListItem = doc.createElement(paragraphName);
                                else
                                    currentListItem = doc.createDocumentFragment();
                            }

                            for (i = 0; i < item.contents.length; i++)
                                currentListItem.appendChild(item.contents[i]._4e_clone(true, true)[0]);

                            if (currentListItem.nodeType == KEN.NODE_DOCUMENT_FRAGMENT
                                && currentIndex != listArray.length - 1) {
                                if (currentListItem.lastChild
                                    && currentListItem.lastChild.nodeType == KEN.NODE_ELEMENT
                                    && currentListItem.lastChild.getAttribute('type') == '_moz')
                                    DOM._4e_remove(currentListItem.lastChild);
                                DOM._4e_appendBogus(currentListItem);
                            }

                            if (currentListItem.nodeType == KEN.NODE_ELEMENT &&
                                DOM._4e_name(currentListItem) == paragraphName &&
                                currentListItem.firstChild) {
                                DOM._4e_trim(currentListItem);
                                var firstChild = currentListItem.firstChild;
                                if (firstChild.nodeType == KEN.NODE_ELEMENT &&
                                    DOM._4e_isBlockBoundary(firstChild)
                                    ) {
                                    var tmp = doc.createDocumentFragment();
                                    DOM._4e_moveChildren(currentListItem, tmp);
                                    currentListItem = tmp;
                                }
                            }

                            var currentListItemName = DOM._4e_name(currentListItem);
                            if (!UA.ie && ( currentListItemName == 'div' || currentListItemName == 'p' ))
                                DOM._4e_appendBogus(currentListItem);
                            retval.appendChild(currentListItem);
                            rootNode = null;
                            currentIndex++;
                        }
                        else
                            return null;

                        if (listArray.length <= currentIndex || Math.max(listArray[ currentIndex ].indent, 0) < indentLevel)
                            break;
                    }

                    // Clear marker attributes for the new list tree made of cloned nodes, if any.
                    if (database) {
                        var currentNode = new Node(retval.firstChild);
                        while (currentNode && currentNode[0]) {
                            if (currentNode[0].nodeType == KEN.NODE_ELEMENT) {
                                currentNode._4e_clearMarkers(database, true);
                                //add by yiminghe:no need _ke_expando copied!

                            }
                            currentNode = currentNode._4e_nextSourceNode();
                        }
                    }

                    return { listNode : retval, nextIndex : currentIndex };
                }
            };


            var headerTagRegex = /^h[1-6]$/;


            function listCommand(type) {
                this.type = type;
            }

            listCommand.prototype = {
                changeListType:function(editor, groupObj, database, listsCreated) {
                    // This case is easy...
                    // 1. Convert the whole list into a one-dimensional array.
                    // 2. Change the list type by modifying the array.
                    // 3. Recreate the whole list by converting the array to a list.
                    // 4. Replace the original list with the recreated list.
                    var listArray = list.listToArray(groupObj.root, database),
                        selectedListItems = [];

                    for (var i = 0; i < groupObj.contents.length; i++) {
                        var itemNode = groupObj.contents[i];
                        itemNode = itemNode._4e_ascendant('li', true);
                        if ((!itemNode || !itemNode[0]) || itemNode._4e_getData('list_item_processed'))
                            continue;
                        selectedListItems.push(itemNode);
                        itemNode._4e_setMarker(database, 'list_item_processed', true);
                    }

                    var fakeParent = new Node(groupObj.root[0].ownerDocument.createElement(this.type));
                    for (i = 0; i < selectedListItems.length; i++) {
                        var listIndex = selectedListItems[i]._4e_getData('listarray_index');
                        listArray[listIndex].parent = fakeParent;
                    }
                    var newList = list.arrayToList(listArray, database, null, "p");
                    var child, length = newList.listNode.childNodes.length;
                    for (i = 0; i < length && ( child = new Node(newList.listNode.childNodes[i]) ); i++) {
                        if (child._4e_name() == this.type)
                            listsCreated.push(child);
                    }
                    DOM.insertBefore(newList.listNode, groupObj.root[0]);
                    groupObj.root._4e_remove();
                },
                createList:function(editor, groupObj, listsCreated) {
                    var contents = groupObj.contents,
                        doc = groupObj.root[0].ownerDocument,
                        listContents = [];

                    // It is possible to have the contents returned by DomRangeIterator to be the same as the root.
                    // e.g. when we're running into table cells.
                    // In such a case, enclose the childNodes of contents[0] into a <div>.
                    if (contents.length == 1 && contents[0][0] === groupObj.root[0]) {
                        var divBlock = new Node(doc.createElement('div'));
                        contents[0][0].nodeType != KEN.NODE_TEXT && contents[0]._4e_moveChildren(divBlock);
                        contents[0][0].appendChild(divBlock[0]);
                        contents[0] = divBlock;
                    }

                    // Calculate the common parent node of all content blocks.
                    var commonParent = groupObj.contents[0].parent();
                    for (var i = 0; i < contents.length; i++)
                        commonParent = commonParent._4e_commonAncestor(contents[i].parent());

                    // We want to insert things that are in the same tree level only, so calculate the contents again
                    // by expanding the selected blocks to the same tree level.
                    for (i = 0; i < contents.length; i++) {
                        var contentNode = contents[i],
                            parentNode;
                        while (( parentNode = contentNode.parent() )) {
                            if (parentNode[0] === commonParent[0]) {
                                listContents.push(contentNode);
                                break;
                            }
                            contentNode = parentNode;
                        }
                    }

                    if (listContents.length < 1)
                        return;

                    // Insert the list to the DOM tree.
                    var insertAnchor = new Node(listContents[ listContents.length - 1 ][0].nextSibling),
                        listNode = new Node(doc.createElement(this.type));

                    listsCreated.push(listNode);
                    while (listContents.length) {
                        var contentBlock = listContents.shift(),
                            listItem = new Node(doc.createElement('li'));

                        // Preserve heading structure when converting to list item. (#5271)
                        if (headerTagRegex.test(contentBlock._4e_name())) {
                            listItem[0].appendChild(contentBlock[0]);
                        } else {
                            contentBlock._4e_copyAttributes(listItem);
                            contentBlock._4e_moveChildren(listItem);
                            contentBlock._4e_remove();
                        }
                        listNode[0].appendChild(listItem[0]);

                        // Append a bogus BR to force the LI to render at full height
                        if (!UA.ie)
                            listItem._4e_appendBogus();
                    }
                    if (insertAnchor[0])
                        DOM.insertBefore(listNode[0], insertAnchor[0]);
                    else
                        commonParent[0].appendChild(listNode[0]);
                },
                removeList:function(editor, groupObj, database) {
                    // This is very much like the change list type operation.
                    // Except that we're changing the selected items' indent to -1 in the list array.
                    var listArray = list.listToArray(groupObj.root, database),
                        selectedListItems = [];

                    for (var i = 0; i < groupObj.contents.length; i++) {
                        var itemNode = groupObj.contents[i];
                        itemNode = itemNode._4e_ascendant('li', true);
                        if (!itemNode || itemNode._4e_getData('list_item_processed'))
                            continue;
                        selectedListItems.push(itemNode);
                        itemNode._4e_setMarker(database, 'list_item_processed', true);
                    }

                    var lastListIndex = null;
                    for (i = 0; i < selectedListItems.length; i++) {
                        var listIndex = selectedListItems[i]._4e_getData('listarray_index');
                        listArray[listIndex].indent = -1;
                        lastListIndex = listIndex;
                    }

                    // After cutting parts of the list out with indent=-1, we still have to maintain the array list
                    // model's nextItem.indent <= currentItem.indent + 1 invariant. Otherwise the array model of the
                    // list cannot be converted back to a real DOM list.
                    for (i = lastListIndex + 1; i < listArray.length; i++) {
                        //if (listArray[i].indent > listArray[i - 1].indent + 1) {
                        //modified by yiminghe
                        if (listArray[i].indent > Math.max(listArray[i - 1].indent, 0)) {
                            var indentOffset = listArray[i - 1].indent + 1 - listArray[i].indent;
                            var oldIndent = listArray[i].indent;
                            while (listArray[i]
                                && listArray[i].indent >= oldIndent) {
                                listArray[i].indent += indentOffset;
                                i++;
                            }
                            i--;
                        }
                    }

                    var newList = list.arrayToList(listArray, database, null, "p");

                    // Compensate <br> before/after the list node if the surrounds are non-blocks.(#3836)
                    var docFragment = newList.listNode, boundaryNode, siblingNode;

                    function compensateBrs(isStart) {
                        if (( boundaryNode = new Node(docFragment[ isStart ? 'firstChild' : 'lastChild' ]) )
                            && !( boundaryNode[0].nodeType == KEN.NODE_ELEMENT && boundaryNode._4e_isBlockBoundary() )
                            && ( siblingNode = groupObj.root[ isStart ? '_4e_previous' : '_4e_next' ]
                            (Walker.whitespaces(true)) )
                            && !( boundaryNode[0].nodeType == KEN.NODE_ELEMENT && siblingNode._4e_isBlockBoundary({ br : 1 }) ))

                            DOM[ isStart ? 'insertBefore' : 'insertAfter' ](editor.document.createElement('br'), boundaryNode[0]);
                    }

                    compensateBrs(true);
                    compensateBrs();

                    DOM.insertBefore(docFragment, groupObj.root);
                    groupObj.root._4e_remove();
                },

                exec : function(editor) {
                    editor.focus();
                    var doc = editor.document,
                        selection = editor.getSelection(),
                        ranges = selection && selection.getRanges();

                    // There should be at least one selected range.
                    if (!ranges || ranges.length < 1)
                        return;

                    var bookmarks = selection.createBookmarks(true);

                    // Group the blocks up because there are many cases where multiple lists have to be created,
                    // or multiple lists have to be cancelled.
                    var listGroups = [],
                        database = {};

                    while (ranges.length > 0) {
                        var range = ranges.shift();

                        var boundaryNodes = range.getBoundaryNodes(),
                            startNode = boundaryNodes.startNode,
                            endNode = boundaryNodes.endNode;

                        if (startNode[0].nodeType == KEN.NODE_ELEMENT && startNode._4e_name() == 'td')
                            range.setStartAt(boundaryNodes.startNode, KER.POSITION_AFTER_START);

                        if (endNode[0].nodeType == KEN.NODE_ELEMENT && endNode._4e_name() == 'td')
                            range.setEndAt(boundaryNodes.endNode, KER.POSITION_BEFORE_END);

                        var iterator = range.createIterator(),
                            block;

                        iterator.forceBrBreak = false;

                        while (( block = iterator.getNextParagraph() )) {
                            var path = new ElementPath(block),
                                pathElements = path.elements,
                                pathElementsCount = pathElements.length,
                                listNode = null,
                                processedFlag = false,
                                blockLimit = path.blockLimit,
                                element;

                            // First, try to group by a list ancestor.
                            for (var i = pathElementsCount - 1; i >= 0 && ( element = pathElements[ i ] ); i--) {
                                if (listNodeNames[ element._4e_name() ]
                                    && blockLimit.contains(element))     // Don't leak outside block limit (#3940).
                                {
                                    // If we've encountered a list inside a block limit
                                    // The last group object of the block limit element should
                                    // no longer be valid. Since paragraphs after the list
                                    // should belong to a different group of paragraphs before
                                    // the list. (Bug #1309)
                                    blockLimit._4e_removeData('list_group_object');

                                    var groupObj = element._4e_getData('list_group_object');
                                    if (groupObj)
                                        groupObj.contents.push(block);
                                    else {
                                        groupObj = { root : element, contents : [ block ] };
                                        listGroups.push(groupObj);
                                        element._4e_setMarker(database, 'list_group_object', groupObj);
                                    }
                                    processedFlag = true;
                                    break;
                                }
                            }

                            if (processedFlag)
                                continue;

                            // No list ancestor? Group by block limit.
                            var root = blockLimit;
                            if (root._4e_getData('list_group_object'))
                                root._4e_getData('list_group_object').contents.push(block);
                            else {
                                groupObj = { root : root, contents : [ block ] };
                                root._4e_setMarker(database, 'list_group_object', groupObj);
                                listGroups.push(groupObj);
                            }
                        }
                    }

                    // Now we have two kinds of list groups, groups rooted at a list, and groups rooted at a block limit element.
                    // We either have to build lists or remove lists, for removing a list does not makes sense when we are looking
                    // at the group that's not rooted at lists. So we have three cases to handle.
                    var listsCreated = [];
                    while (listGroups.length > 0) {
                        groupObj = listGroups.shift();
                        if (this.state == "off") {
                            if (listNodeNames[ groupObj.root._4e_name() ])
                                this.changeListType(editor, groupObj, database, listsCreated);
                            else
                                this.createList(editor, groupObj, listsCreated);
                        }
                        else if (this.state == "on" && listNodeNames[ groupObj.root._4e_name() ])
                            this.removeList(editor, groupObj, database);
                    }

                    // For all new lists created, merge adjacent, same type lists.
                    for (i = 0; i < listsCreated.length; i++) {
                        listNode = listsCreated[i];
                        //note by yiminghe,why not use merge sibling directly
                        //listNode._4e_mergeSiblings();

                        var mergeSibling, listCommand = this;
                        ( mergeSibling = function(rtl) {

                            var sibling = listNode[ rtl ?
                                '_4e_previous' : '_4e_next' ](Walker.whitespaces(true));
                            if (sibling && sibling[0] &&
                                sibling._4e_name() == listCommand.type) {
                                sibling._4e_remove();
                                // Move children order by merge direction.(#3820)
                                sibling._4e_moveChildren(listNode, rtl ? true : false);
                            }
                        } )();
                        mergeSibling(true);

                    }

                    // Clean up, restore selection and update toolbar button states.
                    KE.Utils.clearAllMarkers(database);

                    selection.selectBookmarks(bookmarks);
                    editor.focus();
                }
            };


            var TripleButton = KE.TripleButton;

            /**
             * 用到了按钮三状态的两个状态：off:点击后格式化，on:点击后清除格式化
             * @param cfg
             */
            function List(cfg) {
                var self = this;
                List.superclass.constructor.call(self, cfg);
                var editor = self.get("editor"),toolBarDiv = editor.toolBarDiv,
                    el = self.el;
                self.el = new TripleButton({
                    //text:this.get("type"),
                    contentCls:self.get("contentCls"),
                    title:self.get("title"),
                    container:toolBarDiv
                });
                self.listCommand = new listCommand(this.get("type"));
                self.listCommand.state = self.get("status");
                //this._selectionChange({path:1});
                self._init();
            }

            List.ATTRS = {
                editor:{},
                type:{},
                contentCls:{}
            };

            S.extend(List, S.Base, {

                _init:function() {
                    var self = this,editor = self.get("editor"),
                        toolBarDiv = editor.toolBarDiv,
                        el = self.el;
                    var self = self;
                    el.on("click", self._change, self);
                    editor.on("selectionChange", self._selectionChange, self);
                },


                _change:function() {
                    var self = this,editor = self.get("editor"),
                        type = self.get("type"),
                        el = self.el;
                    editor.fire("save");
                    self.listCommand.state = el.get("state");
                    self.listCommand.exec(editor);
                    editor.fire("save");
                    editor.notifySelectionChange();
                },

                _selectionChange:function(ev) {
                    var self = this,editor = self.get("editor"),
                        type = self.get("type"),
                        elementPath = ev.path,
                        element,
                        el = self.el,
                        blockLimit = elementPath.blockLimit,
                        elements = elementPath.elements;

                    // Grouping should only happen under blockLimit.(#3940).
                    if (elements)
                        for (var i = 0; i < elements.length && ( element = elements[ i ] )
                            && element[0] !== blockLimit[0]; i++) {
                            var ind = S.indexOf(elements[i]._4e_name(), listNodeNames_arr);
                            //ul,ol一个生效后，另一个就失效
                            if (ind !== -1) {
                                if (listNodeNames_arr[ind] === type) {
                                    el.set("state", TripleButton.ON);
                                    return;
                                } else {
                                    break;
                                }

                            }
                        }
                    el.set("state", TripleButton.OFF);
                }
            });

            KE.ListUtils = list;
            KE.List = List
        })();
    }
    editor.addPlugin(function() {
        new KE.List({
            editor:editor,
            title:"项目列表",
            contentCls:"ke-toolbar-ul",
            type:"ul"
        });
        new KE.List({
            editor:editor,
            title:"编号列表",
            contentCls:"ke-toolbar-ol",
            type:"ol"
        });
    });
});
/**
 * maximize editor
 * @author:yiminghe@gmail.com
 * @note:firefox 焦点完全完蛋了，这里全是针对firefox
 */
KISSY.Editor.add("maximize", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        UA = S.UA,
        Node = S.Node,
        Event = S.Event,
        TripleButton = KE.TripleButton,
        DOM = S.DOM,
        iframe;

    if (!KE.Maximize) {
        (function() {
            function Maximize(editor) {

                this.editor = editor;
                this._init();
            }

            Maximize.init = function() {
                iframe = new Node("<iframe style='position:absolute;top:-9999px;left:-9999px;' frameborder='0'>" +
                    "</iframe>");
                document.body.appendChild(iframe[0]);
                Maximize.init = null;
            };
            S.augment(Maximize, {
                _init:function() {
                    var self = this,editor = self.editor;
                    self.el = new TripleButton({
                        container:editor.toolBarDiv,
                        cls:"ke-tool-editor-source",
                        title:"全屏",
                        contentCls:"ke-toolbar-maximize"
                        //text:"maximize"
                    });

                    self.el.on("offClick", self.maximize, self);
                    self.el.on("onClick", self.restore, self);
                    KE.Utils.lazyRun(this, "_prepare", "_real");
                },
                restore:function() {
                    var self = this,
                        editor = self.editor;
                    Event.remove(window, "resize", self._maximize, self);
                    //editor.focus();
                    //console.log(editor.iframeFocus);

                    this._saveEditorStatus();
                    editor.wrap.css({
                        height:self.iframeHeight
                    });
                    new Node(document.body).css({
                        width:"",
                        height:"",
                        overflow:""
                    });
                    document.documentElement.style.overflow = "";
                    editor.editorWrap.css({
                        position:"static",
                        width:self.editorWrapWidth
                    });
                    iframe.css({
                        left:"-99999px",
                        top:"-99999px"
                    });
                    window.scrollTo(self.scrollLeft, self.scrollTop);
                    self.el.set("state", TripleButton.OFF);
                    //firefox 必须timeout
                    setTimeout(function() {
                        //editor.focus();
                        self._restoreEditorStatus();
                    }, 30);
                    editor.notifySelectionChange();
                },

                _saveSate:function() {
                    var self = this,
                        editor = self.editor;
                    self.iframeHeight = editor.wrap._4e_style("height");
                    self.editorWrapWidth = editor.editorWrap._4e_style("width");
                    //主窗口滚动条也要保存哦
                    self.scrollLeft = DOM.scrollLeft();
                    self.scrollTop = DOM.scrollTop();
                    window.scrollTo(0, 0);
                },
                //firefox修正，iframe layout变化时，range丢了
                _saveEditorStatus:function() {
                    var self = this,
                        editor = self.editor;
                    if (!UA.gecko || !editor.iframeFocus) return;
                    var sel = editor.getSelection();
                    //firefox 光标丢失bug,位置丢失，所以这里保存下
                    self.savedRanges = sel && sel.getRanges();
                },

                _restoreEditorStatus:function() {
                    var self = this,
                        editor = self.editor;
                    var sel = editor.getSelection();

                    //firefox焦点bug
                    if (UA.gecko && editor.iframeFocus) {

                        //原来是聚焦，现在刷新designmode
                        //firefox 先失去焦点才行
                        self.el.el[0].focus();
                        editor.focus();
                        if (self.savedRanges && sel) {
                            sel.selectRanges(self.savedRanges);
                        }

                    }
                    //firefox 有焦点时才重新聚焦


                    if (editor.iframeFocus && sel) {
                        var element = sel.getStartElement();
                        //使用原生不行的，会使主窗口滚动
                        //element[0] && element[0].scrollIntoView(true);
                        element && element[0] && element._4e_scrollIntoView();
                    }

                    //firefox焦点bug
                    if (UA.gecko) {
                        //原来不聚焦
                        if (!editor.iframeFocus) {
                            //移到核心mousedown判断
                            //刷新designmode
                            //editor.focus();
                            //光标拖出
                            //editor.blur();
                        }
                    }

                },
                _maximize:function() {
                    var self = this,
                        editor = self.editor;
                    var viewportHeight = DOM.viewportHeight(),
                        viewportWidth = DOM.viewportWidth(),
                        statusHeight = editor.statusDiv ? editor.statusDiv.height() : 0,
                        toolHeight = editor.toolBarDiv.height();

                    if (!UA.ie)
                        new Node(document.body).css({
                            width:0,
                            height:0,
                            overflow:"hidden"
                        });
                    else {
                        document.documentElement.style.overflow = "hidden";
                        document.body.style.overflow = "hidden";
                    }
                    editor.editorWrap.css({
                        position:"absolute",
                        zIndex:990,
                        width:viewportWidth + "px"
                    });
                    iframe.css({
                        zIndex:985,
                        height:viewportHeight + "px",
                        width:viewportWidth + "px"
                    });
                    editor.editorWrap.offset({
                        left:0,
                        top:0
                    });
                    iframe.css({
                        left:0,
                        top:0
                    });
                    editor.wrap.css({
                        height:(viewportHeight - statusHeight - toolHeight - 14) + "px"
                    });
                    editor.notifySelectionChange();
                },
                _real:function() {
                    var self = this,
                        editor = self.editor;
                    //editor.focus();
                    this._saveEditorStatus();
                    this._saveSate();
                    this._maximize();
                    //firefox第一次最大化bug，重做一次
                    if (true || UA.gecko) {
                        this._maximize();
                    }
                    Event.on(window, "resize", self._maximize, self);
                    this.el.set("state", TripleButton.ON);
                    //if (editor.iframeFocus)

                    setTimeout(function() {
                        self._restoreEditorStatus();
                    }, 30);
                },
                _prepare:function() {
                    Maximize.init && Maximize.init();
                },
                maximize:function() {
                    this._prepare();
                }
            });

            KE.Maximize = Maximize;
        })();
    }
    editor.addPlugin(function() {
        new KE.Maximize(editor);
    });
});
/**
 * insert music for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("music", function(editor) {
    var S = KISSY,
        Node = S.Node,
        DOM = S.DOM,
        KE = S.Editor,
        Event = S.Event;
    if (!KE.MusicInserter) {
        (function() {
            var ContextMenu = KE.ContextMenu,
                //MUSIC_PLAYER = KE.Config.base+"niftyplayer.swf",
                //CLS_FLASH = 'ke_flash',
                CLS_MUSIC = 'ke_music',
                // TYPE_FLASH = 'flash',
                TYPE_MUSIC = 'music',
                Overlay = KE.SimpleOverlay,
                TripleButton = KE.TripleButton,
                getFlashUrl = KE.Utils.getFlashUrl,

                bodyHtml = "<div>" +
                    "<p>" +
                    "<label><span style='color:#0066CC;font-weight:bold;'>音乐网址： " +
                    "</span><input class='ke-music-url' style='width:230px' value='http://'/></label>" +
                    "</p>" +
                    "</div>",
                footHtml = "<button class='ke-music-insert'>确定</button> " +
                    "<button class='ke-music-cancel'>取消</button>",

                MUSIC_MARKUP = '<object ' +
                    ' width="165" height="37"' +
                    ' codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"' +
                    ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
                    '<param value="'
                    + (KE.Config.base + 'plugins/music/niftyplayer.swf?file=#(music)"') +
                    ' name="movie"/>' +
                    '<param value="high" name="quality"/>' +
                    '<param value="#FFFFFF" name="bgcolor"/>' +
                    '<embed width="165" height="37" ' +
                    'type="application/x-shockwave-flash" ' +
                    'swliveconnect="true" ' +
                    'src="' + (KE.Config.base + 'plugins/music/niftyplayer.swf?file=#(music)"') +
                    'quality="high" ' +
                    'pluginspage="http://www.macromedia.com/go/getflashplayer"' +
                    ' bgcolor="#FFFFFF" />' +
                    '</object>',
                music_reg = /#\(music\)/g,
                flashRules = ["img." + CLS_MUSIC];

            function MusicInserter(cfg) {
                MusicInserter.superclass.constructor.call(this, cfg);
                var self = this,editor = self.get("editor");
                editor._toolbars = editor._toolbars || {};
                editor._toolbars["music"] = self;
                self._init();
            }

            MusicInserter.ATTRS = {
                editor:{}
            };
            /**
             * tip初始化，所有共享一个tip
             */
            var tipHtml = '<div class="ke-bubbleview-bubble" onmousedown="return false;">音乐网址： '
                + ' <a class="ke-bubbleview-url" target="_blank" href="#"></a> - '
                + '    <span class="ke-bubbleview-link ke-bubbleview-change">编辑</span> - '
                + '    <span class="ke-bubbleview-link ke-bubbleview-remove">删除</span>'
                + '</div>';
            MusicInserter.tip = function() {
                var self = this,el = new Node(tipHtml);
                el._4e_unselectable();
                self.tipwin = new Overlay({el:el,focusMgr:false});
                //KE.Tips["music"] = self.tipwin;
                document.body.appendChild(el[0]);
                self.tipurl = el.one(".ke-bubbleview-url");
                var tipchange = el.one(".ke-bubbleview-change");
                var tipremove = el.one(".ke-bubbleview-remove");
                tipchange.on("click", function(ev) {
                    self.tipwin.music.show();
                    ev.halt();
                });
                self.tipwin.on("hide", function() {
                    var music = self.tipwin.music;
                    music && (music.selectedFlash = null);
                });
                Event.on(document, "click", function() {
                    self.tipwin.hide();
                });
                tipremove.on("click", function(ev) {
                    var music = self.tipwin.music;
                    music.selectedFlash._4e_remove();
                    music.get("editor").notifySelectionChange();
                    ev.halt();
                });
                self.tip = null;
            };

            S.extend(MusicInserter, S.Base, {
                _init:function() {
                    var self = this,editor = self.get("editor"),toolBarDiv = editor.toolBarDiv,
                        myContexts = {};

                    self.el = new TripleButton({
                        //text:"music",
                        contentCls:"ke-toolbar-music",
                        title:"分享音乐",
                        container:toolBarDiv
                    });
                    Event.on(editor.document, "dblclick", self._dblclick, self);
                    for (var f in contextMenu) {
                        (function(f) {
                            myContexts[f] = function() {
                                //editor.fire("save");
                                //editor.focus();
                                contextMenu[f](editor);
                                //editor.fire("save");
                            }
                        })(f);
                    }
                    ContextMenu.register(editor.document, {
                        rules:flashRules,
                        width:"120px",
                        funcs:myContexts
                    });
                    self.el.on("offClick", self.show, self);
                    KE.Utils.lazyRun(self, "_prepare", "_real");
                    editor.on("selectionChange", self._selectionChange, self);
                },
                _selectionChange:function(ev) {
                    var elementPath = ev.path,
                        //editor = this.editor,
                        elements = elementPath.elements;

                    if (elementPath && elements) {
                        var lastElement = elementPath.lastElement;
                        if (!lastElement) return;

                        var a = lastElement._4e_ascendant(function(node) {
                            return node._4e_name() === 'img' && (!!node.hasClass(CLS_MUSIC));
                        }, true);

                        if (a) {
                            this._showTip(a);
                        } else {
                            this._hideTip();
                        }
                    }
                },
                _showTip:function(a) {
                    this._prepareTip(a);
                },
                _hideTip:function() {
                    MusicInserter.tipwin && MusicInserter.tipwin.hide();
                },
                _prepareTip:function() {
                    MusicInserter.tip && MusicInserter.tip();
                },
                _realTip:function(a) {
                    var self = this,
                        editor = self.get("editor"),
                        xy = a._4e_getOffset(document);
                    xy.top += a.height() + 5;
                    MusicInserter.tipwin.show(xy);
                    this.selectedFlash = a;
                    var r = editor.restoreRealElement(self.selectedFlash);
                    MusicInserter.tipwin.music = this;
                    MusicInserter.tipurl.html(getMusicUrl(getFlashUrl(r)));
                    MusicInserter.tipurl.attr("href", getMusicUrl(getFlashUrl(r)));
                },
                _prepare:function() {
                    var self = this,editor = self.get("editor");
                    self.d = new Overlay({
                        title:"编辑音乐",
                        mask:true,
                        width:"350px"
                    });
                    var d = self.d;
                    d.body.html(bodyHtml);
                    d.foot.html(footHtml);
                    self.content = d.el;
                    var content = self.content;

                    d.on("hide", function() {
                        //清空
                        self.selectedFlash = null;
                    });

                    var cancel = content.one(".ke-music-cancel"),
                        ok = content.one(".ke-music-insert");
                    self.musicUrl = content.one(".ke-music-url");
                    cancel.on("click", function(ev) {
                        self.d.hide();
                        ev.halt();
                    });
                    Event.on(document, "click", self.hide, self);
                    Event.on(editor.document, "click", self.hide, self);
                    ok.on("click", function() {
                        self._insert();
                    });
                },
                hide:function(ev) {
                    var self = this;
                    if (DOM._4e_ascendant(ev.target, function(node) {
                        return node[0] === self.content[0] || node[0] === self.el.el[0];
                    }))return;
                    this.d.hide();
                },
                _real:function() {
                    this.d.show();
                },
                _insert:function() {
                    var self = this,editor = self.get("editor");
                    var url = self.musicUrl.val();
                    if (!url) return;
                    var html = MUSIC_MARKUP.replace(music_reg, url),
                        music = new Node(html, null, editor.document);
                    var substitute = editor.createFakeElement ?
                        editor.createFakeElement(music, CLS_MUSIC, TYPE_MUSIC, true, html) :
                        music;
                    editor.insertElement(substitute);
                    if (self.selectedFlash) {
                        editor.getSelection().selectElement(substitute);
                    }
                    self.d.hide();
                },
                _dblclick:function(ev) {
                    var self = this,t = new Node(ev.target);
                    if (t._4e_name() === "img" && t.hasClass(CLS_MUSIC)) {
                        self.selectedFlash = t;
                        self.show();
                        ev.halt();
                    }
                },
                show:function() {
                    var self = this;
                    self._prepare();
                    if (self.selectedFlash) {
                        var editor = self.get("editor"),r = editor.restoreRealElement(self.selectedFlash);
                        self.musicUrl.val(getMusicUrl(getFlashUrl(r)));
                    } else {
                        self.musicUrl.val("");
                    }
                }
            });
            function getMusicUrl(url) {
                return url.replace(/^.+niftyplayer\.swf\?file=/, "");
            }

            KE.Utils.lazyRun(MusicInserter.prototype, "_prepareTip", "_realTip");
            KE.MusicInserter = MusicInserter;
            var contextMenu = {
                "编辑音乐":function(editor) {
                    var selection = editor.getSelection(),
                        startElement = selection && selection.getStartElement(),
                        flash = startElement && startElement._4e_ascendant('img', true);
                    if (!flash)
                        return;
                    if (!flash.hasClass(CLS_MUSIC)) return;
                    var flashUI = editor._toolbars["music"];
                    flashUI.selectedFlash = flash;
                    flashUI.show();
                }
            };
        })();
    }


    editor.addPlugin(function() {
        new KE.MusicInserter({
            editor:editor
        });
        var win = DOM._4e_getWin(editor.document);
        Event.on(win, "scroll", function() {
            KE.MusicInserter.tipwin && KE.MusicInserter.tipwin.hide();
        });
    });

});/**
 * preview for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("preview", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,TripleButton = KE.TripleButton;
    if (!KE.Preview) {
        (function() {
            function Preview(editor) {
                this.editor = editor;
                this._init();
            }

            S.augment(Preview, {
                _init:function() {
                    var self = this,editor = self.editor;
                    self.el = new TripleButton({
                        container:editor.toolBarDiv,
                        cls:"ke-tool-editor-source",
                        title:"预览",
                        contentCls:"ke-toolbar-preview"
                        //text:"preview"
                    });
                    self.el.on("offClick", this._show, this);
                },
                _show:function() {
                    var self = this,editor = self.editor;
                    //try {
                    //editor will be unvisible
                    //  editor.focus();
                    //} catch(e) {
                    // }
                    var iWidth = 640,    // 800 * 0.8,
                        iHeight = 420,    // 600 * 0.7,
                        iLeft = 80;	// (800 - 0.8 * 800) /2 = 800 * 0.1.
                    try {
                        var screen = window.screen;
                        iWidth = Math.round(screen.width * 0.8);
                        iHeight = Math.round(screen.height * 0.7);
                        iLeft = Math.round(screen.width * 0.1);
                    } catch (e) {
                    }
                    var sHTML = editor._prepareIFrameHtml().replace(/<body[^>]+>.+<\/body>/, "<body>\n" + editor.getData() + "\n</body>");
                    var sOpenUrl = '';
                    var oWindow = window.open(sOpenUrl, null, 'toolbar=yes,location=no,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=' +
                        iWidth + ',height=' + iHeight + ',left=' + iLeft);
                    oWindow.document.open();
                    oWindow.document.write(sHTML);
                    oWindow.document.close();
                }
            });
            KE.Preview = Preview;
        })();
    }

    editor.addPlugin(function() {
        new KE.Preview(editor);
    });
});
/**
 * remove inline-style format for kissy editor,modified from ckeditor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("removeformat", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        KER = KE.RANGE,
        ElementPath = KE.ElementPath,
        KEN = KE.NODE,
        TripleButton = KE.TripleButton,
        /**
         * A comma separated list of elements to be removed when executing the "remove
         " format" command. Note that only inline elements are allowed.
         * @type String
         * @default 'b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var'
         * @example
         */
        removeFormatTags = 'b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var,s',

        /**
         * A comma separated list of elements attributes to be removed when executing
         * the "remove format" command.
         * @type String
         * @default 'class,style,lang,width,height,align,hspace,valign'
         * @example
         */
        removeFormatAttributes = 'class,style,lang,width,height,align,hspace,valign'.split(',');

    removeFormatTags = new RegExp('^(?:' + removeFormatTags.replace(/,/g, '|') + ')$', 'i');

    function RemoveFormat(editor) {
        this.editor = editor;
        this._init();
    }

    S.augment(RemoveFormat, {
        _init:function() {
            var self = this,editor = self.editor;
            self.el = new TripleButton({
                title:"清除格式",
                contentCls:"ke-toolbar-removeformat",
                container:editor.toolBarDiv
            });
            self.el.on("offClick", self._remove, self);
        },
        _remove:function() {
            var self = this,
                editor = self.editor,
                tagsRegex = removeFormatTags,
                removeAttributes = removeFormatAttributes;

            tagsRegex.lastIndex = 0;
            editor.focus();
            var ranges = editor.getSelection().getRanges();
            editor.fire("save");
            for (var i = 0, range; range = ranges[ i ]; i++) {
                if (range.collapsed)
                    continue;

                range.enlarge(KER.ENLARGE_ELEMENT);

                // Bookmark the range so we can re-select it after processing.
                var bookmark = range.createBookmark();

                // The style will be applied within the bookmark boundaries.
                var startNode = bookmark.startNode;
                var endNode = bookmark.endNode;

                // We need to check the selection boundaries (bookmark spans) to break
                // the code in a way that we can properly remove partially selected nodes.
                // For example, removing a <b> style from
                //		<b>This is [some text</b> to show <b>the] problem</b>
                // ... where [ and ] represent the selection, must result:
                //		<b>This is </b>[some text to show the]<b> problem</b>
                // The strategy is simple, we just break the partial nodes before the
                // removal logic, having something that could be represented this way:
                //		<b>This is </b>[<b>some text</b> to show <b>the</b>]<b> problem</b>

                var breakParent = function(node) {
                    // Let's start checking the start boundary.
                    var path = new ElementPath(node);
                    var pathElements = path.elements;

                    for (var i = 1, pathElement; pathElement = pathElements[ i ]; i++) {
                        if (pathElement._4e_equals(path.block) || pathElement._4e_equals(path.blockLimit))
                            break;

                        // If this element can be removed (even partially).
                        if (tagsRegex.test(pathElement._4e_name()))
                            node._4e_breakParent(pathElement);
                    }
                };

                breakParent(startNode);
                breakParent(endNode);

                // Navigate through all nodes between the bookmarks.
                var currentNode = startNode._4e_nextSourceNode(true, KEN.NODE_ELEMENT);

                while (currentNode) {
                    // If we have reached the end of the selection, stop looping.
                    if (currentNode._4e_equals(endNode))
                        break;

                    // Cache the next node to be processed. Do it now, because
                    // currentNode may be removed.
                    var nextNode = currentNode._4e_nextSourceNode(false, KEN.NODE_ELEMENT);

                    // This node must not be a fake element.
                    if (!( currentNode._4e_name() == 'img'
                        && currentNode.attr('_cke_realelement') )
                        ) {
                        // Remove elements nodes that match with this style rules.
                        if (tagsRegex.test(currentNode._4e_name()))
                            currentNode._4e_remove(true);
                        else {
                            removeAttrs(currentNode, removeAttributes);
                        }
                    }

                    currentNode = nextNode;
                }

                range.moveToBookmark(bookmark);
            }

            editor.getSelection().selectRanges(ranges);
            editor.fire("save");
        }

    });
    function removeAttrs(el, attrs) {
        for (var i = 0; i < attrs.length; i++)
            el.removeAttr(attrs[i]);
    }

    editor.addPlugin(function() {
        new RemoveFormat(editor);
    });

});/**
 * smiley icon from wangwang for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("smiley", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        DOM = S.DOM,
        Event = S.Event,
        Node = S.Node,
        Overlay = KE.SimpleOverlay,
        TripleButton = KE.TripleButton;
    if (!KE.Smiley) {
        (function() {
            var
                smiley_markup = "<div class='ke-popup-wrap'>" +
                    "<div class='ke-smiley-sprite'>";

            for (var i = 0; i <= 98; i++) {
                smiley_markup += "<a href='#' data-icon='http://a.tbcdn.cn/sys/wangwang/smiley/48x48/" + i + ".gif'></a>"
            }

            smiley_markup += "</div></div>";

            function Smiley(editor) {
                this.editor = editor;
                this._init();
            }

            S.augment(Smiley, {
                _init:function() {
                    var self = this,editor = self.editor;
                    self.el = new TripleButton({
                        //text:"smiley",
                        contentCls:"ke-toolbar-smiley",
                        title:"插入表情",
                        container:editor.toolBarDiv
                    });
                    self.el.on("offClick", this._show, this);
                    KE.Utils.lazyRun(this, "_prepare", "_real");
                },
                _hidePanel:function(ev) {
                    var self = this,t = ev.target;
                    //多窗口管理
                    if (DOM._4e_ascendant(ev.target, function(node) {
                        return  node[0] === self.el.el[0];
                    }))return;

                    this.smileyWin.hide();
                },
                _selectSmiley:function(ev) {
                    ev.halt();
                    var self = this,editor = self.editor;
                    var t = ev.target,icon;
                    if (DOM._4e_name(t) == "a" && (icon = DOM.attr(t, "data-icon"))) {
                        var img = new Node("<img src='" + icon + "'/>", null, editor.document);
                        editor.insertElement(img);
                        editor.focus();
                        this.smileyWin.hide();
                    }
                },
                _prepare:function() {
                    var self = this,editor = self.editor;
                    this.smileyPanel = new Node(smiley_markup);
                    this.smileyWin = new Overlay({
                        el:this.smileyPanel,
                        mask:false
                    });
                    document.body.appendChild(this.smileyPanel[0]);
                    this.smileyPanel.on("click", this._selectSmiley, this);
                    Event.on(document, "click", this._hidePanel, this);
                    Event.on(editor.document, "click", this._hidePanel, this);
                },
                _real:function() {
                    var xy = this.el.el.offset();
                    xy.top += this.el.el.height() + 5;
                    if (xy.left + this.smileyPanel.width() > DOM.viewportWidth() - 60) {
                        xy.left = DOM.viewportWidth() - this.smileyPanel.width() - 60;
                    }
                    this.smileyWin.show(xy);
                },
                _show:function(ev) {
                    var self = this;
                    self._prepare(ev);
                }
            });
            KE.Smiley = Smiley;
        })();
    }
    editor.addPlugin(function() {
        new KE.Smiley(editor);
    });
});
/**
 * source editor for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("sourcearea", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        UA = S.UA,
        TripleButton = KE.TripleButton;
    if (!KE.SourceArea) {
        (function() {
            function SourceArea(editor) {
                this.editor = editor;
                this._init();
            }

            S.augment(SourceArea, {
                _init:function() {
                    var self = this,editor = self.editor;
                    self.el = new TripleButton({
                        container:editor.toolBarDiv,
                        cls:"ke-tool-editor-source",
                        title:"源码",
                        contentCls:"ke-toolbar-source"
                        //text:"source"
                    });
                    self.el.on("offClick", self._show, self);
                    self.el.on("onClick", self._hide, self);

                    //不被父容器阻止默认，可点击
                    editor.textarea.on("mousedown", function(ev) {
                        ev.stopPropagation();
                    });
                },
                _show:function() {
                    var self = this,
                        editor = self.editor,
                        textarea = editor.textarea,
                        iframe = editor.iframe,
                        el = self.el;
                    textarea.val(editor.getData());
                    editor._showSource();
                    el.set("state", TripleButton.ON);
                },
                _hide:function() {
                    var self = this,
                        editor = self.editor,
                        textarea = editor.textarea,
                        iframe = editor.iframe,
                        el = self.el;
                    editor._hideSource();
                    editor.setData(textarea.val());
                    //firefox 光标激活，强迫刷新
                    if (UA.gecko && editor.iframeFocus) {
                        el.el[0].focus();
                        editor.focus();
                    }
                    el.set("state", TripleButton.OFF);
                }
            });
            KE.SourceArea = SourceArea;
        })();
    }

    editor.addPlugin(function() {
        new KE.SourceArea(editor);
    });
});
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
            "<label>行数： <input value='2' class='ke-table-rows ke-table-create-only' size='" + IN_SIZE + "'/></label>" +
            "</td>" +
            "<td>" +
            "<label>宽度： <input value='200' class='ke-table-width' size='" + IN_SIZE + "'/></label> " +
            "<select class='ke-table-width-unit'>" +
            "<option value='px'>像素</option>" +
            "<option value='%'>百分比</option>" +
            "</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +
            "<td>" +
            "<label>列数： <input class='ke-table-cols ke-table-create-only' value='3' size='" + IN_SIZE + "'/></label>" +
            "</td>" +
            "<td>" +
            "<label>高度： <input value='' class='ke-table-height' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +

            "<td>" +
            "<label>对齐： <select class='ke-table-align'>" +
            "<option value=''>无</option>" +
            "<option value='left'>左对齐</option>" +
            "<option value='right'>右对齐</option>" +
            "<option value='center'>中间对齐</option>" +
            "</select>" +
            "</label>" + "</td>" +


            "<td>" +
            "<label>间距： <input value='1' class='ke-table-cellspacing' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +


            "<td>" +
            "<label>标题格： <select class='ke-table-head ke-table-create-only'>" +
            "<option value=''>无</option>" +
            "<option value='1'>有</option>" +
            "</select>" +
            "</td>" +
            "<td>" +

            "<label>边距： <input value='1' class='ke-table-cellpadding' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +
            "<td>" +

            "</td>" +
            "<td>" +
            "<label>边框： <input value='1' class='ke-table-border' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
            "</td>" +
            "</tr>" +
            "<tr>" +
            "<td colspan='2'>" +
            "<label>" +
            "标题：<input class='ke-table-caption' style='width:270px'>" +
            "</label>" +
            "</td>" +
            "</tr>" +
            "</table>",
        footHtml = "<button class='ke-table-ok'>确定</button> <button class='ke-table-cancel'>取消</button>",
        ContextMenu = KE.ContextMenu,
        tableRules = ["tr","th","td","tbody","table"],trim = S.trim;

    /**
     * table 编辑模式下显示虚线边框便于编辑
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
    var dataProcessor = editor.htmlDataProcessor,
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
    if (!KE.TableUI) {
        (function() {


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

                return targetCell ? new Node(targetCell) : table._4e_previous();
            }

            function deleteColumns(selectionOrCell) {
                if (selectionOrCell instanceof KE.Selection) {
                    var colsToDelete = getSelectedCells(selectionOrCell),
                        elementToFocus = getFocusElementAfterDelCols(colsToDelete);

                    for (var i = colsToDelete.length - 1; i >= 0; i--) {
                        //某一列已经删除？？这一列的cell再做？ !table判断处理
                        if (colsToDelete[ i ])
                            deleteColumns(colsToDelete[i]);
                    }

                    return elementToFocus;
                }
                else if (selectionOrCell instanceof Node) {
                    // Get the cell's table.
                    var table = selectionOrCell._4e_ascendant('table');

                    //该单元格所属的列已经被删除了
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
                "表格属性" : function(editor) {
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

                '删除行 ': function(editor) {
                    var selection = editor.getSelection();
                    placeCursorInCell(deleteRows(selection), undefined);
                },

                '删除列 ' : function(editor) {
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
         * 动态加入显表格border css，便于编辑
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
/**
 * templates support for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("templates", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node,
        //Event = S.Event,
        //KEN = KE.NODE,
        //UA = S.UA,
        //DOM = S.DOM,
        TripleButton = KE.TripleButton,
        Overlay = KE.SimpleOverlay;

    if (!KE.TplUI) {

        (function() {
            function TplUI(editor) {
                this.editor = editor;
                this._init();
            }

            S.augment(TplUI, {
                _init:function() {
                    var self = this,editor = self.editor,el = new TripleButton({
                        container:editor.toolBarDiv,
                        //text:"template",
                        contentCls:"ke-toolbar-template",
                        title:"模板"
                    });
                    el.on("click", self._show, self);
                    KE.Utils.lazyRun(this, "_prepare", "_real");
                },
                _prepare:function() {
                    var self = this,editor = self.editor,templates = editor.cfg.pluginConfig.templates;
                    var HTML = "<div class='ke-tpl'>";

                    for (var i = 0; i < templates.length; i++) {
                        var t = templates[i];
                        HTML += "<a href='javascript:void(0)' class='ke-tpl-list' tabIndex='-1'>" + t.demo + "</a>";
                    }
                    HTML += "</div>";

                    this._initDialogOk = true;
                    var ui = new Overlay({mask:true,title:"内容模板"});
                    ui.body.html(HTML);
                    var list = ui.body.all(".ke-tpl-list");
                                        list.on("click", function(ev) {
                        ev.halt();
                        var t = new Node(ev.target);
                        var index = t._4e_index();
                        if (index != -1) {
                            editor.insertHtml(templates[index].html);
                        }
                        ui.hide();
                    });
                    self.ui = ui;
                },
                _real:function() {
                    var self = this;
                    self.ui.show();
                },
                _show:function() {
                    var self = this;
                    self._prepare();
                }
            });
            KE.TplUI = TplUI;
        })();
    }
    editor.addPlugin(function() {
        new KE.TplUI(editor);

    });

});
/**
 * undo,redo manager for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("undo", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        arrayCompare = KE.Utils.arrayCompare,
        UA = S.UA,
        Event = S.Event;
    if (!KE.UndoManager) {
        (function() {
            /**
             * 当前编辑区域状态，包括html与选择区域
             * @param editor
             */
            function Snapshot(editor) {
                var contents = editor._getRawData(),selection = contents && editor.getSelection();
                //内容html
                this.contents = contents;
                //选择区域书签标志
                this.bookmarks = selection && selection.createBookmarks2(true);
            }


            S.augment(Snapshot, {
                /**
                 * 编辑状态间是否相等
                 * @param otherImage
                 */
                equals:function(otherImage) {
                    var thisContents = this.contents,
                        otherContents = otherImage.contents;
                    if (thisContents != otherContents)
                        return false;
                    var bookmarksA = this.bookmarks,
                        bookmarksB = otherImage.bookmarks;

                    if (bookmarksA || bookmarksB) {
                        if (!bookmarksA || !bookmarksB || bookmarksA.length != bookmarksB.length)
                            return false;

                        for (var i = 0; i < bookmarksA.length; i++) {
                            var bookmarkA = bookmarksA[ i ],
                                bookmarkB = bookmarksB[ i ];

                            if (
                                bookmarkA.startOffset != bookmarkB.startOffset ||
                                    bookmarkA.endOffset != bookmarkB.endOffset ||
                                    !arrayCompare(bookmarkA.start, bookmarkB.start) ||
                                    !arrayCompare(bookmarkA.end, bookmarkB.end)) {
                                return false;
                            }
                        }
                    }

                    return true;
                }
            });


            /**
             * 键盘输入做延迟处理
             * @param s
             * @param fn
             * @param scope
             */
            function BufferTimer(s, fn, scope) {
                this.s = s;
                this.fn = fn;
                this.scope = scope || window;
                this.bufferTimer = null;
            }

            S.augment(BufferTimer, {
                run:function() {
                    if (this.bufferTimer) {
                        clearTimeout(this.bufferTimer);
                        this.bufferTimer = null;
                    }
                    var self = this;

                    this.bufferTimer = setTimeout(function() {
                        self.fn.call(self.scope);
                    }, this.s);
                }
            });
            var LIMIT = 30;


            /**
             * 通过编辑器的save与restore事件，编辑器实例的历史栈管理，与键盘监控
             * @param editor
             */
            function UndoManager(editor) {
                //redo undo history stack
                /**
                 * 编辑器状态历史保存
                 */
                this.history = [];
                this.index = 0;
                this.editor = editor;
                this.bufferTimer = new BufferTimer(500, this.save, this);
                this._init();
            }

            var editingKeyCodes = { /*Backspace*/ 8:1, /*Delete*/ 46:1 },
                modifierKeyCodes = { /*Shift*/ 16:1, /*Ctrl*/ 17:1, /*Alt*/ 18:1 },
                navigationKeyCodes = { 37:1, 38:1, 39:1, 40:1 },// Arrows: L, T, R, B
                zKeyCode = 90,
                yKeyCode = 89;


            S.augment(UndoManager, {
                /**
                 * 监控键盘输入，buffer处理
                 */
                _keyMonitor:function() {
                    var self = this,editor = self.editor,doc = editor.document;
                    Event.on(doc, "keydown", function(ev) {
                        var keycode = ev.keyCode;
                        if (keycode in navigationKeyCodes
                            || keycode in modifierKeyCodes
                            )
                            return;
                        //ctrl+z，撤销
                        if (keycode === zKeyCode && (ev.ctrlKey || ev.metaKey)) {
                            editor.fire("restore", {d:-1});
                            ev.halt();
                            return;
                        }
                        //ctrl+y，重做
                        if (keycode === yKeyCode && (ev.ctrlKey || ev.metaKey)) {
                            editor.fire("restore", {d:1});
                            ev.halt();
                            return;
                        }
                        editor.fire("save", {buffer:1});
                    });
                },

                _init:function() {
                    var self = this,editor = self.editor;
                    //外部通过editor触发save|restore,管理器捕获事件处理
                    editor.on("save", function(ev) {
                        if (ev.buffer)
                        //键盘操作需要缓存
                            self.bufferTimer.run();
                        else {
                            //其他立即save
                            self.save();
                        }
                    });
                    editor.on("restore", this.restore, this);
                    self._keyMonitor();
                    //先save一下,why??
                    //self.save();
                },

                /**
                 * 保存历史
                 */
                save:function() {
                    //前面的历史抛弃
                    if (this.history.length > this.index + 1)
                        this.history.splice(this.index + 1, this.history.length - this.index - 1);

                    var self = this,
                        editor = self.editor,
                        last = self.history.length > 0 ? self.history[self.history.length - 1] : null,
                        current = new Snapshot(self.editor);

                    if (!last || !last.equals(current)) {
                        if (self.history.length === LIMIT) {
                            self.history.shift();
                        }
                        self.history.push(current);
                        this.index = self.history.length - 1;
                        editor.fire("afterSave", {history:self.history,index:this.index});
                    }
                },

                /**
                 *
                 * @param ev
                 * ev.d ：1.向前撤销 ，-1.向后重做
                 */
                restore:function(ev) {
                    var d = ev.d,self = this,editor = self.editor,
                        snapshot = self.history.length > 0 ? self.history[this.index + d] : null;
                    if (snapshot) {
                        editor._setRawData(snapshot.contents);
                        if (snapshot.bookmarks)
                            self.editor.getSelection().selectBookmarks(snapshot.bookmarks);
                        else if (UA.ie) {
                            // IE BUG: If I don't set the selection to *somewhere* after setting
                            // document contents, then IE would create an empty paragraph at the bottom
                            // the next time the document is modified.
                            var $range = this.editor.document.body.createTextRange();
                            $range.collapse(true);
                            $range.select();
                        }
                        this.index += d;
                        editor.fire("afterRestore", {
                            history:self.history,
                            index:this.index
                        });
                        editor.notifySelectionChange();
                    }
                }
            });


            var TripleButton = KE.TripleButton,RedoMap = {
                "redo":1,
                "undo":-1
            };

            /**
             * 工具栏重做与撤销的ui功能
             * @param editor
             * @param text
             */
            function RestoreUI(editor, text, title, contentCls) {
                var self = this;
                this.editor = editor;
                self.title = title;
                this.text = text;
                this.contentCls = contentCls;
                this._init();
            }

            S.augment(RestoreUI, {
                _init:function() {
                    var self = this,editor = self.editor;
                    self.el = new TripleButton({
                        contentCls:self.contentCls,
                        //text:self.text,
                        title:self.title,
                        container:editor.toolBarDiv
                    });
                    this.el.set("state", TripleButton.DISABLED);
                    /**
                     * save,restore完，更新工具栏状态
                     */
                    editor.on("afterSave", this._respond, this);
                    editor.on("afterRestore", this._respond, this);

                    /**
                     * 触发重做或撤销动作，都是restore，方向不同
                     */
                    self.el.on("offClick", function() {
                        editor.fire("restore", {
                            d:RedoMap[self.text]
                        });
                    });
                },

                _respond:function(ev) {
                    var self = this,history = ev.history,
                        index = ev.index;
                    self.updateUI(history, index);
                },

                updateUI:function(history, index) {
                    if (this.text == "undo") {
                        if (index > 0 && history.length > 0) {
                            this.el.set("state", TripleButton.OFF);
                        } else {
                            this.el.set("state", TripleButton.DISABLED);
                        }
                    } else if (this.text == "redo") {
                        if (index < history.length - 1) {
                            this.el.set("state", TripleButton.OFF);
                        } else {
                            this.el.set("state", TripleButton.DISABLED);
                        }
                    }
                }
            });
            KE.UndoManager = UndoManager;
            KE.RestoreUI = RestoreUI;
        })();
    }

    editor.addPlugin(function() {

        /**
         * 编辑器历史中央管理
         */
        new KE.UndoManager(editor);

        /**
         * 撤销工具栏按钮
         */
        new KE.RestoreUI(editor, "undo", "撤销", "ke-toolbar-undo");
        /**
         * 重做工具栏按钮
         */
        new KE.RestoreUI(editor, "redo", "重做", "ke-toolbar-redo");
    });


});
