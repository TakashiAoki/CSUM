// BatchRender Ver.3.8.1
// Copyright (c) 2007-2026 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2026/06/05
// 選択コンポジションのレンダリング保存先、レンダリング設定、出力モジュール、デュレーション設定、ファイル収集までを一括処理します。

var curScriptName = "BatchRender";

// **** Main Script ***************************************************************************************************************
		flag = null;
							ProjectCheck();
		if ( !flag )	CompSelectCheck();
		if ( !flag )
		{
			var activeItem = app.project.activeItem;
			var selectItem = app.project.selection;
			var targetCompName = null;
		}
		if ( !flag ) ActiveCompDetection();
		if ( !flag ) codeCollation();
		
		if ( !flag )
		{
			RenderQueueAddItems();
			//app.project.renderQueue.showWindow( false );//レンダーキューウィンドウを非表示
			GetTemplatesList();
			BuildAndShowDialog();
		}

		if ( !flag && Btnon == "Cancel" )
		{
			UndoRenderQueueItems();
		}
		if ( !flag && Btnon == "Add Queue" )
		{
			scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "collectSolids.jsx" );
			//scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "logScriptExeDate.jsx" );
			if ( codeMatchCompList != null )
			{
				for ( var w = 0; w < codeMatchCompList.length; w++ )
				{
					curWorkComp =  codeMatchCompList[w];
					//scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "logCutWorkDate.jsx" );
				}
			}
			app.beginUndoGroup(curScriptName);
			RenderQueueSetUp();
			if ( saveFlag == false || RsOmflag == true ) UndoRenderQueueItems();
			if ( RsOmflag == null )
			{
				FlickerFilterSetUp();
				SceneFilterSetUp();
				PreserveNestedFrameRate();
				UpdateUserName();
				app.project.renderQueue.showWindow( true );//レンダーキューウィンドウを表示
			}
			app.endUndoGroup();
		}
		if ( !flag && Btnon == "Collect Files" )
		{
			scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "collectSolids.jsx" );
			//scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "logScriptExeDate.jsx" );
			if ( codeMatchCompList != null )
			{
				for ( var w = 0; w < codeMatchCompList.length; w++ )
				{
					curWorkComp =  codeMatchCompList[w];
					//scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "logCutWorkDate.jsx" );
				}
			}
			app.beginUndoGroup(curScriptName);
			RenderQueueSetUp();
			if ( saveFlag == false || RsOmflag == true ) UndoRenderQueueItems();
			if ( RsOmflag == null )
			{
				FlickerFilterSetUp();
				SceneFilterSetUp();
				PreserveNestedFrameRate();
				UpdateUserName();
				app.project.renderQueue.showWindow( true );//レンダーキューウィンドウを表示
				if ( saveFlag == true ) { saveFlag = app.project.save( app.project.file ); }
				if ( saveFlag == true ) app.executeCommand(2482);//ファイル＞依存関係＞ファイルを収集...
			}
			app.endUndoGroup();
		}

// **** FUNCTION ******************************************************************************************************************
//		プロジェクトの状態チェック
		function ProjectCheck()
{	
		if ( app.project == null || app.project.file == null ) { flag = true; alert ( "プロジェクトを開いて、１つ以上のコンポジションを選択して下さい" ); }
}
// **** FUNCTION ******************************************************************************************************************
//		コンポジションの選択状態チェック
		function CompSelectCheck()
{	
		if ( app.project.activeItem == null && app.project.selection.length == 0 ) { flag = true; alert ( "１つ以上のコンポジションを選択して下さい" ); }
}
// **** FUNCTION ******************************************************************************************************************
//		アクティブコンポ検出
		function ActiveCompDetection()
{		
		if ( activeItem != null ) { PatternSingleActiveComp() } else { PatternMultiActiveComp() }	
}
// **** FUNCTION ActiveCompDetection() ********************************************************************************************
//		アクティブアイテムが１つの場合
		function PatternSingleActiveComp()
{
		if (activeItem instanceof CompItem)
		{	
			selectComp = new Array();
			selectComp[0] = activeItem;			
			targetCompName = selectComp[0].name;
			compDuration = selectComp[0].duration;
			compFrameRate = selectComp[0].frameRate;
		}
		else
		{ alert( "１つ以上のコンポジションを選択して下さい" ); flag = true; }
}
// **** FUNCTION ActiveCompDetection() ********************************************************************************************
//		アクティブアイテムが複数の場合
		function PatternMultiActiveComp()
{
					 CheckSelectItem();
		if ( !flag ) GetSelectCompSettings();
}
// **** FUNCTION ActiveCompDetection() PatternMultiActiveComp() *******************************************************************
//		アクティブアイテムが複数の場合＞コンポアイテムのみ選出
		function CheckSelectItem()
{		
		n = selectItem.length;
		for ( i = 0; i < n; i++ ) {if ( !(selectItem[i] instanceof CompItem) ) selectItem[i].selected = false }
		try { selectComp = app.project.selection; } catch(e) { alert( "１つ以上のコンポジションを選択して下さい" ); flag = true; }	
}
// **** FUNCTION ActiveCompDetection() PatternMultiActiveComp() *******************************************************************
//		選出コンポパラメーター取得
		function GetSelectCompSettings()
{
		var n = selectComp.length;
		for ( i = 0; i < n; i++ )
		{ var N = null; if ( n > 1 && N != true ) { targetCompName = "[multi]"; N = true; } else { targetCompName = selectComp[i].name; } }
}
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
//		タイトルコード照合コンポ選出とworkFormat情報取得
		function codeCollation()
{
		codeMatchCompList = [];
		var n = selectComp.length;
		var m = workFormat.length;
		var p = 0;
		wf = null;
		saveCategory = "_Others";
		for ( var i = 0; i <= n-1; i++ )
		{
			var curCompName = selectComp[i].name;
			var curCompCode = curCompName.split("_")[0];
			for ( var r = 0; r <= m-1; r++ )
			{
				var comparisonCode = getWF ( r ,"[ProjectTitleName]","codeName");
				if ( curCompCode == comparisonCode )
				{
					curWFindex = r ;
					curTokenStr = getWF ( curWFindex ,"[TokenSettings]","RenderingCompName")//最終コンポ名のトークン設定
					for( var t = 0; t < curTokenStr.split("_").length; t++ )
					{
						if ( curTokenStr.split("_")[t] == "[take]" )
						{ var Take = curCompName.split("_")[t].toUpperCase(); }
					}
					
					switch ( Take.charAt(0) )
					{
						case "S" : var wf = 2; break;
						case "Y" : var wf = 1; break;
						//case "T" : if ( Take.substr(1,10) == 0 ) { wf = 2 } else { wf = 1 } ; break;
						case "T" : var wf = 1; break;//本撮・タイミング撮ともに同設定
						default : wf = 3;
					}
					break;
				}else { wf = null; }
			}
				
			if ( wf == 1 || wf == 2 )
			{
				saveCategory = "";
				curTokenStr = getWF ( curWFindex ,"[TokenSettings]","SaveCategoryFolderName");//保存作品カテゴリフォルダ名のトークン設定
				scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "analysisTokenStr.jsx" );
				for (var s = 0; s < curTokenArray.length; s++)
				{
					switch ( curTokenArray[s] )
					{
						case "[titleCode]" : saveCategory += curCompCode.toUpperCase(); break;
						case "[act]" : saveCategory += curCompName.split("_")[1]; break;
						default : saveCategory += curTokenArray[s];
					}
				}
			}
			if ( wf == 1 )
			{
				codeMatchCompList.push(selectComp[i]);
				//conformFractionFrame = workFormat[r].split(TAB)[8];
				seqRenderSettings = getWF ( curWFindex ,"[FinalRenderSettings]","Sequence : RenderSettings");
				seqOutputModule = getWF ( curWFindex ,"[FinalRenderSettings]","Sequence : OutputModule");
				flickerFilterOptionIndex = 0;
				postRenderOptionIndex = 0;
				p++;
			}
			if ( wf == 2 )
			{
				codeMatchCompList.push(selectComp[i]);
				//conformFractionFrame = workFormat[r].split(TAB)[23];
				seqRenderSettings = getWF ( curWFindex ,"[TimingRenderSettings]","Sequence : RenderSettings");
				seqOutputModule = getWF ( curWFindex ,"[TimingRenderSettings]","Sequence : OutputModule");
				flickerFilterOptionIndex = 1;
				postRenderOptionIndex = 1;
				p++;
			}
			if ( wf == 3 )
			{
				//conformFractionFrame = 0;
				seqRenderSettings = "マルチマシン設定";
				seqOutputModule = "PNG_16bit";
				flickerFilterOptionIndex = 2;
				postRenderOptionIndex = 2;
				p++;
			}
		
			if ( wf != null && getWF ( curWFindex ,"[TokenSettings]","SaveSequenceName") == "---" ){ postRenderOptionIndex = 1; }
			
			if ( i == 0 ) { curWf = wf; }
			else
			{
				befWf = curWf; curWf = wf;
				if ( befWf  != curWf ) p = -1;
			}
		}
		if ( p == 0 )
		{	//_Other行きレンダーキュー
			codeMatchCompList = null;
			//conformFractionFrame = 0;
			seqRenderSettings = "マルチマシン設定";
			seqOutputModule = "PNG_16bit";
			flickerFilterOptionIndex = 2;
			postRenderOptionIndex = 2;
			curWf  = 3;
		}
		if ( p == -1 )
		{
			flag = true;
			alert("エラー"+CR+"異なる設定が必要なコンポジションが複数選択されています");			
			//複数フォーマットによる処理分岐はとりあえずしない
			//線撮・タイミング・本撮混在など
			/*
			codeMatchCompList = null;
			conformFractionFrame = 0;
			seqRenderSettings = "マルチマシン設定";
			seqOutputModule = "PNG_16bit";
			flickerFilterOptionIndex = 2;
			*/
		}
}
// **** FUNCTION ******************************************************************************************************************
//		レンダーキューに選択コンポジションを追加
		function RenderQueueAddItems()
{
		//既定のキューをUNQUEUED状態にする
		defItemRnderList = [];
		defRQItemNum = app.project.renderQueue.numItems;
		for ( x = 1; x <= defRQItemNum; x++ )
		{
			defItem = app.project.renderQueue.items[x];
			defItemRnderList.push(defItem.render);
			if (
				defItem.status != RQItemStatus.RENDERING &&
				defItem.status != RQItemStatus.USER_STOPPED &&
				defItem.status != RQItemStatus.ERR_STOPPED &&
				defItem.status != RQItemStatus.DONE
				)
				{ defItem.render = false; }
		}
		//「環境設定>出力設定>デフォルトのファイル名とフォルダを使用」をOffに
		var sectionName = "Misc Section";
		var sectionKey = "Guess Default Output File Name";
		if ( app.preferences.havePref( sectionName , sectionKey ) == true )
		{
			defPrefValue = app.preferences.getPrefAsBool( sectionName , sectionKey );
			app.preferences.savePrefAsBool( sectionName , sectionKey , false );
		}
		//選択コンポをキューに追加・設定
		curItemList = [];
		var n = selectComp.length;
		for ( i = 0; i < n; i++ )
		{
			curItem = app.project.renderQueue.items.add(selectComp[i]);//キューにコンポを追加
			curItemList.push(curItem);
		}
		//「環境設定>出力設定>デフォルトのファイル名とフォルダを使用」を元に戻す
		if ( app.preferences.havePref( sectionName , sectionKey ) == true )
		{
			app.preferences.savePrefAsBool( sectionName , sectionKey , defPrefValue );
		}
}
// **** FUNCTION ******************************************************************************************************************
//		レンダリング設定・出力モジュールのリストを取得・フリッカーフィルターリストを設定
		function GetTemplatesList()
{
		scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getRsOmList.jsx" );

		seqRenderSettingsIndex = 0;
		seqOutputModuleIndex = 0;

		if ( RsTempList.length > 0 )
		{
			for ( i = 0 ; i < RsTempList.length; i++ )
			{
				if ( RsTempList[i].toString() == seqRenderSettings ) { seqRenderSettingsIndex = i; break; }
			}
		}

		if ( OmTempList.length > 0 )
		{
			for ( i = 0 ; i < OmTempList.length; i++ )
			{
				if ( OmTempList[i].toString() == seqOutputModule ) { seqOutputModuleIndex = i; break; }
			}
		}
		
		FfOptionList = ["All On","All Off","Current Settings"];
		PrOptionList = ["ImportReplace & MovExport","MovExport Only","Off"];
}
// **** FUNCTION ******************************************************************************************************************
//		レンダーキューを元に戻す
		function UndoRenderQueueItems()
{
		//既定のキュー以外を削除する
		curRQItemNum = app.project.renderQueue.numItems;
		for ( x = curRQItemNum; x > defRQItemNum; x-- ) { app.project.renderQueue.items[x].remove(); }
		//レンダリングチェックを元に戻す
		for ( x = 1; x <= defRQItemNum; x++ )
		{
			if (
				app.project.renderQueue.items[x].status != RQItemStatus.RENDERING &&
				app.project.renderQueue.items[x].status != RQItemStatus.USER_STOPPED &&
				app.project.renderQueue.items[x].status != RQItemStatus.ERR_STOPPED &&
				app.project.renderQueue.items[x].status != RQItemStatus.DONE
			)
			{ app.project.renderQueue.items[x].render = defItemRnderList[x-1]; }
		}
		//for ( x = 0; x <= mRItemList.length; x++ ) { mRItemList[x].remove(); }
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
//		レンダリング保存先ディレクトリ読み込み
		function loadSaveDirectory( scriptName , itemName )
{
		var sectionName = "CSUMCC " + scriptName;
		var sectionKey = itemName;
		
		var loadflag = app.settings.haveSetting( sectionName , sectionKey );

		if ( loadflag == true )
		{
			mySaveDirectory = new Folder( app.settings.getSetting( sectionName , sectionKey ) );
		}
		else
		{
			mySaveDirectory = null;
			for ( i = 0; mySaveDirectory == null; i++ ) { mySaveDirectory = Folder.selectDialog("Output to..."); }
			var saveValue = mySaveDirectory.fsName;
			app.settings.saveSetting( sectionName , sectionKey , saveValue );
		}
}
// **** FUNCTION ******************************************************************************************************************
//		レンダリング保存先ディレクトリ記憶
		function saveSaveDirectory( scriptName , itemName , folderObj )
{
		var sectionName = "CSUMCC " + scriptName;
		var sectionKey = itemName;
		var saveValue = folderObj.fsName;
		app.settings.saveSetting( sectionName , sectionKey , saveValue );
}
// **** FUNCTION ******************************************************************************************************************
//		ダイアログ表示
		function BuildAndShowDialog()
{
		loadWindowOffset( "Batch Render" , "brDlg" );
		loadSaveDirectory( "Batch Render" , "My Save Directory" );
		brDlg = new Window ( "dialog" , curScriptName , [0,0,568,400] + windowOffset );
			
		compNameCaption = brDlg.add( "statictext" , [16,16,240,36] , "Composition Name :" ); compNameCaption.justify="right";
		compName = brDlg.add( "statictext" , [250,16,552,36] , targetCompName );
		
		ssPnl = brDlg.add( "panel" , [16,44,552,140] , "Save Settings" );
		
			sdFlagCb = ssPnl.add( "checkbox" , [16,25.5,124,47.5] , " Save Directory :" ); sdFlagCb.value = true;
			saveDirectoryEdit = ssPnl.add( "edittext" , [132,25.5,430,47.5] , mySaveDirectory.fsName ); saveDirectoryEdit.justify = "left";
			chooseBtn = ssPnl.add( "button" , [440,26,520,46] , "Choose..." );
			csfFlagCb = ssPnl.add( "checkbox" , [16,61.5,240,83.5] , " Sequence to create a New Folder " ); csfFlagCb.value = true;
			elfFlagCb = ssPnl.add( "checkbox" , [256,61.5,520,83.5] , " Export Log file " ); elfFlagCb.value = true;
		
		stPnl = brDlg.add( "panel" , [16,148,552,244] , "Select Templates" );
			
			renderSettingsCaption = stPnl.add( "statictext" , [16,28,124,48] , " Render Settings :" ); renderSettingsCaption.justify = "right";
			renderSettingsName = stPnl.add( "dropdownlist" , [134,26,430,46] , RsTempList );
			renderSettingsName.selection = renderSettingsName.items[seqRenderSettingsIndex];
			
			outputModuleCaption = stPnl.add( "statictext" , [16,62,124,82] , " Output Module :" ); outputModuleCaption.justify = "right";
			outputModuleName = stPnl.add( "dropdownlist" , [134,60,430,80] , OmTempList );
			outputModuleName.selection = outputModuleName.items[seqOutputModuleIndex];
			
		opPnl = brDlg.add( "panel" , [16,252,552,348] , "Options" );
		
			flickerFilterOptionCaption = opPnl.add( "statictext" , [16,28,124,48] , " Flicker Filter :" ); flickerFilterOptionCaption.justify = "right";
			flickerFilterOptionName = opPnl.add( "dropdownlist" , [134,26,320,46] , FfOptionList );
			flickerFilterOptionName.selection = flickerFilterOptionName.items[flickerFilterOptionIndex];
			
			postRenderOptionCaption = opPnl.add( "statictext" , [8,62,124,82] , " Post-Render Action :" ); postRenderOptionCaption.justify = "right";
			postRenderOptionName = opPnl.add( "dropdownlist" , [134,60,320,80] , PrOptionList );
			postRenderOptionName.selection = postRenderOptionName.items[postRenderOptionIndex];
			
		if ( codeMatchCompList == null ) { codeCollation = "Off" } else { codeCollation = "On" };
		codeCollationCaption = brDlg.add( "statictext" , [16,332+34,240,352+34] , " Code Collation : "+codeCollation ); codeCollationCaption.justify = "left";
		
		cancelBtn = brDlg.add( "button" , [244,330+34,340,350+34] , "Cancel" , {name:"cancel"} );
		addQueueBtn = brDlg.add( "button" , [350,330+34,446,350+34] , "Add Queue" );
		collectFilesBtn = brDlg.add( "button" , [456,330+34,552,350+34] , "Collect Files" , {name:"ok"} );
		
		sdFlagCb.onClick = function() { if ( sdFlagCb.value == false ) {csfFlagCb.value = false; elfFlagCb.value = false;} }
		chooseBtn.onClick = function()
		{
			mySaveDirectory = Folder.selectDialog("Output to...");
			if ( mySaveDirectory != null )
			{
				saveDirectoryEdit.text = mySaveDirectory.fsName;
				saveSaveDirectory( "Batch Render" , "My Save Directory" , mySaveDirectory );
				sdFlagCb.value = true;
			}
		}
		csfFlagCb.onClick = function() { if ( sdFlagCb.value == false ) {csfFlagCb.value = false; elfFlagCb.value = false;} }
		
		cancelBtn.onClick = function() { Btnon = "Cancel"; brDlg.close(); }
		addQueueBtn.onClick = function() { Btnon = "Add Queue"; brDlg.close(); }
		collectFilesBtn.onClick = function() { Btnon = "Collect Files"; brDlg.close(); }
		brDlg.onShow = function() { collectFilesBtn.active = true; }
		brDlg.onMove = function() { saveWindowOffset( "Batch Render" , "brDlg" , brDlg ) }
		if ( windowOffset.toString() == "0,0,0,0" ) { brDlg.center(); }
		brDlg.show();
}
// **** FUNCTION ******************************************************************************************************************
//		追加コンポジションのキューの設定
		function RenderQueueSetUp()
{
		sdFlag = sdFlagCb.value;
		saveDirectory = new Folder(saveDirectoryEdit.text);
		csfFlag = csfFlagCb.value;
		elfFlag = elfFlagCb.value;
		sfcFlag = null;
		saveFlag = null;
		renderSettings = renderSettingsName.selection.text;
		outputModule = outputModuleName.selection.text;
		postRenderAction = postRenderOptionName.selection.index;

		RsOmflag = null;

		switch ( postRenderAction )
		{
			case 0 : SeqRenderSetUp(); MovRenderSetUp(); break;
			case 1 : MovRenderSetUp(); for ( i = 0; i < curItemList.length; i++ ){ curItemList[i].remove(); }; break;
			case 2 : SeqRenderSetUp(); break;
		}
		
		//出力モジュールに合わせて色深度を変更
		if ( outputModule.match(/_8bit|TGA/i) ) app.project.bitsPerChannel = 8;
		if ( outputModule.match(/_16bit|10Bit/i) ) app.project.bitsPerChannel = 16;
}
// **** FUNCTION RenderQueueSetUp()***********************************************************************************
//		シーケンスレンダーの設定
		function SeqRenderSetUp()
{
		if ( analysisRsOm( seqRenderSettings , seqOutputModule ) != true )
		{
			alert("シーケンスレンダーに必要なレンダリング設定・出力モジュールがありません。");
		}
		else
		{	
			for ( i = 0; i < curItemList.length; i++ )
			{
				curItemList[i].applyTemplate( renderSettings );//レンダリング設定
				
				curItemList[i].outputModule(1).applyTemplate( "QT Animation" );//出力モジュールを設定
			
				//コンポジション名からファイル名禁止文字を削除
				str = curItemSaveName = curItemList[i].comp.name;
				var result = "";
				for ( x = 0; str != result; x++ )
				{
					var str = result;
					if ( x == 0 ) 
					{ var result = curItemSaveName.replace(/\s|^\.|\.$|^\_|\_$|^\,|\,$|\\|\/|#/,""); }
					else
					{ var result = str.replace(/\s|^\.|\.$|^\_|\_$|^\,|\,$|\\|\/|#/,""); }
				}
				curItemSaveName = result;
				
				if ( sdFlag == true )
				{
					if ( saveDirectory.exists == true )
					{
						if ( csfFlag == true ) { CreateSaveFolder(); }
						if ( sfcFlag == true )
						{ curItemList[i].outputModule(1).file = new File(saveFolder.fsName + "/" + curItemSaveName + ".mov"); }
						else
						{ curItemList[i].outputModule(1).file = new File(saveDirectory.fsName + "/" + curItemSaveName + ".mov"); }
						saveFlag = true;
					}
					else
					{ alert("保存先ディレクトリが見つかりません"); saveFlag = false; break; }
				}
				
				curItemList[i].outputModule(1).applyTemplate( outputModule );//出力モジュールを設定
				
				switch ( postRenderAction )
				{
					case 0 : curItemList[i].outputModule(1).postRenderAction = PostRenderAction.IMPORT_AND_REPLACE_USAGE; break;
					case 1 : curItemList[i].outputModule(1).postRenderAction = PostRenderAction.NONE; break;
					case 2 : curItemList[i].outputModule(1).postRenderAction = PostRenderAction.NONE; break;
					default : curItemList[i].outputModule(1).postRenderAction = PostRenderAction.NONE;
				}
			}
		}
}
// **** FUNCTION RenderQueueSetUp()***********************************************************************************
//		ムービーレンダーの設定
		function MovRenderSetUp()
{
		if ( saveFlag != false )
		{
			mRCompObj = new Array();
			mRItemList = new Array();
			for ( z = 1; z <= app.project.numItems; z++ )
			{
				if (app.project.item(z) instanceof CompItem)
				{ if ( app.project.item(z).name.lastIndexOf("_movexp") != -1 ) app.project.item(z).remove(); }
			}
			for ( i = 0; i < curItemList.length; i++ )
			{
				mRcompName = curItemList[i].comp.name+"_movexp";
				if ( curWf == 1 )
				{
					mRcompX = eval(getWF ( curWFindex ,"[FinalRenderSettings]","X"));
					mRcompY = eval(getWF ( curWFindex ,"[FinalRenderSettings]","Y"));
					mRcompFps = eval(getWF ( curWFindex ,"[FinalRenderSettings]","FPS"));
					mRrenderSettings = getWF ( curWFindex ,"[FinalRenderSettings]","Mov : RenderSettings");
					mRoutputModule = getWF ( curWFindex ,"[FinalRenderSettings]","Mov : OutputModule");
				}
				if ( curWf == 2 )
				{
					mRcompX = eval(getWF ( curWFindex ,"[TimingRenderSettings]","X"));
					mRcompY = eval(getWF ( curWFindex ,"[TimingRenderSettings]","Y"));
					mRcompFps = eval(getWF ( curWFindex ,"[TimingRenderSettings]","FPS"));
					mRrenderSettings = getWF ( curWFindex ,"[TimingRenderSettings]","Mov : RenderSettings");
					mRoutputModule = getWF ( curWFindex ,"[TimingRenderSettings]","Mov : OutputModule");
				}
				if ( curWf == 1 || curWf == 2 )
				{
					curTokenStr = getWF ( curWFindex ,"[TokenSettings]","RenderingCompName");//最終コンポ名のトークン設定
					for( var t = 0; t < curTokenStr.split("_").length; t++ )
					{
						switch ( curTokenStr.split("_")[t] )
						{
							case "[titleCode]" : var titleCodeIndex = t; break;
							case "[act]" : var actIndex = t; break;
							case "[cutNo]" : var cutNoIndex = t; break;
							case "[take]" : var takeIndex = t; break;
						}
					}
					mRItemSaveName = "";
					curTokenStr = getWF ( curWFindex ,"[TokenSettings]","SaveMovName");//保存ムービー名のトークン設定
					scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "analysisTokenStr.jsx" );
					for (var s = 0; s < curTokenArray.length; s++)
					{
						switch ( curTokenArray[s] )
						{
							case "[titleCode]" : mRItemSaveName += mRcompName.split("_")[titleCodeIndex]; break;
							case "[act]" : mRItemSaveName += mRcompName.split("_")[actIndex]; break;
							case "[cutNo]" : mRItemSaveName += mRcompName.split("_")[cutNoIndex]; break;
							case "[take]" : mRItemSaveName += mRcompName.split("_")[takeIndex]; break;
							case "[fileExtension]" : mRItemSaveName += "mov"; break;
							default : mRItemSaveName += curTokenArray[s];
						}
					}
					mRcompDuration = curItemList[i].comp.duration*curItemList[i].comp.frameRate/mRcompFps;
				}
				if ( curWf == 3 )
				{
					mRcompX = curItemList[i].comp.width;
					mRcompY = curItemList[i].comp.height;
					mRcompDuration = curItemList[i].comp.duration;
					mRcompFps = curItemList[i].comp.frameRate;
					//mRrenderSettings = "最良設定";
					//mRoutputModule = "ロスレス圧縮（アルファ付き）";
					mRrenderSettings = "Best Settings";
					mRoutputModule = "QT Animation";
					mRItemSaveName = app.project.file.name.split(".aep")[0]+"_"+curItemList[i].comp.name+".mov";
				}
				
				if (getWF ( curWFindex ,"[TokenSettings]","SaveSequenceName") != "-")
				{
					mRCompObj[i] = app.project.items.addComp(mRcompName,mRcompX,mRcompY ,1,mRcompDuration,mRcompFps);
					mRCompObj[i].duration = mRcompDuration;
					mRCompObj[i].parentFolder = curItemList[i].comp.parentFolder;
					
					mRLayer = mRCompObj[i].layers.add( curItemList[i].comp );
					mRLayer.scale.expression ="[ scale[0]/width*thisComp.width , scale[1]/height*thisComp.height ]";
					mRLayer.stretch = curItemList[i].comp.frameRate/mRcompFps*100;
					mRLayer.timeRemapEnabled = true;
					if ( mRLayer.scale.value != "100,100,100" )
					{
						var ALshape = mRCompObj[i].layers.addShape();//新規シェイプレイヤー作成
						ALshape.position.expression = "X = thisComp.width; Y = thisComp.height; [X,Y]/2";
						ALshape.moveToBeginning();//シェイプを最上位レイヤーに移動
						ALshape.name = "AdjustmentLayer 1";//名称変更
						var Rect = ALshape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Shape - Rect");
						Rect.property("ADBE Vector Rect Size").expression = "X = thisComp.width; Y = thisComp.height; [X,Y]";
						var Fill = ALshape.property("ADBE Root Vectors Group").addProperty("ADBE Vector Graphic - Fill");
						Fill.property("ADBE Vector Fill Color").setValue([0,0,0,1]);
						ALshape.adjustmentLayer = true;
						var curFx = ALshape.property("ADBE Effect Parade").addProperty("ADBE Shift Channels");//チャンネルシフト適用
						curFx(1).setValue(9);
					}
				}
				else
				{
					mRCompObj[i] = curItemList[i].comp;
				}
			
				if ( analysisRsOm( mRrenderSettings , mRoutputModule ) != true )
				{
					alert(mRoutputModule);
					alert("ムービーレンダーに必要なレンダリング設定・出力モジュールがありません。");
				}
				else
				{
					//選択コンポをキューに追加・設定
					mRItem = app.project.renderQueue.items.add(mRCompObj[i]);//キューにコンポを追加
					for ( m = curItemList.length-i-1; m > 0; m-- )
					{
						app.executeCommand(2018);//レンダリングアイテムを前面に移動
					}
					
					mRItemList.push(mRItem);
					mRItemList[i].applyTemplate( mRrenderSettings );//レンダリング設定
					mRItemList[i].outputModule(1).applyTemplate( mRoutputModule );//出力モジュールを設定
				
					//コンポジション名からファイル名禁止文字を削除
					str = mRItemSaveName;
					var result = "";
					for ( x = 0; str != result; x++ )
					{
						var str = result;
						if ( x == 0 ) 
						{ var result = mRItemSaveName.replace(/\s|^\.|\.$|^\_|\_$|^\,|\,$|\\|\/|#/,""); }
						else
						{ var result = str.replace(/\s|^\.|\.$|^\_|\_$|^\,|\,$|\\|\/|#/,""); }
					}
					mRItemSaveName = result;
					
					if ( sdFlag == true )
					{
						if ( curWf  != 3 )
						{ mRsaveDirectory = new Folder( getWF ( curWFindex ,"[SaveSettings]","MovExFolder") + "/" + saveDirectory.name ); }
						else
						{
							// WF未マッチ時のムービー出力先: app.settings に記憶、未設定時はダイアログで選択（Win/Mac両対応）
							var _movExSec = "CSUMCC BatchRender";
							var _movExKey = "Movie Export Directory (wf3)";
							var _movExDir = null;
							if ( app.settings.haveSetting( _movExSec, _movExKey ) ) {
								_movExDir = new Folder( app.settings.getSetting( _movExSec, _movExKey ) );
								if ( !_movExDir.exists ) _movExDir = null;
							}
							if ( _movExDir == null ) {
								_movExDir = Folder.selectDialog( "ムービー出力先フォルダを選択してください" );
								if ( _movExDir == null ) { saveFlag = false; break; }
								app.settings.saveSetting( _movExSec, _movExKey, _movExDir.fsName );
							}
							mRsaveDirectory = new Folder( _movExDir.fsName + "/" + saveDirectory.name );
						}
						if ( mRsaveDirectory.exists == false ) mRsaveDirectory.create();
						if ( mRsaveDirectory.exists == false ) { alert("ムービー保存先ディレクトリが見つかりません"); saveFlag = false; break; }
						
						//YGA用例外処理 パートごとのsaveCategoryフォルダを作成しないでYGAフォルダにまとめる
							//パート・話数フォルダ分けが不要作品の分岐をココで行う
						if ( saveCategory.indexOf ("YGA_") == 0 ){ saveCategory = "YGA"; }

						mRsaveCategoryFolder = new Folder(mRsaveDirectory.fsName + "/" + saveCategory);
						if ( mRsaveCategoryFolder.exists == false ) mRsaveCategoryFolder.create();
						mRsaveFile = new File( mRsaveCategoryFolder.fsName + "/" + mRItemSaveName );
						//既に保存先ファイルがあった場合の処理
						for ( x = 2; mRsaveFile.exists == true; x++ )
						{ mRsaveFile = new File(mRsaveCategoryFolder.fsName + "/" + mRItemSaveName.split(".mov")[0] + "v" + x + ".mov"); }
						mRItemList[i].outputModule(1).file = mRsaveFile;
						saveFlag = true;
					}
					if ( curWf == 1 && getWF ( curWFindex ,"[FinalRenderSettings]","checkMov : RenderSettings") != "---" )
					{
						chkMovOM = mRItemList[i].outputModules.add();
						chkMovOM.applyTemplate( getWF ( curWFindex ,"[FinalRenderSettings]","checkMov : OutputModule") );//出力モジュールを設定
						chkMovSaveFolder = new Folder( mRsaveFile.path + "/SD" );
						if ( chkMovSaveFolder.exists != true ) chkMovSaveFolder.create();
						chkMovOM.file = new File(chkMovSaveFolder.fsName+ "/" + mRsaveFile.name);
					}
				}
			}
		}
}
// **** FUNCTION ******************************************************************************************************************
//		指定のレンダリング設定・出力モジュールがリストにあるか調べます
		function  analysisRsOm( Rs , Om )
{
		Rsflag = null;
		for ( var r = 0; r < RsTempList.length; r++ )
		{
			if ( RsTempList[r] == Rs ) { Rsflag = true; }
		}
		Omflag = null;
		for ( var o = 0; o < OmTempList.length; o++ )
		{
			if ( OmTempList[o] == Om ) { Omflag = true; }
		}
		if ( Rsflag == true && Omflag == true ) { return true; }else{ RsOmflag = true; return null; }
		
		//alert("作品設定に対応したレンダリング設定・出力モジュールがありません。");
}
// **** FUNCTION ******************************************************************************************************************
//		カメラコンポジション"Flicker_filter"の設定
		function FlickerFilterSetUp()
{		
		if ( flickerFilterOptionName.selection.index == 0 ) flickerFilterFlag = true;
		if ( flickerFilterOptionName.selection.index == 1 ) flickerFilterFlag = false;
		if ( flickerFilterOptionName.selection.index != 2 )
		{
			for ( i = 1; i <= app.project.numItems; i++ )
			{
				if (app.project.item(i) instanceof CompItem)
				{
					for ( l = 1; l <= app.project.item(i).numLayers; l++ )
					{
						if ( app.project.item(i).layer(l).comment.match(/#FlickerFilter/igm) ) app.project.item(i).layer(l).enabled = flickerFilterFlag;
						
						// 蒼穹のファフナーExodus用LensFilterエフェクト強制ON処理
						if ( app.project.item(i).layer(l).comment.match(/#FlickerFilter/igm) )
						{
							if ( app.project.item(i).layer(l).name == "Lens_filter" )
							{
								var curLayer = app.project.item(i).layer(l);
								for(var e=1; e<=curLayer.property("Effects").numProperties; e++)
								{
									curLayer.property("Effects")(e).enabled = true;
								}
							}
						}
					}
				}
			}
		}
}

// **** FUNCTION ******************************************************************************************************************
//		コメント欄に「#SceneFilter」の表記があったら適用された「ブレンド」エフェクトのレイヤー選択を「02_camera」にする
		function SceneFilterSetUp()
{
		for ( i = 1; i <= app.project.numItems; i++ )
		{
			if ( app.project.item(i).name.match(/03_filter/i) && app.project.item(i) instanceof CompItem)
			{
				for ( l = 1; l <= app.project.item(i).numLayers; l++ )
				{
					if ( app.project.item(i).layer(l).comment.match(/#SceneFilter/igm))
					{
						var curLayer = app.project.item(i).layer(l);
						for(var e=1; e<=curLayer.property("Effects").numProperties; e++)
						{
							if ( curLayer.property("Effects")(e).matchName == "ADBE Blend" )
							{
								for ( L = app.project.item(i).numLayers; L >= 1 ; L-- )
								{
									if (app.project.item(i).layer(L).name.match(/02_camera/i))
									{
										curLayer.property("Effects")(e)(1).setValue(L);
										break;
									}
								}
							}
						}
					}
				}
			}
		}
}

// **** FUNCTION ******************************************************************************************************************
//「コンポジション設定」ダイアログの「高度」タブの「ネスト時またはレンダーキューでフレームレートを保持」オプション設定
//　基本全てON
//　ただし伸縮が100%以外でコメント欄に『#pFPS』と書いてあったらOFF
		function PreserveNestedFrameRate()
{
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
}

// **** FUNCTION ******************************************************************************************************************
//		CSUMiDに基づいて作業者名を更新 
		function UpdateUserName()
{
		for ( i = 1; i <= app.project.numItems; i++ )
		{
			if (app.project.item(i) instanceof CompItem)
			{
				for ( l = 1; l <= app.project.item(i).numLayers; l++ )
				{
					if ( app.project.item(i).layer(l).comment.match(/#UserName/igm) )
					{
						app.project.item(i).layer(l).locked = false;
						app.project.item(i).layer(l).name = "Over Ray Studio : " + csumiDName.charAt(0).toUpperCase() + csumiDName.slice(1,csumiDName.length).toLowerCase();
						app.project.item(i).layer(l).locked = true;
					}
				}
			}
		}
}

// **** FUNCTION RenderQueueSetUp()************************************************************************************************
//		シーケンス保存先フォルダを作成
		function CreateSaveFolder()
{
		saveCategoryFolder = new Folder(saveDirectory.fsName + "/" + saveCategory);
		if ( saveCategoryFolder.exists == false ) saveCategoryFolder.create();
		
		var savePath = saveCategoryFolder.fsName + "/"		
		
		if ( saveCategory == "_Others" )
		{
			if ( app.project.file != null ) var savePath = savePath + app.project.file.name.slice( 0 , app.project.file.name.lastIndexOf(".aep"))+"_";
		}
		saveFolder = new Folder(savePath + curItemSaveName + "_" + (Math.round(curItemList[i].timeSpanDuration*curItemList[i].comp.frameRate)));
		
		//既に保存先フォルダがあった場合の処理
		for ( x = 2; saveFolder.exists == true; x++ )
		{
			if ( x == 2 )
			{ saveFolder = new Folder(saveFolder.fsName + "v" + x); }
			else
			{ saveFolder = new Folder(saveFolder.fsName.slice( 0 , saveFolder.fsName.lastIndexOf("v")+1 ) + x); }
		}
		sfcFlag = saveFolder.create();
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