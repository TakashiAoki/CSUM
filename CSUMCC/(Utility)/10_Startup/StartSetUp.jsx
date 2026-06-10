// ============================================
// Script Name : StartSetUp5
// Version     : v6.1
// 仕様        : プロジェクト名・コンポ名・尺を設定。1〜16カット兼用対応
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-06-09
// ============================================

var curScriptName = "StartSetUp";

// **** Main Script ***************************************************************************************************************
		flag = null;
					 ProjectCheck();
		if ( !flag ) CSUMProjectFileCheck();
		if ( !flag ) getCurCutNameProperties();
		if ( !flag ) getCurCutDurationProperties();
		if ( !flag ) {
			if ( typeof elenaBatchMode !== "undefined" && elenaBatchMode ) { elenaBatchSetVars(); }
			else { BuildAndShowDialog(); }
		}
		//if ( !flag && Btnon == "OK" ) { dObj = new Date(); StartTime = dObj.getTime()/1000; };
		if ( !flag && Btnon == "OK" )
		{
			if ( typeof elenaBatchMode === "undefined" || !elenaBatchMode ) { getDialogSettings(); }
			StartSetUp();
			curCSUMProjectFile.remove();//CSUMプロジェクト削除
			app.project.showWindow(true);
			for ( var w = 0; w < codeMatchCompList.length; w++ )
			{
				curWorkComp =  codeMatchCompList[w];
			}
		}
		//if ( !flag && Btnon == "OK" ) { dObj = new Date(); EndTime = dObj.getTime()/1000; alert("処理時間は"+Math.round((EndTime-StartTime)*1000)/1000+"秒でした")};
		
// **** FUNCTION ******************************************************************************************************************
//		WorkFormatキャッシュから特定項目を取得
		function getWF ( index , category , item )
{
		if (workFormat[index] != null && typeof workFormat[index].split(category)[1].split(item)[1] !== "undefined" )
		{ return workFormat[index].split(category)[1].split(item)[1].split(TAB)[1]; }
		else
		{ return null; /*alert("指定のWorkFormatがありません");*/ }
		//getWF (0,"[FinalRenderSettings]","X");
}
// **** FUNCTION ******************************************************************************************************************
//		プロジェクトの状態チェック
		function ProjectCheck()
{	
		if ( app.project == null || app.project.file == null )
		{ flag = true; alert ( "カットフォルダ内に新規CSUMプロジェクトを入れて、プロジェクトを開いて下さい" ); }
}
// **** FUNCTION ******************************************************************************************************************
//		CSUMプロジェクトファイルの状態チェック
		function CSUMProjectFileCheck()
{
		var matchFlag1 = null;
		var matchFlag2 = null;
		var matchFlag3 = null;
		for ( i = 0; i < workFormat.length; i++ )
		{
			var titCode = getWF ( i ,"[ProjectTitleName]","codeName");
			if ( app.project.file.name.split("_")[0] == titCode )
			{ curWFindex = i; var matchFlag1 = true; break; }
		}
		
		if ( app.project.file.name.indexOf("CSUM") != -1 ) { var matchFlag2 = true; }
		
		if ( app.project.numItems != 0 ) { var matchFlag3 = true; }
		if ( matchFlag1 != true || matchFlag2 != true || matchFlag3 != true )
		{ flag = true; alert ( "カットフォルダ内に新規CSUMプロジェクトを入れて、プロジェクトを開いて下さい" ); }
}
// **** FUNCTION ******************************************************************************************************************
//		作業カットNameプロパティ取得
		function getCurCutNameProperties()
{
		//選択解除
		if ( app.project.selection.length > 0 )
		{
			selectItem = app.project.selection;
			for ( s = 0; s < selectItem.length; s++ ) { selectItem[s].selected = false; }
		}
		
		app.purge(PurgeTarget.ALL_CACHES);//全てのキャッシュを消去
		scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "clearCache.jsx" );
		
		curCSUMProjectFile = null;
		curCutFolder = null;
			curAepFolder = null;
			curC4dFolder = null;
			curChkFolder = null;
			curFootageFolder = null;
			curPreRenderFolder = null;

		getCurProjectTake = null;
		getCurProjectName = null;
		getCurProjectCutNo = null;
		getCurProjectCutNum = null;
		getCurProjectCutDuration = null;
		getCurProjectColorDepth = null;
		compFrameRate = 24;
		oneSheetDuration = 144;
		bgFileList = new Array();
		frFileList = new Array();
		cellFileList = new Array();
		cellOptionList = new Array();
		cellReMapList = new Array();
		numBuildCutLimit = 16;//兼用リミット数

		curCSUMProjectFile = app.project.file;
		targetFolder = new Folder(app.project.file.path);
		curCSUMProjectFileItemNum = app.project.numItems;

		//カットフォルダ判定
		if ( curCSUMProjectFile.parent.name.match(/aep/i) )
		{
			curCutFolder = curCSUMProjectFile.parent.parent;
			cutFolderFileList = curCutFolder.getFiles();
			for ( i = 0; i < cutFolderFileList.length; i++ )
			{
				if ( !( cutFolderFileList[i].name.match(/go|ko|oya|kumi|kabuse|brush|sheet|ts|fuyou|moto|xxx/i)) )
				{
					if ( cutFolderFileList[i] instanceof Folder )
					{	//フォルダ
						if ( cutFolderFileList[i].name.match(/aep/i) ) { curAepFolder = cutFolderFileList[i]; continue; }
						if ( cutFolderFileList[i].name.match(/c4d/i) ) { curC4dFolder = cutFolderFileList[i]; continue; }
						if ( cutFolderFileList[i].name.match(/chk/i) ) { curChkFolder = cutFolderFileList[i]; continue; }
						if ( cutFolderFileList[i].name.match(/footage/i) ) { curFootageFolder = cutFolderFileList[i]; continue; }
						if ( cutFolderFileList[i].name.match(/prerender/i) ) { curPreRenderFolder = cutFolderFileList[i]; continue; }
					}
				}
			}
		}
		else
		{
			curCutFolder = curCSUMProjectFile.parent;
			curAepFolder = curCSUMProjectFile.parent;
		}


		result = curCutFolder.name.match(/_/g);
		if ( result!=null && result.length >= getWF ( curWFindex ,"[TokenSettings]","cutFolderName").split("_").length-1 )
		{
			curTokenStr = getWF ( curWFindex ,"[TokenSettings]","aepName").split(".aep")[0];//AEP名のトークン設定
			for( var t = 0; t < curTokenStr.split("_").length; t++ )
			{
				if ( curTokenStr.split("_")[t] == "[take]" )
				{ getCurProjectTake = curCSUMProjectFile.name.split(".aep")[0].split("_")[t]; }
			}
			
			getCurProjectName = curCutFolder.name+"_"+getCurProjectTake+".aep";
			
			curTokenStr = getWF ( curWFindex ,"[TokenSettings]","cutFolderName");//カットフォルダ名のトークン設定
			for( var t = 0; t < curTokenStr.split("_").length; t++ )
			{
				if ( curTokenStr.split("_")[t] == "[cutNo]" )
				{ getCurProjectCutNo = curCutFolder.name.split("_")[t].split(","); }
			}		

			getCurProjectCutNum = getCurProjectCutNo.length;
			getCurProjectColorDepth = app.project.bitsPerChannel;
			
			getCurProjectCompName = new Array();
			curTokenStr = getWF ( curWFindex ,"[TokenSettings]","RenderingCompName");//最終コンポ名のトークン設定
			scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "analysisTokenStr.jsx" );
			
			for ( i = 0; i < getCurProjectCutNum; i++ )
			{
				//最終コンポの名前をトークンに基づいて作成
				curCutCompName = "";
				for (var c = 0; c < curTokenArray.length; c++)
				{
					switch ( curTokenArray[c] )
					{
						case "[titleCode]" : curCutCompName += curCutFolder.name.split("_")[0]; break;
						case "[act]" : curCutCompName += curCutFolder.name.split("_")[1]; break;
						case "[cutNo]" : curCutCompName += getCurProjectCutNo[i]; break;
						case "[take]" : curCutCompName += getCurProjectTake; break;
						default : curCutCompName += curTokenArray[c];
					}
				}
				addCurCutCompName = new Array( curCutCompName );
				getCurProjectCompName = getCurProjectCompName.concat(addCurCutCompName);
			}
		}
		else
		{ flag = true; alert ( "カットフォルダ名が対応したフォーマットでない可能性があります" ); }
}
// **** FUNCTION ******************************************************************************************************************
//		作業カットDurationプロパティ取得 <<<<< 撮入れ伝票がデジタル化されたらここを修正
		function getCurCutDurationProperties()
{
		getCurProjectCutDuration = new Array();//各カット尺リスト
		for ( i = 0; i < getCurProjectCutNum; i++ )
		{
			var durVal = ( typeof elenaBatchDuration !== "undefined" && elenaBatchDuration[i] != null )
			             ? String( elenaBatchDuration[i] ) : "";//各カット尺（Elena注入あれば使用）
			addCurCutDuration = new Array( durVal );
			getCurProjectCutDuration = getCurProjectCutDuration.concat(addCurCutDuration);
		}
}
// **** FUNCTION ******************************************************************************************************************
//		ウィンドウ位置読み込み
		function loadWindowOffset( scriptName , windowName )
{
		var sectionName = "CSUMCC " + scriptName;
		var sectionKey = windowName + " Window Offset";
		
		var loadflag = app.settings.haveSetting( sectionName , sectionKey );
		
		if ( loadflag == true )
		{
			windowOffset = app.settings.getSetting( sectionName , sectionKey ).split(",");
		}
		else
		{
			var saveValue = "0,0,0,0";
			app.settings.saveSetting( sectionName , sectionKey , saveValue );
			windowOffset = saveValue.split(",");
		}
}
// **** FUNCTION ******************************************************************************************************************
//		ウィンドウ位置記憶
		function saveWindowOffset( scriptName , windowName , windowAlgebra )
{
		var sectionName = "CSUMCC " + scriptName;
		var sectionKey = windowName + " Window Offset";
		var saveValue = windowAlgebra.bounds[0]+","+windowAlgebra.bounds[1]+","+windowAlgebra.bounds[0]+","+windowAlgebra.bounds[1];
		app.settings.saveSetting( sectionName , sectionKey , saveValue );
}
// **** FUNCTION ******************************************************************************************************************
//		ダイアログ表示
		function BuildAndShowDialog()
{
		makeCompFlagCb = new Array();
		compNameEdit = new Array();
		centerCaption = new Array();
		compDurationEdit = new Array();
		compDurationCaption = new Array();
		loadWindowOffset( "Start SetUp" , "ssDlg" );
		
		var addCutDlgHight = 36;
		if ( getCurProjectCutNum <= numBuildCutLimit )
		{ var addDlgHight = addCutDlgHight*getCurProjectCutNum; }
		else
		{ var addDlgHight = addCutDlgHight*numBuildCutLimit; }
		
		ssDlg = new Window ( "dialog" , "Start SetUp" , [0,0,448,168+addDlgHight] + windowOffset );
		projectNameCaption = ssDlg.add( "statictext" , [68,16,158,36] , " Project Name :" ); projectNameCaption.justify = "left";
		projectNameEdit = ssDlg.add( "edittext" , [168,13.5,384,35.5] , getCurProjectName ); projectNameEdit.justify = "left";
		
		compPnl = ssDlg.add( "panel" , [16,60,432,80+addDlgHight] , "                                                                                                " );

			for ( i = 0; i < getCurProjectCutNum; i++ )
			{
				makeCompFlagCb[i] = compPnl.add( "checkbox" , [20,17.5+addCutDlgHight*i,40,39.5+addCutDlgHight*i] );
				makeCompFlagCb[i].value = true;
				compNameEdit[i] = compPnl.add( "edittext" , [52,17.5+addCutDlgHight*i,224,39.5+addCutDlgHight*i] , getCurProjectCompName[i] );
				compNameEdit[i].justify = "center";
				centerCaption[i] = compPnl.add( "statictext" , [252,20+addCutDlgHight*i,260,40+addCutDlgHight*i] , ":" );
				centerCaption[i].justify = "center";
				compDurationEdit[i] = compPnl.add( "edittext" , [288,17.5+addCutDlgHight*i,368,39.5+addCutDlgHight*i] , getCurProjectCutDuration[i] );
				compDurationEdit[i].justify = "center";
				compDurationCaption[i] = compPnl.add( "statictext" , [376,20+addCutDlgHight*i,384,40+addCutDlgHight*i] , "f" );
				compDurationCaption[i].justify = "left";
			}
			
		compNameCaption = ssDlg.add( "statictext" , [52+16,-8+67,166+16,8+67] , " Composition Name " );
		compNameCaption.justify = "left";
		compDurationCaption = ssDlg.add( "statictext" , [288+16,-8+67,344+16,8+67] , " Duration " );
		compDurationCaption.justify = "left";

		compPnlLineA = ssDlg.add( "panel" , [24,67,66,67] );
		compPnlLineB = ssDlg.add( "panel" , [184,67,300,67] );

		oneSheetDurationCaption1 = ssDlg.add( "statictext" , [242,98+addDlgHight,294,118+addDlgHight] , "1 Sheet :" );
		oneSheetDurationCaption1.justify = "right";
		oneSheetDurationEdit = ssDlg.add( "edittext" , [304,95.5+addDlgHight,352,117.5+addDlgHight] , oneSheetDuration );
		oneSheetDurationEdit.justify = "center";
		oneSheetDurationCaption2 = ssDlg.add( "statictext" , [360,98+addDlgHight,426,118+addDlgHight] , "f @ "+"24"+" fps" );
		oneSheetDurationCaption2.justify = "left";
	
		impFilesFlagCb = ssDlg.add( "checkbox" , [36,95.5+addDlgHight,144,117.5+addDlgHight] , "    Import File" );
		impFilesFlagCb.value = true;
		
		cancelBtn = ssDlg.add( "button" , [230,132+addDlgHight,326,152+addDlgHight] , "Cancel" , {name:"cancel"} );
		okBtn = ssDlg.add( "button" , [336,132+addDlgHight,432,152+addDlgHight] , "OK" , {name:"ok"} );
		
		cancelBtn.onClick = function() { Btnon = "Cancel"; ssDlg.close(); }
		okBtn.onClick = function() { Btnon = "OK"; ssDlg.close(); }
		ssDlg.onShow = function() { compDurationEdit[0].active = true; }
		ssDlg.onMove = function() { saveWindowOffset( "Start SetUp" , "ssDlg" , ssDlg ) }
		if ( windowOffset.toString() == "0,0,0,0" ) { ssDlg.center(); }
		ssDlg.show();
}

// **** FUNCTION ******************************************************************************************************************
//		ダイアログ情報取得
		function getDialogSettings()
{
		newProjectName = projectNameEdit.text;

		makeCompFlag = makeCompFlagCb;
		
		makeCompFlagNum = 0;
		for ( i = 0; i < getCurProjectCutNum; i++ ) { if ( makeCompFlag[i].value == true ) { makeCompFlagNum++; } }

		oneSheetDuration = oneSheetDurationEdit.text; flag = /[^0-9]/.test( oneSheetDuration );
		if ( flag == true || String(oneSheetDuration) == "NaN" || oneSheetDuration == "" ) oneSheetDuration = 144;

		compDuration = new Array();
		for ( i = 0; i < getCurProjectCutNum; i++ )
		{
			compDuration[i] = compDurationEdit[i].text;
			flag = /[^0-9]/.test( compDuration[i] );

			if ( flag == true )
			{
				//コンポ尺に「+」と「-」が重複して含まれていた場合
				if ( /[\+]/.test( compDuration[i] ) == true && /[\-]/.test( compDuration[i] ) == true ) { compDuration[i] = 1; var flag = false; }
				
				//コンポ尺に「+」が１つだけ含まれていた場合
				if ( flag == true )
				{
					var plusSplit = compDuration[i].split("+");
					if ( /[\+]/.test( compDuration[i] ) == true && String(plusSplit[2]) == "undefined" )
					{
						var S = parseFloat(plusSplit[0],10); var F = parseFloat(plusSplit[1],10);
						compDuration[i] = eval( S*compFrameRate+F ); var flag = false;
					}
				}
				
				//コンポ尺に「-」が１つだけ含まれていた場合
				if ( flag == true )
				{
					var minusSplit = compDuration[i].split("-");
					if ( /[\-]/.test( compDuration[i] ) == true && String(minusSplit[2]) == "undefined" )
					{
						var S = parseFloat(minusSplit[0],10); var F = parseFloat(minusSplit[1],10);
						compDuration[i] = eval( (S-1)*oneSheetDuration+F ); var flag = false;
					}
				}
			}
			else
			{ compDuration[i] = parseFloat(compDuration[i],10); var flag = false; }
			
			//コンポ尺に数字と「+、-」以外の文字列が含まれていた場合
			if ( String(compDuration[i]) == "NaN" || compDuration[i] == "" ) { compDuration[i] = 1; var flag = false; }
			if ( flag == true ) compDuration[i] = 1;
		}
		
		impFilesFlag = impFilesFlagCb.value;
}

// **** FUNCTION ******************************************************************************************************************
//		Elenaバッチモード用：ダイアログ設定を直接セット
		function elenaBatchSetVars()
{
		newProjectName  = getCurProjectName;
		makeCompFlag    = new Array();
		compNameEdit    = new Array();//SingleCompSetUP/MultiCompSetUPが参照するコンポ名配列
		for ( var _ei = 0; _ei < getCurProjectCutNum; _ei++ )
		{
			makeCompFlag.push( { value: true } );
			compNameEdit.push( { text: getCurProjectCompName[_ei] } );//ダイアログ代替
		}
		makeCompFlagNum = getCurProjectCutNum;
		oneSheetDuration = 144;
		compDuration = new Array();
		for ( var _ei = 0; _ei < getCurProjectCutNum; _ei++ )
		{
			compDuration[_ei] = parseInt( getCurProjectCutDuration[_ei] , 10 );
			if ( isNaN( compDuration[_ei] ) || getCurProjectCutDuration[_ei] == "" ) { compDuration[_ei] = 1; }
		}
		impFilesFlag = true;
		Btnon = "OK";
}
// **** FUNCTION ******************************************************************************************************************
//		セットアップ実行
		function StartSetUp()
{
		if ( makeCompFlagNum > 0 )
		{
			if ( makeCompFlagNum == 1 ) { SingleCompSetUP(); } else { MultiCompSetUP(); }			
			if ( impFilesFlag == true ) { FootageSetUP(); }
			SetUP();
		}
}
// **** FUNCTION StartSetUp() *****************************************************************************************************
//		作業カットが1カットの場合
		function SingleCompSetUP()
{		
		addCompFolderList = new Array();
		codeMatchCompList = new Array();
		
		for ( i = 0; i < getCurProjectCutNum; i++ )
		{
			if ( makeCompFlag[i].value == true )
			{
				for ( n = curCSUMProjectFileItemNum; n >= 1; n-- )
				{
					if ( app.project.item(n).parentFolder.name != " CSUM_bin" )
					{
						if ( app.project.item(n) instanceof CompItem )
						{
							var curCompCode = app.project.item(n).name.split("_")[0];
							var m = workFormat.length;
							for ( var r = 0; r <= m-1; r++ )
							{
								var comparisonCode = getWF ( r ,"[ProjectTitleName]","codeName");
								if ( curCompCode == comparisonCode && app.project.item(n).name.split("_").length >= getWF ( r ,"[TokenSettings]","RenderingCompName").split("_").length )
								{	//app.project.item(n)は最終コンポ
									var curStr = app.project.item(n).name;
									var newStr  = compNameEdit[i].text;
									app.project.item(n).name = newStr ;
									app.project.autoFixExpressions(curStr , newStr );
									curBoldDuration = eval(getWF ( r ,"[FinalRenderSettings]","boldDuration"));
									app.project.item(n).duration = (compDuration[i]+curBoldDuration)*app.project.item(n).frameDuration;
									codeMatchCompList.push(app.project.item(n));
									break;
								}
							}
							if ( isNaN(curCompCode) == false )
							{	//コンポイニシャルが数字だった場合	01_comp,02_cameraとか
								app.project.item(n).duration = compDuration[i]*app.project.item(n).frameDuration;
								
								curTokenStr = getWF ( curWFindex ,"[TokenSettings]","RenderingCompName");//最終コンポ名のトークン設定
								for( var t = 0; t < curTokenStr.split("_").length; t++ )
								{
									if ( curTokenStr.split("_")[t] == "[cutNo]" )
									{ var cutNoIndex = t; }
								}
								var curStr = app.project.item(n).name;
								var newStr  = app.project.item(n).name+"_"+compNameEdit[i].text.split("_")[cutNoIndex];
								app.project.item(n).name = newStr ;
								app.project.autoFixExpressions(curStr , newStr );
							}
						}
					}
					if ( app.project.item(n).parentFolder == app.project.rootFolder && app.project.item(n) instanceof CompItem ) { addCompFolderList.push( app.project.item(n) ) };
				}
			}
		}
		var existingCompFolder = null;
		for ( var k = 1; k <= app.project.numItems; k++ ) {
			if ( app.project.item(k) instanceof FolderItem && app.project.item(k).name == "_comp" && app.project.item(k).parentFolder == app.project.rootFolder ) {
				existingCompFolder = app.project.item(k); break;
			}
		}
		if ( existingCompFolder != null ) {
			compFolderObj = existingCompFolder;
		} else {
			for ( i = 0; i < makeCompFlag.length; i++ ) { if ( makeCompFlag[i].value == true ) { compFolderObj = app.project.items.addFolder("_comp"); break; } }
		}
		for ( i = 0; i < addCompFolderList.length; i++ ) { addCompFolderList[i].parentFolder = compFolderObj; }

		// _preCompを_comp直下へ移動
		var preCompFolderObj = null;
		for ( var k = 1; k <= app.project.numItems; k++ ) {
			if ( app.project.item(k) instanceof FolderItem && app.project.item(k).name == "_preComp" && app.project.item(k).parentFolder == app.project.rootFolder ) {
				preCompFolderObj = app.project.item(k);
				preCompFolderObj.parentFolder = compFolderObj;
				break;
			}
		}
}
// **** FUNCTION StartSetUp() *****************************************************************************************************
//		作業カットが兼用カットの場合
		function MultiCompSetUP()
{
		addCompFolderList = new Array();
		codeMatchCompList = new Array();
		app.newProject();

		var copyFile = new File(myCSUMCCCacheFolder.fsName+"/"+curCSUMProjectFile.name);
		curCSUMProjectFile.copy(copyFile);
		curCSUMProjectCacheFile = new ImportOptions(copyFile);
		
		for ( i = 0; i < getCurProjectCutNum; i++ )
		{
			if ( makeCompFlag[i].value == true )
			{
				curImportFile = app.project.importFile(curCSUMProjectCacheFile);
				app.project.selection[0].name = "";
				for ( n = curCSUMProjectFileItemNum+1; n > 1; n-- )
				{
					if ( app.project.item(n).parentFolder.name != " CSUM_bin" )
					{
						if ( app.project.item(n) instanceof CompItem )
						{
							var curCompCode = app.project.item(n).name.split("_")[0];
							var m = workFormat.length;
							for ( var r = 0; r <= m-1; r++ )
							{
								var comparisonCode = getWF ( r ,"[ProjectTitleName]","codeName");
								if ( curCompCode == comparisonCode && app.project.item(n).name.split("_").length >= getWF ( r ,"[TokenSettings]","RenderingCompName").split("_").length )
								{	//app.project.item(n)は最終コンポ
									var curStr = app.project.item(n).name;
									var newStr  = compNameEdit[i].text;
									app.project.item(n).name = newStr ;
									app.project.autoFixExpressions(curStr , newStr );
									curBoldDuration = eval(getWF ( r ,"[FinalRenderSettings]","boldDuration"));
									app.project.item(n).duration = (compDuration[i]+curBoldDuration)*app.project.item(n).frameDuration;
									codeMatchCompList.push(app.project.item(n));
									break;
								}
							}
							if ( isNaN(curCompCode) == false ) 
							{	//コンポイニシャルが数字だった場合	01_comp,02_cameraとか
								app.project.item(n).duration = compDuration[i]*app.project.item(n).frameDuration;
								curTokenStr = getWF ( curWFindex ,"[TokenSettings]","RenderingCompName");//最終コンポ名のトークン設定
								for( var t = 0; t < curTokenStr.split("_").length; t++ )
								{
									if ( curTokenStr.split("_")[t] == "[cutNo]" )
									{ var cutNoIndex = t; }
								}
								var curStr = app.project.item(n).name;
								var newStr  = app.project.item(n).name+"_"+compNameEdit[i].text.split("_")[cutNoIndex];
								app.project.item(n).name = newStr ;
								app.project.autoFixExpressions(curStr , newStr );
							}
						}
					}
				}
				curTokenStr = getWF ( curWFindex ,"[TokenSettings]","RenderingCompName");//最終コンポ名のトークン設定
				for( var t = 0; t < curTokenStr.split("_").length; t++ )
				{
					if ( curTokenStr.split("_")[t] == "[cutNo]" )
					{ var cutNoIndex = t; }
				}
				var curStr = app.project.selection[0].name;
				var newStr  = "z"+compNameEdit[i].text.split("_")[cutNoIndex];
				app.project.selection[0].name = newStr;//名前順で下に来るように誘導
				app.project.autoFixExpressions(curStr , newStr );
				var curStr = app.project.selection[0].name;
				var newStr  = "c"+compNameEdit[i].text.split("_")[cutNoIndex]+" ";
				app.project.selection[0].name = newStr;
				app.project.autoFixExpressions(curStr , newStr );
				addCompFolderList.push( app.project.selection[0] );
				flattenInnerCompFolder( addCompFolderList[addCompFolderList.length-1] );
				curImportFile.selected = false;//[app.project.importFile]バグ回避のための選択解除
			}
		}
		for ( i = 0; i < makeCompFlag.length; i++ ) { if ( makeCompFlag[i].value == true ) { compFolderObj = app.project.items.addFolder("_comp"); break; } };
		for ( i = 0; i < addCompFolderList.length; i++ ) { addCompFolderList[i].parentFolder = compFolderObj };
}
// **** FUNCTION StartSetUp() *****************************************************************************************************
//		
		function FootageSetUP()
{
		scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getImportFileList.jsx" );

		var existingBinFolder = null;
		for ( var k = 1; k <= app.project.numItems; k++ ) {
			if ( app.project.item(k) instanceof FolderItem && app.project.item(k).name == "_bin" && app.project.item(k).parentFolder == app.project.rootFolder ) {
				existingBinFolder = app.project.item(k); break;
			}
		}
		binFolderObj = existingBinFolder || app.project.items.addFolder("_bin");
		bgFolderObj   = findOrAddFolder( binFolderObj, "_BG" );
		cellFolderObj = findOrAddFolder( binFolderObj, "_cell" );
		frFolderObj   = findOrAddFolder( binFolderObj, "_Fr" );
		thdFolderObj  = findOrAddFolder( binFolderObj, "_3D" );
		duFolderObj   = findOrAddFolder( binFolderObj, "_dummy" );
		mgFolderObj   = findOrAddFolder( binFolderObj, "_MG" );

		//MG作業プロジェクトだった場合
		if ( newProjectName.match(/_mg_/i) )
		{
			//frFolderObj = binFolderObj.items.addFolder("_dummy");
			//frFolderObj = binFolderObj.items.addFolder("_MG");
		}

		//Cellインポート
		if ( cellFileList.length > 0 )
		{
			for( x = 0; x < cellFileList.length; x++ )
			{	
				var importOptions = new ImportOptions(cellFileList[x]);
				if ( cellOptionList[x] == 1 && cellFileList[x].name.match(/psd$/i) ) importOptions.importAs = ImportAsType.FOOTAGE;
				if ( cellOptionList[x] >= 2 ) importOptions.sequence = true;
				if ( cellOptionList[x] == 3 ) importOptions.forceAlphabetical = true;
				curImportCellObj = app.project.importFile (importOptions);
				curImportCellObj.selected = false;//[app.project.importFile]バグ回避のための選択解除
				curImportCellObj.mainSource.guessAlphaMode();//アルファ自動設定
				curImportCellObj.parentFolder = cellFolderObj;
				
				if ( cellOptionList[x] == 3 )
				{
					curSetSeq = curImportCellObj;
					curFileName = curSetSeq.file.name;
					scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "analysisFileName.jsx" );
					if ( cellReMapList[x].length == cellReMapList[x][cellReMapList[x].length-1] ) { startNum = "1"; } else { startNum = "0"; }
					for ( i = 1; i < curNumDigit; i++ ) { startNum = "0"+startNum; if ( startNum.length == curNumDigit ) { break; } }
					endNum = cellReMapList[x][cellReMapList[x].length-1].toString();
					for ( i = 1; i < curNumDigit; i++ ) { endNum = "0"+endNum; if ( endNum.length == curNumDigit ) { break; } }
					
					newCompName = curStartCode+"["+startNum+"-"+endNum+"]"+curLastCode;
					newCompWidth = curSetSeq.width;
					newCompHeight = curSetSeq.height;
					newCompPixelAspect = curSetSeq.pixelAspect;
					newCompDuration = cellReMapList[x].length;
					newCompFrameRate = curSetSeq.frameRate;
					
					curSetComp = app.project.items.addComp( newCompName , newCompWidth , newCompHeight , newCompPixelAspect , 1 , newCompFrameRate );
					curSetComp.duration = newCompDuration*curSetComp.frameDuration;
					curSetComp.parentFolder = cellFolderObj;
					
					//全面白塗りシェイプレイヤー配置
					if ( !(curSetSeq.mainSource.hasAlpha) )
					{
						var ALshape = curSetComp.layers.addShape();//新規シェイプレイヤー作成
						ALshape.position.expression = "X = thisComp.width; Y = thisComp.height; [X,Y]/2";
						ALshape.name = "WhiteShape";//名称変更
						var Rect = ALshape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Shape - Rect");
						Rect.property("ADBE Vector Rect Size").expression = "X = thisComp.width; Y = thisComp.height; [X,Y]";
						var Fill = ALshape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Graphic - Fill");
						Fill.property("ADBE Vector Fill Color").setValue([1,1,1,1]);
					}
					
					curSetComp.layers.add( curSetSeq );
					curSetComp.layer(1).timeRemapEnabled = true;
					curSetComp.layer(1).timeRemap.removeKey(2);			
					curSetComp.layer(1).outPoint = newCompDuration/newCompFrameRate+1
					TR = 0;
					befOP = null;
					for ( i = 0; i < newCompDuration; i++ )
					{
						if ( cellReMapList[x][i] == null )
						{ OP = 0; }
						else
						{ TR++; OP = 100; curSetComp.layer(1).timeRemap.setValueAtTime( i/newCompFrameRate , (TR-1)/newCompFrameRate ); }
						if ( befOP != OP ) { curSetComp.layer(1).opacity.setValueAtTime( i/newCompFrameRate , OP ); befOP = OP; }
					}
					if ( cellReMapList[x][0] == null ) { curSetComp.layer(1).timeRemap.removeKey(1); }

					//キータイプを停止キーに変更
					for ( i = 1; i <= curSetComp.layer(1).timeRemap.numKeys; i++ )
					{ curSetComp.layer(1).timeRemap.setInterpolationTypeAtKey( i , KeyframeInterpolationType.HOLD , KeyframeInterpolationType.HOLD ); }
					for ( i = 1; i <= curSetComp.layer(1).opacity.numKeys; i++ )
					{ curSetComp.layer(1).opacity.setInterpolationTypeAtKey( i , KeyframeInterpolationType.HOLD , KeyframeInterpolationType.HOLD ); }
				}
			}
		}
		
		//BGインポート
		if ( bgFileList.length > 0 )
		{
			curBgCompList = [];
			for ( x = 0; x < bgFileList.length; x++ )
			{
				var importOptions = new ImportOptions(bgFileList[x]);
				importOptions.importAs = ImportAsType.COMP;
				curImportBgObj = app.project.importFile (importOptions);
				curImportBgObj.selected = false;//[app.project.importFile]バグ回避のための選択解除
				curBgCompList.push(curImportBgObj);
				for ( n = 1; n <= app.project.items.length; n++ )
				{	//コンポ読み込み時に自動作成されるレイヤーフォルダを移動
					if ( app.project.item(n).name == curImportBgObj.name+" レイヤー" && app.project.item(n) instanceof FolderItem )
					{
						var curBgLayerList = app.project.item(n).items;
						app.project.item(n).name = curImportBgObj.name+" Layer";
						app.project.item(n).parentFolder = bgFolderObj;
						for ( m = 1; m <= curBgLayerList.length; m++ )
						{
							if ( curBgLayerList[m] instanceof CompItem )
							{
								curBgCompList.push(curBgLayerList[m]);
							}
						}
						break;
					}
				}
				curBgCompList = SortCompHierarchy( curBgCompList );
				for ( p = 0; p < curBgCompList.length; p++ )
				{
					var curDuration = curBgCompList[p].duration;
					var newDuration = 1000/24;
					var curLayerList = curBgCompList[p].layers;
					AdjustLayerOutPoint( curDuration , newDuration , curLayerList );
					curBgCompList[p].duration = newDuration;
				}
				curImportBgObj.parentFolder = bgFolderObj;
			}
		}
		
		//Frインポート
		if ( frFileList.length > 0 )
		{
			for ( x = 0; x < frFileList.length; x++ )
			{
				var importOptions = new ImportOptions(frFileList[x]);
				if ( importOptions.file.name.match(/psd$/i) ) 
				{
					importOptions.importAs = ImportAsType.COMP;
					curImportFrObj = app.project.importFile (importOptions);
					curImportFrObj.selected = false;//[app.project.importFile]バグ回避のための選択解除
					for ( n = 1; n <= app.project.items.length; n++ )
					{	//コンポ読み込み時に自動作成されるレイヤーフォルダを移動
						if ( app.project.item(n).name == curImportFrObj.name+" レイヤー" && app.project.item(n) instanceof FolderItem )
						{
							app.project.item(n).name = curImportFrObj.name+" Layer";
							app.project.item(n).parentFolder = frFolderObj;
							break;
						}
					}
				}
				else
				{
					curImportFrObj = app.project.importFile (importOptions);
					curImportFrObj.selected = false;//[app.project.importFile]バグ回避のための選択解除
					curImportFrObj.mainSource.guessAlphaMode();//アルファ自動設定
				}
				curImportFrObj.parentFolder = frFolderObj;
			}
		}
}
// **** FUNCTION StartSetUp() *****************************************************************************************************
//		選択コンポの配列をコンポ階層の上下順に並び替え
		function SortCompHierarchy( tgtComp )
{
		var curCompList = [];
		for ( var i = 0; i < tgtComp.length; i++ )
		{
			if ( tgtComp[i].usedIn.length == 0 )
			{
				curCompList.push(tgtComp[i]);
			}
		}		
		for ( var i = 0; i < tgtComp.length; i++ )
		{
			var spliceIndex = curCompList.length;
			if ( tgtComp[i].usedIn.length > 0 )
			{
				for ( var u = 0; u < tgtComp[i].usedIn.length; u++ )
				{
					for ( var z = 0; z < curCompList.length; z++ )
					{
						if ( tgtComp[i].usedIn[u].id == curCompList[z].id )
						{
							 var spliceIndex = z + 1;
						}
					}
				}
				curCompList.splice(spliceIndex,0,tgtComp[i]);
			}
		}
		return curCompList.reverse();
}
// **** FUNCTION EditCompSettings() ChangeCompDuration()********************************************************************
//		レイヤーのアウトポイントをコンポ末尾に
		function AdjustLayerOutPoint( curDuration , newDuration , curLayerList )
{
		for ( y = 1; y <= curLayerList.length; y++ )
		{
			if ( curLayerList[y].outPoint >= curDuration )
			{
				if ( curLayerList[y].locked == true )
				{
					curLayerList[y].locked = false;
					curLayerList[y].outPoint = newDuration;
					curLayerList[y].locked = true;
				}
				else
				{ curLayerList[y].outPoint = newDuration;}
			}
		}
}
// **** FUNCTION StartSetUp() *****************************************************************************************************
//		
		function SetUP()
{
		//平面フッテージ収集
		scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "collectSolids.jsx" );

		//色深度設定
		app.project.bitsPerChannel = getCurProjectColorDepth;
		
		//撮影作業に必要なプロジェクトウィンドウ内のフォルダを開いた状態にする
		var zoCompSelect = null;
		for ( i = 1; i <= app.project.numItems; i++ )
		{
			if ( 
				app.project.item(i).name.match(/BG$|cell$|Fr$/)
				&&
				app.project.item(i) instanceof FolderItem
				&&
				!(app.project.item(i+1).name.match(/BG$|cell$|Fr$|comp$/))
				)
				{ app.project.item(i+1).selected = false; }
	
			if (
				app.project.item(i).name.split("_")[0] == getCurProjectName.split("_")[0]
				&&
				app.project.item(i) instanceof CompItem
				)
				{ app.project.item(i).selected = false; }
			if (
				app.project.item(i).name.match(/^01_comp_/)
				&&
				app.project.item(i) instanceof CompItem
				&&
				zoCompSelect != true
				)
				{ app.project.item(i).selected = true; zoCompSelect = true;}
				
			
			if (app.project.item(i) instanceof CompItem)
			{
				//CSUMiDに基づいて作業者名を更新
				for ( l = 1; l <= app.project.item(i).numLayers; l++ )
				{
					if ( app.project.item(i).layer(l).comment.match(/#UserName/igm) )
					{
						app.project.item(i).layer(l).locked = false;
						app.project.item(i).layer(l).name = "Over Ray Studio : " + csumiDName.charAt(0).toUpperCase() + csumiDName.slice(1,csumiDName.length).toLowerCase();
						app.project.item(i).layer(l).locked = true;
					}
				}

				// デフォルトカメラの位置・目標点・ズームをリセット
				curComp = app.project.item(i);
				scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "resetDefaultCamera.jsx" );
			}
			
			//コメント欄に「#SceneFilter」の表記があったら適用された「ブレンド」エフェクトのレイヤー選択を「02_camera」にする
			for ( l = 1; l <= app.project.item(i).numLayers; l++ )
			{
				if ( app.project.item(i).layer(l).comment.match(/#SceneFilter/igm))
				{
					var curLayer = app.project.item(i).layer(l);
					for(var e=1; e<=curLayer.property("ADBE Effect Parade").numProperties; e++)
					{
						if ( curLayer.property("ADBE Effect Parade")(e).matchName == "ADBE Blend" )
						{
							for ( L = app.project.item(i).numLayers; L >= 1 ; L-- )
							{
								if (app.project.item(i).layer(L).name.match(/02_camera/i))
								{
									curLayer.property("ADBE Effect Parade")(e)(1).setValue(L);
									break;
								}
							}
						}
					}
				}
			}
		}
	
		//「コンポジション設定」ダイアログの「高度」タブの「ネスト時またはレンダーキューでフレームレートを保持」オプション設定
		//　基本全てON
		//　ただし伸縮が100%以外でコメント欄に『#pFPS』と書いてあったらOFF
		if ( getWF ( curWFindex ,"[EffectSettings]","PreserveFps") == "true" )
		{
			for ( i = 1; i <= app.project.numItems; i++ )
			{
				if ( app.project.item(i) instanceof CompItem ) { app.project.item(i).preserveNestedFrameRate = true; }
			}
			for ( i = 1; i <= app.project.numItems; i++ )
			{
				if ( app.project.item(i) instanceof CompItem )
				{
					for ( l = 1; l <= app.project.item(i).numLayers; l++ )
					{
						if (
							app.project.item(i).layer(l).source instanceof CompItem &&
							app.project.item(i).layer(l).stretch != 100 &&
							app.project.item(i).layer(l).comment.match(/#pFPS/igm)
						)
						{ app.project.item(i).layer(l).source.preserveNestedFrameRate = false; }
					}
				}
			}
		}
	
		//プロジェクトを保存
		var curProjectFile = new File(curAepFolder.fsName+"/"+newProjectName);
		app.project.save(curProjectFile);
}
// **** FUNCTION ******************************************************************************************************************
//		フォルダを名前で検索し、なければ作成して返す
		function findOrAddFolder( parentFolder, name )
{
		for ( var k = 1; k <= parentFolder.items.length; k++ ) {
			if ( parentFolder.items[k] instanceof FolderItem && parentFolder.items[k].name.toLowerCase() == name.toLowerCase() ) { return parentFolder.items[k]; }
		}
		return parentFolder.items.addFolder( name );
}
// **** FUNCTION ******************************************************************************************************************
//		MultiCompSetUP用: コンテナフォルダ内の _comp を1段フラット化
		function flattenInnerCompFolder( containerFolder )
{
		var innerComp = null;
		for ( var k = 1; k <= containerFolder.items.length; k++ ) {
			if ( containerFolder.items[k] instanceof FolderItem && containerFolder.items[k].name == "_comp" ) {
				innerComp = containerFolder.items[k]; break;
			}
		}
		if ( innerComp == null ) { return; }
		var moveList = [];
		for ( var m = 1; m <= innerComp.items.length; m++ ) { moveList.push( innerComp.items[m] ); }
		for ( var m = 0; m < moveList.length; m++ ) { moveList[m].parentFolder = containerFolder; }
		innerComp.remove();
}
// **** FUNCTION ******************************************************************************************************************
//		スクリプトファイルの実行
		function scriptExecute( scriptFilePath )
{
		var scriptFileName = new File( scriptFilePath );
		scriptFileName.open();
		eval(scriptFileName.read());
		scriptFileName.close();
}