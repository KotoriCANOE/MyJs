class StarSimulator
{
    constructor(width, height, maxDataNum = 1024)
    {
        // constants
        this.radRange = [0.5,2.5];
        this.colorTable = ['rgb(255,255,255)',
            'rgb(192,255,255)', 'rgb(255,192,255)', 'rgb(255,255,192)',
            'rgb(255,192,192)', 'rgb(192,255,192)', 'rgb(192,192,255)',
            'rgb(128,255,255)', 'rgb(255,128,255)', 'rgb(255,255,128)',
            'rgb(255,128,128)', 'rgb(128,255,128)', 'rgb(128,128,255)'];
        this.margin = {
            left: 5,
            top: 5,
            right: 5,
            bottom: 5
        };
        this.transitionTime = [5000, 30000];
        this.transitionDelay = [5, 100];

        // options
        this.width = width;
        this.height = height;
        this.maxDataNum = maxDataNum;

        // initialization
        this.xRange = this.width * 2;
        this.yRange = this.height * 2;

        this.svg = d3.select("#vis")
            .append("svg")
                .attr('width', this.width)
                .attr('height', this.height)
            .append('g')
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.width -= this.margin.left + this.margin.right;
        this.height -= this.margin.top + this.margin.bottom;

        this.xScale = d3.scaleLinear()
            .range([0, this.width])
            .domain([0, this.xRange]);
        this.yScale = d3.scaleLinear()
            .range([this.height, 0])
            .domain([0, this.yRange]);

        this.count = 0;
    }

    // Helper methods
    createRandomData()
    {
        var numDataItems = randomRangeInt(1, this.maxDataNum);
        var d = new Array(numDataItems);
        for(var i = 0; i < numDataItems; ++i)
        {
            var x = randomRangeInt(1, this.xRange);
            var y = randomRangeInt(1, this.yRange);
            d[i] = {'x': x, 'y': y};
        }
        return d;
    }

    transFocusInAxes(d, i)
    {
        return {x: this.xRange / 2, y: this.yRange / 2};
    }

    transCircleOutAxes(d, i)
    {
        var center = {x: this.xRange / 2, y: this.yRange / 2};
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

    transBoxOutAxes(d, i)
    {
        var center = {x: this.xRange / 2, y: this.yRange / 2};
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
            trans.x = d.x > center.x ? this.xRange : 0;
            trans.y = scale(trans.x);
        }
        else
        {
            var scale = d3.scaleLinear()
                .range([center.x, d.x])
                .domain([center.y, d.y]);
            trans.y = d.y > center.y ? this.yRange : 0;
            trans.x = scale(trans.y);
        }

        return trans;
    }

    // Main methods
    updateDots(data)
    {
        var that = this;
        var cxs = new Array(data.length);
        var cys = new Array(data.length);
        var delays = new Array(data.length);

        var transitionTime = randomRangeInt(this.transitionTime[0], this.transitionTime[1]);
        var transitionDelay = randomRangeInt(this.transitionDelay[0], this.transitionDelay[1]);

        console.log('No.' + (++this.count) + ': Stars=' + data.length
            + ', Time=' + transitionTime + ', Delay=' + transitionDelay);

        var t = d3.transition()
            .duration(transitionTime)
            .ease(function(time) { return d3.easePolyInOut(time, 10); });

        // dynamic delays
        if(this.count % 2 == 1)
        {
            for (var i = 0; i < data.length; ++i)
            {
                delays[i] = transitionDelay * i;
            }
        }
        else
        {
            var delaySum = transitionDelay * data.length;
            for (var i = 0; i < data.length; ++i)
            {
                delays[i] = delaySum - transitionDelay * i;
            }
        }

        var dots = this.svg.selectAll('.dot')
            .data(data);

        dots.exit()
            .transition(t)
            .delay(function(d, i) { return transitionDelay * i; })
            .attr('r', 0)
            .each(function(d, i) {
                var axes = that.transCircleOutAxes(d, i);
                cxs[i] = that.xScale(axes.x);
                cys[i] = that.yScale(axes.y);
             })
            .attr('cx', function(d, i) { return cxs[i]; })
            .attr('cy', function(d, i) { return cys[i]; })
            .remove();

        var new_dots = dots.enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('fill', function() { return that.colorTable[randomRangeInt(0, that.colorTable.length - 1)]; } )
            .attr('stroke', 'gray')
            .attr('r', 0)
            .each(function(d, i){
                var axes = that.transCircleOutAxes(d, i);
                cxs[i] = that.xScale(axes.x);
                cys[i] = that.yScale(axes.y);
             })
            .attr('cx', function(d, i) { return cxs[i]; })
            .attr('cy', function(d, i) { return cys[i]; });

        new_dots.merge(dots)
            .transition(t)
            .delay(function(d, i) { return delays[i]; })
            .attr('r', function() { return randomRange(that.radRange[0], that.radRange[1]); })
            .attr('cx', function(d, i) { return that.xScale(d.x); })
            .attr('cy', function(d, i) { return that.yScale(d.y); });

        // callback on end of transition
        t.on('end', function() { that.randomUpdate(); });
    }

    randomUpdate()
    {
        var randomData = this.createRandomData();
        this.updateDots(randomData);
    }

    Run()
    {
        this.randomUpdate();
    }

}


// Instantiation
window.onload = function()
{
    var instance = new StarSimulator(
        document.documentElement.clientWidth - 4,
        document.documentElement.clientHeight - 4);

    instance.Run();
}
