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
