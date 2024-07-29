function _pj_snippets(container) {
    function in_es6(left, right) {
        if (((right instanceof Array) || ((typeof right) === "string"))) {
            return (right.indexOf(left) > (-1));
        } else {
            if (((right instanceof Map) || (right instanceof Set) || (
                    right instanceof WeakMap) || (right instanceof WeakSet))) {
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
    for (let i = 1; i < lsequence.length - 1; i++) {
        let res_params_i = params.vars[lsequence[i]];
        let p = 1.0;
        for (let j = 0; j < lsequence.length; j++) {
            if ((i === j)) {
                continue;
            }
            let NResParams = params.vars[lsequence[j]];
            let bcf = BCF(i, j, ...NResParams);
            p *= bcf;
        }
        p *= prefactor * res_params_i[0];
        prediction.push(p);
    }
    return prediction;
}

function SILCFunction(Prot, params) {
    /*
    sequence: an array of the sequences you want to fit
    */
    let prd1 = SILC_MODEL(Prot, 1.0, params);
    let maxprd = Math.max(...prd1);
    let prd2 = div(prd1, maxprd);
    let prd3 = mul(prd2, params.ps[8]);
    return prd3;
}
class Params {
    /*
    Params, initiated with array [Rqn0, Kqn0, Dqn0, Pqn0, Sqn0, Can, Nan, Cbn,  c] or [Kqn0, Dqn0, Pqn0]
    */
    constructor(ps) {
        if ((ps.length === 3)) {
            this.ps = [ps[0], ps[0], ps[1], ps[2], ps[2], 0.0982, 0.521,
                0.00305, 1.0
            ];
        } else {
            if ((ps.length === 9)) {
                this.ps = ps.slice(0);
            }
        }
        let p = this.ps;
        this.vars = {
            "NT": [p[0], p[5], p[7]],
            "K": [p[0], p[5], p[7]],
            "R": [p[0], p[5], p[7]],
            "D": [p[2], p[5], p[7]],
            "E": [p[2], p[5], p[7]],
            "CT": [p[2], p[5], p[7]]
        };
        const other = "ACFGHILMNPQSTVWY";
        for (let i = 0; i < other.length; i++) {
            let s = other[i];
            this.vars[s] = [p[3], p[6], 0.0];
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
    console.log(`Usage: ${prog} -idp|-all|-scl PROTEINSEQENCE`);
}

function ReSMAPidp(mode, seq) {
    //update params according pipe on 20240729
    //let params_idp3 = [2.4279041884730184, 0.2574548665297834,
    //    0.5932307355837573
    //];
    let params_idp3 = [2.4285569458914535, 0.2570263325454291, 0.592708804377946];
    //let params_all3 = [2.5190839716705775, 0.7585077980716294,
    //    1.028836074588618
    //];
    //let params_all3 = [2.3395676914539214, 0.6303288268416439, 1.1373651203984052];
    let params_all3 = [2.288506973625139, 0.6423574084106854, 1.1647943196641197];
    let pro = new Protein(seq);
    var params;
    if ((!pro.valid())) {
        process.exit(1);
    }
    if ((mode === "-idp")) {
        params = new Params(params_idp3);
    } else {
        if ((mode === "-amp")) {
            params = new Params(params_all3);
        } else {
            if ((mode === "-scl")) {
                let chd = (pro.chargedensity() * 2.47336);
                console.log(chd);
                process.exit(0);
            } else {
                usage(process.argv[1]);
                process.exit(1);
            }
        }
    }
    let prd = SILCFunction(pro, params);
    [seq, _, _] = pro.strip();
    //console.log("#AA Prd");
    let n = seq.length;
    var result = "";
    for (let i = 0; i < n; i++) {
        let row = `${seq[i]} ${prd[i].toFixed(2)} \n`;
        result += row
        //console.log(seq[i], prd[i].toFixed(2));
    }
    return result
}
/*
if (typeof require !== 'undefined' && require.main === module) {
    if (process.argv.length <= 3) {
        usage(process.argv[1]);
        process.exit(1);
    }
    let mode = process.argv[2];
    let seq = process.argv[3];
    let result=ReSMAPidp(mode,seq);
    console.log(result);
}
*/
