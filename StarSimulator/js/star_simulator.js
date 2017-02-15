function randomRange(lower, upper)
{
    return Math.random() * (upper - lower) + lower;
}

function randomRangeInt(lower, upper)
{
    return Math.floor(Math.random() * (upper - lower + 1) + lower);
}

var width = document.documentElement.clientWidth - 4;
var height = document.documentElement.clientHeight - 4;
var rad_range = [0.5,2.5];
var color_table = ['rgb(255,255,255)', 'rgb(192,255,255)', 'rgb(255,192,255)', 'rgb(255,255,192)', 'rgb(255,192,192)', 'rgb(192,255,192)', 'rgb(192,192,255)', 'rgb(128,255,255)', 'rgb(255,128,255)', 'rgb(255,255,128)', 'rgb(255,128,128)', 'rgb(128,255,128)', 'rgb(128,128,255)'];

/* create an array between 1 and 100 items long,
filled with arrays containing two random values between 1 and 50 */
var maxDataNum = 1024;
var x_range = width * 2;
var y_range = height * 2;

function createRandomData()
{
    var numDataItems = randomRangeInt(1, maxDataNum);
    var d = [];
    for(var i = 0; i < numDataItems; i++) {
        var x = randomRangeInt(1, x_range);
        var y = randomRangeInt(1, y_range);
        d.push({'x': x, 'y': y});
    }
    return d;
}

var margin = {
    left: 5,
    top: 5,
    right: 5,
    bottom: 5
};

var svg = d3.select("#vis")
    .append("svg")
        .attr('width', width)
        .attr('height', height)
    .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

width -= margin.left + margin.right;
height -= margin.top + margin.bottom;

var x_scale = d3.scaleLinear()
    .range([0, width])
    .domain([0, x_range]);

var y_scale = d3.scaleLinear()
    .range([height, 0])
    .domain([0, y_range]);

//
var transitionTime = 10000;
var transitionWait = 500;
var exampleData = [];

function transFocusInAxes(d, i)
{
    return {x: x_range / 2, y: y_range / 2};
}

function transCircleOutAxes(d, i)
{
    var center = {x: x_range / 2, y: y_range / 2};
    var radius = Math.sqrt(center.x * center.x + center.y * center.y);
    var x_dis = d.x - center.x;
    var y_dis = d.y - center.y;
    var trans = {x: 0, y: 0};
    
    if(x_dis == 0 && y_dis == 0)
    {
        trans = center;
    }
    else
    {
        var dis = Math.sqrt(x_dis * x_dis + y_dis * y_dis);
        var ratio = radius / dis;
        trans.x = center.x + x_dis * ratio;
        trans.y = center.y + y_dis * ratio;
    }
    
    return trans;
}

function transBoxOutAxes(d, i)
{
    var center = {x: x_range / 2, y: y_range / 2};
    var x_dis = Math.abs(d.x - center.x);
    var y_dis = Math.abs(d.y - center.y);
    var trans = {x: 0, y: 0};

    if(x_dis == 0 && y_dis == 0)
    {
        trans = center;
    }
    else if(x_dis > y_dis)
    {
        var scale = d3.scaleLinear()
            .range([center.y, d.y])
            .domain([center.x, d.x]);
        trans.x = d.x > center.x ? x_range : 0;
        trans.y = scale(trans.x);
    }
    else
    {
        var scale = d3.scaleLinear()
            .range([center.x, d.x])
            .domain([center.y, d.y]);
        trans.y = d.y > center.y ? y_range : 0;
        trans.x = scale(trans.y);
    }

    return trans;
}

function updateDots(data, callback)
{
    var t = d3.transition()
        .duration(transitionTime)
        .ease(function(t){ return d3.easePolyInOut(t, 10); });

    var dots = svg.selectAll('.dot')
        .data(data);
    
    var n1 = 0;
    dots.exit()
        .each(function(){ n1++; })
        .transition(t)
        .on('end', function(){ n1--; if(!n1) callback(); })
        .attr('r', 0)
        //.attr('fill-opacity', 0)
        //.attr('stroke-opacity', 0)
        .attr('cx', function(d, i){ return x_scale(transCircleOutAxes(d, i).x); })
        .attr('cy', function(d, i){ return y_scale(transCircleOutAxes(d, i).y); })
        .remove();

    var new_dots = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('fill', function(){ return color_table[randomRangeInt(0, color_table.length - 1)]; } )
        .attr('stroke', 'gray')
        .attr('r', 0)
        //.attr('fill-opacity', 0)
        //.attr('stroke-opacity', 0)
        .attr('cx', function(d, i){ return x_scale(transCircleOutAxes(d, i).x); })
        .attr('cy', function(d, i){ return y_scale(transCircleOutAxes(d, i).y); });

    var n2 = 0;
    new_dots.merge(dots)
        .each(function(){ n2++; })
        .transition(t)
        .on('end', function(){ n2--; if(!n2) callback(); })
        .attr('r', function(){ return randomRange(rad_range[0], rad_range[1]); })
        //.attr('fill-opacity', 1)
        //.attr('stroke-opacity', 1)
        .attr('cx', function(d, i){ return x_scale(d.x); })
        .attr('cy', function(d, i){ return y_scale(d.y); });
}

function Update()
{
    exampleData = createRandomData();
    //console.log('Number of data: ' + exampleData.length);
    //console.log(exampleData);

    updateDots(exampleData, Update);
}

Update();
//setInterval(Update, transitionTime + transitionWait);
