// FitFootage Ver.3.0
// Copyright (c) 2007-2023 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2023/04/18
// 「_comp」フォルダ内の指定コンポをFrの縦横サイズにリサイズして、同時に選択されたフッテージを最適化して配置します。

		var curScriptName = "FitFootage";

		setCellItemList = new Array();
		setBgItemList = new Array();
		setFrItemList = new Array();
		setCompItemList = new Array();
		setOthersItemList = new Array();
		curCompItemList = new Array();
		endFlag = null;

// **** Main Script ***************************************************************************************************************
		
		ProjectCheck();
		if ( endFlag != true ) getSetItemList();
		app.beginUndoGroup(curScriptName);
		if ( endFlag != true )
		{
			reSizeComp();
			curComp = setCompItemList[0];
			scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "resetDefaultCamera.jsx" ); // デフォルトカメラの位置・目標点・ズームをリセット
			setItem();
			setCompItemList[0].selected = true;
			info();
		}
		app.endUndoGroup();

// **** FUNCTION ******************************************************************************************************************
//		プロジェクトの状態チェック
		function ProjectCheck()
{	
		if ( app.project == null ) { endFlag = true; alert ( "プロジェクトを開いて、「_comp」内のコンポジションを1つとフッテージを１つ以上選択して下さい" ); }
}

// **** FUNCTION ******************************************************************************************************************
//		アイテムの選択状態チェックとカテゴリ別リスト作成
		function getSetItemList()
{
		selectItemNum = app.project.selection.length;
		if ( selectItemNum == 0 )
		{ endFlag = true; alert ( "「_comp」内のコンポジションを1つとフッテージを１つ以上選択して下さい" ); }
		else
		{
			selectItem = app.project.selection;
			for( i = 0; i < selectItemNum; i++ )
			{
				if ( selectItem[i] instanceof FolderItem ) { selectItem[i].selected = false; continue; }
				curFolder = selectItem[i].parentFolder;
				curFolderNameList = [];
				for( x = 1; x < Number.POSITIVE_INFINITY; x++ )
				{
					if ( curFolder.name != app.project.rootFolder.name )
					{
						if ( x > 1 ) { curFolder = curFolder.parentFolder; }
						curFolderNameList.push(curFolder.name);
					}
					else { break; }
				}
				
				curFolderNameList.reverse();
				if ( curFolderNameList.length == 0 ) { setOthersItemList.push(selectItem[i]); break; }
				for( n = 0; n < curFolderNameList.length; n++ )
				{
					if ( curFolderNameList[n].match(/_cell$/) ) { setCellItemList.push(selectItem[i]); break; }
					if ( curFolderNameList[n].match(/_BG$/) ) { setBgItemList.push(selectItem[i]); break; }
					if ( curFolderNameList[n].match(/_Fr$/) ) { setFrItemList.push(selectItem[i]); break; }
					if ( curFolderNameList[n].match(/_comp$/) && selectItem[i] instanceof CompItem ) { setCompItemList.push(selectItem[i]); break; }
				}
				if ( n == curFolderNameList.length ) { setOthersItemList.push(selectItem[i]); break; }
			}
		}
		if ( endFlag != true && setCompItemList.length != 1 )
		{ endFlag = true; alert ( "「_comp」内のコンポジションを1つとフッテージを１つ以上選択して下さい" ); }
		if ( endFlag != true && setCellItemList.length+setBgItemList.length+setFrItemList.length == 0 && setCompItemList.length == 1 )
		{ endFlag = true; alert ( "フッテージを１つ以上選択して下さい" ); }
}

// **** FUNCTION ******************************************************************************************************************
//		コンポジションリサイズ
		function reSizeComp()
{
		for( i = 0; i < setFrItemList.length; i++ )
		{
			if ( i == 0 )
			{ curWidth = setFrItemList[i].width;  curHeight = setFrItemList[i].height; }
			else
			{
				befWidth = curWidth; befHeight = curHeight;
				curWidth = setFrItemList[i].width; curHeight = setFrItemList[i].height;
				if ( befWidth > curWidth ) { curWidth = befWidth; }
				if ( befHeight > curHeight ) { curHeight = befHeight; }
			}
		}
		if ( setFrItemList.length == 0 )
		{
			for( i = 0; i < setCellItemList.length; i++ )
			{
				if ( i == 0 )
				{ curWidth = setCellItemList[i].width;  curHeight = setCellItemList[i].height; }
				else
				{
					befWidth = curWidth; befHeight = curHeight;
					curWidth = setCellItemList[i].width; curHeight = setCellItemList[i].height;
					if ( befWidth > curWidth ) { curWidth = befWidth; }
					if ( befHeight > curHeight ) { curHeight = befHeight; }
				}
			}			
		}
		if ( setFrItemList.length == 0 && setCellItemList.length == 0 )
		{
			for( i = 0; i < setBgItemList.length; i++ )
			{
				if ( i == 0 )
				{ curWidth = setBgItemList[i].width;  curHeight = setBgItemList[i].height; }
				else
				{
					befWidth = curWidth; befHeight = curHeight;
					curWidth = setBgItemList[i].width; curHeight = setBgItemList[i].height;
					if ( befWidth > curWidth ) { curWidth = befWidth; }
					if ( befHeight > curHeight ) { curHeight = befHeight; }
				}
			}			
		}
		if ( setFrItemList.length == 0 && setCellItemList.length == 0 && setBgItemList.length == 0 )
		{
			for( i = 0; i < setOthersItemList.length; i++ )
			{
				if ( i == 0 )
				{ curWidth = setOthersItemList[i].width;  curHeight = setOthersItemList[i].height; }
				else
				{
					befWidth = curWidth; befHeight = curHeight;
					curWidth = setOthersItemList[i].width; curHeight = setOthersItemList[i].height;
					if ( befWidth > curWidth ) { curWidth = befWidth; }
					if ( befHeight > curHeight ) { curHeight = befHeight; }
				}
			}			
		}

		compWidth = curWidth; 
		compHeight = curHeight;

		//新規シェイプレイヤー配置
		var curALshape = setCompItemList[0].layers.addShape();
		curALshape.selected = false;
						
		//アンカーポイントへ移動
		anchorPoint = [0.5,0.5];
		curALshape.position.setValue( [ setCompItemList[0].width*anchorPoint[0] , setCompItemList[0].height*anchorPoint[1] ] )

		//シェイプレイヤーと親子付け
		var ACLn = setCompItemList[0].numLayers;
		if ( ACLn > 1 )
		{
			for( x = 2; x < ACLn+1; x++ )
			{
				var curLayer = setCompItemList[0].layer(x);
				if ( curLayer.locked == true ) { curLayer.locked = false; curLayer.selected = true; } else { curLayer.selected = false; }
				if ( curLayer.parent == null ) { curLayer.parent = curALshape; }
			}
		}
		var lockedLayer = setCompItemList[0].selectedLayers;
		
		//コンポリサイズ
		infoCompSize = "CompSize = "+setCompItemList[0].width+" * "+setCompItemList[0].height+" to "+compWidth+" * "+compHeight;
		setCompItemList[0].width = compWidth;
		setCompItemList[0].height = compHeight;
		//アンカーポイントへ移動
		curALshape.position.setValue( [ setCompItemList[0].width*anchorPoint[0] , setCompItemList[0].height*anchorPoint[1] ] )
		//シェイプレイヤーとの親子分離
		if ( ACLn > 1 )
		{
			for( x = 2; x < ACLn+1; x++ )
			{
				var curLayer = setCompItemList[0].layer(x);
				if ( curLayer.parent == setCompItemList[0].layer(1) ) curLayer.parent = null;
				for( L = 0; L <= lockedLayer.length-1; L++ ) { if ( lockedLayer[L] == curLayer ) curLayer.locked = true; }
			}
		}
		//シェイプレイヤー削除
		curALshape.remove();
}
// **** FUNCTION ******************************************************************************************************************
//		フッテージアイテムをコンポに配置
		function setItem()
{
		var HTFlag = "H";
		setCompItemList[0].time = 0;
		if ( app.project.file != null )
		{
			if ( app.project.file.name != null )
			{
				if ( app.project.file.name.split("_").length == 4 )
				{
					var n = workFormat.length;
					for ( i = 0; i <= n-1; i++ )
					{
						if ( app.project.file.name.split("_")[0] == getWF ( i ,"[ProjectTitleName]","codeName") )
						{	
							if ( app.project.file.name.split("_")[3].split(".")[0].toUpperCase() == "T" ) { var HTFlag = "T"; break; }
							if ( app.project.file.name.split("_")[3].split(".")[0].toUpperCase() == "S" ) { var HTFlag = "S"; break; }
						}
					}
				}
			}
		}
		
		//既存のレイヤー数
		var curLayerNum = setCompItemList[0].layers.length;
		
		//その他のフッテージを配置
		for( i = 0; i < setOthersItemList.length; i++ )
		{
			setCompItemList[0].layers.add( setOthersItemList[i] );
		}
		
		//BG配置
		for( i = 0; i < setBgItemList.length; i++ )
		{
			setCompItemList[0].layers.add( setBgItemList[i] );
			if ( setBgItemList[i] instanceof CompItem )
			{
				setCompItemList[0].layer(1).timeRemapEnabled = true;
				setCompItemList[0].layer(1).timeRemap.removeKey(2);
				setCompItemList[0].layer(1).timeRemap.setInterpolationTypeAtKey( 1 , KeyframeInterpolationType.HOLD , KeyframeInterpolationType.HOLD );
				setCompItemList[0].layer(1).outPoint = setCompItemList[0].duration+1
			}
		}

		if ( HTFlag == "S" || (HTFlag == "T" && setBgItemList.length == 0) )
		{
			//Fr配置
			for( i = 0; i < setFrItemList.length; i++ )
			{
				setCompItemList[0].layers.add( setFrItemList[i] );
				setCompItemList[0].layer(1).blendingMode = BlendingMode.MULTIPLY;//乗算
				setCompItemList[0].layer(1).property("ADBE Effect Parade").addProperty("ADBE Pro Levels2");
				setCompItemList[0].layer(1).property("ADBE Effect Parade")("ADBE Pro Levels2")(7).setValue(210/255);
			}
			//Cell配置
			for( i = 0; i < setCellItemList.length; i++ )
			{
				setCompItemList[0].layers.add( setCellItemList[i] );
				//複数フレーム素材にタイムリマップを適用
				//リピート設定、Fps変更がされたものはそのまま
			}
		}
		
		if ( HTFlag == "H" || (HTFlag == "T" && setBgItemList.length != 0) )
		{
			//Cell配置
			for( i = 0; i < setCellItemList.length; i++ )
			{
				setCompItemList[0].layers.add( setCellItemList[i] );
				//複数フレーム素材にタイムリマップを適用
				//リピート設定、Fps変更がされたものはそのまま
			}
			//Fr配置
			for( i = 0; i < setFrItemList.length; i++ )
			{
				setCompItemList[0].layers.add( setFrItemList[i] );
				setCompItemList[0].layer(1).opacity.setValue(50);
				setCompItemList[0].layer(1).blendingMode = BlendingMode.MULTIPLY;//乗算
			}
		}
		
		//既存のレイヤーを最上位に移動
		var newLayerNum = setCompItemList[0].layers.length;
		for ( i = newLayerNum; i > newLayerNum-curLayerNum; i-- )
		{
			var curLayer = setCompItemList[0].layers[newLayerNum];
			if ( curLayer.locked == true )
			{ curLayer.locked = false; curLayer.moveToBeginning(); curLayer.locked = true; }
			else
			{ curLayer.moveToBeginning(); }
		}
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
//		情報パネル表示
		function info()
{
		clearOutput();
		writeLn( "FitFootage Info" );
		writeLn( infoCompSize );
		writeLn("Bg : cell : Fr = "+setBgItemList.length+" : "+setCellItemList.length+" : "+setFrItemList.length);
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