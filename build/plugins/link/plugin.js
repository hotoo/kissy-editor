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
             * �?��编辑器实例共享同�?��能窗�?
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
             * tip初始化，�?��共享�?��tip
             */
            var tipHtml = '<div class="ke-bubbleview-bubble" onmousedown="return false;">前往链接�?'
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
                "<label><span style='color:#0066CC;font-weight:bold;'>网址�?/span><input class='ke-link-url' style='width:230px' value='http://'/></label>" +
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
                        title:"编辑超链�?"
                        //"编辑超链�?
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

                //得到当前选中�?link a
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
                    //是修改行�?
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
                    //没有选择区域时直接插入链接地�?
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
                    //是修改行�?

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