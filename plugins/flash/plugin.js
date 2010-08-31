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
        dataProcessor = KE.HtmlDataProcessor,
        MUSIC_PLAYER = "niftyplayer.swf",
        CLS_FLASH = 'ke_flash',
        CLS_MUSIC = 'ke_music',
        TYPE_FLASH = 'flash',
        TYPE_MUSIC = 'music',
        getFlashUrl = KE.Utils.getFlashUrl,
        //htmlFilter = dataProcessor && dataProcessor.htmlFilter,
        dataFilter = dataProcessor && dataProcessor.dataFilter,
        flashRules = ["img." + CLS_FLASH];

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
                self.tipurl = el.one(".ke-bubbleview-url");
                self.tipwin.on("hide", function() {
                    var flash = self.tipwin.flash;
                    flash && (flash.selectedFlash = null);
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
