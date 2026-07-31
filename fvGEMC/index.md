---
title: fvGEMC
---

# fvGEMC

**fvGEMC** (Fixed-Volume Gibbs Ensemble Monte Carlo) computes liquid–vapor coexistence
densities using a set of short, fixed-volume GEMC runs whose results are fit to recover
the coexistence densities — reproducing the results of regular (volume-exchange) GEMC at
a fraction of the cost. The method and its validation against the truncated Lennard-Jones
fluid are demonstrated in the notebook below.

## Notebook

The notebook is provided in a Julia version and an equivalent Python version, which reproduces
the same results. Each version comes as a clean copy (no output, ready to run) and a cached
copy (precomputed outputs and figures, for quick preview). Colab requires signing in to a
Google account to run, not to view.

| Notebook | Colab | Preview | Download (right-click, Save As) |
|---|---|---|---|
| fvgemc.ipynb (Julia, clean) | [Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.ipynb) | [Preview](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.ipynb) | [Download](Notebook/fvgemc.ipynb) |
| fvgemc.cached.ipynb (Julia, cached) | [Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.cached.ipynb) | [Preview](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.cached.ipynb) | [Download](Notebook/fvgemc.cached.ipynb) |
| fvgemc.py.ipynb (Python, clean) | [Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.ipynb) | [Preview](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.ipynb) | [Download](Notebook/fvgemc.py.ipynb) |
| fvgemc.py.cached.ipynb (Python, cached) | [Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.cached.ipynb) | [Preview](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.cached.ipynb) | [Download](Notebook/fvgemc.py.cached.ipynb) |

## Reference

Sanbo Qin and Huan-Xiang Zhou, "A Fixed-Volume Variant of Gibbs-Ensemble Monte Carlo Yields
Significant Speedup in Binodal Calculation," [arXiv:2512.18899](https://arxiv.org/abs/2512.18899) (2025).

## Data

The data for figures in the publication are available in [`Data/fvGEMC.xlsx`](Data/fvGEMC.xlsx).
