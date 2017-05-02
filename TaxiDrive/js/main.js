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

        let tsPerSec = 1200; // elapsed timestamp per second
        this.simTick = 40; // simulation tick (microsecond)
        let tickPerSec = 1000 / this.simTick;
        this.tickTime = tsPerSec / tickPerSec;

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

        this.m1 = new Object();
        this.m2 = new Object();
        this.mSelect = 2;

        // scaling
        this.longiRange = [116, 116.8];
        let latiRangeHalf = (this.longiRange[1] - this.longiRange[0])
            / this.width * this.height * 0.5;
        this.latiRange = [39.9 - latiRangeHalf, 39.9 + latiRangeHalf];

        this.m1.xScale = d3.scaleLinear()
            .domain(this.longiRange)
            .rangeRound([0, width]);
        this.m1.yScale = d3.scaleLinear()
            .domain(this.latiRange)
            .rangeRound([height, 0]);

        this.m2.xScale = d3.scaleLinear()
            .domain(this.longiRange)
            .rangeRound([0, width]);
        this.m2.yScale = d3.scaleLinear()
            .domain(this.latiRange)
            .rangeRound([height, 0]);

        // color
        function opacity2color(opacity)
        {
            return Math.floor(0.5 / (1 - opacity));
        }

        {
            let opacityPerSec = 0.5;
            let opacityPerTick = Math.pow(opacityPerSec, 1 / tickPerSec);
            let backColor = opacity2color(opacityPerTick);
            this.m1.refreshColor = 'rgba(0,0,0,' + (1 - opacityPerTick) + ')';
            this.m1.backColor = 'rgb(' + backColor + ',' + backColor + ',' + backColor + ')';
            //this.m1.dotColor = 'rgb(255, 255, 128)';
        }

        {
            this.m2.backColor = 'rgb(0,0,0)';
        }
    }

    // Main methods
    initialize(data)
    {
        // initialize data
        data.nodes = new Array();
        data.index = 0;
        data.ts = 0;
        data.tsupper = 0;

        // initialize cumulate map
        data.cumulateMap = new Array(this.width * this.height);
        data.cumulateMap.fill(0);
        data.cumulateImage = this.context.createImageData(this.width, this.height);
        canvasImageInit(data.cumulateImage);
    }

    load(data)
    {
        let that = this;
        let csvPrefix = '_data/ts-split/dataset.timestamp.';
        let csvPostfix = '.csv';
        let csvNoUpper = 8;
        data.csvNo = 1;

        // load CSV with a callback on loading successful
        function loadCSV(data, callback)
        {
            if(data.csvNo < csvNoUpper)
            {
                let csv = csvPrefix + data.csvNo + csvPostfix;
                console.log('Loading ' + csv + ' ...');
                d3.csv(csv).get(function(d)
                {
                    data.nodes = d;
                    data.index = -1;
                    data.ts = +data.nodes[0].Timestamp;
                    data.tsupper = data.ts;
                    ++data.csvNo;
                    console.log('Successfully loaded!');
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
        let that = this;
        let dateTime = '';
        let mSelect = that.mSelect;
        let m = that['m' + mSelect];

        this.context.fillStyle = m.backColor;
        this.context.fillRect(-that.margin.left, -that.margin.top,
            that.canvas.attr('width'), that.canvas.attr('height'));

        // draw animation up to the limitation of display refreshing
        d3.interval(function(elapsed)
        {
            let m1 = that.m1;
            let m2 = that.m2;
            let mSelect = that.mSelect;
            let m = that['m' + mSelect];
            let width = that.width;
            let height = that.height;

            // assign from data
            let nodes = data.nodes;
            let index = data.index;
            let ts = data.ts;
            let tsupper = data.tsupper + that.tickTime;
            let length = nodes.length;
            let cumulateMap = data.cumulateMap;
            let cumulateImage = data.cumulateImage;
            let cumulateIData = data.cumulateImage.data;

            // skip if current data is not available or data's drawing is finished
            if(length <= 0 || index >= length) return;

            // Canvas refreshing
            let context = that.context;

            if(mSelect === 1)
            {
                context.fillStyle = that.m1.refreshColor;
                context.fillRect(-that.margin.left, -that.margin.top,
                    that.canvas.attr('width'), that.canvas.attr('height'));
            }

            // Canvas drawing
            while(++index < length)
            {
                let d = nodes[index];
                ts = +d.Timestamp;
                if(ts >= tsupper) break;
                let longitude = +d.Longitude;
                let latitude = +d.Latitude;

                // draw to instant map
                if(mSelect === 1)
                {
                    let x = m1.xScale(longitude);
                    let y = m1.yScale(latitude);
                    let fill = d3.interpolateRainbow((+d.TaxiID - 1) / 10356);
                    context.fillStyle = fill;
                    context.fillRect(x, y, 1, 1);
                }

                // accumulate to cumulate map
                {
                    let x = m2.xScale(longitude);
                    let y = m2.yScale(latitude);
                    if(x >= 0 && x < width && y >= 0 && y < height)
                    { // filter out of boundary data
                        let index = width * y + x;
                        let value = cumulateMap[index] += 1;
                        let color = d3.color(d3.interpolateInferno(
                            Math.min(1, Math.log2(value + 1) * 0.125)));
                        let index2 = index * 4;
                        cumulateIData[index2] = color.r;
                        cumulateIData[index2 + 1] = color.g;
                        cumulateIData[index2 + 2] = color.b;
                    }
                }
            }

            // draw to cumulate map
            if(mSelect === 2)
            {
                context.putImageData(cumulateImage, 0, 0);
            }

            // draw DateTime
            if(index < length && index > 1) dateTime = nodes[index - 1].DateTime;
            canvasDrawText(context, dateTime, m.backColor, 10, 20, 15);

            // assign to data
            data.index = index;
            data.ts = ts;
            data.tsupper = tsupper;
        }, that.simTick);
    }

    Run()
    {
        let data = new Object();
        this.initialize(data);
        this.load(data);
        this.draw(data);
    }
}
