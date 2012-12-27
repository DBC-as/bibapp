(function() {
    "use strict";
    function genStyles() { //{{{
        var width = 240;
        var height = 320;
        var margin = (width / 40) & ~1;
        var unit = ((width - 7 * margin)/6) | 0;
        var margin0 = (width - 7 * margin - unit * 6) >> 1;
        var smallFont = unit * .4;
        function wn(n) { //{{{
            return {
                verticalAlign: "middle",
                border: "none",
                padding: 0,
                marginLeft: margin,
                marginRight: 0,
                width: unit * n + margin * (n-1),
                display: "inline-block",
                boxShadow: "1px 1px 4px rgba(0,0,0,1)",
            };
        } //}}}
        var result = { //{{{
            line: {
                marginTop: margin,
                //textAlign: "center",
                height: unit,
            },
            content: {
                position: "relative",
                top: unit+margin,
                left: 0,
                width: width,
            },
            page: {
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
                background: "white",
            },
            header: {
                position: "fixed",
                height: unit+margin, width: width,
                background: "rgba(255,255,255,.7)",
            },
            largeWidget: {
                marginTop: margin,
                height: (height - unit * 3 - margin * 6) >>1,
                marginLeft: margin,
                marginRight: margin,
                overflow: "hidden",
                boxShadow: "1px 1px 4px rgba(0,0,0,1)",
            },
            resultImg: {
                float: "left",
                height: 1.618 * unit,
                width: unit,
                marginRight: margin,
                marginBottom: margin,
            },
            resultOrderButton: {
                float: "right",
                height: unit,
            },
            searchResult: {
                marginTop: margin,
                height: 1.618 * unit,
                overflow: "hidden",
            },
            headerPadding: { height: unit+margin },
            w1: wn(1), w2: wn(2), w3: wn(3),
            w4: wn(4), w5: wn(5), w6: wn(6),
        } //}}}
        return result;
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
    /** Traverse the dom and apply style */
    function applyStyle(domNode, styles) { //{{{
        var styleObj, i, classes, children, style, prop, val;
        classes = domNode.classList;
        for(i = 0; i < classes.length; ++i) {
            style = styles[classes[i]];
            if(style) {
                styleObj = domNode.style;
                for(prop in style) {
                    val = style[prop];
                    if(typeof val === "number") {
                        val = val + "px";
                    }
                    styleObj[prop] = val;
                }
            }
        }
        children = domNode.children;
        for(i=0; i<children.length; ++i) {
            applyStyle(children[i], styles);
        }
    } //}}}
    var html = jmlToStr(["div",  //{{{
            ["div.page.frontPage", //{{{
                ["div.biblogo.w6.line", "Kardemommeby bibliotek"],
                ["div.patronWidget.w4.line", "Lånerstatus: Afl.&nbsp;12/1. Lån:&nbsp;7, Hjemkomne:&nbsp;3."],
                ["div.openingTime.w2.line", "Åbningstider"],
                ["input.searchLine.w5.line", {value: "foo"}],
                ["div.searchButton.w1.line", "søg"],
                ["div.largeWidget.newsWidget", 
                    ["div.widgetTitle", "News"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"]],
                ["div.largeWidget.calendarWidget", 
                    ["div.widgetTitle", "Kalender"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"],
                    ["div.widgetItem", ["span.widgetDate", "29/12"], "some item text"]]], //}}}
            ["div.page.patronInfo", //{{{
                ["div.header", 
                    ["span.backButton.w1.line", "back"],
                    ["span.patronStatus.w4.line", "Logget ind som Joe User", ["br"], "Opdateret i dag 15:31"],
                    ["span.logoutButton.w1.line", "log ud"]],
                ["div.content",
                    ["div.w6.patronHeading", "Hjemkomne reserveringer"],
                    ["div",
                        ["span.w2.line", "3/1 #42", ["br"], "husum"], 
                        ["span.w4.spacing.bookentry.line", "Tusinde og en nat...", ["br"], "Scherazade"]],
                    ["div.w6.patronHeading", "Hjemlån"],
                    ["div",
                        ["span.w1.date.line", "5/2"], 
                        ["span.w4.bookentry.line", "Tusinde og en nat...", ["br"], "Scherazade"], 
                        ["div.w1.renewAll.line", "Forny"]],
                    ["div",
                        ["span.w1.date.line", "5/2"], 
                        ["span.w4.bookentry.line", "Tusinde og en nat...", ["br"], "Scherazade"], 
                        ["div.w1.renewAll.line", "Forny"]],
                    ["div.w6.patronHeading", "Reserveringer"],
                    ["div",
                        ["span.w1.line", "3/1"], 
                        ["span.w4.bookentry.line", "Folkeeventyr", ["br"], "Brødrene Grimm"], 
                        ["div.w1.renewAll.line", "slet"]],
                    ["div",
                        ["span.w1.line", "3/1"], 
                        ["span.w4.bookentry.line", "Folkeeventyr", ["br"], "Brødrene Grimm"], 
                        ["div.w1.renewAll.line", "slet"]],
                    ["div",
                        ["span.w1.line", "3/1"], 
                        ["span.w4.bookentry.line", "Folkeeventyr", ["br"], "Brødrene Grimm"], 
                        ["div.w1.renewAll.line", "slet"]]]], //}}}
            ["div.page.searchResults", //{{{
                ["div.header", 
                    ["span.backButton.w1.line", "back"],
                    ["textarea.searchBox.w4.line", "searchquery"],
                    ["span.logoutButton.w1.line", "log ud"]],
                ["div.content", //{{{
                    ["div.searchResult.w6",
                        ["img.wn1.resultImg", {src: "borked"}],
                        ["div.resultOrderButton.w1", "Bestil"],
                        ["div.resultTitle", "Der var engang..."],
                        ["div.resultCreator", "H. C. Andersen"],
                        ["div.resultDescription", "Eventyr blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah"]],
                    ["div.searchResult.w6",
                        ["img.wn1.resultImg", {src: "borked"}],
                        ["div.resultOrderButton.w1", "Bestil"],
                        ["div.resultTitle", "Der var engang..."],
                        ["div.resultCreator", "H. C. Andersen"],
                        ["div.resultDescription", "Eventyr blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah"]],
                    ["div.searchResult.w6",
                        ["img.wn1.resultImg", {src: "borked"}],
                        ["div.resultOrderButton.w1", "Bestil"],
                        ["div.resultTitle", "Der var engang..."],
                        ["div.resultCreator", "H. C. Andersen"],
                        ["div.resultDescription", "Eventyr blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah"]],
                    ["div.searchResult.w6",
                        ["img.wn1.resultImg", {src: "borked"}],
                        ["div.resultOrderButton.w1", "Bestil"],
                        ["div.resultTitle", "Der var engang..."],
                        ["div.resultCreator", "H. C. Andersen"],
                        ["div.resultDescription", "Eventyr blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah"]],
                    ["div.searchResult.w6",
                        ["img.wn1.resultImg", {src: "borked"}],
                        ["div.resultOrderButton.w1", "Bestil"],
                        ["div.resultTitle", "Der var engang..."],
                        ["div.resultCreator", "H. C. Andersen"],
                        ["div.resultDescription", "Eventyr blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah"]]],//}}}
            ], //}}}
            ["div.page.login", //{{{
                ["span.w6.spacing.largeWidget", ""],
                ["div.w2.right", "Login:"],
                ["input.w4.line", ""],
                ["div.w2.right", "Kode:"],
                ["input.w4.line", {type: "password"}, ""],
                ["span.w2.spacing", ""],
                ["div.w2.line.button", "Annuller"],
                ["div.w2.line.button", "Login"],
                ["span.w6.spacing.largeWidget", ""],
            ], //}}}
    ]); //}}}
    console.log(html);
    document.body.innerHTML = html;
    applyStyle(document.body, genStyles());
})();
