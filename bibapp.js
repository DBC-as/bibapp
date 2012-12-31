/*! Copyright 2012 Rasmus Erik */
/*global document:true window:true process:true location:true require:true __dirname:true console:true */
(function() {
    "use strict";
    var isClient = !!(typeof window === "object" && window.document);
    var isServer = !!(typeof process === "object" && process.versions && process.versions.node);
    // Util {{{1
    function urlUnescape(str) {
        return str.replace(/\+/g, " ").replace(/%[0-9a-fA-F][0-9a-fA-F]/g, function(code) {
            return String.fromCharCode(window.parseInt(code.slice(1), 16));
        });
    }
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
                elem.appendChild(jmlToDom(jml[pos]));
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
                    type: "book",
                    thumbUrl: "http://bibliotek.example.com/foo/bar...",
                    description: "Samling af eventyr der ... og så også ... blah blah blah blah blah...",
                    topic: ["dk5:89.13", "eventyr"],
                    isbn: "891384328401",
                    status: "available"
                }},
            searches: {
                "sample search string": {
                    id: "sample search string",
                    lastSync: 1356706097976,
                    resultCount: 1324,
                    resultsLoaded: 10,
                    results: [sampleSearchResult, sampleSearchResult, sampleSearchResult, sampleSearchResult, sampleSearchResult, 
                              sampleSearchResult, sampleSearchResult, sampleSearchResult, sampleSearchResult, sampleSearchResult]} }}; //}}}
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
                var query = document.getElementsByClassName("searchInput")[0].value || "sample search string";
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
    // Layout {{{
    function frontPage() { //{{{
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
        return ["div.page.frontPage",  //{{{
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
                        ["div.widgetTitle", "Kalender"]].concat(calendarWidgetContent())]];  //}}}
    } //}}}
    function resultsPage(query) { //{{{
        function jmlResult(result) {
            return ["div", 
                        ["div.searchResult.w1",
                            ["img.resultImg", {src: result.thumbUrl}]],
                        ["div.searchResult.w4",
                            ["div.resultTitle.resultLine", result.title],
                            ["div.resultCreator.resultLine", result.creator],
                            ["div.resultDescription.resultLine", result.description]],
                        ["span.orderButton.w1.line", ["span.icon.icon-shopping-cart", ""]]];
                        //["div.w1.line", "Bestil"]];
        }
        // TODO: facets
        return ["div.page.searchResults", //{{{
                ["div.header", 
                    ["span.homeButton.w1.line", ["span.icon.icon-home", ""]],
                    ["div.searchLine.w4.line", 
                        ["input.searchInput", {value: query, type: "search"}]],
                    ["span.searchButton.w1.line", ["span.icon.icon-search", ""]]],
                ["div.content"].concat(searchResults(query).map(jmlResult))]; //}}}
    } //}}}
    function loginPage() {//{{{
        return ["div.page.login", 
                ["span.w6.spacing.largeWidget", ""],
                ["div.w2.right", "Brugerid:"],
                ["input.w4.line", ""],
                ["div.w2.right", "Kodeord:"],
                ["input.w4.line", {type: "password"}, ""],
                ["span.w2.spacing", ""],
                ["div.w2.line.button", "Annuller"],
                ["div.w2.line.button", "Log ind"],
                ["span.w6.spacing.largeWidget", ""]]; 
    }//}}}
    function patronPage() { //{{{
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

        return ["div.page.patronInfo", 
                ["div.header", 
                    ["span.homeButton.w1.line", ["span.icon.icon-home", ""]],
                    ["span.patronStatus.w4.line", data.patron.name, ["br"], "Opdateret ", formatDateOrTime(data.patron.lastSync)],
                    ["span.signoutButton.w1.line", ["span.icon.icon-signout", ""]]],
                content];
    }//}}}
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
        "": frontPage,
        home: frontPage,
        search: resultsPage,
        patron: patronPage
    };
    function go(name) {
        if(window.history && window.history.pushState) {
            name = "/" + name; 
            window.history.pushState(name, name, name);
            goCurrent();
        } else {
            location.hash = name;
        }
    }
    function goCurrent() {
        var path = urlUnescape((location.hash || location.pathname).slice(1));
        var splitPos = path.indexOf("/");
        if(splitPos === -1) {
            splitPos = path.length;
        }
        var pageName = path.slice(0, splitPos);
        var pageArg = path.slice(splitPos + 1);
        transition(jmlToDom(urlTable[pageName](pageArg)));
    }
    if(isClient) {
        window.onpopstate = goCurrent;
        window.onhashchange = goCurrent;
        document.body.onload = goCurrent;
    }
    // Server {{{1
    function startServer() {
        var fs = require("fs");
        var express = require("express");
        var app = express();
        var server = require("http").createServer(app);
        var io = require("socket.io").listen(server);
        
        app.use("/depend", express["static"](__dirname + "/depend"));
        app.get("/bibapp.js", function(req, res) {
            fs.readFile("bibapp.js", "utf8", function(err, data) {
                if(err) throw err;
                res.end(data);
            });
        });
        app.get("*", function(req, res) {
            var page = "";
            res.end("<!DOCTYPE html>" + jmlToStr(["html",
                    ["head",
                        ["title", "BibApp"],
                        ["meta", {"http-equiv": "Content-Type", content: "text/html; charset=UTF-8"}],
                        ["link", {rel: "stylesheet", href: "/depend/font-awesome.css"}]],
                    ["body", 
                        ["script", {src: "/depend/socket.io.min.js"}, ""],
                        ["script", "window.socket = io.connect('http://localhost:8888');"],
                        ["script", {src: "/bibapp.js"}, ""]
                    ]]));
        });
        
        io.sockets.on("connection", function (socket) {
            socket.on("bar", function (data) {
                socket.emit("foo", {some: "obj"});
            });
        });
        
        var port = 8888;
        server.listen(port);
        console.log("started server on", port);
    }
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
        if(process.argv[2] === "test") {
            runTests();
        }
    };
})();
