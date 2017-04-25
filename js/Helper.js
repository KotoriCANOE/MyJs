function randomRange(lower, upper)
{
    return Math.random() * (upper - lower) + lower;
}

function randomRangeInt(lower, upper)
{
    return Math.floor(Math.random() * (upper - lower + 1) + lower);
}

// fast remove an element from array
// break the original order
function arrayRemove(array, index)
{
    var last = array.pop();
    if(index < array.length) array[index] = last;
}

var ColorTable =
{
    t1: ['rgb(255,255,255)',
        'rgb(192,255,255)', 'rgb(255,192,255)', 'rgb(255,255,192)',
        'rgb(255,192,192)', 'rgb(192,255,192)', 'rgb(192,192,255)',
        'rgb(128,255,255)', 'rgb(255,128,255)', 'rgb(255,255,128)',
        'rgb(255,128,128)', 'rgb(128,255,128)', 'rgb(128,128,255)'],
};

class RateCounter
{
    constructor(sampleSize = 50, timeScale = 1000)
    {
        this.sampleSize = sampleSize;
        this.rateScale = this.sampleSize * timeScale;
        this.durations = new Array(this.sampleSize);

        for(var i = 0; i < this.sampleSize; ++i)
        {
            this.durations[i] = 0;
        }

        this.lastElapsed = 0;
        this.index = 0;
        this.sum = 0;
    }

    elapsed(elapsed)
    {
        var duration = elapsed - this.lastElapsed;
        this.lastElapsed = elapsed;
        this.sum += duration - this.durations[this.index];
        this.durations[this.index] = duration;
        this.index = ++this.index % this.sampleSize;
    }

    rate()
    {
        return this.rateScale / this.sum;
    }

    drawCanvas(context, clear = false, x = 10, y = 20,
        size = 15, prefix = 'Rate: ', fill = 'white')
    {
        var text = prefix + this.rate();
        if(clear) context.clearRect(x, y - size, text.length * size, size);
        context.font = size + 'px Consolas';
        context.fillStyle = fill;
        context.fillText(text, x, y);
    }
}
