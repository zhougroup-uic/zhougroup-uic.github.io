<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>

# DIRseq: a method for predicting drug-interacting residues of intrinsically disordered proteins from sequences

![](images/SeqDyn.png){width=80%}

## Method at a Glance

DIRseq is for predicting drug-interacting residues based on SeqDYN.
SeqDYN is a sequence-based method for predicting the NMR transverse relaxation rates of individual residues in an intrinsically disordered protein. For a central residue *n*, every other residue *i* contributes a multiplicative factor *f(i; n)*, which depends on the amino-acid type of residue *i* and the sequence distance |*i-n*|.

#### Reference:
* DIRseq: a method for predicting drug-interacting residues of intrinsically disordered proteins from sequences

## Prediction

#### Enter the IDP (or IDR) sequence to get predicted drug-interacting residues propensity

<form name="dirseq">
* Type a name for referencing your submission:

> <input name="submitter" size="20" type="text">

* Paste the amino-acid sequence (in one-letter code; space and digits will be skipped):

> <textarea cols="80" name="userInput"></textarea>

* Paste params as array ([b,s1,s2]):

> <textarea cols="80" name="userParams">[0.5,1.5,7.0]</textarea> 

> <input onclick="predict()" type="button" value="Predict!">
<input type="reset" value="Clear Entries">
<input onclick="FillForm('dirseq')" type="button" value="Input Example">

</form>

### Output

> Name: <code class="eq_disp" id="protein_name"> </code>

> Seqence: <code class="eq_disp" id="protein_seq"> </code>

#### Data
1st column, amino acid; 2nd column, predicted *R*<sub>2</sub> (in s<sup>-1</sup>) <br>
[*Note: a uniform scaling factor may be required to get best match with measured results.*]

<textarea id="textArea" style="position: relative; height:40vh; width:80vw"></textarea>

<br>
<button id="save" type="button" value="save"> Save data </button>

#### Figure

<div class="chart-container" style="position: relative; height:40vh; width:80vw">
<canvas id="myChart"></canvas>
</div>

<script src="js/formfill.js"></script>
<script src="js/DIRseq.js"></script>
<script src="js/chart.min.js"></script>
<script src="js/chart.js"></script>
<script src="js/utils.js"></script>
</body> 
