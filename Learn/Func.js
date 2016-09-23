var timeStamp = 1472777584;
var date = new Date((timeStamp*1000))
printTime(date);

var timeStamp = 1472713200;
var date = new Date((timeStamp*1000))
printTime(date);

var timeStamp = 1472716800;
var date = new Date((timeStamp*1000))
printTime(date);






function printTime (date) {
    console.log(date.getFullYear()+"-"+date.getMonth()+"-"+date.getDay()+", "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds())
}
