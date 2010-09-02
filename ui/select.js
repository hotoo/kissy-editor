/**
 * select component for kissy editor
 * @author:yiminghe@gmail.com
 */
KISSY.Editor.add("select", function() {
    var S = KISSY,
        Node = S.Node,
        Event = S.Event,
        DOM = S.DOM,
        KE = S.Editor,
        TITLE = "title",
        ke_menu_selected = "ke-menu-selected",
        markup = "<a href='#' class='ke-select'><span class='ke-select-text'></span>" +
            "<span class='ke-select-drop'></span></a>",
        menu_markup = "<div class='ke-menu' onmousedown='return false;'></div>";


    function Select(cfg) {
        var self = this;
        Select.superclass.constructor.call(self, cfg);
        self._init();
    }

    Select.ATTRS = {
        container:{},
        doc:{},
        value:{},
        width:{},
        title:{},
        items:{}
    };

    S.extend(Select, S.Base, {
        _init:function() {
            var self = this,
                container = self.get("container"),
                el = new Node(markup),
                title = self.get(TITLE),
                text = el.one(".ke-select-text"),
                drop = el.one(".ke-select-drop");
            text.html(title);
            text.css("width", self.get("width"));
            //ie6,7 不失去焦点
            el._4e_unselectable();
            el.attr(TITLE, title);
            el.appendTo(container);
            el.on("click", self._click, self);
            self.el = el;
            self.title = text;
            KE.Utils.lazyRun(this, "_prepare", "_real");
            self.on("afterValueChange", self._valueChange, self);
        },

        /**
         * 当逻辑值变化时，更新select的显示值
         * @param ev
         */
        _valueChange:function(ev) {
            var v = ev.newVal,
                self = this,
                name = self.get(TITLE),
                items = self.get("items");
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.value == v) {
                    name = item.name;
                    break;
                }
            }
            self.title.html(name);
        },
        _prepare:function() {
            var self = this,
                el = self.el,
                menuNode = new Node(menu_markup),
                menu = new KE.SimpleOverlay({
                    el:menuNode,
                    focusMgr:false
                }),
                items = self.get("items");

            if (self.get(TITLE)) {
                new Node("<div class='ke-menu-title ke-select-menu-item' " +
                    "style='" +
                    "margin-top:-6px;" +
                    "' " +
                    ">" + self.get("title") + "</div>").appendTo(menuNode);
            }


            for (var i = 0; i < items.length; i++) {
                var item = items[i],a = new Node("<a " +
                    "class='ke-select-menu-item' " +
                    "href='#' data-value='" + item.value + "'>"
                    + item.name + "</a>", item.attrs);
                a._4e_unselectable();
                a.appendTo(menuNode);
            }
            self.get("popUpWidth") && menuNode.css("width", self.get("popUpWidth"));
            menuNode.appendTo(document.body);

            self.menu = menu;
            menu.on("show", function() {
                el.addClass("ke-select-active");
            });
            menu.on("hide", function() {
                el.removeClass("ke-select-active");
            });
            Event.on([document,self.get("doc")], "click", function(ev) {
                if (el._4e_contains(ev.target)) return;
                menu.hide();
            });
            menuNode.on("click", self._select, self);
            self.as = menuNode.all("a");
            var as = self.as;
            //mouseenter kissy core bug
            Event.on(menuNode[0], 'mouseenter', function() {
                as.removeClass(ke_menu_selected);
            });
        },
        _select:function(ev) {
            ev.halt();
            var self = this,
                menu = self.menu,
                menuNode = menu.el,
                t = new Node(ev.target),
                a = t._4e_ascendant(function(n) {
                    return menuNode._4e_contains(n) && n._4e_name() == "a";
                }, true);

            if (!a) return;
            var preVal = self.get("value"),newVal = a.attr("data-value");
            //更新逻辑值
            self.set("value", newVal);

            //触发 click 事件，必要时可监听 afterValueChange
            self.fire("click", {
                newVal:newVal,
                preVal:preVal,
                name:a.html()
            });
            menu.hide();
        },
        _real:function() {
            var self = this,xy = self.el.offset();
            xy.top += self.el.height() + 8;
            xy.left += 1;
            if (xy.left + self.menu.el.width() > DOM.viewportWidth() - 60) {
                xy.left = DOM.viewportWidth() - self.menu.el.width() - 60;
            }
            self.menu.show(xy);
        },
        _click:function(ev) {
            ev.preventDefault();
            var self = this,v = self.get("value");
            self._prepare();

            //可能的话当显示层时，高亮当前值对应option
            if (v && self.menu) {
                var as = self.as;
                as.each(function(a) {
                    if (a.attr("data-value") == v) {
                        a.addClass(ke_menu_selected);
                    } else {
                        a.removeClass(ke_menu_selected);
                    }
                });
            }
        }
    });

    KE.Select = Select;
});