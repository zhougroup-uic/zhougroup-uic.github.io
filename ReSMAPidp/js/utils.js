//https://stackoverflow.com/questions/21479107/saving-html5-textarea-contents-to-file
function saveTextAsFile() {
    var textToWrite = document.getElementById('textArea').innerHTML;
    var textFileAsBlob = new Blob([textToWrite], {
        type: 'text/plain'
    });
    var fileNameToSaveAs = "ReSMAPidp.txt"; //filename.extension

    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    if (window.webkitURL != null) {
        // Chrome allows the link to be clicked without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    } else {
        // Firefox requires the link to be added to the DOM before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }

    downloadLink.click();
}

var button = document.getElementById('save');
button.addEventListener('click', saveTextAsFile);

function destroyClickedElement(event) {
    // remove the link from the DOM
    document.body.removeChild(event.target);
}

document.getElementById('btn-download').onclick = function() {
    // Trigger the download
    var a = document.createElement('a');
    let myChart = Chart.getChart("myChart");
    a.href = myChart.toBase64Image();
    a.download = 'ReSMAPidp.png';
    a.click();
}

function seqchk(searchKey) {
    if (/^>/.test(searchKey)) {
        searchKey = searchKey.substring(searchKey.indexOf("\n") + 1);
    }
    searchKey = searchKey.replace(/[0-9 \t\r\n]/g, "");
    //searchKey = searchKey.toUpperCase();
    //searchKey = searchKey.replace(/\/{2}$/, "");
    if (!searchKey.match(/^[ABCDEFGHIKLMNPQRSTUVWXYZ\-\*.]+$/)) {
        alert("Invalid amino sequence found.\nPlease check the input sequence.\n\n");
        return "";
    }
    return searchKey;
}

function predict() {
    var proname_in = find('resmapidp', 'submitter');
    var proseq_in = find('resmapidp', 'userInput');
    var helix_yes = document.getElementById('helix_yes');
    var proname = document.getElementById('protein_name');
    var proseq = document.getElementById('protein_seq');
    let seq = seqchk(proseq_in.value);
    var helix = document.getElementById('protein_helix');
    proname.innerHTML = proname_in.value;
    proseq.innerHTML = seq;
    let result = '';
    if (helix_yes.checked) {
        helix.innerHTML = "Yes";
        result = ReSMAPidp('-idp', seq);
    } else {
        helix.innerHTML = "No";
        result = ReSMAPidp('-all', seq);
    }
    let textarea = document.getElementById('textArea')
    textarea.innerHTML = result;
    plot();
}