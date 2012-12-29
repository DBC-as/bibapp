// Copyright 2012 Rasmus Erik
/*global document:true window:true*/
(function() {
    "use strict";
    // Util {{{1
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
        } else {
            return document.createTextNode(jml);
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
                    val = val + "px";
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
            url: "http://bibilitek.kk.dk/foo/bar...html",
            thumbUrl: "http://bibliotek.kk.dk/foo/bar...jpg"};
        var sampleNews = {
            date: 1356706097976,
            title: "Glædeligt nytår",
            description: "starten af en artikel ....",
            url: "http://bibilitek.kk.dk/foo/bar...html",
            thumbUrl: "http://bibliotek.kk.dk/foo/bar...jpg"};
        var sampleSearchResult = {
            id: "830318:48781321",
            title: "Samlede Eventyr",
            creator: "H. C. Andersen",
            type: "book",
            thumbUrl: "http://bibliotek.kk.dk/foo/bar...",
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
                    thumbUrl: "http://bibliotek.kk.dk/foo/bar...",
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
    window.data = data;
    // Views {{{1
    function genStyles() { //{{{
        var width = 200;
        var height = 300;
        var margin = (width / 40) & ~1;
        var unit = ((width - 7 * margin)/6) | 0;
        var margin0 = (width - 7 * margin - unit * 6) >> 1;
        var smallFont = unit * 0.4;
        function wn(n) { //{{{
            return css({
                verticalAlign: "middle",
                border: "none",
                padding: 0,
                marginLeft: margin,
                marginRight: 0,
                width: unit * n + margin * (n-1),
                display: "inline-block",
                boxShadow: "1px 1px 4px rgba(0,0,0,1)"
            });
        } //}}}
        var result = { //{{{
            line: css({
                marginTop: margin,
                //textAlign: "center",
                height: unit
            }),
            content: css({
                position: "relative",
                top: unit+margin,
                left: 0,
                width: width
            }),
            page: css({
                //position: "relative",
                verticalAlign: "middle",
                //overflow: "hidden",
                lineHeight: "100%",
                fontSize: smallFont,
                fontFamily: "sans-serif",
                border: "1px solid black",
                margin: unit/2,
                padding: 0,
                display: "inline-block",
                width: width,
                height: height,
                background: "white"
            }),
            header: css({
                position: "fixed",
                height: unit+margin, width: width,
                background: "rgba(255,255,255,.7)"
            }),
            largeWidget: css({
                marginTop: margin,
                height: (height - unit * 3 - margin * 6) >>1,
                marginLeft: margin,
                marginRight: margin,
                overflow: "hidden",
                boxShadow: "1px 1px 4px rgba(0,0,0,1)"
            }),
            resultImg: css({
                float: "left",
                height: 1.618 * unit,
                width: unit,
                marginRight: margin,
                marginBottom: margin
            }).on("click", function() {
                // TODO: remove this example
                //alert("click");
            }),
            resultOrderButton: css({
                float: "right",
                height: unit
            }),
            searchResult: css({
                marginTop: margin,
                height: 1.618 * unit,
                overflow: "hidden"
            }),
            headerPadding: css({ height: unit+margin }),
            w1: wn(1), w2: wn(2), w3: wn(3),
            w4: wn(4), w5: wn(5), w6: wn(6)
        }; //}}}
        return result;
    } //}}}
    // Layout {{{2
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
                    ["input.searchLine.w5.line", {value: "foo"}],
                    ["div.searchButton.w1.line", "søg"]],
                ["div.content",
                    ["div.biblogo.w6.line", "Kardemommeby bibliotek"],
                    ["div.patronWidget.w4.line", patronWidgetContent()],
                    ["div.openingTime.w2.line", "Åbningstider"],
                    ["div.largeWidget.newsWidget.w6", 
                        ["div.widgetTitle", "Nyheder"]].concat(newsWidgetContent()),
                    ["div.largeWidget.calendarWidget.w6", 
                        ["div.widgetTitle", "Kalender"]].concat(calendarWidgetContent())]];  //}}}
    } //}}}
    function resultsPage(query) { //{{{
        function jmlResult(result) {
            return ["div.searchResult.w6", 
                        ["img.wn1.resultImg", {src: result.thumbUrl}],
                        ["div.resultOrderButton.w1", "Bestil"],
                        ["div.resultTitle", result.title],
                        ["div.resultCreator", result.creator],
                        ["div.resultDescription", result.description]];
        }
        // TODO: facets
        return ["div.page.searchResults", //{{{
                ["div.header", 
                    ["span.homeButton.w1.line", "home"],
                    ["textarea.searchBox.w4.line", query],
                    ["span.searchButton.w1.line", "søg"]],
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
            content.push(["div.w6.patronHeading", "Hjemkomne:"]);
            content = content.concat(arrived.map(arrivedEntry));
        }

        var loans = values(data.patron.loans);
        if(loans.length === 0) {
            content.push(["div.w6.patronHeading", "Ingen hjemlån"]);
        }
        if(loans.length) {
            loans.sort(function(a, b) { return a.expireDate - b.expireDate; });
            content.push(["div.w5.patronHeading", "Lån:"]);
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
                    ["span.homeButton.w1.line", "home"],
                    ["span.patronStatus.w4.line", data.patron.name, ["br"], "Opdateret ", formatDateOrTime(data.patron.lastSync)],
                    ["span.logoutButton.w1.line", "log ud"]],
                content];
    }//}}}
    // TODO: Single-book/material page
    // TODO: News page
    // TODO: Calendar page (header: home-icon, overskrift)
    //}}}
    //
    // TODO: transitions (evt. to/from topright-button)
    // TODO: autoscrolling-infinite-list

    // Control {{{1
    // Test {{{1
    document.body.appendChild(jmlToDom(frontPage()));
    document.body.appendChild(jmlToDom(resultsPage("sample search string")));
    document.body.appendChild(jmlToDom(loginPage()));
    document.body.appendChild(jmlToDom(patronPage()));
    domRecursiveApply(document.body, genStyles());
})();
