//https://stackoverflow.com/questions/21479107/saving-html5-textarea-contents-to-file
function saveTextAsFile() {
    var textToWrite = document.getElementById('textArea').innerHTML;
    var textFileAsBlob = new Blob([textToWrite], {
        type: 'text/plain'
    });
    var fileNameToSaveAs = "SeqDyn.txt"; //filename.extension

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

function seqchk(searchKey){
    if(/^>/.test(searchKey)){
	    searchKey = searchKey.substring(searchKey.indexOf("\n") + 1);
	}
	searchKey = searchKey.replace(/[0-9 \t\r\n]/g, "");
	//searchKey = searchKey.toUpperCase();
    //searchKey = searchKey.replace(/\/{2}$/, "");
	if(!searchKey.match(/^[ABCDEFGHIKLMNPQRSTUVWXYZ\-\*.]+$/)) {
		alert("Invalid amino sequence found.\nPlease check the input sequence.\n\n");
		return "";
	}
    return searchKey;
}

function predict() {
    let proname_in = find('seqdyn', 'submitter');
    let proseq_in = find('seqdyn', 'userInput');
    let params_in = find('seqdyn', 'userParams');
    let proname = document.getElementById('protein_name');
    let proseq = document.getElementById('protein_seq');
    let seq=seqchk(proseq_in.value);
    proname.innerHTML = proname_in.value;
    proseq.innerHTML = seq;
    let result = R2T2NMR(params_in.value,seq);
    let textarea = document.getElementById('textArea')
    textarea.innerHTML = result;
    plot();
}
