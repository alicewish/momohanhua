function isMacOS() {
    return ($.os.toLowerCase().indexOf('mac') >= 0);
}

function getUserName() {
    return (isMacOS()) ? $.getenv("USER") : $.getenv("USERNAME");
}

var userName = getUserName();

//================全局参数区================
var logList = ['提示'];

//忽略文件夹
var pIgnore = new RegExp("( copy|-|填字)$", "g");
//忽略图片
var pLettered = new RegExp("(填字|加框|分框| copy| 拷贝|Whiten|修图|涂白)$", "g");
var pPage = new RegExp("^(\\d{2,4}-\\d{2,4}|\\d{2,4})$", "g");

// var pMeta = new RegExp("^(\\d{1,5},\\d{1,5},\\d{1,3},\\d{1,3},\\d{1,3}|\\d{1,5},\\d{1,5}|\\d{1,3},\\d{1,3},\\d{1,3})", "g");
var pBubbleMeta = new RegExp("(\\d{1,5}),(\\d{1,5})~(\\d{1,3})~(Left Title|Left|Center|Right)~(\\d{1,3}),(\\d{1,3}),(\\d{1,3})~(.*)", "g");

//================判断系统================
var systemOS, mainComicPath, logInfo;

//在Windows下，路径也必须都用“/”
if ($.os.search(/windows/i) != -1) {
    systemOS = "windows";
    mainComicPath = "C:/Users/" + userName + "/Dropbox/Data/ComicProcess";
} else {
    systemOS = "macintosh";
    mainComicPath = "/Users/" + userName + "/Dropbox/Data/ComicProcess";
}

var mainComicFolder = new Folder(mainComicPath);

//================初始化标尺、字体单位设置================
var originalUnit = preferences.rulerUnits;
preferences.rulerUnits = Units.PIXELS;
var originalTypeUnit = preferences.typeUnits;
preferences.typeUnits = TypeUnits.POINTS;

app.preferences.rulerUnits = Units.PIXELS;
app.preferences.typeUnits = TypeUnits.PIXELS;
app.preferences.pointSize = PointType.POSTSCRIPT;

function trim(str) {
    return str;
}

//================读取文本到数组================
function text2array(text_path) {
    //================输入文本文档================
    var myTextFile = new File(text_path);
    var myLineArray = [];

    if (myTextFile.exists) {
        myTextFile.open("r");
        while (!myTextFile.eof) {
            var line = myTextFile.readln();
            myLineArray.push(trim(line));
        }
        myTextFile.close();
    }
    return myLineArray
}

function array2pages(myLineArray) {
    var pageNumIndexes = [];
    var k = 0;
    for (var lineIndex = 0; lineIndex < myLineArray.length; lineIndex++) {
        var thisLine = myLineArray[lineIndex];
        if (pPage.test(thisLine)) {
            pageNumIndexes[k] = lineIndex;
            k++;
        }
    }
    pageNumIndexes[k] = myLineArray.length;//结尾标记点

    var pageContents = [];
    for (var m = 0; m < pageNumIndexes.length - 1; m++) {
        var thisPage = myLineArray.slice(pageNumIndexes[m] + 1, pageNumIndexes[m + 1]);
        //================去掉开头结尾的空行================
        if (trim(thisPage[0]) === '') {
            thisPage.shift()
        }
        if (trim(thisPage[thisPage.length - 1]) === '') {
            thisPage.pop()
        }
        //================读取所有空行所在行数================
        var emptyRowIndexes = [0];//起始点
        var u = 1;
        for (var emptyLineIndex = 0; emptyLineIndex < thisPage.length; emptyLineIndex++) {
            if (thisPage[emptyLineIndex] === "") {
                emptyRowIndexes[u] = emptyLineIndex;
                u++;
            }
        }
        emptyRowIndexes.push(thisPage.length);//结束点

        //================对每个气泡================
        var bubbleContents = [];
        for (var mm = 0; mm < emptyRowIndexes.length - 1; mm++) {
            var thisBubble = thisPage.slice(emptyRowIndexes[mm], emptyRowIndexes[mm + 1]);
            //================去掉开头结尾的空行================
            if (trim(thisBubble[0]) === '') {
                thisBubble.shift()
            }
            if (trim(thisBubble[thisBubble.length - 1]) === '') {
                thisBubble.pop()
            }
            bubbleContents.push(thisBubble)
        }
        pageContents.push(bubbleContents);
    }
    return pageContents
}


function processFolderPic(folderPath, bgFileList, pageContents) {
    var outOption = new PhotoshopSaveOptions;
    outOption.embedColorProfile = true;
    outOption.alphaChannels = true;

    //================对每张图片================
    for (var h = 0; h < bgFileList.length; h++) {
        var currentFile = bgFileList[h];
        var currentFileName = currentFile.displayName;
        var index = currentFileName.lastIndexOf(".");
        var ext = currentFileName.substr(index + 1);
        var currentFileStem = currentFileName.split('.').slice(0, -1).join('.');

        var whitenFile = new File(folderPath + '/' + currentFileStem + '-Whiten.png');
        var outputFile = new File(folderPath + '/' + currentFileStem + '.psd');

        if (whitenFile.exists) {
            var openlayer = open(whitenFile);

            //激活当前图层。
            var layer = app.activeDocument.activeLayer;

            //复制当前图层。
            layer.copy();

            //不保存即关闭涂白文件。
            openlayer.close(SaveOptions.DONOTSAVECHANGES);

        }
        //打开原始图片。
        var bgFile = open(currentFile);
        var docRef = app.activeDocument;//当前打开的文档

        //读取文档DPI
        // if (docRef.resolution < 200) {
        //     docRef.resizeImage(undefined, undefined, 200, ResampleMethod.NONE)
        // }
        var docDPI = docRef.resolution

        //读取文档宽度与高度
        var width = docRef.width;
        var height = docRef.height;

        //定义一个变量layer_bg，用来表示Photoshop的当前图层。
        var layer_bg = docRef.activeLayer;

        if (whitenFile.exists) {
            //调用document对象的paste方法，将内存中的拷贝，粘贴到当前文档。
            var layer_image = docRef.paste();
        }

        var bubbleContents = pageContents[h];

        //================对每个气泡================
        for (var b = 0; b < bubbleContents.length; b++) {
            var thisBubble = bubbleContents[b];
            var info_str = thisBubble[0];

            var coorX = width * (b + 1) / (bubbleContents.length + 1);
            var coorY = height * (b + 1) / (bubbleContents.length + 1);

            var red = 0;
            var green = 0;
            var blue = 0;

            var alignment = '';
            var font_size = '';
            var font_name = '';

            // alert(info_str);

            if (pBubbleMeta.test(info_str)) {
                info_str = thisBubble.shift();

                coorX = parseInt(RegExp.$1);
                coorY = parseInt(RegExp.$2);

                font_size = RegExp.$3;
                alignment = RegExp.$4;

                red = parseInt(RegExp.$5);
                green = parseInt(RegExp.$6);
                blue = parseInt(RegExp.$7);

                font_name = RegExp.$8;

            } else {
                // alert(info_str);
            }

            var textColor = new SolidColor();//定义字体颜色
            textColor.rgb.red = red;
            textColor.rgb.green = green;
            textColor.rgb.blue = blue;

            var thisFontSize = 0;
            thisFontSize = parseInt(font_size);
            //注意DPI应为72
            //如果DPI为96则需添加thisFontSize = 0.75 * thisFontSize
            //thisFontSize = Math.round(0.75 * thisFontSize)
            thisFontSize = (72 / docDPI) * thisFontSize

            var contents4layer = thisBubble.join('\r');
            var thisFontName = font_name;

            var artLayerRef = docRef.artLayers.add();//添加图层
            artLayerRef.kind = LayerKind.TEXT;//转为文本图层
            var textItemRef = artLayerRef.textItem;

            textItemRef.antiAliasMethod = AntiAlias.STRONG; //消除锯齿方式
            /********************
             * 犀利=CRISP
             * 无=NONE
             * 锐利=SHARP
             * 平滑=SMOOTH
             * 浑厚=STRONG
             ********************/
            textItemRef.autoKerning = AutoKernType.OPTICAL; //字符间距微调
            /********************
             * 手动指定=MANUAL
             * 度量标准=METRICS
             * 视觉=OPTICAL（推荐这个，字距更为紧凑）
             ********************/
            textItemRef.direction = Direction.HORIZONTAL; //文本取向
            /********************
             * 水平=HORIZONTAL
             * 竖直=VERTICAL
             ********************/
            textItemRef.justification = Justification.CENTER; //对齐方式
            /********************
             * 左对齐=LEFT
             * 右对齐=RIGHT
             * 居中对齐=CENTER
             ********************/

            textItemRef.color = textColor;//字体颜色
            textItemRef.size = thisFontSize; //字号
            textItemRef.font = thisFontName; //字体

            if (alignment === 'Left Title' || alignment === 'Left') {
                textItemRef.justification = Justification.LEFT; //对齐方式
            }

            // The position of origin for the text. The array members specify the X and Y coordinates.
            // Equivalent to clicking the text tool at a point in the document to create the point of origin for text.
            //文本原点的位置。
            //等效于用文本工具单击文档中某个点以创建文本的原点。
            textItemRef.position = Array(coorX, coorY);//定位锚点位置
            textItemRef.contents = contents4layer;
        }

        app.doAction("行距调整", "填字.atn");
        app.doAction('更改为半角引号"', "填字.atn");

        //输出psd格式文件
        bgFile.saveAs(outputFile, outOption, 1, Extension.LOWERCASE);
        //不保存关闭处理后的文件
        bgFile.close(SaveOptions.DONOTSAVECHANGES);
    }
}

//================主体程序================
//================如果主文件夹存在================
if (mainComicFolder != null) {
    var mainFileList = mainComicFolder.getFiles();
    mainFileList.sort();//排序
    //================寻找下属文件夹================
    var mainFolderList = [];
    for (var i = 0; i < mainFileList.length; i++) {
        var currentFile = mainFileList[i];
        if (currentFile instanceof Folder && !pIgnore.test(currentFile.displayName)) {
            mainFolderList.push(currentFile);
        }
    }
    if (mainFolderList.length === 0) {
        // alert('无事可做💤');
    } else {
        //================选定第一个合适的下属文件夹================
        var currentFolder = mainFolderList[0];
        var currentFolderName = currentFolder.displayName;
        var folderPath = mainComicPath + '/' + currentFolderName;
        //================填字文档================
        text_path = mainComicPath + '/' + currentFolderName + '-7标记.txt';
        var myTextFile = new File(text_path);
        if (myTextFile.exists) {
            var myLineArray = text2array(text_path);
            var pageContents = array2pages(myLineArray);

            if (currentFolder != null) {
                var jpgList = currentFolder.getFiles("*.jpg");
                jpgList.sort();

                var bgFileList = [];
                for (var p = 0; p < jpgList.length; p++) {
                    var currentJpg = jpgList[p];
                    var currentFileName = currentJpg.displayName;
                    var index = currentFileName.lastIndexOf(".");
                    var ext = currentFileName.substr(index + 1);
                    var currentFileStem = currentFileName.split('.').slice(0, -1).join('.');
                    if (!pLettered.test(currentFileStem)) {
                        bgFileList.push(currentJpg);
                    }
                }

                if (bgFileList.length === pageContents.length && bgFileList.length > 0) {
                    processFolderPic(folderPath, bgFileList, pageContents);
                } else {
                    alert('图片张数：' + bgFileList.length + '\r' + '文稿页数：' + pageContents.length)
                }
            } else
                logList.push('未找到填字文档：' + currentFolderName);
        }
    }
}
logInfo = logList.join('\r');
