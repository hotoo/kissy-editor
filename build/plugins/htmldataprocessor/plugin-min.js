KISSY.Editor.add("htmldataprocessor",function(){var e=KISSY.Editor;if(!e.HtmlDataProcessor){var f=KISSY,j=f.UA,d=e.HtmlParser,g=new d.Filter,h=new d.Filter,k={elementNames:[[/^script$/,""],[/^iframe$/,""],[/^style$/,""],[/^link$/,""],[/^meta$/,""]],elements:{},attributes:{"class":function(a){if(/^ke_/.test(a))return a;return false},style:function(a){if(f.trim(a))return f.trim(a).replace(/mso-.+?(;|$)/ig,"$1").replace(/line-height.+?(;|$)/ig,"").replace(/font-size:.+?pt(;|$)/ig,"").replace(/font-family:.+?(;|$)/ig,
"");return false}},attributeNames:[[/^on/,"ck_on"],[/^lang$/,""]]},i={elementNames:[[/^ke:/,""],[/^\?xml:namespace$/,""]],elements:{embed:function(a){var b=a.parent;if(b&&b.name=="object"){var c=b.attributes.width;b=b.attributes.height;c&&(a.attributes.width=c);b&&(a.attributes.height=b)}},param:function(a){a.children=[];a.isEmpty=true;return a},a:function(a){if(!(a.children.length||a.attributes.name))return false}},attributes:{},attributeNames:[[/^ck_on/,"on"]]};if(j.ie)i.attributes.style=function(a){return a.toLowerCase()};
g.addRules(i);h.addRules(k);e.HtmlDataProcessor={htmlFilter:g,dataFilter:h,toHtml:function(a,b){var c=new d.HtmlWriter;d.Fragment.FromHtml(a,b).writeHtml(c,g);return c.getHtml(true)},toDataFormat:function(a,b){var c=new d.HtmlWriter;a=d.Fragment.FromHtml(a,b);c.reset();a.writeHtml(c,h);return c.getHtml(true)}}}});
