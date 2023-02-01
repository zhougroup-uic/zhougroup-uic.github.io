/***************************************************************************
 *   Copyright (C) 2019, Paul Lutus                                        *
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

function addEvent(o,e,f) {
  if (o.addEventListener) {
    o.addEventListener(e,f,false);
    return true;
  }
  else if (o.attachEvent) {
    return o.attachEvent("on"+e,f);
  }
  else {
    return false;
  }
}

class GraphDim {
  constructor(xl,xh,yl,yh) {
    this.xl = xl;
    this.xh = xh;
    this.yl = yl;
    this.yh = yh;
  }
  toString() {
    return this.xl + "," + this.xh + "," + this.yl + "," + this.yh;
  }
}

class AxisData {
  constructor(min,max,steps,label,nums) {
    this.exp_ratio = 0.1;
    this.min = min;
    this.max = max;
    this.minlimit = min * 8;
    this.maxlimit = max * 8;
    this.exp = (max-min) * this.exp_ratio;
    this.gmin = this.min - this.exp;
    this.gmax = this.max + this.exp;
    this.steps = steps;
    this.increm = (max-min)/steps;
    this.label = label;
    this.nums = nums;
  }
  toString() {
    return this.min + "," + this.max + "," + this.steps + "," + this.increm + "," + this.label + "," + this.nums;
  }
}

// polynomial processing class

class PolySolve {
  
  constructor() {
    this.setup();
    //this.read_cookie();
  }
  
  setup() {
    this.setup_function_strings();
    this.matf = new MatFunctions();
    this.phdg = new PhaseDiagram(); 
    this.output_form = 0;
    this.default_font_size = "80%";
    this.left_margin = 8;
    this.right_margin = 8;
    this.top_margin = 8;
    this.bottom_margin = 32;
    this.x_axis_data = null;
    this.y_axis_data = null;
    this.text_color = "rgb(0,0,0)";
    this.grid_color = "rgb(236,236,236)";
    this.plot_color = "rgb(0,0,255)";
    this.point_color = "rgb(255,0,0)";
    this.point2_color = "rgb(0,255,0)";
    this.point3_color = "rgb(0,0,0)";
    this.explore_color = "rgb(128,0,128)";
    this.mousedown = false;
    
    // Explanation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    
    document.onmousedown = this.mouse_down.bind(this);
    document.onmouseup = this.mouse_up.bind(this);
    document.onmousemove = this.mouse_move.bind(this);
    
    this.poly_terms = null;
    this.xy_data = null;
    this.roots_data = null;
    this.spinodals = null;
    
    this.poly_degree = 5;
    
    this.plot_steps = 500;
    
    this.reverse_xy = false;
    
    this.form_labels = ['simple list (ordered x^1 to x^n)','mathematical function','C function','C++ function','Java Function','JavaScript function','Python function'];
    
    this.canvas = this.id("graphicPane1");
    this.canvas_ctx = this.canvas.getContext("2d");
    this.canvas2 = this.id("graphicPane2");
    this.canvas2_ctx = this.canvas2.getContext("2d");
    this.canvas3 = this.id("graphicPane3");
    this.canvas3_ctx = this.canvas3.getContext("2d");
    this.text_div = this.id("textPane1");
    this.text_div2 = this.id("textPane3");
    this.text_div3 = this.id("textPane5");
    this.table_data = this.id("table_results_area");
    this.chart_wrapper = this.id("chart_wrapper");
    this.chart_wrapper2 = this.id("chart_wrapper2");
    this.chart_wrapper3 = this.id("chart_wrapper3");
    this.control_panel = this.id("control_panel");
    this.control_panel2 = this.id("control_panel2");
    this.control_panel3 = this.id("control_panel3");
    this.data_entry = this.id('data_entry');
    this.reverse_checkbox = this.id("reverse_checkbox");
    this.x3_axis_data = new AxisData(this.phdg.xylh[0],this.phdg.xylh[1],10,'x',true);
    this.y3_axis_data = new AxisData(this.phdg.xylh[2],this.phdg.xylh[3],8,'y',true);
    this.resize_graph();
    this.set_title_strings();
    this.adjust_degree();
  }
  
  reset_all() {
    if(confirm("Polysolve: okay to reset all entries/values to defaults?")) {
      this.data_entry.value ="0.058594 -1.49784\n0.117188 -2.82125\n0.175781 -3.60747\n0.234375 -4.08\n0.292969 -4.76423\n0.351562 -5.07318\n0.410156 -5.31277\n0.468750 -5.48594\n0.527344 -5.97833\n0.585938 -6.36961\n0.644531 -6.83577\n0.703125 -7.46792\n0.761719 -7.26286\n0.820312 -6.23518\n0.878906 -4.40366";
      this.reverse_xy = false;
      this.reverse_checkbox.checked = this.reverse_xy;
      this.table_data.value = "";
      this.setup();
    }
  }
  
  // All that typing!
  id(s) {
    return document.getElementById(s);
  }
  
  float_id(s) {
    return parseFloat(this.id(s).value);
  }
  
  set_wh(obj,w,h) {
    obj.style.width = w + "px";
    obj.style.height = h + "px";
  }

  get_exchempot(x) {
  	return this.matf.regress(x,this.poly_terms);
  }
 
  get_exchempot_obj(obj,x) {
	return obj.matf.regress(x,obj.poly_terms);
  }

  get_chempot(x) {
  	return this.matf.regress(x,this.poly_terms)+Math.log(x);
  }

  get_chempot_obj(obj, x) {
        return obj.matf.regress(x,obj.poly_terms)+Math.log(x);
  }
  
  get_chempot_deriv(x) {
	return this.matf.regress_deriv(x,this.poly_terms)+1.0/x;
  }
  
  newtonRaphson(guess, increment, iteration, eps, rval) {
    let rootFound = false;

    for (let i = 0; i < iteration + 1; i++) {
        let fPrime = ((this.get_chempot(guess + increment / 2)-rval) - (this.get_chempot(guess - increment / 2)-rval)) / increment;
        guess += -(this.get_chempot(guess)-rval) / fPrime;
        if (Math.abs((this.get_chempot(guess)-rval)) <= eps) {
            rootFound = true;
            break;
        }
    }

    if (rootFound) {
        return guess;
    } else {
        return false;
    }
  }

  newtonRaphson_deriv(guess, increment, iteration, eps){
   let rootFound = false;

    for (let i = 0; i < iteration + 1; i++) {
        let fPrime = (this.get_chempot_deriv(guess + increment / 2) - this.get_chempot_deriv(guess - increment / 2)) / increment;
        guess += -this.get_chempot_deriv(guess) / fPrime;
        if (Math.abs(this.get_chempot_deriv(guess)) <= eps) {
            rootFound = true;
            break;
        }
    }

    if (rootFound) {
        return guess;
    } else {
        return false;
    }
  }

  newtonRaphsonArea(guess, increment, iteration, eps) {
    let rootFound = false;

    for (let i = 0; i < iteration + 1; i++) {
        let fPrime = (this.calc_areas(guess + increment / 2) - this.calc_areas(guess - increment / 2)) / increment;
        guess += -this.calc_areas(guess) / fPrime;
        if (Math.abs(this.calc_areas(guess)) <= eps) {
            rootFound = true;
            break;
        }
    }

    if (rootFound) {
        return guess;
    } else {
        return false;
    }
  }
  
  set_roots(rval){
    this.roots_data = new Array();
    this.roots_data.push(new Pair(0.012,rval));
    this.roots_data.push(new Pair(0.35,rval));
    this.roots_data.push(new Pair(0.76,rval));
    let rt0=this.newtonRaphson(0.001,0.00001,10000,1e-6,rval);
    //console.log(rt0);
    if (rt0!=false){
	this.roots_data[0].x=rt0;
    }
    let rt2=this.newtonRaphson(0.8,0.0001,1000,1e-6,rval);
    if (rt2!=false){
        this.roots_data[2].x=rt2;
    }
    let rt1=this.newtonRaphson((rt0+rt2)/2.0,0.0001,1000,1e-6,rval);
    if (rt1!=false){
        this.roots_data[1].x=rt1;
    }
  }

  set_spinodal(){
    this.spinodals_data=new Array();
    let sp0=this.newtonRaphson_deriv(0.01,0.0001,1000,1e-6);
    let sp0y=this.get_chempot(sp0);
    //console.log(sp0,sp0y);
    let sp1=this.newtonRaphson_deriv(0.8,0.0001,1000,1e-6);
    let sp1y=this.get_chempot(sp1);
    //console.log(sp0,sp0y);
    this.spinodals_data.push(new Pair(sp0,sp0y));
    this.spinodals_data.push(new Pair(sp1,sp1y));
    //console.log(this.spinodals_data);
  }
  
  calc_area(rval,start,end,nsteps){
    let dx=(end-start)/nsteps;
    let area=0.0;
    for (let i=0;i<nsteps;i++){
	let dy=((this.get_chempot(start+i*dx)+this.get_chempot(start+(i+1)*dx))/2.0-rval);
	area+=dy*dx;
   }
   return area;
   }
  
  calc_areas(rval){
    let nsteps=500;
    this.set_roots(rval);
    let rt0=this.roots_data[0].x;
    let rt1=this.roots_data[1].x;
    let rt2=this.roots_data[2].x;
    let arealeft=this.calc_area(rval,rt0,rt1,nsteps);
    let arearight=this.calc_area(rval,rt1,rt2,nsteps);
    //console.log(arealeft);
    //console.log(arearight);
    return arealeft+arearight;
  }
  
  find_coexist(start){
	let tgt=this.newtonRaphsonArea(start,0.0001,10000,1e-5)
	if (tgt != false){
		this.coexist=tgt;
	}
  }
  
  show_coexist(){
    if (this.roots_data!=null){
      var result="Binodal: density of dilute phase "+this.roots_data[0].x.toFixed(6)+ "; density of dense phase "+this.roots_data[2].x.toFixed(6)+ "; chemical potential at coexistence "+ this.coexist.toFixed(6)
      this.id("eq_coexist").textContent = result;
    }
    if (this.spinodals_data!=null){
      var result="Spinodal: density of dilute phase "+this.spinodals_data[0].x.toFixed(6)+ "; density of dense phase "+this.spinodals_data[1].x.toFixed(6)
      this.id("eq_spinodal").textContent = result;
    }
  }  
  
  resize_graph() {
    this.chart_width = 860;
    this.chart_height = 500;
    this.set_wh(this.chart_wrapper,this.chart_width,this.chart_height);
    this.set_wh(this.canvas,this.chart_width,this.chart_height);
    this.canvas.width = this.chart_width;
    this.canvas.height = this.chart_height;
    this.set_wh(this.text_div,this.chart_width,this.chart_height);
  
    this.set_wh(this.chart_wrapper2,this.chart_width,this.chart_height);
    this.set_wh(this.canvas2,this.chart_width,this.chart_height);
    this.canvas2.width = this.chart_width;
    this.canvas2.height = this.chart_height;

    this.set_wh(this.chart_wrapper3,this.chart_width,this.chart_height);
    this.set_wh(this.canvas3,this.chart_width,this.chart_height);
    this.canvas3.width = this.chart_width;
    this.canvas3.height = this.chart_height;
  }
  
  resize_plot() {
    this.resize_graph();
    this.plot_graph();
  }
  
  set_title_strings() {
    var array = document.getElementsByTagName("input");
    for(var i in array) {
      var ob = array[i];
      var class_name = ob.className;
      var ident = ob.id;
      if ((class_name && class_name.match(/input_field/i))
        && ! (ident.match(/equation/i))
        // && ! (ident.match(/chart(Width|Height)/i))
        ) {
        ob.title = "Change value with mouse wheel.";
      }
    }
  }
  
  
  hide_show_divs(array,show) {
    for(var i in array) {
      div = this.id(array[i]);
      div.className = (show)?"visible_class":"hidden_class";
    }
  }
  
  open_edit_div() {
    var target = id("edit_div");
    target.className = "edit_div"; // from "hidden_class"
  }
  
  open_comment_list() {
    this.hide_show_divs(["comment_wrapper"],true);
  }
  
  close_comment_list() {
    this.hide_show_divs(["comment_wrapper"],false)
  }
  
  decode_example(s) {
    var data = "";
    eval("data = example_" + s);
    this.decode_piped_list(data);
  }
  
  launch_example(s) {
    this.decode_example(s);
    this.plot_graph();
    window.location.href = "#x_scrolldown";
  }
  
  reset_normal() {
    window.location.href = this.bare_url(window.location.href);
  }
  
  decode_queries() {
    result = [];
    var path = window.location.href;
    var args = path.replace(/^(.*?)(\?|$)(.*)/,"$3");
    args = this.strip_whitespace(args);
    if(args.length > 0) {
      var array = args.split("&");
      for(var i in array) {
        var pair = array[i].split("=");
        if(pair.length == 2) {
          result[strip_whitespace(pair[0])] = strip_whitespace(pair[1]);
        }
      }
    }
    return result;
  }
  
  mouse_handler(event) {
    var target;
    if(this.mousedown) {
      if(!event) {
        event = window.event;
      }
      if(event.target) {
        target = event.target;
      }
      else if (event.srcElement) {
        target = event.srcElement;
      }
      if (target.nodeType == 3) { // defeat Safari bug
        target = target.parentNode;
      }
      // When the canvas emulator is in use,
      // the lines on the graph are not normal HTML
      // objects. They belong to G_vml_.
      // So:
      if(target.id == "textPane1" ||
        target.id == "graphicPane1" ||
        target.id == "text_span" ||
        target.scopeName == "g_vml_") {
        // draw a crosshair and values
        var xpos = (event.layerX)?event.layerX:event.x;
        this.draw_mouse_query(xpos);
        return false;
      }
       if(target.id == "textPane3" ||
        target.id == "graphicPane2" ||
        target.id == "text_span" ||
        target.scopeName == "g_vml_") {
        // draw a crosshair and values
        var xpos = (event.layerX)?event.layerX:event.x;
        this.draw_mouse_query2(xpos);
        return false;
      }
    }
    return true;
  }
  
  mouse_down(event) {
    this.mousedown = true;
    return this.mouse_handler(event);
  }
  
  mouse_move(event) {
    if(this.mousedown) {
      this.plot_graph();
      return this.mouse_handler(event);
    }
  }
  
  mouse_up() {
    this.mousedown = false;
    this.plot_graph();
    return false;
  }
  
  draw_line(ctx,x1,y1,x2,y2) {
    try {
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
    }
    catch(err) {
      this.error_flag = true;
    }
  }
  
  // interpolate x from xa,xb -> ya,yb
  
  ntrp(x,xa,xb,ya,yb) {
    var q = xb-xa;
    if(q == 0) return 0;
    return (x-xa) * (yb-ya)/q + ya;
  }
  
  plot_grid_ctx(ctx,x_axis_data,y_axis_data,graph_dims){
    ctx.beginPath();
    var px,py;
    var ox = null;
    var oy = null;
    ctx.strokeStyle = this.grid_color;
    for (var x = 0;x <= x_axis_data.steps; x++) {
      px = this.ntrp(x,0,x_axis_data.steps,graph_dims.xl,graph_dims.xh);
      px = parseInt(px) + 0.5;
      this.draw_line(ctx,px,graph_dims.yl,px,graph_dims.yh);
    }
    for (var y = 0;y <= y_axis_data.steps; y++) {
      py = this.ntrp(y,0,y_axis_data.steps,graph_dims.yl,graph_dims.yh);
      py = parseInt(py) + 0.5;
      this.draw_line(ctx,graph_dims.xl,py,graph_dims.xh,py);
    }
    ctx.stroke();
  }

  plot_grid() {
    this.plot_grid_ctx(this.canvas_ctx,this.x_axis_data,this.y_axis_data,this.graph_dims);
  }

  plot_grid2() {
    this.plot_grid_ctx(this.canvas2_ctx,this.x2_axis_data,this.y2_axis_data,this.graph2_dims);
  }

  plot_grid3() {
    this.plot_grid_ctx(this.canvas3_ctx,this.x3_axis_data,this.y3_axis_data,this.graph3_dims);
  }
 
  plot_points_ctx(ctx,xy_data,color,x_axis_data,y_axis_data,graph_dims,rad=3,fill=true,width=1){
    var fc = Math.PI * 2;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    var pr,px,py;
    for(var i in xy_data){
      pr = xy_data[i];
      px = this.ntrp(pr.x,x_axis_data.gmin,x_axis_data.gmax,graph_dims.xl,graph_dims.xh);
      py = this.ntrp(pr.y,y_axis_data.gmin,y_axis_data.gmax,graph_dims.yh,graph_dims.yl);
      ctx.beginPath();
      ctx.arc(px,py,rad,0,fc);
      if (fill){
      	ctx.fill();
      }
      ctx.stroke();
    }
  }
   
  plot_points() {
    this.plot_points_ctx(this.canvas_ctx,this.xy_data,this.point2_color,
                         this.x_axis_data,this.y_axis_data,this.graph_dims);
  }

  plot_points2() {
    this.plot_points_ctx(this.canvas2_ctx,this.spinodals_data,this.plot_color,
                         this.x2_axis_data,this.y2_axis_data,this.graph2_dims);
    this.plot_points_ctx(this.canvas2_ctx,this.roots_data,this.point_color,
                         this.x2_axis_data,this.y2_axis_data,this.graph2_dims,3,false,2);
    this.canvas2_ctx.beginPath();
    this.canvas2_ctx.lineWidth = 1;
    var pr,px,py;
    this.canvas2_ctx.strokeStyle = this.point3_color;
    this.canvas2_ctx.fillStyle = this.point3_color;
    py = this.ntrp(this.coexist,this.y2_axis_data.gmin,this.y2_axis_data.gmax,this.graph2_dims.yh,this.graph2_dims.yl);
    px = this.ntrp(this.x2_axis_data.gmin,this.x2_axis_data.gmin,this.x2_axis_data.gmax,this.graph2_dims.xl,this.graph2_dims.xh);
    this.canvas2_ctx.moveTo(px,py);
    px = this.ntrp(this.x2_axis_data.gmax,this.x2_axis_data.gmin,this.x2_axis_data.gmax,this.graph2_dims.xl,this.graph2_dims.xh);
    this.canvas2_ctx.lineTo(px,py);
    this.canvas2_ctx.stroke();
    this.canvas2_ctx.closePath();
  }
  
  reset_hide(){
    var x="checkbox_show_nist"
    this.id(x).checked=true;
    var x="checkbox_show_spino"
    this.id(x).checked=true;
    this.update_hide();
  }
   
  update_hide(){
    var x="checkbox_show_nist"
    if (this.id(x).checked){
      this.phdg.show_nist=true;
    }else{
      this.phdg.show_nist=false;
    }
    var x="checkbox_show_spino"
    if (this.id(x).checked){
      this.phdg.show_spino=true;
    }else{
      this.phdg.show_spino=false;
    }
    this.phdg.update();
    this.update_graph3();
  }

  plot_points3() {
    if (this.phdg.show_nist){
      this.plot_points_ctx(this.canvas3_ctx,this.phdg.nist_data,this.point3_color,
                           this.x3_axis_data,this.y3_axis_data,this.graph3_dims,6,false);
    }
    this.plot_points_ctx(this.canvas3_ctx,this.phdg.bino_data,this.point_color,
                         this.x3_axis_data,this.y3_axis_data,this.graph3_dims,3,false,2);
    if (this.phdg.show_spino){
      this.plot_points_ctx(this.canvas3_ctx,this.phdg.spino_data,this.plot_color,
                           this.x3_axis_data,this.y3_axis_data,this.graph3_dims);
    }
  }
   
  
  plot_function_ctx(ctx,func,x_axis_data,y_axis_data,graph_dims){
    ctx.beginPath();
    ctx.strokeStyle = this.plot_color;
    var ax,px;
    var y,py;
    var steps = 500;
    for(var x = 0;x <= steps;x++) {
      ax = this.ntrp(x,0,steps,x_axis_data.min,x_axis_data.max);
      px = this.ntrp(ax,x_axis_data.gmin,x_axis_data.gmax,graph_dims.xl,graph_dims.xh);
      y = func(this,ax);
      py = this.ntrp(y,y_axis_data.gmin,y_axis_data.gmax,graph_dims.yh,graph_dims.yl);
      if (y<y_axis_data.gmin || y>y_axis_data.gmax) continue;
      try {
        if(x == 0) {
          ctx.moveTo(px,py);
        }
        else {
          ctx.lineTo(px,py);
        }
      }
      catch(err) {
        this.error_flag = true;
      }
    }
    ctx.stroke();
  } 
  
  plot_function() {
    this.plot_function_ctx(this.canvas_ctx,this.get_exchempot_obj,this.x_axis_data,this.y_axis_data,this.graph_dims);
  }

  plot_function2() {
    this.plot_function_ctx(this.canvas2_ctx,this.get_chempot_obj,this.x2_axis_data,this.y2_axis_data,this.graph2_dims);
  }
  
  clearChildren(obj)
  {
    try {
      if(obj.hasChildNodes() && obj.childNodes) {
        while(obj.firstChild) {
          obj.removeChild(obj.firstChild);
        }
      }
    }
    catch(e) {
    }
  }
  
  create_text_span(s,ps) {
    var tsp = document.createElement('span');
    tsp.id = "text_span";
    var ts = tsp.style;
    ts.fontSize = ps;
    ts.whiteSpace = "nowrap";
    ts.fontFamily = "monospace";
    var tn = document.createTextNode(s);
    tsp.appendChild(tn);
    return tsp;
  }
  
  create_index_span(parent,str,x,y,max,align,ps) {
    var tsp = this.create_text_span(str,ps);
    parent.appendChild(tsp);
    var ts = tsp.style;
    ts.position = "absolute";
    ts.textAlign = align;
    ts.width = (max*8) + "px"
    ts.left = x + "px";
    ts.top = y + "px";
  }

  gen_y_index_ctx(ctx,y_axis_data,graph_dims){
    var text_delta = 12;
    var maxw = y_axis_data.label.length;
    var w;
    var array = [];
    for(var i = 0;i <= y_axis_data.steps;i++) {
      var y = this.ntrp(i,0,y_axis_data.steps,y_axis_data.gmin,y_axis_data.gmax);
      //for(var y = y_axis_data.gmin;y <= y_axis_data.gmax;y += y_axis_data.increm) {
      var py = this.ntrp(i,0,y_axis_data.steps,graph_dims.yh,graph_dims.yl);
      var sy = y.toFixed(2);
      array.push(sy + "\t" + py);
      var w = ("" + sy).length;
      maxw = (w > maxw)?w:maxw;
    }
    // create y axis label
    ctx.fillText(y_axis_data.label,32,graph_dims.yl-text_delta);
    var pair;
    // create Y axis index
    for(i in array) {
      var pair = array[i].split("\t");
      ctx.fillText(pair[0],16,parseInt(pair[1])+4);
    }
    graph_dims.xl += (maxw * 8);
  }
 
  gen_y_index(obj) {
    this.gen_y_index_ctx(this.canvas_ctx,this.y_axis_data,this.graph_dims);
  }
 
  gen_y2_index(obj) {
    this.gen_y_index_ctx(this.canvas2_ctx,this.y2_axis_data,this.graph2_dims);
  }

  gen_y3_index(obj) {
    this.gen_y_index_ctx(this.canvas3_ctx,this.y3_axis_data,this.graph3_dims);
  }
 
  gen_x_index_ctx(ctx,x_axis_data,graph_dims) {
    ctx.strokeStyle = this.text_color;
    var deltax = 0;
    var maxw = x_axis_data.label.length;
    var text_delta = 16;
    var w;
    var array = [];
    for(var x = 0;x <= x_axis_data.steps;x++) {
      var px = this.ntrp(x,0,x_axis_data.steps,x_axis_data.gmin,x_axis_data.gmax);
      var sx = px.toFixed(2);
      array.push(sx + "\t" + px);
      w = ("" + sx).length;
      maxw = (w > maxw)?w:maxw;
    }
    var len = x_axis_data.label.length;
    var maxx = (maxw > len)?len:maxw;
    graph_dims.xh -= maxx * 8;
    // create x axis index
    for(var i in array) {
      var pair = array[i].split("\t");
      var px = this.ntrp(pair[1],x_axis_data.gmin,x_axis_data.gmax,graph_dims.xl,graph_dims.xh);
      ctx.fillText(pair[0],px-maxw*4,graph_dims.yh+text_delta);
    }
    // create x axis label
    ctx.fillText(x_axis_data.label,graph_dims.xh+24,graph_dims.yh+text_delta); 
  }
  
  gen_x_index(obj) {
    this.gen_x_index_ctx(this.canvas_ctx,this.x_axis_data,this.graph_dims);
  }
 
  gen_x2_index(obj) {
    this.gen_x_index_ctx(this.canvas2_ctx,this.x2_axis_data,this.graph2_dims);
  }
 
  gen_x3_index(obj) {
    this.gen_x_index_ctx(this.canvas3_ctx,this.x3_axis_data,this.graph3_dims);
  }

  graph_indices() {
    this.canvas_ctx.font = "13px Monospace";
    this.canvas_ctx.fillStyle = this.text_color;
    //if(this.text_div != null) {
    if(this.y_axis_data.nums) {
      this.gen_y_index(this.text_div);
    } // x axis index
    if(this.chart_title.length > 0) {
      var title = this.chart_title;//.replace(/\?/,plot_function_2d);
      var center = (this.graph_dims.xl + this.graph_dims.xh-(title.length*10))/2;
      //this.create_index_span(this.text_div,title,center,4,title.length,"center","100%");
      this.canvas_ctx.fillText(title,center,16);
    }
    if(this.x_axis_data.nums) {
      this.gen_x_index(this.text_div);
    } // y axis index
    //} // text_div != null
  } // graph_title()

  graph2_indices() {
    this.canvas2_ctx.font = "13px Monospace";
    this.canvas2_ctx.fillStyle = this.text_color;
    //if(this.text_div != null) {
    if(this.y2_axis_data.nums) {
      this.gen_y2_index(this.text_div);
    } // x axis index
    if(this.chart_title.length > 0) {
      var title = this.chart2_title;//.replace(/\?/,plot_function_2d);
      var center = (this.graph2_dims.xl + this.graph2_dims.xh-(title.length*10))/2;
      //this.create_index_span(this.text_div,title,center,4,title.length,"center","100%");
      this.canvas2_ctx.fillText(title,center,16);
    }
    if(this.x2_axis_data.nums) {
      this.gen_x2_index(this.text_div);
    } // y axis index
    //} // text_div != null
  } 

  graph3_indices() {
    this.canvas3_ctx.font = "13px Monospace";
    this.canvas3_ctx.fillStyle = this.text_color;
    //if(this.text_div != null) {
    if(this.y3_axis_data.nums) {
      this.gen_y3_index(this.text_div);
    } // x axis index
    if(this.chart_title.length > 0) {
      var title = this.chart3_title;//.replace(/\?/,plot_function_2d);
      var center = (this.graph3_dims.xl + this.graph3_dims.xh-(title.length*10))/2;
      //this.create_index_span(this.text_div,title,center,4,title.length,"center","100%");
      this.canvas3_ctx.fillText(title,center,16);
    }
    if(this.x3_axis_data.nums) {
      this.gen_x3_index(this.text_div);
    } // y axis index
    //} // text_div != null
  } 
  
  get_dimensions(canvas,x_axis_data,y_axis_data) {
    var bottom = canvas.height - this.bottom_margin;
    var left = this.left_margin + ((x_axis_data.nums)?16:0);
    var right = this.canvas.width - this.right_margin - ((x_axis_data.nums)?16:0);
    var top = this.top_margin + ((this.chart_title.length > 0 || y_axis_data.nums)?20:0);
    return (new GraphDim(left,right,top,bottom));
  } 
 
  set_dimensions() {
    this.graph_dims = this.get_dimensions(this.canvas,this.x_axis_data,this.y_axis_data);
  }
  
  set_dimensions2() {
    this.graph2_dims = this.get_dimensions(this.canvas2,this.x2_axis_data,this.y2_axis_data);
  }
 
  set_dimensions3() {
    this.graph3_dims = this.get_dimensions(this.canvas3,this.x3_axis_data,this.y3_axis_data);
  }
  
  update_axis_data() {
    this.chart_title = "";
    if(this.xy_data != null) {
      this.chart_title = "Polynomial degree " + this.poly_degree + " with " + this.xy_data.length + " data points.";
    }
    this.chart2_title = "Maxwell Construction";
    this.chart3_title = "Phase Diagram";
  }
  
  valid_test() {
    return (this.xy_data != null);
  }
  
  plot_graph() {
    if (!this.valid_test()) {
      return false;
    }
    this.clearChildren(this.text_div);
    this.canvas_ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.update_axis_data();
    if((this.x_axis_data.max > this.x_axis_data.min) &&
      (this.y_axis_data.max > this.y_axis_data.min) &&
      this.x_axis_data.increm > 0 &&
      this.y_axis_data.increm > 0 &&
      this.plot_steps > 0) {
      this.error_flag = false;
      this.set_dimensions();
      this.graph_indices();
      if(!this.error_flag) {
        this.canvas_ctx.globalAlpha = 1;
        this.canvas_ctx.lineWidth = "" + this.linewidth;
        this.canvas_ctx.lineCap = "round";
        this.plot_grid();
        this.plot_points();
        this.plot_function();
      }
    }
    else { // range error
      this.show_graph_error("Numerical range");
    }
    this.update_graph2()
    this.show_results();
    this.update_graph3()
    return true;
  }
  
  reset_graph2(){
    this.id("input_coexist").value=-6.2;
    this.id("input_yspan").value=2.0;
    this.update_graph2();
  }
  
  update_graph2(clac=true){  
    this.clearChildren(this.text_div2);
    this.canvas2_ctx.clearRect(0, 0, this.canvas2.width, this.canvas2.height);
    this.coexist=parseFloat(this.id("input_coexist").value);
    this.yspan=parseFloat(this.id("input_yspan").value);
    this.y2_axis_data = new AxisData(this.coexist-this.yspan,this.coexist+this.yspan,8,'y',true);
    if((this.x2_axis_data.max > this.x2_axis_data.min) &&
      (this.y2_axis_data.max > this.y2_axis_data.min) &&
      this.x2_axis_data.increm > 0 &&
      this.y2_axis_data.increm > 0 &&
      this.plot_steps > 0) {
      this.error_flag = false;
      this.set_dimensions2();
      this.graph2_indices();
      if(!this.error_flag) {
	this.canvas2_ctx.globalAlpha = 1;
	this.canvas2_ctx.lineWidth = "" + this.linewidth;
	this.canvas2_ctx.lineCap = "round";
	this.plot_grid2();
	this.plot_function2();
	//console.log(this.roots_data);
	//this.set_roots(this.coexist);
	//console.log(this.roots_data);
	if (clac){
		this.find_coexist(this.coexist);
	}
        this.calc_areas(this.coexist);
	this.set_spinodal();
	this.show_coexist();
        this.plot_points2();
      }
    }
  }

  update_graph3(clac=true){
    this.clearChildren(this.text_div3);
    this.canvas3_ctx.clearRect(0, 0, this.canvas3.width, this.canvas3.height);
    if((this.x3_axis_data.max > this.x3_axis_data.min) &&
      (this.y3_axis_data.max > this.y3_axis_data.min) &&
      this.x3_axis_data.increm > 0 &&
      this.y3_axis_data.increm > 0 &&
      this.plot_steps > 0) {
      this.error_flag = false;
      this.set_dimensions3();
      this.graph3_indices();
      if(!this.error_flag) {
        this.canvas3_ctx.globalAlpha = 1;
        this.canvas3_ctx.lineWidth = "" + this.linewidth;
        this.canvas3_ctx.lineCap = "round";
        this.plot_grid3();
        this.plot_points3();
      }
    }
  }
  
  show_graph_error(str) {
    this.clearChildren(this.text_div);
    this.canvas_ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var xm = this.canvas.width/2;
    var ym = this.canvas.height/2;
    this.create_index_span(this.text_div,'Error: ' + str,xm-(str.length*4),ym,str.length,"center","120%");
  }
  
  draw_mouse_query(x) {
    this.canvas_ctx.lineWidth = 1;
    var fx = this.ntrp(x,this.graph_dims.xl,this.graph_dims.xh,this.x_axis_data.gmin,this.x_axis_data.gmax);
    var y = this.matf.regress(fx,this.poly_terms);
    var px = this.ntrp(fx,this.x_axis_data.gmin,this.x_axis_data.gmax,this.graph_dims.xl,this.graph_dims.xh);
    px = parseInt(px) + 0.5;
    var py = this.ntrp(y,this.y_axis_data.gmin,this.y_axis_data.gmax,this.graph_dims.yh,this.graph_dims.yl);
    py = parseInt(py) + 0.5;
    this.canvas_ctx.strokeStyle = this.explore_color;
    this.canvas_ctx.beginPath();
    this.draw_line(this.canvas_ctx,this.graph_dims.xl,py,this.graph_dims.xh,py);
    this.draw_line(this.canvas_ctx,px,this.graph_dims.yl,px,this.graph_dims.yh);
    this.canvas_ctx.stroke();
    this.canvas_ctx.closePath();
    this.canvas_ctx.strokeStyle = this.text_color;
    var str = "x = " + fx.toFixed(6) + ", y = " + y.toFixed(6);
    // decide where to put the number tag
    if(fx > (this.x_axis_data.min+this.x_axis_data.max)/2) {
      px -= (str.length * 8) + 4;
    }
    else {
      px += 8;
    }
    if(y < (this.y_axis_data.min+this.y_axis_data.max)/2) {
      py -= 20;
    }
    else {
      py += 4;
    }
    this.create_index_span(this.text_div,str,px,py,str.length,"left",this.default_font_size);
  }

  draw_mouse_query2(x) {
    this.canvas2_ctx.lineWidth = 1;
    var fx = this.ntrp(x,this.graph2_dims.xl,this.graph2_dims.xh,this.x2_axis_data.gmin,this.x2_axis_data.gmax);
    var y = this.get_chempot(fx);
    var px = this.ntrp(fx,this.x2_axis_data.gmin,this.x2_axis_data.gmax,this.graph2_dims.xl,this.graph2_dims.xh);
    px = parseInt(px) + 0.5;
    var py = this.ntrp(y,this.y2_axis_data.gmin,this.y2_axis_data.gmax,this.graph2_dims.yh,this.graph2_dims.yl);
    py = parseInt(py) + 0.5;
    this.canvas2_ctx.strokeStyle = this.explore_color;
    this.canvas2_ctx.beginPath();
    this.draw_line(this.canvas2_ctx,this.graph2_dims.xl,py,this.graph2_dims.xh,py);
    this.draw_line(this.canvas2_ctx,px,this.graph2_dims.yl,px,this.graph2_dims.yh);
    this.canvas2_ctx.stroke();
    this.canvas2_ctx.closePath();
    this.canvas2_ctx.strokeStyle = this.text_color;
    var str = "x = " + fx.toFixed(6) + ", y = " + y.toFixed(6);
    // decide where to put the number tag
    if(fx > (this.x2_axis_data.min+this.x2_axis_data.max)/2) {
      px -= (str.length * 8) + 4;
    }
    else {
      px += 8;
    }
    if(y < (this.y2_axis_data.min+this.y2_axis_data.max)/2) {
      py -= 20;
    }
    else {
      py += 4;
    }
    this.create_index_span(this.text_div2,str,px,py,str.length,"left",this.default_font_size);
  }
  
  adjust_degree(w) {
    this.reverse_xy = this.reverse_checkbox.checked;
    this.read_data();
    if(w != null) {
      this.poly_degree += parseFloat(w);
    }
    this.poly_degree = Math.max(0,this.poly_degree);
    if(this.xy_data != null) {
      this.poly_degree = Math.min(this.xy_data.length-1,this.poly_degree);
    }
    this.compute_polynomial();
    this.plot_graph();
  }
  
  read_data() {
    this.xy_data = null;
    var xl = 1e30;
    var xh = -1e30;
    var yl = 1e30;
    var yh = -1e30;
    var sd = this.data_entry.value;
    // try to filter numerical data from an arbitrary input
    var strings = sd.match(/([0-9\.e+-]+)/gim,"$1");
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
      if(len % 2 != 0) {
        this.show_graph_error("Unpaired data (x count != y count).");
        return false;
      }
      else {
        //console.debug(array);
        this.xy_data = new Array();
        for(var i = 0;i < len;i += 2) {
          if(this.reverse_xy) {
            x = parseFloat(array[i+1]);
            y = parseFloat(array[i]);
          }
          else {
            var x = parseFloat(array[i]);
            var y = parseFloat(array[i+1]);
          }
          xl = Math.min(x,xl);
          xh = Math.max(x,xh);
          yl = Math.min(yl,y);
          yh = Math.max(yh,y);
          this.xy_data.push(new Pair(x,y));
        }
        //this.x_axis_data = new AxisData(xl,xh,12,'x',true);
        xl = Math.min(0.0,xl);
        xh = Math.max(0.9,xh);
    	this.x_axis_data = new AxisData(xl,xh,10,'x',true);
	yh = Math.max(yh,0.0);
        this.y_axis_data = new AxisData(yl,yh,8,'y',true);
    	this.x2_axis_data = new AxisData(0.0,0.9,10,'x',true);
    	this.coexist=parseFloat(this.id("input_coexist").value);
	this.yspan=parseFloat(this.id("input_yspan").value);
    	this.y2_axis_data = new AxisData(this.coexist-this.yspan,this.coexist+this.yspan,8,'y',true);
    	//this.y2_axis_data = new AxisData(this.coexist-10,this.coexist+20,8,'y',true);
        this.id("table_start").value = xl;
        this.id("table_end").value = xh;
        this.id("table_step").value = (xh-xl) / 20.0;
      }
    }
    else {
      this.show_graph_error("No data.");
      return false;
    }
    return true;
  }
  
  compute_polynomial() {
    if(!this.valid_test()) {
      return false;
    }
    this.id("poly_degree_field").innerHTML = this.poly_degree
    var result = this.matf.process_data(this.xy_data,this.poly_degree);
    this.poly_terms = result[0];
    this.correlation_coefficient = result[1];
    this.standard_error = result[2];
    return true;
  }
  
  generate_result() {
    this.read_data();
    this.compute_polynomial();
    this.plot_graph();
  }
  
  set_optimum() {
    this.read_data();
    this.poly_degree = this.xy_data.length - 1;
    this.compute_polynomial();
    this.plot_graph();
  }
  
  change_output_form() {
    this.output_form = (this.output_form += 1) % this.form_labels.length;
    this.generate_result();
  }
  
  show_results() {
    var results = "Mode: " + (this.reverse_xy?"reversed (x,y = y,x) analysis":"normal x,y analysis") + "\n";
    results += "Polynomial degree " + this.poly_degree + ", " + this.xy_data.length + " x,y data pairs.\n";
    results += "Correlation coefficient = " + this.correlation_coefficient + "\n";
    results += "Standard error = " + this.standard_error + "\n\n";
    results += "Output form: " + this.form_labels[this.output_form] + ":\n\n";
    results += this.parse_results();
    this.id("results_area").value = results;
    var exchempot_eq=this.parse_eqation();
    this.id("eq_exchempot").textContent = exchempot_eq;
    var chempot_eq = exchempot_eq + " + ln(x)";
    this.id("eq_chempot").textContent = chempot_eq;
    var math_area=chempot_eq.replace(/\s/g, '').replace(/\^/g, '**').replace(/y=/g,'');
    if (this.coexist<0){
    	math_area += '+'+Math.abs(this.coexist);
    }else{
	math_area += '-'+Math.abs(this.coexist);
    }
    var waintg='https://www.wolframalpha.com/input/?i=integral+';
    var math_area1 = math_area +" from x="+this.roots_data[0].x+" to "+this.roots_data[2].x;
    var math_area_uri=waintg+encodeURIComponent(math_area1);
    //console.log(math_area_uri);
    //this.id("math_intg").href=math_area_uri;
    math_area1 = math_area +" from x="+this.roots_data[0].x+" to "+this.roots_data[1].x;
    math_area_uri=waintg+encodeURIComponent(math_area1);
    //console.log(math_area_uri);
    this.id("math_intg_left").href=math_area_uri;
    math_area1 = math_area +" from x="+this.roots_data[1].x+" to "+this.roots_data[2].x;
    math_area_uri=waintg+encodeURIComponent(math_area1);
    //console.log(math_area_uri);
    this.id("math_intg_right").href=math_area_uri;
    math_area1=math_area
    var wasolv='https://www.wolframalpha.com/input/?i=solve+'
    math_area_uri=wasolv+encodeURIComponent(math_area1);
    //console.log(math_area_uri);
    this.id("math_roots").href=math_area_uri;
    math_area=chempot_eq.replace(/\s/g, '').replace(/\^/g, '**').replace(/y=/g,'');
    math_area1='{derivation of ('+math_area+"==0),0<x<1}"
    math_area_uri=wasolv+encodeURIComponent(math_area1);
    this.id("math_roots_deriv").href=math_area_uri;
  }
  
  fix_exponent(v) {
    v = v.toExponential(16);
    var exp = v.replace(/.*e[+-](\d+)$/,"$1");
    while(exp.length < 3) {
      exp = '0' + exp;
    }
    v = v.replace(/(.*e[+-])(\d+)$/,"$1" + exp);
    return v;
  }
  
  parse_results() {
    var indent = [26,37,45,50];
    var iv = indent[this.output_form];
    var result = "";
    var len = this.poly_terms.length;
    for (var i in this.poly_terms) {
      var v = this.poly_terms[i];
      v = this.fix_exponent(v);
      v = this.right_align(v,24);
      switch(this.output_form) {
        case 0:
          result += v + "\n";
        break;
        case 1:
        if(result.length == 0) {
          result = "f(x) = "
          } else {
          result += "     + ";
        }
        result += v + " * x^" + i + "\n";
        break;
        default:
          var comma = ((i < this.poly_terms.length-1)?",":"");
        result += "    " + v + comma + "\n";
      }
    }
    if(this.output_form >= 2) {
      var body = this.funct_array[this.output_form-2];
      body = body.replace(/TERMS/m,result);
      result = body;
    }
    //result += "\n\nCopyright (c) 2019, P. Lutus -- http://arachnoid.com. All Rights Reserved.\n";
    return result;
  }

  parse_eqation() {
  var result = "y = ";
  for (var i in this.poly_terms) {
    let j=parseInt(i)+1;
    var v = this.poly_terms[i];
    var va = Math.abs(v);
    va=va.toFixed(4);
    if (v >= 0){
      if (i == 0){
      	result += va + " * x";
      }else{
      	result += " + "+va + " * x^" + j;
      }
    }else{
      if (i == 0){
        result += "-"+va + " * x";
      }else{
        result += " - "+va + " * x^" + j;
      }
    }
  }
  return result;
  }
  
  right_align(s,n) {
    while(s.length < n) {
      s = " " + s;
    }
    return s
  }
  
  create_table_row(x,start,end,decimals,exp) {
    var y = this.matf.regress(x,this.poly_terms);
    var z = this.get_chempot(x);
    var pct = this.ntrp(x,start,end,0,100);
    var xs,ys,zs,pcs;
    if(exp) {
      xs = x.toExponential(decimals);
      zs = z.toExponential(decimals);
      ys = y.toExponential(decimals);
      pcs = pct.toExponential(decimals);
    }
    else {
      xs = x.toFixed(decimals);
      zs = z.toFixed(decimals);
      ys = y.toFixed(decimals);
      pcs = pct.toFixed(decimals);
    }
    return xs + "," + zs + "," + ys + "," + pcs + "\n";
  }
  
  generate_table() {
    var exp = this.id("table_exponent").checked
    var start = this.float_id("table_start");
    var end = this.float_id("table_end");
    var step = this.float_id("table_step");
    var decimals = this.float_id("table_decimals");
    var result = "Density,Chemical Potential,Excess Chemical Potential,%\n";
    var row = "";
    if (step == 0) {
      this.table_data.value = "Error: numerical range.";
      return false;
    }
    else {
      for(var x = start; x <= end;x += step) {
        row = this.create_table_row(x,start,end,decimals,exp);
        result += row;
      }
      var lastrow = this.create_table_row(end,start,end,decimals,exp);
      if(lastrow != row) {
        result += lastrow;
      }
      this.table_data.value = result;
    }
  }
 
  generate_graphic_canvas(canvas,title){
    var dataURL = canvas.toDataURL("image/png");
    var win = window.open();
    win.document.write('<html><head><title>'+title+'</title></head><body><iframe src="' + dataURL, '" width=' + (canvas.width+16) + ' height=' + (canvas.height+16) + ' style="background-color:white;border:1px solid #c0c0c0;"></iframe></body></html>');
  }
   
  generate_graphic() {
    this.generate_graphic_canvas(this.canvas,"Polynomial Regression Chart");
  }
 
  generate_graphic2() {
    this.generate_graphic_canvas(this.canvas2,"Maxwell Construction Chart");
  }

  generate_graphic3() {
    this.generate_graphic_canvas(this.canvas3,"Phase Diagram Chart");
  }

  setup_function_strings() {
    
    this.cppFunct = "double regress(double x) {\n  double terms[] = {\nTERMS};\n  \n  double t = 1;\n  double r = 0;\n  for (double c : terms) {\n    r += c * t;\n    t *= x;\n  }\n  return r;\n}";
    this.cFunct = "double regress(double x) {\n  double terms[] = {\nTERMS};\n  \n  size_t csz = sizeof terms / sizeof *terms;\n  \n  double t = 1;\n  double r = 0;\n  for (int i = 0; i < csz;i++) {\n    r += terms[i] * t;\n    t *= x;\n  }\n  return r;\n}";
    this.pyFunct = "terms = [\nTERMS]\n\ndef regress(x):\n  t = 1\n  r = 0\n  for c in terms:\n    r += c * t\n    t *= x\n  return r";
    this.javaFunct = "double regress(double x) {\n    double terms[] = {\nTERMS};\n    \n    double t = 1;\n    double r = 0;\n    for (double c : terms) {\n      r += c * t;\n      t *= x;\n    }\n    return r;\n}";
    this.javascriptFunct = "terms = [\nTERMS];\n\nregress(x, terms) {\n    var r = 0;\n    var t = 1;\n    for (var i in terms) {\n      r += terms[i] * t;\n      t *= x;\n    }\n    return r;\n}";
    
    this.funct_array = [this.cFunct,this.cppFunct,this.javaFunct,this.javascriptFunct,this.pyFunct];
  }
  
  close() {
    //this.write_cookie();
  }
  
  write_cookie() {
    // save cookie of user data
    // cannot exceed 4096 bytes
    // escape linefeeds
    var data = this.data_entry.value.replace(/\n/gm,"\\n");
    // escape semicolons so cookie syntax works
    data = data.replace(/;/g,"###");
    //console.log(data);
    // set max-age to 90 days
    var ageString = ";max-age=7776000;";
    document.cookie = "data=" + data + ageString;
    document.cookie = "degree=" + this.poly_degree + ageString;
    document.cookie = "reverse=" + this.reverse_xy + ageString;
    document.cookie = "output=" + this.output_form + ageString;
  }
  
  read_cookie() {
    // if there is a cookie
    if(document.cookie) {
      console.log("have cookie: " + document.cookie);
      // capture definition of user_data
      if(document.cookie.match(/data=/)) {
        var data = document.cookie.replace(/.*?data=(.*?);.*/m,"$1");
        if(data) {
          // unescape semicolons
          data = data.replace(/###/g,";");
          // unescape linefeeds
          data = data.replace(/\\n/g,"\n");
          this.data_entry.value = data;
        }
      }
      
      if(document.cookie.match(/output=/)) {
        var output = document.cookie.replace(/.*?output=(.*?);.*/m,"$1");
        this.output_form = parseInt(output);
      }
      
      if(document.cookie.match(/degree=/)) {
        var degree = document.cookie.replace(/.*?degree=(.*?);.*/m,"$1");
        this.poly_degree = parseInt(degree);
        this.adjust_degree();
      }
      if(document.cookie.match(/reverse=/)) {
        var reverse = document.cookie.replace(/.*?reverse=(.*?);.*/m,"$1");
        this.reverse_xy = reverse === "true";
        this.reverse_checkbox.checked = this.reverse_xy;
      }
    }
  }
  
  
} // end of PolySolve class

var polysolve;

addEvent(window,'load',function() { polysolve = new PolySolve() });
addEvent(window,'unload',function() { if(polysolve) { polysolve.close() }});
