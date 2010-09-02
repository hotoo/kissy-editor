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
    //!TODO �?��重构，和flash结合起来，抽�?
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
                    "<label><span style='color:#0066CC;font-weight:bold;'>音乐网址�?" +
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
             * tip初始化，�?��共享�?��tip
             */
            var tipHtml = '<div class="ke-bubbleview-bubble" onmousedown="return false;">音乐网址�?'
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
                    music && (!music.d.get("visible")) && (music.selectedFlash = null);
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

});