var length = Math.min(document.documentElement.clientWidth, document.documentElement.clientHeight) * 0.92;
var width = length;
var height = length;
var rad = 2;

/* create an array between 1 and 100 items long,
filled with arrays containing two random values between 1 and 50 */
var maxDataNum = 1024;
var x_range = width * 2;
var y_range = height * 2;

function createRandomData()
{
    var numDataItems = randomRangeInt(1, maxDataNum);
    var d = [];
    for(var i = 0; i < numDataItems; ++i) {
        var x = randomRangeInt(1, x_range);
        var y = randomRangeInt(1, y_range);
        d.push({'x': x, 'y': y});
    }
    return d;
}

var margin = {
    left: 10,
    top: 20,
    right: 40,
    bottom: 10
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
var transitionTime = 2000;
var displayLabels = false;
var exampleData = [];

function DisplayLabels()
{
    displayLabels = !displayLabels;
    updateLabels(exampleData, true);
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

function updateDots(data)
{
    var t = d3.transition()
        .duration(transitionTime)
        .ease(function(t){ return d3.easePolyInOut(t, 10); });

    var dots = svg.selectAll('.dot')
        .data(data);

    dots.exit()
        .transition(t)
        .attr('r', 0)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .attr('cx', function(d, i){ return x_scale(transBoxOutAxes(d, i).x); })
        .attr('cy', function(d, i){ return y_scale(transBoxOutAxes(d, i).y); })
        .remove();

    var new_dots = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('fill', 'white')
        .attr('stroke', 'gray')
        .attr('r', 0)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .attr('cx', function(d, i){ return x_scale(transBoxOutAxes(d, i).x); })
        .attr('cy', function(d, i){ return y_scale(transBoxOutAxes(d, i).y); });

    new_dots.merge(dots)
        .transition(t)
        .attr('r', rad)
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1)
        .attr('cx', function(d, i){ return x_scale(d.x); })
        .attr('cy', function(d, i){ return y_scale(d.y); });
}

function updateLabels(data, display)
{
    var t = d3.transition()
        .duration(transitionTime)
        .ease(function(t){ return d3.easePolyInOut(t, 10); });

    var labels = svg.selectAll('.label')
        .data(displayLabels ? data : []);

    labels.exit()
        .transition(t)
        .attr('font-size', 0)
        .attr('fill-opacity', 0);

    var new_labels = labels.enter()
        .append('text')
        .attr('class', 'label')
        .attr('fill', 'white')
        .attr('font-size', 0)
        .attr('fill-opacity', 0);

    if(display)
    {
        labels.exit()
            .transition(t)
            .remove();
        new_labels
            .attr('x', function(d, i){ return x_scale(d.x) + rad; })
            .attr('y', function(d, i){ return y_scale(d.y) - rad; });
    }
    else
    {
        labels.exit()
            .transition(t)
            .attr('x', function(d, i){ return x_scale(transBoxOutAxes(d, i).x); })
            .attr('y', function(d, i){ return y_scale(transBoxOutAxes(d, i).y); })
            .remove();
        new_labels
            .attr('x', function(d, i){ return x_scale(transBoxOutAxes(d, i).x); })
            .attr('y', function(d, i){ return y_scale(transBoxOutAxes(d, i).y); });
    }

    new_labels.merge(labels)
        .transition(t)
        .attr('font-size', 12)
        .attr('fill-opacity', 1)
        .attr('x', function(d, i){ return x_scale(d.x) + rad; })
        .attr('y', function(d, i){ return y_scale(d.y) - rad; })
        .text(function(d, i){ return d.x + ',' + d.y; });
}

function Update()
{
    exampleData = createRandomData();
    console.log('Number of data: ' + exampleData.length);
    console.log(exampleData);

    updateDots(exampleData);
    updateLabels(exampleData, false);
}

Update();
