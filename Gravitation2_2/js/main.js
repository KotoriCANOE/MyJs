class Gravitation2_2 extends Gravitation2
{
    constructor(width, height, depth = null,
        maxNodesNum = 2048, scale = 4, speed = null)
    {
        super(width, height, depth, maxNodesNum, scale, speed);
    }

    // Main methods
    draw(data)
    {
        var that = this;
        var fpsCounter = new RateCounter(50, 1000);

        this.context.fillStyle = 'rgb(2,2,2)'
        this.context.fillRect(-that.margin.left, -that.margin.top,
            that.canvas.attr('width'), that.canvas.attr('height'));

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

        d3.timer(function(elapsed)
        {
            // sort nodes by descending z-depth
            data.nodes.sort(function(a, b)
            {
                return b.position.z - a.position.z;
            });

            // Canvas drawing
            var context = that.context;

            context.fillStyle = 'rgba(0,0,0,0.2)'
            context.fillRect(-that.margin.left, -that.margin.top,
                that.canvas.attr('width'), that.canvas.attr('height'));

            var PI2 = Math.PI * 2;
            var xCenter = that.width / 2;
            var yCenter = that.height / 2;

            data.nodes.forEach(function(d)
            {
                var pos = d.position;
                var depthScale = that.depthScale(pos.z);
                var x = (pos.x - xCenter) * depthScale + xCenter;
                var y = (pos.y - yCenter) * depthScale + yCenter;
                var r = Math.max(0, d.radius * depthScale);

                context.fillStyle = scaleDepthFill(d);
                context.beginPath();
                context.arc(x, y, r, 0, PI2);
                context.closePath();
                context.fill();
            });

            // draw FPS
            fpsCounter.elapsed(elapsed);
            fpsCounter.drawCanvas(context, true, 10, 20, 15, 'FPS: ');
        });
    }
}
