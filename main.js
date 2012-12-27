(function() {
    "use strict";
    function genStyles() {
        var width = 240;
        var height = 320;
        var margin = (width / 40) & ~1;
        var unit = ((width - 7 * margin)/6) | 0;
        var margin0 = (width - 7 * margin - unit * 6) >> 1;
        var smallFont = unit * .4;
        function wn(n) {
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
        }
        var result = {
            line: {
                marginTop: margin,
                textAlign: "center",
                height: unit,
            },
            page: {
                verticalAlign: "middle",
                overflow: "hidden",
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
        }
        return result;
    }

    /** Traverse the dom and apply style */
    function applyStyle(domNode, styles) {
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
    }

    applyStyle(document.body, genStyles());
})();
