function readprd(ElemId) {
    var sd = document.getElementById(ElemId).value;
    var strings = sd.match(/([0-9\.e+-]+)/gim, "$1");
    var prddata = new Array();
    if (strings != null && strings.length > 0) {
        var array = [];
        for (var i in strings) {
            var s = strings[i];
            // only if the string contains at least one numerical digit
            if (s.match(/.*[0-9].*/)) {
                array.push(parseFloat(strings[i]));
            }
        }
        var len = array.length;
        for (var i = 0; i < len; i += 1) {
            var p1 = parseFloat(array[i]);
            //var ps=parseFloat(array[i+1]);
            prddata.push({
                x: i + 1,
                y: p1
            });
        }
    }
    //alert(prddata[0].x);
    //alert(prddata[0].y)
    return prddata;
}

function plot() {
    const myprd = readprd('textArea');
    const ctx = document.getElementById('myChart').getContext('2d');
    const data = {
        datasets: [{
            label: 'DIRseq Prediction',
            data: myprd,
            backgroundColor: 'rgb(255, 99, 132)'
        }],
    };
    const horizontalLinePlugin = {
        id: 'horizontalLine',
        afterDraw: (chart) => {
            const yValue = chart.scales.y.getPixelForValue(50);
            const ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(chart.chartArea.left, yValue);
            ctx.lineTo(chart.chartArea.right, yValue);
            ctx.strokeStyle = 'Black';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    };
    const config = {
        type: 'scatter',
        data: data,
        options: {
            interaction: {
                mode: 'point'
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Residue'
                    }
                }
            }
        },
        plugins: [horizontalLinePlugin]
    }

    if (typeof plot.myChart === 'undefined' || plot.myChart === null) {
        // variable is undefined or null
        plot.myChart = new Chart(ctx, config);
    } else {
        plot.myChart.destroy();
        plot.myChart = new Chart(ctx, config);
    }
    /*
    let chartStatus = Chart.getChart("myChart"); // <canvas> id
    if (chartStatus != undefined) {
      chartStatus.destroy();
    }
    const myChart = new Chart(ctx, config);
    */
};