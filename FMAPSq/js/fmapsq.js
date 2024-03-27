const { cos, sin, PI } = Math;
const constantsN_A = 6.02214076e23;
//const fs = require('fs');

function PercusYevick(k, R, molarity = null, eta = null) {
    if (molarity !== null) {
        const numdens = constantsN_A * molarity * 1e-27;
        eta = (4.0 / 3.0) * PI * R ** 3 * numdens;
    } else if (eta !== null) {
        const numdens = eta / ((4.0 / 3.0) * PI * R ** 3);
        molarity = numdens / (constantsN_A * 1e-27);
    } else {
        throw new Error("molarity or eta needs to be given.");
    }
    //console.log(k,R,molarity,eta);
    if (R === 0 || eta === 0) {
        const Sq = Array(k.length).fill(1.0);
        const a = 1.0;
    } else {
        const Sq = [];
        for (const q of k) {
            const u = q * R * 2;
            const a = (1 + 2 * eta) ** 2 / (1 - eta) ** 4;
            const b = (-3.0 / 2) * eta * (eta + 2) ** 2 / (1 - eta) ** 4;
            const UU = (a * (sin(u) - u * cos(u)) +
                b * ((2 / u ** 2 - 1) * u * cos(u) + 2 * sin(u) - 2 / u) +
                eta * a / 2 * (24 / u ** 3 + 4 * (1 - 6 / u ** 2) * sin(u) -
                    (1 - 12 / u ** 2 + 24 / u ** 4) * u * cos(u)));
            const _Sq = 1 / (1 + 24 * eta / u ** 3 * UU);
            Sq.push(_Sq);
        }
        return Sq;
    }
}

function readrdf(fname) {
    var lines;
    lines=rdfdata.split(/\r?\n/);
    //console.log('lines\n',lines);
    const x = [];
    const gr = [];
    for (let i=0;i<lines.length-1;i++) {
        line =lines[i];
        const [xi, gri] = line.split(' ').slice(0, 2);
        //console.log(line,xi,gri);
        x.push(parseFloat(xi));
        gr.push(parseFloat(gri));
    }
    return [gr, x];
}

function hdftt(h_r, x, k) {
    const Xk = [];
    for (const q of k) {
        let s = 0.0;
        for (let i = 0; i < x.length; i++) {
            const r = x[i];
            let dr;
            if (i === 0) {
                dr = x[1] - x[0];
            } else if (i === x.length - 1) {
                dr = x[i] - x[i - 1];
            } else {
                dr = (x[i + 1] - x[i - 1]) / 2.0;
            }
            s += r * h_r[i] * sin(q * r) * dr;
        }
        Xk.push((4.0 * PI * s) / q);
    }
    return Xk;
}

function Mayer(gr, x, R) {
    const mr = [];
    for (let i = 0; i < x.length; i++) {
        let m;
        if (x[i] <= R) {
            m = gr[i];
        } else {
            m = gr[i] - 1.0;
        }
        mr.push(m);
    }
    return mr;
}

function fmapsq(fname,sigma,qstart,qstep,nq,mol){
    //console.log(fname,sigma,qstart,qstep,nq,mol);
    const [gr, x] = readrdf(fname);
    let qs = [];
    for (let i = 0; i < nq; i++) {
        qs.push(qstart + i * qstep);
    }
    const mr = Mayer(gr, x, sigma);
    const qm = hdftt(mr, x, qs);
    //console.log('qs: ',qs);
    //console.log('qm: ',qm);
    const PY = PercusYevick(qs, sigma / 2.0, mol);
    const numd = constantsN_A * mol * 1e-27;
    //console.log('PY: ',PY);
    //return qs,qm,PY
    let output = "";
    for (let i = 0; i < qs.length; i++) {
        let row=`${qs[i]} ${1.0 / (1.0 / PY[i] - qm[i] * numd)} ${qm[i] * numd} ${PY[i]} \n`;
        //console.log(qs[i], 1.0 / (1.0 / PY[i] - qm[i] * numd), qm[i] * numd, PY[i]);      
        output += row;
    }
    //console.log("output\n",output);
    return output;
}

function usage(prog) {
    console.log(`Usage: nodejs ${prog} Bltz.txt diam qstrt qstp Nq Cmol`);  
    console.log(`    Or nodejs ${prog} Bltz.txt diam qstrt qstp Nq Cmas MW`);
}
/*
if (require.main === module) {
    const args = process.argv.slice(1);
    if (args.length !== 7) {
        usage(args[0]);
        process.exit();
    }
    const fname = args[1];
    //console.log(gr)
    //console.log(x)
    const sigma = parseFloat(args[2]);
    const qstart = parseFloat(args[3]);
    const qstep = parseFloat(args[4]);
    const nq = parseInt(args[5]);
    const mol = parseFloat(args[6])/1000.0; 
    const numd = constantsN_A * mol * 1e-27;
    const [qs,qm,PY] = fmapsq(fname,sigma,start,qend,qstep,mol);
    for (let i = 0; i < qs.length; i++) {
        console.log(qs[i], 1.0 / (1.0 / PY[i] - qm[i] * numd), qm[i] * numd, PY[i]);
    }
}
*/
