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

var save_mode;
var outputFile;
var outoption;

save_mode = 'PNG';
save_mode = 'JPEG';

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

//================初始化标尺、字体单位设置================
var originalUnit = preferences.rulerUnits;
preferences.rulerUnits = Units.PIXELS;
var originalTypeUnit = preferences.typeUnits;
preferences.typeUnits = TypeUnits.POINTS;

app.preferences.rulerUnits = Units.PIXELS;
app.preferences.typeUnits = TypeUnits.PIXELS;
app.preferences.pointSize = PointType.POSTSCRIPT;

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

function processFolderPic(folderPath, bgFileList) {
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

        //打开原始图片。
        var bgFile = open(currentFile);


        if (save_mode === 'PNG') {
            //构造输出文件名。
            outputFile = new File(folderPath + '/' + currentFileStem + ' 拷贝.png');
            outoption = new PNGSaveOptions;
            //设置图片压缩系数为8。
            outoption.compression = 8;
        } else {
            //构造输出文件名。
            outputFile = new File(folderPath + '/' + currentFileStem + ' 拷贝.jpg');
            outoption = new JPEGSaveOptions;
            //设置图片质量系数为8。
            outoption.quality = 8;
        }
        //输出文件
        bgFile.saveAs(outputFile, outoption, 1, Extension.LOWERCASE);
        //不保存关闭处理后的文件
        bgFile.close(SaveOptions.DONOTSAVECHANGES)
    }
}

//================主体程序================
var mainComicFolderList = getFolders(mainComicFolder);
var mainMangaFolderList = getFolders(mainMangaFolder);
var currentFolder, mediaType, mainPath
//================如果主文件夹存在================
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
    var folderPath = mainComicPath + '/' + currentFolderName;
    var psdList = currentFolder.getFiles("*.psd");
    psdList.sort();

    var backgroundFileList = [];
    for (var p = 0; p < psdList.length; p++) {
        var currentPsd = psdList[p];
        var currentFileName = currentPsd.displayName;
        var index = currentFileName.lastIndexOf(".");
        var ext = currentFileName.substr(index + 1);
        var currentFileStem = currentFileName.split('.').slice(0, -1).join('.');
        if (!pLettered.test(currentFileStem)) {
            backgroundFileList.push(currentPsd);
        }
    }
    if (backgroundFileList.length > 0) {
        processFolderPic(folderPath, backgroundFileList);
    } else {
        alert('图片张数：' + backgroundFileList.length + '\r' + '文稿页数：' + pageContents.length)
    }
}
logInfo = logList.join('\r');
