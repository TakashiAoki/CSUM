// ============================================
// Script Name : EaseLink
// Version     : v3.4
// 仕様        : 選択プロパティのキー補間をスライダ制御(0〜100)に同期。#EaseLinkタグ・複数スライダ・コンポまたぎリンク対応
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki
// LastUpdate  : 2026-06-16
// ============================================

var curScriptName = "EaseLink";

// **** Main Script ***************************************************************************************************************
var selectPropertyList = new Array();
scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedProperty.jsx" );

if ( selectPropertyList.length > 0 )
{
	scriptExecute( myCSUMCCToolsFolder.fsName + "/" + "getSelectedLayer.jsx" );

	// 旧(Tools)環境でも単独動作するよう activeComp を再取得（旧getSelectedLayerは未定義→他ツールの無効グローバルを掴む事故を防ぐ）
	activeComp = ( app.project.activeItem instanceof CompItem ) ? app.project.activeItem : null;
	activeCompName = ( activeComp != null ) ? activeComp.name : "";

	var sliderList = getProjectSliderList();
	var selectIndex = showSliderDialog( sliderList );
	if ( selectIndex != null )
	{
		app.beginUndoGroup( curScriptName );
		var targetSlider = ( selectIndex == 0 ) ? createEaseLinkSlider() : sliderList[selectIndex - 1];
		if ( targetSlider != null ) setEaseLink( targetSlider );
		app.endUndoGroup();
	}
}

// **** FUNCTION ******************************************************************************************************************
//		プロジェクト内の#EaseLinkタグレイヤーからスライダ制御エフェクトを収集
		function getProjectSliderList()
{
		var resultList = new Array();
		for ( var i = 1; i <= app.project.numItems; i++ )
		{
			var curItem = app.project.item( i );
			if ( !( curItem instanceof CompItem ) ) continue;
			for ( var n = 1; n <= curItem.numLayers; n++ )
			{
				var curLayer = curItem.layer( n );
				if ( curLayer.comment != "#EaseLink" ) continue;
				var curEffectParade = curLayer.property( "ADBE Effect Parade" );
				for ( var p = 1; p <= curEffectParade.numProperties; p++ )
				{
					if ( curEffectParade.property( p ).matchName == "ADBE Slider Control" )
					{
						resultList.push( { comp: curItem, layer: curLayer, fxIndex: p, fxName: curEffectParade.property( p ).name } );
					}
				}
			}
		}
		return resultList;
}
// **** FUNCTION ******************************************************************************************************************
//		リンク先スライダ選択ダイアログ（戻り値: 0=新規作成 / 1〜=sliderList[n-1] / null=キャンセル）
		function showSliderDialog( sliderList )
{
		if ( $.global.EaseLinkTestSelection != undefined ) return $.global.EaseLinkTestSelection;// テスト用フック（ダイアログ省略）

		var win = new Window( "dialog", curScriptName + " - Select Slider to Link" );
		win.orientation = "column";
		win.alignChildren = "fill";

		var listBox = win.add( "listbox", undefined, [], { numberOfColumns: 3, showHeaders: true, columnTitles: ["Comp", "Layer", "Slider"], columnWidths: [180, 140, 120] } );
		var rowHeight = 24;//リスト行の概算高さ(px)
		var headerHeight = 38;//列ヘッダー＋枠の概算高さ(px)
		var rowCount = Math.min( Math.max( sliderList.length + 1, 3 ), 16 );// 最低3行確保・16行超はスクロール
		listBox.preferredSize = [460, headerHeight + rowHeight * rowCount];// 候補数に応じて縦可変

		var newItem = listBox.add( "item", activeCompName );
		newItem.subItems[0].text = "-";
		newItem.subItems[1].text = "[ Create New Slider ]";
		for ( var i = 0; i < sliderList.length; i++ )
		{
			var curItem = listBox.add( "item", sliderList[i].comp.name );
			curItem.subItems[0].text = sliderList[i].layer.name;
			curItem.subItems[1].text = sliderList[i].fxName;
		}
		listBox.selection = 0;
		listBox.onDoubleClick = function() { win.close( 1 ); };

		var btnGroup = win.add( "group" );
		btnGroup.alignment = "right";
		btnGroup.add( "button", undefined, "Cancel", { name: "cancel" } );
		btnGroup.add( "button", undefined, "OK", { name: "ok" } );

		win.onShow = function() { loadWindowLocation( "elDlg", win ); };
		win.onMove = function() { saveWindowLocation( "elDlg", win ); };

		if ( win.show() == 1 && listBox.selection != null ) { return listBox.selection.index; }
		return null;
}
// **** FUNCTION ******************************************************************************************************************
//		ダイアログ表示位置の復元（保存値が無ければセンタリング。CSUMダイアログ共通の仕組み）
		function loadWindowLocation( windowName, win )
{
		var sectionName = "CSUMCC " + curScriptName;
		var sectionKey = windowName + " Window Location";
		if ( app.settings.haveSetting( sectionName, sectionKey ) )
		{
			var curLocation = app.settings.getSetting( sectionName, sectionKey ).split( "," );
			win.location = [ Number( curLocation[0] ), Number( curLocation[1] ) ];
		}
		else { win.center(); }
}
// **** FUNCTION ******************************************************************************************************************
//		ダイアログ表示位置の保存
		function saveWindowLocation( windowName, win )
{
		var sectionName = "CSUMCC " + curScriptName;
		var sectionKey = windowName + " Window Location";
		app.settings.saveSetting( sectionName, sectionKey, win.location[0] + "," + win.location[1] );
}
// **** FUNCTION ******************************************************************************************************************
//		アクティブコンポの#EaseLinkタグレイヤーに新規スライダを追加（タグレイヤーが無ければ作成）
		function createEaseLinkSlider()
{
		var ctrlLayer = null;
		for ( var n = 1; n <= activeComp.numLayers; n++ )
		{
			if ( activeComp.layer( n ).comment == "#EaseLink" ) { ctrlLayer = activeComp.layer( n ); break; }// 複数あっても先頭のみ使用（#EaseLinkタグは各コンポ1つ運用）
		}
		if ( ctrlLayer == null )
		{
			ctrlLayer = activeComp.layers.addShape();
			ctrlLayer.name = "EaseLink_ctrl";
			ctrlLayer.comment = "#EaseLink";
			ctrlLayer.position.expression = "[0,0]";
		}
		ensureEaseLinkMarker( ctrlLayer );

		//既存の EaseLink_NN 連番の最大値を取得
		var maxNum = 0;
		var curEffectParade = ctrlLayer.property( "ADBE Effect Parade" );
		for ( var p = 1; p <= curEffectParade.numProperties; p++ )
		{
			var curMatch = curEffectParade.property( p ).name.match( /^EaseLink_(\d+)$/ );
			if ( curMatch != null && Number( curMatch[1] ) > maxNum ) maxNum = Number( curMatch[1] );
		}

		var curFx = curEffectParade.addProperty( "ADBE Slider Control" );
		curFx.name = "EaseLink_" + ( "0" + ( maxNum + 1 ) ).slice( -2 );
		curFx( "ADBE Slider Control-0001" ).setValueAtTime( 0, 0 );//Slider
		curFx( "ADBE Slider Control-0001" ).setValueAtTime( activeComp.duration - activeComp.frameDuration, 100 );

		return { comp: activeComp, layer: ctrlLayer, fxIndex: curFx.propertyIndex, fxName: curFx.name };
}
// **** FUNCTION ******************************************************************************************************************
//		タグレイヤーに#EaseLinkマーカーを保証（エクスプレッションはレイヤーコメントを読めないためマーカーコメントで検出する）
		function ensureEaseLinkMarker( ctrlLayer )
{
		var curMarker = ctrlLayer.property( "ADBE Marker" );
		for ( var k = 1; k <= curMarker.numKeys; k++ )
		{
			if ( curMarker.keyValue( k ).comment == "#EaseLink" ) return;
		}
		curMarker.setValueAtTime( 0, new MarkerValue( "#EaseLink" ) );
}
// **** FUNCTION ******************************************************************************************************************
//		EaseLink適用（選択プロパティにエクスプレッション設定）
		function setEaseLink( targetSlider )
{
		ensureEaseLinkMarker( targetSlider.layer );// 旧版作成レイヤーへの自己修復
		var CR = String.fromCharCode( 13 );//改行コード
		var compRef = ( targetSlider.comp == activeComp ) ? "thisComp" : "comp(\"" + targetSlider.comp.name.replace( /"/g, "\\\"" ) + "\")";
		var expEaseLink =
		"// " + curScriptName + " > " + targetSlider.comp.name + " / " + targetSlider.fxName +CR+
		"var elCtrl = null;" +CR+
		"for ( var i = 1; i <= " + compRef + ".numLayers; i++ )" +CR+
		"{" +CR+
		"	var mk = " + compRef + ".layer(i).marker;" +CR+
		"	for ( var k = 1; k <= mk.numKeys; k++ )" +CR+
		"	{" +CR+
		"		if ( mk.key(k).comment == \"#EaseLink\" ) { elCtrl = " + compRef + ".layer(i); break; }" +CR+
		"	}" +CR+
		"	if ( elCtrl != null ) break;" +CR+
		"}" +CR+
		"if ( elCtrl != null && numKeys > 1 )" +CR+
		"{" +CR+
		"	var El = elCtrl.effect(" + targetSlider.fxIndex + ")(1);" +CR+
		"	var St = thisProperty.key( 1 ).time;" +CR+
		"	var Et = thisProperty.key( numKeys ).time;" +CR+
		"	thisProperty.valueAtTime( El/100*(Et-St)+St );" +CR+
		"}" +CR+
		"else" +CR+
		"{ thisProperty; }";

		for ( var i = 0; i < selectPropertyList.length; i++ )
		{
			var curLayer = selectPropertyList[i].propertyGroup( selectPropertyList[i].propertyDepth );
			var curPropertyName = selectPropertyList[i].name;
			if ( selectPropertyList[i].propertyType != PropertyType.PROPERTY ) continue;
			if ( curLayer.comment == "#EaseLink" ) continue;// 制御レイヤー自身には適用しない

			//キーフレームが2個以上無い場合はスキップ
			if ( selectPropertyList[i].numKeys < 2 )
			{
				alert
				(
					"2 or more keyframes are required." +CR+
					"Comp : '" + activeCompName + "'" +CR+
					"Layer : " + curLayer.index + " ('" + curLayer.name + "')" +CR+
					"Property : '" + curPropertyName + "'"
				);
				continue;
			}

			if ( selectPropertyList[i].expressionEnabled != true )
			{
				selectPropertyList[i].expression = expEaseLink;
			}
		}
}
// **** FUNCTION ******************************************************************************************************************
//		スクリプトファイルの実行
		function scriptExecute( scriptFilePath )
{
		var scriptFileName = new File( scriptFilePath );
		scriptFileName.open();
		eval( scriptFileName.read() );
		scriptFileName.close();
}
