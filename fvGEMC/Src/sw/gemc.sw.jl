using Random

wrap(x) = x - round(x)

mutable struct LCG
    state::Int64
end
const RNG = LCG(0)

Random.rand(rng::LCG)                    = (rng.state = (rng.state * 1103515245 + 12345) & 0x7fffffff; rng.state / 2147483647.0)
Random.rand(rng::LCG, ::Type{Bool})      = rand(rng) < 0.5
Random.rand(rng::LCG, r::UnitRange{Int}) = r.start + min(floor(Int, rand(rng) * length(r)), length(r)-1)
Random.rand(rng::LCG, n::Int)            = [rand(rng) for _ in 1:n]

# ---- Box ----

mutable struct Box
    pos::Vector{NTuple{3,Float64}}
    L::Float64
    lam2::Float64
    js::Float64
    ntry::Int
    naccept::Int
end

# ---- Energy ----

function sw(b::Box, p1, p2)
    r2 = sum(wrap.(p1 .- p2) .^ 2) * b.L^2
    r2 < 1.0    && return Inf
    r2 < b.lam2 && return -1.0
    return 0.0
end

function particle_energy(b::Box, p, skip::Int)
    e = 0.0
    for j in eachindex(b.pos)
        j == skip && continue
        e += sw(b, p, b.pos[j])
    end
    return e
end

total_energy(b::Box) = let n = length(b.pos), e = 0.0
    for i in 1:n-1, j in i+1:n
        e += sw(b, b.pos[i], b.pos[j])
    end
    e
end

get_V(b::Box)   = b.L^3
get_rho(b::Box) = length(b.pos) / get_V(b)
get_N(b::Box)   = length(b.pos)

# ---- Lattice init ----

function make_box(N::Int, L::Float64, lambda::Float64)
    pos = NTuple{3,Float64}[]
    n   = ceil(Int, cbrt(N))
    for i in 0:n-1, j in 0:n-1, k in 0:n-1
        length(pos) == N && break
        push!(pos, ((i+0.5)/n - 0.5, (j+0.5)/n - 0.5, (k+0.5)/n - 0.5))
    end
    return Box(pos, L, lambda^2, 0.005, 0, 0)
end

# ---- Translation move ----

function mcmove!(b::Box, beta::Float64)
    n = length(b.pos)
    n == 0 && return
    b.ntry += 1
    i   = rand(RNG, 1:n)
    old = b.pos[i]
    eo  = particle_energy(b, old, i)
    new = old .+ Tuple((b.js/b.L) .* (rand(RNG, 3) .- 0.5))
    en  = particle_energy(b, new, i)
    if rand(RNG) < exp(-beta*(en - eo))
        b.pos[i] = new
        b.naccept += 1
    end
    b.ntry % 1000 == 0 && adjust_step!(b)
end
mcmove!(e1::Box, e2::Box, beta::Float64) =
    rand(RNG, Bool) ? mcmove!(e1, beta) : mcmove!(e2, beta)

function adjust_step!(b::Box)
    ratio = b.naccept / b.ntry
    ratio < 0.5 ? (b.js > 1e-6 && (b.js *= 0.99)) : (b.js < 1.0 && (b.js *= 1.01))
    b.ntry = b.naccept = 0
end

# ---- Volume move ----

mutable struct VolState
    vstep::Float64; vtry::Int; vaccept::Int
end

function mcvol!(b1::Box, b2::Box, Vtot::Float64, vs::VolState, beta::Float64)
    vs.vtry += 1
    v1, v2   = get_V(b1), get_V(b2)
    n1, n2   = length(b1.pos), length(b2.pos)
    e1o, e2o = total_energy(b1), total_energy(b2)

    lnv = log(v1/v2) + vs.vstep*(rand(RNG) - 0.5)
    v1n = Vtot*exp(lnv)/(1 + exp(lnv))
    v2n = Vtot - v1n
    L1o, L2o = b1.L, b2.L
    b1.L, b2.L = cbrt(v1n), cbrt(v2n)

    e1n, e2n = total_energy(b1), total_energy(b2)
    arg = -beta*((e1n - e1o) + (e2n - e2o)) +
          (n1 + 1)*log(v1n/v1) + (n2 + 1)*log(v2n/v2)

    if rand(RNG) >= exp(arg)
        b1.L, b2.L = L1o, L2o
    else
        vs.vaccept += 1
    end

    if vs.vtry % 200 == 0
        ratio = vs.vaccept / vs.vtry
        ratio < 0.5 ? (vs.vstep *= 0.9) : (vs.vstep *= 1.1)
        vs.vtry = vs.vaccept = 0
    end
end

# ---- Swap move ----

function mcswap!(e1::Box, e2::Box, mu::Vector{Float64}, beta::Float64)
    boxes = (e1, e2)
    dst_i = rand(RNG, Bool) ? 1 : 2; src_i = 3-dst_i
    dst, src = boxes[dst_i], boxes[src_i]
    n_dst, n_src = length(dst.pos), length(src.pos)
    v_dst, v_src = get_V(dst), get_V(src)

    trial = Tuple(rand(RNG, 3) .- 0.5)
    e_add = particle_energy(dst, trial, 0)
    mu[dst_i] += v_dst * exp(-beta*e_add) / (n_dst + 1)   # Widom estimator

    n_src == 0 && return false
    i    = rand(RNG, 1:n_src)
    p    = src.pos[i]
    e_rm = particle_energy(src, p, i)

    arg = -beta*(e_add - e_rm) + log(v_dst*n_src / (v_src*(n_dst + 1)))
    if rand(RNG) < exp(arg)
        deleteat!(src.pos, i)
        push!(dst.pos, trial)
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
            total_energy(e1), " ", total_energy(e2))
    flush(out)
end

function write_exp!(out2::IO, e1::Box, e2::Box, nsteps::Int, do_steps::Int)
    println(out2, "#L=", 0.5*e2.L, "; step ", nsteps/do_steps)
    for p in e2.pos
        ip = wrap.(p)
        println(out2, ip[1]*e2.L, " ", ip[2]*e2.L, " ", ip[3]*e2.L, " 0.5 1")
    end
    for p in e1.pos
        ip = wrap.(p)
        println(out2, ip[1]*e1.L + e2.L + e1.L, " ", ip[2]*e1.L, " ", ip[3]*e1.L, " 0.5 2")
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

    T      = grab(Float64)
    ntotal = grab(Int)
    rho    = grab(Float64)
    v1r    = grab(Float64)
    lam    = grab(Float64)
    bs       = grab(Int)
    ncycles  = grab(Int)
    seed     = grab(Int)
    nvol     = grab(Int)
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
    println("beta=", beta)

    e1 = make_box(N1, L1, lam)
    e2 = make_box(N2, L2, lam)

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
