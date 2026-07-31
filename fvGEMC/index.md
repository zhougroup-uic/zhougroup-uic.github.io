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
the same results. Each is provided in two forms:

### Julia version

- [**fvgemc.ipynb**](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.ipynb) — a clean copy without output, ready to run. ([download](Notebook/fvgemc.ipynb) — right-click, Save As)
- [**fvgemc.cached.ipynb**](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.cached.ipynb) — includes precomputed outputs and figures, for quick preview on GitHub. ([download](Notebook/fvgemc.cached.ipynb) — right-click, Save As)

Requires a Julia kernel and is configured to run on [Google Colab](https://colab.research.google.com) (signing in to a Google account is needed to run, not to view):

- [Open fvgemc.ipynb in Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.ipynb)
- [Open fvgemc.cached.ipynb in Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.cached.ipynb)

### Python version

- [**fvgemc.py.ipynb**](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.ipynb) — a clean copy without output, ready to run. ([download](Notebook/fvgemc.py.ipynb) — right-click, Save As)
- [**fvgemc.py.cached.ipynb**](https://github.com/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.cached.ipynb) — includes precomputed outputs and figures, for quick preview on GitHub. ([download](Notebook/fvgemc.py.cached.ipynb) — right-click, Save As)

Requires a Python kernel and is configured to run on [Google Colab](https://colab.research.google.com) (signing in to a Google account is needed to run, not to view):

- [Open fvgemc.py.ipynb in Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.ipynb)
- [Open fvgemc.py.cached.ipynb in Colab](https://colab.research.google.com/github/zhougroup-uic/zhougroup-uic.github.io/blob/master/fvGEMC/Notebook/fvgemc.py.cached.ipynb)

## Reference

Sanbo Qin and Huan-Xiang Zhou, "A Fixed-Volume Variant of Gibbs-Ensemble Monte Carlo Yields
Significant Speedup in Binodal Calculation," [arXiv:2512.18899](https://arxiv.org/abs/2512.18899) (2025).

## Data

The data for figures in the publication are available in [`Data/fvGEMC.xlsx`](Data/fvGEMC.xlsx).
