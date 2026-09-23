# fvGEMC source code

Standalone Julia source code of the GEMC engine for several model systems. Each folder holds
the script and an example `read.in` input file. Run a script from its folder with
`julia gemc.<system>.jl`. The Lennard-Jones script is the same engine used in the Julia
notebook in [`../Notebook`](../Notebook).

## Input file `read.in`

`read.in` lists whitespace-separated values (one per line, or several on one line), in the
order below. Entries differ by system in the force-field parameters (in **bold**).

| System | Source | Input | `read.in` entries |
|---|---|---|---|
| Lennard-Jones fluid | [`gemc.lj.jl`](lj/gemc.lj.jl) | [`read.in`](lj/read.in) | T, N, ρ, v1r, **rc**, bs, ncycles, seed, nvol |
| Square-well fluid | [`gemc.sw.jl`](sw/gemc.sw.jl) | [`read.in`](sw/read.in) | T, N, ρ, v1r, **λ**, bs, ncycles, seed, nvol |
| Patchy particles | [`gemc.patchy.jl`](patchy/gemc.patchy.jl) | [`read.in`](patchy/read.in) | T, N, ρ, v1r, **rc, npatch, patch_cov, patch_e**, bs, ncycles, seed, nvol |
| Patchy particle mixture | [`gemc.patchymix.jl`](patchymix/gemc.patchymix.jl) | [`read.in`](patchymix/read.in) | T, N, ρ, v1r, **rc, npatch, patch_cov, e00, e01, e10, e11, ratio0**, bs, ncycles, seed, nvol |

## Entries

Common entries:

- `T`: temperature
- `N`: total number of particles
- `ρ`: overall density
- `v1r`: fraction of the total volume in box 1
- `bs`: output mode (>0 log-spaced, <0 evenly spaced every |bs| cycles)
- `ncycles`: number of MC cycles
- `seed`: random seed
- `nvol`: volume-move weight

Force-field entries:

- `rc`: cutoff
- `λ`: well width
- `npatch`: number of patches per particle
- `patch_cov`: patch coverage
- `patch_e`: patch bonding energy
- `eij`: bonding energy between species i and j
- `ratio0`: fraction of species-0 particles
