/**
 * @license Copyright © 2015 SickRed (https://github.com/SickRed/AutomaticAlternativeSelector)
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */


//(function () {
var logchatlater = [];  //Message Storage
var thisPageUsingOtherJSLibrary = false;    //jQuery

/**
 * Logs a message to plugdjs chat if its loaded already. Otherwise its storing the message
 * @param message
 */
function logChat(message) {
    if($('#chat-messages').length) {

        if(logchatlater.length > 0){
            var latermsg = null;
            while(latermsg = logchatlater.pop()){
                API.chatLog(latermsg);
            }
        }

        if(message != null)
            API.chatLog(message);
    }
    else{
        logchatlater.push(message);
    }
}

/**
 * Debug output for arrays
 * @param arr
 */
function printarr(arr){
    for(var i = 0; i < arr.length; i++)
        console.log("Arr Pos: " + i + " = " + arr[i].author + " - " +arr[i].title);
}

/**
 * @type {{version: string, name: string, author: string, repo: string, checkintervalInSec: number, activate: Function, deactivate: Function, timer: {timeout: null, start: Function, stop: Function, checkAndRestart: Function}, videoplayback: {onPlayerStateChange: Function}, checkpage: Function, nowplaying: {title: null, author: null, duration: null, refresh: Function}, videoBox: {playerid: string, setVideo: Function}, alternativeVideos: {isdialogopened: boolean, alternatives: Array, alternatives_titlesort: Array, alternatives_durationsort: Array, besstfittingtitle: Function, closestDuration: Function, refresh: Function}}}
 */
var AlternativeSelectorBot = {

    version: "1.0",
    name: "AlternativeSelectorBot",
    author: "SickRed",
    repo_raw: "https://rawgit.com/sickred/AlternativeSelectorBot/",
    repo: "https://github.com/SickRed/AutomaticAlternativeSelector",

    //Settings
    checkintervalInSec: 3,


    activate: function () {
        AlternativeSelectorBot.timer.start();
    },

    deactivate: function () {
        AlternativeSelectorBot.timer.stop();
    },

    timer: {

        timeout: null,
        start: function () {
            var millisec = Number(AlternativeSelectorBot.checkintervalInSec * 1000);
            this.timeout = setTimeout(function () {
                AlternativeSelectorBot.timer.checkAndRestart()
            }, millisec);
        },
        stop: function () {
            if (this.timeout != null)
                clearTimeout(this.timeout);
        },
        checkAndRestart: function () {
            AlternativeSelectorBot.checkpage();
            if(logchatlater.length > 0)
                logChat(null);
            this.start();
        }
    },

    //videoplayback: {
    //    onPlayerStateChange: function(event) {
    //        if (event.data == YT.PlayerState.PLAYING && !done) {
    //            setTimeout(stopVideo, 6000);
    //            done = true;
    //        }
    //    }
    //},

    checkpage: function () {


        /*  TODO: Detect if video is not playing but alternative videos popup failed    */
        //var videoplaying = true;
        //if(videoplaying)
        //    return;

        /*  Refresh status  */
        AlternativeSelectorBot.nowplaying.refresh();
        AlternativeSelectorBot.alternativeVideos.refresh();

        /*  Click opened alternative Videos dialogue if it's opened */
        if (AlternativeSelectorBot.alternativeVideos.isdialogopened) {

            var closestDurArr = AlternativeSelectorBot.alternativeVideos.closestDuration(AlternativeSelectorBot.nowplaying.duration);
            var closestTitArr = AlternativeSelectorBot.alternativeVideos.besstfittingtitle(AlternativeSelectorBot.nowplaying.author, AlternativeSelectorBot.nowplaying.title);
            closestTitArr.getPos = function(altobj){
                for(var i = 0; i < closestTitArr.length; i++){
                    if(closestTitArr[i] == altobj)
                        return i;
                }
            };
            closestDurArr.getPos = function(altobj){
                for(var i = 0; i < closestTitArr.length; i++){
                    if(closestDurArr[i] == altobj)
                        return i;
                }
            };

            if (closestDurArr[0] == closestTitArr[0])
                var closest = closestTitArr[0];
            else {

                //console.log("titles:");
                //printarr(closestTitArr);
                //console.log("Befor:");
                //printarr(closestDurArr);

                var maxTitlePos = Number(closestTitArr.length * 0.4);
                for (var i = closestTitArr.length - 1; i > maxTitlePos; i--){
                    closestDurArr.splice(closestDurArr.getPos(closestTitArr[i]), 1);
                    //console.log("removing: " + closestTitArr[i].title)
                }
                //console.log("Afters:");
                //printarr(closestDurArr);



                closestDurArr.sort(
                    function compareWithNames(a, b) {
                        console.log("sort: " + a.author + " - " + a.title + " vs " + b.author + " - " + b.title);
                        //
                        //if (closestTitArr.getPos(a) > maxTitlePos || closestTitArr.getPos(b) > maxTitlePos) {
                        //    if(closestTitArr.getPos(a) < maxTitlePos)
                        //    return - 1;
                        //    if(closestTitArr.getPos(b) < maxTitlePos)
                        //    return 1;
                        //    console.log("positions: " + closestTitArr.getPos(a) + " and " + closestTitArr.getPos(b) + " max: " + maxTitlePos);
                        //    return closestTitArr.getPos(a) - closestTitArr.getPos(b);
                        //}
                        if (a.durationdiff > 20 || b.durationdiff > 20){
                            //console.log("durations: " + a.durationdiff + " and " + b.durationdiff);
                            return a.durationdiff - b.durationdiff;
                        }
                        //console.log("positions: " +closestTitArr.getPos(a) + " and " + closestTitArr.getPos(b) + " max: " + maxTitlePos);
                        return closestTitArr.getPos(a) - closestTitArr.getPos(b);
                    }
                )
                //for (var i = 0; i < closestDurArr.length; i++) {
                //    console.log("Sorted " + i + ". "  + closestDurArr[i].title);
                //}
                closest = closestDurArr[0];
            }

            if (closest == null) {
                console.log("Error: No div found to click on, maybe it's not loaded yet");
                return;
            }
            var message = "Detected blocked video, will select from alternatives: " + closest.author + " - " + closest.title + " (" + closest.duration + ")";
            console.log(message);
            logChat(message);

            closest.div.mouseup();
            return;
        }
        else {

            ////TODO: If dialogue not there but video not playing refresh video
            //if (false) {
            //    $('#playback-controls').find('.refresh').click();
            //    console.log("Tryed refreshing video");
            //}
        }

    },

    nowplaying: {

        title: null,
        author: null,
        duration: null,
        refresh: function () {

            //this.author = $('#now-playing-media').find('.author').text();
            //this.title = $('#now-playing-media').text().replace(this.author, "").replace(/(\r\n|\n|\r)/gm, "").replace(/^.*-{1} +/i, "");
            //this.duration = $('#now-playing-time').text();

            this.author = API.getMedia().author;
            this.title = API.getMedia().title;
            this.duration = API.getMedia().duration;

            //console.log("NowPlaying Author:" + this.author);
            //console.log("NowPlayingTitle:" + this.title);
            //console.log("NowPlayingDuration:" + this.duration);
        }
    },

    videoBox: {

        playerid: 'player',
        setVideo: function (url) {
            $('#' + this.playerid).attr('src', url);
        }

    },

    alternativeVideos: {

        isdialogopened: false,
        alternatives: [],
        alternatives_titlesort: [],
        alternatives_durationsort: [],

        besstfittingtitle: function (author, title) {

            this.alternatives_titlesort = [];
            for (var i = 0; i < this.alternatives.length; i++) {
                this.alternatives_titlesort.push(this.alternatives[i]);
            }
            this.alternatives_titlesort.sort(
                function compare(a, b) {
                    a.titleequal = a.titleEquality(author, title);
                    b.titleequal = b.titleEquality(author, title);
                    return b.titleequal - a.titleequal;
                }
            )

            //for (var i = 0; i < this.alternatives_titlesort.length; i++) {
            //        console.log("Sorted " + i + ". "  + this.alternatives_titlesort[i].title);
            //}

            return this.alternatives_titlesort;
        },

        closestDuration: function (duration) {

            this.alternatives_durationsort = [];
            for (var i = 0; i < this.alternatives.length; i++) {
                this.alternatives_durationsort.push(this.alternatives[i]);
            }
            this.alternatives_durationsort.sort(
                function compare(a, b) {
                    a.durationdiff = a.durationDifference(duration);
                    b.durationdiff = b.durationDifference(duration);
                    return a.durationdiff - b.durationdiff;
                }
            )

            //for (var i = 0; i < this.alternatives_durationsort.length; i++) {
            //        console.log("Sorted " + i + ". "  + this.alternatives_durationsort[i].duration);
            //}

            return this.alternatives_durationsort;
        },

        refresh: function () {

            if ($('#dialog-restricted-media').length) {

                this.isdialogopened = true;
                console.log("RESTRICTION DETECTED: ");
                this.alternatives = [];
                $('#dialog-restricted-media').find('.row').each(function () {

                    var alternatObj = new Object();
                    alternatObj.author = $(this).find('.author').text();
                    alternatObj.title = $(this).find('.title').text();
                    alternatObj.duration = $(this).find('.duration').text();
                    alternatObj.div = $(this);

                    alternatObj.durationDifference = function (duration) {
                        var seconds = 0;
                        var date1 = new Date(2000, 1, 1, 12, Number(this.duration.split(':')[this.duration.split(':').length - 2]), Number(this.duration.split(':')[this.duration.split(':').length - 1]));
                        var date2 = new Date(2000, 1, 1, 12, Number(Math.floor(duration/60)), Number(duration % 60));
                        var diff = date2 - date1;
                        return Math.floor(diff / 1000) >= 0 ? Math.floor(diff / 1000) : Math.floor(diff / 1000) * -1;
                    };

                    alternatObj.titleEquality = function(author, title){
                        //console.log("REGGEX APPROACH;");
                        var points = 0;
                        var alternative = this.author + this.title;

                        //Build Regex
                        var regexarr = [];
                        var needescapearr = [".","\\","+","*","?","[","^","]","$","(",")","{","}","=","!","<",">","|",":","-"];
                        var escapeChar = function(char){
                            for(var i = 0; i < needescapearr.length; i++){
                                if(char == needescapearr[i])
                                    return "\\" + char;
                            }
                            return char;
                        };
                        var regstart = '/.*';
                        var regend = '.*/i';
                        var tmpreg = '';
                        for(var i = 0; i < author.length; i++){
                            if(tmpreg == '')
                                tmpreg = escapeChar(author.charAt(i));
                            else
                                tmpreg += '.?' + escapeChar(author.charAt(i));
                            regexarr.push( tmpreg );
                        }
                        tmpreg = '';
                        for(var i = 0; i < title.length; i++){
                            if(tmpreg == '')
                                tmpreg = escapeChar(title.charAt(i));
                            else
                                tmpreg += '.?' + escapeChar(title.charAt(i));
                            regexarr.push( tmpreg );
                        }

                        for(var i = 0; i < regexarr.length; i++){
                            //console.log("try regex:" + regexarr[i]);
                            if(alternative.match(new RegExp('.*' + regexarr[i] + '.*', 'i'))){
                                //console.log("Match: " + alternative + " - " + regstart + regexarr[i] + regend);
                                points++;
                            }
                            //else{
                            //    //console.log("No Match: " + alternative + " - " + regstart + regexarr[i] + regend);
                            //}
                        }
                        return points;
                    };

                    AlternativeSelectorBot.alternativeVideos.alternatives.push(alternatObj);
                });
            }
            else {
                this.isdialogopened = false;
            }
        }

    }


};

function activateBot(){
    AlternativeSelectorBot.activate();
    var message = AlternativeSelectorBot.name + " v" + AlternativeSelectorBot.version + " by " + AlternativeSelectorBot.author + " stared";
    console.log(message);
    logChat(message);
}

function loadjQueryCallback(jqueryloaded){
    if (!jqueryloaded) {
        var error = "ERROR! Could not load jQuery, this is essential for this bot to work";
        console.log(error);
        logChat(error);
    }
    else {
        console.log("jQuery present or loaded successfully");
        activateBot();
    }
}
function loadjQuery(callback) {
    if (typeof jQuery == 'undefined') {

        if (typeof $ == 'function') {
            thisPageUsingOtherJSLibrary = true;
        }

        function getScript(url, success) {

            var script = document.createElement('script');
            script.src = url;

            var head = document.getElementsByTagName('head')[0],
                done = false;

            script.onload = script.onreadystatechange = function () {

                if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
                    done = true;
                    success();
                    script.onload = script.onreadystatechange = null;
                    head.removeChild(script);
                }
            };
            head.appendChild(script);
        };

        getScript('http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js', function () {
            if (typeof jQuery == 'undefined') {
            } else {
                if (thisPageUsingOtherJSLibrary) {
                    return callback(true);
                } else {
                    return callback(false);
                }
            }
        });
    } else {
        return callback(true);
    }
}
loadjQuery(loadjQueryCallback);

//}).call(this);
