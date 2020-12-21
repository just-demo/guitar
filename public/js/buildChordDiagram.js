function buildChordDiagram(frets){
    frets = decodeFrets(frets);
    var min = null;
    var max = null;
    for (var fret of frets){
        if (fret != null){
            if (fret < min || min === null){
                min = fret;
            }
            if (fret > max || max === null){
                max = fret;
            }
        }
    }

    var bar = hasBar(frets) ? min : null;

    min = min === null ? 0 : min;
    max = max === null ? 1 : max;

    var maxLength = Math.max(("" + max).length, 3);

    //expand min/max to -1/+1
    min = Math.max(0, min - 1);
    max = Math.max(max, min + 5 - (min > 0 ? 1 : 0));

    var buffer = [];
    buffer.push("<table border='0' cellpadding='0' cellspacing='0'>");
    for (var fret of frets){
        buffer.push("<tr>");
        buffer.push("<td>", encodeFret(fret).padStart(maxLength, " ").replace(/\s/g, "&nbsp;"), "</td><td>|</td>");
        for (var i = Math.max(min, 1); i <= max; ++i){
            buffer.push("<td>" + center(i === fret || i === bar ? (fret !== null ? "" + i : "x") : "-", maxLength, "-") + "</td><td>|</td>");
        }
        buffer.push("</tr>\n");
    }
    buffer.push("</table>");
    return buffer.join("");

    function decodeFrets(frets) {
        frets = $.isArray(frets) ? frets : frets.split("-");
        return frets.map(decodeFret);
    }

    function encodeFret(fret){
        return fret === null ? "x" : "" + fret;
    }

    function decodeFret(fret){
        return "x" === fret || "" === fret ? null : parseInt(fret, 10);
    }

    function repeat(length, character){
        return length > 0 ? character.repeat(length) : "";
    }

    function center(string, length, character){
        var left = Math.ceil((length - string.length) / 2);
        var right = (length - string.length - left);
        return repeat(left, character) + string + repeat(right, character);
    }

    function hasBar(frets){
        let hasClosed = false;
        for (let fret of frets){
            if (fret === null){
                hasClosed = true;
            } else if (hasClosed){
                // closed are allowed only on top
                return false;
            }
        }
        return true;
    }
}