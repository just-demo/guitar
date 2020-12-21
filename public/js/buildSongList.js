function buildSongList(container, songs, chords){
    chords = convertChords(chords);
    flattenSongs(songs).forEach(song => $(container).append(buildSongView(song)));

    let dialog = $("#newSongDialog").dialog({
        autoOpen: false,
        width: 350,
        height: 400,
        modal: true,
        buttons: {
            Save: function() {
                let $performer = $('input[name="performer"]', $(this));
                let $title = $('input[name="title"]', $(this));
                let $text = $('textarea[name="text"]', $(this));
                let song = {
                    performer: $performer.val().trim(),
                    title: $title.val().trim(),
                    text: $text.val()
                };
                $("input", $(this)).removeClass("ui-state-error");
                let valid = true;
                if (!song.performer) {
                    $performer.addClass("ui-state-error");
                    valid = false;
                }
                if (!song.title) {
                    $title.addClass("ui-state-error");
                    valid = false;
                }
                if (!song.text) {
                    $text.addClass("ui-state-error");
                    valid = false;
                }
                if (song.performer && song.title && song.performer in songs && song.title in songs[song.performer]) {
                    $performer.addClass("ui-state-error");
                    $title.addClass("ui-state-error");
                    valid = false;
                }

                if (valid) {
                    httpWriteText(songPath(song.performer, song.title), song.text);
                    $song = buildSongView(song);
                    $(container).append($song);
                    $(this).dialog("close");
                    $(".listHeader", $song).trigger("click");
                }
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function() {
            $("*", $(this)).removeClass("ui-state-error");
            $(this).find("form")[0].reset();
        }
    });

    $(document).on("click", ".listHeader", function(){
        let $song = findParentSong(this);
        let $songBody = $(".listBody", $song);
        let isVisible = $songBody.is(":visible");
        $(".listBody").hide('fast');
        $(".listItem").addClass("noPrint");
        if (!isVisible){
            if (!$song.data("initialized")) {
                let performer = $(".songPerformer", $song).html();
                let title = $(".songTitle", $song).html();
                let text = httpReadText(songPath(performer, title));
                setViewText($(".songText", $song), text);
                refreshChordDiagrams($song);
                $song.data("saved", text);
                $song.data("initialized", true);
            }
            $songBody.show('fast', () => $('html').animate({scrollTop: $song.offset().top}));
            $song.removeClass("noPrint");
        }
    });

    $(document).on("mousedown", ".listHeader", function(event){
        // middle click
        if (event.which == 2) {
            let $song = findParentSong(this);
            let $songHeader = $(".listHeader", $song);
            $songHeader.toggleClass("selected");
            let performer = $(".songPerformer", $song).html();
            let title = $(".songTitle", $song).html();
            httpWriteText(songPath(performer, title) + "?selected=" + $songHeader.hasClass("selected"), "");
        }
    });

    $(document).on("dblclick", ".songText", function(){
        let $song = findParentSong(this);
        let $songView = $(this);
        let $songEdit = $(".songEdit", $song);
        let $textarea = $("<textarea>").css({
            "width": $songView.outerWidth() + 10,
            "height": $songView.outerHeight() + 20
        }).val(songHtmlToText($songView.html()));
        $songEdit.html("").append($textarea);
        $songView.hide();
        $songEdit.show();
        $("button", $song).attr("disabled", true);
    });

    $(document).on("dblclick", ".songEdit", function(){
        let $song = findParentSong(this);
        let $songView = $(".songText", $song);
        let $songEdit = $(this);
        let text = $("textarea", $songEdit).val()
        setViewText($songView, text);
        $songEdit.hide();
        $songView.show();
        $("button", $song).removeAttr("disabled");
        refreshChordDiagrams($song);
        refreshModified($song);
    });

    $(document).on("click", ".transpose", function(){
        let $song = findParentSong(this);
        let $songText = $(".songText", $song);
        let direction = $(this).data("step") < 0 ? "prev" : "next";
        $(".chord", $songText).each(function(){
            let chord = $(this).html();
            if (chords[chord] && chords[chord][direction]){
                $(this).html(chords[chord][direction].name);
            }
        });
        refreshChordDiagrams($song);
        refreshModified($song);
    });

    $(document).on("click", ".revert", function(){
        let $song = findParentSong(this);
        $(".revert", $song).attr("disabled", true);
        $(".save", $song).attr("disabled", true);
        let $songView = $(".songText", $song);
        setViewText($songView, $song.data("saved"));
        refreshChordDiagrams($song);
    });

    $(document).on("click", ".save", function(){
        let $song = findParentSong(this);
        $(".revert", $song).attr("disabled", true);
        $(".save", $song).attr("disabled", true);
        let $songView = $(".songText", $song);
        let performer = $(".songPerformer", $song).html();
        let title = $(".songTitle", $song).html();
        let text = songHtmlToText($songView.html());
        httpWriteText(songPath(performer, title), text);
        $song.data("saved", text);
    });

    $(document).on("click", ".delete", function(){
        if (window.confirm("Delete the song?")) {
            let $song = findParentSong(this);
            let performer = $(".songPerformer", $song).html();
            let title = $(".songTitle", $song).html();
            $song.remove();
            httpDelete(songPath(performer, title));
        }
    });

    $(document).on("click", ".printAction", function(){
        window.print();
    });

    $(document).on("click", "#newSongButton", function(){
        dialog.dialog("open");
    });

    function buildSongView(song) {
        let $song = $([
            "<div class='listItem noPrint'>",
                "<div class='listHeader ", song.selected ? "selected" : "", "'>",
                    "<span class='songPerformer'>", song.performer, "</span>",
                    " - ",
                    "<span class='songTitle'>", song.title, "</span>",
                "</div>",
                "<div class='listBody'>",
                    "<table>",
                        "<tr class='songActions noPrint'>",
                            "<td colspan='3'>",
                                "<button type='button' class='transpose' data-step='-1'>-</button>",
                                "<button type='button' class='transpose' data-step='1'>+</button>",
                                "<button type='button' class='revert right' disabled>Revert</button>",
                                "<button type='button' class='save' disabled>Save</button>",
                                "<button type='button' class='delete'>Delete</button>",
                                "<button type='button' class='printAction'>Print</button>",
                            "</td>",
                        "</tr>",
                        "<tr>",
                            "<td class='songText'></td>",
                            "<td class='songEdit'></td>",
                            "<td class='songChords'></td>",
                        "</tr>",
                    "</table>",
                "</div>",
            "</div>"
        ].join(""));
        return $song;
    }

    function setViewText($songView, text) {
        $songView
            .html(songTextToHTML(text))
            .find(".chord")
            .on("click", function(){openChordPage($.trim($(this).html()))})
            .easyTooltip({
                content: function(){
                    let chordName = $.trim($(this).html());
                    let chordDiagram = chordName in chords ? buildChordDiagram(chords[chordName].frets[0]) : "Unknown<br/>chord";
                    return "<div class='chord_popup'>" + chordDiagram + "</div>";
                }
            });
    }

    function convertChords(chords) {
        let chordMap = {};
        chords.forEach(chord => {
            chordMap[chord.name] = {...chord};
        });


        for (let currentName in chordMap) {
            let nextName = chordMap[currentName].next;
            if (nextName in chordMap) {
                chordMap[currentName].next = chordMap[nextName];
                chordMap[nextName].prev = chordMap[currentName];
            } else {
                chordMap[currentName].next = null;
            }
        }
        return chordMap;
    }

    function flattenSongs(songMap) {
        let songList = [];
        for (let [performer, songs] of Object.entries(songMap)) {
            for (let [title, selected] of Object.entries(songs)) {
                songList.push({
                    performer: performer,
                    title: title,
                    selected: selected
                });
            }
        }
        songList.sort((s1, s2) => compare(s1, s2,
            // selected songs go first
            s => !s.selected,
            s => s.performer,
            s => s.title
        ));
        return songList;
    }

    function compare(o1, o2, ...mappers) {
        mappers = mappers.length ? mappers : [o => o];
        for (let mapper of mappers) {
            let v1 = mapper(o1);
            let v2 = mapper(o2);
            let diff = v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
            if (diff) {
                return diff;
            }
        }
        return 0;
    }

    function songPath(performer, title) {
        return `data/songs/${performer}/${title}.txt`;
    }

    function findParentSong(element) {
        let $element = $(element);
        while (!$element.hasClass("listItem")){
            $element = $element.parent();
        }
        return $element;
    }

    function refreshModified($song) {
        let $songView = $(".songText", $song);
        let $revert = $(".revert", $song);
        let $save = $(".save", $song);
        let text = songHtmlToText($songView.html());
        if (text == $song.data("saved")) {
            $revert.attr("disabled", true);
            $save.attr("disabled", true);
        } else {
            $revert.removeAttr("disabled");
            $save.removeAttr("disabled");
        }
    }

    function refreshChordDiagrams($song){
        let $songText = $(".songText", $song);
        let songChords = distinct($(".chord", $songText)
            .toArray()
            .map(chord => $(chord).html()));

        let buffer = [];
        let columns = 3;
        let rows = Math.ceil(songChords.length / columns);

        buffer.push("<table>");
        for (let i = 0; i < rows; ++i) {
            buffer.push("<tr>");
            for (let j = 0; j < columns; ++j) {
                buffer.push("<td>");
                let k = i * columns + j;
                if (songChords[k]){
                    buffer.push("<span class='chord'>", songChords[k], "</span>");
                    buffer.push(songChords[k] in chords ? buildChordDiagram(chords[songChords[k]].frets[0]) : "Unknown<br/>chord");
                }
                buffer.push("</td>");
            }
            buffer.push("</tr>");
        }
        buffer.push("</table>");
        $(".songChords", $song)
            .html(buffer.join(""))
            .find(".chord")
            .on("click", function(){openChordPage($.trim($(this).html()))})
            .easyTooltip({
                content: function(){
                    let chordName = $.trim($(this).html());
                    let chordDiagrams = chordName in chords ?
                        chords[chordName].frets.map(buildChordDiagram).join("<br/>") :
                        "Unknown<br/>chord";
                    return "<div class='chord_popup'>" + chordDiagrams + "</div>";
                }
            });
    }

    function openChordPage(chordName) {
        window.open("chords.html#" + encodeURIComponent(chordName), '_blank');
    }

    function buildChordDiagrams2(frets) {
        let buffer = [];
        let columns = 2;
        let rows = Math.ceil(frets.length / columns);
        buffer.push("<table>");
        for (let i = 0; i < rows; ++i) {
            buffer.push("<tr>");
            for (let j = 0; j < columns; ++j) {
                buffer.push("<td>");
                let k = i * columns + j;
                if (frets[k]){
                    buffer.push(buildChordDiagram(frets[k]));
                }
                buffer.push("</td>");
            }
            buffer.push("</tr>");
        }
        buffer.push("</table>");
        return buffer.join("");
    }

    function distinct(array){
        return Array.from(new Set(array))
    }

    function songTextToHTML(text){
        return text
            .replace(new RegExp("(^|\\s|\\()(" + Object.keys(chords).join("|") + ")(?=\\s|\\)|$)", "g"), "$1{$2}")
            .replace(/\n/g, "<br/>")
            .replace(/\s/g, "&nbsp;")
            .replace(/\{([^}]+)\}/g, "<span class='chord'>$1</span>");
    }

    function songHtmlToText(html){
        return html
            .replace(new RegExp("<br.*?>", "g"), "\n")
            .replace(new RegExp("&nbsp;", "g"), " ")
            .replace(/<span.*?>(.+?)<\/span>/g, "{$1}");
    }
}