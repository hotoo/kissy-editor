KISSY.Editor.add("enterkey",function(n){var h=KISSY.Editor,j=KISSY,k=j.UA,q=/^h[1-6]$/,r=h.XHTML_DTD,l=j.Node,s=j.Event,t=h.Walker,u=h.ElementPath;h.enterBlock||function(){function v(a){a=a.getSelection().getRanges();for(var b=a.length-1;b>0;b--)a[b].deleteContents();return a[0]}function w(a){var b=v(a),g=b.document;if(b.checkStartOfBlock()&&b.checkEndOfBlock()){var c=(new u(b.startContainer)).block;if(c&&(c._4e_name()=="li"||c.parent()._4e_name()=="li")){a.execCommand("outdent");return}}var f=b.splitBlock("p");
if(f){a=f.previousBlock;c=f.nextBlock;var o=f.wasStartOfBlock,m=f.wasEndOfBlock,d;if(c){d=c.parent();if(d._4e_name()=="li"){c._4e_breakParent(d);c._4e_move(c._4e_next(),true)}}else if(a&&(d=a.parent())&&d._4e_name()=="li"){a._4e_breakParent(d);b.moveToElementEditablePosition(a._4e_next());a._4e_move(a._4e_previous())}if(!o&&!m){if(c._4e_name()=="li"&&(d=c._4e_first(t.invisible(true)))&&j.inArray(d._4e_name(),["ul","ol"]))(k.ie?new l(g.createTextNode("\u00a0")):new l(g.createElement("br"))).insertBefore(d);
c&&b.moveToElementEditablePosition(c)}else{var e;if(a){if(a._4e_name()=="li"||!q.test(a._4e_name()))e=a._4e_clone()}else if(c)e=c._4e_clone();e||(e=new l("p",null,g));if(d=f.elementPath){f=0;for(var x=d.elements.length;f<x;f++){var i=d.elements[f];if(i._4e_equals(d.block)||i._4e_equals(d.blockLimit))break;if(r.$removeEmpty[i.getName()]){i=i._4e_clone();e._4e_moveChildren(i);e.append(i)}}}k.ie||e._4e_appendBogus();b.insertNode(e);if(k.ie&&o&&(!m||!a[0].childNodes.length)){b.moveToElementEditablePosition(m?
a:e);b.select()}b.moveToElementEditablePosition(o&&!m?c:e)}if(!k.ie)if(c){g=new l(g.createElement("span"));g.html("&nbsp;");b.insertNode(g);g._4e_scrollIntoView();b.deleteContents()}else e._4e_scrollIntoView();b.select()}}function p(a){s.on(a.document,"keydown",function(b){if(b.keyCode===13)if(!b.shiftKey){a.execCommand("enterBlock");b.preventDefault()}})}p.enterBlock=w;h.EnterKey=p}();n.addPlugin(function(){n.addCommand("enterBlock",{exec:h.EnterKey.enterBlock});h.EnterKey(n)})});