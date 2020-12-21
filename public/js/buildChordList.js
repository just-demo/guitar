function buildChordList(container, chords){
    let chordFrets = {};
    chords.forEach(chord => chordFrets[chord.name] = chord.frets);
    chords.forEach(chord => $(container).append(buildChordView(chord)));

    $(document).on("click", ".listHeader", function(){
        let $chord = findParentChord(this);
        let $chordBody = $(".listBody", $chord);
        let isVisible = $chordBody.is(":visible");
        $(".listBody").hide('fast');
        if (!isVisible){
            if (!$chord.data("initialized")) {
                let chordName = getChordName($chord);
                let $chordDiagrams = $(".chordDiagrams", $chord);
                $chordDiagrams.html(buildChordDiagrams(chordFrets[chordName]));
                $("#sortable", $chord).sortable({
                    stop: () => refreshModified($chord)
                });
                $chord.data("initialized", true);
            }
            $chordBody.show('fast', () => $('html').animate({scrollTop: $chord.offset().top}));
        }
    });

    $(document).on("click", ".revert", function(){
        let $chord = findParentChord(this);
        disable($(".revert", $chord), $(".save", $chord));
        let $sortable = $("#sortable", $chord);
        let chordName = getChordName($chord);
        chordFrets[chordName].forEach(id => $sortable.append($("#" + id, $sortable)));
    });

    $(document).on("click", ".save", function(){
        let $chord = findParentChord(this);
        disable($(".revert", $chord), $(".save", $chord));
        let chordName = getChordName($chord);
        let frets = getVisibleOrder($chord);
        // This will also modify chords list
        chordFrets[chordName].length = 0;
        chordFrets[chordName].push(...frets);
        httpWriteJson("data/chords.json", chords);
         $(".chordDefault", $chord).html(frets[0]);
    });

    $(document).on("mousedown", ".diagram", function(event){
        // middle click
        if (event.which == 2) {
            $this = $(this);
            let $chord = findParentChord(this);
            let $sortable = $("#sortable", $chord);
            let selectedId = $this.attr("id");
            let similarIds = findSimilar(getVisibleOrder($chord), selectedId);
            $this.toggleClass("selected");
            if ($this.hasClass("selected")) {
                $this.removeClass("suppressed");
                similarIds.forEach(similarId => {
                    let $similar = $("#" + similarId, $sortable)
                    $similar.removeClass("selected").addClass("suppressed");
                    // move to the end
                    $sortable.append($similar);
                });
                refreshModified($chord);
            } else {
                similarIds.forEach(similarId => {
                    $("#" + similarId, $sortable).removeClass("suppressed");
                });
            }
        }
    });

    openTargetChord();

    function openTargetChord() {
        let targetChord = decodeURIComponent(window.location.hash.substr(1));
        if (targetChord) {
            $('[data-chord="' + targetChord + '"]').find(".listHeader").click();
        }
    }

    function getChordName($chord) {
        return $(".chordName", $chord).html();
    }

    function findSimilar(fretVariants, searchVariant) {
        return fretVariants.filter(variant => areSimilar(variant, searchVariant) && variant != searchVariant);
    }

    function areSimilar(frets1, frets2) {
        frets1 = frets1.split("-");
        frets2 = frets2.split("-");
        let min1 = minFret(frets1);
        let min2 = minFret(frets2);
        if (min1 != min2) {
            return false;
        }
        let length = Math.min(frets1.length, frets2.length);
        for (let i = 0; i < length; i++) {
            let fret1  = frets1[i];
            let fret2  = frets2[i];
            if (fret1 != min1 && fret1 != "x" && fret2 != min2 && fret2 != "x" && fret1 != fret2) {
                return false;
            }
        }
        return true;
    }

    function minFret(frets) {
        frets = frets.filter(fret => fret != "x").map(value => parseInt(value));
        return Math.min(...frets);
    }

    function buildChordDiagrams(fretVariants) {
        let buffer = [];
        buffer.push("<div id='sortable'>");
        for (let frets of fretVariants) {
            buffer.push("<div id='", frets, "' class='diagram pointer'>");
            buffer.push(buildChordDiagram(frets));
            buffer.push("</div>");
        }
        buffer.push("</div>");
        return buffer.join("");
    }

    function buildChordView(chord) {
        let $chord = $([
            "<table class='listItem' data-chord='", chord.name, "'>",
                "<tr class='listHeader'>",
                    "<td>",
                        "<span class='chordName'>", chord.name, "</span>",
                        "<span class='chordDefault'>", chord.frets[0], "</span>",
                    "</td>",
                "</tr>",
                "<tr class='listBody'>",
                    "<td>",
                        "<div class='listActions'>",
                            "<button type='button' class='revert' disabled>Revert</button>",
                            "<button type='button' class='save' disabled>Save</button>",
                        "</div>",
                        "<div class='chordDiagrams'></div>",
                    "</td>",
                "</tr>",
            "</table>"
        ].join(""));
        return $chord;
    }

    function refreshModified($chord) {
        let $revert = $(".revert", $chord);
        let $save = $(".save", $chord);
        let chordName = getChordName($chord);
        if (equalArrays(getVisibleOrder($chord), chordFrets[chordName])) {
            disable($save, $revert);
        } else {
            enable($save, $revert);
        }
    }

    function enable(...buttons) {
        buttons.forEach(button => $(button).removeAttr("disabled"));
    }

    function disable(...buttons) {
        buttons.forEach(button => $(button).attr("disabled", true));
    }

    function getVisibleOrder($chord) {
        return $("#sortable", $chord).sortable("toArray");
    }

    function equalArrays(array1, array2) {
        return array1.length == array2.length && array1.every((value, index) => value == array2[index])
    }

    function findParentChord(element) {
        let $element = $(element);
        while (!$element.hasClass("listItem")){
            $element = $element.parent();
        }
        return $element;
    }
}