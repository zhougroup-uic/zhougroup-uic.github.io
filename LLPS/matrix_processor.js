/***************************************************************************
 *   Copyright (C) 2019 by Paul Lutus                                      *
 *   lutusp@arachnoid.com                                                  *
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program; if not, write to the                         *
 *   Free Software Foundation, Inc.,                                       *
 *   59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.             *
 ***************************************************************************/
 
 "use strict"

// Gauss-Jordan matrix manipulation functions

class GJ {
  
  divide(A,  i,  j,  m) {
    for (var q = j + 1; q < m; q++) {
      A[i][q] /= A[i][j];
    }
    A[i][j] = 1;
  }
  
  eliminate(A, i, j, n, m) {
    for (var k = 0; k < n; k++) {
      if (k != i && A[k][j] != 0) {
        for (var q = j + 1; q < m; q++) {
          A[k][q] -= A[k][j] * A[i][q];
        }
        A[k][j] = 0;
      }
    }
  }
  
  echelonize(mat) {
    var n = mat.length;
    var m = mat[0].length;
    var i = 0;
    var j = 0;
    var k;
    var swap;
    while (i < n && j < m) {
      //look for non-zero entries in col j at or below row i
      k = i;
      while (k < n && mat[k][j] == 0) {
        k++;
      }
      // if an entry is found at row k
      if (k < n) {
        //  if k is not i, then swap row i with row k
        if (k != i) {
          swap = mat[i];
          mat[i] = mat[k];
          mat[k] = swap;
        }
        // if A[i][j] is != 1, divide row i by A[i][j]
        if (mat[i][j] != 1) {
          this.divide(mat, i, j, m);
        }
        // eliminate all other non-zero entries
        this.eliminate(mat, i, j, n, m);
        i++;
      }
      j++;
    }
    // extract result column
    var terms = Array();
    for (var i in mat) {
      terms[i] = mat[i][n];
    }
    return terms;
  }
}

// a simple data class

class Pair {
  constructor(x = 0,y = 0) {
    this.x = x;
    this.y = y;
  }
  toString() {
    return x + ',' + y;
  }
}


// matrix functions

class MatFunctions {
  
  constructor() {
    // create required GJ instance
    this.gj = new GJ();
  }
  
  // a weak substitue for printf()
  
  number_format(n,p,w) {
    var s = n.toExponential(p);
    while(s.length < w) {
      s = ' ' + s;
    }
    return s;
  }
  
  // produce a single y result for a given x
  
  regress(x, terms) {
    var y = 0;
    var exp = x;
    for (var i in terms) {
      y += terms[i] * exp;
      exp *= x;
    }
    return y;
  }

  regress_deriv(x, terms) {
    var y = 0;
    var exp = 1.0;
    for (var i in terms) {
      //console.log("i"+i);
      y += terms[i] * exp * (parseInt(i)+1);
      exp *= x;
    }
    return y;
  }
  
  // compute correlation coefficient
  
  corr_coeff(data, terms) {
    var n = data.length;
    var sx = 0, sx2 = 0, sy = 0, sy2 = 0, sxy = 0;
    var x, y;
    for (var i in data) {
      var pr = data[i];
      x = this.regress(pr.x, terms);
      y = pr.y;
      sx += x;
      sy += y;
      sxy += x * y;
      sx2 += x * x;
      sy2 += y * y;
    }
    var div = Math.sqrt((sx2 - (sx * sx) / n) * (sy2 - (sy * sy) / n));
    if (div != 0) {
      return Math.pow((sxy - (sx * sy) / n) / div, 2);
    }
    return 0;
  }
  
  // compute standard error
  
  std_error(data, terms) {
    var  n = data.length;
    if (n > 2) {
      var a = 0;
      var q;
      for (var i in data) {
        var pr = data[i];
        q = this.regress(pr.x, terms) - pr.y
        a += q * q
      }
      return Math.sqrt(a / (n - 2));
    }
    return 0;
  }
  
  
  // create regression coefficients
  // for provided data set
  // data = Pair array
  // p = polynomial degree
  
  compute_coefficients(data,  p) {
    var n = data.length;
    var r, c;
    var rs = 2 * p ;
    //
    // by request: read each datum only once
    // not the most efficient processing method
    // but required if the data set is huge
    //
    // create square matrix with added RH column
    var m = Array();
    for (var i = 0; i < p; i++) {
      var mm = Array();
      for (var j = 0; j <= p; j++) {
        mm[j] = 0;
      }
      m[i] = mm;
    }
    //double[][] m = new double[p][p + 1];
    // create array of precalculated matrix data
    var mpc = Array();
    for(var i = 0;i < rs;i++) {
      mpc[i] = 0;
    }

    for (var i in data) {
      var pr = data[i];
      // process precalculation array
      var x = pr.x;
      var t = x;
      for (r = 0; r < rs; r++) {
        mpc[r] += x;
        x *= t;
      }
      // process RH column cells
      m[0][p] += pr.y;
      var x = pr.x;
      var t = x;
      for (r = 1; r < p; r++) {
        m[r][p] += x * pr.y;
        x *= t;
      }
    }
    //console.log(mpc);
    // populate square matrix section
    for (r = 0; r < p; r++) {
      for (c = 0; c < p; c++) {
        m[r][c] = mpc[r + c];
      }
    }
    //console.log(m);
    // reduce matrix, return terms
    return this.gj.echelonize(m);
  }
  
  // test the system using known data
  
  test() {
    var xd = [-1,0,1,2,3,5,7,9];
    var yd = [-1,3,2.5,5,4,2,5,4];
    
    var data = Array();
    
    for(var i in xd) {
      data[i] = new Pair(xd[i],yd[i]);
    }
    
    var terms = this.compute_coefficients(data,4);
    
    var prec = 16;
    
    var width = 24;
    
    for(var i in terms) {
      console.log(this.number_format(terms[i],prec,width) + ' * x^' + i);
    }
    
    var cc = this.corr_coeff(data,terms);
    
    console.log('cc = ' + this.number_format(cc,prec,width));
    
    var se = this.std_error(data,terms);
    
    console.log('se = ' + this.number_format(se,prec,width));
  }
    
  // "data" is an array of Pair(x,y) data
  // p = polynomial degree
  
  process_data(data,p) {
    //this.test();
    var terms = this.compute_coefficients(data,p);
    var cc = this.corr_coeff(data,terms);
    var se = this.std_error(data,terms);
    return [terms,cc,se];
  }
}
