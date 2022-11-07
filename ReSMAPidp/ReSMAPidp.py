#!/usr/bin/env python3
# coding: utf-8

import numpy as np


def BCF(curr_res, nI, qn0, an, bn):
    return 1.0 + ((qn0 - 1.0) / (1 + an * abs(curr_res - nI) +
                                 bn * abs(curr_res - nI) ** 2))


def ReSMAP_MODEL(Prot, prefactor, params):
    lsequence = Prot.convert()
    prediction = []
    for i in range(1, len(lsequence) - 1):
        res_params_i = params.vars.get(lsequence[i])
        p = []
        for j in range(0, len(lsequence)):
            if i == j:
                continue
            NResParams = params.vars.get(lsequence[j])
            bcf = BCF(i, j, *NResParams)
            p.append(bcf)
        prediction.append(prefactor * res_params_i[0] * np.prod(p))
    return prediction


def ReSMAPFunction(Prot, params):
    """
    sequence: an array of the sequences you want to fit
    """
    prd1 = ReSMAP_MODEL(Prot, 1.0, params)
    maxprd = np.max(prd1)
    prd2 = np.array(prd1) / maxprd
    prd3 = prd2 * params.ps[8]
    return list(prd3)


class Params:
    """
    Params, initiated with array [Rqn0, Kqn0, Dqn0, Pqn0, Sqn0, Can, Nan, Cbn,  c] or [Kqn0, Dqn0, Pqn0]
    """

    def __init__(self, ps):
        if len(ps) == 3:
            self.ps = [ps[0], ps[0], ps[1], ps[2],
                       ps[2], 0.0982, 0.521, 0.00305, 1.0]
        elif len(ps) == 9:
            self.ps = ps[:]
        p = self.ps
        self.vars = {
            "NT": [p[0], p[5], p[7]],
            "K": [p[0], p[5], p[7]],
            "R": [p[0], p[5], p[7]],
            "D": [p[2], p[5], p[7]],
            "E": [p[2], p[5], p[7]],
            "CT": [p[2], p[5], p[7]],
        }
        for s in "ACFGHILMNPQSTVWY":
            self.vars[s] = [p[3], p[6], 0.0]


class Protein:
    """
    Protein, initiated with sequence
    """
    aalower = "acdefghiklmnpqrstvwy"

    def __init__(self, seq):
        self.seq = seq

    def strip(self):
        """Strip amino acid in lowercase at end"""
        nt = "NT"
        ct = "CT"
        seq = self.seq
        if seq[0] in Protein.aalower:
            nt = seq[0].upper()
            seq = seq[1:]
        if seq[-1] in Protein.aalower:
            ct = seq[-1].upper()
            seq = seq[:-1]
        return seq, nt, ct

    def convert(self):
        """Convert sequence into list with terminus"""
        seq, nt, ct = self.strip()
        lseq = np.insert(np.array(list(seq)).astype(
            "<U2"), [0, len(seq)], [nt, ct])
        return lseq

    def valid(self):
        """Validate Protein sequence"""
        out = []
        for i, aa in enumerate(self.seq):
            if aa.lower() not in Protein.aalower:
                err = "Error: %s at postion %d, is not a valid amino acid code" % (
                    aa, i)
                out.append(err)
        if out != []:
            for err in out:
                print(err)
            return False
        return True

    def chargedensity(self):
        """Caculate charge density of sequence"""
        lsequence = self.convert()
        ne = 0.0
        for aa in lsequence[1:-1]:
            if aa in ["R", "K"]:
                ne += 1.0
            elif aa in ["E", "D"]:
                ne += -1.0
        return ne / (len(lsequence) - 2.0)


def usage(prog):
    print("Usage: %s -idp|-amp PROTEINSEQUENCE" % (prog))


if __name__ == "__main__":
    import sys

    # params_silc=[2.44,1.96,0.668,1.5092505712800004,0.9658593000000003,0.0982,0.521,0.00305,0.702]
    #params_idp3 = [2.4279041884730184, 0.2574548665297834, 0.5932307355837573]
    params_idp3 = [2.4285569458914535, 0.2570263325454291, 0.592708804377946]
    #params_all3 = [2.5190839716705775, 0.7585077980716294, 1.028836074588618]
    params_all3 = [2.3395676914539214, 0.6303288268416439, 1.1373651203984052]
    if len(sys.argv) <= 2:
        usage(sys.argv[0])
        sys.exit(1)

    mode = sys.argv[1]
    seq = sys.argv[2]
    pro = Protein(seq)
    if not pro.valid():
        sys.exit(1)
    if mode == "-idp":
        params = Params(params_idp3)
    elif mode == "-amp":
        params = Params(params_all3)
    else:
        usage(sys.argv[0])
        sys.exit(1)

    prd = ReSMAPFunction(pro, params)
    seq, nt, ct = pro.strip()
    print("#AA Prd")
    n = len(seq)
    for i in range(0, n):
        print(seq[i], "%10.2f" % (prd[i]))
