<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>

# SeqDYN: Predictor for the Sequence-Dependent Backbone Dynamics of Intrinsically Disordered Proteins

![](images/SeqDyn.png){width=80%}

## Method at a Glance

SeqDYN is a sequence-based method for predicting the NMR transverse relaxation rates of individual residues in an intrinsically disordered protein. For a central residue *n*, every other residue *i* contributes a multiplicative factor *f(i; n)*, which depends on the amino-acid type of residue *i* and the sequence distance |*i-n*|.

#### Reference:
* S. Qin and H.-X. Zhou, Predicting the Sequence-Dependent Backbone Dynamics of Intrinsically Disordered Proteins, [bioRxiv 2023.02.02.526886](https://doi.org/10.1101/2023.02.02.526886)

## Prediction

#### Enter the IDP (or IDR) sequence to get predicted transverse relaxation rates (*R*<sub>2</sub>)

<form name="seqdyn">
* Type a name for referencing your submission:

> <input name="submitter" size="20" type="text">

* Paste the amino-acid sequence (in one-letter code; space and digits will be skipped):

> <textarea cols="80" name="userInput"></textarea>

* Paste params as array ([W,I,Y,R,H,F,L,K,E,M,A,Q,C,P,T,V,D,S,N,G,b]):

> <textarea cols="80" name="userParams">[1.3912, 1.2235, 1.1818, 1.1783, 1.1627, 1.1533, 1.1447, 1.1258, 1.1088, 1.107, 1.0894, 1.0702, 1.0544, 1.0434, 1.0414, 1.0395, 1.0378, 1.0169, 0.9993, 0.9838, 0.03164279998805]</textarea> 

> <input onclick="predict()" type="button" value="Predict!">
<input type="reset" value="Clear Entries">
<input onclick="FillForm('seqdyn')" type="button" value="Input Example">

</form>

### Output

> Name: <code class="eq_disp" id="protein_name"> </code>

> Seqence: <code class="eq_disp" id="protein_seq"> </code>

#### Data
1st column, amino acid; 2nd column, predicted *R*<sub>2</sub> (in s<sup>-1</sup>) <br>
[*Note: a uniform scaling factor may be required to get best match with measured results. The scaling factor typically ranges from 0.8 to 2. Higher scaling usually applies to measurements at low temperatures (e.g., 278 K).*]

<textarea id="textArea" style="position: relative; height:40vh; width:80vw"></textarea>

<br>
<button id="save" type="button" value="save"> Save data </button>

#### Figure

<div class="chart-container" style="position: relative; height:40vh; width:80vw">
<canvas id="myChart"></canvas>
</div>

<script src="js/formfill.js"></script>
<script src="js/SeqDyn.js"></script>
<script src="js/chart.min.js"></script>
<script src="js/chart.js"></script>
<script src="js/utils.js"></script>
</body> 
