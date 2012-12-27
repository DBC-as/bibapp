(function() {
    "use strict";
    function genStyles() {
        var width = 240;
        var height = 280;
        var unit = width / 6 | 0;
        // margin .1 unit
        // height .8 unit
        var largeFont = unit * .6;
        var mediumFont = largeFont * .75;
        var smallFont = largeFont * .5;
        console.log("unit", unit, unit * .8);
        var inputMargin = unit * 0.1  | 0;
        var result = {
            w1: {
                width: .8*unit - 2,
                margin: .1 * unit - 1,
                borderWidth: 1,
                display: "inline-block",
            },
            page: {
                lineHeight: "100%",
                fontSize: smallFont,
                fontFamily: "sans-serif",
                border: "1px solid black",
                margin: 0,
                padding: 0,
                display: "inline-block",
                width: width,
                height: height,
            },
            header: {
                position: "fixed",
                height: unit, width: width,
                boxShadow: "0 4px 4px rgba(0,0,0,.4)",
                background: "rgba(255,255,255,.7)"
            },
            backIcon: {
                float: "left",
                fontSize: largeFont,
                border: "solid black",
                height: unit * 0.8 - 2,
                borderRadius: unit / 6,
            },
            searchIcon: {
                position: "absolute",
                left: 5*unit,
                fontSize: largeFont,
                background: "#aff",
                height: unit * 0.8 - 2,
                border: "solid black",
                borderRadius: unit / 6,
            },
            sb4: {
                width: 3.7*unit - 2,
                margin: .1 * unit - 1,
                borderWidth: 1,
                display: "inline-block",
            },
            searchBox: {
                position: "absolute",
                top: 0,
                left: unit,
                width: 3.9 * unit - 2,
                lineHeight: "100%",
                fontSize: (unit * .8  - 6)  / 2 | 0,
                fontFamily: "sans-serif",
                marginTop: .1*unit,
                border: "1px solid black",
                height: .8*unit - 5,
                padding: 1,
            },
            searchLine: {
                width: 4.7*unit - 2,
                margin: .1 * unit - 1,
                fontSize: mediumFont,
                height: unit* 0.6 - 2,
                border: "1px solid black",
                padding: 0.1 * unit,
            },
            searchResult: {
                display: "inline-block",
                height: unit,
                overflow: "hidden",
                border: "1px solid black",
                margin: 0,
                padding: 0,
            },
            resultImg: {
                float: "left",
                height: unit,
                width: unit,
            },
            headerPadding: {
                height: unit
            },
            biblogo: {
                width: width,
                paddingTop: .4*unit,
                height: .6*unit, 
                fontSize: mediumFont,
                background: "#fee",
            },
            patronWidget: {
                height: unit, width: width/2,
                background: "#eef",
            },
            largeWidget: {
                height: (height - 3*unit) / 2,
                background: "#fbf",
                overflow: "hidden",
            },
        };
        return result;
    };

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
