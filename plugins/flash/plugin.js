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

            var html = "<div style='margin:10px;'><p><label>地址：" +
                "<input class='ke-flash-url' style='width:280px' /></label></p>" +
                "<p style='margin:5px 0'><label>宽度：" +
                "<input class='ke-flash-width' style='width:120px' /></label>" +
                "&nbsp;&nbsp;<label>高度：<input class='ke-flash-height' " +
                "style='width:110px' /></label></p>" +

                "<p style='margin:5px 0;text-align:right;'><button>确定</button></p></div>";

            function Flash(editor) {
                var self = this;
                self.editor = editor;
                editor._toolbars = editor._toolbars || {};
                editor._toolbars["flash"] = self;
                self._init();
            }

            S.augment(Flash, {
                _init:function() {
                    var self = this,editor = self.editor,
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
                        editor.focus();
                    });
                    self.d.body.html(html);
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
                    }
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
            KE.Flash = Flash;
        })();
    }

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
    editor.addPlugin(function() {
        new KE.Flash(editor);
    });

});
