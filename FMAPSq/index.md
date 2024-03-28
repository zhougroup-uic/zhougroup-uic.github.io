<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>

# FMAPS(q): Calculating Structure Factors of Protein Solutions by Atomistic Modeling of Protein-Protein Interactions

![](images/FMAPSq.png){width=80%}

## Method at a Glance

FMAPS(q) is a code for calculating the structure factor, S(q), of a protein
solution, by extending our fast Fourier transform-based modeling of atomistic
protein-protein interactions (FMAP) approach. It takes the potential of mean
force W(R) along the center-center distance of a pair of protein molecules and
the protein diameter d as input. Both W(R) and d can be obtained from our
[FMAPB2 web server](https://pipe.rcc.fsu.edu/fmapb2/). Users can also download stand-alone versions of FMAPS(q) and
FMAPB2 by clicking

[registration to download software](https://forms.office.com/r/nCWK1Rhk9L)

The registration infomation will only be used for update notices and user
statistics.

#### References:

* S. Qin and H.-X. Zhou (2019), Calculation of Second Virial Coefficients of
    Atomistic Proteins Using Fast Fourier Transform, J Phys Chem B 123,
    8203-8215.
* S. Qin and H.-X. Zhou (2024), Calculating Structure Factors of Protein
    Solutions by Atomistic Modeling of Protein-Protein Interactions, [biorxiv](https://www.biorxiv.org/content/10.1101/2024.03.27.587040v1)

## Prediction

##### Protein infomation

<form name="fmapsq">

* Upload the Bltz.txt file from FMAPB2

> <input type="file" name="file-input" onchange="rdfchange()">

* The protein diameter

> <input name="simga" size="20" type="number"> Å

##### q values for outputting S(q)

* starting value of q, step size, number of q values

> <input name="qstart" size="20" type="number" value=0.001 > <input name="qstep" size="20" type="number" value=0.001 > <input name="qnum" size="20" type="number" value=2000 >

##### Protein concentration

* Convert to molarity from mass concentration and molecular mass

> Mass concentration: <input name="concent" size="20" type="number" > mg/ml; Molecular mass: <input name="molWght" size="20" type="number" > kDa

* Or directly give the molarity; leave empty if already filled above mass concentration

> <input name="mol" size="20" type="number" > mM

> <input onclick="predict()" type="button" value="Predict!">
<input type="reset" value="Clear Entries">
<input onclick="FillForm('fmapsq')" type="button" value="Input Example">

</form>
### Output

> diameter: <code class="eq_disp" id="protein_sigma" > </code>

> Molarity: <code class="eq_disp" id="protein_mol" > </code>

> Volume fraction: <code class="eq_disp" id="protein_eta"> </code>

#### Data
1st column, *q*; 2nd column, *S(q)*; 3nd column, *ρ\*(f\^-f\^<sub>HS</sub>)*; 4th column, *S<sub>PY<sub>*

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
