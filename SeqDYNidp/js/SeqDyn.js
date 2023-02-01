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
    for (let i = 1; i < lsequence.length - 1; i++){
        let res_params_i = params.vars[lsequence[i]].slice((0))[0];
        let p=1.0;
        for (var j = 1, _pj_b = (lsequence.length - 1);
            (j < _pj_b); j += 1) {
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

function SILCFunction(Prot, params) {
    /*
    sequence: an array of the sequences you want to fit
    */
    let prd1 = SILC_MODEL(Prot, 1.0, params);
    //let prd3 = mul(prd1, params.ps.slice((-1))[0]);
    return prd1;
}

class Params {
    constructor(ps) {
        this.ps = ps.slice(0);
        const p = this.ps;
        const bn = p[20];
        this.vars = {};
        //const AAs = "KREDFWYAILMVCHNSTQGP";
        const AAs = "WIYRHFLKEMAQCPTVDSNG";
        for (let i = 0; i < AAs.length; i++){
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
        let nt = "NT";
        let ct = "CT";
        let seq = this.seq;
        if (_pj.in_es6(seq[0], aalower)) {
            nt = seq[0].toUpperCase();
            seq = seq.slice(1);
        }
        if (_pj.in_es6(seq.slice((-1))[0], aalower)) {
            ct = seq.slice((-1))[0].toUpperCase();
            seq = seq.slice(0, (-1));
        }
        return [seq, nt, ct];
    }
    convert() {
        /* Convert sequence into list with terminus */
        let [seq, nt, ct] = this.strip();
        let lseq = []
        lseq.push(nt)
        lseq = lseq.concat(seq.split(''));
        lseq.push(ct);
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
    chargedensity() {
        /* Caculate charge density of sequence */
        let lsequence = this.convert();
        let ne = 0.0;
        for (let i = 1; i < lsequence.length - 1; i++) {
            let aa = lsequence[i];
            if (_pj.in_es6(aa, ["R", "K"])) {
                ne += 1.0;
            } else {
                if (_pj.in_es6(aa, ["E", "D"])) {
                    ne += (-1.0);
                }
            }
        }
        return (ne / (lsequence.length - 2.0));
    }
}

function usage(prog) {
    console.log(`Usage: ${prog} params PROTEINSEQENCE"`);
}

function R2T2NMR(paramstr,seq){
    let params_all = eval(paramstr);
    //params_all=[1.1385,1.1118,1.0828,1.0425,1.1166,1.3701,1.2019,0.9811,1.0319,1.1040,1.0141,1.0010,0.9907,1.1078,1.0791,0.9323,0.9839,1.0381,0.9824,0.8955,9.068837195103e-03,0.8931,3.8388]
    let pro = new Protein(seq);
    if ((!pro.valid())) {
        process.exit(1);
    }
    let params = new Params(params_all);
    let prd = SILCFunction(pro, params);
    var nt,ct;
    [seq, nt, ct] = pro.strip();
    //console.log("#AA Prd");
    let result = "";
    for (let i = 0; i < seq.length; i++){
        let row = `${seq[i]} ${prd[i].toFixed(2)} \n`;
        result += row
        //console.log(seq[i], prd[i]);
    }
    return result
}

if (typeof require !== 'undefined' && require.main === module) {
    if ((process.argv.length <= 3)) {
        usage(process.argv[1]);
        process.exit(1);
    }
    let pfn = process.argv[2];
    let seq = process.argv[3];
    let result = R2T2NMR(pfn,seq);
    console.log(result);
}
