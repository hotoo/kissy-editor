/**
 * Constructor for kissy editor and event, editor instances holder
 * @author: yiminghe@gmail.com, lifesinger@gmail.com
 */
KISSY.add("editor", function(S, undefined) {

    function Editor(textarea, cfg) {
        var self = this;

        if (!(self instanceof Editor)) {
            return new Editor(textarea, cfg);
        }

        if (S.isString(textarea)) {
            textarea = S.one(textarea);
        }
        if (!textarea[0]) textarea = new Node(textarea);

        self.cfg = cfg;

        S.app(self, S.EventTarget);
        self.use = function(mods) {
            S.use.call(self, mods, function() {
                self.on("dataReady", function() {
                    self.setData(textarea.val());
                });
            }, { order:  true, global:  Editor });
        };

        self.init(textarea);
    }

    S.app(Editor, S.EventTarget);
    Editor.Config.base = S.Config.base + "editor/";
    function debugUrl(url) {
        if (!debug) return "build/" + url.replace(/\.(js|css)/i, "-min.$1");
        if (debug === "dev") {
            return url;
        }
        return "build/" + url;
    }

    var debug = S.Config.debug,mods = {
        "htmlparser": {
            attach: false,
            path: debugUrl("plugins/htmldataprocessor/htmlparser/htmlparser.js")
        }
    },
        core_mods = [
            "utils","focusmanager","definition",
            "dtd","dom", "elementpath",
            "walker","range","domiterator",
            "selection","styles"
        ],
        plugin_mods = [
            "clipboard",
            {
                name: "color",
                useCss: true
            },
            {
                name: "elementpaths",
                useCss: true
            },
            "enterkey",
            "fakeobjects",
            {
                name: "flash",
                requires: ["fakeobjects","overlay"]
            },
            "font",
            "format",
            {
                name: "htmldataprocessor",
                requires: ["htmlparser-text"]
            },
            {
                name: "image",
                requires: ["overlay"]
            },
            "indent",
            "justify",
            "link",
            "list",
            "maximize",
            "music",
            "preview",
            "removeformat",
            {
                name: "smiley",
                useCss: true
            },
            "sourcearea",
            {
                name: "table",
                useCss: true,
                requires: ["overlay",
                    "contextmenu"]
            },
            {
                name: "templates",
                requires: ["overlay"],
                useCss: true
            },
            "undo"
        ],
        htmlparser_mods = [
            {
                name: "htmlparser-basicwriter",
                requires: ["htmlparser"]
            },
            {
                name: "htmlparser-element",
                requires: ["htmlparser-fragment"]
            },
            {
                name: "htmlparser-filter",
                requires: ["htmlparser-element"]
            },
            {
                name: "htmlparser-fragment",
                requires: ["htmlparser-htmlwriter"]
            },
            {
                name: "htmlparser-htmlwriter",
                requires: ["htmlparser-basicwriter"]
            },
            {
                name: "htmlparser-text",
                requires: ["htmlparser-filter"]
            }
        ],
        ui_mods = [
            "button", "overlay",
            {
                name: "contextmenu",
                requires: ["overlay"]
            }
        ],
        i, len, mod, name, requires;

    // ui modules
    for (i = 0,len = ui_mods.length; i < len; i++) {
        mod = ui_mods[i];
        requires = undefined;

        if (!S.isString(mod)) {
            requires = mod.requires;
            mod = mod.name;
        }

        mods[mod] = {
            attach: false,
            requires: requires,
            path: debugUrl("ui/" + mod + ".js"),
            csspath: debugUrl("ui/" + mod + ".css")
        };
    }

    // plugins modules
    for (i = 0,len = plugin_mods.length; i < len; i++) {
        mod = plugin_mods[i];
        name = mod;
        requires = ["button"];

        if (!S.isString(mod)) {
            mod.requires && (requires = requires.concat(mod.requires));
            name = mod.name;
        }

        mods[name] = {
            attach: false,
            requires: requires,
            csspath: (mod.useCss ? debugUrl("plugins/" + name + "/plugin.css") : undefined),
            path: debugUrl("plugins/" + name + "/plugin.js")
        };
    }

    // htmlparser
    for (i = 0,len = htmlparser_mods.length; i < len; i++) {
        mod = htmlparser_mods[i];
        requires = undefined;

        if (!S.isString(mod)) {
            requires = mod.requires;
            mod = mod.name;
        }

        mods[mod] = {
            attach: false,
            requires: requires,
            path: debugUrl("plugins/htmldataprocessor/htmlparser/" + mod.substring(11) + ".js")
        };
    }

    Editor.add(mods);

    mods = { };
    for (i = 0,len = core_mods.length; i < len; i++) {
        mod = core_mods[i];
        mods[mod] = {
            host: "editor",
            requires: i > 0 ? core_mods[i - 1] : []
        };
    }
    Editor.add(mods);

    S.Editor = Editor;
});
/**
 * modified from ckeditor,common utils for kissy editor
 * @modifier: <yiminghe@gmail.com>
 */
KISSY.Editor.add("utils", function(KE) {

    var S = KISSY,Node = S.Node,DOM = S.DOM,debug=S.Config.debug;
    KE.Utils = {
        debugUrl:function (url) {
            if (!debug) return "build/" + url.replace(/\.(js|css)/i, "-min.$1");
            if (debug === "dev") {
                return url;
            }
            return "build/" + url;
        }
        ,
        /**
         * 懒惰一下
         * @param obj
         * @param before
         * @param after
         */
        lazyRun:function(obj, before, after) {
            var b = obj[before],a = obj[after];
            obj[before] = function() {
                b.apply(this, arguments);
                obj[before] = obj[after];
                return a.apply(this, arguments);
            };
        }
        ,


        getXY:function(x, y, srcDoc, destDoc) {
            var currentWindow = srcDoc.defaultView || srcDoc.parentWindow;

            //x,y相对于当前iframe文档,防止当前iframe有滚动条
            x -= DOM.scrollLeft(currentWindow);
            y -= DOM.scrollTop(currentWindow);
            if (destDoc) {
                var refWindow = destDoc.defaultView || destDoc.parentWindow;
                if (currentWindow != refWindow && currentWindow.frameElement) {
                    //note:when iframe is static ,still some mistake
                    var iframePosition = DOM._4e_getOffset(currentWindow.frameElement, destDoc);
                    x += iframePosition.left;
                    y += iframePosition.top;
                }
            }
            return {left:x,top:y};
        }
        ,

        tryThese : function() {

            var returnValue;
            for (var i = 0, length = arguments.length; i < length; i++) {
                var lambda = arguments[i];
                try {
                    returnValue = lambda();
                    break;
                }
                catch (e) {
                }
            }
            return returnValue;
        }
        ,
        arrayCompare: function(arrayA, arrayB) {
            if (!arrayA && !arrayB)
                return true;

            if (!arrayA || !arrayB || arrayA.length != arrayB.length)
                return false;

            for (var i = 0; i < arrayA.length; i++) {
                if (arrayA[ i ] !== arrayB[ i ])
                    return false;
            }

            return true;
        }
        ,
        getByAddress : function(doc, address, normalized) {
            var $ = doc.documentElement;

            for (var i = 0; $ && i < address.length; i++) {
                var target = address[ i ];

                if (!normalized) {
                    $ = $.childNodes[ target ];
                    continue;
                }

                var currentIndex = -1;

                for (var j = 0; j < $.childNodes.length; j++) {
                    var candidate = $.childNodes[ j ];

                    if (normalized === true &&
                        candidate.nodeType == 3 &&
                        candidate.previousSibling &&
                        candidate.previousSibling.nodeType == 3) {
                        continue;
                    }

                    currentIndex++;

                    if (currentIndex == target) {
                        $ = candidate;
                        break;
                    }
                }
            }

            return $ ? new Node($) : null;
        }
        ,

        clearAllMarkers:function(database) {
            for (var i in database)
                database[i]._4e_clearMarkers(database, true);
        }
        ,
        htmlEncodeAttr : function(text) {
            return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/, '&gt;');
        }
        ,
        ltrim:function(str) {
            return str.replace(/^\s+/, "");
        }
        ,

        rtrim:function(str) {
            return str.replace(/\s+$/, "");
        }
        ,
        trim:function(str) {
            return this.ltrim(this.rtrim(str));
        }
        ,
        mix:function() {
            var r = {};
            for (var i = 0; i < arguments.length; i++) {
                var ob = arguments[i];
                r = S.mix(r, ob);
            }
            return r;
        }
    };
})
    ;
/**
 * 多实例的焦点控制，主要是为了firefox焦点失去bug，记录当前状态
 * @author: <yiminghe@gmail.com>
 */
KISSY.Editor.add("focusmanager", function(KE) {
    var S = KISSY,
        DOM = S.DOM,
        Event = S.Event,
        focusManager = {};

    var INSTANCES = {};

    focusManager.add = function(editor) {
        INSTANCES[editor._UUID] = editor;
        var win = DOM._4e_getWin(editor.document);
        Event.on(win, "focus", focus, editor);
        Event.on(win, "blur", blur, editor);
    };
    focusManager.remove = function(editor) {
        delete INSTANCES[editor._UUID];
        var win = DOM._4e_getWin(editor.document);
        Event.remove(win, "focus", focus, editor);
        Event.remove(win, "blur", blur, editor);
    };
    function focus() {
        //console.log(" i got focus");
        var editor = this;
        editor.iframeFocus = true;
        /*for (var i in INSTANCES) {
         if (i != editor._UUID)
         INSTANCES[i].blur();
         }*/
    }

    function blur() {
        //console.log(" i lost focus");
        var editor = this;
        editor.iframeFocus = false;
    }

    KE.focusManager = focusManager;
});
/**
 * definition of editor class for kissy editor
 * @author: <yiminghe@gmail.com>
 */
KISSY.Editor.add("definition", function(KE) {
    var S = KISSY,
        UA = S.UA,
        DOM = S.DOM,
        Node = S.Node,
        Event = S.Event,
        DISPLAY = "display",
        WIDTH = "width",
        HEIGHT = "height",
        NONE = "none",
        VISIBILITY = "visibility",
        HIDDEN = "hidden",
        focusManager = KE.focusManager,
        tryThese = KE.Utils.tryThese,
        HTML5_DTD = '<!doctype html>',
        ke_textarea_wrap = ".ke-textarea-wrap",
        ke_editor_tools = ".ke-editor-tools",
        ke_editor_status = ".ke-editor-status",
        CSS_FILE = KE.Utils.debugUrl("assets/editor-iframe.css");

    function prepareIFrameHtml() {
        return HTML5_DTD
            + "<html>"
            + "<head>"
            + "<title>kissy-editor</title>"
            + "<link href='"
            + KE.Config.base + CSS_FILE
            + "' rel='stylesheet'/>"
            + "</head>"
            + "<body class='ke-editor'>"
            //firefox 必须里面有东西，否则编辑前不能删除!
            + "&nbsp;"
            //使用 setData 加强安全性
            // + (textarea.value || "")
            + "</body>"
            + "<html>";
    }

    var INSTANCE_ID = 1,
        srcScript = 'document.open();' +
            'document.close();',
        editorHtml = "<div " +
            " class='ke-editor-wrap' " +
            //!!编辑器内焦点不失去,firefox?
            " onmousedown=' " +
            "return false;' " +
            " > " +
            "<div class='" + ke_editor_tools.substring(1) + "'></div>" +
            "<div class='" + ke_textarea_wrap.substring(1) + "'><iframe " +
            ' style="' + WIDTH + ':100%;' + HEIGHT + ':100%;border:none;" ' +
            ' ' + WIDTH + '="100%" ' +
            ' ' + HEIGHT + '="100%" ' +
            ' frameborder="0" ' +
            ' title="' + "kissy-editor" + '" ' +
            // With IE, the custom domain has to be taken care at first,
            // for other browsers, the 'src' attribute should be left empty to
            // trigger iframe's 'load' event.
            ' src="' + ( UA.ie ? 'javascript:void(function(){' + encodeURIComponent(srcScript) + '}())' : '' ) + '" ' +
            ' tabIndex="' + ( UA.webkit ? -1 : "$(tabIndex)" ) + '" ' +
            ' allowTransparency="true" ' +
            '></iframe></div>' +
            "<div class='" + ke_editor_status.substring(1) + "'></div>" +
            "</div>";


    S.augment(KE, {
        init:function(textarea) {
            var self = this,
                editorWrap = new Node(editorHtml.replace(/\$\(tabIndex\)/, textarea.attr("tabIndex")));
            self.editorWrap = editorWrap;
            self._UUID = INSTANCE_ID++;
            self.wrap = editorWrap.one(ke_textarea_wrap);
            self.iframe = self.wrap.one("iframe");
            self.toolBarDiv = editorWrap.one(ke_editor_tools);
            self.textarea = textarea;
            self.statusDiv = editorWrap.one(ke_editor_status);
            //ie 点击按钮不丢失焦点
            self.toolBarDiv._4e_unselectable();
            //可以直接调用插件功能
            self._commands = {};
            self._plugins = {};
            var tw = textarea._4e_style(WIDTH),th = textarea._4e_style(HEIGHT);
            if (tw) {
                editorWrap.css(WIDTH, tw);
                textarea.css(WIDTH, "100%");
            }
            self.textarea.css(DISPLAY, NONE);
            editorWrap.insertAfter(textarea);
            self.wrap[0].appendChild(textarea[0]);

            if (th) {
                self.wrap.css(HEIGHT, th);
                textarea.css(HEIGHT, "100%");
            }

            var iframe = self.iframe;

            self.on("dataReady", function() {
                self.ready = true;
                KE.fire("instanceCreated", {editor:self});
            });
            // With FF, it's better to load the data on iframe.load. (#3894,#4058)
            if (UA.gecko) {
                iframe.on('load', self._initIFrame, self);
            } else {
                //webkit(chrome) load等不来！
                self._initIFrame();
            }
        },
        addCommand:function(name, obj) {
            this._commands[name] = obj;
        },
        execCommand:function(name) {
            this.fire("save");
            this._commands[name].exec(this);
            this.fire("save");
        },
        getData:function() {
            if (KE.HtmlDataProcessor)
                return KE.HtmlDataProcessor.toHtml(this.document.body.innerHTML, "p");
            return this.document.body.innerHTML;
        } ,
        setData:function(data) {
            if (KE.HtmlDataProcessor)
                data = KE.HtmlDataProcessor.toDataFormat(data, "p");
            this.document.body.innerHTML = data;
        },
        sync:function() {
            this.textarea.val(this.getData());
        },
        //撤销重做时，不需要格式化代码，直接取自身
        _getRawData:function() {
            return this.document.body.innerHTML;
        },
        //撤销重做时，不需要格式化代码，直接取自身
        _setRawData:function(data) {
            this.document.body.innerHTML = data;
        },
        _hideSource:function() {
            var self = this;
            self.iframe.css(DISPLAY, "");
            self.textarea.css(DISPLAY, NONE);
            self.toolBarDiv.children().css(VISIBILITY, "");
            self.statusDiv.children().css(VISIBILITY, "");
        },

        _showSource:    function() {
            var self = this;
            self.textarea.css(DISPLAY, "");
            self.iframe.css(DISPLAY, NONE);
            self.toolBarDiv.children().css(VISIBILITY, HIDDEN);
            self.toolBarDiv.all(".ke-tool-editor-source").css(VISIBILITY, "");
            self.statusDiv.children().css(VISIBILITY, HIDDEN);
            //ie textarea height:100%不起作用
            if (UA.ie < 8) {
                self.textarea.css(HEIGHT, self.wrap.css(HEIGHT));
            }
        },
        _prepareIFrameHtml:prepareIFrameHtml,

        getSelection:function() {
            var sel = new KE.Selection(this.document);
            return ( !sel || sel.isInvalid ) ? null : sel;
        } ,
        focus:function() {
            var self = this,
                win = DOM._4e_getWin(self.document);
            UA.webkit && win && win.parent && win.parent.focus();
            //win && win.blur();
            //yiminghe note:firefox need this ,暂时使得iframe先失去焦点，触发 blinkCursor 补丁
            //if (UA.gecko)self.blur();
            //yiminghe note:webkit need win.focus

            win && win.focus();
            //ie and firefox need body focus
            self.document && self.document.body.focus();
            self.notifySelectionChange();
        } ,
        blur:function() {
            /*
             工具栏有焦点，iframe也有焦点？？
             this.toolBarDiv.children().each(function(el) {
             el[0].focus();
             });
             */
            var self = this,
                win = DOM._4e_getWin(self.document);
            win.blur();
            self.document && self.document.body.blur();
            //self.notifySelectionChange();

            //firefox 焦点相关，强制 mousedown 刷新光标
            //this.iframeFocus = false;
        },
        /**
         * 初始化iframe内容以及浏览器间兼容性处理
         */
        _initIFrame:function() {
            var self = this,
                iframe = self.iframe,
                KES = KE.SELECTION,
                textarea = self.textarea[0],
                data = prepareIFrameHtml(),
                win = iframe[0].contentWindow,
                doc = win.document;
            self.document = doc;
            iframe.detach();
            // Don't leave any history log in IE. (#5657)
            doc.open("text/html", "replace");
            doc.write(data);
            doc.close();
            var body = doc.body;

            if (UA.ie) {
                // Don't display the focus border.
                body.hideFocus = true;

                // Disable and re-enable the body to avoid IE from
                // taking the editing focus at startup. (#141 / #523)
                body.disabled = true;
                body.contentEditable = true;
                body.removeAttribute('disabled');
            } else {
                // Avoid opening design mode in a frame window thread,
                // which will cause host page scrolling.(#4397)
                setTimeout(function() {
                    // Prefer 'contentEditable' instead of 'designMode'. (#3593)
                    if (UA.gecko || UA.opera) {
                        body.contentEditable = true;
                    }
                    else if (UA.webkit)
                        body.parentNode.contentEditable = true;
                    else
                        doc.designMode = 'on';
                }, 0);
            }

            // Gecko need a key event to 'wake up' the editing
            // ability when document is empty.(#3864)
            //activateEditing 删掉，初始引起屏幕滚动了

            // IE, Opera and Safari may not support it and throw
            // errors.
            try {
                doc.execCommand('enableObjectResizing', false, true);
            } catch(e) {
            }
            try {
                doc.execCommand('enableInlineTableEditing', false, true);
            } catch(e) {
            }

            // Gecko/Webkit need some help when selecting control type elements. (#3448)
            //if (!( UA.ie || UA.opera)) {
            if (UA.webkit) {
                Event.on(doc, "mousedown", function(ev) {
                    var control = new Node(ev.target);
                    if (S.inArray(control._4e_name(), ['img', 'hr', 'input', 'textarea', 'select'])) {
                        self.getSelection().selectElement(control);
                    }
                });
            }

            // Webkit: avoid from editing form control elements content.
            if (UA.webkit) {
                Event.on(doc, "click", function(ev) {
                    var control = new Node(ev.target);
                    if (S.inArray(control._4e_name(), ['input', 'select'])) {
                        ev.preventDefault();
                    }
                });
                // Prevent from editig textfield/textarea value.
                Event.on(doc, "mouseup", function(ev) {
                    var control = new Node(ev.target);
                    if (S.inArray(control._4e_name(), ['input', 'textarea'])) {
                        ev.preventDefault();
                    }
                });
            }

            function blinkCursor(retry) {
                tryThese(
                    function() {
                        doc.designMode = 'on';
                        setTimeout(function () {
                            doc.designMode = 'off';
                            //console.log("path1");
                            body.focus();
                            // Try it again once..
                            if (!arguments.callee.retry) {
                                arguments.callee.retry = true;
                                //arguments.callee();
                            }
                        }, 50);
                    },
                    function() {
                        // The above call is known to fail when parent DOM
                        // tree layout changes may break design mode. (#5782)
                        // Refresh the 'contentEditable' is a cue to this.
                        doc.designMode = 'off';

                        DOM.attr(body, 'contentEditable', false);
                        DOM.attr(body, 'contentEditable', true);
                        // Try it again once..
                        !retry && blinkCursor(1);
                        //console.log("path2");
                    });
            }

            // Create an invisible element to grab focus.
            if (UA.gecko || UA.ie || UA.opera) {
                var focusGrabber;
                focusGrabber = new Node(DOM.insertAfter(new Node(
                    // Use 'span' instead of anything else to fly under the screen-reader radar. (#5049)
                    '<span ' +
                        //'tabindex="-1" ' +
                        'style="position:absolute; left:-10000"' +
                        //' role="presentation"' +
                        '></span>')[0], textarea));
                focusGrabber.on('focus', function() {
                    self.focus();
                });
                self.on('destroy', function() {
                });
            }

            // IE standard compliant in editing frame doesn't focus the editor when
            // clicking outside actual content, manually apply the focus. (#1659)
            if (UA.ie
                && doc.compatMode == 'CSS1Compat'
                || UA.gecko
                || UA.opera) {
                var htmlElement = new Node(doc.documentElement);
                htmlElement.on('mousedown', function(evt) {
                    // Setting focus directly on editor doesn't work, we
                    // have to use here a temporary element to 'redirect'
                    // the focus.

                    if (evt.target === htmlElement[0]) {
                        if (UA.gecko)
                            blinkCursor(false);
                        focusGrabber[0].focus();
                    }
                });
            }


            Event.on(win, 'focus', function() {
                //console.log(" i am  focus inner");
                /**
                 * yiminghe特别注意：firefox光标丢失bug
                 * blink后光标出现在最后，这就需要实现保存range
                 * focus后再恢复range
                 */
                if (UA.gecko)
                    blinkCursor(false);
                else if (UA.opera)
                    body.focus();

                // focus 后强制刷新自己状态
                self.notifySelectionChange();
            });


            if (UA.gecko) {
                /**
                 * firefox 焦点丢失后，再点编辑器区域焦点会移不过来，要点两下
                 */
                Event.on(self.document, "mousedown", function() {
                    if (!self.iframeFocus) {
                        //console.log("i am fixed");
                        blinkCursor(false);
                    }
                });
            }

            if (UA.ie) {
                //new Node(doc.documentElement).addClass(doc.compatMode);
                // Override keystrokes which should have deletion behavior
                //  on control types in IE . (#4047)
                Event.on(doc, 'keydown', function(evt) {
                    var keyCode = evt.keyCode;
                    // Backspace OR Delete.
                    if (keyCode in { 8 : 1, 46 : 1 }) {
                        var sel = self.getSelection(),
                            control = sel.getSelectedElement();
                        if (control) {
                            // Make undo snapshot.
                            self.fire('save');
                            // Delete any element that 'hasLayout' (e.g. hr,table) in IE8 will
                            // break up the selection, safely manage it here. (#4795)
                            var bookmark = sel.getRanges()[ 0 ].createBookmark();
                            // Remove the control manually.
                            control.remove();
                            sel.selectBookmarks([ bookmark ]);
                            self.fire('save');
                            evt.preventDefault();
                        }
                    }
                });

                // PageUp/PageDown scrolling is broken in document
                // with standard doctype, manually fix it. (#4736)
                if (doc.compatMode == 'CSS1Compat') {
                    var pageUpDownKeys = { 33 : 1, 34 : 1 };
                    Event.on(doc, 'keydown', function(evt) {
                        if (evt.keyCode in pageUpDownKeys) {
                            setTimeout(function () {
                                self.getSelection().scrollIntoView();
                            }, 0);
                        }
                    });
                }
            }

            // Adds the document body as a context menu target.

            setTimeout(function() {
                /*
                 * IE BUG: IE might have rendered the iframe with invisible contents.
                 * (#3623). Push some inconsequential CSS style changes to force IE to
                 * refresh it.
                 *
                 * Also, for some unknown reasons, short timeouts (e.g. 100ms) do not
                 * fix the problem. :(
                 */
                if (UA.ie) {
                    setTimeout(function() {
                        if (doc) {
                            body.runtimeStyle.marginBottom = '0px';
                            body.runtimeStyle.marginBottom = '';
                        }
                    }, 1000);
                }
            }, 0);

            setTimeout(function() {
                self.fire("dataReady");
            }, 10);
            //注意：必须放在这个位置，等iframe加载好再开始运行
            //加入焦点管理，和其他实例联系起来
            focusManager.add(self);
        },
        addPlugin:function(func) {
            var self = this;
            if (self.ready)func();
            else {
                self.on("dataReady", func);
            }
        },

        _monitor:function() {
            var self = this;
            if (self._monitorId) {
                clearTimeout(self._monitorId);
            }
            self._monitorId = setTimeout(function() {
                var selection = self.getSelection();
                if (selection && !selection.isInvalid) {
                    var startElement = selection.getStartElement(),
                        currentPath = new KE.ElementPath(startElement);
                    if (!self.previousPath || !self.previousPath.compare(currentPath)) {
                        self.previousPath = currentPath;
                        self.fire("selectionChange", { selection : self, path : currentPath, element : startElement });
                    }
                }
            }, 200);
        }
        ,
        /**
         * 强制通知插件更新状态，防止插件修改编辑器内容，自己反而得不到通知
         */
        notifySelectionChange:function() {
            this.previousPath = null;
            this._monitor();
        },

        insertElement:function(element) {
            var self = this;
            self.focus();

            var elementName = element._4e_name(),
                xhtml_dtd = KE.XHTML_DTD,
                KER = KE.RANGE,
                KEN = KE.NODE,
                isBlock = xhtml_dtd.$block[ elementName ],
                selection = self.getSelection(),
                ranges = selection.getRanges(),
                range,
                clone,
                lastElement,
                current, dtd;

            self.fire("save");
            for (var i = ranges.length - 1; i >= 0; i--) {
                range = ranges[ i ];
                // Remove the original contents.
                range.deleteContents();
                clone = !i && element || element._4e_clone(true);
                // If we're inserting a block at dtd-violated position, split
                // the parent blocks until we reach blockLimit.
                if (isBlock) {
                    while (( current = range.getCommonAncestor(false, true) )
                        && ( dtd = xhtml_dtd[ current._4e_name() ] )
                        && !( dtd && dtd [ elementName ] )) {
                        // Split up inline elements.
                        if (current._4e_name() in xhtml_dtd.span)
                            range.splitElement(current);
                        // If we're in an empty block which indicate a new paragraph,
                        // simply replace it with the inserting block.(#3664)
                        else if (range.checkStartOfBlock()
                            && range.checkEndOfBlock()) {
                            range.setStartBefore(current);
                            range.collapse(true);
                            current.remove();
                        }
                        else
                            range.splitBlock();
                    }
                }

                // Insert the new node.
                range.insertNode(clone);
                // Save the last element reference so we can make the
                // selection later.
                if (!lastElement)
                    lastElement = clone;
            }

            range.moveToPosition(lastElement, KER.POSITION_AFTER_END);
            var next = lastElement._4e_nextSourceNode(true);
            if (next && next.type == KEN.NODE_ELEMENT)
                range.moveToElementEditablePosition(next);
            selection.selectRanges([ range ]);
            self.focus();
            //http://code.google.com/p/kissy/issues/detail?can=1&start=100&id=121
            clone && clone._4e_scrollIntoView();
            setTimeout(function() {
                self.fire("save");
            }, 10);
        },

        insertHtml:function(data) {
            if (KE.HtmlDataProcessor)
                data = KE.HtmlDataProcessor.toDataFormat(data);//, "p");
            /**
             * webkit insert html 有问题！会把标签去掉，算了直接用insertElement
             */
            if (UA.webkit) {
                var nodes = DOM.create(data, null, this.document);
                if (nodes.nodeType == 11) nodes = S.makeArray(nodes.childNodes);
                else nodes = [nodes];
                for (var i = 0; i < nodes.length; i++)
                    this.insertElement(new Node(nodes[i]));
                return;
            }
            var self = this;
            self.focus();
            self.fire("save");
            var selection = self.getSelection();
            if (UA.ie) {
                var $sel = selection.getNative();
                if ($sel.type == 'Control')
                    $sel.clear();
                $sel.createRange().pasteHTML(data);
            } else {
                self.document.execCommand('inserthtml', false, data);
            }

            self.focus();
            setTimeout(function() {
                self.fire("save");
            }, 10);
        }
    });
});
/**
 * modified from ckeditor ,xhtml1.1 transitional dtd translation
 * @modifier: <yiminghe@gmail.com(chengyu)>
 */
KISSY.Editor.add("dtd", function(KE) {
    /**
     * Holds and object representation of the HTML DTD to be used by the editor in
     * its internal operations.
     *
     * Each element in the DTD is represented by a
     * property in this object. Each property contains the list of elements that
     * can be contained by the element. Text is represented by the "#" property.
     *
     * Several special grouping properties are also available. Their names start
     * with the "$" character.
     * @namespace
     * @example
     * // Check if "div" can be contained in a "p" element.
     * alert( !!CKEDITOR.dtd[ 'p' ][ 'div' ] );  "false"
     * @example
     * // Check if "p" can be contained in a "div" element.
     * alert( !!CKEDITOR.dtd[ 'div' ][ 'p' ] );  "true"
     * @example
     * // Check if "p" is a block element.
     * alert( !!CKEDITOR.dtd.$block[ 'p' ] );  "true"
     */
    KE.XHTML_DTD = (function() {
        var X = function(r) {
            var i = arguments.length - 1;
            while (i > 0) {
                KISSY.mix(r, arguments[i--]);
            }
            return r;
        },

            A = {isindex:1,fieldset:1},
            B = {input:1,button:1,select:1,textarea:1,label:1},
            C = X({a:1}, B),
            D = X({iframe:1}, C),
            E = {hr:1,ul:1,menu:1,div:1,blockquote:1,noscript:1,table:1,center:1,address:1,dir:1,pre:1,h5:1,dl:1,h4:1,noframes:1,h6:1,ol:1,h1:1,h3:1,h2:1},
            F = {ins:1,del:1,script:1,style:1},
            G = X({b:1,acronym:1,bdo:1,'var':1,'#':1,abbr:1,code:1,br:1,i:1,cite:1,kbd:1,u:1,strike:1,s:1,tt:1,strong:1,q:1,samp:1,em:1,dfn:1,span:1}, F),
            H = X({sub:1,img:1,object:1,sup:1,basefont:1,map:1,applet:1,font:1,big:1,small:1}, G),
            I = X({p:1}, H),
            J = X({iframe:1}, H, B),
            K = {img:1,noscript:1,br:1,kbd:1,center:1,button:1,basefont:1,h5:1,h4:1,samp:1,h6:1,ol:1,h1:1,h3:1,h2:1,form:1,font:1,'#':1,select:1,menu:1,ins:1,abbr:1,label:1,code:1,table:1,script:1,cite:1,input:1,iframe:1,strong:1,textarea:1,noframes:1,big:1,small:1,span:1,hr:1,sub:1,bdo:1,'var':1,div:1,object:1,sup:1,strike:1,dir:1,map:1,dl:1,applet:1,del:1,isindex:1,fieldset:1,ul:1,b:1,acronym:1,a:1,blockquote:1,i:1,u:1,s:1,tt:1,address:1,q:1,pre:1,p:1,em:1,dfn:1},

            L = X({a:1}, J),
            M = {tr:1},
            N = {'#':1},
            O = X({param:1}, K),
            P = X({form:1}, A, D, E, I),
            Q = {li:1},
            R = {style:1,script:1},
            S = {base:1,link:1,meta:1,title:1},
            T = X(S, R),
            U = {head:1,body:1},
            V = {html:1};

        var block = {address:1,blockquote:1,center:1,dir:1,div:1,dl:1,fieldset:1,form:1,h1:1,h2:1,h3:1,h4:1,h5:1,h6:1,hr:1,isindex:1,menu:1,noframes:1,ol:1,p:1,pre:1,table:1,ul:1};

        return  {

            // The "$" items have been added manually.

            // List of elements living outside body.
            $nonBodyContent: X(V, U, S),

            /**
             * List of block elements, like "p" or "div".
             * @type Object
             * @example
             */
            $block : block,

            /**
             * List of block limit elements.
             * @type Object
             * @example
             */
            $blockLimit : { body:1,div:1,td:1,th:1,caption:1,form:1 },

            $inline : L,    // Just like span.

            $body : X({script:1,style:1}, block),

            $cdata : {script:1,style:1},

            /**
             * List of empty (self-closing) elements, like "br" or "img".
             * @type Object
             * @example
             */
            $empty : {area:1,base:1,br:1,col:1,hr:1,img:1,input:1,link:1,meta:1,param:1},

            /**
             * List of list item elements, like "li" or "dd".
             * @type Object
             * @example
             */
            $listItem : {dd:1,dt:1,li:1},

            /**
             * List of list root elements.
             * @type Object
             * @example
             */
            $list: { ul:1,ol:1,dl:1},

            /**
             * Elements that accept text nodes, but are not possible to edit into
             * the browser.
             * @type Object
             * @example
             */
            $nonEditable : {applet:1,button:1,embed:1,iframe:1,map:1,object:1,option:1,script:1,textarea:1,param:1},

            /**
             * List of elements that can be ignored if empty, like "b" or "span".
             * @type Object
             * @example
             */
            $removeEmpty : {abbr:1,acronym:1,address:1,b:1,bdo:1,big:1,cite:1,code:1,del:1,dfn:1,em:1,font:1,i:1,ins:1,label:1,kbd:1,q:1,s:1,samp:1,small:1,span:1,strike:1,strong:1,sub:1,sup:1,tt:1,u:1,'var':1},

            /**
             * List of elements that have tabindex set to zero by default.
             * @type Object
             * @example
             */
            $tabIndex : {a:1,area:1,button:1,input:1,object:1,select:1,textarea:1},

            /**
             * List of elements used inside the "table" element, like "tbody" or "td".
             * @type Object
             * @example
             */
            $tableContent : {caption:1,col:1,colgroup:1,tbody:1,td:1,tfoot:1,th:1,thead:1,tr:1},

            html: U,
            head: T,
            style: N,
            //script: N,
            body: P,
            base: {},
            link: {},
            meta: {},
            title: N,
            col : {},
            tr : {td:1,th:1},
            img : {},
            colgroup : {col:1},
            noscript : P,
            td : P,
            br : {},
            th : P,
            center : P,
            kbd : L,
            button : X(I, E),
            basefont : {},
            h5 : L,
            h4 : L,
            samp : L,
            h6 : L,
            ol : Q,
            h1 : L,
            h3 : L,
            option : N,
            h2 : L,
            form : X(A, D, E, I),
            select : {optgroup:1,option:1},
            font : L,
            ins : L,
            menu : Q,
            abbr : L,
            label : L,
            table : {thead:1,col:1,tbody:1,tr:1,colgroup:1,caption:1,tfoot:1},
            code : L,
            script : N,
            tfoot : M,
            cite : L,
            li : P,
            input : {},
            iframe : P,
            strong : L,
            textarea : N,
            noframes : P,
            big : L,
            small : L,
            span : L,
            hr : {},
            dt : L,
            sub : L,
            optgroup : {option:1},
            param : {},
            bdo : L,
            'var' : L,
            div : P,
            object : O,
            sup : L,
            dd : P,
            strike : L,
            area : {},
            dir : Q,
            map : X({area:1,form:1,p:1}, A, F, E),
            applet : O,
            dl : {dt:1,dd:1},
            del : L,
            isindex : {},
            fieldset : X({legend:1}, K),
            thead : M,
            ul : Q,
            acronym : L,
            b : L,
            a : J,
            blockquote : P,
            caption : L,
            i : L,
            u : L,
            tbody : M,
            s : L,
            address : X(D, I),
            tt : L,
            legend : L,
            q : L,
            pre : X(G, C),
            p : L,
            em : L,
            dfn : L
        };
    })();

});
/**
 * modified from ckeditor,dom utils for kissy editor
 * @modifier: <yiminghe@gmail.com(chengyu)>
 */
KISSY.Editor.add("dom", function(KE) {

    var S = KISSY,
        DOM = S.DOM,
        UA = S.UA,
        doc = document,
        Node = S.Node,
        Utils = KE.Utils,
        GET_BOUNDING_CLIENT_RECT = 'getBoundingClientRect',
        REMOVE_EMPTY = {abbr:1,acronym:1,address:1,b:1,bdo:1,big:1,cite:1,code:1,del:1,dfn:1,em:1,font:1,i:1,ins:1,label:1,kbd:1,q:1,s:1,samp:1,small:1,span:1,strike:1,strong:1,sub:1,sup:1,tt:1,u:1,'var':1};
    KE.NODE = {
        NODE_ELEMENT:1,
        NODE_TEXT:3,
        NODE_DOCUMENT_FRAGMENT:11
    };
    KE.POSITION = {};
    var KEN = KE.NODE,KEP = KE.POSITION;

    KEP.POSITION_IDENTICAL = 0;
    KEP.POSITION_DISCONNECTED = 1;
    KEP.POSITION_FOLLOWING = 2;
    KEP.POSITION_PRECEDING = 4;
    KEP.POSITION_IS_CONTAINED = 8;
    KEP.POSITION_CONTAINS = 16;

    /*
     * Anything whose display computed style is block, list-item, table,
     * table-row-group, table-header-group, table-footer-group, table-row,
     * table-column-group, table-column, table-cell, table-caption, or whose node
     * name is hr, br (when enterMode is br only) is a block boundary.
     */
    var customData = {},blockBoundaryDisplayMatch = {
        block : 1,
        'list-item' : 1,
        table : 1,
        'table-row-group' : 1,
        'table-header-group' : 1,
        'table-footer-group' : 1,
        'table-row' : 1,
        'table-column-group' : 1,
        'table-column' : 1,
        'table-cell' : 1,
        'table-caption' : 1
    },
        blockBoundaryNodeNameMatch = { hr : 1 },
        normalElDom = function(el) {
            return   el[0] || el;
        },
        normalEl = function(el) {
            if (!el[0]) return new Node(el);
            return el;
        },
        editorDom = {
            _4e_equals:function(e1, e2) {
                //全部为空
                if (!e1 && !e2)return true;
                //一个为空，一个不为空
                if (!e1 || !e2)return false;
                e1 = normalElDom(e1);
                e2 = normalElDom(e2);
                return e1 === e2;
            },

            _4e_isBlockBoundary:function(el, customNodeNames) {
                el = normalEl(el);
                var nodeNameMatches = S.mix(S.mix({}, blockBoundaryNodeNameMatch), customNodeNames || {});

                return blockBoundaryDisplayMatch[ el.css('display') ] ||
                    nodeNameMatches[ el._4e_name() ];
            },
            _4e_getWin:function(elem) {
                return (elem && ('scrollTo' in elem) && elem["document"]) ?
                    elem :
                    elem && elem.nodeType === 9 ?
                        elem.defaultView || elem.parentWindow :
                        false;
            },
            _4e_index:function(el) {
                el = normalElDom(el);
                var siblings = el.parentNode.childNodes;
                for (var i = 0; i < siblings.length; i++) {
                    if (siblings[i] === el) return i;
                }
                return -1;
            },
            _4e_first:function(el, evaluator) {
                el = normalElDom(el);
                var first = el.firstChild,
                    retval = first && new Node(first);
                if (retval && evaluator && !evaluator(retval))
                    retval = retval._4e_next(evaluator);

                return retval;
            },

            _4e_move : function(thisElement, target, toStart) {
                thisElement.remove();
                thisElement = normalElDom(thisElement);
                target = normalElDom(target);
                if (toStart) {
                    target.insertBefore(thisElement, target.firstChild);
                }
                else {
                    target.appendChild(thisElement);
                }
            },

            _4e_name:function(thisElement) {
                thisElement = normalElDom(thisElement);
                return thisElement.nodeName.toLowerCase();
            },
            _4e_isIdentical : function(thisElement, otherElement) {
                if (thisElement._4e_name() != otherElement._4e_name())
                    return false;

                var thisAttribs = thisElement[0].attributes,
                    otherAttribs = otherElement[0].attributes,thisLength = thisAttribs.length,
                    otherLength = otherAttribs.length;

                if (!UA.ie && thisLength != otherLength)
                    return false;

                for (var i = 0; i < thisLength; i++) {
                    var attribute = thisAttribs[ i ];

                    if (( !UA.ie || ( attribute.specified && attribute.nodeName != '_ke_expando' ) ) && attribute.nodeValue != otherElement.attr(attribute.nodeName))
                        return false;
                }

                // For IE, we have to for both elements, because it's difficult to
                // know how the atttibutes collection is organized in its DOM.
                if (UA.ie) {
                    for (i = 0; i < otherLength; i++) {
                        attribute = otherAttribs[ i ];
                        if (attribute.specified && attribute.nodeName != '_ke_expando'
                            && attribute.nodeValue != thisElement.attr(attribute.nodeName))
                            return false;
                    }
                }

                return true;
            },
            _4e_isEmptyInlineRemoveable : function(thisElement) {
                var children = normalElDom(thisElement).childNodes;
                for (var i = 0, count = children.length; i < count; i++) {
                    var child = children[i],
                        nodeType = child.nodeType;

                    if (nodeType == KEN.NODE_ELEMENT && child.getAttribute('_ke_bookmark'))
                        continue;

                    if (nodeType == KEN.NODE_ELEMENT && !editorDom._4e_isEmptyInlineRemoveable(child)
                        || nodeType == KEN.NODE_TEXT && S.trim(child.nodeValue)) {
                        return false;
                    }
                }
                return true;
            },
            _4e_moveChildren : function(thisElement, target, toStart) {
                var $ = normalElDom(thisElement);
                target = target[0] || target;
                if ($ == target)
                    return;

                var child;

                if (toStart) {
                    while (( child = $.lastChild ))
                        target.insertBefore($.removeChild(child), target.firstChild);
                }
                else {
                    while (( child = $.firstChild ))
                        target.appendChild($.removeChild(child));
                }
            },
            _4e_mergeSiblings : ( function() {
                function mergeElements(element, sibling, isNext) {
                    if (sibling[0] && sibling[0].nodeType == KEN.NODE_ELEMENT) {
                        // Jumping over bookmark nodes and empty inline elements, e.g. <b><i></i></b>,
                        // queuing them to be moved later. (#5567)
                        var pendingNodes = [];

                        while (sibling.attr('_ke_bookmark')
                            || sibling._4e_isEmptyInlineRemoveable()) {
                            pendingNodes.push(sibling);
                            sibling = isNext ? new Node(sibling[0].nextSibling) : new Node(sibling[0].previousSibling);
                            if (!sibling[0] || sibling[0].nodeType != KEN.NODE_ELEMENT)
                                return;
                        }

                        if (element._4e_isIdentical(sibling)) {
                            // Save the last child to be checked too, to merge things like
                            // <b><i></i></b><b><i></i></b> => <b><i></i></b>
                            var innerSibling = isNext ? element[0].lastChild : element[0].firstChild;

                            // Move pending nodes first into the target element.
                            while (pendingNodes.length)
                                pendingNodes.shift()._4e_move(element, !isNext);

                            sibling._4e_moveChildren(element, !isNext);
                            sibling.remove();

                            // Now check the last inner child (see two comments above).
                            if (innerSibling[0] && innerSibling[0].nodeType == KEN.NODE_ELEMENT)
                                innerSibling._4e_mergeSiblings();
                        }
                    }
                }

                return function(thisElement) {
                    if (!thisElement[0]) return;
                    //note by yiminghe,why not just merge whatever
                    // Merge empty links and anchors also. (#5567)
                    if (!( REMOVE_EMPTY[ thisElement._4e_name() ] || thisElement._4e_name() == "a" ))
                        return;

                    mergeElements(thisElement, new Node(thisElement[0].nextSibling), true);
                    mergeElements(thisElement, new Node(thisElement[0].previousSibling));
                };
            } )(),
            _4e_unselectable :
                UA.gecko ?
                    function(el) {
                        el = normalElDom(el);
                        el.style.MozUserSelect = 'none';
                    }
                    : UA.webkit ?
                    function(el) {
                        el = normalElDom(el);
                        el.style.KhtmlUserSelect = 'none';
                    }
                    :
                    function(el) {
                        el = normalElDom(el);
                        if (UA.ie || UA.opera) {
                            var
                                e,
                                i = 0;

                            el.unselectable = 'on';

                            while (( e = el.all[ i++ ] )) {
                                switch (e.tagName.toLowerCase()) {
                                    case 'iframe' :
                                    case 'textarea' :
                                    case 'input' :
                                    case 'select' :
                                        /* Ignore the above tags */
                                        break;
                                    default :
                                        e.unselectable = 'on';
                                }
                            }
                        }
                    },

            _4e_getOffset:function(elem, refDocument) {
                elem = normalElDom(elem);
                var box,
                    x = 0,
                    y = 0,
                    currentWindow = elem.ownerDocument.defaultView || elem.ownerDocument.parentWindow,
                    currentDoc = elem.ownerDocument,
                    currentDocElem = currentDoc.documentElement;
                //same with DOM.offset
                if (elem[GET_BOUNDING_CLIENT_RECT]) {
                    if (elem !== currentDoc.body && currentDocElem !== elem) {
                        box = elem[GET_BOUNDING_CLIENT_RECT]();
                        x = box.left + DOM["scrollLeft"](currentWindow);
                        y = box.top + DOM["scrollTop"](currentWindow);
                    }
                    if (refDocument) {
                        var refWindow = refDocument.defaultView || refDocument.parentWindow;
                        if (currentWindow != refWindow && currentWindow['frameElement']) {
                            //note:when iframe is static ,still some mistake
                            var iframePosition = editorDom._4e_getOffset(currentWindow.frameElement, refDocument);
                            x += iframePosition.left;
                            y += iframePosition.top;
                        }
                    }
                }
                return { left: x, top: y };
            },

            _4e_getFrameDocument : function(el) {
                var $ = normalElDom(el),t;

                try {
                    // In IE, with custom document.domain, it may happen that
                    // the iframe is not yet available, resulting in "Access
                    // Denied" for the following property access.
                    t = $.contentWindow.document;
                }
                catch (e) {
                    // Trick to solve this issue, forcing the iframe to get ready
                    // by simply setting its "src" property.
                    t = $.src;
                    $.src = t;

                    // In IE6 though, the above is not enough, so we must pause the
                    // execution for a while, giving it time to think.
                    if (UA.ie && UA.ie < 7) {
                        window.showModalDialog(
                            'javascript:document.write("' +
                                '<script>' +
                                'window.setTimeout(' +
                                'function(){window.close();}' +
                                ',50);' +
                                '</scrip' +
                                't' +
                                '>' +
                                '")');
                    }
                }
                return $ && $.contentWindow.document;
            },

            _4e_splitText : function(el, offset) {
                el = normalElDom(el);
                var doc = el.ownerDocument;
                if (!el || el.nodeType != KEN.NODE_TEXT) return;
                // If the offset is after the last char, IE creates the text node
                // on split, but don't include it into the DOM. So, we have to do
                // that manually here.
                if (UA.ie && offset == el.nodeValue.length) {
                    var next = doc.createTextNode("");
                    DOM.insertAfter(next, el);
                    return next;
                }


                var retval = new Node(el.splitText(offset));

                // IE BUG: IE8 does not update the childNodes array in DOM after splitText(),
                // we need to make some DOM changes to make it update. (#3436)
                if (UA.ie == 8) {
                    var workaround = doc.createTextNode("");
                    DOM.insertAfter(workaround, retval[0]);
                    workaround.parentNode.removeChild(workaround);
                }

                return retval;
            },

            _4e_parents : function(node, closerFirst) {
                node = normalEl(node);
                var parents = [];
                do {
                    parents[  closerFirst ? 'push' : 'unshift' ](node);
                } while (( node = node.parent() ));

                return parents;
            },

            _4e_clone : function(el, includeChildren, cloneId) {
                el = normalElDom(el);
                var $clone = el.cloneNode(includeChildren);

                if (!cloneId) {
                    var removeIds = function(node) {
                        if (node.nodeType != KEN.NODE_ELEMENT)
                            return;

                        node.removeAttribute('id', false);
                        //复制时不要复制expando
                        node.removeAttribute('_ke_expando', false);

                        var childs = node.childNodes;
                        for (var i = 0; i < childs.length; i++)
                            removeIds(childs[ i ]);
                    };

                    // The "id" attribute should never be cloned to avoid duplication.
                    removeIds($clone);
                }
                return new Node($clone);
            },
            /**
             * 深度优先遍历获取下一结点
             * @param el
             * @param startFromSibling
             * @param nodeType
             * @param guard
             */
            _4e_nextSourceNode : function(el, startFromSibling, nodeType, guard) {
                el = normalElDom(el);
                // If "guard" is a node, transform it in a function.
                if (guard && !guard.call) {
                    var guardNode = guard[0] || guard;
                    guard = function(node) {
                        node = node[0] || node;
                        return node !== guardNode;
                    };
                }

                var node = !startFromSibling && el.firstChild ,
                    parent = new Node(el);

                // Guarding when we're skipping the current element( no children or 'startFromSibling' ).
                // send the 'moving out' signal even we don't actually dive into.
                if (!node) {
                    if (el.nodeType == KEN.NODE_ELEMENT && guard && guard(this, true) === false)
                        return null;
                    node = el.nextSibling;
                }

                while (!node && ( parent = parent.parent())) {
                    // The guard check sends the "true" paramenter to indicate that
                    // we are moving "out" of the element.
                    if (guard && guard(parent, true) === false)
                        return null;

                    node = parent[0].nextSibling;
                }

                if (!node)
                    return null;
                node = new Node(node);
                if (guard && guard(node) === false)
                    return null;

                if (nodeType && nodeType != node[0].nodeType)
                    return node._4e_nextSourceNode(false, nodeType, guard);

                return node;
            },
            _4e_previousSourceNode : function(el, startFromSibling, nodeType, guard) {
                el = normalElDom(el);
                if (guard && !guard.call) {
                    var guardNode = guard[0] || guard;
                    guard = function(node) {
                        node = node[0] || node;
                        return node !== guardNode;
                    };
                }

                var node = ( !startFromSibling && el.lastChild),
                    parent = new Node(el);

                // Guarding when we're skipping the current element( no children or 'startFromSibling' ).
                // send the 'moving out' signal even we don't actually dive into.
                if (!node) {
                    if (el.nodeType == KEN.NODE_ELEMENT && guard && guard(el, true) === false)
                        return null;
                    node = el.previousSibling;
                }

                while (!node && ( parent = parent.parent() )) {
                    // The guard check sends the "true" paramenter to indicate that
                    // we are moving "out" of the element.
                    if (guard && guard(parent, true) === false)
                        return null;
                    node = parent[0].previousSibling;
                }

                if (!node)
                    return null;
                node = new Node(node);
                if (guard && guard(node) === false)
                    return null;

                if (nodeType && node[0].nodeType != nodeType)
                    return node._4e_previousSourceNode(false, nodeType, guard);

                return node;
            },
            _4e_contains :
                UA.ie || UA.webkit ?
                    function(el, node) {
                        el = normalElDom(el);
                        node = normalElDom(node);
                        return node.nodeType != KEN.NODE_ELEMENT ?
                            el.contains(node.parentNode) :
                            el != node && el.contains(node);
                    }
                    :
                    function(el, node) {
                        el = normalElDom(el);
                        node = normalElDom(node);
                        return !!( el.compareDocumentPosition(node) & 16 );
                    },
            _4e_commonAncestor:function(el, node) {
                if (el._4e_equals(node))
                    return el;

                if (node[0].nodeType != KEN.NODE_TEXT && node._4e_contains(el))
                    return node;

                var start = el[0].nodeType == KEN.NODE_TEXT ? el.parent() : el;

                do   {
                    if (start[0].nodeType != KEN.NODE_TEXT && start._4e_contains(node))
                        return start;
                } while (( start = start.parent() ));

                return null;
            },
            _4e_ascendant : function(el, name, includeSelf) {
                var $ = normalElDom(el);

                if (!includeSelf)
                    $ = $.parentNode;
                if (name && !S.isFunction(name)) {
                    var n = name;
                    name = function(node) {
                        return node._4e_name() == n;
                    };
                }
                //到document就完了
                while ($ && $.nodeType != 9) {
                    if (!name || name(new Node($)) === true)
                        return new Node($);

                    $ = $.parentNode;
                }
                return null;
            },
            _4e_hasAttribute : function(el, name) {
                el = normalElDom(el);
                var $attr = el.attributes.getNamedItem(name);
                return !!( $attr && $attr.specified );
            },
            _4e_hasAttributes: UA.ie ?
                function(el) {
                    el = normalElDom(el);
                    var attributes = el.attributes;

                    for (var i = 0; i < attributes.length; i++) {
                        var attribute = attributes[i];

                        switch (attribute.nodeName) {
                            case 'class' :
                                // IE has a strange bug. If calling removeAttribute('className'),
                                // the attributes collection will still contain the "class"
                                // attribute, which will be marked as "specified", even if the
                                // outerHTML of the element is not displaying the class attribute.
                                // Note : I was not able to reproduce it outside the editor,
                                // but I've faced it while working on the TC of #1391.
                                if (el.getAttribute('class'))
                                    return true;
                                break;
                            // Attributes to be ignored.
                            case '_ke_expando' :
                                continue;

                            /*jsl:fallthru*/

                            default :
                                if (attribute.specified)
                                    return true;
                        }
                    }

                    return false;
                }
                :
                function(el) {
                    el = normalElDom(el);
                    //删除firefox自己添加的标志
                    UA.gecko && el.removeAttribute("_moz_dirty");
                    var attributes = el.attributes;
                    return ( attributes.length > 1 || ( attributes.length == 1 && attributes[0].nodeName != '_ke_expando' ) );
                },

            _4e_position : function(el, otherNode) {
                var $ = normalElDom(el),$other = normalElDom(otherNode);


                if ($.compareDocumentPosition)
                    return $.compareDocumentPosition($other);

                // IE and Safari have no support for compareDocumentPosition.

                if ($ == $other)
                    return KEP.POSITION_IDENTICAL;

                // Only element nodes support contains and sourceIndex.
                if ($.nodeType == KEN.NODE_ELEMENT && $other.nodeType == KEN.NODE_ELEMENT) {
                    if ($.contains) {
                        if ($.contains($other))
                            return KEP.POSITION_CONTAINS + KEP.POSITION_PRECEDING;

                        if ($other.contains($))
                            return KEP.POSITION_IS_CONTAINED + KEP.POSITION_FOLLOWING;
                    }

                    if ('sourceIndex' in $) {
                        return ( $.sourceIndex < 0 || $other.sourceIndex < 0 ) ? KEP.POSITION_DISCONNECTED :
                            ( $.sourceIndex < $other.sourceIndex ) ? KEP.POSITION_PRECEDING :
                                KEP.POSITION_FOLLOWING;
                    }
                }

                // For nodes that don't support compareDocumentPosition, contains
                // or sourceIndex, their "address" is compared.

                var addressOfThis = el._4e_address(),
                    addressOfOther = otherNode._4e_address(),
                    minLevel = Math.min(addressOfThis.length, addressOfOther.length);

                // Determinate preceed/follow relationship.
                for (var i = 0; i <= minLevel - 1; i++) {
                    if (addressOfThis[ i ] != addressOfOther[ i ]) {
                        if (i < minLevel) {
                            return addressOfThis[ i ] < addressOfOther[ i ] ?
                                KEP.POSITION_PRECEDING : KEP.POSITION_FOLLOWING;
                        }
                        break;
                    }
                }

                // Determinate contains/contained relationship.
                return ( addressOfThis.length < addressOfOther.length ) ?
                    KEP.POSITION_CONTAINS + KEP.POSITION_PRECEDING :
                    KEP.POSITION_IS_CONTAINED + KEP.POSITION_FOLLOWING;
            },

            _4e_address:function(el, normalized) {
                el = normalElDom(el);
                var address = [],

                    $documentElement = el.ownerDocument.documentElement,
                    node = el;

                while (node && node != $documentElement) {
                    var parentNode = node.parentNode,
                        currentIndex = -1;

                    if (parentNode) {
                        for (var i = 0; i < parentNode.childNodes.length; i++) {
                            var candidate = parentNode.childNodes[i];

                            if (normalized &&
                                candidate.nodeType == 3 &&
                                candidate.previousSibling &&
                                candidate.previousSibling.nodeType == 3) {
                                continue;
                            }

                            currentIndex++;

                            if (candidate == node)
                                break;
                        }

                        address.unshift(currentIndex);
                    }

                    node = parentNode;
                }

                return address;
            },
            _4e_breakParent : function(el, parent) {
                var KERange = KE.Range,range = new KERange(el[0].ownerDocument);

                // We'll be extracting part of this element, so let's use our
                // range to get the correct piece.
                range.setStartAfter(el);
                range.setEndAfter(parent);

                // Extract it.
                var docFrag = range.extractContents();

                // Move the element outside the broken element.
                range.insertNode(el.remove());

                // Re-insert the extracted piece after the element.
                el[0].parentNode.insertBefore(docFrag, el[0].nextSibling);
            },
            _4e_style:function(el, styleName, val) {
                if (val !== undefined) {
                    return el.css(styleName, val);
                }
                el = el[0] || el;
                return el.style[normalizeStyle(styleName)];
            },
            _4e_remove : function(el, preserveChildren) {
                var $ = normalElDom(el), parent = $.parentNode;
                if (parent) {
                    if (preserveChildren) {
                        // Move all children before the node.
                        for (var child; ( child = $.firstChild );) {
                            parent.insertBefore($.removeChild(child), $);
                        }
                    }
                    parent.removeChild($);
                }
                return this;
            },
            _4e_trim : function(el) {
                DOM._4e_ltrim(el);
                DOM._4e_rtrim(el);
            },

            _4e_ltrim : function(el) {
                el = normalElDom(el);
                var child;
                while (( child = el.firstChild )) {
                    if (child.nodeType == KEN.NODE_TEXT) {
                        var trimmed = Utils.ltrim(child.nodeValue),
                            originalLength = child.nodeValue.length;

                        if (!trimmed) {
                            el.removeChild(child);
                            continue;
                        }
                        else if (trimmed.length < originalLength) {
                            new Node(child)._4e_splitText(originalLength - trimmed.length);
                            // IE BUG: child.remove() may raise JavaScript errors here. (#81)
                            el.removeChild(el.firstChild);
                        }
                    }
                    break;
                }
            },

            _4e_rtrim : function(el) {
                el = normalElDom(el);
                var child;
                while (( child = el.lastChild )) {
                    if (child.type == KEN.NODE_TEXT) {
                        var trimmed = Utils.rtrim(child.nodeValue),
                            originalLength = child.nodeValue.length;

                        if (!trimmed) {
                            el.removeChild(child);
                            continue;
                        } else if (trimmed.length < originalLength) {
                            new Node(child)._4e_splitText(trimmed.length);
                            // IE BUG: child.getNext().remove() may raise JavaScript errors here.
                            // (#81)
                            el.removeChild(el.lastChild);
                        }
                    }
                    break;
                }

                if (!UA.ie && !UA.opera) {
                    child = el.lastChild;
                    if (child && child.nodeType == 1 && child.nodeName.toLowerCase() == 'br') {
                        // Use "eChildNode.parentNode" instead of "node" to avoid IE bug (#324).
                        child.parentNode.removeChild(child);
                    }
                }
            },

            _4e_appendBogus : function(el) {
                el = normalElDom(el);
                var lastChild = el.lastChild;

                // Ignore empty/spaces text.
                while (lastChild && lastChild.nodeType == KEN.NODE_TEXT && !S.trim(lastChild.nodeValue))
                    lastChild = lastChild.previousSibling;
                if (!lastChild || lastChild.nodeType == KEN.NODE_TEXT || DOM._4e_name(lastChild) !== 'br') {
                    var bogus = UA.opera ?
                        el.ownerDocument.createTextNode('') :
                        el.ownerDocument.createElement('br');

                    UA.gecko && bogus.setAttribute('type', '_moz');

                    el.appendChild(bogus);
                }
            },
            _4e_previous : function(el, evaluator) {
                var previous = normalElDom(el), retval;
                do {
                    previous = previous.previousSibling;
                    retval = previous && new Node(previous);
                } while (retval && evaluator && !evaluator(retval));
                return retval;
            },

            /**
             * @param {Function} evaluator Filtering the result node.
             */
            _4e_last : function(el, evaluator) {
                var last = el[0].lastChild,
                    retval = last && new Node(last);
                if (retval && evaluator && !evaluator(retval))
                    retval = retval._4e_previous(evaluator);

                return retval;
            },

            _4e_next : function(el, evaluator) {
                var next = normalElDom(el), retval;
                do {
                    next = next.nextSibling;
                    retval = next && new Node(next);
                } while (retval && evaluator && !evaluator(retval));
                return retval;
            },
            _4e_outerHtml : function(el) {
                el = normalElDom(el);
                if (el.outerHTML) {
                    // IE includes the <?xml:namespace> tag in the outerHTML of
                    // namespaced element. So, we must strip it here. (#3341)
                    return el.outerHTML.replace(/<\?[^>]*>/, '');
                }

                var tmpDiv = el.ownerDocument.createElement('div');
                tmpDiv.appendChild(el.cloneNode(true));
                return tmpDiv.innerHTML;
            },

            _4e_setMarker : function(element, database, name, value) {
                if (!element[0]) element = new Node(element);
                var id = element._4e_getData('list_marker_id') ||
                    ( element._4e_setData('list_marker_id', S.guid())._4e_getData('list_marker_id')),
                    markerNames = element._4e_getData('list_marker_names') ||
                        ( element._4e_setData('list_marker_names', {})._4e_getData('list_marker_names'));
                database[id] = element;
                markerNames[name] = 1;

                return element._4e_setData(name, value);
            },
            _4e_clearMarkers : function(element, database, removeFromDatabase) {

                element = normalEl(element);
                var names = element._4e_getData('list_marker_names'),
                    id = element._4e_getData('list_marker_id');
                for (var i in names)
                    element._4e_removeData(i);
                element._4e_removeData('list_marker_names');
                if (removeFromDatabase) {
                    element._4e_removeData('list_marker_id');
                    delete database[id];
                }
            },

            _4e_setData : function(el, key, value) {
                var expandoNumber = DOM._4e_getUniqueId(el),
                    dataSlot = customData[ expandoNumber ] || ( customData[ expandoNumber ] = {} );
                dataSlot[ key ] = value;
                return el;
            },


            _4e_getData :function(el, key) {
                el = normalElDom(el);
                var expandoNumber = el.getAttribute('_ke_expando'),
                    dataSlot = expandoNumber && customData[ expandoNumber ];
                return dataSlot && dataSlot[ key ];
            },


            _4e_removeData : function(el, key) {
                el = normalElDom(el);
                var expandoNumber = el.getAttribute('_ke_expando'),
                    dataSlot = expandoNumber && customData[ expandoNumber ],
                    retval = dataSlot && dataSlot[ key ];

                if (typeof retval != 'undefined' && dataSlot)
                    delete dataSlot[ key ];
                if (S.isEmptyObject(dataSlot))
                    DOM._4e_clearData(el);

                return retval || null;
            },

            _4e_clearData : function(el) {
                el = normalElDom(el);
                var expandoNumber = el.getAttribute('_ke_expando');
                expandoNumber && delete customData[ expandoNumber ];
                //ie inner html 会把属性带上，删掉！
                expandoNumber && el.removeAttribute("_ke_expando");
            },
            _4e_getUniqueId : function(el) {
                el = normalElDom(el);
                var id = el.getAttribute('_ke_expando');
                if (id) return id;
                id = S.guid();
                el.setAttribute('_ke_expando', id);
                return id;
            },

            _4e_copyAttributes : function(el, dest, skipAttributes) {
                el = normalElDom(el);
                var attributes = el.attributes;
                skipAttributes = skipAttributes || {};

                for (var n = 0; n < attributes.length; n++) {
                    // Lowercase attribute name hard rule is broken for
                    // some attribute on IE, e.g. CHECKED.
                    var attribute = attributes[n],
                        attrName = attribute.nodeName.toLowerCase(),
                        attrValue;

                    // We can set the type only once, so do it with the proper value, not copying it.
                    if (attrName in skipAttributes)
                        continue;

                    if (attrName == 'checked' && ( attrValue = DOM.attr(el, attrName) ))
                        dest.attr(attrName, attrValue);
                    // IE BUG: value attribute is never specified even if it exists.
                    else if (attribute.specified ||
                        ( UA.ie && attribute.nodeValue && attrName == 'value' )) {
                        attrValue = DOM.attr(el, attrName);
                        if (attrValue === null)
                            attrValue = attribute.nodeValue;
                        dest.attr(attrName, attrValue);
                    }
                }

                // The style:
                if (el.style.cssText !== '')
                    dest[0].style.cssText = el.style.cssText;
            },

            _4e_isEditable : function(el) {

                // Get the element DTD (defaults to span for unknown elements).
                var name = DOM._4e_name(el),
                    xhtml_dtd = KE.XHTML_DTD,
                    dtd = !xhtml_dtd.$nonEditable[ name ]
                        && ( xhtml_dtd[ name ] || xhtml_dtd.span );

                // In the DTD # == text node.
                return ( dtd && dtd['#'] );
            },
            /**
             * 修正scrollIntoView在可视区域内不需要滚动
             * @param elem
             */
            _4e_scrollIntoView:function(elem) {
                elem = normalEl(elem);
                var doc = elem[0].ownerDocument;
                var l = DOM.scrollLeft(doc),t = DOM.scrollTop(doc),eoffset = elem.offset(),el = eoffset.left, et = eoffset.top;
                if (DOM.viewportHeight(doc) + t < et ||
                    et < t ||
                    DOM.viewportWidth(doc) + l < el
                    ||
                    el < l
                    ) {
                    elem.scrollIntoView(doc);
                }
            }
        };


    function normalizeStyle(styleName) {
        return styleName.replace(/-(\w)/g, function(m, g1) {
            return g1.toUpperCase();
        })
    }

    S.DOM._4e_inject = function(editorDom) {
        S.mix(DOM, editorDom);
        for (var dm in editorDom) {
            if (editorDom.hasOwnProperty(dm))
                (function(dm) {
                    Node.prototype[dm] = function() {
                        var args = [].slice.call(arguments, 0);
                        args.unshift(this);
                        return editorDom[dm].apply(null, args);
                    };
                })(dm);
        }
    };
    S.DOM._4e_inject(editorDom);
});
/**
 * modified from ckeditor ,elementpath represents element's tree path from body
 * @modifier: <yiminghe@gmail.com(chengyu)>
 */
KISSY.Editor.add("elementpath", function(KE) {
    var S = KISSY,
        DOM = S.DOM,
        dtd = KE.XHTML_DTD,
        KEN = KE.NODE,
        UA = S.UA;
    // Elements that may be considered the "Block boundary" in an element path.
    var pathBlockElements = { address:1,blockquote:1,dl:1,h1:1,h2:1,h3:1,h4:1,h5:1,h6:1,p:1,pre:1,li:1,dt:1,dd:1 };

    // Elements that may be considered the "Block limit" in an element path.
    var pathBlockLimitElements = { body:1,div:1,table:1,tbody:1,tr:1,td:1,th:1,caption:1,form:1 };

    // Check if an element contains any block element.
    var checkHasBlock = function(element) {
        element = element[0] || element;
        var childNodes = element.childNodes;

        for (var i = 0, count = childNodes.length; i < count; i++) {
            var child = childNodes[i];

            if (child.nodeType == KEN.NODE_ELEMENT && dtd.$block[ child.nodeName.toLowerCase() ])
                return true;
        }

        return false;
    };

    function ElementPath(lastNode) {
        var block = null;
        var blockLimit = null;
        var elements = [];
        var e = lastNode;

        while (e && e[0]) {
            if (e[0].nodeType == KEN.NODE_ELEMENT) {
                if (!this.lastElement)
                    this.lastElement = e;

                var elementName = e._4e_name();
                if (UA.ie && e[0].scopeName != 'HTML')
                    elementName = e[0].scopeName.toLowerCase() + ':' + elementName;

                if (!blockLimit) {
                    if (!block && pathBlockElements[ elementName ])
                        block = e;

                    if (pathBlockLimitElements[ elementName ]) {
                        // DIV is considered the Block, if no block is available (#525)
                        // and if it doesn't contain other blocks.
                        if (!block && elementName == 'div' && !checkHasBlock(e))
                            block = e;
                        else
                            blockLimit = e;
                    }
                }

                elements.push(e);
                if (elementName == 'body')
                    break;
            }
            e = e.parent();
        }

        this.block = block;
        this.blockLimit = blockLimit;
        this.elements = elements;
    }

    ElementPath.prototype = {
        /**
         * Compares this element path with another one.
         * @param otherPath The elementPath object to be
         * compared with this one.
         * @returns {Boolean} "true" if the paths are equal, containing the same
         * number of elements and the same elements in the same order.
         */
        compare : function(otherPath) {
            var thisElements = this.elements;
            var otherElements = otherPath && otherPath.elements;

            if (!otherElements || thisElements.length != otherElements.length)
                return false;

            for (var i = 0; i < thisElements.length; i++) {
                if (!DOM._4e_equals(thisElements[ i ], otherElements[ i ]))
                    return false;
            }

            return true;
        },

        contains : function(tagNames) {
            var elements = this.elements;
            for (var i = 0; i < elements.length; i++) {
                if (elements[ i ]._4e_name() in tagNames)
                    return elements[ i ];
            }
            return null;
        }
    };

    KE.ElementPath = ElementPath;

});
/**
 * modified from ckeditor for kissy editor ,walker implementation
 * @refer: http://www.w3.org/TR/DOM-Level-2-Traversal-Range/traversal#TreeWalker
 * @modifier: yiminghe@gmail.com(chengyu)
 */
KISSY.Editor.add("walker", function(KE) {

    var S = KISSY,
        KEN = KE.NODE,
        DOM = S.DOM,
        Node = S.Node;
    // This function is to be called under a "walker" instance scope.
    function iterate(rtl, breakOnFalse) {
        var self = this;
        // Return null if we have reached the end.
        if (this._.end)
            return null;

        var node,
            range = self.range,
            guard,
            userGuard = self.guard,
            type = self.type,
            getSourceNodeFn = ( rtl ? '_4e_previousSourceNode' : '_4e_nextSourceNode' );

        // This is the first call. Initialize it.
        if (!self._.start) {
            self._.start = 1;

            // Trim text nodes and optmize the range boundaries. DOM changes
            // may happen at this point.
            range.trim();

            // A collapsed range must return null at first call.
            if (range.collapsed) {
                self.end();
                return null;
            }
        }

        // Create the LTR guard function, if necessary.
        if (!rtl && !self._.guardLTR) {
            // Gets the node that stops the walker when going LTR.
            var limitLTR = range.endContainer,
                blockerLTR = new Node(limitLTR[0].childNodes[range.endOffset]);
            //从左到右保证在 range 区间内获取 nextSourceNode
            this._.guardLTR = function(node, movingOut) {
                //从endContainer移出去，失败返回false
                return (
                    ( !movingOut
                        ||
                        ! DOM._4e_equals(limitLTR, node)
                        )
                        //到达深度遍历的最后一个节点，结束
                        && ( !blockerLTR[0] || node[0] !== (blockerLTR[0]) )

                        //从body移出也结束
                        && ( node[0].nodeType != KEN.NODE_ELEMENT
                        || !movingOut
                        || node._4e_name() != 'body' ) );
            };
        }

        // Create the RTL guard function, if necessary.
        if (rtl && !self._.guardRTL) {
            // Gets the node that stops the walker when going LTR.
            var limitRTL = range.startContainer,
                blockerRTL = ( range.startOffset > 0 ) && new Node(limitRTL[0].childNodes[range.startOffset - 1]);

            self._.guardRTL = function(node, movingOut) {

                return (
                    node
                        && node[0]
                        && ( !movingOut || limitRTL[0] !== node[0] )
                        && ( !blockerRTL[0] || node[0] !== blockerRTL[0] )
                        && ( node[0].nodeType != KEN.NODE_ELEMENT || !movingOut || node._4e_name() != 'body' ) );
            };
        }

        // Define which guard function to use.
        var stopGuard = rtl ? self._.guardRTL : self._.guardLTR;

        // Make the user defined guard function participate in the process,
        // otherwise simply use the boundary guard.
        if (userGuard) {
            guard = function(node, movingOut) {
                if (stopGuard(node, movingOut) === false)
                    return false;

                return userGuard(node, movingOut);
            };
        }
        else
            guard = stopGuard;

        if (self.current)
            node = this.current[ getSourceNodeFn ](false, type, guard);
        else {
            // Get the first node to be returned.

            if (rtl) {
                node = range.endContainer;

                if (range.endOffset > 0) {
                    node = new Node(node[0].childNodes[range.endOffset - 1]);
                    if (guard(node) === false)
                        node = null;
                }
                else
                    node = ( guard(node, true) === false ) ?
                        null : node._4e_previousSourceNode(true, type, guard);
            }
            else {
                node = range.startContainer;
                node = new Node(node[0].childNodes[range.startOffset]);

                if (node && node[0]) {
                    if (guard(node) === false)
                        node = null;
                }
                else
                    node = ( guard(range.startContainer, true) === false ) ?
                        null : range.startContainer._4e_nextSourceNode(true, type, guard);
            }
        }

        while (node && node[0] && !self._.end) {
            self.current = node;

            if (!this.evaluator || self.evaluator(node) !== false) {
                if (!breakOnFalse)
                    return node;
            }
            else if (breakOnFalse && self.evaluator)
                return false;

            node = node[ getSourceNodeFn ](false, type, guard);
        }

        self.end();
        return self.current = null;
    }

    function iterateToLast(rtl) {
        var node, last = null;

        while (( node = iterate.call(this, rtl) ))
            last = node;

        return last;
    }

    function Walker(range) {
        this.range = range;

        /**
         * A function executed for every matched node, to check whether
         * it's to be considered into the walk or not. If not provided, all
         * matched nodes are considered good.
         * If the function returns "false" the node is ignored.
         * @name CKEDITOR.dom.walker.prototype.evaluator
         * @property
         * @type Function
         */
        // this.evaluator = null;

        /**
         * A function executed for every node the walk pass by to check
         * whether the walk is to be finished. It's called when both
         * entering and exiting nodes, as well as for the matched nodes.
         * If this function returns "false", the walking ends and no more
         * nodes are evaluated.
         * @name CKEDITOR.dom.walker.prototype.guard
         * @property
         * @type Function
         */
        // this.guard = null;

        /** @private */
        this._ = {};
    }


    S.augment(Walker, {
        /**
         * Stop walking. No more nodes are retrieved if this function gets
         * called.
         */
        end : function() {
            this._.end = 1;
        },

        /**
         * Retrieves the next node (at right).
         * @returns {Node} The next node or null if no more
         *        nodes are available.
         */
        next : function() {
            return iterate.call(this);
        },

        /**
         * Retrieves the previous node (at left).
         * @returns {Node} The previous node or null if no more
         *        nodes are available.
         */
        previous : function() {
            return iterate.call(this, true);
        },

        /**
         * Check all nodes at right, executing the evaluation fuction.
         * @returns {Boolean} "false" if the evaluator function returned
         *        "false" for any of the matched nodes. Otherwise "true".
         */
        checkForward : function() {
            return iterate.call(this, false, true) !== false;
        },

        /**
         * Check all nodes at left, executing the evaluation fuction.
         * 是不是 (不能后退了)
         * @returns {Boolean} "false" if the evaluator function returned
         *        "false" for any of the matched nodes. Otherwise "true".
         */
        checkBackward : function() {
            return iterate.call(this, true, true) !== false;
        },

        /**
         * Executes a full walk forward (to the right), until no more nodes
         * are available, returning the last valid node.
         * @returns {Node} The last node at the right or null
         *        if no valid nodes are available.
         */
        lastForward : function() {
            return iterateToLast.call(this);
        },

        /**
         * Executes a full walk backwards (to the left), until no more nodes
         * are available, returning the last valid node.
         * @returns {Node} The last node at the left or null
         *        if no valid nodes are available.
         */
        lastBackward : function() {
            return iterateToLast.call(this, true);
        },

        reset : function() {
            delete this.current;
            this._ = {};
        }

    });


    Walker.blockBoundary = function(customNodeNames) {
        return function(node) {
            if (!node[0]) node = new Node(node);
            return ! ( node[0].nodeType == KEN.NODE_ELEMENT
                && node._4e_isBlockBoundary(customNodeNames) );
        };
    };

    Walker.listItemBoundary = function() {
        return this.blockBoundary({ br : 1 });
    };
    /**
     * Whether the node is a bookmark node's inner text node.
     */
    //Walker.bookmarkContents = function(node) {
    // },

    /**
     * Whether the to-be-evaluated node is a bookmark node OR bookmark node
     * inner contents.
     * @param {Boolean} contentOnly Whether only test againt the text content of
     * bookmark node instead of the element itself(default).
     * @param {Boolean} isReject Whether should return 'false' for the bookmark
     * node instead of 'true'(default).
     */
    Walker.bookmark = function(contentOnly, isReject) {
        function isBookmarkNode(node) {
            return ( node && node[0]
                && node._4e_name() == 'span'
                && node.attr('_ke_bookmark') );
        }

        return function(node) {
            var isBookmark, parent;
            // Is bookmark inner text node?
            isBookmark = ( node && node[0] && node[0].nodeType == KEN.NODE_TEXT && ( parent = node.parent() )
                && isBookmarkNode(parent) );
            // Is bookmark node?
            isBookmark = contentOnly ? isBookmark : isBookmark || isBookmarkNode(node);
            return isReject ^ isBookmark;
        };
    };

    /**
     * Whether the node is a text node containing only whitespaces characters.
     * @param isReject
     */
    Walker.whitespaces = function(isReject) {
        return function(node) {
            node = node[0] || node;
            var isWhitespace = node && ( node.nodeType == KEN.NODE_TEXT )
                && !S.trim(node.nodeValue);
            return isReject ^ isWhitespace;
        };
    };

    /**
     * Whether the node is invisible in wysiwyg mode.
     * @param isReject
     */
    Walker.invisible = function(isReject) {
        var whitespace = Walker.whitespaces();
        return function(node) {
            // Nodes that take no spaces in wysiwyg:
            // 1. White-spaces but not including NBSP;
            // 2. Empty inline elements, e.g. <b></b> we're checking here
            // 'offsetHeight' instead of 'offsetWidth' for properly excluding
            // all sorts of empty paragraph, e.g. <br />.
            var isInvisible = whitespace(node) || node[0].nodeType == KEN.NODE_ELEMENT && !node[0].offsetHeight;
            return isReject ^ isInvisible;
        };
    };


    KE.Walker = Walker;
});
/**
 * modified from ckeditor,range implementation across browsers for kissy editor
 * @modifier: <yiminghe@gmail.com(chengyu)>
 */
KISSY.Editor.add("range", function(KE) {
    KE.RANGE = {
        POSITION_AFTER_START:1,// <element>^contents</element>		"^text"
        POSITION_BEFORE_END:2,// <element>contents^</element>		"text^"
        POSITION_BEFORE_START:3,// ^<element>contents</element>		^"text"
        POSITION_AFTER_END:4,// <element>contents</element>^		"text"
        ENLARGE_ELEMENT:1,
        ENLARGE_BLOCK_CONTENTS:2,
        ENLARGE_LIST_ITEM_CONTENTS:3,
        START:1,
        END:2,
        STARTEND:3,
        SHRINK_ELEMENT:1,
        SHRINK_TEXT:2
    };

    var S=KISSY,KEN = KE.NODE,
        KER = KE.RANGE,
        KEP = KE.POSITION,
        Walker = KE.Walker,
        DOM = S.DOM,
        getByAddress = KE.Utils.getByAddress,
        UA = S.UA,
        dtd = KE.XHTML_DTD,
        ElementPath = KE.ElementPath,
        Node = S.Node,
        EMPTY = {area:1,base:1,br:1,col:1,hr:1,img:1,input:1,link:1,meta:1,param:1};

    function KERange(document) {
        var self = this;
        self.startContainer = null;
        self.startOffset = null;
        self.endContainer = null;
        self.endOffset = null;
        self.collapsed = true;
        self.document = document;
    }

    KERange.prototype.toString = function() {
        var s = [],self = this;
        s.push((self.startContainer[0].id || self.startContainer[0].nodeName) + ":" + self.startOffset);
        s.push((self.endContainer[0].id || self.endContainer[0].nodeName) + ":" + self.endOffset);
        return s.join("<br/>");
    };
    S.augment(KERange, {

        updateCollapsed:function() {
            var self = this;
            self.collapsed = (
                self.startContainer &&
                    self.endContainer &&
                    DOM._4e_equals(self.startContainer, self.endContainer) &&
                    self.startOffset == self.endOffset );
        },
        /**
         * Transforms the startContainer and endContainer properties from text
         * nodes to element nodes, whenever possible. This is actually possible
         * if either of the boundary containers point to a text node, and its
         * offset is set to zero, or after the last char in the node.
         */
        optimize : function() {
            var self = this,container = self.startContainer,offset = self.startOffset;

            if (container[0].nodeType != KEN.NODE_ELEMENT) {
                if (!offset)
                    self.setStartBefore(container);
                else if (offset >= container[0].nodeValue.length)
                    self.setStartAfter(container);
            }

            container = self.endContainer;
            offset = self.endOffset;

            if (container[0].nodeType != KEN.NODE_ELEMENT) {
                if (!offset)
                    self.setEndBefore(container);
                else if (offset >= container[0].nodeValue.length)
                    self.setEndAfter(container);
            }
        },
        setStartAfter : function(node) {
            this.setStart(node.parent(), node._4e_index() + 1);
        },

        setStartBefore : function(node) {
            this.setStart(node.parent(), node._4e_index());
        },

        setEndAfter : function(node) {
            this.setEnd(node.parent(), node._4e_index() + 1);
        },

        setEndBefore : function(node) {
            this.setEnd(node.parent(), node._4e_index());
        },
        optimizeBookmark: function() {
            var startNode = this.startContainer,
                endNode = this.endContainer;

            if (startNode && startNode._4e_name() == 'span'
                && startNode.attr('_ke_bookmark'))
                this.setStartAt(startNode, KER.POSITION_BEFORE_START);
            if (endNode && endNode._4e_name() == 'span'
                && endNode.attr('_ke_bookmark'))
                this.setEndAt(endNode, KER.POSITION_AFTER_END);
        },
        /**
         * Sets the start position of a Range.
         * @param {Node} startNode The node to start the range.
         * @param {Number} startOffset An integer greater than or equal to zero
         *        representing the offset for the start of the range from the start
         *        of startNode.
         */
        setStart : function(startNode, startOffset) {
            // W3C requires a check for the new position. If it is after the end
            // boundary, the range should be collapsed to the new start. It seams
            // we will not need this check for our use of this class so we can
            // ignore it for now.

            // Fixing invalid range start inside dtd empty elements.
            var self = this;
            if (startNode[0].nodeType == KEN.NODE_ELEMENT
                && EMPTY[ startNode._4e_name() ])
                startNode = startNode.parent(),startOffset = startNode._4e_index();

            self.startContainer = startNode;
            self.startOffset = startOffset;

            if (!self.endContainer) {
                self.endContainer = startNode;
                self.endOffset = startOffset;
            }

            self.updateCollapsed();
        },

        /**
         * Sets the end position of a Range.
         * @param {Node} endNode The node to end the range.
         * @param {Number} endOffset An integer greater than or equal to zero
         *        representing the offset for the end of the range from the start
         *        of endNode.
         */
        setEnd : function(endNode, endOffset) {
            // W3C requires a check for the new position. If it is before the start
            // boundary, the range should be collapsed to the new end. It seams we
            // will not need this check for our use of this class so we can ignore
            // it for now.

            // Fixing invalid range end inside dtd empty elements.
            var self = this;
            if (endNode[0].nodeType == KEN.NODE_ELEMENT
                && EMPTY[ endNode._4e_name() ])
                endNode = endNode.parent(),endOffset = endNode._4e_index() + 1;

            self.endContainer = endNode;
            self.endOffset = endOffset;

            if (!self.startContainer) {
                self.startContainer = endNode;
                self.startOffset = endOffset;
            }

            self.updateCollapsed();
        },
        setStartAt : function(node, position) {
            var self = this;
            switch (position) {
                case KER.POSITION_AFTER_START :
                    self.setStart(node, 0);
                    break;

                case KER.POSITION_BEFORE_END :
                    if (node[0].nodeType == KEN.NODE_TEXT)
                        self.setStart(node, node[0].nodeValue.length);
                    else
                        self.setStart(node, node[0].childNodes.length);
                    break;

                case KER.POSITION_BEFORE_START :
                    self.setStartBefore(node);
                    break;

                case KER.POSITION_AFTER_END :
                    self.setStartAfter(node);
            }

            self.updateCollapsed();
        },

        setEndAt : function(node, position) {
            var self = this;
            switch (position) {
                case KER.POSITION_AFTER_START :
                    self.setEnd(node, 0);
                    break;

                case KER.POSITION_BEFORE_END :
                    if (node[0].nodeType == KEN.NODE_TEXT)
                        self.setEnd(node, node[0].nodeValue.length);
                    else
                        self.setEnd(node, node[0].childNodes.length);
                    break;

                case KER.POSITION_BEFORE_START :
                    self.setEndBefore(node);
                    break;

                case KER.POSITION_AFTER_END :
                    self.setEndAfter(node);
            }

            self.updateCollapsed();
        },
        execContentsAction:    function(action, docFrag) {
            var self = this,
                startNode = self.startContainer, endNode = self.endContainer,
                startOffset = self.startOffset,
                endOffset = self.endOffset,
                removeStartNode,
                t,
                removeEndNode;
            self.optimizeBookmark();
            // For text containers, we must simply split the node and point to the
            // second part. The removal will be handled by the rest of the code .
            if (endNode[0].nodeType == KEN.NODE_TEXT)
                endNode = endNode._4e_splitText(endOffset);
            else {
                // If the end container has children and the offset is pointing
                // to a child, then we should start from it.
                if (endNode[0].childNodes.length > 0) {
                    // If the offset points after the last node.
                    if (endOffset >= endNode[0].childNodes.length) {
                        // Let's create a temporary node and mark it for removal.
                        endNode = new Node(endNode[0].appendChild(this.document.createTextNode("")));
                        removeEndNode = true;
                    }
                    else
                        endNode = new Node(endNode[0].childNodes[endOffset]);
                }
            }

            // For text containers, we must simply split the node. The removal will
            // be handled by the rest of the code .
            if (startNode[0].nodeType == KEN.NODE_TEXT) {
                startNode._4e_splitText(startOffset);
                // In cases the end node is the same as the start node, the above
                // splitting will also split the end, so me must move the end to
                // the second part of the split.
                if (DOM._4e_equals(startNode, endNode))
                    endNode = new Node(startNode[0].nextSibling);
            }
            else {
                // If the start container has children and the offset is pointing
                // to a child, then we should start from its previous sibling.

                // If the offset points to the first node, we don't have a
                // sibling, so let's use the first one, but mark it for removal.
                if (!startOffset) {
                    // Let's create a temporary node and mark it for removal.
                    t = new Node(this.document.createTextNode(""));
                    DOM.insertBefore(t[0], startNode[0].firstChild);
                    startNode = t;
                    removeStartNode = true;
                }
                else if (startOffset >= startNode[0].childNodes.length) {
                    // Let's create a temporary node and mark it for removal.
                    //startNode = startNode[0].appendChild(this.document.createTextNode(''));
                    t = new Node(this.document.createTextNode(""));
                    startNode[0].appendChild(t[0]);
                    startNode = t;
                    removeStartNode = true;
                } else
                    startNode = new Node(startNode[0].childNodes[startOffset].previousSibling);
            }

            // Get the parent nodes tree for the start and end boundaries.
            var startParents = startNode._4e_parents();
            var endParents = endNode._4e_parents();

            // Compare them, to find the top most siblings.
            var i, topStart, topEnd;

            for (i = 0; i < startParents.length; i++) {
                topStart = startParents[ i ];
                topEnd = endParents[ i ];

                // The compared nodes will match until we find the top most
                // siblings (different nodes that have the same parent).
                // "i" will hold the index in the parents array for the top
                // most element.
                if (topStart[0] !== topEnd[0])
                    break;
            }

            var clone = docFrag, levelStartNode, levelClone, currentNode, currentSibling;

            // Remove all successive sibling nodes for every node in the
            // startParents tree.
            for (var j = i; j < startParents.length; j++) {
                levelStartNode = startParents[j];

                // For Extract and Clone, we must clone this level.
                if (clone && levelStartNode[0] !== startNode[0])        // action = 0 = Delete
                    levelClone = clone.appendChild(levelStartNode._4e_clone()[0]);

                currentNode = levelStartNode[0].nextSibling;

                while (currentNode) {
                    // Stop processing when the current node matches a node in the
                    // endParents tree or if it is the endNode.
                    if ((endParents[ j ] && currentNode == endParents[ j ][0]) || currentNode == endNode[0])
                        break;

                    // Cache the next sibling.
                    currentSibling = currentNode.nextSibling;

                    // If cloning, just clone it.
                    if (action == 2)    // 2 = Clone
                        clone.appendChild(currentNode.cloneNode(true));
                    else {
                        // Both Delete and Extract will remove the node.
                        currentNode.parentNode.removeChild(currentNode);

                        // When Extracting, move the removed node to the docFrag.
                        if (action == 1)    // 1 = Extract
                            clone.appendChild(currentNode);
                    }

                    currentNode = currentSibling;
                }
                //ckeditor这里错了，当前节点的路径所在父节点不能clone(true)，要在后面深入子节点处理
                if (levelClone)
                    clone = levelClone;
            }

            clone = docFrag;

            // Remove all previous sibling nodes for every node in the
            // endParents tree.
            for (var k = i; k < endParents.length; k++) {
                levelStartNode = endParents[ k ];

                // For Extract and Clone, we must clone this level.
                if (action > 0 && levelStartNode[0] !== endNode[0])        // action = 0 = Delete
                    levelClone = clone.appendChild(levelStartNode._4e_clone()[0]);

                // The processing of siblings may have already been done by the parent.
                if (!startParents[ k ] || levelStartNode[0].parentNode !== startParents[ k ][0].parentNode) {
                    currentNode = levelStartNode[0].previousSibling;
                    while (currentNode) {
                        // Stop processing when the current node matches a node in the
                        // startParents tree or if it is the startNode.
                        if ((startParents[ k ] && currentNode == startParents[ k ][0]) || currentNode === startNode[0])
                            break;

                        // Cache the next sibling.
                        currentSibling = currentNode.previousSibling;

                        // If cloning, just clone it.
                        if (action == 2) {    // 2 = Clone
                            clone.insertBefore(currentNode.cloneNode(true), clone.firstChild);
                        }

                        else {
                            // Both Delete and Extract will remove the node.
                            currentNode.parentNode.removeChild(currentNode);

                            // When Extracting, mode the removed node to the docFrag.
                            if (action == 1)    // 1 = Extract
                                clone.insertBefore(currentNode, clone.firstChild);
                        }

                        currentNode = currentSibling;
                    }
                }

                if (levelClone)
                    clone = levelClone;
            }

            if (action == 2) {   // 2 = Clone.

                // No changes in the DOM should be done, so fix the split text (if any).

                var startTextNode = self.startContainer[0];
                if (startTextNode.nodeType == KEN.NODE_TEXT
                    && startTextNode.nextSibling
                    //yiminghe note:careful,nextsilbling should be text node
                    && startTextNode.nextSibling.nodeType == KEN.NODE_TEXT) {
                    startTextNode.data += startTextNode.nextSibling.data;
                    startTextNode.parentNode.removeChild(startTextNode.nextSibling);
                }

                var endTextNode = self.endContainer[0];
                if (endTextNode.nodeType == KEN.NODE_TEXT &&
                    endTextNode.nextSibling &&
                    endTextNode.nextSibling.nodeType == KEN.NODE_TEXT) {
                    endTextNode.data += endTextNode.nextSibling.data;
                    endTextNode.parentNode.removeChild(endTextNode.nextSibling);
                }
            }
            else {
                // Collapse the range.

                // If a node has been partially selected, collapse the range between
                // topStart and topEnd. Otherwise, simply collapse it to the start. (W3C specs).
                if (topStart && topEnd && ( startNode[0].parentNode != topStart[0].parentNode || endNode[0].parentNode != topEnd[0].parentNode )) {
                    var endIndex = topEnd._4e_index();

                    // If the start node is to be removed, we must correct the
                    // index to reflect the removal.
                    if (removeStartNode && topEnd[0].parentNode == startNode[0].parentNode)
                        endIndex--;

                    self.setStart(topEnd.parent(), endIndex);
                }

                // Collapse it to the start.
                self.collapse(true);
            }

            // Cleanup any marked node.
            if (removeStartNode)
                startNode.remove();

            if (removeEndNode && endNode[0].parentNode)
                endNode.remove();
        },

        collapse : function(toStart) {
            var self = this;
            if (toStart) {
                self.endContainer = self.startContainer;
                self.endOffset = self.startOffset;
            } else {
                self.startContainer = self.endContainer;
                self.startOffset = self.endOffset;
            }
            self.collapsed = true;
        },

        clone : function() {
            var clone = new KERange(this.document),self = this;

            clone.startContainer = self.startContainer;
            clone.startOffset = self.startOffset;
            clone.endContainer = self.endContainer;
            clone.endOffset = self.endOffset;
            clone.collapsed = self.collapsed;

            return clone;
        },
        getEnclosedNode : function() {
            var walkerRange = this.clone();

            // Optimize and analyze the range to avoid DOM destructive nature of walker. (#
            walkerRange.optimize();
            if (walkerRange.startContainer[0].nodeType != KEN.NODE_ELEMENT
                || walkerRange.endContainer[0].nodeType != KEN.NODE_ELEMENT)
                return null;

            var current = walkerRange.startContainer[0].childNodes[walkerRange.startOffset];

            var
                isNotBookmarks = bookmark(true, undefined),
                isNotWhitespaces = whitespaces(true),
                evaluator = function(node) {
                    return isNotWhitespaces(node) && isNotBookmarks(node);
                };
            while (current && evaluator(current)) {
                current = new Node(current)._4e_nextSourceNode()[0];
            }
            return new Node(current);
        },
        shrink : function(mode, selectContents) {
            // Unable to shrink a collapsed range.
            var self = this;
            if (!self.collapsed) {
                mode = mode || KER.SHRINK_TEXT;

                var walkerRange = self.clone(),startContainer = self.startContainer,
                    endContainer = self.endContainer,
                    startOffset = self.startOffset,
                    endOffset = self.endOffset;
                //collapsed = self.collapsed;

                // Whether the start/end boundary is moveable.
                var moveStart = 1,
                    moveEnd = 1;

                if (startContainer && startContainer[0].nodeType == KEN.NODE_TEXT) {
                    if (!startOffset)
                        walkerRange.setStartBefore(startContainer);
                    else if (startOffset >= startContainer[0].nodeValue.length)
                        walkerRange.setStartAfter(startContainer);
                    else {
                        // Enlarge the range properly to avoid walker making
                        // DOM changes caused by triming the text nodes later.
                        walkerRange.setStartBefore(startContainer);
                        moveStart = 0;
                    }
                }

                if (endContainer && endContainer[0].nodeType == KEN.NODE_TEXT) {
                    if (!endOffset)
                        walkerRange.setEndBefore(endContainer);
                    else if (endOffset >= endContainer[0].nodeValue.length)
                        walkerRange.setEndAfter(endContainer);
                    else {
                        walkerRange.setEndAfter(endContainer);
                        moveEnd = 0;
                    }
                }

                var walker = new Walker(walkerRange);

                walker.evaluator = function(node) {
                    node = node[0] || node;
                    return node.nodeType == ( mode == KER.SHRINK_ELEMENT ?
                        KEN.NODE_ELEMENT : KEN.NODE_TEXT );
                };

                var currentElement;
                walker.guard = function(node, movingOut) {

                    node = node[0] || node;
                    // Stop when we're shrink in element mode while encountering a text node.
                    if (mode == KER.SHRINK_ELEMENT && node.nodeType == KEN.NODE_TEXT)
                        return false;

                    // Stop when we've already walked "through" an element.
                    if (movingOut && node == currentElement)
                        return false;

                    if (!movingOut && node.nodeType == KEN.NODE_ELEMENT)
                        currentElement = node;

                    return true;
                };

                if (moveStart) {
                    var textStart = walker[ mode == KER.SHRINK_ELEMENT ? 'lastForward' : 'next']();
                    textStart && self.setStartAt(textStart, selectContents ? KER.POSITION_AFTER_START : KER.POSITION_BEFORE_START);
                }

                if (moveEnd) {
                    walker.reset();
                    var textEnd = walker[ mode == KER.SHRINK_ELEMENT ? 'lastBackward' : 'previous']();
                    textEnd && self.setEndAt(textEnd, selectContents ? KER.POSITION_BEFORE_END : KER.POSITION_AFTER_END);
                }

                return !!( moveStart || moveEnd );
            }
        },
        getTouchedStartNode : function() {
            var container = this.startContainer;

            if (this.collapsed || container[0].nodeType != KEN.NODE_ELEMENT)
                return container;

            return container.childNodes[this.startOffset] || container;
        },
        createBookmark2 : function(normalized) {
            //debugger;
            var self = this,startContainer = self.startContainer,
                endContainer = self.endContainer,
                startOffset = self.startOffset,
                endOffset = self.endOffset,
                child, previous;

            // If there is no range then get out of here.
            // It happens on initial load in Safari #962 and if the editor it's
            // hidden also in Firefox
            if (!startContainer || !endContainer)
                return { start : 0, end : 0 };

            if (normalized) {
                // Find out if the start is pointing to a text node that will
                // be normalized.
                if (startContainer[0].nodeType == KEN.NODE_ELEMENT) {
                    child = new Node(startContainer[0].childNodes[startOffset]);

                    // In this case, move the start information to that text
                    // node.
                    if (child && child[0] && child[0].nodeType == KEN.NODE_TEXT
                        && startOffset > 0 && child[0].previousSibling.nodeType == KEN.NODE_TEXT) {
                        startContainer = child;
                        startOffset = 0;
                    }
                }

                // Normalize the start.
                while (startContainer[0].nodeType == KEN.NODE_TEXT
                    && ( previous = startContainer._4e_previous() )
                    && previous[0].nodeType == KEN.NODE_TEXT) {
                    startContainer = previous;
                    startOffset += previous[0].nodeValue.length;
                }

                // Process the end only if not normalized.
                if (!self.collapsed) {
                    // Find out if the start is pointing to a text node that
                    // will be normalized.
                    if (endContainer[0].nodeType == KEN.NODE_ELEMENT) {
                        child = new Node(endContainer[0].childNodes[endOffset]);

                        // In this case, move the start information to that
                        // text node.
                        if (child && child[0] && child[0].nodeType == KEN.NODE_TEXT
                            && endOffset > 0 && child[0].previousSibling.nodeType == KEN.NODE_TEXT) {
                            endContainer = child;
                            endOffset = 0;
                        }
                    }

                    // Normalize the end.
                    while (endContainer[0].nodeType == KEN.NODE_TEXT
                        && ( previous = endContainer._4e_previous() )
                        && previous[0].nodeType == KEN.NODE_TEXT) {
                        endContainer = previous;
                        endOffset += previous[0].nodeValue.length;
                    }
                }
            }

            return {
                start        : startContainer._4e_address(normalized),
                end            : self.collapsed ? null : endContainer._4e_address(normalized),
                startOffset    : startOffset,
                endOffset    : endOffset,
                normalized    : normalized,
                is2            : true        // It's a createBookmark2 bookmark.
            };
        },
        createBookmark : function(serializable) {
            var startNode,
                endNode,
                baseId,
                clone,
                self = this;
            startNode = new Node("<span></span>", null, self.document);
            startNode.attr('_ke_bookmark', 1);
            startNode.css('display', 'none');

            // For IE, it must have something inside, otherwise it may be
            // removed during DOM operations.
            startNode.html('&nbsp;');

            if (serializable) {
                baseId = S.guid('ke_bm_');
                startNode.attr('id', baseId + 'S');
            }

            // If collapsed, the endNode will not be created.
            if (!self.collapsed) {
                endNode = startNode._4e_clone();
                endNode.html('&nbsp;');

                if (serializable)
                    endNode.attr('id', baseId + 'E');

                clone = self.clone();
                clone.collapse();
                clone.insertNode(endNode);
            }

            clone = self.clone();
            clone.collapse(true);
            clone.insertNode(startNode);

            // Update the range position.
            if (endNode) {
                self.setStartAfter(startNode);
                self.setEndBefore(endNode);
            }
            else
                self.moveToPosition(startNode, KER.POSITION_AFTER_END);

            return {
                startNode : serializable ? baseId + 'S' : startNode,
                endNode : serializable ? baseId + 'E' : endNode,
                serializable : serializable
            };
        },
        moveToPosition : function(node, position) {
            var self = this;
            self.setStartAt(node, position);
            self.collapse(true);
        },
        trim : function(ignoreStart, ignoreEnd) {
            var self = this,startContainer = self.startContainer,
                startOffset = self.startOffset,
                collapsed = self.collapsed;
            if (( !ignoreStart || collapsed )
                && startContainer[0] && startContainer[0].nodeType == KEN.NODE_TEXT) {
                // If the offset is zero, we just insert the new node before
                // the start.
                if (!startOffset) {
                    startOffset = startContainer._4e_index();
                    startContainer = startContainer.parent();
                }
                // If the offset is at the end, we'll insert it after the text
                // node.
                else if (startOffset >= startContainer[0].nodeValue.length) {
                    startOffset = startContainer._4e_index() + 1;
                    startContainer = startContainer.parent();
                }
                // In other case, we split the text node and insert the new
                // node at the split point.
                else {
                    var nextText = startContainer._4e_splitText(startOffset);

                    startOffset = startContainer._4e_index() + 1;
                    startContainer = startContainer.parent();

                    // Check all necessity of updating the end boundary.
                    if (DOM._4e_equals(self.startContainer, self.endContainer))
                        self.setEnd(nextText, self.endOffset - self.startOffset);
                    else if (DOM._4e_equals(startContainer, self.endContainer))
                        self.endOffset += 1;
                }

                self.setStart(startContainer, startOffset);

                if (collapsed) {
                    self.collapse(true);
                    return;
                }
            }

            var endContainer = self.endContainer,endOffset = self.endOffset;

            if (!( ignoreEnd || collapsed )
                && endContainer[0] && endContainer[0].nodeType == KEN.NODE_TEXT) {
                // If the offset is zero, we just insert the new node before
                // the start.
                if (!endOffset) {
                    endOffset = endContainer._4e_index();
                    endContainer = endContainer.parent();
                }
                // If the offset is at the end, we'll insert it after the text
                // node.
                else if (endOffset >= endContainer.nodeValue.length) {
                    endOffset = endContainer._4e_index() + 1;
                    endContainer = endContainer.parent();
                }
                // In other case, we split the text node and insert the new
                // node at the split point.
                else {
                    endContainer._4e_splitText(endOffset);

                    endOffset = endContainer._4e_index() + 1;
                    endContainer = endContainer.parent();
                }

                self.setEnd(endContainer, endOffset);
            }
        },

        insertNode : function(node) {
            var self = this;
            self.optimizeBookmark();
            self.trim(false, true);
            var startContainer = self.startContainer,
                startOffset = self.startOffset,
                nextNode = startContainer[0].childNodes[startOffset];
            self.optimizeBookmark();
            self.trim(false, true);


            if (nextNode) {
                DOM.insertBefore(node[0] || node, nextNode);
            } else
                startContainer[0].appendChild(node[0] || node);

            // Check if we need to update the end boundary.
            if (DOM._4e_equals(node.parent(), self.endContainer))
                self.endOffset++;

            // Expand the range to embrace the new node.
            self.setStartBefore(node);
        },

        moveToBookmark : function(bookmark) {
            // Created with createBookmark2().
            var self = this;
            if (bookmark.is2) {
                // Get the start information.
                var startContainer = getByAddress(self.document, bookmark.start, bookmark.normalized),
                    startOffset = bookmark.startOffset,
                    endContainer = bookmark.end && getByAddress(self.document, bookmark.end, bookmark.normalized),
                    endOffset = bookmark.endOffset;

                // Set the start boundary.
                self.setStart(startContainer, startOffset);

                // Set the end boundary. If not available, collapse it.
                if (endContainer)
                    self.setEnd(endContainer, endOffset);
                else
                    self.collapse(true);
            } else {
                // Created with createBookmark().
                var serializable = bookmark.serializable,
                    startNode = serializable ? S.one("#" + bookmark.startNode, self.document) : bookmark.startNode,
                    endNode = serializable ? S.one("#" + bookmark.endNode, self.document) : bookmark.endNode;

                // Set the range start at the bookmark start node position.
                self.setStartBefore(startNode);

                // Remove it, because it may interfere in the setEndBefore call.
                startNode.remove();

                // Set the range end at the bookmark end node position, or simply
                // collapse it if it is not available.
                if (endNode && endNode[0]) {
                    self.setEndBefore(endNode);
                    endNode.remove();
                }
                else
                    self.collapse(true);
            }
        },
        getCommonAncestor : function(includeSelf, ignoreTextNode) {
            var self = this,start = self.startContainer,
                end = self.endContainer,
                ancestor;

            if (DOM._4e_equals(start, end)) {
                if (includeSelf
                    && start[0].nodeType == KEN.NODE_ELEMENT
                    && self.startOffset == self.endOffset - 1)
                    ancestor = new Node(start[0].childNodes[self.startOffset]);
                else
                    ancestor = start;
            }
            else
                ancestor = start._4e_commonAncestor(end);

            return ignoreTextNode && ancestor[0].nodeType == KEN.NODE_TEXT
                ? ancestor.parent() : ancestor;
        },
        enlarge : function(unit) {
            var self = this;
            switch (unit) {
                case KER.ENLARGE_ELEMENT :

                    if (self.collapsed)
                        return;

                    // Get the common ancestor.
                    var commonAncestor = self.getCommonAncestor(), body = new Node(self.document.body),
                        // For each boundary
                        //		a. Depending on its position, find out the first node to be checked (a sibling) or, if not available, to be enlarge.
                        //		b. Go ahead checking siblings and enlarging the boundary as much as possible until the common ancestor is not reached. After reaching the common ancestor, just save the enlargeable node to be used later.

                        startTop, endTop,
                        enlargeable, sibling, commonReached,

                        // Indicates that the node can be added only if whitespace
                        // is available before it.
                        needsWhiteSpace = false, isWhiteSpace, siblingText,

                        // Process the start boundary.

                        container = self.startContainer,
                        offset = self.startOffset;

                    if (container[0].nodeType == KEN.NODE_TEXT) {
                        if (offset) {
                            // Check if there is any non-space text before the
                            // offset. Otherwise, container is null.
                            container = !S.trim(container[0].nodeValue.substring(0, offset)).length && container;

                            // If we found only whitespace in the node, it
                            // means that we'll need more whitespace to be able
                            // to expand. For example, <i> can be expanded in
                            // "A <i> [B]</i>", but not in "A<i> [B]</i>".
                            needsWhiteSpace = !!container;
                        }

                        if (container) {
                            if (!( sibling = container[0].previousSibling ))
                                enlargeable = container.parent();
                        }
                    }
                    else {
                        // If we have offset, get the node preceeding it as the
                        // first sibling to be checked.
                        if (offset)
                            sibling = container[0].childNodes[offset - 1] || container[0].lastChild;

                        // If there is no sibling, mark the container to be
                        // enlarged.
                        if (!sibling)
                            enlargeable = container;
                    }

                    while (enlargeable || sibling) {
                        if (enlargeable && !sibling) {
                            // If we reached the common ancestor, mark the flag
                            // for it.
                            if (!commonReached && DOM._4e_equals(enlargeable, commonAncestor))
                                commonReached = true;

                            if (!body._4e_contains(enlargeable))
                                break;

                            // If we don't need space or this element breaks
                            // the line, then enlarge it.
                            if (!needsWhiteSpace || enlargeable.css('display') != 'inline') {
                                needsWhiteSpace = false;

                                // If the common ancestor has been reached,
                                // we'll not enlarge it immediately, but just
                                // mark it to be enlarged later if the end
                                // boundary also enlarges it.
                                if (commonReached)
                                    startTop = enlargeable;
                                else
                                    this.setStartBefore(enlargeable);
                            }

                            sibling = enlargeable[0].previousSibling;
                        }

                        // Check all sibling nodes preceeding the enlargeable
                        // node. The node wil lbe enlarged only if none of them
                        // blocks it.
                        while (sibling) {
                            // This flag indicates that this node has
                            // whitespaces at the end.
                            isWhiteSpace = false;

                            if (sibling.nodeType == KEN.NODE_TEXT) {
                                siblingText = sibling.nodeValue;

                                if (/[^\s\ufeff]/.test(siblingText))
                                    sibling = null;

                                isWhiteSpace = /[\s\ufeff]$/.test(siblingText);
                            }
                            else {
                                // If this is a visible element.
                                // We need to check for the bookmark attribute because IE insists on
                                // rendering the display:none nodes we use for bookmarks. (#3363)
                                if (sibling.offsetWidth > 0 && !sibling.getAttribute('_ke_bookmark')) {
                                    // We'll accept it only if we need
                                    // whitespace, and this is an inline
                                    // element with whitespace only.
                                    if (needsWhiteSpace && dtd.$removeEmpty[ sibling.nodeName.toLowerCase() ]) {
                                        // It must contains spaces and inline elements only.

                                        siblingText = DOM.text(sibling);

                                        if ((/[^\s\ufeff]/).test(siblingText))    // Spaces + Zero Width No-Break Space (U+FEFF)
                                            sibling = null;
                                        else {
                                            var allChildren = sibling.all || sibling.getElementsByTagName('*');
                                            for (var i = 0, child; child = allChildren[ i++ ];) {
                                                if (!dtd.$removeEmpty[ child.nodeName.toLowerCase() ]) {
                                                    sibling = null;
                                                    break;
                                                }
                                            }
                                        }

                                        if (sibling)
                                            isWhiteSpace = !!siblingText.length;
                                    }
                                    else
                                        sibling = null;
                                }
                            }

                            // A node with whitespaces has been found.
                            if (isWhiteSpace) {
                                // Enlarge the last enlargeable node, if we
                                // were waiting for spaces.
                                if (needsWhiteSpace) {
                                    if (commonReached)
                                        startTop = enlargeable;
                                    else if (enlargeable)
                                        this.setStartBefore(enlargeable);
                                }
                                else
                                    needsWhiteSpace = true;
                            }

                            if (sibling) {
                                var next = sibling.previousSibling;

                                if (!enlargeable && !next) {
                                    // Set the sibling as enlargeable, so it's
                                    // parent will be get later outside this while.
                                    enlargeable = new Node(sibling);
                                    sibling = null;
                                    break;
                                }

                                sibling = next;
                            }
                            else {
                                // If sibling has been set to null, then we
                                // need to stop enlarging.
                                enlargeable = null;
                            }
                        }

                        if (enlargeable)
                            enlargeable = enlargeable.parent();
                    }

                    // Process the end boundary. This is basically the same
                    // code used for the start boundary, with small changes to
                    // make it work in the opposite side (to the right). This
                    // makes it difficult to reuse the code here. So, fixes to
                    // the above code are likely to be replicated here.

                    container = self.endContainer;
                    offset = self.endOffset;

                    // Reset the common variables.
                    enlargeable = sibling = null;
                    commonReached = needsWhiteSpace = false;

                    if (container[0].nodeType == KEN.NODE_TEXT) {
                        // Check if there is any non-space text after the
                        // offset. Otherwise, container is null.
                        container = !S.trim(container[0].nodeValue.substring(offset)).length && container;

                        // If we found only whitespace in the node, it
                        // means that we'll need more whitespace to be able
                        // to expand. For example, <i> can be expanded in
                        // "A <i> [B]</i>", but not in "A<i> [B]</i>".
                        needsWhiteSpace = !( container && container[0].nodeValue.length );

                        if (container) {
                            if (!( sibling = container[0].nextSibling ))
                                enlargeable = container.parent();
                        }
                    }
                    else {
                        // Get the node right after the boudary to be checked
                        // first.
                        sibling = container[0].childNodes[offset];

                        if (!sibling)
                            enlargeable = container;
                    }

                    while (enlargeable || sibling) {
                        if (enlargeable && !sibling) {
                            if (!commonReached && DOM._4e_equals(enlargeable, commonAncestor))
                                commonReached = true;

                            if (!body._4e_contains(enlargeable))
                                break;

                            if (!needsWhiteSpace || enlargeable.css('display') != 'inline') {
                                needsWhiteSpace = false;

                                if (commonReached)
                                    endTop = enlargeable;
                                else if (enlargeable)
                                    this.setEndAfter(enlargeable);
                            }

                            sibling = enlargeable[0].nextSibling;
                        }

                        while (sibling) {
                            isWhiteSpace = false;

                            if (sibling.nodeType == KEN.NODE_TEXT) {
                                siblingText = sibling.nodeValue;

                                if (/[^\s\ufeff]/.test(siblingText))
                                    sibling = null;

                                isWhiteSpace = /^[\s\ufeff]/.test(siblingText);
                            }
                            else {
                                // If this is a visible element.
                                // We need to check for the bookmark attribute because IE insists on
                                // rendering the display:none nodes we use for bookmarks. (#3363)
                                if (sibling.offsetWidth > 0 && !sibling.getAttribute('_ke_bookmark')) {
                                    // We'll accept it only if we need
                                    // whitespace, and this is an inline
                                    // element with whitespace only.
                                    if (needsWhiteSpace && dtd.$removeEmpty[ sibling.nodeName.toLowerCase() ]) {
                                        // It must contains spaces and inline elements only.

                                        siblingText = DOM.text(sibling);

                                        if ((/[^\s\ufeff]/).test(siblingText))
                                            sibling = null;
                                        else {
                                            allChildren = sibling.all || sibling.getElementsByTagName('*');
                                            for (i = 0; child = allChildren[ i++ ];) {
                                                if (!dtd.$removeEmpty[ child.nodeName.toLowerCase() ]) {
                                                    sibling = null;
                                                    break;
                                                }
                                            }
                                        }

                                        if (sibling)
                                            isWhiteSpace = !!siblingText.length;
                                    }
                                    else
                                        sibling = null;
                                }
                            }

                            if (isWhiteSpace) {
                                if (needsWhiteSpace) {
                                    if (commonReached)
                                        endTop = enlargeable;
                                    else
                                        this.setEndAfter(enlargeable);
                                }
                            }

                            if (sibling) {
                                next = sibling.nextSibling;

                                if (!enlargeable && !next) {
                                    enlargeable = new Node(sibling);
                                    sibling = null;
                                    break;
                                }

                                sibling = next;
                            }
                            else {
                                // If sibling has been set to null, then we
                                // need to stop enlarging.
                                enlargeable = null;
                            }
                        }

                        if (enlargeable)
                            enlargeable = enlargeable.parent();
                    }

                    // If the common ancestor can be enlarged by both boundaries, then include it also.
                    if (startTop && endTop) {
                        commonAncestor = startTop._4e_contains(endTop) ? endTop : startTop;
                        this.setStartBefore(commonAncestor);
                        this.setEndAfter(commonAncestor);
                    }
                    break;

                case KER.ENLARGE_BLOCK_CONTENTS:
                case KER.ENLARGE_LIST_ITEM_CONTENTS:

                    // Enlarging the start boundary.
                    var walkerRange = new KERange(self.document);

                    body = new Node(self.document.body);

                    walkerRange.setStartAt(body, KER.POSITION_AFTER_START);
                    walkerRange.setEnd(self.startContainer, self.startOffset);

                    var walker = new Walker(walkerRange),
                        blockBoundary,  // The node on which the enlarging should stop.
                        tailBr, //
                        defaultGuard = Walker.blockBoundary(
                            ( unit == KER.ENLARGE_LIST_ITEM_CONTENTS ) ? { br : 1 } : null),
                        // Record the encountered 'blockBoundary' for later use.
                        boundaryGuard = function(node) {
                            var retval = defaultGuard(node);
                            if (!retval)
                                blockBoundary = node;
                            return retval;
                        },
                        // Record the encounted 'tailBr' for later use.
                        tailBrGuard = function(node) {
                            var retval = boundaryGuard(node);
                            if (!retval && node[0] && node._4e_name() == 'br')
                                tailBr = node;
                            return retval;
                        };

                    walker.guard = boundaryGuard;

                    enlargeable = walker.lastBackward();

                    // It's the body which stop the enlarging if no block boundary found.
                    blockBoundary = blockBoundary || body;

                    // Start the range at different position by comparing
                    // the document position of it with 'enlargeable' node.
                    this.setStartAt(
                        blockBoundary,
                        blockBoundary._4e_name() != 'br' &&
                            ( !enlargeable && self.checkStartOfBlock()
                                || enlargeable && blockBoundary._4e_contains(enlargeable) ) ?
                            KER.POSITION_AFTER_START :
                            KER.POSITION_AFTER_END);

                    // Enlarging the end boundary.
                    walkerRange = self.clone();
                    walkerRange.collapse();
                    walkerRange.setEndAt(body, KER.POSITION_BEFORE_END);
                    walker = new Walker(walkerRange);

                    // tailBrGuard only used for on range end.
                    walker.guard = ( unit == KER.ENLARGE_LIST_ITEM_CONTENTS ) ?
                        tailBrGuard : boundaryGuard;
                    blockBoundary = null;
                    // End the range right before the block boundary node.

                    enlargeable = walker.lastForward();

                    // It's the body which stop the enlarging if no block boundary found.
                    blockBoundary = blockBoundary || body;

                    // Start the range at different position by comparing
                    // the document position of it with 'enlargeable' node.
                    this.setEndAt(
                        blockBoundary,
                        ( !enlargeable && self.checkEndOfBlock()
                            || enlargeable && blockBoundary._4e_contains(enlargeable) ) ?
                            KER.POSITION_BEFORE_END :
                            KER.POSITION_BEFORE_START);
                    // We must include the <br> at the end of range if there's
                    // one and we're expanding list item contents
                    if (tailBr)
                        self.setEndAfter(tailBr);
            }
        },
        checkStartOfBlock : function() {
            var self = this,startContainer = self.startContainer,
                startOffset = self.startOffset;

            // If the starting node is a text node, and non-empty before the offset,
            // then we're surely not at the start of block.
            if (startOffset && startContainer[0].nodeType == KEN.NODE_TEXT) {
                var textBefore = S.trim(startContainer[0].nodeValue.substring(0, startOffset));
                if (textBefore.length)
                    return false;
            }

            // Antecipate the trim() call here, so the walker will not make
            // changes to the DOM, which would not get reflected into this
            // range otherwise.
            self.trim();

            // We need to grab the block element holding the start boundary, so
            // let's use an element path for it.
            var path = new ElementPath(self.startContainer);

            // Creates a range starting at the block start until the range start.
            var walkerRange = self.clone();
            walkerRange.collapse(true);
            walkerRange.setStartAt(path.block || path.blockLimit, KER.POSITION_AFTER_START);

            var walker = new Walker(walkerRange);
            walker.evaluator = getCheckStartEndBlockEvalFunction(true);

            return walker.checkBackward();
        },

        checkEndOfBlock : function() {
            var self = this,endContainer = self.endContainer,
                endOffset = self.endOffset;

            // If the ending node is a text node, and non-empty after the offset,
            // then we're surely not at the end of block.
            if (endContainer[0].nodeType == KEN.NODE_TEXT) {
                var textAfter = S.trim(endContainer[0].nodeValue.substring(endOffset));
                if (textAfter.length)
                    return false;
            }

            // Antecipate the trim() call here, so the walker will not make
            // changes to the DOM, which would not get reflected into this
            // range otherwise.
            self.trim();

            // We need to grab the block element holding the start boundary, so
            // let's use an element path for it.
            var path = new ElementPath(self.endContainer);

            // Creates a range starting at the block start until the range start.
            var walkerRange = self.clone();
            walkerRange.collapse(false);
            walkerRange.setEndAt(path.block || path.blockLimit, KER.POSITION_BEFORE_END);

            var walker = new Walker(walkerRange);
            walker.evaluator = getCheckStartEndBlockEvalFunction(false);

            return walker.checkForward();
        },
        deleteContents:function() {
            if (this.collapsed)
                return;
            this.execContentsAction(0);
        },
        extractContents : function() {
            var docFrag = this.document.createDocumentFragment();
            if (!this.collapsed)
                this.execContentsAction(1, docFrag);
            return docFrag;
        },
        /**
         * Check whether current range is on the inner edge of the specified element.
         * @param {Number} checkType ( CKEDITOR.START | CKEDITOR.END ) The checking side.
         * @param {Node} element The target element to check.
         */
        checkBoundaryOfElement : function(element, checkType) {
            var walkerRange = this.clone();
            // Expand the range to element boundary.
            walkerRange[ checkType == KER.START ?
                'setStartAt' : 'setEndAt' ]
                (element, checkType == KER.START ?
                    KER.POSITION_AFTER_START
                    : KER.POSITION_BEFORE_END);

            var walker = new Walker(walkerRange);

            walker.evaluator = elementBoundaryEval;
            return walker[ checkType == KER.START ?
                'checkBackward' : 'checkForward' ]();
        },

        getBoundaryNodes : function() {
            var self = this,startNode = self.startContainer,
                endNode = self.endContainer,
                startOffset = self.startOffset,
                endOffset = self.endOffset,
                childCount;

            if (startNode[0].nodeType == KEN.NODE_ELEMENT) {
                childCount = startNode[0].childNodes.length;
                if (childCount > startOffset)
                    startNode = new Node(startNode[0].childNodes[startOffset]);
                else if (childCount < 1)
                    startNode = startNode._4e_previousSourceNode();
                else        // startOffset > childCount but childCount is not 0
                {
                    // Try to take the node just after the current position.
                    startNode = startNode[0];
                    while (startNode.lastChild)
                        startNode = startNode.lastChild;
                    startNode = new Node(startNode);

                    // Normally we should take the next node in DFS order. But it
                    // is also possible that we've already reached the end of
                    // document.
                    startNode = startNode._4e_nextSourceNode() || startNode;
                }
            }

            if (endNode[0].nodeType == KEN.NODE_ELEMENT) {
                childCount = endNode[0].childNodes.length;
                if (childCount > endOffset)
                    endNode = new Node(endNode[0].childNodes[endOffset])._4e_previousSourceNode(true);
                else if (childCount < 1)
                    endNode = endNode._4e_previousSourceNode();
                else        // endOffset > childCount but childCount is not 0
                {
                    // Try to take the node just before the current position.
                    endNode = endNode[0];
                    while (endNode.lastChild)
                        endNode = endNode.lastChild;
                    endNode = new Node(endNode);
                }
            }

            // Sometimes the endNode will come right before startNode for collapsed
            // ranges. Fix it. (#3780)
            if (startNode._4e_position(endNode) & KEP.POSITION_FOLLOWING)
                startNode = endNode;

            return { startNode : startNode, endNode : endNode };
        },
        fixBlock : function(isStart, blockTag) {
            var self = this,bookmark = self.createBookmark(),
                fixedBlock = new Node(self.document.createElement(blockTag));

            self.collapse(isStart);

            self.enlarge(KER.ENLARGE_BLOCK_CONTENTS);
            fixedBlock[0].appendChild(self.extractContents());
            fixedBlock._4e_trim();

            if (!UA.ie)
                fixedBlock._4e_appendBogus();

            self.insertNode(fixedBlock);

            self.moveToBookmark(bookmark);

            return fixedBlock;
        },
        splitBlock : function(blockTag) {
            var self = this,startPath = new ElementPath(self.startContainer),
                endPath = new ElementPath(self.endContainer),
                startBlockLimit = startPath.blockLimit,
                endBlockLimit = endPath.blockLimit,
                startBlock = startPath.block,
                endBlock = endPath.block,
                elementPath = null;
            // Do nothing if the boundaries are in different block limits.
            if (startBlockLimit[0] !== endBlockLimit[0])
                return null;

            // Get or fix current blocks.
            if (blockTag != 'br') {
                if (!startBlock) {
                    startBlock = self.fixBlock(true, blockTag);
                    endBlock = new ElementPath(self.endContainer).block;
                }

                if (!endBlock)
                    endBlock = self.fixBlock(false, blockTag);
            }

            // Get the range position.
            var isStartOfBlock = startBlock && self.checkStartOfBlock(),
                isEndOfBlock = endBlock && self.checkEndOfBlock();

            // Delete the current contents.
            // TODO: Why is 2.x doing CheckIsEmpty()?
            self.deleteContents();

            if (startBlock && DOM._4e_equals(startBlock, endBlock)) {
                if (isEndOfBlock) {
                    elementPath = new ElementPath(self.startContainer);
                    self.moveToPosition(endBlock, KER.POSITION_AFTER_END);
                    endBlock = null;
                }
                else if (isStartOfBlock) {
                    elementPath = new ElementPath(self.startContainer);
                    self.moveToPosition(startBlock, KER.POSITION_BEFORE_START);
                    startBlock = null;
                }
                else {
                    endBlock = self.splitElement(startBlock);

                    // In Gecko, the last child node must be a bogus <br>.
                    // Note: bogus <br> added under <ul> or <ol> would cause
                    // lists to be incorrectly rendered.
                    if (!UA.ie && !S.inArray(startBlock._4e_name(), ['ul', 'ol']))
                        startBlock._4e_appendBogus();
                }
            }

            return {
                previousBlock : startBlock,
                nextBlock : endBlock,
                wasStartOfBlock : isStartOfBlock,
                wasEndOfBlock : isEndOfBlock,
                elementPath : elementPath
            };
        },
        splitElement : function(toSplit) {
            var self = this;
            if (!self.collapsed)
                return null;

            // Extract the contents of the block from the selection point to the end
            // of its contents.
            self.setEndAt(toSplit, KER.POSITION_BEFORE_END);
            var documentFragment = self.extractContents(),

                // Duplicate the element after it.
                clone = toSplit._4e_clone(false);

            // Place the extracted contents into the duplicated element.
            clone[0].appendChild(documentFragment);
            clone.insertAfter(toSplit);
            self.moveToPosition(toSplit, KER.POSITION_AFTER_END);
            return clone;
        },
        moveToElementEditablePosition : function(el, isMoveToEnd) {
            var self = this,isEditable,xhtml_dtd = KE.XHTML_DTD;

            // Empty elements are rejected.
            if (xhtml_dtd.$empty[ el._4e_name() ])
                return false;

            while (el && el[0].nodeType == KEN.NODE_ELEMENT) {
                isEditable = el._4e_isEditable();

                // If an editable element is found, move inside it.
                if (isEditable)
                    self.moveToPosition(el, isMoveToEnd ?
                        KER.POSITION_BEFORE_END :
                        KER.POSITION_AFTER_START);
                // Stop immediately if we've found a non editable inline element (e.g <img>).
                else if (xhtml_dtd.$inline[ el._4e_name() ]) {
                    self.moveToPosition(el, isMoveToEnd ?
                        KER.POSITION_AFTER_END :
                        KER.POSITION_BEFORE_START);
                    return true;
                }

                // Non-editable non-inline elements are to be bypassed, getting the next one.
                if (xhtml_dtd.$empty[ el._4e_name() ])
                    el = el[ isMoveToEnd ? '_4e_previous' : '_4e_next' ](nonWhitespaceOrBookmarkEval);
                else
                    el = el[ isMoveToEnd ? '_4e_last' : '_4e_first' ](nonWhitespaceOrBookmarkEval);

                // Stop immediately if we've found a text node.
                if (el && el[0].nodeType == KEN.NODE_TEXT) {
                    self.moveToPosition(el, isMoveToEnd ?
                        KER.POSITION_AFTER_END :
                        KER.POSITION_BEFORE_START);
                    return true;
                }
            }

            return isEditable;
        },

        selectNodeContents : function(node) {
            this.setStart(node, 0);
            this.setEnd(node, node[0].nodeType == KEN.NODE_TEXT ?
                node[0].nodeValue.length :
                node[0].childNodes.length);
        }
    });
    var inlineChildReqElements = { abbr:1,acronym:1,b:1,bdo:1,big:1,cite:1,code:1,del:1,dfn:1,em:1,font:1,i:1,ins:1,label:1,kbd:1,q:1,samp:1,small:1,span:1,strike:1,strong:1,sub:1,sup:1,tt:1,u:1,'var':1 };

    // Evaluator for CKEDITOR.dom.element::checkBoundaryOfElement, reject any
    // text node and non-empty elements unless it's being bookmark text.
    function elementBoundaryEval(node) {
        // Reject any text node unless it's being bookmark
        // OR it's spaces. (#3883)
        //如果不是文本节点并且是空的，可以继续取下一个判断边界
        var c1 = node[0].nodeType != KEN.NODE_TEXT
            && node._4e_name() in dtd.$removeEmpty,
            //文本为空，可以继续取下一个判断边界
            c2 = !S.trim(node[0].nodeValue),
            //恩，进去了书签，可以继续取下一个判断边界
            c3 = !!node.parent().attr('_ke_bookmark');
        return c1 || c2 || c3;
    }

    var whitespaceEval = new Walker.whitespaces(),
        bookmarkEval = new Walker.bookmark();

    function nonWhitespaceOrBookmarkEval(node) {
        // Whitespaces and bookmark nodes are to be ignored.
        return !whitespaceEval(node) && !bookmarkEval(node);
    }

    function getCheckStartEndBlockEvalFunction(isStart) {
        var hadBr = false, bookmarkEvaluator = Walker.bookmark(true);
        return function(node) {
            // First ignore bookmark nodes.
            if (bookmarkEvaluator(node))
                return true;

            if (node[0].nodeType == KEN.NODE_TEXT) {
                // If there's any visible text, then we're not at the start.
                if (S.trim(node[0].nodeValue).length)
                    return false;
            }
            else if (node[0].nodeType == KEN.NODE_ELEMENT) {
                // If there are non-empty inline elements (e.g. <img />), then we're not
                // at the start.
                if (!inlineChildReqElements[ node._4e_name() ]) {
                    // If we're working at the end-of-block, forgive the first <br /> in non-IE
                    // browsers.
                    if (!isStart && !UA.ie && node._4e_name() == 'br' && !hadBr)
                        hadBr = true;
                    else
                        return false;
                }
            }
            return true;
        };
    }

    function bookmark(contentOnly, isReject) {
        function isBookmarkNode(node) {
            return ( node && node.nodeName == 'span'
                && node.getAttribute('_ke_bookmark') );
        }

        return function(node) {
            var isBookmark, parent;
            // Is bookmark inner text node?
            isBookmark = ( node && !node.nodeName && ( parent = node.parentNode )
                && isBookmarkNode(parent) );
            // Is bookmark node?
            isBookmark = contentOnly ? isBookmark : isBookmark || isBookmarkNode(node);
            return isReject ^ isBookmark;
        };
    }

    function whitespaces(isReject) {
        return function(node) {
            node = node[0] || node;
            var isWhitespace = node && ( node.nodeType == KEN.NODE_TEXT )
                && !S.trim(node.nodeValue);
            return isReject ^ isWhitespace;
        };
    }


    KE.Range = KERange;
});
/**
 * modified from ckeditor ,dom iterator implementation using walker and nextSourceNode
 * @modifier: <yiminghe@gmail.com(chengyu)>
 */
KISSY.Editor.add("domiterator", function(KE) {
    var S = KISSY,
        UA = S.UA,
        Walker = KE.Walker,
        KERange = KE.Range,KER = KE.RANGE,
        KEN = KE.NODE,
        ElementPath = KE.ElementPath,
        Node = S.Node,
        DOM = S.DOM;

    function Iterator(range) {
        if (arguments.length < 1)
            return;

        this.range = range;
        this.forceBrBreak = false;

        // Whether include <br>s into the enlarged range.(#3730).
        this.enlargeBr = true;
        this.enforceRealBlocks = false;

        this._ || ( this._ = {} );
    }

    var beginWhitespaceRegex = /^[\r\n\t ]*$/,///^[\r\n\t ]+$/,//+:*??不匹配空串
        isBookmark = Walker.bookmark();

    S.augment(Iterator, {
        getNextParagraph : function(blockTag) {
            // The block element to be returned.
            var block;

            // The range object used to identify the paragraph contents.
            var range;

            // Indicats that the current element in the loop is the last one.
            var isLast;

            // Instructs to cleanup remaining BRs.
            var removePreviousBr, removeLastBr;

            // This is the first iteration. Let's initialize it.
            if (!this._.lastNode) {
                range = this.range.clone();
                range.enlarge(this.forceBrBreak || !this.enlargeBr ?
                    KER.ENLARGE_LIST_ITEM_CONTENTS : KER.ENLARGE_BLOCK_CONTENTS);

                var walker = new Walker(range),
                    ignoreBookmarkTextEvaluator = Walker.bookmark(true, true);
                // Avoid anchor inside bookmark inner text.
                walker.evaluator = ignoreBookmarkTextEvaluator;
                this._.nextNode = walker.next();
                // TODO: It's better to have walker.reset() used here.
                walker = new Walker(range);
                walker.evaluator = ignoreBookmarkTextEvaluator;
                var lastNode = walker.previous();
                this._.lastNode = lastNode._4e_nextSourceNode(true);

                // We may have an empty text node at the end of block due to [3770].
                // If that node is the lastNode, it would cause our logic to leak to the
                // next block.(#3887)
                if (this._.lastNode &&
                    this._.lastNode[0].nodeType == KEN.NODE_TEXT &&
                    !S.trim(this._.lastNode[0].nodeValue) &&
                    this._.lastNode.parent()._4e_isBlockBoundary()) {
                    var testRange = new KERange(range.document);
                    testRange.moveToPosition(this._.lastNode, KER.POSITION_AFTER_END);
                    if (testRange.checkEndOfBlock()) {
                        var path = new ElementPath(testRange.endContainer);
                        var lastBlock = path.block || path.blockLimit;
                        this._.lastNode = lastBlock._4e_nextSourceNode(true);
                    }
                }

                // Probably the document end is reached, we need a marker node.
                if (!this._.lastNode) {
                    this._.lastNode = this._.docEndMarker = new Node(range.document.createTextNode(''));
                    DOM.insertAfter(this._.lastNode[0], lastNode[0]);
                }

                // Let's reuse this variable.
                range = null;
            }

            var currentNode = this._.nextNode;
            lastNode = this._.lastNode;

            this._.nextNode = null;
            while (currentNode) {
                // closeRange indicates that a paragraph boundary has been found,
                // so the range can be closed.
                var closeRange = false;

                // includeNode indicates that the current node is good to be part
                // of the range. By default, any non-element node is ok for it.
                var includeNode = ( currentNode[0].nodeType != KEN.NODE_ELEMENT ),
                    continueFromSibling = false;

                // If it is an element node, let's check if it can be part of the
                // range.
                if (!includeNode) {
                    var nodeName = currentNode._4e_name();

                    if (currentNode._4e_isBlockBoundary(this.forceBrBreak && { br : 1 })) {
                        // <br> boundaries must be part of the range. It will
                        // happen only if ForceBrBreak.
                        if (nodeName == 'br')
                            includeNode = true;
                        else if (!range && !currentNode[0].childNodes.length && nodeName != 'hr') {
                            // If we have found an empty block, and haven't started
                            // the range yet, it means we must return this block.
                            block = currentNode;
                            isLast = currentNode._4e_equals(lastNode);
                            break;
                        }

                        // The range must finish right before the boundary,
                        // including possibly skipped empty spaces. (#1603)
                        if (range) {
                            range.setEndAt(currentNode, KER.POSITION_BEFORE_START);

                            // The found boundary must be set as the next one at this
                            // point. (#1717)
                            if (nodeName != 'br')
                                this._.nextNode = currentNode;
                        }

                        closeRange = true;
                    } else {
                        // If we have child nodes, let's check them.
                        if (currentNode[0].firstChild) {
                            // If we don't have a range yet, let's start it.
                            if (!range) {
                                range = new KERange(this.range.document);
                                range.setStartAt(currentNode, KER.POSITION_BEFORE_START);
                            }

                            currentNode = new Node(currentNode[0].firstChild);
                            continue;
                        }
                        includeNode = true;
                    }
                }
                else if (currentNode[0].nodeType == KEN.NODE_TEXT) {
                    // Ignore normal whitespaces (i.e. not including &nbsp; or
                    // other unicode whitespaces) before/after a block node.
                    if (beginWhitespaceRegex.test(currentNode[0].nodeValue))
                        includeNode = false;
                }

                // The current node is good to be part of the range and we are
                // starting a new range, initialize it first.
                if (includeNode && !range) {
                    range = new KERange(this.range.document);
                    range.setStartAt(currentNode, KER.POSITION_BEFORE_START);
                }

                // The last node has been found.
                isLast = ( !closeRange || includeNode ) && currentNode._4e_equals(lastNode);

                // If we are in an element boundary, let's check if it is time
                // to close the range, otherwise we include the parent within it.
                if (range && !closeRange) {
                    while (!currentNode[0].nextSibling && !isLast) {
                        var parentNode = currentNode.parent();

                        if (parentNode._4e_isBlockBoundary(this.forceBrBreak && { br : 1 })) {
                            closeRange = true;
                            isLast = isLast || parentNode._4e_equals(lastNode);
                            break;
                        }

                        currentNode = parentNode;
                        includeNode = true;
                        isLast = currentNode._4e_equals(lastNode);
                        continueFromSibling = true;
                    }
                }

                // Now finally include the node.
                if (includeNode)
                    range.setEndAt(currentNode, KER.POSITION_AFTER_END);

                currentNode = currentNode._4e_nextSourceNode(continueFromSibling, null, lastNode);
                isLast = !currentNode;

                // We have found a block boundary. Let's close the range and move out of the
                // loop.
                if (( closeRange || isLast ) && range) {
                    var boundaryNodes = range.getBoundaryNodes(),
                        startPath = new ElementPath(range.startContainer);

                    // Drop the range if it only contains bookmark nodes, and is
                    // not because of the original collapsed range. (#4087,#4450)
                    if (boundaryNodes.startNode.parent()._4e_equals(startPath.blockLimit)
                        && isBookmark(boundaryNodes.startNode) && isBookmark(boundaryNodes.endNode)) {
                        range = null;
                        this._.nextNode = null;
                    }
                    else
                        break;
                }

                if (isLast)
                    break;

            }

            // Now, based on the processed range, look for (or create) the block to be returned.
            if (!block) {
                // If no range has been found, this is the end.
                if (!range) {
                    this._.docEndMarker && this._.docEndMarker.remove();
                    this._.nextNode = null;
                    return null;
                }

                startPath = new ElementPath(range.startContainer);
                var startBlockLimit = startPath.blockLimit,
                    checkLimits = { div : 1, th : 1, td : 1 };
                block = startPath.block;

                if ((!block || !block[0])
                    && !this.enforceRealBlocks
                    && checkLimits[ startBlockLimit._4e_name() ]
                    && range.checkStartOfBlock()
                    && range.checkEndOfBlock())
                    block = startBlockLimit;
                else if (!block || ( this.enforceRealBlocks && block._4e_name() == 'li' )) {
                    // Create the fixed block.
                    block = new Node(this.range.document.createElement(blockTag || 'p'));
                    // Move the contents of the temporary range to the fixed block.
                    block[0].appendChild(range.extractContents());
                    block._4e_trim();
                    // Insert the fixed block into the DOM.
                    range.insertNode(block);
                    removePreviousBr = removeLastBr = true;
                }
                else if (block._4e_name() != 'li') {
                    // If the range doesn't includes the entire contents of the
                    // block, we must split it, isolating the range in a dedicated
                    // block.
                    if (!range.checkStartOfBlock() || !range.checkEndOfBlock()) {
                        // The resulting block will be a clone of the current one.
                        block = block._4e_clone(false);

                        // Extract the range contents, moving it to the new block.
                        block[0].appendChild(range.extractContents());
                        block._4e_trim();

                        // Split the block. At this point, the range will be in the
                        // right position for our intents.
                        var splitInfo = range.splitBlock();

                        removePreviousBr = !splitInfo.wasStartOfBlock;
                        removeLastBr = !splitInfo.wasEndOfBlock;

                        // Insert the new block into the DOM.
                        range.insertNode(block);
                    }
                }
                else if (!isLast) {
                    // LIs are returned as is, with all their children (due to the
                    // nested lists). But, the next node is the node right after
                    // the current range, which could be an <li> child (nested
                    // lists) or the next sibling <li>.

                    this._.nextNode = ( block._4e_equals(lastNode) ? null :
                        range.getBoundaryNodes().endNode._4e_nextSourceNode(true, null, lastNode) );
                }
            }

            if (removePreviousBr) {
                var previousSibling = new Node(block[0].previousSibling);
                if (previousSibling[0] && previousSibling[0].nodeType == KEN.NODE_ELEMENT) {
                    if (previousSibling._4e_name() == 'br')
                        previousSibling._4e_remove();
                    else if (previousSibling[0].lastChild && previousSibling[0].lastChild.nodeName.toLowerCase() == 'br')
                        DOM._4e_remove(previousSibling[0].lastChild);
                }
            }

            if (removeLastBr) {
                // Ignore bookmark nodes.(#3783)
                var bookmarkGuard = Walker.bookmark(false, true);

                var lastChild = new Node(block[0].lastChild);
                if (lastChild[0] && lastChild[0].nodeType == KEN.NODE_ELEMENT && lastChild._4e_name() == 'br') {
                    // Take care not to remove the block expanding <br> in non-IE browsers.
                    if (UA.ie
                        || lastChild._4e_previous(bookmarkGuard)
                        || lastChild._4e_next(bookmarkGuard))
                        lastChild._4e_remove();
                }
            }

            // Get a reference for the next element. This is important because the
            // above block can be removed or changed, so we can rely on it for the
            // next interation.
            if (!this._.nextNode) {
                this._.nextNode = ( isLast || block._4e_equals(lastNode) ) ? null :
                    block._4e_nextSourceNode(true, null, lastNode);
            }

            return block;
        }
    });

    KERange.prototype.createIterator = function() {
        return new Iterator(this);
    };
});
/**
 * modified from ckeditor core plugin : selection
 * @modifier: <yiminghe@gmail.com(chengyu)>
 */
KISSY.Editor.add("selection", function(KE) {
    KE.SELECTION = {};
    var S = KISSY,
        UA = S.UA,
        DOM = S.DOM,
        Event = S.Event,
        tryThese = KE.Utils.tryThese,
        Node = S.Node,
        KES = KE.SELECTION,
        KER = KE.RANGE,
        KEN = KE.NODE,
        //EventTarget = S.EventTarget,
        Walker = KE.Walker,
        //ElementPath = KE.ElementPath,
        KERange = KE.Range;
    /**
     * No selection.
     * @constant
     * @example
     * if ( editor.getSelection().getType() == CKEDITOR.SELECTION_NONE )
     *     alert( 'Nothing is selected' );
     */
    KES.SELECTION_NONE = 1;

    /**
     * Text or collapsed selection.
     * @constant
     * @example
     * if ( editor.getSelection().getType() == CKEDITOR.SELECTION_TEXT )
     *     alert( 'Text is selected' );
     */
    KES.SELECTION_TEXT = 2;

    /**
     * Element selection.
     * @constant
     * @example
     * if ( editor.getSelection().getType() == CKEDITOR.SELECTION_ELEMENT )
     *     alert( 'An element is selected' );
     */
    KES.SELECTION_ELEMENT = 3;
    function KESelection(document) {
        var self = this;
        self.document = document;
        self._ = {
            cache : {}
        };

        /**
         * IE BUG: The selection's document may be a different document than the
         * editor document. Return null if that's the case.
         */
        if (UA.ie) {
            var range = self.getNative().createRange();
            if (!range
                || ( range.item && range.item(0).ownerDocument != document )
                || ( range.parentElement && range.parentElement().ownerDocument != document )) {
                self.isInvalid = true;
            }
        }
    }

    var styleObjectElements = {
        img:1,hr:1,li:1,table:1,tr:1,td:1,th:1,embed:1,object:1,ol:1,ul:1,
        a:1, input:1, form:1, select:1, textarea:1, button:1, fieldset:1, thead:1, tfoot:1
    };

    S.augment(KESelection, {


        /**
         * Gets the native selection object from the browser.
         * @function
         * @returns {Object} The native selection object.
         * @example
         * var selection = editor.getSelection().<b>getNative()</b>;
         */
        getNative :
            UA.ie ?
                function() {
                    return this._.cache.nativeSel || ( this._.cache.nativeSel = this.document.selection );
                }
                :
                function() {
                    return this._.cache.nativeSel || ( this._.cache.nativeSel = DOM._4e_getWin(this.document).getSelection() );
                },

        /**
         * Gets the type of the current selection. The following values are
         * available:
         * <ul>
         *        <li> SELECTION_NONE (1): No selection.</li>
         *        <li> SELECTION_TEXT (2): Text is selected or
         *            collapsed selection.</li>
         *        <li> SELECTION_ELEMENT (3): A element
         *            selection.</li>
         * </ul>
         * @function
         * @returns {Number} One of the following constant values:
         *         SELECTION_NONE,  SELECTION_TEXT or
         *         SELECTION_ELEMENT.
         * @example
         * if ( editor.getSelection().<b>getType()</b> == SELECTION_TEXT )
         *     alert( 'Text is selected' );
         */
        getType :
            UA.ie ?
                function() {
                    var cache = this._.cache;
                    if (cache.type)
                        return cache.type;

                    var type = KES.SELECTION_NONE;

                    try {
                        var sel = this.getNative(),
                            ieType = sel.type;

                        if (ieType == 'Text')
                            type = KES.SELECTION_TEXT;

                        if (ieType == 'Control')
                            type = KES.SELECTION_ELEMENT;

                        // It is possible that we can still get a text range
                        // object even when type == 'None' is returned by IE.
                        // So we'd better check the object returned by
                        // createRange() rather than by looking at the type.
                        if (sel.createRange().parentElement)
                            type = KES.SELECTION_TEXT;
                    }
                    catch(e) {
                    }

                    return ( cache.type = type );
                }
                :
                function() {
                    var cache = this._.cache;
                    if (cache.type)
                        return cache.type;

                    var type = KES.SELECTION_TEXT,
                        sel = this.getNative();

                    if (!sel)
                        type = KES.SELECTION_NONE;
                    else if (sel.rangeCount == 1) {
                        // Check if the actual selection is a control (IMG,
                        // TABLE, HR, etc...).

                        var range = sel.getRangeAt(0),
                            startContainer = range.startContainer;

                        if (startContainer == range.endContainer
                            && startContainer.nodeType == KEN.NODE_ELEMENT
                            && ( range.endOffset - range.startOffset ) === 1
                            && styleObjectElements[ startContainer.childNodes[ range.startOffset ].nodeName.toLowerCase() ]) {
                            type = KES.SELECTION_ELEMENT;
                        }
                    }

                    return ( cache.type = type );
                },

        getRanges :
            UA.ie ?
                ( function() {
                    // Finds the container and offset for a specific boundary
                    // of an IE range.
                    var getBoundaryInformation = function(range, start) {
                        // Creates a collapsed range at the requested boundary.
                        range = range.duplicate();
                        range.collapse(start);

                        // Gets the element that encloses the range entirely.
                        var parent = range.parentElement(), siblings = parent.childNodes,
                            testRange;

                        for (var i = 0; i < siblings.length; i++) {
                            var child = siblings[ i ];
                            //console.log("child:" + child.nodeType == KEN.NODE_ELEMENT ?
                            //    ("el: " + child.innerHTML) : ("text:" + child.nodeValue));
                            if (child.nodeType == KEN.NODE_ELEMENT) {
                                testRange = range.duplicate();

                                testRange.moveToElementText(child);

                                var comparisonStart = testRange.compareEndPoints('StartToStart', range),
                                    comparisonEnd = testRange.compareEndPoints('EndToStart', range);

                                testRange.collapse();
                                //中间有其他标签
                                if (comparisonStart > 0)
                                    break;
                                // When selection stay at the side of certain self-closing elements, e.g. BR,
                                // our comparison will never shows an equality. (#4824)
                                else if (!comparisonStart
                                    || comparisonEnd == 1 && comparisonStart == -1)
                                    return { container : parent, offset : i };
                                else if (!comparisonEnd)
                                    return { container : parent, offset : i + 1 };

                                testRange = null;
                            }
                        }

                        if (!testRange) {
                            testRange = range.duplicate();
                            testRange.moveToElementText(parent);
                            testRange.collapse(false);
                        }

                        testRange.setEndPoint('StartToStart', range);
                        // IE report line break as CRLF with range.text but
                        // only LF with textnode.nodeValue, normalize them to avoid
                        // breaking character counting logic below. (#3949)
                        var distance = testRange.text.replace(/(\r\n|\r)/g, '\n').length;

                        try {
                            while (distance > 0)
                                //bug? 可能不是文本节点 nodeValue undefined
                                //永远不会出现 textnode<img/>textnode
                                //停止时，前面一定为textnode
                                distance -= siblings[ --i ].nodeValue.length;
                        }
                            // Measurement in IE could be somtimes wrong because of <select> element. (#4611)
                        catch(e) {
                            distance = 0;
                        }


                        if (distance === 0) {
                            return {
                                container : parent,
                                offset : i
                            };
                        }
                        else {
                            return {
                                container : siblings[ i ],
                                offset : -distance
                            };
                        }
                    };

                    return function() {
                        var cache = this._.cache;
                        if (cache.ranges)
                            return cache.ranges;

                        // IE doesn't have range support (in the W3C way), so we
                        // need to do some magic to transform selections into
                        // CKEDITOR.dom.range instances.

                        var sel = this.getNative(),
                            nativeRange = sel && sel.createRange(),
                            type = this.getType(),
                            range;

                        if (!sel)
                            return [];

                        if (type == KES.SELECTION_TEXT) {
                            range = new KERange(this.document);
                            var boundaryInfo = getBoundaryInformation(nativeRange, true);
                            range.setStart(new Node(boundaryInfo.container), boundaryInfo.offset);
                            boundaryInfo = getBoundaryInformation(nativeRange);
                            range.setEnd(new Node(boundaryInfo.container), boundaryInfo.offset);
                            return ( cache.ranges = [ range ] );
                        }
                        else if (type == KES.SELECTION_ELEMENT) {
                            var retval = this._.cache.ranges = [];

                            for (var i = 0; i < nativeRange.length; i++) {
                                var element = nativeRange.item(i),
                                    parentElement = element.parentNode,
                                    j = 0;

                                range = new KERange(this.document);

                                for (; j < parentElement.childNodes.length && parentElement.childNodes[j] != element; j++) { /*jsl:pass*/
                                }

                                range.setStart(new Node(parentElement), j);
                                range.setEnd(new Node(parentElement), j + 1);
                                retval.push(range);
                            }

                            return retval;
                        }

                        return ( cache.ranges = [] );
                    };
                })()
                :
                function() {
                    var cache = this._.cache;
                    if (cache.ranges)
                        return cache.ranges;

                    // On browsers implementing the W3C range, we simply
                    // tranform the native ranges in CKEDITOR.dom.range
                    // instances.

                    var ranges = [], sel = this.getNative();

                    if (!sel)
                        return [];

                    for (var i = 0; i < sel.rangeCount; i++) {
                        var nativeRange = sel.getRangeAt(i), range = new KERange(this.document);

                        range.setStart(new Node(nativeRange.startContainer), nativeRange.startOffset);
                        range.setEnd(new Node(nativeRange.endContainer), nativeRange.endOffset);
                        ranges.push(range);
                    }

                    return ( cache.ranges = ranges );
                },

        /**
         * Gets the DOM element in which the selection starts.
         * @returns {Node} The element at the beginning of the
         *        selection.
         * @example
         * var element = editor.getSelection().<b>getStartElement()</b>;
         * alert( element.getName() );
         */
        getStartElement : function() {
            var cache = this._.cache;
            if (cache.startElement !== undefined)
                return cache.startElement;

            var node,
                sel = this.getNative();

            switch (this.getType()) {
                case KES.SELECTION_ELEMENT :
                    return this.getSelectedElement();

                case KES.SELECTION_TEXT :

                    var range = this.getRanges()[0];

                    if (range) {
                        if (!range.collapsed) {
                            range.optimize();

                            // Decrease the range content to exclude particial
                            // selected node on the start which doesn't have
                            // visual impact. ( #3231 )
                            while (true) {
                                var startContainer = range.startContainer,
                                    startOffset = range.startOffset;
                                // Limit the fix only to non-block elements.(#3950)
                                if (startOffset == ( startContainer[0].childNodes ?
                                    startContainer[0].childNodes.length : startContainer[0].nodeValue.length )
                                    && !startContainer._4e_isBlockBoundary())
                                    range.setStartAfter(startContainer);
                                else break;
                            }

                            node = range.startContainer;

                            if (node[0].nodeType != KEN.NODE_ELEMENT)
                                return node.parent();

                            node = new Node(node[0].childNodes[range.startOffset]);

                            if (!node[0] || node[0].nodeType != KEN.NODE_ELEMENT)
                                return range.startContainer;

                            var child = node[0].firstChild;
                            while (child && child.nodeType == KEN.NODE_ELEMENT) {
                                node = new Node(child);
                                child = child.firstChild;
                            }
                            return node;
                        }
                    }

                    if (UA.ie) {
                        range = sel.createRange();
                        range.collapse(true);
                        node = range.parentElement();
                    }
                    else {
                        node = sel.anchorNode;
                        if (node && node.nodeType != KEN.NODE_ELEMENT)
                            node = node.parentNode;
                    }
            }

            return cache.startElement = ( node ? new Node(node) : null );
        },

        /**
         * Gets the current selected element.
         * @returns {Node} The selected element. Null if no
         *        selection is available or the selection type is not
         *       SELECTION_ELEMENT.
         * @example
         * var element = editor.getSelection().<b>getSelectedElement()</b>;
         * alert( element.getName() );
         */
        getSelectedElement : function() {
            var cache = this._.cache;
            if (cache.selectedElement !== undefined)
                return cache.selectedElement;

            var self = this, node = tryThese(
                // Is it native IE control type selection?
                function() {
                    return self.getNative().createRange().item(0);
                },
                // Figure it out by checking if there's a single enclosed
                // node of the range.
                function() {
                    var range = self.getRanges()[ 0 ],
                        enclosed,
                        selected;

                    // Check first any enclosed element, e.g. <ul>[<li><a href="#">item</a></li>]</ul>
                    for (var i = 2; i && !( ( enclosed = range.getEnclosedNode() )
                        && ( enclosed[0].nodeType == KEN.NODE_ELEMENT )
                        && styleObjectElements[ enclosed._4e_name() ]
                        && ( selected = enclosed ) ); i--) {
                        // Then check any deep wrapped element, e.g. [<b><i><img /></i></b>]
                        range.shrink(KER.SHRINK_ELEMENT);
                    }

                    return  selected[0];
                });

            return cache.selectedElement = ( node ? new Node(node) : null );
        },



        reset : function() {
            this._.cache = {};
        },

        selectElement : function(element) {
            var range;
            if (UA.ie) {
                this.getNative().empty();
                try {
                    // Try to select the node as a control.
                    range = this.document.body.createControlRange();
                    range.addElement(element[0]);
                    range.select();
                }
                catch(e) {
                    // If failed, select it as a text range.
                    range = this.document.body.createTextRange();
                    range.moveToElementText(element[0]);
                    range.select();
                }
                finally {
                    //this.document.fire('selectionchange');
                }
                this.reset();
            }
            else {
                // Create the range for the element.
                range = this.document.createRange();
                range.selectNode(element[0]);
                // Select the range.
                var sel = this.getNative();
                sel.removeAllRanges();
                sel.addRange(range);
                this.reset();
            }
        },

        selectRanges : function(ranges) {

            if (UA.ie) {
                // IE doesn't accept multiple ranges selection, so we just
                // select the first one.
                if (ranges[ 0 ])
                    ranges[ 0 ].select();

                this.reset();
            }
            else {
                var sel = this.getNative();
                if (!sel) return;
                sel.removeAllRanges();
                for (var i = 0; i < ranges.length; i++) {
                    var range = ranges[ i ], nativeRange = this.document.createRange(),startContainer = range.startContainer;

                    // In FF2, if we have a collapsed range, inside an empty
                    // element, we must add something to it otherwise the caret
                    // will not be visible.
                    if (range.collapsed &&
                        ( UA.gecko && UA.gecko < 1.0900 ) &&
                        startContainer[0].nodeType == KEN.NODE_ELEMENT &&
                        !startContainer[0].childNodes.length) {
                        startContainer[0].appendChild(this.document.createTextNode(""));
                    }
                    nativeRange.setStart(startContainer[0], range.startOffset);
                    nativeRange.setEnd(range.endContainer[0], range.endOffset);
                    // Select the range.
                    sel.addRange(nativeRange);
                }
                this.reset();
            }
        },
        createBookmarks2 : function(normalized) {
            var bookmarks = [],
                ranges = this.getRanges();

            for (var i = 0; i < ranges.length; i++)
                bookmarks.push(ranges[i].createBookmark2(normalized));

            return bookmarks;
        },
        createBookmarks : function(serializable) {
            var retval = [],
                ranges = this.getRanges(),
                length = ranges.length,
                bookmark;
            for (var i = 0; i < length; i++) {
                retval.push(bookmark = ranges[ i ].createBookmark(serializable, true));

                serializable = bookmark.serializable;

                var bookmarkStart = serializable ? S.one("#" + bookmark.startNode) : bookmark.startNode,
                    bookmarkEnd = serializable ? S.one("#" + bookmark.endNode) : bookmark.endNode;

                // Updating the offset values for rest of ranges which have been mangled(#3256).
                for (var j = i + 1; j < length; j++) {
                    var dirtyRange = ranges[ j ],
                        rangeStart = dirtyRange.startContainer,
                        rangeEnd = dirtyRange.endContainer;

                    DOM._4e_equals(rangeStart, bookmarkStart.parent()) && dirtyRange.startOffset++;
                    DOM._4e_equals(rangeStart, bookmarkEnd.parent()) && dirtyRange.startOffset++;
                    DOM._4e_equals(rangeEnd, bookmarkStart.parent()) && dirtyRange.endOffset++;
                    DOM._4e_equals(rangeEnd, bookmarkEnd.parent()) && dirtyRange.endOffset++;
                }
            }

            return retval;
        },

        selectBookmarks : function(bookmarks) {
            var ranges = [];
            for (var i = 0; i < bookmarks.length; i++) {
                var range = new KERange(this.document);
                range.moveToBookmark(bookmarks[i]);
                ranges.push(range);
            }
            this.selectRanges(ranges);
            return this;
        },

        getCommonAncestor : function() {
            var ranges = this.getRanges(),
                startNode = ranges[ 0 ].startContainer,
                endNode = ranges[ ranges.length - 1 ].endContainer;
            return startNode._4e_commonAncestor(endNode);
        },

        // Moving scroll bar to the current selection's start position.
        scrollIntoView : function() {
            // If we have split the block, adds a temporary span at the
            // range position and scroll relatively to it.
            var start = this.getStartElement();
            start.scrollIntoView();
        }
    });


    KE.Selection = KESelection;
    var nonCells = { table:1,tbody:1,tr:1 }, notWhitespaces = Walker.whitespaces(true), fillerTextRegex = /\ufeff|\u00a0/;
    KERange.prototype.select = UA.ie ?
        // V2
        function(forceExpand) {
            var self = this,
                collapsed = self.collapsed,isStartMarkerAlone,dummySpan;

            // IE doesn't support selecting the entire table row/cell, move the selection into cells, e.g.
            // <table><tbody><tr>[<td>cell</b></td>... => <table><tbody><tr><td>[cell</td>...
            if (self.startContainer[0].nodeType == KEN.NODE_ELEMENT && self.startContainer._4e_name() in nonCells
                || self.endContainer[0].nodeType == KEN.NODE_ELEMENT && self.endContainer._4e_name() in nonCells) {
                self.shrink(KEN.NODE_ELEMENT, true);
            }

            var bookmark = self.createBookmark(),

                // Create marker tags for the start and end boundaries.
                startNode = bookmark.startNode,endNode;
            if (!collapsed)
                endNode = bookmark.endNode;

            // Create the main range which will be used for the selection.
            var ieRange = this.document.body.createTextRange();

            // Position the range at the start boundary.

            ieRange.moveToElementText(startNode[0]);

            ieRange.moveStart('character', 1);

            if (endNode) {
                // Create a tool range for the end.
                var ieRangeEnd = self.document.body.createTextRange();

                // Position the tool range at the end.
                ieRangeEnd.moveToElementText(endNode[0]);

                // Move the end boundary of the main range to match the tool range.
                ieRange.setEndPoint('EndToEnd', ieRangeEnd);
                ieRange.moveEnd('character', -1);
            }
            else {
                // The isStartMarkerAlone logic comes from V2. It guarantees that the lines
                // will expand and that the cursor will be blinking on the right place.
                // Actually, we are using this flag just to avoid using this hack in all
                // situations, but just on those needed.
                var next = startNode[0].nextSibling;
                while (next && !notWhitespaces(next)) {
                    next = next.nextSibling;
                }
                isStartMarkerAlone =
                    (
                        !( next && next.nodeValue && next.nodeValue.match(fillerTextRegex) )     // already a filler there?
                            && ( forceExpand
                            ||
                            !startNode[0].previousSibling
                            ||
                            (
                                startNode[0].previousSibling &&
                                    DOM._4e_name(startNode[0].previousSibling) == 'br'
                                )
                            )
                        );

                // Append a temporary <span>&#65279;</span> before the selection.
                // This is needed to avoid IE destroying selections inside empty
                // inline elements, like <b></b> (#253).
                // It is also needed when placing the selection right after an inline
                // element to avoid the selection moving inside of it.
                dummySpan = self.document.createElement('span');
                dummySpan.innerHTML = '&#65279;';	// Zero Width No-Break Space (U+FEFF). See #1359.
                dummySpan = new Node(dummySpan);

                DOM.insertBefore(dummySpan[0], startNode[0]);

                if (isStartMarkerAlone) {
                    // To expand empty blocks or line spaces after <br>, we need
                    // instead to have any char, which will be later deleted using the
                    // selection.
                    // \ufeff = Zero Width No-Break Space (U+FEFF). (#1359)
                    DOM.insertBefore(self.document.createTextNode('\ufeff'), startNode[0]);
                }
            }

            // Remove the markers (reset the position, because of the changes in the DOM tree).
            self.setStartBefore(startNode);
            startNode._4e_remove();

            if (collapsed) {
                if (isStartMarkerAlone) {
                    // Move the selection start to include the temporary \ufeff.
                    ieRange.moveStart('character', -1);
                    ieRange.select();
                    // Remove our temporary stuff.
                    self.document.selection.clear();
                } else
                    ieRange.select();
                if (dummySpan) {
                    this.moveToPosition(dummySpan, KER.POSITION_BEFORE_START);
                    dummySpan._4e_remove();
                }
            }
            else {
                self.setEndBefore(endNode);
                endNode.remove();
                ieRange.select();
            }

            // this.document.fire('selectionchange');
        } : function() {
        var self = this,startContainer = self.startContainer;

        // If we have a collapsed range, inside an empty element, we must add
        // something to it, otherwise the caret will not be visible.
        if (self.collapsed && startContainer[0].nodeType == KEN.NODE_ELEMENT && !startContainer[0].childNodes.length)
            startContainer[0].appendChild(self.document.createTextNode(""));

        var nativeRange = self.document.createRange();
        nativeRange.setStart(startContainer[0], self.startOffset);

        try {
            nativeRange.setEnd(self.endContainer[0], self.endOffset);
        } catch (e) {
            // There is a bug in Firefox implementation (it would be too easy
            // otherwise). The new start can't be after the end (W3C says it can).
            // So, let's create a new range and collapse it to the desired point.
            if (e.toString().indexOf('NS_ERROR_ILLEGAL_VALUE') >= 0) {
                self.collapse(true);
                nativeRange.setEnd(self.endContainer[0], self.endOffset);
            }
            else
                throw( e );
        }

        var selection = getSelection(self.document).getNative();
        selection.removeAllRanges();
        selection.addRange(nativeRange);
    };


    function getSelection(doc) {
        var sel = new KESelection(doc);
        return ( !sel || sel.isInvalid ) ? null : sel;
    }

    /**
     * 监控选择区域变化
     * @param editor
     */
    function monitorAndFix(editor) {
        var doc = editor.document,
            body = new Node(doc.body),
            html = new Node(doc.documentElement);

        if (UA.ie) {
            //wokao,ie 焦点管理不行啊
            // In IE6/7 the blinking cursor appears, but contents are
            // not editable. (#5634)
            //终于和ck同步了，我也发现了这个bug，哈哈,ck3.3.2解决
            if (UA.ie < 8 ||
                //ie8 的 7 兼容模式
                document.documentMode == 7) {
                // The 'click' event is not fired when clicking the
                // scrollbars, so we can use it to check whether
                // the empty space following <body> has been clicked.
                html.on('click', function(evt) {
                    if (DOM._4e_name(evt.target) === "html")
                        editor.getSelection().getRanges()[ 0 ].select();
                });
            }


            // Other browsers don't loose the selection if the
            // editor document loose the focus. In IE, we don't
            // have support for it, so we reproduce it here, other
            // than firing the selection change event.

            var savedRange,
                saveEnabled;

            // "onfocusin" is fired before "onfocus". It makes it
            // possible to restore the selection before click
            // events get executed.
            body.on('focusin', function(evt) {
                // If there are elements with layout they fire this event but
                // it must be ignored to allow edit its contents #4682
                if (evt.target.nodeName.toUpperCase() != 'BODY')
                    return;

                // If we have saved a range, restore it at this
                // point.
                if (savedRange) {
                    // Well not break because of this.
                    try {
                        savedRange.select();
                    }
                    catch (e) {
                    }

                    savedRange = null;
                }
            });

            body.on('focus', function() {
                // Enable selections to be saved.
                saveEnabled = true;
                saveSelection();
            });

            body.on('beforedeactivate', function(evt) {
                // Ignore this event if it's caused by focus switch between
                // internal editable control type elements, e.g. layouted paragraph. (#4682)
                if (evt.relatedTarget)
                    return;

                // Disable selections from being saved.
                saveEnabled = false;
            });

            // IE before version 8 will leave cursor blinking inside the document after
            // editor blurred unless we clean up the selection. (#4716)
            if (UA.ie < 8) {
                Event.on(DOM._4e_getWin(doc), 'blur', function() {
                    doc.selection.empty();
                });
            }

            // IE fires the "selectionchange" event when clicking
            // inside a selection. We don't want to capture that.
            body.on('mousedown', disableSave);
            body.on('mouseup', function() {
                saveEnabled = true;
                setTimeout(function() {
                    saveSelection(true);
                },
                    0);
            });

            body.on('keydown', disableSave);
            body.on('keyup', function() {
                saveEnabled = true;
                saveSelection();
            });


            // IE is the only to provide the "selectionchange"
            // event.
            Event.on(doc, 'selectionchange', saveSelection);

            function disableSave() {
                saveEnabled = false;
            }

            function saveSelection(testIt) {
                if (saveEnabled) {
                    var doc = editor.document,
                        sel = editor.getSelection(),
                        nativeSel = sel && sel.getNative();

                    // There is a very specific case, when clicking
                    // inside a text selection. In that case, the
                    // selection collapses at the clicking point,
                    // but the selection object remains in an
                    // unknown state, making createRange return a
                    // range at the very start of the document. In
                    // such situation we have to test the range, to
                    // be sure it's valid.
                    if (testIt && nativeSel && nativeSel.type == 'None') {
                        // The "InsertImage" command can be used to
                        // test whether the selection is good or not.
                        // If not, it's enough to give some time to
                        // IE to put things in order for us.
                        if (!doc.queryCommandEnabled('InsertImage')) {
                            setTimeout(function() {
                                saveSelection(true);
                            }, 50);
                            return;
                        }
                    }

                    // Avoid saving selection from within text input. (#5747)
                    var parentTag;
                    if (nativeSel && nativeSel.type == 'Text'
                        && ( parentTag = nativeSel.createRange().parentElement().nodeName.toLowerCase() )
                        && parentTag in { input: 1, textarea : 1 }) {
                        return;
                    }
                    savedRange = nativeSel && sel.getRanges()[ 0 ];
                    editor._monitor();
                }
            }


        } else {
            // In other browsers, we make the selection change
            // check based on other events, like clicks or keys
            // press.
            Event.on(doc, 'mouseup', editor._monitor, editor);
            Event.on(doc, 'keyup', editor._monitor, editor);
        }
    }

    KE.on("instanceCreated", function(ev) {
        var editor = ev.editor;
        monitorAndFix(editor);
    });
});
/**
 * modified from ckeditor for kissy editor,use style to gen element and wrap range's elements
 * @modifier: <yiminghe@gmail.com(chengyu)>
 */
KISSY.Editor.add("styles", function(KE) {

    var S = KISSY,
        DOM = S.DOM,
        KEST = KE.STYLE = {},
        KER = KE.RANGE,
        KESelection = KE.Selection,
        KEN = KE.NODE,
        KEP = KE.POSITION,
        KERange = KE.Range,
        //Walker = KE.Walker,
        Node = S.Node,
        UA = S.UA,
        ElementPath = KE.ElementPath,
        blockElements = { address:1,div:1,h1:1,h2:1,h3:1,h4:1,h5:1,h6:1,p:1,pre:1 },
        objectElements = {
            //why? a should be same to inline? 但是不能互相嵌套
            //a:1,
            embed:1,hr:1,img:1,li:1,object:1,ol:1,table:1,td:1,tr:1,th:1,ul:1,dl:1,dt:1,dd:1,form:1},
        semicolonFixRegex = /\s*(?:;\s*|$)/,
        varRegex = /#\((.+?)\)/g;

    KEST.STYLE_BLOCK = 1;
    KEST.STYLE_INLINE = 2;
    KEST.STYLE_OBJECT = 3;


    function replaceVariables(list, variablesValues) {
        for (var item in list) {
            list[ item ] = list[ item ].replace(varRegex, function(match, varName) {
                return variablesValues[ varName ];
            });
        }
    }

    function KEStyle(styleDefinition, variablesValues) {
        if (variablesValues) {
            styleDefinition = S.clone(styleDefinition);
            replaceVariables(styleDefinition.attributes, variablesValues);
            replaceVariables(styleDefinition.styles, variablesValues);
        }

        var element = this.element = ( styleDefinition.element || '*' ).toLowerCase();

        this.type = ( element == '#' || blockElements[ element ] ) ?
            KEST.STYLE_BLOCK
            : objectElements[ element ] ?
            KEST.STYLE_OBJECT : KEST.STYLE_INLINE;

        this._ = {
            definition : styleDefinition
        };
    }

    function applyStyle(document, remove) {
        // Get all ranges from the selection.

        var func = remove ? this.removeFromRange : this.applyToRange,self = this;
        // Apply the style to the ranges.
        //ie select 选中期间document得不到range
        document.body.focus();
        var selection = new KESelection(document),ranges = selection.getRanges();
        for (var i = 0; i < ranges.length; i++)
            //格式化后，range进入格式标签内
            func.call(self, ranges[ i ]);
        // Select the ranges again.
        selection.selectRanges(ranges);

    }

    KEStyle.prototype = {
        apply : function(document) {
            applyStyle.call(this, document, false);
        },

        remove : function(document) {
            applyStyle.call(this, document, true);
        },

        applyToRange : function(range) {
            var self = this;
            return ( self.applyToRange =
                this.type == KEST.STYLE_INLINE ?
                    applyInlineStyle
                    : self.type == KEST.STYLE_BLOCK ?
                    applyBlockStyle
                    : self.type == KEST.STYLE_OBJECT ?
                    null
                    //yiminghe note:no need!
                    //applyObjectStyle
                    : null ).call(self, range);
        },

        removeFromRange : function(range) {
            var self = this;
            return ( self.removeFromRange =
                self.type == KEST.STYLE_INLINE ?
                    removeInlineStyle
                    : null ).call(self, range);
        },

        applyToObject : function(element) {
            setupElement(element, this);
        },
        // Checks if an element, or any of its attributes, is removable by the
        // current style definition.
        checkElementRemovable : function(element, fullMatch) {
            if (!element)
                return false;

            var def = this._.definition,
                attribs;

            // If the element name is the same as the style name.
            if (element._4e_name() == this.element) {
                // If no attributes are defined in the element.
                if (!fullMatch && !element._4e_hasAttributes())
                    return true;

                attribs = getAttributesForComparison(def);

                if (attribs._length) {
                    for (var attName in attribs) {
                        if (attName == '_length')
                            continue;

                        var elementAttr = element.attr(attName) || '';
                        if (attName == 'style' ?
                            compareCssText(attribs[ attName ], normalizeCssText(elementAttr, false))
                            : attribs[ attName ] == elementAttr) {
                            if (!fullMatch)
                                return true;
                        }
                        else if (fullMatch)
                            return false;
                    }
                    if (fullMatch)
                        return true;
                }
                else
                    return true;
            }

            // Check if the element can be somehow overriden.
            var override = getOverrides(this)[ element._4e_name() ];
            if (override) {
                // If no attributes have been defined, remove the element.
                if (!( attribs = override.attributes ))
                    return true;

                for (var i = 0; i < attribs.length; i++) {
                    attName = attribs[i][0];
                    var actualAttrValue = element.attr(attName);
                    if (actualAttrValue) {
                        var attValue = attribs[i][1];

                        // Remove the attribute if:
                        //    - The override definition value is null;
                        //    - The override definition value is a string that
                        //      matches the attribute value exactly.
                        //    - The override definition value is a regex that
                        //      has matches in the attribute value.
                        if (attValue === null ||
                            ( typeof attValue == 'string' && actualAttrValue == attValue ) ||
                            attValue.test(actualAttrValue))
                            return true;
                    }
                }
            }
            return false;
        },

        /**
         * Get the style state inside an element path. Returns "true" if the
         * element is active in the path.
         */
        checkActive : function(elementPath) {
            switch (this.type) {
                case KEST.STYLE_BLOCK :
                    return this.checkElementRemovable(elementPath.block || elementPath.blockLimit, true);

                case KEST.STYLE_OBJECT :
                case KEST.STYLE_INLINE :

                    var elements = elementPath.elements;

                    for (var i = 0, element; i < elements.length; i++) {
                        element = elements[ i ];

                        if (this.type == KEST.STYLE_INLINE
                            && ( DOM._4e_equals(element, elementPath.block)
                            || DOM._4e_equals(element, elementPath.blockLimit) ))
                            continue;

                        if (this.type == KEST.STYLE_OBJECT
                            && !( element._4e_name() in objectElements ))
                            continue;

                        if (this.checkElementRemovable(element, true))
                            return true;
                    }
            }
            return false;
        }

    };

    KEStyle.getStyleText = function(styleDefinition) {
        // If we have already computed it, just return it.
        var stylesDef = styleDefinition._ST;
        if (stylesDef)
            return stylesDef;

        stylesDef = styleDefinition.styles;

        // Builds the StyleText.
        var stylesText = ( styleDefinition.attributes && styleDefinition.attributes[ 'style' ] ) || '',
            specialStylesText = '';

        if (stylesText.length)
            stylesText = stylesText.replace(semicolonFixRegex, ';');

        for (var style in stylesDef) {
            var styleVal = stylesDef[ style ],
                text = ( style + ':' + styleVal ).replace(semicolonFixRegex, ';');

            // Some browsers don't support 'inherit' property value, leave them intact. (#5242)
            if (styleVal == 'inherit')
                specialStylesText += text;
            else
                stylesText += text;
        }

        // Browsers make some changes to the style when applying them. So, here
        // we normalize it to the browser format.
        if (stylesText.length)
            stylesText = normalizeCssText(stylesText);

        stylesText += specialStylesText;

        // Return it, saving it to the next request.
        return ( styleDefinition._ST = stylesText );
    };

    function getElement(style, targetDocument) {
        var el,
            //def = style._.definition,
            elementName = style.element;

        // The "*" element name will always be a span for this function.
        if (elementName == '*')
            elementName = 'span';

        // Create the element.
        el = new Node(targetDocument.createElement(elementName));

        return setupElement(el, style);
    }

    function setupElement(el, style) {
        var def = style._.definition,attributes = def.attributes,styles = KEStyle.getStyleText(def);

        // Assign all defined attributes.
        if (attributes) {
            for (var att in attributes) {
                el.attr(att, attributes[ att ]);
            }
        }

        // Assign all defined styles.

        if (styles)
            el[0].style.cssText = styles;

        return el;
    }

    function applyBlockStyle(range) {
        // Serializible bookmarks is needed here since
        // elements may be merged.
        var bookmark = range.createBookmark(true),iterator = range.createIterator();
        iterator.enforceRealBlocks = true;

        // make recognize <br /> tag as a separator in ENTER_BR mode (#5121)
        //if (this._.enterMode)
        iterator.enlargeBr = true;//( this._.enterMode != CKEDITOR.ENTER_BR );

        var block, doc = range.document;
        // Only one =
        while (( block = iterator.getNextParagraph() )) {
            var newBlock = getElement(this, doc);
            replaceBlock(block, newBlock);
        }
        range.moveToBookmark(bookmark);
    }

    // Wrapper function of String::replace without considering of head/tail bookmarks nodes.
    function replace(str, regexp, replacement) {
        var headBookmark = '',
            tailBookmark = '';

        str = str.replace(/(^<span[^>]+_ke_bookmark.*?\/span>)|(<span[^>]+_ke_bookmark.*?\/span>$)/gi,
            function(str, m1, m2) {
                m1 && ( headBookmark = m1 );
                m2 && ( tailBookmark = m2 );
                return '';
            });
        return headBookmark + str.replace(regexp, replacement) + tailBookmark;
    }

    /**
     * Converting from a non-PRE block to a PRE block in formatting operations.
     */
    function toPre(block, newBlock) {
        // First trim the block content.
        var preHtml = block.html();

        // 1. Trim head/tail spaces, they're not visible.
        preHtml = replace(preHtml, /(?:^[ \t\n\r]+)|(?:[ \t\n\r]+$)/g, '');
        // 2. Delete ANSI whitespaces immediately before and after <BR> because
        //    they are not visible.
        preHtml = preHtml.replace(/[ \t\r\n]*(<br[^>]*>)[ \t\r\n]*/gi, '$1');
        // 3. Compress other ANSI whitespaces since they're only visible as one
        //    single space previously.
        // 4. Convert &nbsp; to spaces since &nbsp; is no longer needed in <PRE>.
        preHtml = preHtml.replace(/([ \t\n\r]+|&nbsp;)/g, ' ');
        // 5. Convert any <BR /> to \n. This must not be done earlier because
        //    the \n would then get compressed.
        preHtml = preHtml.replace(/<br\b[^>]*>/gi, '\n');

        // Krugle: IE normalizes innerHTML to <pre>, breaking whitespaces.
        if (UA.ie) {
            var temp = block[0].ownerDocument.createElement('div');
            temp.appendChild(newBlock[0]);
            newBlock[0].outerHTML = '<pre>' + preHtml + '</pre>';
            newBlock = new Node(temp.firstChild);
            newBlock.remove();
        }
        else
            newBlock.html(preHtml);

        return newBlock;
    }

    /**
     * Split into multiple <pre> blocks separated by double line-break.
     * @param preBlock
     */
    function splitIntoPres(preBlock) {
        // Exclude the ones at header OR at tail,
        // and ignore bookmark content between them.
        var duoBrRegex = /(\S\s*)\n(?:\s|(<span[^>]+_ck_bookmark.*?\/span>))*\n(?!$)/gi,
            //blockName = preBlock._4e_name(),
            splittedHtml = replace(preBlock._4e_outerHtml(),
                duoBrRegex,
                function(match, charBefore, bookmark) {
                    return charBefore + '</pre>' + bookmark + '<pre>';
                });

        var pres = [];
        splittedHtml.replace(/<pre\b.*?>([\s\S]*?)<\/pre>/gi, function(match, preContent) {
            pres.push(preContent);
        });
        return pres;
    }

    // Replace the original block with new one, with special treatment
    // for <pre> blocks to make sure content format is well preserved, and merging/splitting adjacent
    // when necessary.(#3188)
    function replaceBlock(block, newBlock) {
        var newBlockIsPre = newBlock._4e_name == ('pre'),blockIsPre = block._4e_name == ('pre'),
            isToPre = newBlockIsPre && !blockIsPre, isFromPre = !newBlockIsPre && blockIsPre;

        if (isToPre)
            newBlock = toPre(block, newBlock);
        else if (isFromPre)
        // Split big <pre> into pieces before start to convert.
            newBlock = fromPres(splitIntoPres(block), newBlock);
        else
            block._4e_moveChildren(newBlock);

        block[0].parentNode.replaceChild(newBlock[0], block[0]);
        if (newBlockIsPre) {
            // Merge previous <pre> blocks.
            mergePre(newBlock);
        }
    }

    /**
     * Merge a <pre> block with a previous sibling if available.
     */
    function mergePre(preBlock) {
        var previousBlock;
        if (!( ( previousBlock = preBlock._4e_previousSourceNode(true, KEN.NODE_ELEMENT) )
            && previousBlock._4e_name() == ('pre') ))
            return;

        // Merge the previous <pre> block contents into the current <pre>
        // block.
        //
        // Another thing to be careful here is that currentBlock might contain
        // a '\n' at the beginning, and previousBlock might contain a '\n'
        // towards the end. These new lines are not normally displayed but they
        // become visible after merging.
        var mergedHtml = replace(previousBlock.html(), /\n$/, '') + '\n\n' +
            replace(preBlock.html(), /^\n/, '');

        // Krugle: IE normalizes innerHTML from <pre>, breaking whitespaces.
        if (UA.ie)
            preBlock[0].outerHTML = '<pre>' + mergedHtml + '</pre>';
        else
            preBlock.html(mergedHtml);

        previousBlock.remove();
    }

    /**
     * Converting a list of <pre> into blocks with format well preserved.
     */
    function fromPres(preHtmls, newBlock) {
        var docFrag = newBlock[0].ownerDocument.createDocumentFragment();
        for (var i = 0; i < preHtmls.length; i++) {
            var blockHtml = preHtmls[ i ];

            // 1. Trim the first and last line-breaks immediately after and before <pre>,
            // they're not visible.
            blockHtml = blockHtml.replace(/(\r\n|\r)/g, '\n');
            blockHtml = replace(blockHtml, /^[ \t]*\n/, '');
            blockHtml = replace(blockHtml, /\n$/, '');
            // 2. Convert spaces or tabs at the beginning or at the end to &nbsp;
            blockHtml = replace(blockHtml, /^[ \t]+|[ \t]+$/g, function(match, offset) {
                if (match.length == 1)    // one space, preserve it
                    return '&nbsp;';
                else if (!offset)        // beginning of block
                    return new Array(match.length).join('&nbsp;') + ' ';
                else                // end of block
                    return ' ' + new Array(match.length).join('&nbsp;');
            });

            // 3. Convert \n to <BR>.
            // 4. Convert contiguous (i.e. non-singular) spaces or tabs to &nbsp;
            blockHtml = blockHtml.replace(/\n/g, '<br>');
            blockHtml = blockHtml.replace(/[ \t]{2,}/g,
                function (match) {
                    return new Array(match.length).join('&nbsp;') + ' ';
                });

            var newBlockClone = newBlock._4e_clone();
            newBlockClone.html(blockHtml);
            docFrag.appendChild(newBlockClone[0]);
        }
        return docFrag;
    }

    function applyInlineStyle(range) {
        var document = range.document;

        if (range.collapsed) {
            // Create the element to be inserted in the DOM.
            var collapsedElement = getElement(this, document);
            // Insert the empty element into the DOM at the range position.
            range.insertNode(collapsedElement);
            // Place the selection right inside the empty element.
            range.moveToPosition(collapsedElement, KER.POSITION_BEFORE_END);
            return;
        }

        var elementName = this.element, def = this._.definition,
            isUnknownElement,

            // Get the DTD definition for the element. Defaults to "span".
            dtd = KE.XHTML_DTD[ elementName ] || ( isUnknownElement = true,KE.XHTML_DTD.span ),

            // Bookmark the range so we can re-select it after processing.
            bookmark = range.createBookmark();

        // Expand the range.

        range.enlarge(KER.ENLARGE_ELEMENT);
        range.trim();
        // Get the first node to be processed and the last, which concludes the
        // processing.
        var boundaryNodes = range.createBookmark(),
            firstNode = boundaryNodes.startNode,
            lastNode = boundaryNodes.endNode,currentNode = firstNode,
            styleRange;

        while (currentNode && currentNode[0]) {
            var applyStyle = false;

            if (DOM._4e_equals(currentNode, lastNode)) {
                currentNode = null;
                applyStyle = true;
            }
            else {
                var nodeType = currentNode[0].nodeType,
                    nodeName = nodeType == KEN.NODE_ELEMENT ? currentNode._4e_name() : null;

                if (nodeName && currentNode.attr('_ke_bookmark')) {
                    currentNode = currentNode._4e_nextSourceNode(true);
                    continue;
                }

                // Check if the current node can be a child of the style element.
                if (!nodeName || ( dtd[ nodeName ]
                    && ( currentNode._4e_position(lastNode) |
                    ( KEP.POSITION_PRECEDING | KEP.POSITION_IDENTICAL | KEP.POSITION_IS_CONTAINED) )
                    == ( KEP.POSITION_PRECEDING + KEP.POSITION_IDENTICAL + KEP.POSITION_IS_CONTAINED )
                    && ( !def.childRule || def.childRule(currentNode) ) )) {
                    var currentParent = currentNode.parent();

                    // Check if the style element can be a child of the current
                    // node parent or if the element is not defined in the DTD.
                    if (currentParent && currentParent[0]
                        && ( ( KE.XHTML_DTD[currentParent._4e_name()] || KE.XHTML_DTD.span )[ elementName ] || isUnknownElement )
                        && ( !def.parentRule || def.parentRule(currentParent) )) {
                        // This node will be part of our range, so if it has not
                        // been started, place its start right before the node.
                        // In the case of an element node, it will be included
                        // only if it is entirely inside the range.
                        if (!styleRange &&
                            ( !nodeName
                                || !KE.XHTML_DTD.$removeEmpty[ nodeName ]
                                || ( currentNode._4e_position(lastNode) |
                                ( KEP.POSITION_PRECEDING | KEP.POSITION_IDENTICAL | KEP.POSITION_IS_CONTAINED ))
                                ==
                                ( KEP.POSITION_PRECEDING + KEP.POSITION_IDENTICAL + KEP.POSITION_IS_CONTAINED )
                                )) {
                            styleRange = new KERange(document);
                            styleRange.setStartBefore(currentNode);
                        }

                        // Non element nodes, or empty elements can be added
                        // completely to the range.
                        if (nodeType == KEN.NODE_TEXT || ( nodeType == KEN.NODE_ELEMENT && !currentNode[0].childNodes.length )) {
                            var includedNode = currentNode,
                                parentNode;

                            // This node is about to be included completelly, but,
                            // if this is the last node in its parent, we must also
                            // check if the parent itself can be added completelly
                            // to the range.
                            while (!includedNode[0].nextSibling
                                && ( parentNode = includedNode.parent(),dtd[ parentNode._4e_name() ] )
                                && ( parentNode._4e_position(firstNode) | KEP.POSITION_FOLLOWING | KEP.POSITION_IDENTICAL | KEP.POSITION_IS_CONTAINED) == ( KEP.POSITION_FOLLOWING + KEP.POSITION_IDENTICAL + KEP.POSITION_IS_CONTAINED )
                                && ( !def.childRule || def.childRule(parentNode) )) {
                                includedNode = parentNode;
                            }

                            styleRange.setEndAfter(includedNode);

                            // If the included node still is the last node in its
                            // parent, it means that the parent can't be included
                            // in this style DTD, so apply the style immediately.
                            if (!includedNode[0].nextSibling)
                                applyStyle = true;

                        }
                    }
                    else
                        applyStyle = true;
                }
                else
                    applyStyle = true;

                // Get the next node to be processed.
                currentNode = currentNode._4e_nextSourceNode();
            }

            // Apply the style if we have something to which apply it.
            if (applyStyle && styleRange && !styleRange.collapsed) {
                // Build the style element, based on the style object definition.
                var styleNode = getElement(this, document),

                    // Get the element that holds the entire range.
                    parent = styleRange.getCommonAncestor();

                // Loop through the parents, removing the redundant attributes
                // from the element to be applied.
                while (styleNode && parent && styleNode[0] && parent[0]) {
                    if (parent._4e_name() == elementName) {
                        for (var attName in def.attributes) {
                            if (styleNode.attr(attName) == parent.attr(attName))
                                styleNode[0].removeAttribute(attName);
                        }
                        //bug notice add by yiminghe@gmail.com
                        //<span style="font-size:70px"><span style="font-size:30px">xcxx</span></span>
                        //下一次格式xxx为70px
                        //var exit = false;
                        for (var styleName in def.styles) {
                            if (styleNode._4e_style(styleName) == parent._4e_style(styleName)) {
                                styleNode._4e_style(styleName, "");
                            }
                        }

                        if (!styleNode._4e_hasAttributes()) {
                            styleNode = null;
                            break;
                        }
                    }

                    parent = parent.parent();
                }

                if (styleNode) {
                    // Move the contents of the range to the style element.
                    styleNode[0].appendChild(styleRange.extractContents());

                    // Here we do some cleanup, removing all duplicated
                    // elements from the style element.
                    removeFromInsideElement(this, styleNode);

                    // Insert it into the range position (it is collapsed after
                    // extractContents.
                    styleRange.insertNode(styleNode);

                    // Let's merge our new style with its neighbors, if possible.
                    styleNode._4e_mergeSiblings();

                    // As the style system breaks text nodes constantly, let's normalize
                    // things for performance.
                    // With IE, some paragraphs get broken when calling normalize()
                    // repeatedly. Also, for IE, we must normalize body, not documentElement.
                    // IE is also known for having a "crash effect" with normalize().
                    // We should try to normalize with IE too in some way, somewhere.
                    if (!UA.ie)
                        styleNode[0].normalize();
                }

                // Style applied, let's release the range, so it gets
                // re-initialization in the next loop.
                styleRange = null;
            }
        }

        firstNode.remove();
        lastNode.remove();
        range.moveToBookmark(bookmark);
        // Minimize the result range to exclude empty text nodes. (#5374)
        range.shrink(KER.SHRINK_TEXT);
    }

    function removeInlineStyle(range) {
        /*
         * Make sure our range has included all "collpased" parent inline nodes so
         * that our operation logic can be simpler.
         */
        range.enlarge(KER.ENLARGE_ELEMENT);

        var bookmark = range.createBookmark(),
            startNode = bookmark.startNode;

        if (range.collapsed) {

            var startPath = new ElementPath(startNode.parent()),
                // The topmost element in elementspatch which we should jump out of.
                boundaryElement;


            for (var i = 0, element; i < startPath.elements.length
                && ( element = startPath.elements[i] ); i++) {
                /*
                 * 1. If it's collaped inside text nodes, try to remove the style from the whole element.
                 *
                 * 2. Otherwise if it's collapsed on element boundaries, moving the selection
                 *  outside the styles instead of removing the whole tag,
                 *  also make sure other inner styles were well preserverd.(#3309)
                 */
                if (element == startPath.block || element == startPath.blockLimit)
                    break;

                if (this.checkElementRemovable(element)) {
                    var endOfElement = range.checkBoundaryOfElement(element, KER.END),
                        startOfElement = !endOfElement && range.checkBoundaryOfElement(element, KER.START);
                    if (startOfElement || endOfElement) {
                        boundaryElement = element;
                        boundaryElement.match = startOfElement ? 'start' : 'end';
                    } else {
                        /*
                         * Before removing the style node, there may be a sibling to the style node
                         * that's exactly the same to the one to be removed. To the user, it makes
                         * no difference that they're separate entities in the DOM tree. So, merge
                         * them before removal.
                         */
                        element._4e_mergeSiblings();
                        removeFromElement(this, element);

                    }
                }
            }

            // Re-create the style tree after/before the boundary element,
            // the replication start from bookmark start node to define the
            // new range.
            if (boundaryElement && boundaryElement[0]) {
                var clonedElement = startNode;
                for (i = 0; ; i++) {
                    var newElement = startPath.elements[ i ];
                    if (DOM._4e_equals(newElement, boundaryElement))
                        break;
                    // Avoid copying any matched element.
                    else if (newElement.match)
                        continue;
                    else
                        newElement = newElement._4e_clone();
                    newElement[0].appendChild(clonedElement[0]);
                    clonedElement = newElement;
                }
                DOM[ boundaryElement.match == 'start' ?
                    'insertBefore' : 'insertAfter' ](clonedElement[0], boundaryElement[0]);
            }
        } else {
            /*
             * Now our range isn't collapsed. Lets walk from the start node to the end
             * node via DFS and remove the styles one-by-one.
             */
            var endNode = bookmark.endNode,
                me = this;

            /*
             * Find out the style ancestor that needs to be broken down at startNode
             * and endNode.
             */
            function breakNodes() {
                var startPath = new ElementPath(startNode.parent()),
                    endPath = new ElementPath(endNode.parent()),
                    breakStart = null,
                    breakEnd = null;
                for (var i = 0; i < startPath.elements.length; i++) {
                    var element = startPath.elements[ i ];

                    if (element == startPath.block || element == startPath.blockLimit)
                        break;

                    if (me.checkElementRemovable(element))
                        breakStart = element;
                }
                for (i = 0; i < endPath.elements.length; i++) {
                    element = endPath.elements[ i ];

                    if (element == endPath.block || element == endPath.blockLimit)
                        break;

                    if (me.checkElementRemovable(element))
                        breakEnd = element;
                }

                if (breakEnd)
                    endNode._4e_breakParent(breakEnd);
                if (breakStart)
                    startNode._4e_breakParent(breakStart);
            }

            breakNodes();

            // Now, do the DFS walk.
            var currentNode = new Node(startNode[0].nextSibling);
            while (currentNode[0] !== endNode[0]) {
                /*
                 * Need to get the next node first because removeFromElement() can remove
                 * the current node from DOM tree.
                 */
                var nextNode = currentNode._4e_nextSourceNode();
                if (currentNode[0].nodeType == KEN.NODE_ELEMENT && this.checkElementRemovable(currentNode)) {
                    // Remove style from element or overriding element.
                    if (currentNode._4e_name() == this.element)
                        removeFromElement(this, currentNode);
                    else
                        removeOverrides(currentNode, getOverrides(this)[ currentNode._4e_name() ]);

                    /*
                     * removeFromElement() may have merged the next node with something before
                     * the startNode via mergeSiblings(). In that case, the nextNode would
                     * contain startNode and we'll have to call breakNodes() again and also
                     * reassign the nextNode to something after startNode.
                     */
                    if (nextNode[0].nodeType == KEN.NODE_ELEMENT && nextNode._4e_contains(startNode)) {
                        breakNodes();
                        nextNode = new Node(startNode[0].nextSibling);
                    }
                }
                currentNode = nextNode;
            }
        }
        range.moveToBookmark(bookmark);
    }

    // Turn inline style text properties into one hash.
    function parseStyleText(styleText) {
        var retval = {};
        styleText.replace(/&quot;/g, '"')
            .replace(/\s*([^ :;]+)\s*:\s*([^;]+)\s*(?=;|$)/g, function(match, name, value) {
            retval[ name ] = value;
        });
        return retval;
    }

    function compareCssText(source, target) {
        typeof source == 'string' && ( source = parseStyleText(source) );
        typeof target == 'string' && ( target = parseStyleText(target) );
        for (var name in source) {
            // Value 'inherit'  is treated as a wildcard,
            // which will match any value.
            if (!( name in target &&
                ( target[ name ] == source[ name ]
                    || source[ name ] == 'inherit'
                    || target[ name ] == 'inherit' ) )) {
                return false;
            }
        }
        return true;
    }

    function normalizeCssText(unparsedCssText, nativeNormalize) {
        var styleText;
        if (nativeNormalize !== false) {
            // Injects the style in a temporary span object, so the browser parses it,
            // retrieving its final format.
            var temp = document.createElement('span');
            temp.style.cssText = unparsedCssText;
            //temp.setAttribute('style', unparsedCssText);
            styleText = temp.style.cssText || '';
        }
        else
            styleText = unparsedCssText;

        // Shrinking white-spaces around colon and semi-colon (#4147).
        // Compensate tail semi-colon.
        return styleText.replace(/\s*([;:])\s*/, '$1')
            .replace(/([^\s;])$/, '$1;')
            .replace(/,\s+/g, ',')// Trimming spaces after comma (e.g. font-family name)(#4107).
            .toLowerCase();
    }

    function getAttributesForComparison(styleDefinition) {
        // If we have already computed it, just return it.
        var attribs = styleDefinition._AC;
        if (attribs)
            return attribs;

        attribs = {};

        var length = 0,

            // Loop through all defined attributes.
            styleAttribs = styleDefinition.attributes;
        if (styleAttribs) {
            for (var styleAtt in styleAttribs) {
                length++;
                attribs[ styleAtt ] = styleAttribs[ styleAtt ];
            }
        }

        // Includes the style definitions.
        var styleText = KEStyle.getStyleText(styleDefinition);
        if (styleText) {
            if (!attribs[ 'style' ])
                length++;
            attribs[ 'style' ] = styleText;
        }

        // Appends the "length" information to the object.
        attribs._length = length;

        // Return it, saving it to the next request.
        return ( styleDefinition._AC = attribs );
    }


    /**
     * Get the the collection used to compare the elements and attributes,
     * defined in this style overrides, with other element. All information in
     * it is lowercased.
     * @param  style
     */
    function getOverrides(style) {
        if (style._.overrides)
            return style._.overrides;

        var overrides = ( style._.overrides = {} ),
            definition = style._.definition.overrides;

        if (definition) {
            // The override description can be a string, object or array.
            // Internally, well handle arrays only, so transform it if needed.
            if (!S.isArray(definition))
                definition = [ definition ];

            // Loop through all override definitions.
            for (var i = 0; i < definition.length; i++) {
                var override = definition[i];
                var elementName;
                var overrideEl;
                var attrs;

                // If can be a string with the element name.
                if (typeof override == 'string')
                    elementName = override.toLowerCase();
                // Or an object.
                else {
                    elementName = override.element ? override.element.toLowerCase() : style.element;
                    attrs = override.attributes;
                }

                // We can have more than one override definition for the same
                // element name, so we attempt to simply append information to
                // it if it already exists.
                overrideEl = overrides[ elementName ] || ( overrides[ elementName ] = {} );

                if (attrs) {
                    // The returning attributes list is an array, because we
                    // could have different override definitions for the same
                    // attribute name.
                    var overrideAttrs = ( overrideEl.attributes = overrideEl.attributes || new Array() );
                    for (var attName in attrs) {
                        // Each item in the attributes array is also an array,
                        // where [0] is the attribute name and [1] is the
                        // override value.
                        overrideAttrs.push([ attName.toLowerCase(), attrs[ attName ] ]);
                    }
                }
            }
        }

        return overrides;
    }


    // Removes a style from an element itself, don't care about its subtree.
    function removeFromElement(style, element) {
        var def = style._.definition,
            attributes = S.mix(S.mix({}, def.attributes), getOverrides(style)[ element._4e_name()]),
            styles = def.styles,
            // If the style is only about the element itself, we have to remove the element.
            removeEmpty = S.isEmptyObject(attributes) && S.isEmptyObject(styles);

        // Remove definition attributes/style from the elemnt.
        for (var attName in attributes) {
            // The 'class' element value must match (#1318).
            if (( attName == 'class' || style._.definition.fullMatch )
                && element.attr(attName) != normalizeProperty(attName, attributes[ attName ]))
                continue;
            removeEmpty = removeEmpty || !!element._4e_hasAttribute(attName);
            element.removeAttr(attName);
        }

        for (var styleName in styles) {
            // Full match style insist on having fully equivalence. (#5018)
            if (style._.definition.fullMatch
                && element._4e_style(styleName) != normalizeProperty(styleName, styles[ styleName ], true))
                continue;

            removeEmpty = removeEmpty || !!element._4e_style(styleName);
            element._4e_style(styleName, "");
        }

        removeEmpty && removeNoAttribsElement(element);
    }

    function normalizeProperty(name, value, isStyle) {
        var temp = new Node('<span></span>');
        temp [ isStyle ? '_4e_style' : 'attr' ](name, value);
        return temp[ isStyle ? '_4e_style' : 'attr' ](name);
    }


    // Removes a style from inside an element.
    function removeFromInsideElement(style, element) {
        var //def = style._.definition,
            //attribs = def.attributes,
            //styles = def.styles,
            overrides = getOverrides(style),
            innerElements = element.all(style.element);

        for (var i = innerElements.length; --i >= 0;)
            removeFromElement(style, new Node(innerElements[i]));

        // Now remove any other element with different name that is
        // defined to be overriden.
        for (var overrideElement in overrides) {
            if (overrideElement != style.element) {
                innerElements = element.all(overrideElement);
                for (i = innerElements.length - 1; i >= 0; i--) {
                    var innerElement = new Node(innerElements[i]);
                    removeOverrides(innerElement, overrides[ overrideElement ]);
                }
            }
        }

    }

    /**
     *  Remove overriding styles/attributes from the specific element.
     *  Note: Remove the element if no attributes remain.
     * @param {Object} element
     * @param {Object} overrides
     */
    function removeOverrides(element, overrides) {
        var attributes = overrides && overrides.attributes;

        if (attributes) {
            for (var i = 0; i < attributes.length; i++) {
                var attName = attributes[i][0], actualAttrValue;

                if (( actualAttrValue = element.attr(attName) )) {
                    var attValue = attributes[i][1];

                    // Remove the attribute if:
                    //    - The override definition value is null ;
                    //    - The override definition valie is a string that
                    //      matches the attribute value exactly.
                    //    - The override definition value is a regex that
                    //      has matches in the attribute value.
                    if (attValue === null ||
                        ( attValue.test && attValue.test(actualAttrValue) ) ||
                        ( typeof attValue == 'string' && actualAttrValue == attValue ))
                        element[0].removeAttribute(attName);
                }
            }
        }

        removeNoAttribsElement(element);
    }

    // If the element has no more attributes, remove it.
    function removeNoAttribsElement(element) {
        // If no more attributes remained in the element, remove it,
        // leaving its children.
        if (!element._4e_hasAttributes()) {
            // Removing elements may open points where merging is possible,
            // so let's cache the first and last nodes for later checking.
            var firstChild = element[0].firstChild,lastChild = element[0].lastChild;

            element._4e_remove(true);

            if (firstChild) {
                // Check the cached nodes for merging.
                firstChild.nodeType == KEN.NODE_ELEMENT && DOM._4e_mergeSiblings(firstChild);

                if (lastChild && !firstChild === lastChild
                    && lastChild.nodeType == KEN.NODE_ELEMENT)
                    DOM._4e_mergeSiblings(lastChild);
            }
        }
    }

    KE.Style = KEStyle;
});
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
KISSY.Editor.add("contextmenu", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node,
        //DOM = S.DOM,
        Event = S.Event;
    var HTML = "<div class='ke-contextmenu'></div>";


    function ContextMenu(config) {
        this.cfg = S.clone(config);
        KE.Utils.lazyRun(this, "_prepareShow", "_realShow");
    }

    var global_tags = [];
    /**
     * 多菜单管理
     */
    ContextMenu.register = function(doc, cfg) {

        var cm = new ContextMenu(cfg);

        global_tags.push({
            doc:doc,
            tags:cfg.tags,
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
                    for (var i = 0; i < global_tags.length; i++) {
                        var tags = global_tags[i].tags,
                            instance = global_tags[i].instance,
                            doc2 = global_tags[i].doc;
                        if (doc === doc2 && S.inArray(name, tags)) {
                            ev.preventDefault();
                            stop = true;
                            instance.show(KE.Utils.getXY(ev.pageX, ev.pageY, doc, document));
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
    ContextMenu.hide = function() {
        var doc = this;
        for (var i = 0; i < global_tags.length; i++) {
            var instance = global_tags[i].instance,doc2 = global_tags[i].doc;
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
                    a.on("click", function(ev) {
                        func();
                        self.hide();
                        ev.halt();
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
    //console.log("contexmenu loaded!");
});
/**
 * simple overlay for kissy editor using lazyRun
 * @author yiminghe@gmail.com
 * @refer http://yiminghe.javaeye.com/blog/734867
 */
KISSY.Editor.add("overlay", function() {

    var KE=KISSY.Editor,
        S = KISSY,
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
            d_iframe = new Node("<iframe class='ke-dialog-iframe'></iframe>");
            body.appendChild(d_iframe[0]);
            mask_iframe = new Node("<iframe class='ke-mask'></iframe>");
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
        visible:{value:true},
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

            if (el) {
                //焦点管理，显示时用a获得焦点
                /*
                 el[0].appendChild(new Node("<a href='#' class='ke-focus' " +
                 "style='" +
                 "width:0;height:0;outline:none;font-size:0;'" +
                 "></a>")[0]);*/
                return;
            }

            //also gen html
            el = new Node("<div class='ke-dialog' style='width:" +
                self.get("width") +
                "'><div class='ke-hd clearfix'>" +
                "<div class='ke-hd-title'><h1>" +
                self.get("title") +
                "</h1></div>"
                + "<div class='ke-hd-x'><a class='ke-close' href='#'>X</a></div>"
                + "</div>" +
                "<div class='ke-bd'></div>" +
                "<div class='ke-ft'>" +
                "<a href='#' class='ke-focus'></a>" +
                "</div>" +
                "</div>");
            document.body.appendChild(el[0]);
            self.set("el", el);
            self.el = el;
            self.body = el.one(".ke-bd");
            self._close = el.one(".ke-close");
            self._title = el.one(".ke-hd-title").one("h1");
            self.on("titleChange", function(ev) {
                self._title.html(ev.newVal);
            });
            self.on("widthChange", function(ev) {
                self.el.css("width", ev.newVal);
            });
            self._close.on("click", function(ev) {
                ev.preventDefault();
                self.hide();
            });
        },
        center:function() {
            var el = this.get("el");
            var bw = parseInt(el.css("width")),
                bh = el[0].offsetHeight;
            var vw = DOM.viewportWidth(),
                vh = DOM.viewportHeight();
            var bl = (vw - bw) / 2 + DOM.scrollLeft(),
                bt = (vh - bh) / 2 + DOM.scrollTop();
            el.css({
                left: bl + "px",
                top: bt + "px"
            });
        },
        _prepareShow:function() {
            Overlay.init();
        },
        _realShow:function(v) {
            var el = this.get("el");
            this.set("visible", v || true);
            // el.one(".ke-focus")[0].focus();
        },
        show:function(v) {
            this._prepareShow(v);
        },
        hide:function() {
            var el = this.get("el");
            this.set("visible", false);
            // el.one(".ke-focus")[0].blur();
        }
    });
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
                        pastebin.remove();

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
                        mask:false
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
                        cache[i].remove();
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
                            if (dtd.$removeEmpty[ element.getName() ]) {
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
        dataProcessor = KE.HtmlDataProcessor,
        htmlFilter = dataProcessor && dataProcessor.htmlFilter,
        dataFilter = dataProcessor && dataProcessor.dataFilter;

    if (!KE.FakeObjects) {

        (function() {
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
            KE.FakeObjects = 1;
        })();
    }

    S.augment(Editor, {
        createFakeElement:function(realElement, className, realElementType, isResizable) {
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
                _ke_realelement : encodeURIComponent(realElement._4e_outerHtml()),
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
            return new Node(
                decodeURIComponent(fakeElement.attr('_ke_realelement')),
                this.document);
        }
    });

});
KISSY.Editor.add("flash", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        Node = S.Node,
        TripleButton = KE.TripleButton,
        Overlay = KE.SimpleOverlay,
        flashFilenameRegex = /\.swf(?:$|\?)/i,
        dataProcessor = KE.HtmlDataProcessor,
        MUSIC_PLAYER = "niftyplayer.swf",
        CLS_FLASH = 'ke_flash',
        CLS_MUSIC = 'ke_music',
        TYPE_FLASH = 'flash',
        TYPE_MUSIC = 'music',
        //htmlFilter = dataProcessor && dataProcessor.htmlFilter,
        dataFilter = dataProcessor && dataProcessor.dataFilter;
    if (!KE.Flash) {

        (function() {

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
                            classId = attributes.classid && String(attributes.classid).toLowerCase();
                        var cls = CLS_FLASH,type = TYPE_FLASH;
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

            var html = "<div style='margin:10px;'><p><label>地址：" +
                "<input class='ke-flash-url' style='width:280px' /></label></p>" +
                "<p style='margin:5px 0'><label>宽度：" +
                "<input class='ke-flash-width' style='width:120px' /></label>" +
                "&nbsp;&nbsp;<label>高度：<input class='ke-flash-height' " +
                "style='width:110px' /></label></p>" +

                "<p style='margin:5px 0;text-align:right;'><button>确定</button></p></div>";

            function Flash(editor) {
                this.editor = editor;
                this._init();
            }

            S.augment(Flash, {
                _init:function() {
                    var self = this,editor = self.editor;
                    self.el = new TripleButton({
                        container:editor.toolBarDiv,
                        contentCls:"ke-toolbar-flash",
                        //text:"flash",
                        title:"Flash"
                    });

                    self.el.on("click", self._showConfig, this);
                    KE.Utils.lazyRun(this, "_prepareShow", "_realShow");
                },
                _prepareShow:function() {
                    var self = this;
                    self.d = new Overlay({
                        title:"编辑flash",
                        width:"350px",
                        mask:true
                    });
                    self.d.body.html(html);
                    self._initD();
                },
                _realShow:function() {
                    this.d.show();
                },
                _showConfig:function() {
                    this._prepareShow();
                },
                _initD:function() {
                    var self = this,editor = self.editor,d = self.d;
                    self.dHeight = d.el.one(".ke-flash-height");
                    self.dWidth = d.el.one(".ke-flash-width");
                    self.dUrl = d.el.one(".ke-flash-url");
                    var action = d.el.one("button");
                    action.on("click", self._gen, self);
                },

                _gen: function() {
                    var self = this,editor = self.editor;
                    var url = self.dUrl.val();
                    if (!url)return;
                    var real = new Node('<object ' +
                        (parseInt(self.dWidth.val()) ? " width='" + parseInt(self.dWidth.val()) + "' " : ' ') +
                        (parseInt(self.dHeight.val()) ? " height='" + parseInt(self.dHeight.val()) + "' " : ' ') +
                        'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ' +
                        'codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0">' +
                        '<param name="quality" value="high" />' +
                        '<param name="movie" value="' + url + '" />' +
                        '<embed ' +
                        (parseInt(self.dWidth.val()) ? " width='" + parseInt(self.dWidth.val()) + "' " : ' ') +
                        (parseInt(self.dHeight.val()) ? " height='" + parseInt(self.dHeight.val()) + "' " : ' ') + 'pluginspage="http://www.macromedia.com/go/getflashplayer" quality="high" ' +
                        'src="' + url + '" ' +
                        'type="application/x-shockwave-flash">' +
                        '</embed>' +
                        '</object>', null, editor.document);
                    var substitute = editor.createFakeElement ? editor.createFakeElement(real, CLS_FLASH, TYPE_FLASH, true) : real;
                    editor.insertElement(substitute);
                    self.d.hide();
                }
            });
            KE.Flash = Flash;
        })();
    }
    editor.addPlugin(function() {
        new KE.Flash(editor);
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
        FONT_SIZES = ["8px","10px","12px",
            "14px","18px","24px","36px","48px","60px","72px","84px","96px","108px"],
        FONT_SIZE_STYLES = {},
        FONT_SIZE_SELECTION_HTML = "<select title='大小'><option value=''>大小 / 清除</option>",
        fontSize_style = {
            element        : 'span',
            styles        : { 'font-size' : '#(size)' },
            overrides    : [
                { element : 'font', attributes : { 'size' : null } }
            ]
        },
        FONT_FAMILIES = ["宋体","黑体","隶书",
            "楷体_GB2312","微软雅黑","Georgia","Times New Roman",
            "Impact","Courier New","Arial","Verdana","Tahoma"],
        FONT_FAMILY_STYLES = {},
        FONT_FAMILY_SELECTION_HTML = "<select title='字体'><option value=''>字体 / 清除</option>",
        fontFamily_style = {
            element        : 'span',
            styles        : { 'font-family' : '#(family)' },
            overrides    : [
                { element : 'font', attributes : { 'face' : null } }
            ]
        },i;

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
        FONT_FAMILY_SELECTION_HTML += "<option value='" + family + "'>" + family + "</option>"
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
                    //editor.fire("fontSizeChange", this.get("v"));
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
                    style.apply(editor.document);
                    editor.notifySelectionChange();
                    editor.focus();
                },
                _off:function() {
                    var self = this,
                        editor = self.get("editor"),
                        text = self.get("text"),
                        style = self.get("style"),
                        title = self.get("title");
                    style.remove(editor.document);
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
            title:"粗体",
            editor:editor,
            style:new KEStyle({
                element : 'strong'
            })
        });

        new KE.Font.SingleFont({
            contentCls:"ke-toolbar-italic",
            title:"斜体",
            editor:editor,
            style:new KEStyle({
                element : 'em'
            })
        });

        new KE.Font.SingleFont({
            contentCls:"ke-toolbar-underline",
            title:"下划线",
            editor:editor,
            style:new KEStyle({
                element : 'u'
            })
        });

        new KE.Font.SingleFont({
            contentCls:"ke-toolbar-strikeThrough",
            title:"删除线",
            editor:editor,
            style:new KEStyle({
                element : 'del'
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
                FORMAT_SELECTION_HTML = "<select title='格式'>",
                FORMATS = {
                    "标题 / 清除":"p",
                    "标题1":"h1",
                    "标题2":"h2",
                    "标题3":"h3",
                    "标题4":"h4",
                    "标题5":"h5",
                    "标题6":"h6"
                },FORMAT_STYLES = {},KEStyle = KE.Style;

            for (var p in FORMATS) {
                if (FORMATS[p]) {
                    FORMAT_STYLES[FORMATS[p]] = new KEStyle({
                        element:FORMATS[p]
                    });
                    FORMAT_SELECTION_HTML += "<option value='" + FORMATS[p] + "'>" + p + "</option>"
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
KISSY.Editor.add("htmlparser-element", function(editor) {
    var KE=KISSY.Editor;
    if(KE.HtmlParser.Element)return;
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
                    element.children = new KE.HtmlParser.Fragment.fromHtml(writer.getHtml()).children;
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

        parser.onComment = function(
            //comment
            ) {
            //currentNode.add(new KE.HtmlParser.comment(comment));
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
        dataFilter = new HtmlParser.Filter();
    var defaultHtmlFilterRules = {
        elementNames : [
            // Remove script,iframe style,link,meta
            [ ( /^script$/ ), '' ],
            [ ( /^iframe$/ ), '' ],
            [ ( /^style$/ ), '' ],
            [ ( /^link$/ ), '' ],
            [ ( /^meta$/ ), '' ],
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
            //防止word的垃圾class，全部杀掉算了，除了以ke_开头的编辑器内置class
            'class' : function(value
                // , element
                ) {
                if (/ke_/.test(value)) return value;
                return false;
            }
        }
    };
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
    dataFilter.addRules(defaultHtmlFilterRules);

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
            //fixForBody = fixForBody || "p";
            var writer = new HtmlParser.HtmlWriter(),
                fragment = HtmlParser.Fragment.FromHtml(html, fixForBody);
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

            var TripleButton = KE.TripleButton,html = "<div class='ke-popup-wrap' style='width:250px;padding:10px;'>" +
                "<p style='margin:0 0 10px'><label>请输入图片地址：<br/>" +
                "<input value='http://' style='width: 250px;' class='ke-img-url'/>" +
                "</label></p>" +
                "<p>" +
                "<button class='ke-img-insert'>插入</button>&nbsp;<a href='#' class='ke-img-cancel'>取消</a>" +
                "</p>" +
                "</div>";

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
                    var self = this,editor = this.get("editor");
                    this.content = new Node(html);
                    this.d = new Overlay({
                        el:this.content
                    });
                    document.body.appendChild(this.content[0]);
                    var cancel = this.content.one(".ke-img-cancel"),ok = this.content.one(".ke-img-insert");
                    this.imgUrl = this.content.one(".ke-img-url");
                    cancel.on("click", function(ev) {
                        this.d.hide();
                        ev.halt();
                    }, this);
                    Event.on(document, "click", this.hide, this);
                    Event.on(editor.document, "click", this.hide, this);
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
                    var xy = this.el.el.offset();
                    xy.top += this.el.el.height() + 5;
                    //console.log(this.content.width(), xy.left, DOM.viewportWidth());
                    if (xy.left + this.content.width() > DOM.viewportWidth() - 60) {
                        xy.left = DOM.viewportWidth() - this.content.width() - 60;
                    }
                    this.d.show(xy);
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
        dataProcessor = KE.HtmlDataProcessor,
        //htmlFilter = dataProcessor && dataProcessor.htmlFilter,
        dataFilter = dataProcessor && dataProcessor.dataFilter;
    if (!KE.Link) {
        (function() {
            dataFilter && dataFilter.addRules({
                elements : {
                    a:function(element) {
                        for (var a in element.attributes) {
                            if (a == "href" || a == "target") continue;
                            delete element.attributes[a];
                        }
                    }
                }
            });


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
                    title:"编辑超链接",
                    mask:true,
                    width:"300px"
                });
                self.d.body.html(html);
                self.urlEl = self.d.body.one(".ke-link-url");
                self.targetEl = self.d.body.one(".ke-link-blank");
                var cancel = self.d.body.one(".ke-link-cancel");
                self.ok = self.d.body.one(".ke-link-ok");
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
                var el = new Node(tipHtml);
                el._4e_unselectable();
                this.tipwin = new Overlay({el:el});
                document.body.appendChild(el[0]);
                this.tipurl = el.one(".ke-bubbleview-url");
                var tipchange = el.one(".ke-bubbleview-change");
                var tipremove = el.one(".ke-bubbleview-remove");
                tipchange.on("click", function(ev) {
                    Link.tipwin.link.show();
                    ev.halt();
                });
                tipremove.on("click", function(ev) {
                    var link = Link.tipwin.link;
                    link._removeLink();
                    ev.halt();
                });
                Link.tip = null;
            };

            var html = "<div style='padding: 10px;'>" +
                "<p>" +
                "<label>URL：<input class='ke-link-url' style='width:230px' value='http://'/></label>" +
                "</p>" +
                "<p style='margin-top: 5px;padding-left:35px'>" +
                "<label><input class='ke-link-blank' type='checkbox'/> &nbsp; 在新窗口打开链接</label>" +
                "</p>" +
                "<p style='margin-top: 5px;'>" +
                "<label><button class='ke-link-ok'>确定</button>&nbsp;" +
                "<a href='#' class='ke-link-cancel'>取消</a></label>" +
                "</p>" +
                "</div>";
            S.augment(Link, {
                _init:function() {
                    var self = this,editor = self.editor;
                    self.el = new TripleButton({
                        container:editor.toolBarDiv,
                        contentCls:"ke-toolbar-link",
                        //text:'link',
                        title:'插入编辑超链接'
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
                    this._hideTip();
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
                    var self = this;
                    var editor = this.editor,url = Link.urlEl.val();
                    //ie6 先要focus
                    editor.focus();
                    if (!S.trim(url)) {
                        return;
                    }
                    var link = self._getSelectedLink();
                    //是修改行为
                    if (link) {
                        var range = new KERange(editor.document);
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
                    var linkStyle = new KEStyle(link_Style, attr);
                    editor.fire("save");
                    linkStyle.apply(editor.document);
                    editor.fire("save");
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
});
/**
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
                List.superclass.constructor.call(this, cfg);
                var editor = this.get("editor"),toolBarDiv = editor.toolBarDiv,
                    el = this.el;
                var self = this;
                self.el = new TripleButton({
                    //text:this.get("type"),
                    contentCls:this.get("contentCls"),
                    title:this.get("title"),
                    container:toolBarDiv
                });
                this.listCommand = new listCommand(this.get("type"));
                this.listCommand.state = this.get("status");
                //this._selectionChange({path:1});
                this._init();
            }

            List.ATTRS = {
                editor:{},
                type:{},
                contentCls:{}
            };

            S.extend(List, S.Base, {

                _init:function() {
                    var editor = this.get("editor"),
                        toolBarDiv = editor.toolBarDiv,
                        el = this.el;
                    var self = this;
                    el.on("click", this._change, this);
                    editor.on("selectionChange", this._selectionChange, this);
                },


                _change:function() {
                    var editor = this.get("editor"),
                        type = this.get("type"),
                        el = this.el,
                        self = this;
                    //ie要等会才能获得焦点窗口的选择区域
                    editor.focus();
                    editor.fire("save");
                    setTimeout(function() {
                        self.listCommand.state = el.get("state");
                        self.listCommand.exec(editor);
                        editor.fire("save");
                        editor.fire(type + "Change");
                    }, 10);
                },

                _selectionChange:function(ev) {
                    var editor = this.get("editor"),
                        type = this.get("type"),
                        elementPath = ev.path,
                        element,
                        el = this.el,
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
                    var sel;

                    //firefox焦点bug
                    if (UA.gecko && editor.iframeFocus) {

                        //原来是聚焦，现在刷新designmode
                        sel = editor.getSelection();
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
                        element && element[0] && element.scrollIntoView(editor.document, false);
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
                    else
                        document.body.style.overflow = "hidden";
                    editor.editorWrap.css({
                        position:"absolute",
                        zIndex:9999,
                        width:viewportWidth + "px"
                    });
                    iframe.css({
                        zIndex:9998,
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
    var KE = KISSY.Editor;
    if (!KE.MusicInserter) {
        (function() {

            var
                S = KISSY,
                Node = S.Node,
                DOM = S.DOM,
                Event = S.Event,
                //MUSIC_PLAYER = KE.Config.base+"niftyplayer.swf",
                //CLS_FLASH = 'ke_flash',
                CLS_MUSIC = 'ke_music',
                // TYPE_FLASH = 'flash',
                TYPE_MUSIC = 'music',
                Overlay = KE.SimpleOverlay,
                TripleButton = KE.TripleButton,
                html = "<div class='ke-popup-wrap' " +
                    "style='width:250px;padding:10px;'>" +
                    "<p style='margin:0 0 10px'>" +
                    "<label>请输入音乐地址：<br/>" +
                    "<input value='http://' style='width: 250px;' class='ke-music-url'/>" +
                    "</label></p>" +
                    "<p>" +
                    "<button class='ke-music-insert'>插入</button>&nbsp;" +
                    "<a href='#' class='ke-music-cancel'>取消</a>" +
                    "</p>" +
                    "</div>",
                MUSIC_MARKUP = '<object ' +
                    ' width="165" height="37"' +
                    ' codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"' +
                    ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
                    '<param value="'
                    + (KE.Config.base + 'plugins/music/niftyplayer.swf?file=#(music)&amp;as=0"') +
                    ' name="movie">' +
                    '<param value="high" name="quality">' +
                    '<param value="#FFFFFF" name="bgcolor">' +
                    '<embed width="165" height="37" ' +
                    'type="application/x-shockwave-flash" ' +
                    'swliveconnect="true" ' +
                    'src="' + (KE.Config.base + 'plugins/music/niftyplayer.swf?file=#(music)&amp;as=0"') +
                    'quality="high" ' +
                    'pluginspage="http://www.macromedia.com/go/getflashplayer"' +
                    ' bgcolor="#FFFFFF">' +
                    '</object>',
                music_reg = /#\(music\)/g;

            function MusicInserter(cfg) {
                MusicInserter.superclass.constructor.call(this, cfg);
                this._init();
            }

            MusicInserter.ATTRS = {
                editor:{}
            };

            S.extend(MusicInserter, S.Base, {
                _init:function() {
                    var editor = this.get("editor"),toolBarDiv = editor.toolBarDiv;

                    this.el = new TripleButton({
                        //text:"music",
                        contentCls:"ke-toolbar-music",
                        title:"分享音乐",
                        container:toolBarDiv
                    });

                    this.el.on("offClick", this.show, this);
                    KE.Utils.lazyRun(this, "_prepare", "_real");
                },
                _prepare:function() {
                    var self = this,editor = this.get("editor");
                    this.content = new Node(html);
                    this.d = new Overlay({
                        el:this.content
                    });
                    document.body.appendChild(this.content[0]);
                    var cancel = this.content.one(".ke-music-cancel"),
                        ok = this.content.one(".ke-music-insert");
                    this.musicUrl = this.content.one(".ke-music-url");
                    cancel.on("click", function(ev) {
                        this.d.hide();
                        ev.halt();
                    }, this);
                    Event.on(document, "click", this.hide, this);
                    Event.on(editor.document, "click", this.hide, this);
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
                    var xy = this.el.el.offset();
                    xy.top += this.el.el.height() + 5;
                    if (xy.left + this.content.width() > DOM.viewportWidth() - 60) {
                        xy.left = DOM.viewportWidth() - this.content.width() - 60;
                    }
                    this.d.show(xy);
                },
                _insert:function() {
                    var editor = this.get("editor");
                    var url = this.musicUrl.val();
                    if (!url) return;
                    var music = new Node(MUSIC_MARKUP.replace(music_reg, url), null, editor.document);
                    var substitute = editor.createFakeElement ?
                        editor.createFakeElement(music, CLS_MUSIC, TYPE_MUSIC, true) :
                        music;
                    editor.insertElement(substitute);
                    this.d.hide();
                },
                show:function() {
                    this._prepare();
                }
            });
            KE.MusicInserter = MusicInserter;
        })();
    }
    editor.addPlugin(function() {
        new KE.MusicInserter({
            editor:editor
        });
    });

});
/**
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
    var KE=KISSY.Editor,
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
        removeFormatTags = 'b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var';

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
                        if (tagsRegex.test(pathElement.getName()))
                            node.breakParent(pathElement);
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

    editor.addPlugin( function() {
        new RemoveFormat(editor);
    });

});
/**
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
            "<label>高度： <input value='200' class='ke-table-height' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
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
            "<label>间距： <input value='1' class='ke-table-cellspacing' size='" + IN_SIZE + "'/></label> &nbsp;像素</select>" +
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
            "<tr>" +
            "<td colspan='2' style='text-align:center'>" +
            "<button class='ke-table-ok'>确定</button>" +
            "</td>" +
            "</tr>" +
            "</table>",
        ContextMenu = KE.ContextMenu,
        tableTags = ["tr","th","td","tbody","table"],trim = S.trim;

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
                        tags:tableTags,
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
                    d.tok = d.body.one(".ke-table-ok");
                    d.tclose = d.body.one(".ke-table-close");
                    d.twidthunit = d.body.one(".ke-table-width-unit");
                    //console.log(d.twidthunit);
                    self.tableDialog = d;
                    d.tok.on("click", self._tableOk, self);
                    d.on("hide", function() {
                        //清空
                        self.selectedTable = null;
                        editor.focus();
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
                        selectedTable.remoevClass(showBorderClassName);
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

                '删除行': function(editor) {
                    var selection = editor.getSelection();
                    placeCursorInCell(deleteRows(selection), undefined);

                },

                '删除列' : function(editor) {
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
                    ui.on("hide", function() {
                        editor.focus();
                    });
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
