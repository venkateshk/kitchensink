/*jslint plusplus: true*/
/*globals window: true, document: true*/
(function(window) {
    var attribPrefix = "data-pp-",
        rootNamespace = "__PP",
		namespace = "c" + (new Date).getTime() + Math.floor(65536 * Math.random()),
        adIdx = 0,
        PPScript,
		Ad,
		j,
		script,
		pubid,
		placement,
		ppScript,
		scripts = document.getElementsByTagName("script"),
        dim = [650, 600],
        u = function(a) {
            var b = {};
            a || (a = window.event);
            b.target = a.target || a.srcElement;
            3 === b.target.nodeType && (b.target = b.target.parentNode);
            b.preventDefault = a.preventDefault ? function() {
                this.originalEvent.preventDefault()
            } : function() {
                this.originalEvent.returnValue = !1
            };
            b.originalEvent = a;
            return b
        },
        l = function(a, b) {
            return function(c) {
                return b.call(a, u(c))
            }
        },
        doc = {
            "goto": function(a) {
                window.location = a
            },
            popup: function(a, b, c) {
                return window.open(a, b, c)
            },
            createElement: function(a) {
                return document.createElement(a)
            },
            getElementsByTagName: function(a) {
                return document.getElementsByTagName(a)
            },
            registerEvent: window.addEventListener ? function(a, b, c, f) {
                a.addEventListener(b, l(a, c), !!f)
            } : window.attachEvent ? function(a, b, c) {
                a.attachEvent("on" + b, l(a, c))
            } : function(a, b, c) {
                var f = a["on" + b];
                f && (c = function() {
                    l(a, c).call(this);
                    f.call(this)
                });
                a["on" + b] = c
            }
        },
        request = function(a) {
            var scripts = doc.createElement("script");
            scripts.async = "true";
            scripts.src = a;
            this.el = scripts;
            this.attach();
        };
    window.__PP = window.__PP || {};
    request.prototype = {
        constructor: request,
        attach: function() {
            var scriptRef = doc.getElementsByTagName("script")[0];
            scriptRef.parentNode.insertBefore(this.el, scriptRef);
            this.attach = function() {}
        },
        destroy: function() {
            this.el.parentNode.removeChild(this.el);
            delete this.el
        }
    };

    PPScript = function(el) {
        this.el = el
    };

    PPScript.prototype = {
        constructor: PPScript,
        getKVs: function() {
			var attribs = this.el.attributes,
				kvs = {},
				attrib,
				idx;
            for (var b = attribs.length; b--;) {
				attrib = attribs[b];
				idx = attrib.name.indexOf(attribPrefix);
				if (0 === idx)
				{
					kvs[attrib.name] = attrib.value;
				}
			}
            return kvs
        },
        injectAd: function() {
            this.el.parentNode.insertBefore(this.ad.container, this.el)
        },
        registerListeners: function() {
            var a = this;
            doc.registerEvent(this.ad.container, "click", function() {
                a.ad.clickHandler.apply(a.ad, arguments)
            })
        },
        destroyDom: function() {
            this.el.parentNode.removeChild(this.el);
            delete this.el
        }
    };
    Ad = function(kvs) {
        this.idx = adIdx++;
        this.namespace = namespace + this.idx;
        this.kvs = kvs;
        this.initContainer();
        this.initCallback();
        this.initQueryString()
    };
    Ad.prototype = {
        constructor: Ad,
        initContainer: function() {
            this.container = doc.createElement("span")
        },
        injectScripts: function(response) {
            var div = document.createElement('div');
            div.innerHTML = response;
            var scripts = div.getElementsByTagName('script');
            var i = scripts.length;
            while (i--) {
                var scr = document.createElement("script");
                scr.text = scripts[i].text;
                this.container.appendChild(scr);
                scripts[i].parentNode.removeChild(scripts[i]);
            }
            return div.innerHTML;
        },
        setContent: function(response) {
            this.container.innerHTML = response
        },
        callback: function(response) {
            response = this.injectScripts(response);
            this.setContent(response);
            this.script.destroy();
            delete window.__PP[this.namespace];
            delete this.script
        },
        initCallback: function() {
            this.callbackName = "__PP." + this.namespace;
            var a = this;
            window.__PP[this.namespace] = function() {
                a.callback.apply(a, arguments)
            }
        },
        clickHandler: function(a) {
            var target1 = a.target,
                popup = this.kvs["data-pp-popup"],
                attribs = ["width=" + dim[0], "height=" + dim[1], "scrollbars=yes,resizable=no,location=no,toolbar=no,menubar=no,dependent=no,dialog=yes,minimizable=no"].join();
            if ("img" === target1.nodeName.toLowerCase() && (target1 = target1.parentNode, !popup || "true" === popup)) doc.popup(target1.href, this.namespace, attribs), a.preventDefault()
        },
        request: function() {
	    this.script = new request("https://www.paypal.com/imadserver/ads" + this.queryString)
        },
        initQueryString: function() {
            var qstring = "?",
                params = ["callback=" + this.callbackName, "format=HTML", "v=2.4", "vtag=3.1", "rand=" + (new Date).getTime()],
                key,
				name;
            for (key in this.kvs) {
				if (this.kvs.hasOwnProperty(key))
				{
					name = key.substr(attribPrefix.length);
					params.push(name + "=" + encodeURIComponent(this.kvs[key]));
				}
			}
            this.queryString = (qstring += params.join("&"));
        }
    };
    for (j = 0; j < scripts.length; j++) {
		script = scripts[j];
		pubid = script.getAttribute("data-pp-pub_id");
		placement = script.getAttribute("data-pp-placement_code");
        if (pubid && placement) {
            ppScript = new PPScript(script);
            ppScript.ad = new Ad(ppScript.getKVs());
            ppScript.injectAd();
            ppScript.registerListeners();
            ppScript.ad.request();
            ppScript.destroyDom();
            break;
        }
	}
})(this);
