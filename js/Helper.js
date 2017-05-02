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
    let last = array.pop();
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

        for(let i = 0; i < this.sampleSize; ++i)
        {
            this.durations[i] = 0;
        }

        this.lastElapsed = 0;
        this.index = 0;
        this.sum = 0;
    }

    elapsed(elapsed)
    {
        let duration = elapsed - this.lastElapsed;
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
        canvasDrawRate(context, this.rate(), clear, x, y, size, fill, prefix);
    }
}

function canvasDrawText(context, text, clear = false, x = 10, y = 20,
    size = 15, fill = 'white')
{
    if(clear)
    {
        if(clear === true) context.fillStyle = 'rgb(0,0,0)';
        else context.fillStyle = clear;
        context.fillRect(x, y - size, text.length * size, size);
    }
    context.font = size + 'px Consolas';
    context.fillStyle = fill;
    context.fillText(text, x, y);
}

function canvasDrawRate(context, rate, clear = false, x = 10, y = 20,
    size = 15, prefix = 'Rate: ', fill = 'white')
{
    canvasDrawText(context, prefix + rate, clear, x, y, size, fill);
}

function canvasImageInit(image)
{
    let iData = image.data;
    let length = image.width * image.height * 4;
    for(let index = 0; index < length; index += 4)
    {
        iData[index] = 0;
        iData[index + 1] = 0;
        iData[index + 2] = 0;
        iData[index + 3] = 255;
    }
}

function canvasImageFill(image, r, g, b, a = 255)
{
    let data = image.data;
    let upper = image.width * image.height * 4;
    for(let index = 0; index < upper; index += 4)
    {
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = a;
    }
}

function canvasImagePixel(image, x, y, r, g, b, a = 255)
{
    let index = (x + y * image.width) * 4;
    let data = image.data;
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    data[index + 3] = a;
}

function canvasDataPixel(data, width, x, y, r, g, b, a = 255)
{
    let index = (x + y * width) * 4;
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    data[index + 3] = a;
}

function canvasDataValue(data, width, x, y, v, a = 255)
{
    let index = (x + y * width) * 4;
    data[index] = v;
    data[index + 1] = v;
    data[index + 2] = v;
    data[index + 3] = a;
}
