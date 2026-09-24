---
title: fvGEMC
---

# fvGEMC

**fvGEMC** (Fixed-Volume Gibbs Ensemble Monte Carlo) computes liquid–vapor coexistence
densities using a set of short, fixed-volume GEMC runs. The direct simulation results are fit to recover
the coexistence densities — reproducing the results of regular (volume-exchange) GEMC at
a fraction of the cost. The method and its validation on the truncated Lennard-Jones
fluid are demonstrated in the notebook below. Standalone GEMC codes for LJ and other fluids and data for figures are also provided.

## Notebook

The simulation and analysis are provided as a [Jupyter Notebook](https://jupyter.org/) — a
document that interleaves code, its output (figures, tables), and explanatory text into cells
that run in sequence in a web browser. It's provided in a Julia version and an equivalent
Python version, which produces the same results. Each version comes as a clean copy (no
output, ready to run) and a cached copy (precomputed outputs and figures, for quick preview
of results and also ready to run).

[Google Colab](https://colab.research.google.com) is a free, browser-based Jupyter Notebook
service: it opens and executes the notebook on Google's servers, so no local Python/Julia
installation is needed. Notebooks are free to open and view; signing in to a Google account
is only needed when one wishes to run the code.

| Notebook | Google Colab | GitHub Preview | Download (right-click, Save As) |
|---|---|---|---|
| fvgemc.ipynb (Julia, clean) | [Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.ipynb) | [Preview](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.ipynb) | [Download](Notebook/fvgemc.ipynb) |
| fvgemc.cached.ipynb (Julia, cached) | [Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.cached.ipynb) | [Preview](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.cached.ipynb) | [Download](Notebook/fvgemc.cached.ipynb) |
| fvgemc.py.ipynb (Python, clean) | [Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.ipynb) | [Preview](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.ipynb) | [Download](Notebook/fvgemc.py.ipynb) |
| fvgemc.py.cached.ipynb (Python, cached) | [Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.cached.ipynb) | [Preview](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.cached.ipynb) | [Download](Notebook/fvgemc.py.cached.ipynb) |

Julia can run the fvGEMC simulations in parallel across CPU cores, giving it a speed advantage
over the single-threaded Python version on a multi-core machine. On Colab's free shared tier,
though, the two run in similar times, since Colab's allotted "cores" are hyperthreads
rather than independent physical cores.

## Source codes

Standalone Julia source code of the fvGEMC engine is also available for several model systems
(Lennard-Jones, square-well, patchy particles, and patchy particle mixtures). See
[`Src/README.md`](Src/README.md) for the source files, input format, and how to run them.

## Reference

Sanbo Qin and Huan-Xiang Zhou, "A Fixed-Volume Variant of Gibbs-Ensemble Monte Carlo Yields
Significant Speedup in Binodal Calculations," [arXiv:2512.18899](https://arxiv.org/abs/2512.18899) (2025).

## Data

The data for figures in the publication are available in [`Data/fvGEMC.xlsx`](Data/fvGEMC.xlsx).
