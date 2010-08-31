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
                    //主窗口滚动条也要保存�?
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
                        //firefox 先失去焦点才�?
                        self.el.el[0].focus();
                        editor.focus();
                        if (self.savedRanges && sel) {
                            sel.selectRanges(self.savedRanges);
                        }

                    }
                    //firefox 有焦点时才重新聚�?


                    if (editor.iframeFocus && sel) {
                        var element = sel.getStartElement();
                        //使用原生不行的，会使主窗口滚�?
                        //element[0] && element[0].scrollIntoView(true);
                        element && element[0] && element._4e_scrollIntoView();
                    }

                    //firefox焦点bug
                    if (UA.gecko) {
                        //原来不聚�?
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
                    //firefox第一次最大化bug，重做一�?
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
