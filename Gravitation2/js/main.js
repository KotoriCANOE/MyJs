function randomRange(lower, upper)
{
    return Math.random() * (upper - lower) + lower;
}

function randomRangeInt(lower, upper)
{
    return Math.floor(Math.random() * (upper - lower + 1) + lower);
}


class Vector3
{
    constructor(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    copy() { return new Vector3(this.x, this.y, this.z); }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    sqrLength() { return this.x * this.x + this.y * this.y + this.z * this.z; }
    normalize() { var inv = 1/this.length(); return new Vector3(this.x * inv, this.y * inv, this.z * inv); }
    negate() { return new Vector3(-this.x, -this.y, -this.z); }
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    subtract(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
    multiply(f) { return new Vector3(this.x * f, this.y * f, this.z * f); }
    divide(f) { var invf = 1/f; return new Vector3(this.x * invf, this.y * invf, this.z * invf); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) { return new Vector3(-this.z * v.y + this.y * v.z, this.z * v.x - this.x * v.z, -this.y * v.x + this.x * v.y); }
}

Vector3.zero = new Vector3(0, 0, 0);


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
            'position': new Vector3(that.width / 2, that.height / 2, z),
            'velocity': new Vector3(speedXZ * Math.cos(longitude),
                speed * Math.sin(latitude), speedXZ * Math.sin(longitude)),
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

        // run continuously by ticks
        d3.interval(function()
        {
            var nodesNum = nodes.length;
            var width = that.width;
            var height = that.height;
            var depth = that.depth;
            var yAcc = that.yAcc;
            var yAccHalf = that.yAccHalf;
            var innerScale = that.innerScale;

            // force simulation
            for(var i = 0; i < nodesNum; ++i)
            {
                var node = nodes[i];
                var pos = node.position;
                var vel = node.velocity;

                // gravitation
                vel.y += yAcc;

                // update position
                pos.x += vel.x;
                pos.y += vel.y - yAccHalf;
                pos.z += vel.z;

                // collision detection
                if(pos.x < 0)
                { // reflect if hitting left wall
                    pos.x = -pos.x;
                    vel.x = -vel.x;
                }
                else if(pos.x > width)
                { // reflect if hitting right wall
                    pos.x = width + width - pos.x;
                    vel.x = -vel.x;
                }

                if(pos.y > height)
                { // reflect if hitting the ground
                    pos.y = height + height - pos.y;
                    vel.y = yAcc - vel.y;
                }

                if(pos.z < 0)
                { // reflect if hitting outer wall
                    pos.z = -pos.z;
                    vel.z = -vel.z;
                }
                else if(pos.z > depth)
                { // reflect if hitting inner wall
                    pos.z = depth + depth - pos.z;
                    vel.z = -vel.z;
                }

                // update hint
                node.depthScale = 1 - (1 - innerScale) * pos.z / depth;
            }
        }, this.simTick);
    }

    draw(nodes)
    {
        var that = this;

        function scaleDepthFill(d)
        {
            var colorClose = that.colorClose;
            var colorFar = that.colorFar;
            var zDistance = d.position.z / that.depth;
            var closeness = 1 - zDistance;
            var r = colorFar.r * zDistance + colorClose.r * closeness;
            r *= r * 255;
            var g = colorFar.g * zDistance + colorClose.g * closeness;
            g *= g * 255;
            var b = colorFar.b * zDistance + colorClose.b * closeness;
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
            return (d.position.x - xCenter) * d.depthScale + xCenter;
        }

        function scaleDepthY(d)
        {
            var yCenter = that.height / 2;
            return (d.position.y - yCenter) * d.depthScale + yCenter;
        }

        d3.timer(function(elapsed)
        {
            var dots = that.svg.selectAll('.dot')
                .data(nodes);

            dots.exit()
                .remove();

            var new_dots = dots.enter()
                .append('circle')
                .attr('class', 'dot')
                .attr('stroke-width', 0);

            new_dots.merge(dots)
                .attr('style', function(d) { return 'z-index: ' + Math.round(d.position.z) + ';'; }) // SVG2 feature
                .attr('fill', scaleDepthFill)
                .attr('r', scaleDepthR)
                .attr('cx', scaleDepthX)
                .attr('cy', scaleDepthY);
        });
    }

    randomSimulate()
    {
        var that = this;
        var nodes = this.createRandomNodes();
        this.simulate(nodes);
        this.draw(nodes);
    }

    Run()
    {
        this.randomSimulate();
    }
}


// Instantiation
window.onload = function()
{
    var instance = new Gravitation2(
        document.documentElement.clientWidth - 4,
        document.documentElement.clientHeight - 4);

    instance.Run();
}
