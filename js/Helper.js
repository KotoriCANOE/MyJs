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
