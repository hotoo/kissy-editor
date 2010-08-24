KISSY.Editor.add("selection",function(o){function v(b){this.document=b;this._={cache:{}};if(k.ie){var a=this.getNative().createRange();if(!a||a.item&&a.item(0).ownerDocument!=b||a.parentElement&&a.parentElement().ownerDocument!=b)this.isInvalid=true}}function A(b){b=new v(b);return!b||b.isInvalid?null:b}function B(b){var a=b.document,c=new l(a.body),d=new l(a.documentElement);if(k.ie){if(k.ie<8||document.documentMode==7)d.on("click",function(i){n._4e_name(i.target)==="html"&&b.getSelection().getRanges()[0].select()});
var e,f;c.on("focusin",function(i){if(i.target.nodeName.toUpperCase()=="BODY")if(e){try{e.select()}catch(s){}e=null}});c.on("focus",function(){f=true;h()});c.on("beforedeactivate",function(i){i.relatedTarget||(f=false)});k.ie<8&&u.on(n._4e_getWin(a),"blur",function(){a.selection.empty()});c.on("mousedown",g);c.on("mouseup",function(){f=true;setTimeout(function(){h(true)},0)});c.on("keydown",g);c.on("keyup",function(){f=true;h()});u.on(a,"selectionchange",h);var g=function(){f=false},h=function(i){if(f){var s=
b.document,q=b.getSelection(),r=q&&q.getNative();if(i&&r&&r.type=="None")if(!s.queryCommandEnabled("InsertImage")){setTimeout(function(){h(true)},50);return}var w;if(!(r&&r.type=="Text"&&(w=r.createRange().parentElement().nodeName.toLowerCase())&&w in{input:1,textarea:1})){e=r&&q.getRanges()[0];b._monitor()}}}}else{u.on(a,"mouseup",b._monitor,b);u.on(a,"keyup",b._monitor,b)}}o.SELECTION={};var p=KISSY,k=p.UA,n=p.DOM,u=p.Event,C=o.Utils.tryThese,l=p.Node,j=o.SELECTION,x=o.RANGE,m=o.NODE,D=o.Walker,
t=o.Range;j.SELECTION_NONE=1;j.SELECTION_TEXT=2;j.SELECTION_ELEMENT=3;var y={img:1,hr:1,li:1,table:1,tr:1,td:1,th:1,embed:1,object:1,ol:1,ul:1,a:1,input:1,form:1,select:1,textarea:1,button:1,fieldset:1,thead:1,tfoot:1};p.augment(v,{getNative:k.ie?function(){return this._.cache.nativeSel||(this._.cache.nativeSel=this.document.selection)}:function(){return this._.cache.nativeSel||(this._.cache.nativeSel=n._4e_getWin(this.document).getSelection())},getType:k.ie?function(){var b=this._.cache;if(b.type)return b.type;
var a=j.SELECTION_NONE;try{var c=this.getNative(),d=c.type;if(d=="Text")a=j.SELECTION_TEXT;if(d=="Control")a=j.SELECTION_ELEMENT;if(c.createRange().parentElement)a=j.SELECTION_TEXT}catch(e){}return b.type=a}:function(){var b=this._.cache;if(b.type)return b.type;var a=j.SELECTION_TEXT,c=this.getNative();if(c){if(c.rangeCount==1){c=c.getRangeAt(0);var d=c.startContainer;if(d==c.endContainer&&d.nodeType==m.NODE_ELEMENT&&c.endOffset-c.startOffset===1&&y[d.childNodes[c.startOffset].nodeName.toLowerCase()])a=
j.SELECTION_ELEMENT}}else a=j.SELECTION_NONE;return b.type=a},getRanges:k.ie?function(){var b=function(a,c){a=a.duplicate();a.collapse(c);c=a.parentElement();for(var d=c.childNodes,e,f=0;f<d.length;f++){var g=d[f];if(g.nodeType==m.NODE_ELEMENT){e=a.duplicate();e.moveToElementText(g);g=e.compareEndPoints("StartToStart",a);var h=e.compareEndPoints("EndToStart",a);e.collapse();if(g>0)break;else if(!g||h==1&&g==-1)return{container:c,offset:f};else if(!h)return{container:c,offset:f+1};e=null}}if(!e){e=
a.duplicate();e.moveToElementText(c);e.collapse(false)}e.setEndPoint("StartToStart",a);a=e.text.replace(/(\r\n|\r)/g,"\n").length;try{for(;a>0;)a-=d[--f].nodeValue.length}catch(i){a=0}return a===0?{container:c,offset:f}:{container:d[f],offset:-a}};return function(){var a=this._.cache;if(a.ranges)return a.ranges;var c=this.getNative(),d=c&&c.createRange(),e=this.getType();if(!c)return[];if(e==j.SELECTION_TEXT){c=new t(this.document);e=b(d,true);c.setStart(new l(e.container),e.offset);e=b(d);c.setEnd(new l(e.container),
e.offset);return a.ranges=[c]}else if(e==j.SELECTION_ELEMENT){a=this._.cache.ranges=[];for(e=0;e<d.length;e++){var f=d.item(e),g=f.parentNode,h=0;for(c=new t(this.document);h<g.childNodes.length&&g.childNodes[h]!=f;h++);c.setStart(new l(g),h);c.setEnd(new l(g),h+1);a.push(c)}return a}return a.ranges=[]}}():function(){var b=this._.cache;if(b.ranges)return b.ranges;var a=[],c=this.getNative();if(!c)return[];for(var d=0;d<c.rangeCount;d++){var e=c.getRangeAt(d),f=new t(this.document);f.setStart(new l(e.startContainer),
e.startOffset);f.setEnd(new l(e.endContainer),e.endOffset);a.push(f)}return b.ranges=a},getStartElement:function(){var b=this._.cache;if(b.startElement!==undefined)return b.startElement;var a,c=this.getNative();switch(this.getType()){case j.SELECTION_ELEMENT:return this.getSelectedElement();case j.SELECTION_TEXT:var d=this.getRanges()[0];if(d)if(!d.collapsed){for(d.optimize();;){a=d.startContainer;if(d.startOffset==(a[0].childNodes?a[0].childNodes.length:a[0].nodeValue.length)&&!a._4e_isBlockBoundary())d.setStartAfter(a);
else break}a=d.startContainer;if(a[0].nodeType!=m.NODE_ELEMENT)return a.parent();a=new l(a[0].childNodes[d.startOffset]);if(!a[0]||a[0].nodeType!=m.NODE_ELEMENT)return d.startContainer;for(d=a[0].firstChild;d&&d.nodeType==m.NODE_ELEMENT;){a=new l(d);d=d.firstChild}return a}if(k.ie){d=c.createRange();d.collapse(true);a=d.parentElement()}else if((a=c.anchorNode)&&a.nodeType!=m.NODE_ELEMENT)a=a.parentNode}return b.startElement=a?new l(a):null},getSelectedElement:function(){var b=this._.cache;if(b.selectedElement!==
undefined)return b.selectedElement;var a=this,c=C(function(){return a.getNative().createRange().item(0)},function(){for(var d=a.getRanges()[0],e,f,g=2;g&&!((e=d.getEnclosedNode())&&e[0].nodeType==m.NODE_ELEMENT&&y[e._4e_name()]&&(f=e));g--)d.shrink(x.SHRINK_ELEMENT);return f[0]});return b.selectedElement=c?new l(c):null},reset:function(){this._.cache={}},selectElement:function(b){var a;if(k.ie){this.getNative().empty();try{a=this.document.body.createControlRange();a.addElement(b[0]);a.select()}catch(c){a=
this.document.body.createTextRange();a.moveToElementText(b[0]);a.select()}finally{}}else{a=this.document.createRange();a.selectNode(b[0]);b=this.getNative();b.removeAllRanges();b.addRange(a)}this.reset()},selectRanges:function(b){if(k.ie)b[0]&&b[0].select();else{var a=this.getNative();if(!a)return;a.removeAllRanges();for(var c=0;c<b.length;c++){var d=b[c],e=this.document.createRange(),f=d.startContainer;d.collapsed&&k.gecko&&k.gecko<1.09&&f[0].nodeType==m.NODE_ELEMENT&&!f[0].childNodes.length&&f[0].appendChild(this.document.createTextNode(""));
e.setStart(f[0],d.startOffset);e.setEnd(d.endContainer[0],d.endOffset);a.addRange(e)}}this.reset()},createBookmarks2:function(b){for(var a=[],c=this.getRanges(),d=0;d<c.length;d++)a.push(c[d].createBookmark2(b));return a},createBookmarks:function(b){for(var a=[],c=this.getRanges(),d=c.length,e,f=0;f<d;f++){a.push(e=c[f].createBookmark(b,true));var g=(b=e.serializable)?p.one("#"+e.startNode):e.startNode;e=b?p.one("#"+e.endNode):e.endNode;for(var h=f+1;h<d;h++){var i=c[h],s=i.startContainer,q=i.endContainer;
n._4e_equals(s,g.parent())&&i.startOffset++;n._4e_equals(s,e.parent())&&i.startOffset++;n._4e_equals(q,g.parent())&&i.endOffset++;n._4e_equals(q,e.parent())&&i.endOffset++}}return a},selectBookmarks:function(b){for(var a=[],c=0;c<b.length;c++){var d=new t(this.document);d.moveToBookmark(b[c]);a.push(d)}this.selectRanges(a);return this},getCommonAncestor:function(){var b=this.getRanges();return b[0].startContainer._4e_commonAncestor(b[b.length-1].endContainer)},scrollIntoView:function(){this.getStartElement().scrollIntoView()}});
o.Selection=v;var z={table:1,tbody:1,tr:1},E=D.whitespaces(true),F=/\ufeff|\u00a0/;t.prototype.select=k.ie?function(b){var a=this.collapsed,c,d;if(this.startContainer[0].nodeType==m.NODE_ELEMENT&&this.startContainer._4e_name()in z||this.endContainer[0].nodeType==m.NODE_ELEMENT&&this.endContainer._4e_name()in z)this.shrink(m.NODE_ELEMENT,true);var e=this.createBookmark(),f=e.startNode,g;if(!a)g=e.endNode;e=this.document.body.createTextRange();e.moveToElementText(f[0]);e.moveStart("character",1);if(g){b=
this.document.body.createTextRange();b.moveToElementText(g[0]);e.setEndPoint("EndToEnd",b);e.moveEnd("character",-1)}else{for(c=f[0].nextSibling;c&&!E(c);)c=c.nextSibling;c=!(c&&c.nodeValue&&c.nodeValue.match(F))&&(b||!f[0].previousSibling||f[0].previousSibling&&n._4e_name(f[0].previousSibling)=="br");d=this.document.createElement("span");d.innerHTML="&#65279;";d=new l(d);n.insertBefore(d[0],f[0]);c&&n.insertBefore(this.document.createTextNode("\ufeff"),f[0])}this.setStartBefore(f);f._4e_remove();
if(a){if(c){e.moveStart("character",-1);e.select();this.document.selection.clear()}else e.select();if(d){this.moveToPosition(d,x.POSITION_BEFORE_START);d._4e_remove()}}else{this.setEndBefore(g);g.remove();e.select()}}:function(){var b=this.startContainer;this.collapsed&&b[0].nodeType==m.NODE_ELEMENT&&!b[0].childNodes.length&&b[0].appendChild(this.document.createTextNode(""));var a=this.document.createRange();a.setStart(b[0],this.startOffset);try{a.setEnd(this.endContainer[0],this.endOffset)}catch(c){if(c.toString().indexOf("NS_ERROR_ILLEGAL_VALUE")>=
0){this.collapse(true);a.setEnd(this.endContainer[0],this.endOffset)}else throw c;}b=A(this.document).getNative();b.removeAllRanges();b.addRange(a)};o.on("instanceCreated",function(b){B(b.editor)})});