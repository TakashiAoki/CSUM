// ExportPSDLayer Ver.1.3
// Copyright (c) 2007-2018 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2018/07/19

// Photoshopレイヤー書き出しスクリプト
// アクティブ&選択コンポが処理対象になります(複数可)
// レイヤーソースのコメントに『#noPNG』と記載されていた場合はレイヤーグループ構造を保って書き出します
// それ以外のレイヤーは『_PreRender > _psd_export』フォルダ内に一時書き出しをして
// 新たに同じコンポを作ってレイヤー配置
// 保存先指定ウィンドウを出してpsd書き出し

var curScriptName = "ExportPSDLayer";

// **** Main Script ***************************************************************************************************************
		endFlag = null;
							ProjectCheck();
		if ( !endFlag ) { CompSelectCheck(); }
		if ( !endFlag ) { ActiveCompDetection(); }
		if ( !endFlag ) 
		{
			AddFolder();
			for ( var i = 0; i < selectComp.length; i++ ){ ExportPSD(selectComp[i]); }
			//scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "logScriptExeDate.jsx" );
		}
// **** FUNCTION ******************************************************************************************************************
//		プロジェクトの状態チェック
		function ProjectCheck()
{
		if ( app.project.file == null ) { endFlag = true; alert ( "プロジェクトを保存して、１つ以上のコンポジションを選択して下さい" ); }
}
// **** FUNCTION ******************************************************************************************************************
//		コンポジションの選択状態チェック
		function CompSelectCheck()
{
		if ( app.project.activeItem == null && app.project.selection.length == 0 ) { endFlag = true; alert ( "１つ以上のコンポジションを選択して下さい" ); }
}
// **** FUNCTION ******************************************************************************************************************
//		アクティブコンポ検出
		function ActiveCompDetection()
{
		activeItem = app.project.activeItem;
		selectItem = app.project.selection;
		if ( activeItem != null ) { PatternSingleActiveComp(); } else { CheckSelectItem(); }
}
// **** FUNCTION ActiveCompDetection() ********************************************************************************************
//		アクティブアイテムが１つの場合
		function PatternSingleActiveComp()
{
		if ( activeItem instanceof CompItem )
		{	
			selectComp = new Array();
			selectComp[0] = activeItem;
		}
		if ( activeItem instanceof FootageItem || activeItem instanceof FolderItem  )
		{ alert( "１つ以上のコンポジションを選択して下さい" ); endFlag = true; }
}
// **** FUNCTION ActiveCompDetection() ********************************************************************************************
//		アクティブアイテムが複数の場合＞コンポアイテムのみ選出
		function CheckSelectItem()
{
		for ( i = 0; i <= selectItem.length-1; i++ ) {if ( !(selectItem[i] instanceof CompItem) ) selectItem[i].selected = false }
		if ( app.project.selection.length > 0 )
		{ selectComp = app.project.selection; }
		else
		{ alert( "１つ以上のコンポジションを選択して下さい" ); endFlag = true; }	
}
// **** FUNCTION ******************************************************************************************************************
//		処理用のフォルダを作成
		function AddFolder()
{
		//プロジェクトファイルと同ディレクトリに_PreRenderフォルダを作成
		curProjectFile = app.project.file;
		curCutFolder = curProjectFile.parent;
		curFolderFileList = curCutFolder.getFiles();
		preRenderFolder = new Folder(curCutFolder.fsName + "/" +"_PreRender");
		if (preRenderFolder.exists == false){ preRenderFolder.create(); }
		//_PreRenderフォルダ内に_PSD_Exportフォルダを作成
		exportFolder = new Folder(preRenderFolder.fsName + "/" +"_PSD_Export");
		if (exportFolder.exists == false){ exportFolder.create(); }
		
		app.beginUndoGroup("PSD Layer Export");
		//プロジェクトウィンドウ内に_renderPNGフォルダを作成
		renPngFolderObj = null;
		for ( var i = 1; i <= app.project.numItems; i++ )
		{
			if ( app.project.item(i) instanceof FolderItem && app.project.item(i).name == "_renderPNG" )
			{
				renPngFolderObj = app.project.item(i); break;
			}
		}
		if (renPngFolderObj == null) {renPngFolderObj = app.project.items.addFolder("_renderPNG");}
		//プロジェクトウィンドウ内に_PreRenderフォルダがあったら移動
		for ( var i = 1; i <= app.project.numItems; i++ )
		{
			if ( app.project.item(i) instanceof FolderItem && app.project.item(i).name == "_PreRender" )
			{
				renPngFolderObj.parentFolder = app.project.item(i); break;
			}
		}
		app.endUndoGroup();
}
// **** FUNCTION ******************************************************************************************************************
//		PSD書き出し
		function ExportPSD( curComp )
{
		app.beginUndoGroup("PSD Layer Export");
		
		//描画解像度をフル画質にする
		curComp.openInViewer();
		if( $.locale == "en_US" ){ app.executeCommand(app.findMenuCommandId("Full")); }
		if( $.locale == "ja_JP" ){ app.executeCommand(app.findMenuCommandId("フル画質")); }
		
		//PSD書き出しコンポ作成
		newComp = curComp.duplicate();
		newComp.name = curComp.name;
		newComp.comment = "#PSD";
		newComp.openInViewer();
		newComp.time = 0;
		
		for ( x = 1; x <= curComp.numLayers; x++ )
		{
			var curLayer = curComp.layer(x);
			if (curLayer.active == false || curLayer.adjustmentLayer == true) {newComp.layers[curLayer.index].enabled = false; continue;}
			if ( curLayer.source != null )
			{
				if ( !(curLayer.source instanceof CompItem && curLayer.comment.indexOf("#noPNG") > -1))
				{ ExportPNG(curComp,curLayer); }
			}
			else
			{ ExportPNG(curComp,curLayer); }
		}
	
		app.endUndoGroup();
		newComp.openInViewer();
		if( $.locale == "en_US" ){ app.executeCommand(app.findMenuCommandId("Photoshop Layers...")); }
		if( $.locale == "ja_JP" ){ app.executeCommand(app.findMenuCommandId("Photoshopレイヤー...")); }
}
// **** FUNCTION ******************************************************************************************************************
//		PNG一時書き出し・読み込み・配置
		function ExportPNG(curComp,curLayer)
{
		//PNG一時書き出し
		curLayer.solo = true;
		curLayerOpacity = curLayer.opacity.value;
		//レイヤー名からファイル名禁止文字を削除
		str = curLayerSaveName = curLayer.name;
		var result = "";
		for ( n = 0; str != result; n++ )
		{
			var str = result;
			if ( n == 0 ) 
			{ var result = curLayerSaveName.replace(/\s|^\.|\.$|^\_|\_$|^\,|\,$|\\|\/|#/,""); }
			else
			{ var result = str.replace(/\s|^\.|\.$|^\_|\_$|^\,|\,$|\\|\/|#/,""); }
		}
		curLayerSaveName = result;
		
		renderPngFile = new File(exportFolder.fsName + "/" + newComp.name + "_" + curLayer.index + "_Br" + curLayer.blendingMode + "_Op" + curLayerOpacity + "_" + curLayerSaveName + ".png");
		curLayer.opacity.setValue(100);
		curComp.saveFrameToPng(curComp.time,renderPngFile);
		$.sleep(250);//エラー回避
		//for ( i = 0; renderPngFile.exists == false; i++ ) { if(renderPngFile.exists == false){continue;} }//エラー回避
		curLayer.opacity.setValue(curLayerOpacity);
		curLayer.solo = false;
		
		//読み込み
		$.sleep(1000);//エラー回避
		var importOptions = new ImportOptions(renderPngFile);
		importOptions.importAs = ImportAsType.FOOTAGE;
		$.sleep(1000);//エラー回避
		curImportFile = app.project.importFile (importOptions);
		curImportFile.selected = false;//[app.project.importFile]バグ回避のための選択解除
		$.sleep(1000);//エラー回避
		curImportFile.mainSource.guessAlphaMode();//アルファ自動設定
		curImportFile.parentFolder = renPngFolderObj;
		
		//配置
		var curRemoveLayer = newComp.layers[curLayer.index];
		var newLayer = newComp.layers.add( curImportFile );
		newLayer.moveAfter(curRemoveLayer);
		curRemoveLayer.remove();
		newLayer.name = newLayer.name.split(".png")[0].split("_Op" + curLayerOpacity + "_" )[1];
		newLayer.blendingMode = curLayer.blendingMode;
		newLayer.opacity.setValue(curLayerOpacity);
}