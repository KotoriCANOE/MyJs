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
    constructor(width, height, maxNodesNum = 1024, xMaxSpeed = null, yMaxSpeed = null)
    {
        // physics constants
        this.g = 9.81

        // constants
        this.margin = {
            left: 5,
            top: 5,
            right: 5,
            bottom: 5
        };
        
        this.radRange = [0.5,5];
        this.colorTable = ['rgb(255,255,255)',
            'rgb(192,255,255)', 'rgb(255,192,255)', 'rgb(255,255,192)',
            'rgb(255,192,192)', 'rgb(192,255,192)', 'rgb(192,192,255)',
            'rgb(128,255,255)', 'rgb(255,128,255)', 'rgb(255,255,128)',
            'rgb(255,128,128)', 'rgb(128,255,128)', 'rgb(128,128,255)'];

        this.tickPerSecond = 25;
        this.transitionTime = 1000 / this.tickPerSecond;
        this.yAcc = this.g / this.tickPerSecond;
        this.yAccHalf = this.yAcc / 2;

        // options
        this.width = width;
        this.height = height;
        this.maxNodesNum = maxNodesNum;
        if(!xMaxSpeed) this.xMaxSpeed = this.width / 5 / this.tickPerSecond;
        else this.xMaxSpeed = xMaxSpeed;
        if(!yMaxSpeed) this.yMaxSpeed = Math.sqrt(this.height * 2 * this.yAcc);
        else this.yMaxSpeed = yMaxSpeed;

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
        return {
            'index': i,
            'x': that.width / 2,
            'y': that.height,
            'vx': randomRange(-that.xMaxSpeed, that.xMaxSpeed),
            'vy': randomRange(-that.yMaxSpeed, 0),
            'radius': randomRange(that.radRange[0], that.radRange[1]),
            'fill': that.colorTable[randomRangeInt(0, that.colorTable.length - 1)]
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
        var nodesNum = nodes.length;

        // initialize simulation
        var simulation = d3.forceSimulation()
            .alphaDecay(0)
            .velocityDecay(0)
            .stop();

        // force simulation
        var forceCollide = d3.forceCollide()
            .strength(1)
            .iterations(1);

        var forceCustom = function()
        {
            var g = that.g;
            var width = that.width;
            var height = that.height;
            var yAcc = that.yAcc;
            var yAccHalf = that.yAccHalf;
            var createRandomNode = that.createRandomNode;

            for(var i = 0; i < nodesNum; ++i)
            {
                var node = nodes[i];

                // gravitation
                node.vy += yAcc;

                // update position
                node.x += node.vx;
                node.y += node.vy - yAccHalf;

                // collision detection
                /*if(node.x < 0 || node.x > width)
                { // reset node if out of the left/right boundary
                    node = createRandomNode(i, that);
                }*/
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
                else if(node.y > height)
                { // reflect if hitting the ground
                    node.y = height + height - node.y;
                    node.vy = -node.vy + yAcc;
                }
            }
        };

        simulation//.force('collide', forceCollide)
            .force('custom', forceCustom);

        // draw and transition
        this.draw(nodes, simulation);
    }

    draw(nodes, simulation)
    {
        var that = this;
        
        var t = d3.transition()
            .duration(this.transitionTime)
            .ease(d3.easeLinear);

        var dots = this.svg.selectAll('.dot')
            .data(nodes);

        dots.exit()
            .remove();

        var new_dots = dots.enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('stroke', 'none')
            .attr('fill', function(d, i) { return d.fill; })
            .attr('r', function(d, i) { return d.radius; })
            .attr('cx', function(d, i) { return d.x; })
            .attr('cy', function(d, i) { return d.y; });

        new_dots.merge(dots)
            .transition(t)
            .attr('fill', function(d, i) { return d.fill; })
            .attr('r', function(d, i) { return d.radius; })
            .attr('cx', function(d, i) { return d.x; })
            .attr('cy', function(d, i) { return d.y; });

        // update simulation
        simulation.tick();

        // callback on end of transition
        t.on('end', function() { that.draw(nodes, simulation); });
    }

    randomSimulate()
    {
        var randomNodes = this.createRandomNodes();
        this.simulate(randomNodes);
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
