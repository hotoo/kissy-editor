/**
 * Constructor for kissy editor and event, editor instances holder
 * @author: yiminghe@gmail.com, lifesinger@gmail.com
 */
KISSY.add("editor", function(S, undefined) {

    function Editor(textarea, cfg) {
        var self = this;

        if (!(self instanceof Editor)) {
            return new Editor(textarea, cfg);
        }

        if (S.isString(textarea)) {
            textarea = S.one(textarea);
        }
        if (!textarea[0]) textarea = new Node(textarea);

        self.cfg = cfg;

        S.app(self, S.EventTarget);
        self.use = function(mods) {
            S.use.call(self, mods, function() {
                self.on("dataReady", function() {
                    self.setData(textarea.val());
                });
            }, { order:  true, global:  Editor });
        };

        self.init(textarea);
        return undefined;
    }

    S.app(Editor, S.EventTarget);
    Editor.Config.base = S.Config.base + "editor/";
    function debugUrl(url) {
        if (!debug) return "build/" + url.replace(/\.(js|css)/i, "-min.$1");
        if (debug === "dev") {
            return url;
        }
        return "build/" + url;
    }

    var debug = S.Config.debug,mods = {
        "htmlparser": {
            attach: false,
            path: debugUrl("plugins/htmldataprocessor/htmlparser/htmlparser.js")
        }
    },
        core_mods = [
            "utils","focusmanager","definition",
            "dtd","dom", "elementpath",
            "walker","range","domiterator",
            "selection","styles"
        ],
        plugin_mods = [
            "clipboard",
            {
                name: "color",
                useCss: true
            },
            {
                name: "elementpaths",
                useCss: true
            },
            "enterkey",
            "fakeobjects",
            {
                name: "flash",
                requires: ["fakeobjects","overlay"]
            },
            "font",
            "format",
            {
                name: "htmldataprocessor",
                requires: ["htmlparser-text"]
            },
            {
                name: "image",
                requires: ["overlay"]
            },
            "indent",
            "justify",
            "link",
            "list",
            "maximize",
            "music",
            "preview",
            "removeformat",
            {
                name: "smiley",
                useCss: true
            },
            "sourcearea",
            {
                name: "table",
                useCss: true,
                requires: ["overlay",
                    "contextmenu"]
            },
            {
                name: "templates",
                requires: ["overlay"],
                useCss: true
            },
            "undo"
        ],
        htmlparser_mods = [
            {
                name: "htmlparser-basicwriter",
                requires: ["htmlparser"]
            },
            {
                name: "htmlparser-element",
                requires: ["htmlparser-fragment"]
            },
            {
                name: "htmlparser-filter",
                requires: ["htmlparser-element"]
            },
            {
                name: "htmlparser-fragment",
                requires: ["htmlparser-htmlwriter"]
            },
            {
                name: "htmlparser-htmlwriter",
                requires: ["htmlparser-basicwriter"]
            },
            {
                name: "htmlparser-text",
                requires: ["htmlparser-filter"]
            }
        ],
        ui_mods = [
            {name:"button"},
            {
                name:"overlay",
                useCss:true
            },
            {
                name: "contextmenu",
                requires: ["overlay"]   ,
                useCss:true
            }
        ],
        i, len, mod, name, requires;

    // ui modules
    for (i = 0,len = ui_mods.length; i < len; i++) {
        mod = ui_mods[i];
        name = mod;
        requires = undefined;

        if (!S.isString(mod)) {
            requires = mod.requires;
            name = mod.name;
        }

        mods[name] = {
            attach: false,
            requires: requires,
            path: debugUrl("ui/" + name + ".js"),
            csspath: mod.useCss ? debugUrl("ui/" + name + ".css") : ""
        };
    }

    // plugins modules
    for (i = 0,len = plugin_mods.length; i < len; i++) {
        mod = plugin_mods[i];
        name = mod;
        requires = ["button"];

        if (!S.isString(mod)) {
            mod.requires && (requires = requires.concat(mod.requires));
            name = mod.name;
        }

        mods[name] = {
            attach: false,
            requires: requires,
            csspath: (mod.useCss ? debugUrl("plugins/" + name + "/plugin.css") : undefined),
            path: debugUrl("plugins/" + name + "/plugin.js")
        };
    }

    // htmlparser
    for (i = 0,len = htmlparser_mods.length; i < len; i++) {
        mod = htmlparser_mods[i];
        requires = undefined;

        if (!S.isString(mod)) {
            requires = mod.requires;
            mod = mod.name;
        }

        mods[mod] = {
            attach: false,
            requires: requires,
            path: debugUrl("plugins/htmldataprocessor/htmlparser/" + mod.substring(11) + ".js")
        };
    }

    Editor.add(mods);

    mods = { };
    for (i = 0,len = core_mods.length; i < len; i++) {
        mod = core_mods[i];
        mods[mod] = {
            host: "editor",
            requires: i > 0 ? core_mods[i - 1] : []
        };
    }
    Editor.add(mods);

    S.Editor = Editor;
});
