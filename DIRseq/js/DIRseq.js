"use strict";

function _pj_snippets(container) {
    function in_es6(left, right) {
        if (((right instanceof Array) || ((typeof right) === "string"))) {
            return (right.indexOf(left) > (-1));
        } else {
            if (((right instanceof Map) || (right instanceof Set) ||
                    (right instanceof WeakMap) || (right instanceof WeakSet))) {
                return right.has(left);
            } else {
                return (left in right);
            }
        }
    }
    container["in_es6"] = in_es6;
    return container;
}
let _pj = {};
_pj_snippets(_pj);

function BCF(curr_res, nI, qn0, an, bn) {
    let dst = Math.abs(curr_res - nI);
    return (1.0 + ((qn0 - 1.0) / ((1 + an * dst + bn * Math.pow(dst, 2)))));
}

function div(lst, val) {
    let out = Array(lst.length);
    for (let i = 0; i < lst.length; i++) {
        out[i] = lst[i] / val;
    }
    return out;
}

function mul(lst, val) {
    let out = Array(lst.length);
    for (let i = 0; i < lst.length; i++) {
        out[i] = lst[i] * val;
    }
    return out;
}

function SILC_MODEL(Prot, prefactor, params) {
    let lsequence = Prot.convert();
    let prediction = [];
    for (let i = 12; i < lsequence.length-12; i++) {
        let res_params_i = params.vars[lsequence[i]].slice((0))[0];
        let p = 1.0;
        for (let j = 0; j < lsequence.length; j++) {
            if ((i === j)) {
                continue;
            }
            let NResParams = params.vars[lsequence[j]];
            let bcf = BCF(i, j, ...NResParams);
            p *= bcf;
        }
        p *= prefactor * res_params_i;
        prediction.push(p);
    }
    return prediction;
}

// Calculate mean
function average(array) {
    const sum = array.reduce((a, b) => a + b, 0);
    return sum / array.length;
}

// Calculate standard deviation
function standardDeviation(array) {
    const avg = average(array);
    const squareDiffs = array.map(value => {
        const diff = value - avg;
        return diff * diff;
    });
    const avgSquareDiff = average(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

// convert the SeqDYN prediction R2 into a propensity
function R2p(prd, s1, s2) {
    let mean = average(prd)
    let sd = standardDeviation(prd)
    let R2_th = mean + s1 * sd
    let R2_nm = mean / s2
    let out = Array(prd.length);
    // console.log("s1,s2,mean,sd,R2_th,R2_nm:",s1,s2,mean,sd,R2_th,R2_nm);
    for (let i = 0; i < prd.length; i++) {
        out[i] = 1.0/(1.0 + Math.exp(-(prd[i] - R2_th) / R2_nm));
    }
    return out
}

function SILCFunction(Prot, params) {
    let prd1 = SILC_MODEL(Prot, 1.0, params);
    let prd2 = R2p(prd1, params.s[0], params.s[1])

    return prd2;
}

class Params {
    constructor(ps) {
        this.ps = ps.slice(0);
        const p = this.ps;
        const bn = p[20];
        this.vars = {};
        this.s = [p[21], p[22]]
        //const AAs = "KREDFWYAILMVCHNSTQGP";
        const AAs = "WIYRHFLKEMAQCPTVDSNG";
        for (let i = 0; i < AAs.length; i++) {
            this.vars[AAs[i]] = [p[i], 0.0, bn];
        }
    }
}
const aalower = 'acdefghiklmnpqrstvwy';
class Protein {
    /*
    Protein, initiated with sequence
    */

    constructor(seq) {
        this.seq = seq;
    }

    strip() {
        /* Strip amino acid in lowercase at end */
        let nt = "Q".repeat(12);
        let ct = "Q".repeat(12);
        let seq = this.seq;
        return [seq, nt, ct];
    }
    convert() {
        /* Convert sequence into list with terminus */
        let [seq, nt, ct] = this.strip();
        let lseq = []
        lseq = lseq.concat(nt.split(''));
        lseq = lseq.concat(seq.split(''));
        lseq = lseq.concat(ct.split(''));
        return lseq;
    }
    valid() {
        /* Validate Protein sequence */
        let out = [];
        for (let i = 0; i < this.seq.length; i++) {
            let aa = this.seq[i];
            if ((!_pj.in_es6(aa.toLowerCase(), aalower))) {
                let err =
                    `Error: ${aa} at postion ${i}, is not a valid amino acid code`;
                out.push(err);
            }
            if (i > 1 && i < (this.seq.length - 1) && (_pj.in_es6(aa,
                    aalower))) {
                let err =
                    `Error: ${aa} at postion ${i}, lower case not allowed in middle of sequence`;
                out.push(err);
            }
        }
        if ((out.length !== 0)) {
            for (let i = 0; i < out.length; i++) {
                console.log(out[i]);
            }
            return false;
        }
        return true;
    }
}

function usage(prog) {
    console.log(`Usage: ${prog} [params] PROTEINSEQENCE`);
    console.log(`       params could in form like [],[0.3,1.5,14.0],
                        or "[1.3912, 1.0395, 1.1818, 1.1783, 1.1627, 1.1533, 1.0395, 1.1258, 1.1088, 1.0395, 1.0894, 1.0702, 1.0544, 1.0434, 1.0414, 1.0395, 1.1088, 1.0169, 0.9993, 0.9838, 0.3, 1.5, 14.0]"`)
}

function R2T2NMR(paramstr, seq) {
    let params_all = eval(paramstr);
    //params_all=[1.1385,1.1118,1.0828,1.0425,1.1166,1.3701,1.2019,0.9811,1.0319,1.1040,1.0141,1.0010,0.9907,1.1078,1.0791,0.9323,0.9839,1.0381,0.9824,0.8955,9.068837195103e-03,0.8931,3.8388]
    let pro = new Protein(seq);
    if ((!pro.valid())) {
        process.exit(1);
    }
    let params_q = [1.3912, 1.0395, 1.1818, 1.1783, 1.1627, 1.1533, 1.0395, 1.1258, 1.1088, 1.0395, 1.0894, 1.0702, 1.0544, 1.0434, 1.0414, 1.0395, 1.1088, 1.0169, 0.9993, 0.9838];
    if (params_all.length == 0){
        params_all=[0.3,1.5,14.0]
    }
    if (params_all.length == 3){
        params_all = params_q.concat(params_all);
    }
    let params = new Params(params_all);
    let prd = SILCFunction(pro, params);
    var nt, ct;
    [seq, nt, ct] = pro.strip();
    //console.log("#AA Prd");
    let result = "";
    for (let i = 0; i < seq.length; i++) {
        let row = `${seq[i]} ${(100*prd[i]).toFixed(2)} \n`;
        result += row
        //console.log(seq[i], prd[i]);
    }
    return result
}

if (typeof require !== 'undefined' && require.main === module) {
    if (process.argv.length < 3) {
        usage(process.argv[1]);
        process.exit(1);
    }
    let pfn = "[]"
    let seq = ""
    if (process.argv.length == 3) {
        seq = process.argv[2];
    }else{
        pfn = process.argv[2];
        seq = process.argv[3];
    }
    let result = R2T2NMR(pfn, seq);
    console.log(result);
}
