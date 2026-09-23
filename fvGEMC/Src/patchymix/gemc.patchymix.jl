using Random
using LinearAlgebra

wrap(x) = x - round(x)

mutable struct LCG
    state::Int64
end
const RNG = LCG(0)

Random.rand(rng::LCG)                    = (rng.state = (rng.state * 1103515245 + 12345) & 0x7fffffff; rng.state / 2147483647.0)
Random.rand(rng::LCG, ::Type{Bool})      = rand(rng) < 0.5
Random.rand(rng::LCG, r::UnitRange{Int}) = r.start + min(floor(Int, rand(rng) * length(r)), length(r)-1)
Random.rand(rng::LCG, n::Int)            = [rand(rng) for _ in 1:n]

const HALF_ISQRT3 = 0.28867513459481292

# ---- Orientation helpers ----

# Uniform random unit vector (Marsaglia method)
function random_unit_vec()
    while true
        r1 = 2rand(RNG) - 1; r2 = 2rand(RNG) - 1
        s  = r1^2 + r2^2
        s < 1.0 && return (2r1*sqrt(1-s), 2r2*sqrt(1-s), 1-2s)
    end
end

# Random 3×3 rotation matrix via Gram-Schmidt
function random_orient()
    m = hcat([collect(random_unit_vec()) for _ in 1:3]...)
    v1 = m[:,1]; v1 /= norm(v1)
    v2 = m[:,2]; v2 -= dot(v2,v1)*v1; v2 /= norm(v2)
    v3 = m[:,3]; v3 -= dot(v3,v1)*v1; v3 -= dot(v3,v2)*v2; v3 /= norm(v3)
    hcat(v1, v2, v3)
end

# Rodriguez rotation matrix: rotation by angle θ around unit axis ax
function rodrigues(ax, θ::Float64)
    c, s = cos(θ), sin(θ); oc = 1-c
    x, y, z = ax[1], ax[2], ax[3]
    [x*x*oc+c    x*y*oc-z*s  x*z*oc+y*s;
     y*x*oc+z*s  y*y*oc+c    y*z*oc-x*s;
     z*x*oc-y*s  z*y*oc+x*s  z*z*oc+c  ]
end

# ---- Patch geometry ----

function body_patches(npatch::Int)
    raw = if npatch == 0
        Tuple{Float64,Float64,Float64}[]
    elseif npatch == 1
        [(0.0, 1.0, 0.0)]
    elseif npatch == 2
        [(0.0, 1.0, 0.0), (0.0, -1.0, 0.0)]
    elseif npatch == 3
        c, s = cos(π/6), sin(π/6)
        [(0.0, 1.0, 0.0), (c, -s, 0.0), (-c, -s, 0.0)]
    elseif npatch == 4
        h = HALF_ISQRT3
        [(-h,-h,h), (h,-h,-h), (h,h,h), (-h,h,-h)]
    else
        error("unsupported npatch=$npatch")
    end
    map(raw) do (x,y,z)
        n = sqrt(x^2+y^2+z^2)
        (0.5x/n, 0.5y/n, 0.5z/n)
    end
end

function orient_patches(orient::Matrix{Float64}, bp::Vector{NTuple{3,Float64}})
    [(orient[1,1]*x + orient[1,2]*y + orient[1,3]*z,
      orient[2,1]*x + orient[2,2]*y + orient[2,3]*z,
      orient[3,1]*x + orient[3,2]*y + orient[3,3]*z) for (x,y,z) in bp]
end

# ---- Particle ----

mutable struct Particle
    pos::NTuple{3,Float64}
    orient::Matrix{Float64}
    patches::Vector{NTuple{3,Float64}}
    body::Vector{NTuple{3,Float64}}
    npatch::Int
    cos_max::Float64
    species::Int  # 0 or 1
end

function make_particle(pos, npatch::Int, patch_cov::Float64, species::Int)
    bp     = body_patches(npatch)
    ctmax  = npatch > 0 ? 1.0 - 2.0*patch_cov/npatch : -2.0
    orient = random_orient()
    Particle(NTuple{3,Float64}(pos), orient, orient_patches(orient, bp), bp, npatch, ctmax, species)
end

function set_patches!(p::Particle)
    p.patches = orient_patches(p.orient, p.body)
end

# ---- Box ----

mutable struct Box
    parts::Vector{Particle}
    L::Float64
    rc2::Float64
    patch_e::NTuple{4,Float64}  # (e00, e01, e10, e11): energy for species-pair (p.species*2+q.species)
    npatch::Int
    patch_cov::Float64
    js::Float64
    rs::Float64
    ntry::Int; naccept::Int
    nrtry::Int; nraccept::Int
end

# ---- Kern-Frenkel pair energy ----

function patchy_pair(b::Box, p::Particle, q::Particle)
    dr  = wrap.(p.pos .- q.pos)
    r2  = sum(abs2, dr) * b.L^2
    r2 < 1.0    && return Inf
    r2 >= b.rc2 && return 0.0

    # inv_r×2 so that r̂·p̂ ∈ [-1,1] with |patch|=0.5
    inv_r = 2.0 / sqrt(r2)
    rx = dr[1]*b.L*inv_r
    ry = dr[2]*b.L*inv_r
    rz = dr[3]*b.L*inv_r

    bonds = 0
    for (px,py,pz) in p.patches
        rx*px + ry*py + rz*pz >= p.cos_max || continue
        for (qx,qy,qz) in q.patches
            (-rx*qx - ry*qy - rz*qz >= q.cos_max) && (bonds += 1)
        end
    end
    b.patch_e[1 + p.species*2 + q.species] * bonds
end

# ---- Energy functions ----

function particle_energy(b::Box, p::Particle, skip::Int)
    e = 0.0
    for (j, q) in enumerate(b.parts)
        j == skip && continue
        v = patchy_pair(b, p, q)
        isinf(v) && return v
        e += v
    end
    e
end

function total_energy(b::Box)
    e = 0.0
    n = length(b.parts)
    for i in 1:n-1, j in i+1:n
        v = patchy_pair(b, b.parts[i], b.parts[j])
        isinf(v) && return v
        e += v
    end
    e
end

get_V(b::Box)    = b.L^3
get_rho(b::Box)  = length(b.parts) / get_V(b)
get_N(b::Box)    = length(b.parts)
get_N0(b::Box)   = count(p -> p.species == 0, b.parts)

# ---- Lattice init ----

function make_box(N::Int, L::Float64, rc::Float64,
                  npatch::Int, patch_cov::Float64, patch_e::NTuple{4,Float64},
                  ratio0::Float64)
    parts = Particle[]
    n = ceil(Int, cbrt(N))
    N0 = round(Int, N * ratio0)  # number of species-0 particles in this box
    count = 0
    for i in 0:n-1, j in 0:n-1, k in 0:n-1
        length(parts) == N && break
        count += 1
        pos = ((i+0.5)/n - 0.5, (j+0.5)/n - 0.5, (k+0.5)/n - 0.5)
        push!(parts, make_particle(pos, npatch, patch_cov, count <= N0 ? 0 : 1))
    end
    Box(parts, L, rc^2, patch_e, npatch, patch_cov, 0.005, 0.1, 0,0, 0,0)
end

# ---- Translation + rotation move ----

function mcmove!(b::Box, beta::Float64)
    n = length(b.parts); n == 0 && return
    i = rand(RNG, 1:n); p = b.parts[i]
    eo = particle_energy(b, p, i)

    if rand(RNG) < 0.5   # translation
        b.ntry += 1
        Δ = (b.js/b.L) .* (rand(RNG, 3) .- 0.5)
        np = Particle((p.pos[1]+Δ[1], p.pos[2]+Δ[2], p.pos[3]+Δ[3]),
                      p.orient, p.patches, p.body, p.npatch, p.cos_max, p.species)
        en = particle_energy(b, np, i)
        if rand(RNG) < exp(-beta*(en-eo))
            b.parts[i] = np; b.naccept += 1
        end
        b.ntry % 1000 == 0 && adjust_trans!(b)
    else               # rotation
        b.nrtry += 1
        new_orient = p.orient * rodrigues(collect(random_unit_vec()), b.rs*(rand(RNG)-0.5))
        np = Particle(p.pos, new_orient, p.patches, p.body, p.npatch, p.cos_max, p.species)
        set_patches!(np)
        en = particle_energy(b, np, i)
        if rand(RNG) < exp(-beta*(en-eo))
            b.parts[i] = np; b.nraccept += 1
        end
        b.nrtry % 1000 == 0 && adjust_rot!(b)
    end
end

mcmove!(e1::Box, e2::Box, beta::Float64) =
    rand(RNG, Bool) ? mcmove!(e1, beta) : mcmove!(e2, beta)

function adjust_trans!(b::Box)
    ratio = b.naccept / b.ntry
    ratio < 0.5 ? (b.js > 1e-6 && (b.js *= 0.99)) : (b.js < 1.0  && (b.js *= 1.01))
    b.ntry = b.naccept = 0
end

function adjust_rot!(b::Box)
    ratio = b.nraccept / b.nrtry
    ratio < 0.5 ? (b.rs > 1e-4 && (b.rs *= 0.99)) : (b.rs < 2π   && (b.rs *= 1.01))
    b.nrtry = b.nraccept = 0
end

# ---- Volume move ----

mutable struct VolState
    vstep::Float64; vtry::Int; vaccept::Int
end

function mcvol!(b1::Box, b2::Box, Vtot::Float64, vs::VolState, beta::Float64)
    vs.vtry += 1
    v1, v2 = get_V(b1), get_V(b2)
    n1, n2 = get_N(b1), get_N(b2)
    e1o = total_energy(b1); e2o = total_energy(b2)

    lnv = log(v1/v2) + vs.vstep*(rand(RNG)-0.5)
    v1n = Vtot*exp(lnv)/(1+exp(lnv)); v2n = Vtot-v1n
    L1o, L2o = b1.L, b2.L
    b1.L, b2.L = cbrt(v1n), cbrt(v2n)

    e1n = total_energy(b1); e2n = total_energy(b2)
    arg = -beta*((e1n-e1o)+(e2n-e2o)) + (n1+1)*log(v1n/v1) + (n2+1)*log(v2n/v2)

    if rand(RNG) >= exp(arg)
        b1.L, b2.L = L1o, L2o
    else
        vs.vaccept += 1
    end

    if vs.vtry % 200 == 0
        ratio = vs.vaccept/vs.vtry
        ratio < 0.5 ? (vs.vstep *= 0.9) : (vs.vstep *= 1.1)
        vs.vtry = vs.vaccept = 0
    end
end

# ---- Swap move ----

function mcswap!(e1::Box, e2::Box, mu::Vector{Float64}, beta::Float64)
    boxes  = (e1, e2)
    dst_i  = rand(RNG, Bool) ? 1 : 2; src_i = 3-dst_i
    dst, src = boxes[dst_i], boxes[src_i]
    n_dst, n_src = get_N(dst), get_N(src)
    v_dst, v_src = get_V(dst), get_V(src)

    n_src == 0 && return false
    i    = rand(RNG, 1:n_src)
    p    = src.parts[i]
    e_rm = particle_energy(src, p, i)

    ghost = make_particle(Tuple(rand(RNG, 3).-0.5), dst.npatch, dst.patch_cov, p.species)
    e_add = particle_energy(dst, ghost, 0)
    mu[dst_i] += v_dst * exp(-beta*e_add) / (n_dst+1)   # Widom estimator

    arg = -beta*(e_add-e_rm) + log(v_dst*n_src / (v_src*(n_dst+1)))
    if rand(RNG) < exp(arg)
        deleteat!(src.parts, i)
        push!(dst.parts, ghost)
        return true
    end
    false
end

# ---- Swap-rate adapter ----

mutable struct SwapAdapt
    n::Float64; maxn::Float64; target::Float64; boundary::Float64
    attempts::Int; accepted::Int
end

function note_swap!(sa::SwapAdapt, accepted::Bool)
    sa.attempts += 1; accepted && (sa.accepted += 1)
    if sa.attempts >= max(1, round(Int, sa.n))
        if     sa.accepted > sa.target*(1+sa.boundary); sa.n *= 0.95
        elseif sa.accepted < sa.target*(1-sa.boundary); sa.n *= 1.05; end
        sa.n = clamp(sa.n, 1.0, sa.maxn)
        sa.attempts = 0; sa.accepted = 0
    end
end

# ---- Output ----

function report_stride(rep::Int)
    rep <= 100 && return 1
    10^(floor(Int, log10(rep-1))-1)
end
should_report(rep::Int) = rep % report_stride(rep) == 0

function sample!(out::IO, e1::Box, e2::Box, mu::Vector{Float64}, beta::Float64, nsteps::Int, rep::Int)
    println(out, rep, " ", get_rho(e1), " ", get_rho(e2), " ", get_N(e1), " ", get_N(e2), " ",
            get_V(e1), " ", get_V(e2), " ",
            -log(mu[1]/nsteps)/beta, " ", -log(mu[2]/nsteps)/beta, " ",
            total_energy(e1), " ", total_energy(e2), " ", get_N0(e1), " ", get_N0(e2))
    flush(out)
end

function write_exp!(out2::IO, e1::Box, e2::Box, nsteps::Int, do_steps::Int)
    println(out2, "#L=", 0.5*e2.L, "; step ", nsteps/do_steps)
    for p in e2.parts
        ip = wrap.(p.pos)
        println(out2, ip[1]*e2.L, " ", ip[2]*e2.L, " ", ip[3]*e2.L, " 0.5 1")
    end
    for p in e1.parts
        ip = wrap.(p.pos)
        println(out2, ip[1]*e1.L+e2.L+e1.L, " ", ip[2]*e1.L, " ", ip[3]*e1.L, " 0.5 2")
    end
end

# ---- Main ----

function main(infile="read.in", outfile="data.out", posfile="p.dat";
              npart::Int=3000, nvol::Int=15,
              nswap0::Float64=3000.0, nswap_max::Float64=10_000.0,
              swap_target::Float64=1.0, swap_boundary::Float64=0.025)

    toks = split(read(infile, String))
    idx  = Ref(1)
    grab(::Type{T}) where T = (v = parse(T, toks[idx[]]); idx[] += 1; v)

    T         = grab(Float64)
    ntotal    = grab(Int)
    rho       = grab(Float64)
    v1r       = grab(Float64)
    rc        = grab(Float64)
    npatch    = grab(Int)
    patch_cov = grab(Float64)
    e00       = grab(Float64)
    e01       = grab(Float64)
    e10       = grab(Float64)
    e11       = grab(Float64)
    patch_e   = (e00, e01, e10, e11)
    ratio0    = grab(Float64)   # fraction of species-0 particles
    bs        = grab(Int)
    ncycles   = grab(Int)
    seed      = grab(Int)
    nvol      = grab(Int)
    RNG.state = seed
    N1 = round(Int, ntotal * v1r); N2 = ntotal - N1
    Vtot = ntotal / rho
    V1 = v1r * Vtot; V2 = Vtot - V1
    L1 = cbrt(V1);   L2 = cbrt(V2)
    n1 = ceil(Int, cbrt(N1)); n2 = ceil(Int, cbrt(N2))
    (L1 >= n1 && L2 >= n2) || error("density too high: L1=$L1 n1=$n1, L2=$L2 n2=$n2")
    beta = 1.0/T
    do_steps = ncycles * ntotal
    nequil = ncycles ÷ 2   # average densities over the second half of the run (post-equilibration)
    println("beta=", beta, "  npatch=", npatch,
            "  patch_cov=", patch_cov, "  patch_e=", patch_e, "  ratio0=", ratio0)

    e1 = make_box(N1, L1, rc, npatch, patch_cov, patch_e, ratio0)
    e2 = make_box(N2, L2, rc, npatch, patch_cov, patch_e, ratio0)

    # bs < 0: even-interval output every |bs| cycles (ntotal*|bs| steps)
    # bs > 0: log-spaced output, same block size ntotal*bs steps
    even_out = bs < 0
    nrep = ntotal * abs(bs)

    vs = VolState(0.1, 0, 0)
    sa = SwapAdapt(nswap0, nswap_max, swap_target, swap_boundary, 0, 0)
    mu = zeros(2); nsteps = 0
    s1 = s2 = 0.0; nacc = 0

    out  = open(outfile, "w")
    out2 = open(posfile,  "w")

    while nsteps < do_steps
        nsteps += 1
        nswap_now = max(1, round(Int, sa.n))
        R = rand(RNG, 1:(npart+nvol+nswap_now))
        if R <= npart
            mcmove!(e1, e2, beta)
        elseif R <= npart+nvol
            mcvol!(e1, e2, Vtot, vs, beta)
        else
            accepted = mcswap!(e1, e2, mu, beta)
            # note_swap!(sa, accepted)
        end
        if nsteps % nrep == 0
            cycle = nsteps ÷ ntotal
            rep   = nsteps ÷ nrep
            if even_out || should_report(rep)
                sample!(out, e1, e2, mu, beta, nsteps, cycle)
                if cycle > nequil
                    r1, r2 = minmax(get_rho(e1), get_rho(e2))
                    s1 += r1; s2 += r2; nacc += 1
                end
            end
        end
    end

    write_exp!(out2, e1, e2, nsteps, do_steps)
    close(out); close(out2)
    rho_dilute, rho_dense = nacc > 0 ? (s1/nacc, s2/nacc) : (NaN, NaN)
    return (dilute=rho_dilute, dense=rho_dense, e1=e1, e2=e2)
end

if abspath(PROGRAM_FILE) == @__FILE__
    r = main()
    println("PHASE ", r.dilute, " ", r.dense)
end
