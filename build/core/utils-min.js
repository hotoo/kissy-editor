KISSY.Editor.add("utils",function(j){var f=KISSY,m=f.Node,e=f.DOM,k=f.Config.debug,n=f.UA;j.Utils={getFlashUrl:function(a){var b="",d=j.NODE;if(a._4e_name()=="object"){a=a[0].childNodes;for(var c=0;c<a.length;c++)if(a[c].nodeType==d.NODE_ELEMENT)if((e.attr(a[c],"name")||"").toLowerCase()=="movie")b=e.attr(a[c],"value");else if(e._4e_name(a[c])=="embed")b=e.attr(a[c],"src");else e._4e_name(a[c])=="object"&&e.attr(a[c],"data")}else if(a._4e_name()=="embed")b=a.attr("src");return b},debugUrl:function(a){if(!k)return"build/"+
a.replace(/\.(js|css)/i,"-min.$1");if(k==="dev")return a;return"build/"+a},lazyRun:function(a,b,d){var c=a[b],g=a[d];a[b]=function(){c.apply(this,arguments);a[b]=a[d];return g.apply(this,arguments)}},getXY:function(a,b,d,c){d=d.defaultView||d.parentWindow;a-=e.scrollLeft(d);b-=e.scrollTop(d);if(c)if(d!=(c.defaultView||c.parentWindow)&&d.frameElement){c=e._4e_getOffset(d.frameElement,c);a+=c.left;b+=c.top}return{left:a,top:b}},tryThese:function(){for(var a,b=0,d=arguments.length;b<d;b++){var c=arguments[b];
try{a=c();break}catch(g){}}return a},arrayCompare:function(a,b){if(!a&&!b)return true;if(!a||!b||a.length!=b.length)return false;for(var d=0;d<a.length;d++)if(a[d]!==b[d])return false;return true},getByAddress:function(a,b,d){a=a.documentElement;for(var c=0;a&&c<b.length;c++){var g=b[c];if(d)for(var l=-1,i=0;i<a.childNodes.length;i++){var h=a.childNodes[i];if(!(d===true&&h.nodeType==3&&h.previousSibling&&h.previousSibling.nodeType==3)){l++;if(l==g){a=h;break}}}else a=a.childNodes[g]}return a?new m(a):
null},clearAllMarkers:function(a){for(var b in a)a[b]._4e_clearMarkers(a,true)},htmlEncodeAttr:function(a){return a.replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/,"&gt;")},ltrim:function(a){return a.replace(/^\s+/,"")},rtrim:function(a){return a.replace(/\s+$/,"")},trim:function(a){return this.ltrim(this.rtrim(a))},mix:function(){for(var a={},b=0;b<arguments.length;b++)a=f.mix(a,arguments[b]);return a},isCustomDomain:function(){if(!n.ie)return false;var a=document.domain,b=window.location.hostname;
return a!=b&&a!="["+b+"]"}}});
