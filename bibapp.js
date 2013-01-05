/*! Copyright 2012 Rasmus Erik */
/*global document:true window:true process:true location:true require:true __dirname:true console:true parseInt:true */
(function() {
    "use strict";
    var isClient = !!(typeof window === "object" && window.document);
    var isServer = !!(typeof process === "object" && process.versions && process.versions.node);
    // Config {{{1
    var host = "localhost";
    var port = 8888;
    // Util {{{1
    function uniqId(prefix) {
        prefix = prefix || "_";
        ++uniqIdCounter;
        return prefix + String(uniqIdCounter);
    }
    var uniqIdCounter = 0;
    // RPC {{{
    function registerRPC(socket) {
        socket.on("rpc", function(data) {
            if(data.response) {
                if(rpcRequests[data.response]) {
                    rpcRequests[data.response](data.error, data.result);
                    delete rpcRequests[data.response];
                }
            } else if(data.request) {
                if(rpcFunctions[data.fn]) {
                    rpcFunctions[data.fn](data.content, function(error, result) {
                        socket.emit("rpc", {response: data.request, error: error, result: result});
                    });
                } else {
                    socket.emit("rpc", {id: data.requestId, error: "function not found: " + data.fn});
                }
            }
        });
    }
    var rpcFunctions = {};
    var rpcRequests = {};
    var rpcRequestCount = 0;
    var rpcTimeout = 10000;

    function rpcCallback(name, fn) {
        rpcFunctions[name] = fn;
    }

    function rpcCall(name, data, callback) {
        var id = ++rpcRequestCount;
        rpcRequests[id] = callback;
        setTimeout(function() {
            if(rpcRequests[id]) {
                rpcRequests[id]("timeout", undefined);
                delete rpcRequests[id];
            }
        }, rpcTimeout);
        socket.emit("rpc", {fn: name, request: id, content: data});
    }
    //}}}
    // client socket {{{
    var io = isServer ? require('socket.io-client') : window.io;
    var socket = io.connect("http://" + host + ":" + port);
    registerRPC(socket);
    
    
    //}}}
    function arrayToSetObject(arr) { //{{{
        var i;
        var result = {};
        for(i=0;i< arr.length; ++i) {
            result[arr[i]] = true;
        }
        return result;
    } //}}}
    function notEmpty(obj) { //{{{
        return Object.keys(obj).length !== 0;
    }//}}}
    var xmlEntities = { //{{{
        amp: "&",
        quot: "\"",
        nbsp: "\xa0",
    }; //}}}
    function jmlFilterWs(jml) { //{{{
        if(typeof jml === "string") {
            return jml.trim();
        } else if(Array.isArray(jml)) {
            return jml.map(jmlFilterWs).filter(function(s) { return s !== ""; });
        } else {
            return jml;
        }
    } //}}}
    function strToJml(str) { //{{{
        var errors = [];
        function JsonML_Error(str) {
            errors.push(str);
        }
        if(typeof(str) !== "string") {
            throw "parameter must be string"
        }
    
        /** white space definition */
        var whitespace = " \n\r\t";
        /** the current char in the string that is being parsed */
        var c = str[0];
        /** The position in the string */
        var pos = 0;
        /** Stack for handling nested tags */
        var stack = [];
        /** Current tag being parsed */
        var tag = [];
        /** read the next char from the string */
        function next_char() { c = ++pos < str.length ? str[pos] : undefined; }
        /** check if the current char is one of those in the string parameter */
        function is_a(str) { return str.indexOf(c) !== -1; }
        /** return the string from the current position to right before the first
         * occurence of any of symb. Translate escaped xml entities to their value
         * on the fly.
         */
        function read_until(symb) {
            var result = "";
            while(c && !is_a(symb)) {
                if(c === '&') {
                    next_char();
                    var entity = read_until(';');
                    if(entity[0] === '#') {
                        if(entity[1] === 'x') {
                            c = String.fromCharCode(parseInt(entity.slice(2), 16));
                        } else {
                            c = String.fromCharCode(parseInt(entity.slice(1), 10));
                        }
                    } else {
                        c = xmlEntities[entity];
                        if(!c) {
                            JsonML_Error("error: unrecognisable xml entity: " + entity);
                        }
                    }
                }
                result += c;
                next_char();
            }
            return result
        }
    
        // The actual parsing
        while(is_a(whitespace)) { next_char(); }
        while(c) {
            if(is_a("<")) {
                next_char();
    
                // `<?xml ... >`, `<!-- -->` or similar - skip these
                if(is_a("?!")) {
                    if(str.slice(pos, pos+3) === "!--") {
                        pos += 3;
                        while(pos <= str.length && str.slice(pos, pos+2) !== "--") {
                            ++pos;
                        }
                    }
                    read_until('>');
                    next_char();
    
                // `<sometag ...>` - handle begin tag
                } else if(!is_a("/")) {
                    // read tag name
                    var newtag = [read_until(whitespace+">/")];
    
                    // read attributes
                    var attributes = {};
                    while(c && is_a(whitespace)) { next_char(); }
                    while(c && !is_a(">/")) {
                        var attr = read_until(whitespace + "=>");
                        if(c === "=") {
                            next_char();
                            var value_terminator = whitespace+">/";
                            if(is_a('"\'')) { value_terminator = c; next_char(); }
                            attributes[attr] = read_until(value_terminator);
                            if(is_a('"\'')) { next_char(); }
                        } else {
                            JsonML_Error("something not attribute in tag");
                        }
                        while(c && is_a(whitespace)) { next_char(); }
                    }
                    newtag.push(attributes);
    
                    // end of tag, is it `<.../>` or `<...>`
                    if(is_a("/")) {
                        next_char();
                        if(!is_a(">")) {
                            JsonML_Error('expected ">" after "/" within tag');
                        }
                        tag.push(newtag);
                    } else {
                        stack.push(tag);
                        tag = newtag;
                    }
                    next_char();
    
                // `</something>` - handle end tag
                } else {
                    next_char();
                    if(read_until(">") !== tag[0]) {
                        JsonML_Error("end tag not matching: " + tag[0]);
                    }
                    next_char();
                    var parent_tag = stack.pop();
                    if(tag.length <= 2 && !Array.isArray(tag[1]) && typeof(tag[1]) !== "string") {
                        tag.push("");
                    }
                    parent_tag.push(tag);
                    tag = parent_tag;
    
                }
    
            // actual content / data between tags
            } else {
                tag.push(read_until("<"));
            }
        }
        if(errors.length) {
            console.log(errors);
        }
        return tag;
    } //}}}
    function jmlTrimmedTexts(data) {//{{{
        if(typeof data === "string") {
            return data.trim();
        } else if(Array.isArray(data)) {
            return data.slice(2).map(jmlTrimmedTexts).filter(function(a) { return a !== ""; }).reduce(function(a,b) { 
                if(Array.isArray(b)) { 
                    return a.concat(b);
                } else {
                    a.push(b); 
                    return a; 
                }
            }, []);
        } else {
            return "";
        }
    }//}}}
        function urlUnescape(str) { //{{{
            return str.replace(/\+/g, " ").replace(/%[0-9a-fA-F][0-9a-fA-F]/g, function(code) {
                return String.fromCharCode(parseInt(code.slice(1), 16));
            });
        } //}}}
    function values(obj) {//{{{
        var result = [];
        for(var key in obj) {
            result.push(obj[key]);
        }
        return result;
    } //}}}
    function formatDate(n) { //{{{
        var d = new Date(n);
        return d.getDate() + "/" + (d.getMonth() + 1);
    } //}}}
    function formatDateOrTime(n) { //{{{
        if(Date.now() - n < 22*60*60*1000) {
            var d = new Date(n);
            return "i dag " + d.getHours() + ":" + String(100 + d.getMinutes()).slice(1);
        } else {
            return formatDate(n);
        }
    } //}}}
    function jmlToDom(jml) { //{{{
        if(Array.isArray(jml)) {
            var children;
            var classes = jml[0].split(".");
            var name = classes[0];
            classes = classes.slice(1);
            var attr = jml[1];
            var pos = 1;
            if(typeof attr === "object" && attr.constructor === Object) {
                ++pos;
                attr = attr;
            } else {
                attr = {};
            }
            if(classes.length) {
                attr["class"] = classes.join(" ");
            }
            var elem = document.createElement(name);
            for(var prop in attr) {
                elem.setAttribute(prop, attr[prop]);
            }
            while(pos < jml.length) {
                if(jml[pos]) {
                    elem.appendChild(jmlToDom(jml[pos]));
                }
                ++pos;
            }
            return elem;
        } else if(typeof jml === "string" || typeof jml === "number") {
            return document.createTextNode(jml);
        } else {
            return jml;
        }
    } //}}}
    function jmlToStr(jml) { //{{{
        if(Array.isArray(jml)) {
            var children;
            var classes = jml[0].split(".");
            var name = classes[0];
            classes = classes.slice(1);
            var attr = jml[1];
            var pos = 1;
            if(typeof attr === "object" && attr.constructor === Object) {
                children = jml.slice(2);
                attr = attr;
            } else {
                children = jml.slice(1);
                attr = {};
            }
            if(classes.length) {
                attr["class"] = classes.join(" ");
            }
            var result = "<" + name +
                Object.keys(attr).map(function(key) {
                    return " " + key + "=\"" + attr[key] + "\"";
                }).join("");

            if(children.length === 0) {
                result += "/>";
            } else {
                result += ">";
                result += children.map(jmlToStr).join("");
                result += "</" + name + ">";
            }

            return result;
        } else {
            return String(jml);
        }
    } //}}}
    // DomProcess {{{
    function DomProcess() { //{{{
        this.apply = function(dom) {
            return this;
        };
    } //}}}
    DomProcess.prototype.bind = function(f) { //{{{
        var apply = this.apply;
        this.apply = function(dom) {
            apply(dom);
            f(dom);
            return this;
        };
        return this;
    }; //}}}
    DomProcess.prototype.css = function(style) { //{{{
        this.bind(function(dom) {
            var styleObj = dom.style;
            for(var prop in style) {
                var val = style[prop];
                if(typeof val === "number") {
                    val = (val |0)  + "px";
                }
                styleObj[prop] = val;
            }
        });
        return this;
    }; //}}}
    DomProcess.prototype.on = function(event, fn) { //{{{
        this.bind(function(dom) {
            var evs = event.split(" ");
            for(var i = 0; i < evs.length; ++i) {
                dom["on" + evs[i]] = fn;
            }
        });
        return this;
    }; //}}}
    //}}}
    function css(obj) { //{{{
        return (new DomProcess()).css(obj);
    } //}}}
    function domRecursiveApply(domNode, table) { //{{{
        var classes = domNode.classList;
        for(var i = 0; i < classes.length; ++i) {
            var entry = table[classes[i]];
            if(entry) {
                entry.apply(domNode);
            }
        }
        if(table["default"]) {
            table["default"].apply(domNode);
        }

        var children = domNode.children;
        for(i=0; i<children.length; ++i) {
            domRecursiveApply(children[i], table);
        }
    } //}}}
    // Model {{{1
    var data = (function() {
        // Sample items {{{
        var sampleEvent = {
            date: 1356706097976,
            title: "Nytårskursus", 
            description: "Kursus om ...",
            url: "http://bibilitek.example.com/foo/bar...html",
            thumbUrl: "http://bibliotek.example.com/foo/bar...jpg"};
        var sampleNews = {
            date: 1356706097976,
            title: "Glædeligt nytår",
            description: "starten af en artikel ....",
            url: "http://bibilitek.example.com/foo/bar...html",
            thumbUrl: "http://bibliotek.example.com/foo/bar...jpg"};
        var sampleSearchResult = {
            id: "830318:48781321",
            title: "Samlede Eventyr",
            creator: "H. C. Andersen",
            type: "book",
            thumbUrl: "http://bibliotek.example.com/foo/bar...",
            description: "Samling af eventyr der ... og så også ... blah blah blah blah blah...",
            status: "available"}; //}}}
        var content = { //{{{
            lastSync: 1356706097976,
            calendar: [sampleEvent, sampleEvent, sampleEvent, sampleEvent, sampleEvent, sampleEvent],
            news: [sampleNews, sampleNews, sampleNews, sampleNews, sampleNews, sampleNews]}; //}}}
        var cache = { //{{{
           materials: {
                "830318:48781321": {
                    lastSync: 1356706097976,
                    id: "830318:48781321",
                    title: "Samlede Eventyr",
                    creator: "H. C. Andersen",
                    dk5: "sk",
                    year: "2001",
                    type: "book",
                    thumbUrl: "http://bibliotek.example.com/foo/bar...",
                    description: "Samling af eventyr der ... og så også ... blah blah blah blah blah...",
                    topic: ["dk5:sk", "dk5Text:Skønlitteratur", "fiktion"],
                    isbn: "87-412-4031-6",
                    sprog: "Dansk",
                    edition: "Jubilæumsudgaven, 2. udgave, 7. oplag",
                    publisher: "Hans Reitzel",
                    "længde": "1029 sider ",
                    status: "available"
                }},
            searches: {
            }}; //}}}
        var patron = { //{{{
            lastSync: Date.now(),
            name: "Joe User",
            loans: {
                "830318:48781323": {
                    expireDate: 1357706097976,
                    id: "830318:48781323",
                    title: "Some title 1",
                    creator: "Some author"},
                "730318:48781321": {
                    expireDate: 1356706097976,
                    id: "830318:48781321",
                    title: "Some title 2",
                    creator: "Some author 2",
                    // set renewRequest if we have requested a renew
                    renewRequest: true }},
            reservations: {
                "830138:48321421": {
                    expireDate: 1356706097976,
                    reservationDate: 1356706097976,
                    id: "830138:48321421",
                    title: "Some title 3",
                    creator: "Some author",
                    // set deleteRequest if we want to delete the reservation
                    deleteRequest: true
                }},
            arrived: {
                "730318:48781321": {
                    expireDate: 1356706097976,
                    reservationDate: 1356706097976,
                    id: "830318:48781321",
                    title: "Some title 4",
                    creator: "Some author",
                    // set deleteRequest if we want to delete the reservation
                    deleteRequest: true,
                    // info about arrival if arrived
                    location: "7/1 nr.\xa032 Husum"
                }} }; //}}}
        return { //{{{
            content: content,
            cache: cache,
            patron: patron
        };
    })(); //}}}
    function searchResults(query) { //{{{
        if(data.cache.searches[query]) {
            return data.cache.searches[query].results;
        } else {
            return [];
        }
    } //}}}
    // Views {{{1
    function genStyles(width, height) { //{{{
        var margin = (width / 40) & ~1;
        var unit = ((width - 7 * margin)/6) | 0;
        var margin0 = (width - 7 * margin - unit * 6) >> 1;
        var smallFont = unit * 0.4;
        function wn(n) { //{{{
            return css({
                verticalAlign: "middle",
                border: "none",
                paddingLeft: 0,
                paddingRight: 0,
                marginLeft: margin,
                marginRight: 0,
                width: unit * n + margin * (n-1),
                display: "inline-block"
                //boxShadow: "1px 1px 4px rgba(0,0,0,1)"
            });
        } //}}}
        var result = { //{{{
            "default": (new DomProcess()).bind(function(dom) {
                (function(href) {
                    if(href && href[0] === "/") {
                        dom.removeAttribute("href");
                        dom.onclick = function() {
                            go(href.slice(1));
                            return false;
                        }
                    }
                })(dom.getAttribute("href"));
            }),
            patronStatus: css({
                textAlign: "center"
            }),
            line: css({
                marginTop: margin,
                //textAlign: "center",
                height: unit
            }),
            homeButton: css({
            }).on("click mousedown touch", function() {
                go("home");
            }),
            patronWidget: css({
            }).on("click mousedown touch", function() {
                go("patron");
            }),
            content: css({
                position: "relative",
                top: unit+margin,
                left: 0,
                width: width
            }),
            icon: css({
                top: 0.05 *unit - 1,
                left: 0,
                width: unit - 2,
                display: "inline-block",
                position: "relative",
                paddingTop: 0.15 * unit, 
                paddingBottom: 0.15 * unit, 
                border: "1px outset",
                borderRadius: margin,
                textAlign: "center",
                fontSize: unit * 0.65 - 2
            }),
            page: css({
                verticalAlign: "middle",
                lineHeight: "100%",
                fontSize: smallFont,
                fontFamily: "arial, sans-serif",
                margin: 0,
                padding: 0,
                display: "inline-block",
                color: "#110",
                background: "#ffe"
            }),
            header: css({
                position: "fixed",
                marginLeft: 0,
                paddingLeft: 0,
                marginTop: 0,
                overflow: "hidden",
                height: unit+margin * 1, width: width,
                background: "rgba(0, 0, 32, .8)",
                boxShadow: "0px 0px " + unit + "px rgba(32,32,0,1)",
                color: "#ffc",
                zIndex: "1"
            }),
            largeWidget: css({
                marginTop: margin,
                height: (height - unit * 3 - margin * 6) >>1,
                marginLeft: margin,
                marginRight: margin,
                overflow: "hidden"
            }),
            resultImg: css({
                float: "left",
                height: 1.618 * unit,
                width: unit,
                backgroundColor: "red",
                marginRight: margin,
                marginBottom: margin
            }).on("click", function() {
                // TODO: remove this example
                //alert("click");
            }),
            resultOrderButton: css({
                float: "right",
                width: unit,
                height: 0,
                background: "red"

            }),
            searchButton: css({
                height: unit, width: unit
            }).on("click mousedown touch", function() {
                var query = document.getElementsByClassName("searchInput")[0].value;
                go("search/" + query);
            }),
            searchResult: css({
                marginTop: margin,
                height: 1.618 * unit,
                 //boxShadow: "1px 1px 4px rgba(0,0,0,1)",
                overflow: "hidden"
            }),
            headerPadding: css({ height: unit+margin }),
            w1: wn(1), w2: wn(2), w3: wn(3),
            w4: wn(4), w5: wn(5), w6: wn(6),
            searchInput: css({
                width: "100%",
                textAlign: "center",
                marginLeft: 0,
                marginTop: unit * 0.05,
                height: unit * 0.65,
                fontSize: smallFont,
                border: "none",
                backgrund: "rgba(255,255,255,0.4)",
                boxShadow: "0px -1px 2px rgba(0,0,0,1)," +
                           "-1px 0px 2px rgba(0,0,0,1)," +
                            "0px 1px 2px rgba(255,255,255,1)," +
                            "1px 0px 2px rgba(255,255,255,1)" ,
                borderRadius: margin
            }).on("submit search", function() {
                var query = document.getElementsByClassName("searchInput")[0].value;
                go("search/" + query);
            }),
            resultLine: css({
                clear: "none"
            }),
            pageHeading: css({
                paddingTop: 0.2 * unit,
                paddingBottom: 0,
                marginTop: margin,
                fontSize: 0.6 * unit,
                height: 0.8 * unit
            })
        }; //}}}
        return result;
    } //}}}
    var cache = {
    }
    if(isClient) {
        window.cache = cache;
    }
    // Layout {{{
    function frontPage(arg) { //{{{
        function patronWidgetContent() { //{{{
            // Vis lånerstatus hvis logget ind, samt synkroniseret indenfor
            // det sidste halve døgn.
            if(data.patron && data.patron.lastSync > Date.now() - 12*60*60*1000) {
                var result = "";

                // Vis antal lån, og hvornår næste aflevering.
                var loans = values(data.patron.loans);
                if(loans.length) {
                    result += loans.length + "\xa0lån. ";
                    result += "Aflever\xa0";
                    var nextTime = Math.min.apply(Math, loans.map(function(loan) { return loan.expireDate; }));
                    if(nextTime < Date.now()) {
                        result += "nu. ";
                    } else {
                        result += formatDate(nextTime) + " ";
                    }
                } else {
                    result += "Ingen\xa0lån";
                }
    
                // Vis antal hjemkomne, eller reservationsstatus
                var arrived = values(data.patron.arrived);
                var reservations = values(data.patron.reservations);
                if(arrived.length) {
                    result += arrived.length + "\xa0" + (arrived.length === 1 ? "hjemkommet" : "hjemkomne");
                } else if(reservations.length) {
                    result += reservations.length + "\xa0reservationer";
                }
                return result;
            } else {
                return "Lånerstatus";
            }
        } //}}}
        function newsWidgetContent() { //{{{
            return data.content.news.map(function(news) {
                return ["div.widgetItem", ["span.widgetDate", formatDate(news.date)], " ", news.title];
            });
        } //}}}
        function calendarWidgetContent() { //{{{
            return data.content.calendar.map(function(event) {
                return ["div.widgetItem", ["span.widgetDate", formatDate(event.date)], " ", event.title];
            });
        } //}}}
        arg.callback({jml: ["div.page.frontPage",  //{{{
                ["div.header", 
                    ["div.searchLine.w5.line", 
                        ["input.searchInput", {placeholder: "søg", type: "search"}]],
                    ["span.searchButton.w1.line", ["span.icon.icon-search", ""]]],
                ["div.content",
                    ["div.biblogo.pageHeading.w6", "Demo Bibliotek"],
                    ["div.patronWidget.w4.line", patronWidgetContent()],
                    ["div.openingTime.w2.line", "Åbningstider"],
                    ["div.largeWidget.newsWidget.w6", 
                        ["div.widgetTitle", "Nyheder"]].concat(newsWidgetContent()),
                    ["div.largeWidget.calendarWidget.w6", 
                        ["div.widgetTitle", "Kalender"]].concat(calendarWidgetContent())]]});  //}}}
    } //}}}
    function resultsPage(opt) { //{{{
        var query = opt.path;
        var id = uniqId();
        function deliverResultsPage(results) {
            opt.callback({jml: ["div.page.searchResults", //{{{
                ["div.header", 
                    ["span.homeButton.w1.line", ["span.icon.icon-home", ""]],
                    ["div.searchLine.w4.line", 
                        ["input.searchInput", {value: query, type: "search"}]],
                    ["span.searchButton.w1.line", ["span.icon.icon-search", ""]]],
                ["div.content", {id: id}].concat(results)]}); //}}}
        }
        rpcCall("BibAppSearch", {query: query, page: 0}, function(err, data) {
            // id, isCollection, coverUrl, title, creator, date, subject, abstract 
            if(err) {
                // TODO: handle errors in ui
                throw err;
            }

            // Cache result
            cache["search:" + 0 + ":" + query] = { cached: Date.now(),
                results: data.map(function(entry) { return entry.id; })};
            data.forEach(function(entry) {
                var cacheEntry = cache["entry:" + entry.id];
                if(!cacheEntry) {
                    cache["entry:" + entry.id] = cacheEntry = entry;
                }
                cacheEntry.cached = Date.now();
            });

            console.log(data);
            var result = data.map(function(entry) {
                return ["div", 
                    ["a.searchResult.w1.go",
                        {href: "/bibEntry/" + entry.id},
                        ["img.resultImg", {src: entry.coverUrl}]],
                    ["a.div.searchResult.w4.go",
                        {href: "/bibEntry/" + entry.id},
                        ["div.resultTitle.resultLine", entry.title || "untitled"],
                        ["div.resultCreator.resultLine", entry.creator || "unknown origin"],
                        ["div.resultDescription.resultLine", entry.description || (entry.subject || []).join(" ")]],
                    ["a.orderButton.w1.line.go", 
                        {href: ("/order/" + entry.id)}, 
                        ["span.icon.icon-shopping-cart", ""]]];
            });
            if(isClient) {
                var styles = genStyles(window.innerWidth, window.innerHeight);
                var elem = document.getElementById(id);
                result.forEach(function(jml) {
                    var dom = jmlToDom(jml);
                    domRecursiveApply(dom, genStyles(Math.min(window.innerHeight, window.innerWidth), window.innerHeight));
                    elem.appendChild(dom);
                });
            } else {
                deliverResultsPage(result);
            }
        });
        if(isClient) {
            deliverResultsPage([]);
        } 
    } //}}}
    function loginPage(opt) {//{{{
        opt.callback({jml:["div.page.login", 
                ["span.w6.spacing.largeWidget", ""],
                ["div.w2.right", "Brugerid:"],
                ["input.w4.line", ""],
                ["div.w2.right", "Kodeord:"],
                ["input.w4.line", {type: "password"}, ""],
                ["span.w2.spacing", ""],
                ["div.w2.line.button", "Annuller"],
                ["div.w2.line.button", "Log ind"],
                ["span.w6.spacing.largeWidget", ""]]}); 
    }//}}}
    function patronPage(opt) { //{{{
        var content = ["div.content"];

        function arrivedEntry(entry) {
            return ["div",
                ["span.w4.spacing.bookentry.line", entry.title, ["br"], entry.creator],
                ["div.w2.renewAll.line", entry.location]];
        }
        function loanEntry(entry) {
            return ["div",
                ["span.w4.spacing.bookentry.line", entry.title, ["br"], entry.creator],
                ["span.w1.date.line", {style: (entry.expireDate < Date.now()? "background: red" : "")}, formatDate(entry.expireDate)], 
                ["div.w1.renewAll.line", "Forny"]];
        }
        function reservationEntry(entry) {
            return ["div",
                ["span.w5.spacing.bookentry.line", entry.title, ["br"], entry.creator],
                ["div.w1.renewAll.line", "Slet"]];
        }

        var arrived = values(data.patron.arrived);
        if(arrived.length) {
            content.push(["div.w6.pageHeading.patronHeading", "Hjemkomne:"]);
            content = content.concat(arrived.map(arrivedEntry));
        }

        var loans = values(data.patron.loans);
        if(loans.length === 0) {
            content.push(["div.w6.pageHeading.patronHeading", "Ingen hjemlån"]);
        }
        if(loans.length) {
            loans.sort(function(a, b) { return a.expireDate - b.expireDate; });
            content.push(["div.w5.pageHeading.patronHeading", "Lån:"]);
            content.push(["div.w1.line.renewAll", "Forny alle"]);
            content = content.concat(loans.map(loanEntry));
        }

        var reservations = values(data.patron.reservations);
        if(reservations.length) {
            content.push(["div.w6.patronHeading", "Reservationer:"]);
            content = content.concat(reservations.map(reservationEntry));
        }

        opt.callback({jml:["div.page.patronInfo", 
                ["div.header", 
                    ["span.homeButton.w1.line", ["span.icon.icon-home", ""]],
                    ["span.patronStatus.w4.line", data.patron.name, ["br"], "Opdateret ", formatDateOrTime(data.patron.lastSync)],
                    ["span.signoutButton.w1.line", ["span.icon.icon-signout", ""]]],
                content]});
    }//}}}
    function bibEntryPage(opt) { //{{{
        function bibEntryContent(entry) {
            entry.subject = entry.subject || [];
            return [["div.header", 
                    ["span.homeButton.w1.line", ["span.icon.icon-home", ""]],
                    ["span.patronStatus.w4.line", entry.title, ["em", " af "], " " + entry.creator],
                    ["span.backButton.w1.line", {onclick: "history.back()"}, ["span.icon.icon-arrow-left", ""]]],
                ["div.content", 
                    ["img.w2", {src: entry.coverUrl || "/static/defaultCover.jpg"}],
                    ["div.w4",
                        ["div", entry.title],
                        ["div", entry.date],
                        ["div", entry.creator]],
                    ["div.w6", entry.description],
                    ["div"].concat(entry.details ? 
                        Object.keys(entry.details).map(function(key) {
                            return ["div", ["span.w2", key, ": "], ["span.w4", entry.details[key].join(", ")]];
                        }) :
                        [["div", entry.subject.join(", ")]])]];
        }
        console.log(opt);
        //opt.callback({jml:["div", "todo ", opt.path]});
        rpcCall("BibAppEntry", opt.path, function(err, data) {
            console.log(data);
        });
        var cachedEntry = cache["entry:" + opt.path];
        console.log("cached:", cachedEntry);
        if(isServer) {
            rpcCall("BibAppEntry", opt.path, function(err, data) {
                if(err) {
                    opt.callback({jml:["div.page", "error:", JSON.stringify(err)]});
                } else {
                    opt.callback({jml:["div.page"].concat(bibEntryContent(data))});
                }
            });
        } else {
            var id = uniqId();
            if(cachedEntry) {
                opt.callback({jml:["div.page", {id: id}].concat(bibEntryContent(cachedEntry))});
            } else {
                opt.callback({jml:["div.page", {id: id}]});
            }
            rpcCall("BibAppEntry", opt.path, function(err, data) {
                if(err) {
                    // TODO: error handling
                } else {
                    var elem = document.getElementById(id);
                    console.log(id, elem);
                    while(elem.childNodes.length > 0) {
                        elem.removeChild(elem.childNodes[0]);
                    }
                    var content = bibEntryContent(data);
                    for(var i = 0; i < content.length; ++i) {
                        elem.appendChild(jmlToDom(content[i]));
                    }
                    domRecursiveApply(elem, genStyles(Math.min(window.innerHeight, window.innerWidth), window.innerHeight));
                }
            });
        }
    } //}}}
    // TODO: Single-book/material page
    // TODO: News page
    // TODO: Calendar page (header: home-icon, overskrift)
    //}}}
    // Transitions {{{
    var view;
    function initView(page) {
        window.view = view = {};
        view.width = Math.min(window.innerHeight, window.innerWidth);
        view.height = window.innerHeight;
        view.current = jmlToDom(page);
        document.body.style.padding = document.body.style.margin = "0px";
        while(document.body.childNodes.length) {
            document.body.removeChild(document.body.childNodes[0]);
        }
        transition(page);
    }
    function posLeft() {
        return css({
            position: "absolute",
            height: view.height,
            width: view.width,
            left: - view.width,
            top: 0
        });
    }
    var transitioning = false;
    function transition(page) {
        window.scrollTo(0,0);
        if(!view) {
            initView(page);
            return;
        }
        if(transitioning) {
            return;
        }
        transitioning = true;
        var style = view.current.style;
        view.prev = view.current;
        var time = 0.8;
        var transOn = "all " + time + "s ease";
        var transOff = "all 0s";
        css({
            left: "0px",
            right: "0px",
            transition: transOn,
            mozTransition: transOn,
            webkitTransition: transOn
        }).apply(view.current);

        view.current = jmlToDom(page);
        domRecursiveApply(view.current, genStyles(view.width, view.height));
        css({
            height: view.height,
            width: view.width,
            position: "absolute",
            left: view.width,
            right: "0px",
            transition: transOn,
            mozTransition: transOn,
            webkitTransition: transOn
        }).apply(view.current);
        document.body.appendChild(view.current);
        window.setTimeout(function() {
            style.left = - view.width + "px";
            view.current.style.left = 0;
        }, 0);
        window.setTimeout(function() {
            while(document.body.childNodes.length > 1) {
                document.body.removeChild(document.body.childNodes[0]);
            }
            transitioning = false;
        }, 1100 * time);

    }
    // }}}
    // TODO: transitions (evt. to/from topright-button)
    // TODO: autoscrolling-infinite-list

    // Control {{{1
    var urlTable = {
        default: frontPage,
        home: frontPage,
        search: resultsPage,
        bibEntry: bibEntryPage,
        patron: patronPage
    };
    // Notes:
    // - initial page immediately for transition
    // - static page for nojs/searchengine
    // - keep page updated
    //
    // page:
    // fn: (clientInfo, desired page, 
    // data:
    //     pageName: string
    //     width: int,
    //     height: int,
    //     callback: (data {jml: ..., cls: ...})
    //
    // 
    function go(name) {
        if(window.history && window.history.pushState) {
            name = "/" + name; 
            window.history.pushState(name, name, name);
            goCurrent();
        } else {
            location.hash = name;
        }
    }
    /**
     * Opt object:
     * - path: path without single leading
     * - width/height: integers
     * - callback: function of {jml: ..., cls: ...}
     */
    function jmlPage(opt) {
        var path = urlUnescape(opt.path);
        var splitPos = path.indexOf("/");
        if(splitPos === -1) {
            splitPos = path.length;
        }
        var pageName = path.slice(0, splitPos);
        var pageArg = path.slice(splitPos + 1);
        var fn = urlTable[pageName];
        if(fn) {
            opt.path = pageArg;
        } else {
            fn = urlTable["default"];
        }
        fn(opt);
    }
    if(isClient) { //{{{
        var switchInProgress = false;
        window.onpopstate = goCurrent;
        window.onhashchange = goCurrent;
        window.main = goCurrent;
    }
    function goCurrent() {
        if(switchInProgress) { return; }
        jmlPage({path: (location.hash || location.pathname).slice(1),
            callback: function(data) { transition(jmlToDom(data.jml)); }});
        switchInProgress = true;
        setTimeout(function() { switchInProgress = false; }, 100);
    } //}}}
    // Server {{{1
    // Scraper {{{
    function getCacheOrUrl(id, callback) { //{{{
        var fs = require("fs");
        var request = require("request");

        var cacheName = id.replace(/[^a-zA-Z0-9]/g, "_");
        fs.readFile("cache/" + cacheName, "utf8", function(err, data) {
            if(!err) {
                callback(undefined, data);
            } else {
                downloadAndCache();
            }
        });
        function downloadAndCache() {
            console.log("http-get", id);
            request(id, function(err, res, data) {
                if(err || res.statusCode !== 200) {
                    console.log("got error", id);
                    callback(err || res);
                } else {
                    console.log("got it", id);
                    handleDownload(data);
                }
            });
        }
        function handleDownload(data) {
            fs.writeFile("cache/" + cacheName, data);
            callback(undefined, data);
        }
    } //}}}
    function bibEntry(id, callback) { //{{{
        function warn(msg) {
            console.log.apply(null, arguments);
        }
        getCacheOrUrl("http://bibliotek.kk.dk/ting/object/" + id, handleBibData);

        function handleBibData(err, data) { //{{{
            if(err) {
                callback(err);
            } else {
                var result = parseBibData(strToJml(data));
                result.id = id;
                callback(undefined, result);
            }
        } //}}}
    function parseBibData(data) { //{{{
        function set(name, val) { //{{{
            if(!result[name]) { result[name] = []; }
            if(val) { result[name].push(val); }
        }//}}}
        function extractData(data) { //{{{
            function len3() { if(data.length !== 3) { warn("unexpected length", data); } }
            if(Array.isArray(data)) {
                var attr = data[1];
                var classes = attr["class"] && arrayToSetObject(attr["class"].split(" ")) || {};
                if(data[0] === "h2") { len3(); set("title", data[2]); }
                if(classes["abstract"]) { len3(); set("description", data[2]); }
                if(classes["date"]) { len3(); set("date", data[2]); }
                if(classes["left-column"]) {
                    if(data[3][1]["class"] !== "picture") { warn("expecting picture", data); };
                    set("coverUrl", data[3][3][1]["src"]);
                }
                attr["class"] && attr["class"].split(" ").forEach(function(cls) {
                    if(cls.slice(0, 5) === "ting-") {
                        if(cls === "ting-autocomplete") {
                            return;
                        }
                        var content = data[2];
                        var propName = cls.slice(5);
                        if(typeof content === "string") {
                            if(content.trim()) {
                                set(propName, content);
                            }
                        } else {
                            var dkProp = content[2][2];
                            var val = jmlTrimmedTexts(content[3]);
                            if(typeof dkProp === "string") {
                                result[dkProp] = (result[dkProp] || []).concat(val);
                            }
                        }
                    }
                });
                data.slice(2).forEach(extractData);
            }
        }//}}}
        var result = {};
        data.forEach(extractData);
        return result;
    } //}}}
    } //}}}
    function bibSearch(query, page, callback) { //{{{
        getCacheOrUrl("http://bibliotek.kk.dk/ting/search/js?page=" + (page + 1) + "&query=" + query, handleSearchData);
        function handleSearchData(err, data) {
            if(err) {
                callback(err);
            } else {
                var json = JSON.parse(data);
                var results = jmlFilterWs(strToJml(json.result_html)).map(function(entry) {
                    var result = {};
                    var url = entry[2][2][1]["href"];
                    result.id = url.replace(/.*\//, "").replace("%3A", ":");
                    result.isCollection = (url.indexOf("collection") !== -1);
                    result.coverUrl = entry[2][2][2][1]["src"];
                    function bibVisitor(elem) {
                        if(Array.isArray(elem)) {
                            var cls = elem[1]["class"] || "";
                            if(cls === "publication_date") { result.date = elem[3] ? elem[3][2] : elem[2]; };
                            if(cls.slice(0, 13) === "ting-subjects" && typeof elem[2] === "string") { 
                                result.subject = (result.subject||[]).concat([elem[2]]);
                            }
                            if(cls === "creator" && elem[2] === "Af") { result.creator = elem[3][2] };
                            if(cls === "abstract") { result.description = elem[2] };
                            if(elem[0] === "h3") { result.title = elem[2][2]; }
                            elem.slice(2).forEach(bibVisitor);
                        }
                    }
                    bibVisitor(entry);
                    return result;
                });
                callback(undefined, results);
            }
        }
    } //}}}
    //}}}
    // API {{{
    function API() {
        rpcCallback("BibNews", function(data, callback) {
            callback(undefined, [
                {date: Date.now() - 10000000,
                url: "http://example.com/event",
                title: "Eventtitle 1",
                description: "description"},
                {date: Date.now() - 20000000,
                url: "http://example.com/event",
                title: "Eventtitle 2",
                description: "description"},
                {date: Date.now(),
                url: "http://example.com/event",
                title: "Eventtitle 3",
                description: "description"}]);
        });
        rpcCallback("BibCalendar", function(data, callback) {
            callback(undefined, [
                {date: Date.now() + 10000000,
                coverUrl: "http://example.com/eventicon.jpg",
                url: "http://example.com/event",
                title: "Eventtitle 1",
                description: "description"},
                {date: Date.now() + 20000000,
                coverUrl: "http://example.com/eventicon.jpg",
                url: "http://example.com/event",
                title: "Eventtitle 2",
                description: "description"},
                {date: Date.now(),
                coverUrl: "http://example.com/eventicon.jpg",
                url: "http://example.com/event",
                title: "Eventtitle 3",
                description: "description"}]);
        });
        rpcCallback("BibAppSearch", function(data, callback) {
            bibSearch(data.query, data.page, callback);
        });
        rpcCallback("BibAppEntry", function(id, callback) {
            bibEntry(id, function(err, data) {
                if(err) {
                    return callback(err, data);
                }
                // id, isCollection, coverUrl, title, creator, date, subject, abstract 
                var result = {
                    id: id,
                    title: data.title && data.title[0],
                    creator: data.creators && data.creators[0],
                    date: data.date && data.date[0],
                    coverUrl: data.coverUrl && data.coverUrl[0],
                    subject: data.subjects,
                    description: data.description && data.description[0],
                    details: {}
                };
                for(var key in data) {
                    if(key.match(/^[A-ZÅÆØ]/)) {
                        result.details[key] = data[key];
                    }
                }

                callback(err, result);
            });
        });
    }
    
    //}}}
    // Serve data {{{
    function webServer(app) { //{{{
        var express = require("express");
        var fs = require("fs");

        app.use("/depend", express["static"](__dirname + "/depend"));
        app.get("/bibapp.js", function(req, res) {
            fs.readFile("bibapp.js", "utf8", function(err, data) {
                if(err) throw err;
                res.end(data);
            });
        });
        app.get("*", function(req, res) {
            jmlPage({path: req.url.slice(1), callback: function(data) {
                var page = "";
                res.end("<!DOCTYPE html>" + jmlToStr(["html",
                    ["head",
                        ["title", "BibApp"],
                        ["meta", {"http-equiv": "Content-Type", content: "text/html; charset=UTF-8"}],
                        ["meta", {"http-equiv": "X-UA-Compatible", content: "IE=edge,chrome=1"}],
                        ["meta", {"name": "HandheldFriendly", content: "true"}],
                        ["meta", {"name": "viewport", content: "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=0"}],
                        ["meta", {"name": "format-detection", content: "telephone=no"}],
                        ["meta", {"name": "apple-mobile-web-app-capable", content: "yes"}],
                        ["meta", {"name": "apple-mobile-web-app-status-bar-style", content: "black"}],
                        ["link", {rel: "stylesheet", href: "/depend/font-awesome.css"}],
                        ["script", {src: "/depend/socket.io.min.js"}, ""],
                        ["script", {src: "/bibapp.js"}, ""]
                    ],
                    ["body", {onload: "window.main()"},
                        data.jml,
                    ]]))
            }});
        });
    } //}}}
    function socketOnConnection(socket) {
        registerRPC(socket);
    }
    function startServer() {
        var express = require("express");
        var app = express();
        var server = require("http").createServer(app);
        var io = require("socket.io").listen(server);
        webServer(app);
        io.sockets.on("connection", socketOnConnection);

        API();
        server.listen(port);
        console.log("started server on", port);
    }
    //}}}
    // Test {{{1
    // TestSuite class {{{
    function TestSuite(name, doneFn) { //{{{
        this.name = name;
        this.suites = 1;
        this.errCount = 0;
        if(doneFn) {
            this.doneFn = doneFn;
        }
    } //}}}
    TestSuite.prototype.fail = function(expr, desc) { //{{{
        ++this.errCount;
        console.log("Fail in " + this.name + ": " + desc);
    }; //}}}
    TestSuite.prototype.assert = function(expr, desc) { //{{{
        if(!expr) {
            ++this.errCount;
            console.log("Assert in " + this.name + ": " + desc);
        }
    }; //}}}
    TestSuite.prototype.done = function() { //{{{
        this.suites -= 1;
        this._cleanup();
    }; //}}}
    TestSuite.prototype.suite = function(name) { //{{{
        var result = new TestSuite(this.name + "#" + name);
        result.parent = this;
        this.suites += 1;
        return result;
    }; //}}}
    TestSuite.prototype._cleanup = function() { //{{{
        if(this.suites === 0) {
            if(this.doneFn) {
                this.doneFn(this.errCount);
            }
            if(this.parent) {
                this.parent.errCount += this.errCount;
                this.parent.suites -= 1;
                this.parent._cleanup();
            }
        }
    }; //}}}
    //}}}
    /** testfunction running on clientside. */
    function testClient(test) { //{{{
        test.done();
    }
    if(isClient) {
        window.testClient = testClient;
    }
    //}}}
    /** test executer running on server */
    function testServer(test) { //{{{
        test.done();
    } //}}}
    /** test using zombie */
    function testZombie(test) { //{{{
        var Browser = require("zombie");
        var browser = new Browser();
        browser
            .visit("http://localhost:8888/", {debug: true})
            .then(function() {
                test.assert(browser.errors.length === 0, "errors from load in client");
                browser.window.testClient(test);
            }).fail(function() {
                test.fail("zombie load error");
                test.done();
            });
    } //}}}
    function runTests() { //{{{
        var Browser = require("zombie");
        var test = new TestSuite("BibApp", process.exit);

        testServer(test.suite("server"));

        // start the client-test via zombie
        var clientSuite = test.suite("client");
        var browser = new Browser();
        browser
            .visit("http://localhost:8888/", {debug: true})
            .then(function() {
                browser.window.testClient(clientSuite);
            }).fail(function() {
                clientSuite.fail("could not start client-test");
                test.done();
            });

        testZombie(test.suite("ui"));
        
        test.done();
    } //}}}
    // Main {{{1 
    if(isServer) {
        startServer();
        var command = process.argv[2];
        if(command === "test") {
            runTests();
        }
    }
})();
