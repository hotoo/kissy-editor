KISSY.Editor.add("link",function(h){var e=KISSY.Editor,g=KISSY,o=g.DOM,p=g.Event,q=e.TripleButton,i=e.Style,j=g.Node,r=e.Range,k=e.SimpleOverlay,l=e.HtmlDataProcessor,m=l&&l.dataFilter;e.Link||function(){function b(a){this.editor=a;this._init()}m&&m.addRules({elements:{a:function(a){for(var c in a.attributes)c=="href"||c=="target"||delete a.attributes[c]}}});var n={element:"a",attributes:{href:"#(href)",target:"#(target)"}};b.init=function(){var a=this;a.d=new k({title:"\u4fee\u6539\u94fe\u63a5",
mask:true,width:"300px"});a.d.body.html(s);a.d.foot.html(t);a.urlEl=a.d.body.one(".ke-link-url");a.targetEl=a.d.body.one(".ke-link-blank");var c=a.d.foot.one(".ke-link-cancel");a.ok=a.d.foot.one(".ke-link-ok");b.ok.on("click",function(d){b.d.link._link();d.halt()},this);c.on("click",function(d){a.d.hide();d.halt()},a);b.init=null};b.tip=function(){var a=new j('<div class="ke-bubbleview-bubble" onmousedown="return false;">\u524d\u5f80\u94fe\u63a5\ufffd? <a href=""  target="_blank" class="ke-bubbleview-url"></a> -     <span class="ke-bubbleview-link ke-bubbleview-change">\u7f16\u8f91</span> -     <span class="ke-bubbleview-link ke-bubbleview-remove">\u53bb\u9664</span></div>');
a._4e_unselectable();this.tipwin=new k({el:a,focusMgr:false});document.body.appendChild(a[0]);this.tipurl=a.one(".ke-bubbleview-url");var c=a.one(".ke-bubbleview-change");a=a.one(".ke-bubbleview-remove");c.on("click",function(d){b.tipwin.link.show();d.halt()});a.on("click",function(d){b.tipwin.link._removeLink();d.halt()});b.tip=null};var s="<div><p><label><span style='color:#0066CC;font-weight:bold;'>\u7f51\u5740\ufffd?/span><input class='ke-link-url' style='width:230px' value='http://'/></label></p><p style='margin-top: 5px;padding-left:45px'><label><input class='ke-link-blank' type='checkbox'/> &nbsp; \u5728\u65b0\u7a97\u53e3\u6253\u5f00\u94fe\u63a5</label></p></div>",
t="<button class='ke-link-ok'>\u786e\u5b9a</button> <button class='ke-link-cancel'>\u53d6\u6d88</button>";g.augment(b,{_init:function(){var a=this.editor;this.el=new q({container:a.toolBarDiv,contentCls:"ke-toolbar-link",title:"\u7f16\u8f91\u8d85\u94fe\ufffd?"});this.el.on("click",this.show,this);a.on("selectionChange",this._selectionChange,this)},_prepareTip:function(){b.tip&&b.tip()},_realTip:function(a){var c=a._4e_getOffset(document);c.top+=a.height()+5;b.tipwin.show(c);this._a=a;b.tipwin.link=
this;b.tipurl.html(a.attr("href"));b.tipurl.attr("href",a.attr("href"))},_showTip:function(a){this._prepareTip(a)},_hideTip:function(){b.tipwin&&b.tipwin.hide()},_removeLink:function(){var a=this._a,c=this.editor;c.focus();var d={href:a.attr("href")};if(a._4e_hasAttribute("target"))d.target=a.attr("target");a=new i(n,d);c.fire("save");a.remove(c.document);c.fire("save");this._hideTip();c.focus();c.notifySelectionChange()},_selectionChange:function(a){a=a.path;var c=a.elements;if(a&&c)if(a=a.lastElement)(a=
a._4e_ascendant(function(d){return d._4e_name()==="a"&&!!d.attr("href")},true))?this._showTip(a):this._hideTip()},hide:function(){b.d.hide()},_getSelectedLink:function(){var a=this.editor;if(b.tipwin&&b.tipwin.get("visible")){(a=a.getSelection().getRanges()[0].getCommonAncestor())&&(a=a._4e_ascendant(function(c){return c._4e_name()=="a"&&!!c.attr("href")},true));if(a&&a[0]==b.tipwin.link._a[0])return a}},_link:function(){var a,c=this.editor,d=b.urlEl.val();c.focus();if(g.trim(d)){var f=this._getSelectedLink();
if(f){a=new r(c.document);a.selectNodeContents(f);c.getSelection().selectRanges([a]);this._removeLink()}f={href:d};f.target=b.targetEl[0].checked?"_blank":"_self";a=c.getSelection().getRanges()[0];if(a.collapsed){a=new j("<a href='"+d+"' target='"+f.target+"'>"+d+"</a>",null,c.document);c.insertElement(a)}else{c.fire("save");(new i(n,f)).apply(c.document);c.fire("save")}this.hide();c.focus();c.notifySelectionChange()}},_prepare:function(){b.init&&b.init()},_real:function(){b.d.link=this;var a=this._getSelectedLink();
if(a){b.urlEl.val(a.attr("href"));b.targetEl[0].checked=a.attr("target")=="_blank"}b.d.show()},show:function(){this._prepare()}});e.Utils.lazyRun(b.prototype,"_prepare","_real");e.Utils.lazyRun(b.prototype,"_prepareTip","_realTip");e.Link=b}();h.addPlugin(function(){new e.Link(h);var b=o._4e_getWin(h.document);p.on(b,"scroll",function(){e.Link.tipwin&&e.Link.tipwin.hide()})})});
