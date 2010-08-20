/**
 * constructor for kissy editor and event,editor instances holder
 * @author:yiminghe@gmail.com
 */
KISSY.add("editor", function(S) {
    function Editor(textarea, cfg) {
        var self = this;
        if (!(self instanceof Editor)) {
            return new Editor(textarea, cfg);
        }
        if (S.isString(textarea)) {
            textarea = S.one(textarea);
        }
        if (!textarea[0]) textarea = new Node(textarea);
        S.app(self, S.EventTarget);
        self.cfg = cfg;
        self.use = function(plugins) {
            //debugger
            S.use.call(self, plugins, function() {
                self.on("dataReady", function() {
                    self.setData(textarea.val());
                });
            }, {
                order:true,
                global:Editor
            });
        };
        self.init(textarea);
    }

    S.app(Editor, S.EventTarget);

    Editor.Config.base = S.Config.base + "editor/";
    var cores = {},
        plugins = {
            "htmlparser":{
                attach:false,
                path:"plugins/htmldataprocessor/htmlparser/htmlparser.js"
            }
        },
        core_names = [
            "utils","focusmanager","definition",
            "dtd","dom", "elementpath",
            "walker","range","domiterator",
            "selection","styles"
        ],
        plugin_names = [
            "clipboard",
            {
                name:"color",
                useCss:true
            },
            {
                name:"elementpaths",
                useCss:true
            },
            "enterkey",
            "fakeobjects",
            {
                name:"flash",
                requires:["fakeobjects","overlay"]
            },
            "font",
            "format",
            {
                name:"htmldataprocessor",
                requires:["htmlparser-text"]
            },
            "image",
            "indent",
            "justify",
            "link",
            "list",
            "maximize",
            "music",
            "preview",
            "removeformat",
            {
                name:"smiley",
                useCss:true
            },
            "sourcearea",
            {
                name:"table",
                useCss:true,
                requires:["overlay",
                    "contextmenu"]
            },
            {
                name:"templates",
                useCss:true
            },
            "undo"
        ],
        htmlparser_names = [
            {
                name:"htmlparser-basicwriter",
                requires:["htmlparser"]
            },
            {
                name:"htmlparser-element",
                requires:["htmlparser-fragment"]
            },
            {
                name:"htmlparser-filter",
                requires:["htmlparser-element"]
            },
            {
                name:"htmlparser-fragment",
                requires:["htmlparser-htmlwriter"]
            },
            {
                name:"htmlparser-htmlwriter",
                requires:["htmlparser-basicwriter"]
            },
            {
                name:"htmlparser-text",
                requires:["htmlparser-filter"]
            }
        ],
        n,
        name,
        i,
        requires,
        uis = [
            "button","overlay",
            {
                name:"contextmenu",
                requires:["overlay"]
            }
        ];
    for (i = 0; i < uis.length; i++) {
        n = uis[i];
        requires = null;
        if (!S.isString(n)) {
            requires = n.requires;
            n = n.name;
        }
        plugins[n] = {
            attach:false,
            requires:requires,
            path:"ui/" + n + ".js",
            csspath:"ui/" + n + ".css"
        };

    }
    for (i = 0; i < plugin_names.length; i++) {
        n = plugin_names[i];
        name = n;
        requires = ["button"];
        if (!S.isString(n)) {
            n.requires && (requires = requires.concat(n.requires));
            name = n.name;
        }
        plugins[name] = {
            attach:false,
            requires:requires,
            csspath:(n.useCss ? "plugins/" + name + "/plugin.css" : null),
            path:"plugins/" + name + "/plugin.js"
        };
    }
    for (i = 0; i < htmlparser_names.length; i++) {
        n = htmlparser_names[i];
        requires = null;
        if (!S.isString(n)) {
            requires = n.requires;
            n = n.name;
        }
        plugins[n] = {
            attach:false,
            requires:requires,
            path:"plugins/htmldataprocessor/htmlparser/" + n.substring(11) + ".js"
        };
    }

    //debugger
    Editor.add(plugins);
    var last = null;
    for (i = 0; i < core_names.length; i++) {
        n = core_names[i];
        cores[n] = {
            host:"editor",
            requires:last || []
        };
        last = [n];
    }
    Editor.add(cores);
    S.Editor = Editor;
});