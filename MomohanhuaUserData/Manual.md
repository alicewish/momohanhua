# 用户手册

## 软件有效期
软件的每个版本有效期为14天。有效期后不能打开程序。

## 注册码
机器码和电脑、用户名有关，修改用户名会改变机器码，需先改用户名再提交机器码给软件作者换取注册码。

注册填在`momohanhua-config-custom.yaml`

## 日码
日码使软件在日码对应日期当天可用，即使没有注册码。

日码填在`momohanhua-config-daily.yaml`

## 未注册
没有注册码也没有日码将不会保存涂白文件。其他功能仍可用。

## 用户配置
在`momohanhua-config-user.yaml`修改程序的各种设定。

## 图源文件夹
需把图源文件夹放到对应目录，不要把图片摊在对应目录中。

比如，把图片放在`/Users/用户名/Documents/默墨汉化/ComicProcess/Eternal Empire 001`。

程序将读取符合条件的第一个文件夹进行处理。可以在下拉框中选择。

## 识别文字内容
需要用到谷歌的开源程序`tesseract`。
下载地址见[https://digi.bib.uni-mannheim.de/tesseract/](https://digi.bib.uni-mannheim.de/tesseract/)
安装完成后搜索`tesseract 配置环境变量`按说明操作，配置好后才能用。
日漫汉化需要安装日语训练文件。

## PS导入脚本
见`PS自动填字.jsx`。

## 报错
我连截图功能都放工具栏了，不要屏摄。
需提交软件界面截图和命令行报错提示。

## 详细教程
参考[默墨汉化V2.7 半公测版简单使用教程(日漫篇）](https://shimo.im/docs/wTXtJG9tcQpHtVqT)

![](background.jpg)