function randomRange(lower, upper)
{
    return Math.random() * (upper - lower) + lower;
}

function randomRangeInt(lower, upper)
{
    return Math.floor(Math.random() * (upper - lower + 1) + lower);
}


class Gravitation1
{
    constructor(width, height, maxNodesNum = 512, scale = 4, maxSpeed = null, minSpeed = null)
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
        
        this.radRange = [0.5,5];
        this.simTick = 5; // ms

        // options
        this.width = width;
        this.height = height;
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
            this.maxSpeed = Math.sqrt(xMaxSpeed * xMaxSpeed + yMaxSpeed * yMaxSpeed);
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
        var radius = randomRange(that.radRange[0], that.radRange[1]);
        var speed = randomRange(that.minSpeed, that.maxSpeed);
        var angleXY = randomRange(Math.PI * 0, Math.PI * 2);
        return {
            'radius': radius,
            'mass': radius * radius * radius * that.radius2mass,
            'fill': d3.hsl(randomRange(0, 360), 2 / 3, .5),
            'x': that.width / 2,
            'y': that.height / 2,
            'vx': speed * Math.cos(angleXY),
            'vy': speed * Math.sin(angleXY)
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
        var yAcc = this.yAcc;
        var yAccHalf = this.yAccHalf;

        for(var i = 0; i < nodesNum; ++i)
        {
            var node = nodes[i];

            // gravitation
            node.vy += yAcc;

            // update position
            node.x += node.vx;
            node.y += node.vy - yAccHalf;

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
        }
    }

    draw(nodes)
    {
        var that = this;

        var dots = this.svg.selectAll('.dot')
            .data(nodes);

        dots.exit()
            .remove();

        var new_dots = dots.enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('stroke-width', 0)
            .attr('fill', function(d, i) { return d.fill; })
            .attr('r', function(d, i) { return d.radius; })
            .attr('cx', function(d, i) { return d.x; })
            .attr('cy', function(d, i) { return d.y; });

        new_dots.merge(dots)
            .attr('cx', function(d, i) { return d.x; })
            .attr('cy', function(d, i) { return d.y; });

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
    var star_sim = new Gravitation1(
        document.documentElement.clientWidth - 4,
        document.documentElement.clientHeight - 4);

    star_sim.Run();
}
