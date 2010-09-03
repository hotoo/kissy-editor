KISSY.Editor.add("flash", function(editor) {
    var KE = KISSY.Editor,
        S = KISSY,
        DOM = S.DOM,
        Event = S.Event,
        ContextMenu = KE.ContextMenu,
        Node = S.Node,
        KEN = KE.NODE,
        BubbleView = KE.BubbleView,
        TripleButton = KE.TripleButton,
        Overlay = KE.SimpleOverlay,
        dataProcessor = editor.htmlDataProcessor,
        CLS_FLASH = 'ke_flash',
        CLS_MUSIC = 'ke_music',
        TYPE_FLASH = 'flash',
        TYPE_MUSIC = 'music',
        getFlashUrl = KE.Utils.getFlashUrl,
        dataFilter = dataProcessor && dataProcessor.dataFilter,
        flashRules = ["img." + CLS_FLASH];


    if (!KE.Flash) {

        (function() {


            var flashFilenameRegex = /\.swf(?:$|\?)/i,
              
                bodyHtml = "<div><p><label>地址： " +
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
                self._init();
            }

            Flash.isFlashEmbed = function (element) {
                var attributes = element.attributes;
                return (
                    attributes.type == 'application/x-shockwave-flash'
                        ||
                        flashFilenameRegex.test(attributes.src || '')
                    );
            };

            S.augment(Flash, {
                _config:function() {
                    var self = this,
                        editor = self.editor;
                    editor._toolbars = editor._toolbars || {};
                    editor._toolbars["flash"] = self;
                    self._cls = CLS_FLASH;
                    self._type = TYPE_FLASH;
                    self._title = "编辑flash";
                    self._bodyHtml = bodyHtml;
                    self._footHtml = footHtml;
                    self._contentCls = "ke-toolbar-flash";
                    self._tip = "Flash";
                    self._contextMenu = contextMenu;
                    self._flashRules = flashRules;
                },
                _init:function() {
                    var self = this,
                        editor = self.editor,
                        myContexts = {};
                    self._config();
                    self.el = new TripleButton({
                        container:editor.toolBarDiv,
                        contentCls:self._contentCls,
                        title:self._tip
                    });
                    self.el.on("click", self.show, this);

                    for (var f in contextMenu) {
                        (function(f) {
                            myContexts[f] = function() {
                                editor.fire("save");
                                self._contextMenu[f](editor);
                                editor.fire("save");
                            }
                        })(f);
                    }
                    ContextMenu.register(editor.document, {
                        rules:self._flashRules,
                        width:"120px",
                        funcs:myContexts
                    });


                    BubbleView.attach({
                        pluginName:self._type,
                        pluginInstance:self
                    });
                    Event.on(editor.document, "dblclick", self._dbclick, self);
                    KE.Utils.lazyRun(this, "_prepareShow", "_realShow");
                },
                _getFlashUrl:function(r) {
                    return   getFlashUrl(r);
                },
                _updateTip:function(tipurl, selectedFlash) {
                    var self = this,
                        editor = self.editor;
                    var r = editor.restoreRealElement(selectedFlash);
                    tipurl.html(self._getFlashUrl(r));
                    tipurl.attr("href", self._getFlashUrl(r));
                }
                ,
                _dbclick:function(ev) {
                    var self = this,t = new Node(ev.target);
                    if (t._4e_name() === "img" && t.hasClass(self._cls)) {
                        self.selectedFlash = t;
                        self.show();
                        ev.halt();
                    }
                },

                _prepareShow:function() {
                    var self = this;
                    self.d = new Overlay({
                        title:self._title,
                        width:"350px",
                        mask:true
                    });
                    self.d.on("hide", function() {
                        //清空
                        self.selectedFlash = null;
                    });
                    self.d.body.html(self._bodyHtml);
                    self.d.foot.html(self._footHtml);
                    self._initD();
                }
                ,
                _realShow:function() {
                    this.d.show();
                },
                _updateD:function() {
                    var self = this,
                        editor = self.editor,
                        f = self.selectedFlash;
                    if (f) {
                        var r = editor.restoreRealElement(f);
                        if (r.attr("width")) {
                            self.dWidth.val(parseInt(r.attr("width")));
                        }
                        if (r.attr("height")) {
                            self.dHeight.val(parseInt(r.attr("height")));
                        }
                        self.dUrl.val(getFlashUrl(r));

                    } else {
                        self.dUrl.val("");
                        self.dWidth.val("");
                        self.dHeight.val("");
                    }
                },
                show:function() {
                    var self = this,
                        editor = self.editor,
                        d = self.d,
                        f = self.selectedFlash;
                    self._prepareShow();
                    self._updateD();
                }
                ,
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
                }
                ,
                _getDURl:function() {
                    return this.dUrl.val();
                }
                ,
                _getDWidth:function() {
                    return this.dWidth.val();
                }
                ,
                _getDHeight:function() {
                    return this.dHeight.val();
                }
                ,
                _gen: function() {
                    var self = this,
                        editor = self.editor,
                        url = self._getDURl(),
                        width = self._getDWidth(),
                        height = self._getDHeight();
                    var outerHTML = '<object ' +
                        (width ? (" width='" + width + "' ") : ' ') +
                        (height ? " height='" + height + "' " : ' ') +
                        ' classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ' +
                        ' codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0">' +
                        '<param name="quality" value="high" />' +
                        '<param name="movie" value="' + url + '" />' +
                        '<embed ' +
                        (width ? " width='" + width + "' " : ' ') +
                        (height ? " height='" + height + "' " : ' ') +
                        'pluginspage="http://www.macromedia.com/go/getflashplayer" ' +
                        'quality="high" ' +
                        ' src="' + url + '" ' +
                        ' type="application/x-shockwave-flash"/>' +
                        '</object>',
                        real = new Node(outerHTML, null, editor.document);
                    var substitute = editor.createFakeElement ?
                        editor.createFakeElement(real, self._cls, self._type, true, outerHTML) :
                        real;
                    editor.insertElement(substitute);
                    //如果是修改，就再选中
                    if (self.selectedFlash) {
                        editor.getSelection().selectElement(substitute);
                    }
                    self.d.hide();
                }
            });

            KE.Flash = Flash;

            /**
             * tip初始化，所有共享一个tip
             */
            var tipHtml = ' '
                + ' <a class="ke-bubbleview-url" target="_blank" href="#"></a> - '
                + '    <span class="ke-bubbleview-link ke-bubbleview-change">编辑</span> - '
                + '    <span class="ke-bubbleview-link ke-bubbleview-remove">删除</span>'
                + '';

            function checkFlash(lastElement) {
                return lastElement._4e_ascendant(function(node) {
                    return node._4e_name() === 'img' && (!!node.hasClass(CLS_FLASH));
                }, true);
            }

            Flash.registerBubble = function(pluginName, label, checkFlash) {

                BubbleView.register({
                    pluginName:pluginName,
                    func:checkFlash,
                    init:function() {
                        var bubble = this,
                            el = bubble.el;
                        el.html(label + tipHtml);
                        var tipurl = el.one(".ke-bubbleview-url"),
                            tipchange = el.one(".ke-bubbleview-change"),
                            tipremove = el.one(".ke-bubbleview-remove");
                        //ie focus not lose
                        tipchange._4e_unselectable();
                        tipurl._4e_unselectable();
                        tipremove._4e_unselectable();
                        tipchange.on("click", function(ev) {
                            bubble._plugin.selectedFlash = bubble._selectedEl;
                            bubble._plugin.show();
                            ev.halt();
                        });
                        tipremove.on("click", function(ev) {
                            var flash = bubble._plugin;
                            bubble._selectedEl._4e_remove();
                            flash.editor.notifySelectionChange();
                            ev.halt();
                        });

                        /*
                         位置变化
                         */
                        bubble.on("afterVisibleChange", function(ev) {
                            var v = ev.newVal,a = bubble._selectedEl,
                                flash = bubble._plugin;
                            if (!v || !a)return;
                            flash._updateTip(tipurl, a);
                        });
                    }
                });
            };
            Flash.registerBubble("flash", "Flash 网址： ", checkFlash);
            var contextMenu = {
                "编辑Flash":function(editor) {
                    var selection = editor.getSelection(),
                        startElement = selection && selection.getStartElement(),
                        flash = checkFlash(startElement),
                        flashUI = editor._toolbars["flash"];
                    flashUI.selectedFlash = flash;
                    flashUI.show();
                }
            };
        })();
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
                            if (!KE.Flash.isFlashEmbed(element.children[ i ]))
                                return null;
                            return dataProcessor.createFakeParserElement(element, cls, type, true);
                        }
                    }
                    return null;
                }
                return dataProcessor.createFakeParserElement(element, cls, type, true);
            },

            'embed' : function(element) {
                if (!KE.Flash.isFlashEmbed(element))
                    return null;
                var cls = CLS_FLASH,type = TYPE_FLASH;
                return dataProcessor.createFakeParserElement(element, cls, type, true);
            }
        }}, 5);
    editor.addPlugin(function() {
        new KE.Flash(editor);
    });

});
