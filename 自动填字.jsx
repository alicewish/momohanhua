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

var percentage = 1.200000

//================判断系统================
var systemOS, mainComicPath, logInfo;

//在Windows下，路径也必须都用“/”
var shared
// shared = '/Dropbox/Data/'
shared = '/Documents/默墨汉化/'
if ($.os.search(/windows/i) !== -1) {
    systemOS = "windows";
    mainComicPath = "C:/Users/" + userName + shared + "ComicProcess";
    mainMangaPath = "C:/Users/" + userName + shared + "MangaProcess";
} else {
    systemOS = "macintosh";
    mainComicPath = "/Users/" + userName + shared + "ComicProcess";
    mainMangaPath = "/Users/" + userName + shared + "MangaProcess";
}

var mainComicFolder = new Folder(mainComicPath);
var mainMangaFolder = new Folder(mainMangaPath);

if (!mainComicFolder.exists) {
    mainComicFolder.create()
}
if (!mainMangaFolder.exists) {
    mainMangaFolder.create()
}

//================初始化标尺、字体单位设置================
var originalUnit = preferences.rulerUnits;
preferences.rulerUnits = Units.PIXELS;
var originalTypeUnit = preferences.typeUnits;
preferences.typeUnits = TypeUnits.POINTS;

preferences.rulerUnits = Units.PIXELS;
preferences.typeUnits = TypeUnits.PIXELS;
preferences.pointSize = PointType.POSTSCRIPT;

const idlayer = stringIDToTypeID("layer");
const idtextLayer = stringIDToTypeID("textLayer");
const idordinal = stringIDToTypeID("ordinal");
const idtargetEnum = stringIDToTypeID("targetEnum");
const idallEnum = stringIDToTypeID("allEnum");

const idnull = stringIDToTypeID("null");

const idfrom = charIDToTypeID("From");
const idto = stringIDToTypeID("to");

const idsize = stringIDToTypeID("size");
const idpixelsUnit = stringIDToTypeID("pixelsUnit");

const idfontPostScriptName = stringIDToTypeID("fontPostScriptName");

const idcolor = stringIDToTypeID("color");
const idRd = stringIDToTypeID("red");
const idGrn = stringIDToTypeID("grain");
const idBl = stringIDToTypeID("blue");
const idRGBColor = stringIDToTypeID("RGBColor");

const idsyntheticBold = stringIDToTypeID("syntheticBold");
const idsyntheticItalic = stringIDToTypeID("syntheticItalic");
const idunderline = stringIDToTypeID("underline");
const idunderlineOnLeftInVertical = stringIDToTypeID("underlineOnLeftInVertical");

const idtextStyle = stringIDToTypeID("textStyle");
const idtextStyleRange = stringIDToTypeID("textStyleRange");

const idset = stringIDToTypeID("set");

const idfind = stringIDToTypeID("find");
const idreplace = stringIDToTypeID("replace");
const idcheckAll = stringIDToTypeID("checkAll");
const idforward = stringIDToTypeID("forward");
const idcaseSensitive = stringIDToTypeID("caseSensitive");
const idwholeWord = stringIDToTypeID("wholeWord");
const idignoreAccents = stringIDToTypeID("ignoreAccents");
const idproperty = stringIDToTypeID("property");
const idusing = stringIDToTypeID("using");
const idfindReplace = stringIDToTypeID("findReplace");
const idparagraphStyle = stringIDToTypeID("paragraphStyle");

const idselectAllLayers = stringIDToTypeID("selectAllLayers");
const idselectNoLayers = stringIDToTypeID("selectNoLayers");

var psdOutOption = new PhotoshopSaveOptions;
psdOutOption.embedColorProfile = true;
psdOutOption.alphaChannels = true;


function trim(str) {
    return str;
}

/**
 * The setFormatting function sets the font, font style, point size, and RGB color of specified
 * characters in a Photoshop text layer.
 *
 * @param start (int) the index of the insertion point *before* the character you want.,
 * @param end (int) the index of the insertion point following the character.
 * @param fontPostScriptName is a string for the font postscript name.
 // * @param fontName is a string for the font name.
 // * @param fontStyle is a string for the font style.
 * @param fontSize (Number) the point size of the text.
 * @param colorArray (Array) is the RGB color to be applied to the text.
 */
function setFormatting(start, end, fontPostScriptName, fontSize, colorArray, bold, italic, underline) {
    //Sanity checking: is the active layer a text layer?
    var activeLayer = activeDocument.activeLayer
    if (activeLayer.kind === LayerKind.TEXT) {
        //More checking: does the text layer have content, and are start and end set to reasonable values?
        if ((activeLayer.textItem.contents !== "") && (start >= 0) && (end <= activeLayer.textItem.contents.length)) {

            //动作参考指向活动的文本图层 The action reference specifies the active text layer.
            var reference = new ActionReference();
            reference.putEnumerated(idtextLayer, idordinal, idtargetEnum);

            //第一层是action
            var action = new ActionDescriptor();
            action.putReference(idnull, reference);

            //第二层是textAction
            var textAction = new ActionDescriptor();

            //第三层是actionList
            //actionList包含了一连串格式化动作actionList contains the sequence of formatting actions.
            var actionList = new ActionList();

            //第四层是textRange
            //选定文本段 textRange sets the range of characters to format.
            var textRange = new ActionDescriptor();
            textRange.putInteger(idfrom, start);
            textRange.putInteger(idto, end);

            //第五层是formatting
            //The "formatting" ActionDescriptor holds the formatting. It should be clear that you can
            //add other attributes here--just get the relevant lines (usually 2) from the Script Listener
            //output and graft them into this section.
            var formatting = new ActionDescriptor();

            //字体PS名称 Font PostScript name.
            formatting.putString(idfontPostScriptName, fontPostScriptName);

            // //字体名称 Font name.
            // var idfontName = stringIDToTypeID("fontName");
            // formatting.putString(idfontName, fontName);
            // //字体样式 Font style.
            // var idfontStyleName = stringIDToTypeID("fontStyleName");
            // formatting.putString(idfontStyleName, fontStyle);

            //字体大小 Font size.
            formatting.putUnitDouble(idsize, idpixelsUnit, fontSize);

            //填充颜色 Fill color (as an RGB color).
            var colorAction = new ActionDescriptor();
            colorAction.putDouble(idRd, colorArray[0]);
            colorAction.putDouble(idGrn, colorArray[1]);
            colorAction.putDouble(idBl, colorArray[2]);
            formatting.putObject(idcolor, idRGBColor, colorAction);

            //仿粗
            formatting.putBoolean(idsyntheticBold, bold);
            //仿斜
            formatting.putBoolean(idsyntheticItalic, italic);
            //下划线
            if (underline) {
                formatting.putEnumerated(idunderline, idunderline, idunderlineOnLeftInVertical);
            }

            textRange.putObject(idtextStyle, idtextStyle, formatting);
            actionList.putObject(idtextStyleRange, textRange);
            textAction.putList(idtextStyleRange, actionList);
            action.putObject(idto, idtextLayer, textAction);
            executeAction(idset, action, DialogModes.NO);
        }
    }
}

function getTextAction(findStr, replaceStr) {
    var textAction = new ActionDescriptor();
    textAction.putString(idfind, findStr)
    textAction.putString(idreplace, replaceStr);
    textAction.putBoolean(idcheckAll, true);
    textAction.putBoolean(idforward, false);
    textAction.putBoolean(idcaseSensitive, false);
    textAction.putBoolean(idwholeWord, false);
    textAction.putBoolean(idignoreAccents, true);
    return textAction
}

function findAndReplace() {
    var reference = new ActionReference();
    reference.putProperty(idproperty, idreplace);
    reference.putEnumerated(idtextLayer, idordinal, idallEnum);

    var action = new ActionDescriptor();
    action.putReference(idnull, reference);

    var textAction1 = getTextAction('〝', '"')
    action.putObject(idusing, idfindReplace, textAction1);
    // var textAction2 = getTextAction('”', '"')
    // action.putObject(idusing, idfindReplace, textAction2);

    executeAction(idreplace, action, DialogModes.NO);
}

function autoLeadingPercentage(percentage) {
    var reference = new ActionReference();
    reference.putProperty(idproperty, idparagraphStyle);
    reference.putEnumerated(idtextLayer, idordinal, idtargetEnum);

    var action = new ActionDescriptor();
    action.putReference(idnull, reference);

    var textAction = new ActionDescriptor();

    var idautoLeadingPercentage = stringIDToTypeID("autoLeadingPercentage");
    textAction.putDouble(idautoLeadingPercentage, percentage);

    const idleadingType = stringIDToTypeID("leadingType");
    const idleadingAbove = stringIDToTypeID("leadingAbove");
    textAction.putEnumerated(idleadingType, idleadingType, idleadingAbove);

    const idjustificationWordMinimum = stringIDToTypeID("justificationWordMinimum");
    textAction.putDouble(idjustificationWordMinimum, 0.800000);
    const idjustificationWordDesired = stringIDToTypeID("justificationWordDesired");
    textAction.putDouble(idjustificationWordDesired, 1.000000);
    const idjustificationWordMaximum = stringIDToTypeID("justificationWordMaximum");
    textAction.putDouble(idjustificationWordMaximum, 1.330000);
    const idjustificationLetterMinimum = stringIDToTypeID("justificationLetterMinimum");
    textAction.putDouble(idjustificationLetterMinimum, 0.000000);
    const idjustificationLetterDesired = stringIDToTypeID("justificationLetterDesired");
    textAction.putDouble(idjustificationLetterDesired, 0.000000);
    const idjustificationLetterMaximum = stringIDToTypeID("justificationLetterMaximum");
    textAction.putDouble(idjustificationLetterMaximum, 0.000000);
    const idjustificationGlyphMinimum = stringIDToTypeID("justificationGlyphMinimum");
    textAction.putDouble(idjustificationGlyphMinimum, 1.000000);
    const idjustificationGlyphDesired = stringIDToTypeID("justificationGlyphDesired");
    textAction.putDouble(idjustificationGlyphDesired, 1.000000);
    const idjustificationGlyphMaximum = stringIDToTypeID("justificationGlyphMaximum");
    textAction.putDouble(idjustificationGlyphMaximum, 1.000000);
    const idsingleWordJustification = stringIDToTypeID("singleWordJustification");
    const idalignmentType = stringIDToTypeID("alignmentType");
    const idjustifyAll = stringIDToTypeID("justifyAll");
    textAction.putEnumerated(idsingleWordJustification, idalignmentType, idjustifyAll);

    action.putObject(idto, idparagraphStyle, textAction);
    executeAction(idset, action, DialogModes.NO);
}

function selectAllLayers() {
    var reference = new ActionReference();
    reference.putEnumerated(idlayer, idordinal, idtargetEnum);

    var action = new ActionDescriptor();
    action.putReference(idnull, reference);

    executeAction(idselectAllLayers, action, DialogModes.NO);
}

function selectNoLayers() {
    var reference = new ActionReference();
    reference.putEnumerated(idlayer, idordinal, idtargetEnum);

    var action = new ActionDescriptor();
    action.putReference(idnull, reference);

    executeAction(idselectNoLayers, action, DialogModes.NO);
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

//================读取下属文件夹================
function getFolders(mainFolder) {
    var mainFolderList = [];
    //================如果主文件夹存在================
    if (mainFolder != null) {
        var mainFileList = mainFolder.getFiles();
        mainFileList.sort();//排序
        //================寻找下属文件夹================
        for (var i = 0; i < mainFileList.length; i++) {
            var currentFile = mainFileList[i];
            var displayName = decodeURIComponent(currentFile.name);
            if (currentFile instanceof Folder && !pIgnore.test(displayName)) {
                mainFolderList.push(currentFile);
            }
        }
    }
    return mainFolderList
}

function processFolderPic(mediaType, folderPath, bgFileList, pageContents) {
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
            var layer = activeDocument.activeLayer;

            //复制当前图层。
            layer.copy();

            //不保存即关闭涂白文件。
            openlayer.close(SaveOptions.DONOTSAVECHANGES);

        }
        //打开原始图片。
        var bgFile = open(currentFile);
        var docRef = activeDocument;//当前打开的文档

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

            if (mediaType === 'Comic') {
                textItemRef.antiAliasMethod = AntiAlias.STRONG; //消除锯齿方式
            } else {
                textItemRef.antiAliasMethod = AntiAlias.SMOOTH; //消除锯齿方式
            }
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
            if (mediaType === 'Comic') {
                textItemRef.direction = Direction.HORIZONTAL; //文本取向
            } else {
                textItemRef.direction = Direction.VERTICAL; //文本取向
            }
            /********************
             * 水平=HORIZONTAL
             * 竖直=VERTICAL
             ********************/
            if (mediaType === 'Comic') {
                textItemRef.justification = Justification.CENTER; //对齐方式
                if (alignment === 'Left Title' || alignment === 'Left') {
                    textItemRef.justification = Justification.LEFT; //对齐方式
                }
            } else {
                textItemRef.justification = Justification.LEFT; //对齐方式
            }
            /********************
             * 左对齐=LEFT
             * 右对齐=RIGHT
             * 居中对齐=CENTER
             ********************/

            textItemRef.color = textColor;//字体颜色
            textItemRef.size = thisFontSize; //字号
            textItemRef.font = thisFontName; //字体

            // The position of origin for the text. The array members specify the X and Y coordinates.
            // Equivalent to clicking the text tool at a point in the document to create the point of origin for text.
            //文本原点的位置。
            //等效于用文本工具单击文档中某个点以创建文本的原点。
            textItemRef.position = Array(coorX, coorY);//定位锚点位置
            textItemRef.contents = contents4layer;
        }

        if (mediaType === 'Comic') {
            findAndReplace()
        } else {
        }
        // doAction("行距调整", "填字.atn");
        selectAllLayers()
        autoLeadingPercentage(percentage)
        selectNoLayers()

        //输出psd格式文件
        bgFile.saveAs(outputFile, psdOutOption, 1, Extension.LOWERCASE);
        //不保存关闭处理后的文件
        bgFile.close(SaveOptions.DONOTSAVECHANGES);
    }
}


//================主体程序================
var mainComicFolderList = getFolders(mainComicFolder);
var mainMangaFolderList = getFolders(mainMangaFolder);
var currentFolder, mediaType, mainPath
if (mainComicFolderList.length > 0 || mainMangaFolderList.length > 0) {
    //================选定第一个合适的下属文件夹================
    if (mainComicFolderList.length > 0) {
        currentFolder = mainComicFolderList[0];
        mediaType = 'Comic'
        mainPath = mainComicPath
    } else {
        currentFolder = mainMangaFolderList[0];
        mediaType = 'Manga'
        mainPath = mainMangaPath
    }
    var currentFolderName = currentFolder.displayName;
    alert(currentFolderName);
    var folderPath = mainPath + '/' + currentFolderName;
    //================填字文档================
    text_path = mainPath + '/' + currentFolderName + '-7标记.txt';
    var myTextFile = new File(text_path);

    if (myTextFile.exists) {
        alert(myTextFile.displayName);
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
                processFolderPic(mediaType, folderPath, bgFileList, pageContents);
            } else {
                alert('图片张数：' + bgFileList.length + '\r' + '文稿页数：' + pageContents.length)
            }
        } else
            logList.push('未找到填字文档：' + currentFolderName);
    }
} else {
    alert('无事可做💤');
}
logInfo = logList.join('\r');
