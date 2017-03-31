function randomRange(lower, upper)
{
    return Math.random() * (upper - lower) + lower;
}

function randomRangeInt(lower, upper)
{
    return Math.floor(Math.random() * (upper - lower + 1) + lower);
}


class Gravitation2
{
    constructor(width, height, depth = null, maxNodesNum = 512, scale = 4, maxSpeed = null, minSpeed = null)
    {
        // physics constants
        this.g = 9.81;
        this.density = 1;
        this.radius2mass = 4 / 3 * Math.PI * this.density;

        // constants
        this.margin = {
            left: 5,
            top: 5,
            right: 5,
            bottom: 5
        };
        
        this.radius = 3;
        this.mass = this.radius * this.radius * this.radius * this.radius2mass;
        this.colorTable = ['rgb(255,255,255)',
            'rgb(192,255,255)', 'rgb(255,192,255)', 'rgb(255,255,192)',
            'rgb(255,192,192)', 'rgb(192,255,192)', 'rgb(192,192,255)',
            'rgb(128,255,255)', 'rgb(255,128,255)', 'rgb(255,255,128)',
            'rgb(255,128,128)', 'rgb(128,255,128)', 'rgb(128,128,255)'];
        this.colorClose = { 'r': 0.5, 'g': 0.7, 'b': 1 }; // in linear scale [0,1]
        this.colorFar = { 'r': 0.7, 'g': 0.5, 'b': 0.35 }; // in linear scale [0,1]

        this.simTick = 5; // ms
        this.innerScale = 1 / 3;

        // options
        this.width = width;
        this.height = height;
        if(!depth) this.depth = width;
        else this.depth = depth;
        this.maxNodesNum = maxNodesNum;

        this.scale = scale;
        this.simTickSec = this.simTick / 1000 * this.scale; // s
        this.yAcc = this.g * this.simTickSec * this.simTickSec;
        this.yAccHalf = this.yAcc / 2;

        if(!maxSpeed)
        {
            var yMaxSpeed = Math.sqrt(2 * this.yAcc * this.height);
            var yMaxTime = this.height * 2 / yMaxSpeed;
            var xMaxSpeed = this.width / (2 * yMaxTime);
            var zMaxSpeed = this.depth / (2 * yMaxTime);
            this.maxSpeed = Math.sqrt(xMaxSpeed * xMaxSpeed + yMaxSpeed * yMaxSpeed + zMaxSpeed * zMaxSpeed);
        }
        else
        {
            this.maxSpeed = maxSpeed * this.simTickSec;
        }

        if(!minSpeed) this.minSpeed = 1 * this.simTickSec;
        else this.minSpeed = minSpeed;

        // initialization
        this.svg = d3.select("#vis")
            .append("svg")
                .attr('width', this.width)
                .attr('height', this.height)
            .append('g')
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.width -= this.margin.left + this.margin.right;
        this.height -= this.margin.top + this.margin.bottom;
    }

    // Helper methods
    createRandomNode(i, that=null)
    {
        if(!that) that = this;
        var z = that.depth / 2;
        var speed = randomRange(that.minSpeed, that.maxSpeed);
        var longitude = randomRange(0, Math.PI * 2);
        var latitude = randomRange(Math.PI * -0.5, Math.PI * 0.5);
        var speedXZ = speed * Math.cos(latitude);
        return {
            'radius': that.radius,
            'mass': that.mass,
            //'fill': 'rgb(255, 255, 255)',
            //'fill': that.colorTable[randomRangeInt(0, that.colorTable.length - 1)],
            'x': that.width / 2,
            'y': that.height / 2,
            'z': z,
            'vx': speedXZ * Math.cos(longitude),
            'vy': speed * Math.sin(latitude),
            'vz': speedXZ * Math.sin(longitude),
            'depthScale': 1 - (1 - that.innerScale) * z / that.depth
        };
    }

    createRandomNodes()
    {
        var nodesNum = this.maxNodesNum;
        var d = new Array(nodesNum);
        for(var i = 0; i < nodesNum; ++i)
        {
            d[i] = this.createRandomNode(i);
        }
        return d;
    }

    // Main methods
    simulate(nodes)
    {
        var that = this;

        // schedule the next tick
        setTimeout(function() { that.simulate(nodes); }, this.simTick);

        // force simulation
        var nodesNum = nodes.length;
        var width = this.width;
        var height = this.height;
        var depth = this.depth;
        var yAcc = this.yAcc;
        var yAccHalf = this.yAccHalf;
        var innerScale = this.innerScale;

        for(var i = 0; i < nodesNum; ++i)
        {
            var node = nodes[i];

            // gravitation
            node.vy += yAcc;

            // update position
            node.x += node.vx;
            node.y += node.vy - yAccHalf;
            node.z += node.vz;

            // collision detection
            if(node.x < 0)
            { // reflect if hitting left wall
                node.x = -node.x;
                node.vx = -node.vx;
            }
            else if(node.x > width)
            { // reflect if hitting right wall
                node.x = width + width - node.x;
                node.vx = -node.vx;
            }

            if(node.y > height)
            { // reflect if hitting the ground
                node.y = height + height - node.y;
                node.vy = yAcc - node.vy;
            }

            if(node.z < 0)
            { // reflect if hitting outer wall
                node.z = -node.z;
                node.vz = -node.vz;
            }
            else if(node.z > depth)
            { // reflect if hitting inner wall
                node.z = depth + depth - node.z;
                node.vz = -node.vz;
            }

            // update hint
            node.depthScale = 1 - (1 - innerScale) * node.z / depth;
        }
    }

    draw(nodes)
    {
        var that = this;

        /*function scaleDepthFill(d)
        {
            var color = d3.color(d.fill);
            color.r = Math.sqrt(color.r / 255) * d.depthScale;
            color.r *= color.r * 255;
            color.g = Math.sqrt(color.g / 255) * d.depthScale;
            color.g *= color.g * 255;
            color.b = Math.sqrt(color.b / 255) * d.depthScale;
            color.b *= color.b * 255;
            return color;
        }*/

        function scaleDepthFill(d)
        {
            var colorClose = that.colorClose;
            var colorFar = that.colorFar;
            var distance = d.z / that.depth;
            var closeness = 1 - distance;
            var r = colorFar.r * distance + colorClose.r * closeness;
            r *= r * 255;
            var g = colorFar.g * distance + colorClose.g * closeness;
            g *= g * 255;
            var b = colorFar.b * distance + colorClose.b * closeness;
            b *= b * 255;
            return d3.rgb(r, g, b);
        }

        function scaleDepthR(d)
        {
            return d.radius * d.depthScale;
        }

        function scaleDepthX(d)
        {
            var xCenter = that.width / 2;
            return (d.x - xCenter) * d.depthScale + xCenter;
        }

        function scaleDepthY(d)
        {
            var yCenter = that.height / 2;
            return (d.y - yCenter) * d.depthScale + yCenter;
        }

        var dots = this.svg.selectAll('.dot')
            .data(nodes);

        dots.exit()
            .remove();

        var new_dots = dots.enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('stroke-width', 0);

        new_dots.merge(dots)
            .attr('style', function(d) { return 'z-index: ' + Math.round(d.z) + ';'; }) // SVG2 feature
            .attr('fill', scaleDepthFill)
            .attr('r', scaleDepthR)
            .attr('cx', scaleDepthX)
            .attr('cy', scaleDepthY);

        // callback for next frame
        window.requestAnimationFrame(function() { that.draw(nodes); })
    }

    randomSimulate()
    {
        var that = this;
        var nodes = this.createRandomNodes();
        this.simulate(nodes);
        window.requestAnimationFrame(function() { that.draw(nodes); });
    }

    Run()
    {
        this.randomSimulate();
    }
}


// Instantiation
window.onload = function()
{
    var star_sim = new Gravitation2(
        document.documentElement.clientWidth - 4,
        document.documentElement.clientHeight - 4);

    star_sim.Run();
}
