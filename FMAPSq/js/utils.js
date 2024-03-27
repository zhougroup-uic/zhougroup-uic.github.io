//https://stackoverflow.com/questions/21479107/saving-html5-textarea-contents-to-file
function saveTextAsFile() {
    var textToWrite = document.getElementById('textArea').innerHTML;
    var textFileAsBlob = new Blob([textToWrite], {
        type: 'text/plain'
    });
    var fileNameToSaveAs = "FMAPSq.txt"; //filename.extension

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

var rdfdata;
function rdfchange(){
    let my_file=find('fmapsq', 'file-input').files[0];
    let reader=new FileReader();
    reader.onload = function() {
        rdfdata=reader.result;
        //console.log('rdfdata',rdfdata);
    }
    reader.readAsText(my_file);
}

function predict() {
    //let fname = find('fmapsq', 'submitter');
    const fname=find('fmapsq', 'file-input').files[0];
    const diam = Number(find('fmapsq', 'simga').value);
    let Cmol = Number(find('fmapsq', 'mol').value)/1000.0;
    const mW = Number(find('fmapsq', 'molWght').value)*1000.0;
    const mCon = Number(find('fmapsq','concent').value);
    const qstart= Number(find('fmapsq', 'qstart').value);
    const qstep= Number(find('fmapsq', 'qstep').value);
    const nq= Number(find('fmapsq', 'qnum').value);
    const protein_sigma= document.getElementById('protein_sigma');
    const protein_mol = document.getElementById('protein_mol');
    const protein_eat = document.getElementById('protein_eta');
    protein_sigma.innerHTML = diam;
    console.log(Cmol);
    if (Cmol==0){
        if ((mW!=0) && (mCon!=0)){
            Cmol=mCon/mW;
        }else{
            alert("Need specify molarity of protein solutions.");
            abort();
        }
    }
    protein_mol.innerHTML = Cmol;
    const eta=getEta(Cmol,diam/2.0);
    if (eta>0.5){
        protein_eat.innerHTML = `${eta} > 0.5. Warning: the result is not reliable.`
    }else{
        protein_eat.innerHTML = eta;
    }
    const result = fmapsq(fname,diam,qstart,qstep,nq,Cmol);
    const textarea = document.getElementById('textArea')
    textarea.innerHTML = result;
    plot();
}
