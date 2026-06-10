// CollectSolids Ver.1.04
// Copyright (c) 2007-2019 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2019/07/14
// 平面フッテージをルート直下のフォルダに集めます

var curScriptName = "CollectSolids";

// **** Main Script ***************************************************************************************************************

		app.beginUndoGroup(curScriptName);
		CollectSolids();
		app.endUndoGroup();

// **** FUNCTION ******************************************************************************************************************
//		プロジェクトの状態チェック
		function CollectSolids()
{
		var moveSolids = [];
		var removeSolids = [];
		var removeFolders = [];
		var numRemoveSolids = 0;		
		var numRemoveFolders = 0;
		
		//PSDをコンポ読み込みした時に出来るフォルダ名末尾の「 レイヤー」を削除する
		//平面フッテージを見つけてフォルダ移動するものと未使用のものを仕分ける
		for ( var i = 1; i <= app.project.numItems; i++ )
		{
			if ( app.project.item(i) instanceof CompItem )
			{
				if ( app.project.item(i).name.lastIndexOf("コンポ ") != -1 ) { app.project.item(i).name = app.project.item(i).name.replace("コンポ ","Comp_"); }
				if ( app.project.item(i).name.lastIndexOf("プリコンポジション ") != -1 ) { app.project.item(i).name = app.project.item(i).name.replace("プリコンポジション ","Pre-comp_"); }
			}
			if ( app.project.item(i) instanceof FolderItem )
			{
				if ( app.project.item(i).name.lastIndexOf(".aep") != -1 ) { app.project.item(i).name = app.project.item(i).name.split(".aep")[0]; }
				if ( app.project.item(i).name.lastIndexOf(" レイヤー") != -1 ) { app.project.item(i).name = app.project.item(i).name.split(" レイヤー")[0]; }
				if ( app.project.item(i).name.lastIndexOf("/") != -1 ) { app.project.item(i).name = app.project.item(i).name.replace("/","_"); }
				if ( app.project.item(i).name.lastIndexOf("名称未設定 ") != -1 ) { app.project.item(i).name = app.project.item(i).name.replace("名称未設定 ","Untitled_"); }
			}
			if (app.project.item(i).mainSource instanceof SolidSource )
			{
				if ( app.project.item(i).usedIn.length != 0 )
				{ moveSolids.push(app.project.item(i)); }
				else
				{ removeSolids.push(app.project.item(i)); }
			}
		}
		var numRemoveSolids = removeSolids.length;

		//ルートに「_Solids」フォルダを作成して平面フッテージを移動する、未使用の平面は捨てる
		if ( moveSolids.length > 0 || removeSolids.length > 0 )
		{
			var solidsFolder = null;
			for ( var i = 1; i <= app.project.numItems; i++ )
			{
				if ( app.project.item(i) instanceof FolderItem && app.project.item(i).parentFolder == app.project.rootFolder && app.project.item(i).name == "_Solids" )
				{
					var solidsFolder = app.project.item(i); break;
				}
			}
			if ( solidsFolder == null ){ var solidsFolder = app.project.items.addFolder("_Solids"); }
			
			for ( var i = 0; i < moveSolids.length; i++ ) { moveSolids[i].parentFolder = solidsFolder; }
			for ( var i = 0; i < removeSolids.length; i++ ) { removeSolids[i].remove(); }
		}
		
		//空のフォルダを捨てる
		//ルート直下の_bin・_sourceフォルダ内の空フォルダは捨てない
		for ( var i = app.project.numItems; i >= 1; i-- )
		{
			if (
				app.project.item(i) instanceof FolderItem
				&&
				app.project.item(i).numItems == 0
				&&
				!( app.project.item(i).parentFolder.name.toLowerCase() == "_bin" && app.project.item(i).parentFolder.parentFolder == app.project.rootFolder )
				&&
				!( app.project.item(i).parentFolder.name.toLowerCase() == "_source" && app.project.item(i).parentFolder.parentFolder == app.project.rootFolder )
			) { app.project.item(i).remove(); numRemoveFolders++ }
		}

		clearOutput();
		if ( numRemoveSolids+numRemoveFolders > 0 )
		{
			writeLn( numRemoveSolids+numRemoveFolders+" solid or folder items were removed.");
			writeLn( "You can undo if you wish.");
		}
}