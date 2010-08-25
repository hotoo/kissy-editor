/**
 * insert music for kissy editor
 * @author: yiminghe@gmail.com
 */
KISSY.Editor.add("music", function(editor) {
    var KE = KISSY.Editor;
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
                MUSIC_MARKUP = '<ke:object ' +
                    ' width="165" height="37"' +
                    ' codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"' +
                    ' classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
                    '<ke:param value="'
                    + (KE.Config.base + 'plugins/music/niftyplayer.swf?file=#(music)&amp;as=0"') +
                    ' name="movie"></ke:param>' +
                    '<ke:param value="high" name="quality"></ke:param>' +
                    '<ke:param value="#FFFFFF" name="bgcolor"></ke:param>' +
                    '<ke:embed width="165" height="37" ' +
                    'type="application/x-shockwave-flash" ' +
                    'swliveconnect="true" ' +
                    'src="' + (KE.Config.base + 'plugins/music/niftyplayer.swf?file=#(music)&amp;as=0"') +
                    'quality="high" ' +
                    'pluginspage="http://www.macromedia.com/go/getflashplayer"' +
                    ' bgcolor="#FFFFFF"></ke:embed>' +
                    '</ke:object>',
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
                    self.content = new Node(html);
                    self.d = new Overlay({
                        el:self.content
                    });
                    self.d.on("hide", function() {
                        //清空
                        self.selectedFlash = null;
                        editor.focus();
                    });
                    document.body.appendChild(self.content[0]);
                    var cancel = self.content.one(".ke-music-cancel"),
                        ok = self.content.one(".ke-music-insert");
                    self.musicUrl = self.content.one(".ke-music-url");
                    cancel.on("click", function(ev) {
                        self.d.hide();
                        ev.halt();
                    }, self);
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
                    var self = this,xy = self.el.el.offset();
                    xy.top += self.el.el.height() + 5;
                    if (xy.left + self.content.width() > DOM.viewportWidth() - 60) {
                        xy.left = DOM.viewportWidth() - self.content.width() - 60;
                    }
                    this.d.show(xy);
                },
                _insert:function() {
                    var self = this,editor = self.get("editor");
                    var url = self.musicUrl.val();
                    if (!url) return;
                    var music = new Node(MUSIC_MARKUP.replace(music_reg, url), null, editor.document);
                    var substitute = editor.createFakeElement ?
                        editor.createFakeElement(music, CLS_MUSIC, TYPE_MUSIC, true) :
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
                        if (r._4e_name() == "ke:object") {
                            var params = r._4e_getElementsByTagName("param", "ke");
                            for (var i = 0; i < params.length; i++) {
                                if ((params[i].attr("name") || "").toLowerCase() == "movie") {
                                    self.musicUrl.val(getMusicUrl(params[i].attr("value")));
                                }
                            }
                            var embeds = r._4e_getElementsByTagName("embed", "ke");
                            for (var i = 0; i < embeds.length; i++) {
                                self.musicUrl.val(getMusicUrl(embeds[i].attr("src")));
                            }
                            var objects = r._4e_getElementsByTagName("object", "ke");
                            for (var i = 0; i < objects.length; i++) {
                                self.musicUrl.val(getMusicUrl(objects[i].attr("data")));
                            }
                        } else if (r._4e_name() == "ke:embed") {
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
