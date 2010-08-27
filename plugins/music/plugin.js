/**
 * insert music for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("music", function(editor) {
    var KE = KISSY.Editor,KEN = KE.NODE;
    if (!KE.MusicInserter) {
        (function() {
            var S = KISSY,
                Node = S.Node,
                DOM = S.DOM,
                ContextMenu = KE.ContextMenu,
                Event = S.Event,
                //MUSIC_PLAYER = KE.Config.base+"niftyplayer.swf",
                //CLS_FLASH = 'ke_flash',
                CLS_MUSIC = 'ke_music',
                // TYPE_FLASH = 'flash',
                TYPE_MUSIC = 'music',
                Overlay = KE.SimpleOverlay,
                TripleButton = KE.TripleButton,



                bodyHtml = "<div>" +
                    "<p>" +
                    "<label><span style='color:#0066CC;font-weight:bold;'>音乐网址：" +
                    "</span><input class='ke-music-url' style='width:230px' value='http://'/></label>" +
                    "</p>" +
                    "</div>",
                footHtml = "<button class='ke-music-insert'>插入</button> <button class='ke-music-cancel'>取消</button>";


            MUSIC_MARKUP = '<object ' +
                ' width="165" height="37"' +
                ' codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"' +
                ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
                '<param value="'
                + (KE.Config.base + 'plugins/music/niftyplayer.swf?file=#(music)&amp;as=0"') +
                ' name="movie"/>' +
                '<param value="high" name="quality"/>' +
                '<param value="#FFFFFF" name="bgcolor"/>' +
                '<embed width="165" height="37" ' +
                'type="application/x-shockwave-flash" ' +
                'swliveconnect="true" ' +
                'src="' + (KE.Config.base + 'plugins/music/niftyplayer.swf?file=#(music)&amp;as=0"') +
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
                    self.el.on("offClick", self.show, self);
                    KE.Utils.lazyRun(self, "_prepare", "_real");
                },
                _prepare:function() {
                    var self = this,editor = self.get("editor");
                    self.d = new Overlay({
                        title:"插入音乐",
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
                        editor.focus();
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
                        if (r._4e_name() == "object") {
                            var params = r[0].childNodes;
                            for (var i = 0; i < params.length; i++) {
                                if (params[i].nodeType != KEN.NODE_ELEMENT)continue;
                                if ((DOM.attr(params[i], "name") || "").toLowerCase() == "movie") {
                                    self.musicUrl.val(getMusicUrl(DOM.attr(params[i], "value")));
                                } else if (DOM._4e_name(params[i]) == "embed") {
                                    self.musicUrl.val(getMusicUrl(DOM.attr(params[i], "src")));
                                } else if (DOM._4e_name(params[i]) == "object") {
                                    self.musicUrl.val(getMusicUrl(DOM.attr(params[i], "data")));
                                }
                            }
                        } else if (r._4e_name() == "embed") {
                            self.musicUrl.val(getMusicUrl(r.attr("src")));
                        }
                    }
                }
            });
            function getMusicUrl(url) {
                return url.replace(/^.+niftyplayer\.swf\?file=/, "");
            }

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
    });

});
