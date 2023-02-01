
      var canvas = document.getElementById("canvas1");
      var ctx = canvas.getContext("2d");
      ctx.font = "30px Arial";
      ctx.fillText("Hello World", 10, 50);

      var statusElement = document.getElementById('status');
      var progressElement = document.getElementById('progress');
      var spinnerElement = document.getElementById('spinner');

      var Module = {
        preRun: [],
        postRun: [],
	noInitialRun: true,
        onRuntimeInitialized: function() {
          //double mcLJ(int N, double L, double T, double rc, int nCycles, int nEq, int fs, int ts, int Seed)
          c_mclj = Module.cwrap('mcLJ', 'number', ['number','number','number','number','number','number','number','number','number']);
          },
        print: (function() {
          var element = document.getElementById('output');
          if (element) element.value = ''; // clear browser cache
          return function(text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
            // These replacements are necessary if you render to raw HTML
            //text = text.replace(/&/g, "&amp;");
            //text = text.replace(/</g, "&lt;");
            //text = text.replace(/>/g, "&gt;");
            //text = text.replace('\n', '<br>', 'g');
            console.log(text);
            if (element) {
              element.value += text + "\n";
              element.scrollTop = element.scrollHeight; // focus on bottom
            }
          };
        })(),
        printErr: function(text) {
          if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
          console.error(text);
        },
        totalDependencies: 0,
        monitorRunDependencies: function(left) {
          this.totalDependencies = Math.max(this.totalDependencies, left);
        }
      };
      window.onerror = function(event) {
        // TODO: do not warn on ok events like simulating an infinite loop or exitStatus
        Module.setStatus('Exception thrown, see JavaScript console');
        spinnerElement.style.display = 'none';
        Module.setStatus = function(text) {
          if (text) Module.printErr('[post-exception status] ' + text);
        };
      };
 
        document.querySelector('#runbutton')
        .addEventListener('click',runmcstart);
	async function runmcstart(){
		if (document.getElementById("runbutton").innerText!="running"){
			if (confirm("The job could take up to 15 minutes, do you want continue?")){
				setTimeout(runmc,100);
				document.getElementById("runbutton").innerText="running";
			}
		}
	}
        async function runmc() {
		var v_sim_N = document.getElementById("sim_N").value;
		var v_sim_L = document.getElementById("sim_L").value;
		var v_sim_T = document.getElementById("sim_T").value;
		var v_sim_rc = document.getElementById("sim_rc").value;
		var v_sim_eq = document.getElementById("sim_eq").value;
		var v_sim_nc = document.getElementById("sim_nc").value;
		var v_sim_fs = document.getElementById("sim_fs").value;
		var v_sim_ts = document.getElementById("sim_ts").value;
		var v_sim_seed = document.getElementById("sim_seed").value;
		let v=v_sim_L*v_sim_L*v_sim_L
		let nc=v_sim_N*1.0/v;
		document.getElementById("sim_nd").textContent=nc.toFixed(6);
		var result2=await c_mclj(v_sim_N,v_sim_L,v_sim_T,v_sim_rc,v_sim_nc,v_sim_eq,v_sim_fs,v_sim_ts,v_sim_seed);
		var x=document.getElementById("sim_ex")
		document.getElementById("sim_ex").textContent=result2.toFixed(6);
		//document.getElementById("sim_ex_kcal").textContent=(result2*v_sim_T).toFixed(6);
		document.getElementById("runbutton").innerText="run";
		//alert("Simualtion finished");
    }
