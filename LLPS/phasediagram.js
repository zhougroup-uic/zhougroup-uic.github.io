"use strict"

class PhaseDiagram{
  constructor(){
    //console.log("PhaseDiagram loaded");
    this.setup();
  }

  setup(){
    this.xylh=null;
    this.nist_data=null;
    this.bino_data=null;
    this.spino_data=null;
    this.nist_data=this.read("data_entry_dia_nist");
    this.bino_data=this.read("data_entry_dia_bino");
    this.spino_data=this.read("data_entry_dia_spino");
    this.show_nist=true;
    this.show_spino=true;
    //console.log(this.xylh);
    //console.log(this.nist_data);
    //console.log(this.bino_data);
    //console.log(this.spino_data);
  }
  
  update(){
    this.nist_data=this.read("data_entry_dia_nist");
    this.bino_data=this.read("data_entry_dia_bino");
    this.spino_data=this.read("data_entry_dia_spino");
  }
  
  id(s) {
    return document.getElementById(s);
  }
    
  read(s){
    var sd=this.id(s).value;
    var xl,xh,yl,yh;
    if (this.xylh==null){
      [xl,xh,yl,yh]=[1e30,-1e30,1e30,-1e30];
    }else{
      [xl,xh,yl,yh]=this.xylh;
    }
    var strings = sd.match(/([0-9\.e+-]+)/gim,"$1");
    var xy_data = new Array();
    if(strings != null && strings.length > 0) {
      var array = [];
      for(var i in strings) {
        var s = strings[i];
        // only if the string contains at least one numerical digit
        if(s.match(/.*[0-9].*/)) {
          array.push(parseFloat(strings[i]));
        }
      }
      var len = array.length;
      if(len % 3 != 0) {
        this.show_graph_error("Unpaired data (x count != y count).");
        return false;
      }else {
        for(var i = 0;i < len;i += 3) {
          var y = parseFloat(array[i]);
          var x0 = parseFloat(array[i+1]);
	  var x1 = parseFloat(array[i+2]);
          xl = Math.min(x0,xl);
          xh = Math.max(x1,xh);
          yl = Math.min(yl,y);
          yh = Math.max(yh,y);
          xy_data.push(new Pair(x0,y));
	  xy_data.push(new Pair(x1,y));
        }
      }
    }
    this.xylh=[xl,xh,yl,yh];
    return xy_data;
  }  
}
