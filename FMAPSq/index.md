<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>

# FMAPS(q): Calculating Structure Factors of Protein Solutions by Atomistic Modeling of Protein-Protein Interactions

![](images/FMAPSq.png)

## Method at a Glance

FMAPS(q), for calculating the structure factor, of a protein
solution, by extending our fast Fourier transform-based modeling of atomistic protein-protein
interactions (FMAP) approach.

It takes the W(r) profile and volume-excluded diameter as input to produce the structure factors, S(q), at targeted concentration, bridged via percus-yevick approximation.

The FMAPB2 that provides the input info could be accessed from  [FMAPB2 web server](https://pipe.rcc.fsu.edu/fmapb2/) or a standalone version via [FMAPB2 registration](https://forms.office.com/r/nCWK1Rhk9L) or [direct link](https://github.com/zhougroup-uic/fmapb2). 

The javascript for FMAPS(q) to run in commad line are also available via [FMAPS(q) registration](https://forms.office.com/r/Q11wQ63ZZs) or [direct link](https://github.com/zhougroup-uic/fmapsq). 

#### Reference:
* S. Qin and H.-X. Zhou, Calculating Structure Factors of Protein Solutions by Atomistic Modeling of Protein-Protein Interactions, in submission.

## Prediction

##### Protein infomation

<form name="fmapsq">

* Upload the Bltz.txt file from FMAPB2

> <input type="file" name="file-input" onchange="rdfchange()">

* The volume-excluded diameter

> <input name="simga" size="20" type="number"> Å

##### Range of q values for outputting

* the starting value of q, the step size for incrementing, the number of values

> <input name="qstart" size="20" type="number" value=0.001 > <input name="qstep" size="20" type="number" value=0.001 > <input name="qnum" size="20" type="number" value=2000 >

##### Concentration of protein solution

* Directly give the molarity of protein solutions

> <input name="mol" size="20" type="number" value=2 > mM

* Or calculate from the Molecular Weight and mass concentration

> <input name="molWght" size="20" type="number"> kDa <input name="concent" size="20" type="number"> mg/ml

> <input onclick="predict()" type="button" value="Predict!">
<input type="reset" value="Clear Entries">
<input onclick="FillForm('fmapsq')" type="button" value="Input Example">

</form>
### Output

> diam: <code class="eq_disp" id="protein_sigma"> </code>

> Cmol: <code class="eq_disp" id="protein_mol"> </code>

> eta: <code class="eq_disp" id="protein_eta"> </code>

#### Data
1st column, *q*; 2nd column, *FMAPS(q)*; 3nd column, *rho\*(f-f<sub>HS</sub>)*; 4th column *PY*

<textarea id="textArea" style="position: relative; height:40vh; width:80vw"></textarea>

<br>
<button id="save" type="button" value="save"> Save data </button>

#### Figure

<div class="chart-container" style="position: relative; height:40vh; width:80vw">
<canvas id="myChart"></canvas>
</div>

<script src="js/formfill.js"></script>
<script src="js/fmapsq.js"></script>
<script src="js/chart.min.js"></script>
<script src="js/chart.js"></script>
<script src="js/utils.js"></script>
