let resultData = '';

function convertFiles() {
  const templateFile = document.getElementById('templateFile').files[0];
  const trajFile = document.getElementById('trajFile').files[0];
  const outputEl = document.getElementById('output');

  if (!templateFile || !trajFile) {
    outputEl.innerHTML = '<span class="error">Please select both files!</span>';
    return;
  }

  const reader1 = new FileReader();
  const reader2 = new FileReader();

  reader1.onload = function(e1) {
    const templateContent = e1.target.result;

    reader2.onload = function(e2) {
      const trajContent = e2.target.result;

      try {
        const options = {
          onlyCA: document.getElementById('onlyCA').checked,
          exyz: document.getElementById('exyz').checked,
          txt: document.getElementById('txt').checked
        };

        resultData = traj2pdb(templateContent, trajContent, options);
        outputEl.textContent = resultData;

      } catch (err) {
        outputEl.innerHTML = '<span class="error">Error: ' + err.message + '</span>';
      }
    };

    reader2.readAsText(trajFile);
  };

  reader1.readAsText(templateFile);
}

function downloadResult() {
  if (!resultData) {
    alert('Please convert files first!');
    return;
  }

  const exyz = document.getElementById('exyz').checked;
  const filename = exyz ? 'output.xyz' : 'output.pdb';
  const blob = new Blob([resultData], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
