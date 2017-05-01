class TaxiDrive
{
    constructor(width, height)
    {
        // constants
        this.margin = {
            left: 5,
            top: 5,
            right: 5,
            bottom: 5
        };

        this.checkDuration = 200; // duration for checking data re-loading (microsecond)

        var tsPerSec = 360; // elapsed timestamp per second
        this.simTick = 40; // simulation tick (microsecond)
        var tickPerSec = 1000 / this.simTick;
        this.tickTime = tsPerSec / tickPerSec;
        this.longiRange = [116, 116.8];
        var latiRangeHalf = (this.longiRange[1] - this.longiRange[0]) / width * height * 0.5;
        this.latiRange = [39.9 - latiRangeHalf, 39.9 + latiRangeHalf];

        // options
        this.width = width;
        this.height = height;

        // initialization
        this.canvas = d3.select("#vis")
            .append("canvas")
                .attr('width', this.width)
                .attr('height', this.height);
        this.context = this.canvas.node().getContext('2d');

        this.context.translate(this.margin.left, this.margin.top);
        this.width -= this.margin.left + this.margin.right;
        this.height -= this.margin.top + this.margin.bottom;

        this.xScale = d3.scaleLinear()
            .domain(this.longiRange)
            .range([0, width]);
        this.yScale = d3.scaleLinear()
            .domain(this.latiRange)
            .range([height, 0]);

        // color
        function opacity2color(opacity)
        {
            return Math.floor(0.5 / (1 - opacity));
        }

        var opacityPerSec = 0.65;
        var opacityPerTick = Math.pow(opacityPerSec, 1 / tickPerSec);
        var backColor = 0;//opacity2color(opacityPerTick)
        this.m1 = {
            refreshColor: 'rgba(0,0,0,' + (1 - opacityPerTick) + ')',
            backColor: 'rgb(' + backColor + ',' + backColor + ',' + backColor + ')',
            dotColor: 'rgb(255, 255, 128)',
        }
    }

    // Main methods
    initialize(data)
    {
        data.nodes = new Array();
        data.index = 0;
        data.ts = 0;
        data.tsupper = 0;
    }

    load(data)
    {
        var that = this;
        var csvPrefix = '_data/ts-split/dataset.timestamp.';
        var csvPostfix = '.csv';
        var csvNo = 1;
        var csvNoUpper = 8;

        // load CSV with a callback on loading successful
        function loadCSV(data, callback)
        {
            if(csvNo < csvNoUpper)
            {
                var csv = csvPrefix + csvNo + csvPostfix;
                console.log('Loading...: ' + csv);
                d3.csv(csv)
                    /*.row(function(d)
                    {
                        return {
                            taxiID: +d.TaxiID,
                            dateTime: d.DateTime,
                            longitude: +d.Longitude,
                            latitude: +d.Latitude,
                            timestamp: +d.Timestamp
                        }
                    })*/
                    .get(function(d)
                    {
                        data.nodes = d;
                        data.index = -1;
                        data.ts = +data.nodes[0].Timestamp;
                        data.tsupper = data.ts;
                        ++csvNo;
                        callback();
                    });
            }
        }

        // check for data (re-)loading in fixed time interval
        function waitLoad(data)
        {
            function handler()
            {
                if(data.index < data.nodes.length)
                { // when current data is still drawing, wait for next check
                    setTimeout(handler, that.checkDuration);
                }
                else
                { // when current data is completed, load next data
                    loadCSV(data, function() { waitLoad(data); });
                }
            }

            setTimeout(handler, that.checkDuration);
        }

        // initial loading
        loadCSV(data, function() { waitLoad(data); });
    }

    draw(data)
    {
        var that = this;
        var fpsCounter = new RateCounter(50, 1000);

        this.context.fillStyle = that.m1.backColor;
        this.context.fillRect(-that.margin.left, -that.margin.top,
            that.canvas.attr('width'), that.canvas.attr('height'));

        // draw animation up to the limitation of display refreshing
        d3.interval(function(elapsed)
        {
            // assign from data
            var nodes = data.nodes;
            var index = data.index;
            var ts = data.ts;
            var tsupper = data.tsupper + that.tickTime;
            var length = nodes.length;

            // skip if current data's drawing is finished
            if(index >= length) return;

            // Canvas refreshing
            var context = that.context;

            context.fillStyle = that.m1.refreshColor;
            context.fillRect(-that.margin.left, -that.margin.top,
                that.canvas.attr('width'), that.canvas.attr('height'));

            // Canvas drawing
            while(++index < length)
            {
                var d = nodes[index];
                ts = +d.Timestamp;
                if(ts >= tsupper) break;

                var x = that.xScale(+d.Longitude);
                var y = that.yScale(+d.Latitude);

                context.fillStyle = that.m1.dotColor;
                context.fillRect(x, y, 1, 1);
            }

            // draw FPS
            fpsCounter.elapsed(elapsed);
            fpsCounter.drawCanvas(context, true, 10, 20, 15, 'FPS: ');

            // assign to data
            data.index = index;
            data.ts = ts;
            data.tsupper = tsupper;
        }, that.simTick);
    }

    Run()
    {
        var data = new Object();
        this.initialize(data);
        this.load(data);
        this.draw(data);
    }
}
